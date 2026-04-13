import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alzqwhkkntfritasizzx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// GET — load existing social strategy
export async function GET(req: NextRequest) {
  const brandId = req.nextUrl.searchParams.get('brandId')
  if (!brandId) return NextResponse.json({ error: 'Missing brandId' }, { status: 400 })

  const { data, error } = await supabase
    .from('brand_strategies')
    .select('*')
    .eq('brand_id', brandId)
    .eq('category', 'social')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// Fetch full brand context from all sources
async function getBrandContext(brandId: string): Promise<string> {
  const [brandRes, strategyRes, toneRes, productsRes, docsRes] = await Promise.all([
    supabase.from('brands').select('brand_name, website, industry, strategy_text').eq('brand_id', brandId).maybeSingle(),
    supabase.from('brand_strategies').select('generated_strategy').eq('brand_id', brandId).not('source', 'eq', 'social').maybeSingle(),
    supabase.from('brand_tone').select('*').eq('brand_id', brandId).maybeSingle(),
    supabase.from('catalog_products').select('name, description, price_rrp, price_monthly, currency, type').eq('brand_id', brandId).limit(10),
    supabase.from('brand_documents').select('file_name, extracted_text').eq('brand_id', brandId).order('created_at', { ascending: false }).limit(5),
  ])

  let ctx = ''

  if (brandRes.data) {
    const b = brandRes.data
    ctx += `BRAND: ${b.brand_name}`
    if (b.website) ctx += ` | Website: ${b.website}`
    if (b.industry) ctx += ` | Industry: ${b.industry}`
    ctx += '\n'
    if (b.strategy_text) ctx += `BRAND SUMMARY: ${b.strategy_text.slice(0, 500)}\n`
  }

  if (strategyRes.data?.generated_strategy) {
    const s = typeof strategyRes.data.generated_strategy === 'string'
      ? strategyRes.data.generated_strategy : JSON.stringify(strategyRes.data.generated_strategy)
    ctx += `\nBRAND STRATEGY:\n${s.slice(0, 3000)}\n`
  }

  if (toneRes.data) {
    const { id: _i, user_id: _u, brand_id: _b, created_at: _c, updated_at: _up, ...tone } = toneRes.data
    void _i; void _u; void _b; void _c; void _up
    ctx += `\nTONE OF VOICE:\n${JSON.stringify(tone).slice(0, 1500)}\n`
  }

  if (productsRes.data?.length) {
    ctx += `\nPRODUCTS (${productsRes.data.length}):\n`
    productsRes.data.forEach((p: Record<string, unknown>) => {
      ctx += `- ${p.name} (${p.type})`
      const price = p.price_rrp || p.price_monthly
      if (price) ctx += ` — ${p.currency || 'EUR'} ${price}${p.price_monthly ? '/mo' : ''}`
      ctx += '\n'
      if (p.description) ctx += `  ${(p.description as string).slice(0, 150)}\n`
    })
  }

  if (docsRes.data?.length) {
    ctx += `\nKNOWLEDGE VAULT (${docsRes.data.length} docs):\n`
    let budget = 3000
    for (const doc of docsRes.data) {
      if (budget <= 0) break
      const text = (doc as Record<string, string>).extracted_text
      if (!text) continue
      const chunk = text.slice(0, Math.min(budget, 1000))
      ctx += `--- ${(doc as Record<string, string>).file_name} ---\n${chunk}\n\n`
      budget -= chunk.length
    }
  }

  return ctx
}

// POST — generate + save social strategy
export async function POST(req: NextRequest) {
  const { answers, brandId } = await req.json()

  // Fetch brand context
  let brandContext = ''
  if (brandId) {
    try { brandContext = await getBrandContext(brandId) } catch {}
  }

  const plats = answers.platforms?.length ? answers.platforms.join(', ') : 'Instagram, TikTok, LinkedIn'

  const prompt = `You are a senior social media strategist inside Branditect, an AI brand operating system.
Build a comprehensive, platform-specific social media strategy from this brand's questionnaire answers AND existing brand knowledge.

${brandContext ? `=== EXISTING BRAND KNOWLEDGE ===\n${brandContext}\n=== END BRAND KNOWLEDGE ===\n\n` : ''}QUESTIONNAIRE ANSWERS:
GOALS: ${answers.goals || 'Brand awareness and community growth'}
AUDIENCE: ${answers.audience || 'Young adults interested in tech and culture'}
BRAND VOICE: ${(answers.voice || []).join(', ') || 'Friendly, Authentic'}
CONTENT THEMES: ${answers.pillars || 'Brand, Community, Education'}
COMPETITORS: ${answers.competitors || 'Not specified'}
CURRENT PRESENCE: ${answers.current || 'Starting fresh'}
RESOURCES: ${(answers.resources || []).join(', ') || 'Small team'}
PLATFORMS: ${plats}

IMPORTANT: Use the brand knowledge above to make the strategy deeply specific to this brand. Reference actual products, brand values, tone of voice, and business context. Do not generate generic advice.

Return ONLY valid JSON (no markdown, no code fences) matching this structure:
{
  "brand_summary": "One sentence describing the brand's social media opportunity",
  "content_pillars": [{"name":"","description":"","example_topics":["","",""],"mix_type":"educational"}],
  "platforms": [{"name":"","cadence":"","best_times":"","primary_formats":["",""],"content_mix":{"educational":25,"entertaining":35,"promotional":15,"community":25},"kpis":{"follower_growth":"","engagement_rate":"","primary_metric":""}}],
  "engagement_playbook":{"comment_strategy":"","dm_workflow":"","ugc":"","community_ritual":""},
  "growth_tactics":{"hashtags":"","collaborations":"","paid_boost":"","cross_promotion":""},
  "content_ideas":[{"platform":"","format":"","idea":"","pillar":""},{"platform":"","format":"","idea":"","pillar":""},{"platform":"","format":"","idea":"","pillar":""},{"platform":"","format":"","idea":"","pillar":""}],
  "action_plan":[{"day":1,"task":"","type":"setup"},{"day":2,"task":"","type":"content"},{"day":3,"task":"","type":"engage"},{"day":4,"task":"","type":"content"},{"day":5,"task":"","type":"content"},{"day":6,"task":"","type":"engage"},{"day":7,"task":"","type":"review"},{"day":8,"task":"","type":"setup"},{"day":9,"task":"","type":"content"},{"day":10,"task":"","type":"content"},{"day":11,"task":"","type":"engage"},{"day":12,"task":"","type":"content"},{"day":13,"task":"","type":"content"},{"day":14,"task":"","type":"review"}],
  "inspirational_brands":["","",""]
}

Use ${plats} as platforms. Make content pillars, ideas, and tactics highly specific. All 14 days required.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: 'Return ONLY valid JSON. No markdown. No code fences. No preamble.',
      messages: [{ role: 'user', content: prompt }],
    })

    const txt = response.content
      .map(c => c.type === 'text' ? c.text : '')
      .join('')
      .trim()
      .replace(/```json|```/g, '')
      .trim()

    const data = JSON.parse(txt)

    // Save to Supabase
    if (brandId) {
      // Upsert: delete old social strategy, insert new one
      await supabase
        .from('brand_strategies')
        .delete()
        .eq('brand_id', brandId)
        .eq('category', 'social')

      await supabase
        .from('brand_strategies')
        .insert({
          brand_id: brandId,
          source: 'questionnaire',
          category: 'social',
          answers: JSON.stringify(answers),
          generated_strategy: JSON.stringify(data),
          status: 'complete',
        })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Generation failed' }, { status: 500 })
  }
}
