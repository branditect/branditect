import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildBrandContext } from '@/lib/brandContext'
import { serviceClient as supabase } from '@/lib/supabase-admin'
import { resolveBrand } from "@/lib/api-auth";
import { cachedSystem, logCacheUsage } from '@/lib/prompt-cache'
import { copyStable, copyPerRequest } from '@/lib/prompts'
import { findFormat, normaliseDraft, isThinBrief, type Draft, type Length } from '@/lib/studio-write'

// Three drafts of a long email is a real amount of generation.
export const maxDuration = 120

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const LENGTHS: Length[] = ['short', 'medium', 'long']

interface BrandFacts {
  brandName: string
  toneLabel: string | null
  context: string
  product: Record<string, unknown> | null
}

async function readBrandFacts(brandId: string, productId: string | null): Promise<BrandFacts> {
  if (!brandId || brandId === 'default') {
    return { brandName: 'Your Brand', toneLabel: null, context: '', product: null }
  }

  const [brandRes, toneRes, context, productRes] = await Promise.all([
    supabase.from('brands').select('brand_name').eq('brand_id', brandId).maybeSingle(),
    supabase.from('brand_tone').select('expression_label').eq('brand_id', brandId).maybeSingle(),
    buildBrandContext(brandId),
    productId
      ? supabase
          .from('catalog_products')
          .select('*')
          .eq('id', productId)
          .eq('brand_id', brandId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  return {
    brandName: brandRes.data?.brand_name || 'Your Brand',
    toneLabel: toneRes.data?.expression_label || null,
    context,
    product: (productRes.data as Record<string, unknown> | null) ?? null,
  }
}

function parseJson(rawText: string): Record<string, unknown> | null {
  const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    /* fall through */
  }

  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first !== -1 && last > first) {
    try {
      return JSON.parse(cleaned.slice(first, last + 1))
    } catch {
      /* fall through */
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const auth = await resolveBrand(req, body?.brand_id ?? null)
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
    const brandId = auth.brandId
    const {
      format,
      format_other: formatOther,
      brief,
      product_id: productId,
      length,
      drafts: draftCount,
    } = body as {
      brand_id?: string
      format?: string
      format_other?: string
      brief?: string
      product_id?: string | null
      length?: string
      drafts?: number
    }

    const def = findFormat(format)
    if (!def) {
      return NextResponse.json({ error: 'Pick a format first.' }, { status: 400 })
    }
    if (!brief || !brief.trim()) {
      return NextResponse.json({ error: "Say what it's about first." }, { status: 400 })
    }
    if (def.id === 'other' && !formatOther?.trim()) {
      return NextResponse.json({ error: 'Tell us what to write.' }, { status: 400 })
    }

    const len: Length = LENGTHS.includes(length as Length) ? (length as Length) : 'medium'
    const count = draftCount === 1 ? 1 : 3
    const deliverable = def.id === 'other' ? formatOther!.trim() : def.deliverable

    const facts = await readBrandFacts(brandId || 'default', productId || null)

    const userPrompt = `What it's about: ${brief.trim()}${
      facts.product ? `\n\nThis is about the product named above.` : ''
    }${
      isThinBrief(brief)
        ? `\n\nThe brief is short. Work from the brand sources for everything it does not say, and do not invent a scenario.`
        : ''
    }

Write the ${count} draft${count > 1 ? 's' : ''} now. Return only the JSON.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + text together — these calls would truncate.
      thinking: { type: 'disabled' },
      max_tokens: 4000,
      system: cachedSystem(
        copyStable({ brandName: facts.brandName, context: facts.context }),
        copyPerRequest({ deliverable, wordTarget: def.words[len], count, product: facts.product }),
      ),
      messages: [{ role: 'user', content: userPrompt }],
    })

    logCacheUsage('copy-architect', response.usage)

    const rawText = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as Anthropic.TextBlock).text)
      .join('')

    const parsed = parseJson(rawText)
    if (!parsed) {
      console.error('[copy-architect] Could not parse:', rawText.slice(0, 500))
      return NextResponse.json(
        { error: 'The model did not return usable copy. Try again.' },
        { status: 502 }
      )
    }

    // normaliseDraft runs sanitise-output over every body and every claim.
    // Criterion 8 — no markdown, no bullets and no em dashes reach the UI.
    const raw = Array.isArray(parsed.drafts) ? parsed.drafts : []
    const drafts: Draft[] = raw.map(normaliseDraft).filter((d): d is Draft => d !== null)

    if (!drafts.length) {
      return NextResponse.json({ error: 'The model returned no copy. Try again.' }, { status: 502 })
    }

    return NextResponse.json({
      drafts,
      tone: facts.toneLabel,
      missing: typeof parsed.missing === 'string' ? parsed.missing.trim() : '',
    })
  } catch (err) {
    console.error('[copy-architect] Error:', err)
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
