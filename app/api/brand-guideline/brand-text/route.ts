import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alzqwhkkntfritasizzx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await req.json() as { brandId: string }

    if (!brandId) {
      return NextResponse.json({ success: false, error: 'Missing brandId' }, { status: 400 })
    }

    const [strategyRes, visualDnaRes] = await Promise.all([
      supabase.from('brand_strategies').select('*').eq('brand_id', brandId).maybeSingle(),
      supabase.from('brand_visual_dna').select('*').eq('brand_id', brandId).maybeSingle(),
    ])

    const strategy = strategyRes.data
    const visualDna = visualDnaRes.data

    if (!strategy && !visualDna) {
      return NextResponse.json({ success: true, data: null })
    }

    const contextParts: string[] = []
    if (strategy) contextParts.push(`Brand Strategy:\n${JSON.stringify(strategy, null, 2)}`)
    if (visualDna) contextParts.push(`Brand Visual DNA:\n${JSON.stringify(visualDna, null, 2)}`)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Based on this brand data, write rich editorial copy for each brand guideline section. Return ONLY a valid JSON object with these exact keys (no markdown, no explanation):

{
  "tagline": "Brand tagline or positioning line (1 sentence)",
  "logoPhilosophy": "Full paragraph introducing the logo — its meaning, what it communicates, how it should be used. 3-5 sentences.",
  "logoWordmarkNote": "One sentence on when to use the wordmark vs the symbol alone.",
  "logoClearspace": "One sentence on clearspace rule.",
  "typographyIntro": "Full paragraph on the typography system — choices, rationale, what it communicates. 2-4 sentences.",
  "colorsIntro": "Full paragraph on the color palette — what each color means, how they work together. 3-5 sentences.",
  "colorPrimaryUsage": "One sentence on primary color usage combination.",
  "colorSecondaryUsage": "One sentence on dark mode / secondary color combination.",
  "colorNeverCombine": "One sentence on which colors should never be paired.",
  "imageStylePhilosophy": "Full paragraph on photography approach — real environments, authentic moments, what to look for. 3-5 sentences.",
  "imageStyleApproved": ["5 specific approved photography directions"],
  "imageStyleProhibited": ["5 specific prohibited imagery types"],
  "buttonStyleNote": "One sentence on button design philosophy — corner radius, style, feel.",
  "graphicsNote": "One sentence on graphic/decorative language of the brand.",
  "packagingNote": "One sentence on packaging approach.",
  "socialNote": "One paragraph on social media visual presence and approach. 2-3 sentences."
}

Brand data:
${contextParts.join('\n\n')}`,
        },
      ],
    })

    const text = response.content.filter(c => c.type === 'text').map(c => (c as Anthropic.TextBlock).text).join('')
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()

    try {
      return NextResponse.json({ success: true, data: JSON.parse(clean) })
    } catch {
      const match = clean.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          return NextResponse.json({ success: true, data: JSON.parse(match[0]) })
        } catch { /* fall through */ }
      }
      return NextResponse.json({ success: false, error: 'Could not parse response' }, { status: 422 })
    }
  } catch (err) {
    console.error('[brand-text]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 }
    )
  }
}
