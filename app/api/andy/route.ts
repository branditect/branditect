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
  const [brandRes, strategyRes, toneRes, productsRes, brandStratRes, colorsRes, logosRes, fontsRes, visualRes, docsRes] = await Promise.all([
    supabase.from('brands').select('*').eq('brand_id', brandId).maybeSingle(),
    supabase.from('brand_strategies').select('generated_strategy').eq('brand_id', brandId).maybeSingle(),
    supabase.from('brand_tone').select('*').eq('brand_id', brandId).maybeSingle(),
    supabase.from('catalog_products').select('name, description, price_rrp, price_monthly, price_wholesale, price_cogs, currency, type, category').eq('brand_id', brandId).limit(10),
    supabase.from('brands').select('strategy_text, colors').eq('brand_id', brandId).maybeSingle(),
    supabase.from('brand_book_colors').select('hex, name').eq('brand_id', brandId).limit(20),
    supabase.from('brand_logos').select('slot, file_url, file_name').eq('brand_id', brandId),
    supabase.from('brand_fonts').select('name, role, google_font_url').eq('brand_id', brandId),
    supabase.from('brand_visual').select('*').eq('brand_id', brandId).maybeSingle(),
    supabase.from('brand_documents').select('file_name, category, extracted_text').eq('brand_id', brandId).order('created_at', { ascending: false }).limit(10),
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
    ctx += `\nBRAND STRATEGY (generated):\n${stratText.slice(0, 4000)}\n`
  }

  // Strategy text from brands table (onboarding)
  if (brandStrat?.strategy_text) {
    ctx += `\nBRAND STRATEGY (summary):\n${brandStrat.strategy_text.slice(0, 2000)}\n`
  }

  if (tone) {
    const { id: _i, user_id: _u, brand_id: _b, created_at: _c, updated_at: _up, ...toneFields } = tone
    void _i; void _u; void _b; void _c; void _up;
    ctx += `\nBRAND TONE OF VOICE:\n${JSON.stringify(toneFields, null, 2).slice(0, 2000)}\n`
  }

  if (products && products.length > 0) {
    ctx += `\nPRODUCTS & SERVICES (${products.length} items):\n`
    products.forEach((p: Record<string, unknown>) => {
      ctx += `- ${p.name} (${p.type})`
      const price = p.price_rrp || p.price_monthly || p.price_wholesale
      const cur = (p.currency as string) || 'EUR'
      if (price) {
        const priceLabel = p.price_monthly ? `${cur} ${p.price_monthly}/mo` : `${cur} ${price}`
        ctx += ` — ${priceLabel}`
      }
      if (p.price_cogs) ctx += ` (COGS: ${cur} ${p.price_cogs})`
      if (p.category) ctx += ` [${p.category}]`
      ctx += `\n`
      if (p.description) ctx += `  ${(p.description as string).slice(0, 200)}\n`
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
      ctx += `\nVISUAL IDENTITY — ADDITIONAL:\n${vJson.slice(0, 1500)}\n`
    }
  }

  // Knowledge Vault — extracted documents
  const docs = docsRes.data
  if (docs && docs.length > 0) {
    ctx += `\nKNOWLEDGE VAULT (${docs.length} documents):\n`
    ctx += `These are uploaded brand documents with extracted text. Use this information to answer questions accurately.\n\n`
    let charBudget = 8000 // allocate up to 8k chars for vault docs
    for (const doc of docs) {
      if (charBudget <= 0) break
      const text = (doc as Record<string, string>).extracted_text
      if (!text) {
        ctx += `--- Document: ${(doc as Record<string, string>).file_name} [no text extracted] ---\n\n`
        continue
      }
      const chunk = text.slice(0, Math.min(charBudget, 2000))
      ctx += `--- Document: ${(doc as Record<string, string>).file_name} ---\n`
      ctx += chunk
      if (text.length > chunk.length) ctx += `\n[...truncated, ${text.length} chars total]`
      ctx += `\n\n`
      charBudget -= chunk.length
    }
  }

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
      model: 'claude-sonnet-4-20250514',
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
