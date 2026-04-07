import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SCHEMA = {
  meta: {
    name: 'Brand name',
    tagline: 'Brand tagline or positioning line',
    darkColor: '#hex — the primary dark brand color (used for backgrounds or main headers)',
    accentColor: '#hex — the primary action/accent color (CTAs, interactive elements)',
    lightColor: '#hex — the primary light background color',
  },
  logos: {
    intro: 'EXTRACT VERBATIM: the full paragraph(s) from the guideline that introduce and describe the logo — its meaning, history, what it communicates. 3-5 sentences minimum.',
    wordmarkNote: 'EXTRACT: text about when to use the wordmark vs the logomark/symbol',
    clearspace: 'EXTRACT: the exact clearspace rule described in the guideline',
    minimumSize: 'EXTRACT: the minimum reproduction size rule',
    restrictions: ['EXTRACT: 5 specific prohibited use rules exactly as written in the guideline'],
  },
  typography: {
    intro: 'EXTRACT VERBATIM: the paragraph introducing the typography system — what it communicates, why these choices were made. 2-4 sentences.',
    displayFont: 'Primary typeface name (just the font family name, e.g. "Neue Haas Grotesk" or "DM Sans")',
    bodyFont: 'Body typeface if different from display',
    scale: [
      { role: 'Display', size: 'e.g. 64px', wt: 'e.g. 300', tr: 'e.g. −0.03em', usage: 'e.g. Campaign heroes', sample: 'A short sample phrase from the guideline or fitting the brand' },
    ],
    dos: ['3 things to do with typography'],
    donts: ['3 things never to do with typography'],
  },
  colors: {
    intro: 'EXTRACT VERBATIM: the paragraph describing the color system — what the colors mean, how they work together, what they communicate. 3-5 sentences.',
    palette: [
      { name: 'Color name', hex: '#hexcode', role: 'How to use this color', aa: true, aaa: false },
    ],
    secondary: [
      { name: 'Color name', hex: '#hexcode', role: 'Secondary usage description' },
    ],
    rules: [
      { label: 'Usage case', dots: ['#hex1', '#hex2'], rule: 'When and how to use this combination' },
    ],
  },
  imgstyle: {
    intro: 'EXTRACT VERBATIM: the full paragraph(s) introducing the photography/imagery approach. 3-5 sentences minimum.',
    approved: ['EXTRACT: 5 specific approved photography rules as written'],
    prohibited: ['EXTRACT: 5 specific prohibited imagery rules as written'],
  },
  buttons: {
    cornerRadius: 6,
    note: 'EXTRACT or infer: description of button style philosophy from the guideline',
  },
  graphics: {
    note: 'EXTRACT: description of graphic elements, patterns or decorative language from the guideline',
  },
  packaging: {
    note: 'EXTRACT: description of packaging or product label approach from the guideline',
  },
  social: {
    note: 'EXTRACT: description of social media visual approach from the guideline',
  },
}

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json() as { images: { data: string; type: string }[] }

    if (!images || images.length === 0) {
      return NextResponse.json({ success: false, error: 'No images provided' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: [
            ...images.map(img => ({
              type: 'image' as const,
              source: {
                type: 'base64' as const,
                media_type: img.type as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
                data: img.data,
              },
            })),
            {
              type: 'text' as const,
              text: `You are reading a brand guideline document. Extract ALL content in maximum depth.

CRITICAL INSTRUCTIONS:
1. For "intro" fields: Extract the ACTUAL TEXT from the guideline verbatim or very close to it. Do not summarize. Do not shorten. Copy the real paragraph(s) that describe each section. If you cannot find the exact text, write a rich, brand-appropriate paragraph in the brand's voice.
2. For colors: Extract EXACT hex codes from the color swatches you see. Look for color specification pages or swatches.
3. For darkColor/accentColor/lightColor in meta: These power the entire UI theme. darkColor = the darkest primary brand color. accentColor = the action/CTA color. lightColor = the lightest background color.
4. For font names: Identify exactly what typeface is shown and named.
5. For rules: Copy the exact language used in the guideline.

Return ONLY a valid JSON object matching this schema (no markdown, no code blocks, no explanation):
${JSON.stringify(SCHEMA, null, 2)}`,
            },
          ],
        },
      ],
    })

    const text = response.content
      .filter(c => c.type === 'text')
      .map(c => (c as Anthropic.TextBlock).text)
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
