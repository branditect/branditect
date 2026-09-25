import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireUser } from '@/lib/api-auth'
import { meter, brandOfUser, BudgetRefused, refusalBody, requestLocale } from '@/lib/metering'
import { estimateCents, anthropicCostCents, promptChars } from '@/lib/usage-cost'
import { logCacheUsage } from '@/lib/prompt-cache'

export const maxDuration = 30

// maxRetries: 0 — meter() owns the one retry (hq-accounts.md criterion 7).
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 0,
})

const MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 700

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

  const { message, pageUrls } = await req.json()

  if (!message) {
    return NextResponse.json({ error: 'Missing message' }, { status: 400 })
  }

  const contentBlocks: Anthropic.MessageCreateParams['messages'][0]['content'] = []

  /*
    Only our own storage, and only https.

    `pageUrls` comes from the body and was handed to Anthropic as image URLs
    for it to fetch. That made this route a way to have someone else's
    infrastructure request an arbitrary address on the caller's behalf, and to
    pay for the tokens it produced. Brand book pages live in this project's
    Supabase storage and nowhere else, so that is the whole allowlist.
  */
  const STORAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}/storage/v1/object/`

  const allowed = (u: unknown): u is string =>
    typeof u === 'string' && STORAGE_PREFIX.length > '/storage/v1/object/'.length && u.startsWith(STORAGE_PREFIX)

  const pages: string[] = Array.isArray(pageUrls) ? pageUrls.filter(allowed).slice(0, 8) : []

  if (Array.isArray(pageUrls) && pageUrls.length > 0 && pages.length === 0) {
    return NextResponse.json(
      { error: 'Brand book pages must be files stored in this workspace.' },
      { status: 400 },
    )
  }

  /*
    The pages are the same for every question in a session, and at ~1.6k
    tokens each they are nearly the whole input. A cache point on the last
    page makes every follow-up read them at 0.1x instead of paying full
    price again. The question goes after it, so it never breaks the prefix.

    5 minutes, not the 1 hour every other route uses. A 1h write costs 2x
    input, so a session with a single question would pay double for pages it
    never reuses. A 5m write costs 1.25x and pays for itself at the second
    question; follow-ups in a chat come within minutes, and each read
    refreshes the 5 minutes. Measured 2026-09-25 on three Sorbify pages:
    first question wrote 4079 tokens, the second read 4079.
  */
  pages.forEach((url, i) => {
    contentBlocks.push(
      i === pages.length - 1
        ? { type: 'image', source: { type: 'url', url }, cache_control: { type: 'ephemeral', ttl: '5m' } }
        : { type: 'image', source: { type: 'url', url } },
    )
  })

  contentBlocks.push({
    type: 'text',
    text: pages.length > 0
      ? `The images above are pages from a brand guideline. Answer this question based on what you see: "${message}"\n\nBe specific and practical. Extract exact hex codes, font names, or rules where visible.`
      : message
  })

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: contentBlocks }]

  try {
    const response = await meter(
      {
        route: 'brand-book/chat',
        brandId,
        userId: auth.userId,
        estimateCents: estimateCents({
          model: MODEL,
          inputChars: promptChars(messages),
          images: pages.length,
          maxOutputTokens: MAX_TOKENS,
        }),
        locale: requestLocale(req),
      },
      async () => {
        const m = await anthropic.messages.create({
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

    logCacheUsage('brand-book-chat', response.usage)

    const reply = response.content
      .map(c => c.type === 'text' ? c.text : '')
      .join('')
      .trim()

    return NextResponse.json({ reply })
  } catch (err: unknown) {
    if (err instanceof BudgetRefused) return NextResponse.json(refusalBody(err), { status: err.status })
    const message = err instanceof Error ? err.message : 'API error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
