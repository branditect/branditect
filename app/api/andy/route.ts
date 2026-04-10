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
  const [brandRes, strategyRes, toneRes, productsRes, brandStratRes] = await Promise.all([
    supabase.from('brands').select('*').eq('brand_id', brandId).maybeSingle(),
    supabase.from('brand_strategies').select('generated_strategy').eq('brand_id', brandId).maybeSingle(),
    supabase.from('brand_tone').select('*').eq('brand_id', brandId).maybeSingle(),
    supabase.from('catalog_products').select('name, description, price_rrp, currency, type, category').eq('brand_id', brandId).limit(10),
    supabase.from('brands').select('strategy_text').eq('brand_id', brandId).maybeSingle(),
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
    products.forEach((p: { name: string; description: string; price_rrp: number | null; currency: string; type: string; category: string | null }) => {
      ctx += `- ${p.name} (${p.type})`
      if (p.price_rrp) ctx += ` — ${p.currency || 'EUR'} ${p.price_rrp}`
      if (p.category) ctx += ` [${p.category}]`
      ctx += `\n`
      if (p.description) ctx += `  ${p.description.slice(0, 200)}\n`
    })
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
