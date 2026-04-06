import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { COPY_CONFIG } from '@/lib/copy-architect-config'

export const maxDuration = 30

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const VETRA_BRAND = {
  name: "Vetra Mobile",
  positioning: "The only phone carrier that turns your monthly bill into creator support.",
  audience: "Gen Z and millennials aged 18-32. Twitch viewers. Anti-corporate. Creator-economy believers.",
  tone: ["Direct", "Irreverent", "Insider", "Anti-corporate"],
  toneDescription: "Sounds like the smartest person in the Discord. Confident, a little edgy, never corporate. Short sentences. No fluff.",
  avoid: ["seamless", "powerful", "innovative", "cutting-edge", "game-changer", "excited to announce", "unlock your potential", "leverage", "dive into", "robust"],
  businessPulse: "StreamerX partnership launching April 5. Plans from \u20AC9/month, no contracts.",
  tagline: "Always on. Never behind."
}

function buildSystemPrompt(deliverable: string): string {
  return `You are a senior copywriter embedded in the brand team for ${VETRA_BRAND.name}.

## BRAND CONTEXT
- Brand: ${VETRA_BRAND.name}
- Positioning: ${VETRA_BRAND.positioning}
- Audience: ${VETRA_BRAND.audience}
- Tone: ${VETRA_BRAND.tone.join(', ')}
- Voice description: ${VETRA_BRAND.toneDescription}
- Tagline: ${VETRA_BRAND.tagline}
- Business pulse: ${VETRA_BRAND.businessPulse}

## WORDS TO NEVER USE
${VETRA_BRAND.avoid.map(w => `- "${w}"`).join('\n')}

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
  "qualityChecks": ["List of 3-4 checks confirming brand alignment, e.g. 'No banned words used', 'Tone matches irreverent + direct'"],
  "placeholders": ["Any placeholder tokens used, e.g. '[LINK]', '[CREATOR_NAME]'"],
  "toneMatch": "One sentence confirming how the copy matches the brand tone"
}

## DELIVERABLE
${deliverable}

IMPORTANT: Complete the entire JSON response including all closing braces. Do not stop mid-output.`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, subType, fields } = body as {
      category: string
      subType: string
      fields: Record<string, string>
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
      system: buildSystemPrompt(subConfig.deliverable),
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
