import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const { message, pageUrls } = await req.json()

  if (!message) {
    return NextResponse.json({ error: 'Missing message' }, { status: 400 })
  }

  const contentBlocks: Anthropic.MessageCreateParams['messages'][0]['content'] = []

  // Send up to 8 pages as images for context
  if (pageUrls && pageUrls.length > 0) {
    for (const url of pageUrls.slice(0, 8)) {
      contentBlocks.push({
        type: 'image',
        source: { type: 'url', url }
      })
    }
  }

  contentBlocks.push({
    type: 'text',
    text: pageUrls && pageUrls.length > 0
      ? `The images above are pages from a brand guideline. Answer this question based on what you see: "${message}"\n\nBe specific and practical. Extract exact hex codes, font names, or rules where visible.`
      : message
  })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 700,
      messages: [{ role: 'user', content: contentBlocks }]
    })

    const reply = response.content
      .map(c => c.type === 'text' ? c.text : '')
      .join('')
      .trim()

    return NextResponse.json({ reply })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'API error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
