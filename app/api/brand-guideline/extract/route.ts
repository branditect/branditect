import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SCHEMA = {
  meta: { name: 'string', tagline: 'string' },
  logos: {
    variants: [{ bg: '#hex', tc: '#hex', dotC: 'string', label: 'string' }],
    restrictions: ['string'],
  },
  typography: {
    scale: [{ role: 'string', size: 'string', wt: 'string', tr: 'string', usage: 'string', sample: 'string' }],
    dos: ['string'],
    donts: ['string'],
  },
  colors: {
    palette: [{ name: 'string', hex: '#hex', role: 'string', aa: true, aaa: false }],
    rules: [{ label: 'string', dots: ['#hex'], rule: 'string' }],
  },
  imgstyle: {
    philosophy: 'string',
    approved: ['string'],
    prohibited: ['string'],
  },
  packages: {
    items: [{ name: 'string', desc: 'string', icon: 'string', includes: ['string'], size: 'string' }],
  },
}

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json() as {
      images: { data: string; type: string }[]
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ success: false, error: 'No images provided' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            ...images.map((img) => ({
              type: 'image' as const,
              source: {
                type: 'base64' as const,
                media_type: img.type as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
                data: img.data,
              },
            })),
            {
              type: 'text' as const,
              text: `Analyze these brand guideline pages and extract all brand data. Return ONLY a valid JSON object matching this exact schema (no markdown, no explanation, no code blocks): ${JSON.stringify(SCHEMA)}. Fill every field accurately. For hex colors: extract exact values shown. For rules: write in the brand's voice. If data is not visible, use sensible placeholder values.`,
            },
          ],
        },
      ],
    })

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as Anthropic.TextBlock).text)
      .join('')

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
    console.error('[brand-guideline/extract]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Extract failed' },
      { status: 500 }
    )
  }
}
