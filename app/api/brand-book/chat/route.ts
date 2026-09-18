import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireUser } from '@/lib/api-auth'

export const maxDuration = 30

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  /*
    Signed in, or nothing happens.

    This route spends money on every call. Left open it is an uncapped model
    bill for anyone who finds the URL, and nothing about it would look wrong —
    no data leaves, the graph just climbs.
  */
  const auth = await requireUser(req)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

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

  for (const url of pages) {
    contentBlocks.push({ type: 'image', source: { type: 'url', url } })
  }

  contentBlocks.push({
    type: 'text',
    text: pages.length > 0
      ? `The images above are pages from a brand guideline. Answer this question based on what you see: "${message}"\n\nBe specific and practical. Extract exact hex codes, font names, or rules where visible.`
      : message
  })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + text together — these calls would
      // truncate. None of them need reasoning tokens.
      thinking: { type: 'disabled' },
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
