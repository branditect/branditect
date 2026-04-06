import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { COPY_CONFIG } from '@/lib/copy-architect-config'
import { buildBrandContext, STRICT_GENERATION_RULE } from '@/lib/brandContext'

export const maxDuration = 30

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface ToneRow {
  expression_label: string | null
  expression_text: string | null
  pillars: Array<{ name: string; description?: string }> | null
  dos: string[] | null
  donts: string[] | null
  vocab_yes: string[] | null
  vocab_no: string[] | null
}

async function getBrandContext(brandId: string): Promise<{ brandName: string; tone: ToneRow | null }> {
  const [brandResult, toneResult] = await Promise.all([
    supabase.from('brands').select('brand_name').eq('brand_id', brandId).maybeSingle(),
    supabase.from('brand_tone').select('expression_label, expression_text, pillars, dos, donts, vocab_yes, vocab_no').eq('brand_id', brandId).maybeSingle(),
  ])

  const brandName = brandResult.data?.brand_name || 'Your Brand'
  return { brandName, tone: toneResult.data as ToneRow | null }
}

function buildSystemPrompt(
  deliverable: string,
  brandName: string,
  tone: ToneRow | null,
  fullBrandContext: string
): string {
  const toneLines: string[] = []
  if (tone?.expression_label) toneLines.push(`- Brand Voice: ${tone.expression_label}`)
  if (tone?.expression_text) toneLines.push(`- Voice Description: ${tone.expression_text}`)
  if (tone?.pillars?.length) toneLines.push(`- Tone Pillars: ${tone.pillars.map(p => p.name).join(', ')}`)
  if (tone?.dos?.length) toneLines.push(`- DO: ${tone.dos.slice(0, 5).join('; ')}`)
  if (tone?.donts?.length) toneLines.push(`- DON'T: ${tone.donts.slice(0, 5).join('; ')}`)
  if (tone?.vocab_yes?.length) toneLines.push(`- Preferred vocabulary: ${tone.vocab_yes.slice(0, 10).join(', ')}`)
  if (tone?.vocab_no?.length) toneLines.push(`- Words to avoid: ${tone.vocab_no.slice(0, 10).join(', ')}`)

  const toneSection = toneLines.length > 0
    ? toneLines.join('\n')
    : '- Write in a professional, on-brand voice consistent with the brand name.'

  const brandDataSection = fullBrandContext
    ? `\n## BRAND DATA\n${fullBrandContext}\n`
    : `\n## BRAND CONTEXT\n- Brand: ${brandName}\n${toneSection}\n`

  return `${STRICT_GENERATION_RULE}
${brandDataSection}
You are a senior copywriter embedded in the brand team for ${brandName}.

## ANTI-AI RULES
- Never sound like AI. No filler phrases like "In today's fast-paced world" or "Are you ready to".
- No em-dash abuse. No list-of-three cliches. No "Whether you're X or Y" constructions.
- Every sentence must earn its spot. If it sounds like it could be in any brand's copy, rewrite it.
- Write like a human who knows this brand deeply, not a model producing "content".

## OUTPUT FORMAT
You MUST return valid JSON only. No markdown, no backticks, no prose outside the JSON.

Return this exact structure:
{
  "sections": [
    {
      "label": "Section name (e.g. 'Full Caption', 'Subject Lines', 'Hook Alternatives')",
      "options": [
        {
          "id": "unique-id",
          "type": "primary | alternative | variant",
          "text": "The actual copy text",
          "rationale": "One sentence explaining why this works"
        }
      ]
    }
  ],
  "qualityChecks": ["List of 3-4 checks confirming brand alignment, e.g. 'No banned words used', 'Tone matches brand voice'"],
  "placeholders": ["Any placeholder tokens used, e.g. '[LINK]', '[NAME]'"],
  "toneMatch": "One sentence confirming how the copy matches the brand tone"
}

## DELIVERABLE
${deliverable}

IMPORTANT: Complete the entire JSON response including all closing braces. Do not stop mid-output.`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, subType, fields, brand_id } = body as {
      category: string
      subType: string
      fields: Record<string, string>
      brand_id?: string
    }

    if (!category || !subType) {
      return NextResponse.json({ error: 'Category and subType are required' }, { status: 400 })
    }

    const catConfig = COPY_CONFIG[category]
    if (!catConfig) {
      return NextResponse.json({ error: `Unknown category: ${category}` }, { status: 400 })
    }

    const subConfig = catConfig.subs[subType]
    if (!subConfig) {
      return NextResponse.json({ error: `Unknown subType: ${subType}` }, { status: 400 })
    }

    // Check required fields
    const missingFields = subConfig.fields
      .filter(f => f.req && (!fields[f.id] || !fields[f.id].trim()))
      .map(f => f.label)

    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(', ')}` }, { status: 400 })
    }

    // Fetch brand context (tone/name) and full vault context in parallel
    const [{ brandName, tone }, fullBrandContext] = brand_id && brand_id !== 'default'
      ? await Promise.all([getBrandContext(brand_id), buildBrandContext(brand_id)])
      : [{ brandName: 'Your Brand', tone: null }, '']

    // Build user prompt from field values
    const fieldLines = subConfig.fields
      .filter(f => fields[f.id]?.trim())
      .map(f => `${f.label}: ${fields[f.id].trim()}`)
      .join('\n')

    const userPrompt = `Create: ${subConfig.title}

${fieldLines}

Write the copy now. Return only the JSON.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: buildSystemPrompt(subConfig.deliverable, brandName, tone, fullBrandContext),
      messages: [
        { role: 'user', content: userPrompt },
      ],
    })

    const rawText = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as Anthropic.TextBlock).text)
      .join('')

    // Robust JSON parsing — strip code fences, find JSON object
    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()

    let parsed = null

    // Strategy 1: Direct parse
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // Strategy 2: Find JSON object in text
      const jsonMatch = cleaned.match(/\{[\s\S]*"sections"\s*:\s*\[[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0])
        } catch {
          /* continue */
        }
      }
    }

    // Strategy 3: Find from first { to last }
    if (!parsed) {
      const firstBrace = cleaned.indexOf('{')
      const lastBrace = cleaned.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1))
        } catch {
          /* continue */
        }
      }
    }

    if (!parsed) {
      console.error('[copy-architect] Could not parse:', cleaned.slice(0, 500))
      return NextResponse.json({ error: `Failed to parse AI response. Raw start: ${cleaned.slice(0, 200)}` }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[copy-architect] Error:', err)
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
