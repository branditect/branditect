import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { HOUSE_STYLE } from '@/lib/house-style'
import { requireUser } from '@/lib/api-auth'
import { meter, brandOfUser, BudgetRefused, refusalBody, requestLocale } from '@/lib/metering'
import { estimateCents, anthropicCostCents, promptChars } from '@/lib/usage-cost'

export const maxDuration = 30

// maxRetries: 0 — meter() owns the one retry (hq-accounts.md criterion 7).
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 })

const MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 1000

export async function POST(req: NextRequest) {
  /*
    Signed in, or nothing happens.

    This route spends money on every call. Left open it is an uncapped model
    bill for anyone who finds the URL, and nothing about it would look wrong —
    no data leaves, the graph just climbs.
  */
  const auth = await requireUser(req)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
  // The budget belongs to a brand; no brand, nothing to charge it to.
  const brandId = await brandOfUser(auth.userId)

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

Return ONLY a valid JSON object with the updated fields for this section, using the exact same structure as the current data. No explanation, no markdown, no code blocks.` + HOUSE_STYLE,
    })

    const messages: Anthropic.MessageParam[] = [{ role: 'user', content }]
    const response = await meter(
      {
        route: 'brand-guideline/edit',
        brandId,
        userId: auth.userId,
        estimateCents: estimateCents({
          model: MODEL,
          inputChars: promptChars(messages),
          images: imageBase64 ? 1 : 0,
          maxOutputTokens: MAX_TOKENS,
        }),
        locale: requestLocale(req),
      },
      async () => {
        const m = await client.messages.create({
          model: MODEL,
          // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
          // max_tokens caps thinking + text together — these calls would
          // truncate. None of them need reasoning tokens.
          thinking: { type: 'disabled' },
          max_tokens: MAX_TOKENS,
          messages,
        })
        return {
          value: m,
          model: MODEL,
          costCents: anthropicCostCents(MODEL, m.usage),
          inputTokens: m.usage.input_tokens,
          outputTokens: m.usage.output_tokens,
        }
      },
    )

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
    if (err instanceof BudgetRefused) return NextResponse.json({ success: false, ...refusalBody(err) }, { status: err.status })
    console.error('[brand-guideline/edit]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Edit failed' },
      { status: 500 }
    )
  }
}
