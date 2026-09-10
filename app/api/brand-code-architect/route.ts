import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { cachedSystem, logCacheUsage } from '@/lib/prompt-cache'
import { CODE_ARCHITECT_STABLE } from '@/lib/prompts'

export const maxDuration = 60

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { images, featureDescription, existingCode } = body as {
      images: { base64: string; mediaType: string }[]
      featureDescription: string
      existingCode?: string
    }

    if (!featureDescription?.trim()) {
      return NextResponse.json({ error: 'Feature description is required' }, { status: 400 })
    }
    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'At least one screenshot is required' }, { status: 400 })
    }

    const imageContent: Anthropic.ImageBlockParam[] = images.map((img) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: img.base64,
      },
    }))

    const userPrompt = `Here are ${images.length} screenshot(s) of an existing app/website. Analyse the visual design system from these screenshots.

New feature to build: ${featureDescription}${existingCode ? `\n\nExisting code/tokens to reference:\n${existingCode}` : ''}

Extract the design system and generate a complete, self-contained HTML file that matches the visual style exactly. Return only valid JSON as specified.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + text together — these calls would
      // truncate. None of them need reasoning tokens.
      thinking: { type: 'disabled' },
      max_tokens: 16000,
      system: cachedSystem(CODE_ARCHITECT_STABLE),
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: userPrompt },
          ],
        },
      ],
    })

    logCacheUsage('brand-code-architect', response.usage)

    const rawText = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as Anthropic.TextBlock).text)
      .join('')

    // Try multiple parsing strategies
    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()

    let parsed: { designSystem: unknown; html: string } | null = null

    // Strategy 1: Direct JSON parse
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // Strategy 2: Find JSON object in text
      const jsonMatch = cleaned.match(/\{[\s\S]*"html"\s*:\s*"[\s\S]*\}/)
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]) } catch { /* continue */ }
      }
    }

    // Strategy 3: Extract HTML directly from response
    if (!parsed) {
      const htmlMatch = cleaned.match(/<!DOCTYPE[\s\S]*<\/html>/i) || cleaned.match(/<html[\s\S]*<\/html>/i)
      if (htmlMatch) {
        return NextResponse.json({ designSystem: null, html: htmlMatch[0], brandAssetsUsed: false })
      }
    }

    // Strategy 4: If "html" key exists but JSON is malformed, extract the HTML value
    if (!parsed) {
      const htmlValueMatch = cleaned.match(/"html"\s*:\s*"([\s\S]*?)"\s*[,}]/)
      if (htmlValueMatch) {
        const html = htmlValueMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
        return NextResponse.json({ designSystem: null, html, brandAssetsUsed: false })
      }
    }

    if (!parsed) {
      console.error('[brand-code-architect] Could not parse:', cleaned.slice(0, 500))
      return NextResponse.json({ error: `Parse failed. Raw start: ${cleaned.slice(0, 200)}` }, { status: 500 })
    }

    return NextResponse.json({
      designSystem: parsed.designSystem,
      html: parsed.html,
      brandAssetsUsed: false,
    })
  } catch (err) {
    console.error('[brand-code-architect] Error:', err)
    const message = err instanceof Error ? err.message : 'Unexpected error'
    // Check for common issues
    if (message.includes('Request too large') || message.includes('413')) {
      return NextResponse.json({ error: 'Images are too large. Please use smaller screenshots.' }, { status: 400 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
