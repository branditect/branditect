import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
    if (strategy) {
      contextParts.push(`Brand Strategy:\n${JSON.stringify(strategy, null, 2)}`)
    }
    if (visualDna) {
      contextParts.push(`Brand Visual DNA:\n${JSON.stringify(visualDna, null, 2)}`)
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Based on this brand data, extract and synthesize concise copy for each brand guideline section. Return ONLY a valid JSON object with these exact keys (no markdown, no explanation):

{
  "logoDescription": "One paragraph on logo usage philosophy",
  "typographyIntro": "One paragraph on typography philosophy",
  "colorPhilosophy": "One paragraph on color palette rationale",
  "imageryPhilosophy": "One paragraph on image style and photography direction",
  "buttonPhilosophy": "One sentence on button/UI component style",
  "graphicElementsIntro": "One paragraph on graphic language and visual motifs",
  "iconsIntro": "One sentence on icon style",
  "packagingIntro": "One paragraph on packaging design approach",
  "socialIntro": "One paragraph on social media visual presence"
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
