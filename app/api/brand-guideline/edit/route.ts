import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      sectionLabel: string
      currentData: unknown
      instruction: string
      imageBase64: string | null
      imageType: string | null
      brandName: string
      brandTagline: string
    }
    const { sectionLabel, currentData, instruction, imageBase64, imageType, brandName, brandTagline } = body

    const content: Anthropic.MessageParam['content'] = []

    if (imageBase64) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: (imageType || 'image/png') as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
          data: imageBase64,
        },
      } as Anthropic.ImageBlockParam)
    }

    content.push({
      type: 'text',
      text: `You are updating the "${sectionLabel}" section of a brand guideline for "${brandName} — ${brandTagline}".

Current section data (JSON): ${JSON.stringify(currentData)}

User instruction: "${instruction || 'Update based on the reference image'}"
${imageBase64 ? 'A reference image has been uploaded — use it to inform the changes.' : ''}

Return ONLY a valid JSON object with the updated fields for this section, using the exact same structure as the current data. No explanation, no markdown, no code blocks.`,
    })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content }],
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
    console.error('[brand-guideline/edit]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Edit failed' },
      { status: 500 }
    )
  }
}
