import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are a senior UI/UX engineer and design systems expert. You analyse screenshots to extract precise design systems, then generate matching HTML components for new features.

Your response MUST be valid JSON only — no markdown, no backticks, no prose outside the JSON.

Return this exact structure:
{
  "designSystem": {
    "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
    "typography": "Fonts used and text hierarchy",
    "styleNotes": "Spacing, border-radius, card treatment, shadows, overall character"
  },
  "html": "COMPLETE self-contained HTML file with embedded <style>. Must: render the new feature with realistic placeholder content; include hover states and transitions; be mobile-friendly; contain no Lorem Ipsum. Use the exact design system extracted from the screenshots."
}`

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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
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

    const rawText = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as Anthropic.TextBlock).text)
      .join('')

    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()

    let parsed: { designSystem: unknown; html: string }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // Try to extract HTML directly
      const htmlMatch = cleaned.match(/<html[\s\S]*<\/html>/i) || cleaned.match(/<!DOCTYPE[\s\S]*<\/html>/i)
      if (htmlMatch) {
        return NextResponse.json({ designSystem: null, html: htmlMatch[0], brandAssetsUsed: false })
      }
      return NextResponse.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 })
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
