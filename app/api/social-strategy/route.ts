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
    .eq('source', 'social')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST — generate + save social strategy
export async function POST(req: NextRequest) {
  const { answers, brandId } = await req.json()

  const plats = answers.platforms?.length ? answers.platforms.join(', ') : 'Instagram, TikTok, LinkedIn'

  const prompt = `You are a senior social media strategist inside Branditect, an AI brand operating system.
Build a comprehensive, platform-specific social media strategy from this brand's questionnaire answers.

GOALS: ${answers.goals || 'Brand awareness and community growth'}
AUDIENCE: ${answers.audience || 'Young adults interested in tech and culture'}
BRAND VOICE: ${(answers.voice || []).join(', ') || 'Friendly, Authentic'}
CONTENT THEMES: ${answers.pillars || 'Brand, Community, Education'}
COMPETITORS: ${answers.competitors || 'Not specified'}
CURRENT PRESENCE: ${answers.current || 'Starting fresh'}
RESOURCES: ${(answers.resources || []).join(', ') || 'Small team'}
PLATFORMS: ${plats}

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
        .eq('source', 'social')

      await supabase
        .from('brand_strategies')
        .insert({
          brand_id: brandId,
          source: 'social',
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
