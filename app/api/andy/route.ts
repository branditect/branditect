import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alzqwhkkntfritasizzx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

async function getBrandContext(brandId: string): Promise<string> {
  const [brandRes, strategyRes, toneRes, productsRes, brandStratRes, colorsRes, logosRes, fontsRes, visualRes, docsRes, answersRes, imagesRes] = await Promise.all([
    supabase.from('brands').select('*').eq('brand_id', brandId).maybeSingle(),
    supabase.from('brand_strategies').select('generated_strategy').eq('brand_id', brandId).maybeSingle(),
    supabase.from('brand_tone').select('*').eq('brand_id', brandId).maybeSingle(),
    supabase.from('catalog_products').select('name, description, sku, price_rrp, price_retail, price_monthly, price_wholesale, price_cogs, landed_cost, tax_rate_pct, floor_price, max_discount_pct, min_margin_pct, stock_status, stock_units, currency, type, category, tags').eq('brand_id', brandId),
    supabase.from('brands').select('strategy_text, colors').eq('brand_id', brandId).maybeSingle(),
    supabase.from('brand_book_colors').select('hex, name').eq('brand_id', brandId).limit(20),
    supabase.from('brand_logos').select('slot, file_url, file_name').eq('brand_id', brandId),
    supabase.from('brand_fonts').select('name, role, google_font_url').eq('brand_id', brandId),
    supabase.from('brand_visual').select('*').eq('brand_id', brandId).maybeSingle(),
    supabase.from('brand_documents').select('file_name, category, extracted_text').eq('brand_id', brandId).order('created_at', { ascending: false }),
    // The questionnaire answers, not just the generated summary. Nothing is
    // stored here yet — the strategy page has never written a row — so this
    // resolves empty today and starts working the moment it does.
    supabase.from('brand_strategies').select('answers, generated_strategy, category').eq('brand_id', brandId).maybeSingle(),
    // What imagery exists, so the chat can answer "what shots do we have?"
    supabase.from('brand_images').select('file_name, category, format, tags, campaign_name, title').eq('brand_id', brandId),
  ])

  const brand = brandRes.data
  const strategy = strategyRes.data
  const tone = toneRes.data
  const products = productsRes.data
  const brandStrat = brandStratRes.data

  let ctx = `BRAND KNOWLEDGE:\n`
  if (brand) {
    ctx += `- Brand name: ${brand.brand_name}\n`
    if (brand.website) ctx += `- Website: ${brand.website}\n`
    if (brand.industry) ctx += `- Industry: ${brand.industry}\n`
  }

  // Full generated strategy (from brand strategy page)
  if (strategy?.generated_strategy) {
    const stratText = typeof strategy.generated_strategy === 'string'
      ? strategy.generated_strategy
      : JSON.stringify(strategy.generated_strategy)
    ctx += `\nBRAND STRATEGY (generated):\n${stratText}\n`
  }

  // Strategy text from brands table (onboarding)
  if (brandStrat?.strategy_text) {
    ctx += `\nBRAND STRATEGY (summary):\n${brandStrat.strategy_text}\n`
  }

  if (tone) {
    const { id: _i, user_id: _u, brand_id: _b, created_at: _c, updated_at: _up, ...toneFields } = tone
    void _i; void _u; void _b; void _c; void _up;
    // Tone runs past 4k characters; slicing it cut the do/don't lists in half.
    ctx += `\nBRAND TONE OF VOICE:\n${JSON.stringify(toneFields, null, 2)}\n`
  }

  if (products && products.length > 0) {
    ctx += `\nPRODUCTS & SERVICES (${products.length} items):\n`
    products.forEach((p: Record<string, unknown>) => {
      ctx += `- ${p.name} (${p.type})`
      const price = p.price_retail || p.price_rrp || p.price_monthly || p.price_wholesale
      const cur = (p.currency as string) || 'EUR'
      if (price) {
        const priceLabel = p.price_monthly ? `${cur} ${p.price_monthly}/mo` : `${cur} ${price}`
        ctx += ` — ${priceLabel}`
      }
      if (p.price_cogs) ctx += ` (COGS: ${cur} ${p.price_cogs})`
      if (p.category) ctx += ` [${p.category}]`
      ctx += `\n`
      if (p.sku) ctx += `  SKU: ${p.sku}\n`
      if (p.landed_cost) ctx += `  Landed cost: ${cur} ${p.landed_cost}`
      if (p.tax_rate_pct != null) ctx += ` | Tax: ${p.tax_rate_pct}%`
      if (p.landed_cost || p.tax_rate_pct != null) ctx += `\n`
      if (p.floor_price || p.max_discount_pct || p.min_margin_pct) {
        ctx += `  Guardrails — floor ${p.floor_price ?? 'unset'}, max discount ${p.max_discount_pct ?? 'unset'}%, min margin ${p.min_margin_pct ?? 'unset'}%\n`
      }
      if (p.stock_status) ctx += `  Stock: ${p.stock_status}${p.stock_units != null ? ` (${p.stock_units} units)` : ''}\n`
      if (Array.isArray(p.tags) && p.tags.length) ctx += `  Tags: ${(p.tags as string[]).join(', ')}\n`
      // Full description — this is the copywriter's source of truth, and
      // truncating it at 200 chars was cutting most product detail.
      if (p.description) ctx += `  ${p.description as string}\n`
    })
  }

  // Visual Identity — colors
  const colors = colorsRes.data
  const brandColors = brandStratRes.data?.colors
  if ((colors && colors.length > 0) || brandColors) {
    ctx += `\nVISUAL IDENTITY — COLORS:\n`
    if (brandColors && Array.isArray(brandColors)) {
      brandColors.forEach((c: { hex?: string; name?: string }) => {
        if (c.hex) ctx += `- ${c.name || 'Color'}: ${c.hex}\n`
      })
    }
    if (colors && colors.length > 0) {
      colors.forEach((c: { hex: string; name: string }) => {
        ctx += `- ${c.name}: ${c.hex}\n`
      })
    }
  }

  // Visual Identity — logos
  const logos = logosRes.data
  if (logos && logos.length > 0) {
    ctx += `\nVISUAL IDENTITY — LOGOS:\n`
    logos.forEach((l: { slot: string; file_name: string | null }) => {
      ctx += `- ${l.slot} logo: ${l.file_name || 'uploaded'}\n`
    })
  }

  // Visual Identity — fonts
  const fonts = fontsRes.data
  if (fonts && fonts.length > 0) {
    ctx += `\nVISUAL IDENTITY — TYPOGRAPHY:\n`
    fonts.forEach((f: { name: string; role: string | null }) => {
      ctx += `- ${f.name} (${f.role || 'general'})\n`
    })
  }

  // Visual Identity — additional from brand_visual table
  const visual = visualRes.data
  if (visual) {
    const { id: _vi, user_id: _vu, brand_id: _vb, created_at: _vc, updated_at: _vup, ...visualFields } = visual
    void _vi; void _vu; void _vb; void _vc; void _vup;
    const vJson = JSON.stringify(visualFields)
    if (vJson.length > 10) {
      ctx += `\nVISUAL IDENTITY — ADDITIONAL:\n${vJson}\n`
    }
  }

  // Knowledge Vault — extracted documents
  const docs = docsRes.data
  if (docs && docs.length > 0) {
    ctx += `\nKNOWLEDGE VAULT (${docs.length} documents):\n`
    ctx += `These are uploaded brand documents with extracted text. Use this information to answer questions accurately.\n\n`
    // 120k characters, and no per-document cap. Whole documents beat the
    // first 2000 characters of several — a truncated document usually loses
    // exactly the specifics someone is asking about.
    let charBudget = 120000
    const empty: string[] = []
    for (const doc of docs) {
      const d = doc as Record<string, string>
      const text = d.extracted_text
      if (!text) { empty.push(d.file_name); continue }
      if (charBudget <= 0) {
        ctx += `--- Document: ${d.file_name} [omitted, context budget spent] ---\n\n`
        continue
      }
      const chunk = text.slice(0, charBudget)
      ctx += `--- Document: ${d.file_name} ---\n${chunk}`
      if (text.length > chunk.length) ctx += `\n[...truncated at context budget, ${text.length} chars total]`
      ctx += `\n\n`
      charBudget -= chunk.length
    }
    // Naming these matters: a document that extracted to nothing is invisible
    // to the model, and the user needs to know why it can't answer from it.
    if (empty.length) {
      ctx += `NOTE: these documents are uploaded but no text could be extracted, so their contents are unavailable: ${empty.join(', ')}. If asked about them, say the file could not be read rather than guessing.\n\n`
    }
  }

  // Strategy questionnaire — the raw answers, which are richer than the summary
  const answers = answersRes.data?.answers as Record<string, string> | null | undefined
  if (answers && Object.keys(answers).length > 0) {
    ctx += `\nSTRATEGY QUESTIONNAIRE (the founder's own words):\n`
    for (const [key, value] of Object.entries(answers)) {
      if (!value?.trim()) continue
      const [section, question] = key.split('|')
      ctx += `[${section}] ${question}\n${value}\n\n`
    }
  }

  // Image library — what imagery exists to work from
  const images = imagesRes.data
  if (images && images.length > 0) {
    ctx += `\nIMAGE LIBRARY (${images.length} images):\n`
    for (const img of images as Record<string, unknown>[]) {
      const bits = [img.category, img.format].filter(Boolean).join(', ')
      ctx += `- ${img.file_name}`
      if (img.title) ctx += ` — ${img.title}`
      if (bits) ctx += ` [${bits}]`
      if (img.campaign_name) ctx += ` (campaign: ${img.campaign_name})`
      if (Array.isArray(img.tags) && img.tags.length) ctx += ` tags: ${(img.tags as string[]).join(', ')}`
      ctx += `\n`
    }
  }

  // How much actually reached the model, and from where.
  console.log('[andy] brand context', JSON.stringify({
    brandId,
    totalChars: ctx.length,
    products: products?.length ?? 0,
    documents: docs?.length ?? 0,
    documentChars: (docs ?? []).reduce((n: number, d: Record<string, string>) => n + (d.extracted_text?.length ?? 0), 0),
    images: images?.length ?? 0,
    questionnaireAnswers: answers ? Object.keys(answers).length : 0,
    brandRowFound: Boolean(brand),
  }))

  return ctx
}

export async function POST(req: NextRequest) {
  const { messages, brandId } = await req.json()

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Missing messages' }, { status: 400 })
  }

  let brandContext = ''
  if (brandId) {
    try { brandContext = await getBrandContext(brandId) } catch {}
  }

  const systemPrompt = `You are Andy, an AI brand assistant built into Branditect.

${brandContext}

RULES:
- You are Andy. Never refer to yourself as anything else.
- Be concise and actionable. No filler.
- Answer questions about the brand using the knowledge above.
- Help with copy, strategy, campaigns, content ideas, and brand decisions.
- If you don't have specific brand info, say so honestly.
- Never invent brand facts. Only use what's in the brand knowledge above.
- Use a professional but friendly tone. Not corporate, not overly casual.
- When generating copy, match the brand's tone of voice.
- Keep responses focused — under 200 words unless the user asks for something longer.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + text together — these calls would
      // truncate. None of them need reasoning tokens.
      thinking: { type: 'disabled' },
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const reply = response.content
      .map(c => c.type === 'text' ? c.text : '')
      .join('')
      .trim()

    return NextResponse.json({ reply })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
