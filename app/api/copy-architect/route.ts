import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { COPY_CONFIG } from '@/lib/copy-architect-config'
import { buildBrandContext } from '@/lib/brandContext'

export const maxDuration = 30

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

async function getBrandName(brandId: string): Promise<string> {
  const { data } = await supabase
    .from('brands')
    .select('brand_name')
    .eq('brand_id', brandId)
    .maybeSingle()
  return data?.brand_name || 'Your Brand'
}

function buildSystemPrompt(
  deliverable: string,
  brandName: string,
  fullBrandContext: string
): string {
  return `You are the Copy Architect for ${brandName} — an expert brand copywriter who knows this brand inside out.

Before writing anything, you have been given four sources of brand truth:
- BRAND STRATEGY: the positioning, audience, mission, and messaging pillars
- BRAND TONE OF VOICE: the personality, language style, and communication rules
- PRODUCTS & SERVICES CATALOGUE: every product and service with real names, features, and pricing
- BRAND KNOWLEDGE VAULT: additional documents, presentations, and company information

STRICT RULES:
1. Only use product names, features, prices, and facts that appear in the four sources below. Never invent or assume details.
2. Write in the exact tone of voice described. Match the personality, sentence style, vocabulary, and energy of the brand — do not default to generic marketing language.
3. When writing about a specific product, pull all available details from the Products & Services Catalogue and Knowledge Vault first. Use real feature names, real prices, and real positioning — not placeholders.
4. If a user asks you to write about a product or topic that does not appear in any of the four sources, respond with: "I don't have enough information about this in the brand vault. Please upload a document with the product details and I will write from that."
5. Never use placeholder text like [insert feature here] or [price]. If you don't have the information, say so.

When writing a newsletter, email, social post, ad, or any other copy format:
- Open by identifying the relevant product or topic in the catalogue
- Apply the brand's tone of voice throughout — not just in the headline
- Check the brand strategy for any relevant messaging pillars or audience notes
- Check the knowledge vault for any supporting facts, stats, or context
- Deliver complete, ready-to-use copy — not a draft or skeleton

ANTI-AI RULES:
- Never sound like AI. No filler phrases like "In today's fast-paced world" or "Are you ready to".
- No em-dash abuse. No list-of-three clichés. No "Whether you're X or Y" constructions.
- Every sentence must earn its spot. If it sounds like it could be in any brand's copy, rewrite it.
- Write like a human who knows this brand deeply, not a model producing "content".

OUTPUT FORMAT — You MUST return valid JSON only. No markdown, no backticks, no prose outside the JSON.

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
  "qualityChecks": ["List of 3-4 checks confirming brand alignment"],
  "placeholders": ["Any placeholder tokens used, e.g. '[LINK]', '[NAME]'"],
  "toneMatch": "One sentence confirming how the copy matches the brand tone"
}

DELIVERABLE: ${deliverable}

IMPORTANT: Complete the entire JSON response including all closing braces. Do not stop mid-output.

--- BRAND CONTEXT BELOW ---

${fullBrandContext || `Brand: ${brandName}\n(No additional brand data has been added to the vault yet.)`}`
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

    // Fetch brand name and full vault context in parallel
    const [brandName, fullBrandContext] = brand_id && brand_id !== 'default'
      ? await Promise.all([getBrandName(brand_id), buildBrandContext(brand_id)])
      : ['Your Brand', '']

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
      system: buildSystemPrompt(subConfig.deliverable, brandName, fullBrandContext),
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
