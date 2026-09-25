import { NextRequest, NextResponse } from 'next/server'
import Anthropic from "@anthropic-ai/sdk";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";
import { cachedSystem, logCacheUsage } from "@/lib/prompt-cache";
import { SOCIAL_PLAN_STABLE } from "@/lib/prompts";
import { parseStrategy, strategyPromptContext } from "@/lib/strategy";
import {
  suggestPillars, suggestAudience, parsePlan, planIsUsable, postsPerWeek,
  channelLabel, isChannel, MAX_CHANNELS,
  type Pillar, type AudienceProfile,
} from "@/lib/social";
import { meter, BudgetRefused, refusalBody, requestLocale } from "@/lib/metering";
import { estimateCents, anthropicCostCents, promptChars } from "@/lib/usage-cost";

export const maxDuration = 60

// maxRetries: 0 — meter() owns the one retry (hq-accounts.md criterion 7).
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 })

const MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 4000

/**
 * The four columns supabase/social-media.sql adds.
 *
 * Migrations here are run by hand, so the app has to work out whether they
 * have been. A write naming a column that does not exist fails the whole
 * request with PGRST204 — saying which file to run is the difference between
 * a page that explains itself and one that reports "Could not find the
 * 'pillars' column" to a founder.
 */
function migrationMissing(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false
  return error.code === 'PGRST204' || error.code === '42703' ||
    /column .*(pillars|audience|plan|generated_at)/i.test(error.message ?? '')
}

const MIGRATION = {
  error: 'Run supabase/social-media.sql in the Supabase SQL editor.',
  errorKey: 'social.migrationMissing',
}

/* ------------------------------------------------------------------ */
/*  Brand context summary — what we already know about the brand.      */
/*  Used by the entry screen so the user sees what Branditect will     */
/*  pull from before answering only the gap-filling questions.         */
/* ------------------------------------------------------------------ */

interface BrandContextSummary {
  brandName: string | null
  hasStrategy: boolean
  hasTone: boolean
  archetype: string | null
  voiceDescription: string | null
  personasCount: number
  productsCount: number
  topProducts: string[]
  competitorsCount: number
}

async function getBrandContextSummary(brandId: string): Promise<BrandContextSummary> {
  const [brandRes, stratRes, toneRes, productsRes] = await Promise.all([
    supabase.from('brands').select('brand_name').eq('brand_id', brandId).maybeSingle(),
    supabase.from('brand_strategies').select('generated_strategy').eq('brand_id', brandId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('brand_tone').select('id').eq('brand_id', brandId).maybeSingle(),
    supabase.from('catalog_products').select('name').eq('brand_id', brandId).limit(3),
  ])

  let archetype: string | null = null
  let voiceDescription: string | null = null
  let personasCount = 0
  let competitorsCount = 0

  if (stratRes.data?.generated_strategy) {
    try {
      const raw = stratRes.data.generated_strategy
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      archetype = parsed?.pyramid?.essence ?? parsed?.archetype ?? null
      voiceDescription = parsed?.voiceDescription ?? null
      personasCount = Array.isArray(parsed?.audience) ? parsed.audience.length
        : Array.isArray(parsed?.personas) ? parsed.personas.length : 0
      competitorsCount = Array.isArray(parsed?.competitors) ? parsed.competitors.length : 0
    } catch {
      // Legacy markdown format — leave fields null
    }
  }

  const products = productsRes.data || []

  return {
    brandName: brandRes.data?.brand_name ?? null,
    hasStrategy: !!stratRes.data,
    hasTone: !!toneRes.data,
    archetype,
    voiceDescription,
    personasCount,
    productsCount: products.length,
    topProducts: products.map((p: { name: string }) => p.name).filter(Boolean),
    competitorsCount,
  }
}

/* ------------------------------------------------------------------ */
/*  GET — load existing record + brand context summary                 */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  // Ownership from the caller's token. The query parameter is checked
  // against the brand they own, never trusted as the scope.
  const auth = await resolveBrand(req, req.nextUrl.searchParams.get('brandId'));
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const brandId = auth.brandId;
  if (!brandId) return NextResponse.json({ error: 'Missing brandId' }, { status: 400 })

  const [recordRes, ctx] = await Promise.all([
    supabase
      .from('social_strategy')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    getBrandContextSummary(brandId).catch(() => null),
  ])

  if (recordRes.error && recordRes.error.code !== 'PGRST116') {
    return NextResponse.json({ error: recordRes.error.message }, { status: 500 })
  }

  return NextResponse.json({
    record: recordRes.data || null,
    context: ctx,
  })
}

/* ------------------------------------------------------------------ */
/*  POST — single endpoint with action discriminator                   */
/*    { action: 'start',    brandId }                  → create row    */
/*    { action: 'answer',   id, field, value }         → update field  */
/*    { action: 'reset',    id }                       → discard row   */
/*    { action: 'generate', id }                       → step 2 (stub) */
/* ------------------------------------------------------------------ */

const ALLOWED_FIELDS = new Set([
  'channels',
  'primary_goal',
  'secondary_goal',
  'capacity_volume',
  'production_setup',
  'reference_accounts',
  'anti_patterns',
  // The two brainstorms. Added by supabase/social-media.sql.
  'pillars',
  'audience',
])

/** The brand's strategy, parsed, or null when it has not been written yet. */
async function loadStrategy(brandId: string) {
  const { data } = await supabase
    .from('brand_strategies').select('generated_strategy')
    .eq('brand_id', brandId).order('created_at', { ascending: false }).limit(1).maybeSingle()
  return data?.generated_strategy ? parseStrategy(data.generated_strategy) : null
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const auth = await resolveBrand(req, body?.brandId ?? null)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
  const action = body.action

  if (action === 'start') {
    const { brandId } = body
    if (!brandId) return NextResponse.json({ error: 'Missing brandId' }, { status: 400 })

    const { data, error } = await supabase
      .from('social_strategy')
      .insert({ brand_id: brandId, status: 'in_progress' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id })
  }

  if (action === 'answer') {
    const { id, field, value } = body
    if (!id || !field) return NextResponse.json({ error: 'Missing id or field' }, { status: 400 })
    if (!ALLOWED_FIELDS.has(field)) {
      return NextResponse.json({ error: 'Field not editable' }, { status: 400 })
    }

    // Two channels at most, enforced here as well as in the page: a founder
    // who can post three times a week and picks five platforms is posting to
    // each one every other week, which is the same as being on none of them.
    let stored = value
    if (field === 'channels' && Array.isArray(value)) {
      stored = value.filter((c) => typeof c === 'string' && isChannel(c)).slice(0, MAX_CHANNELS)
    }

    const patch: Record<string, unknown> = {
      [field]: stored,
      updated_at: new Date().toISOString(),
    }

    // Scoped by brand as well as by id. `id` comes from the body and this
    // client is service-role, so RLS does not cover for a missing filter:
    // without .eq('brand_id') any signed-in user could patch any brand's row
    // by guessing its id. The 'generate' action below always had this; these
    // two did not.
    const { error } = await supabase
      .from('social_strategy')
      .update(patch)
      .eq('id', id)
      .eq('brand_id', auth.brandId)

    if (error) {
      return migrationMissing(error)
        ? NextResponse.json(MIGRATION, { status: 400 })
        : NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'reset') {
    const { id } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const { error } = await supabase
      .from('social_strategy')
      .delete()
      .eq('id', id)
      .eq('brand_id', auth.brandId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  /**
   * What the strategy already says, offered as a starting point.
   *
   * No model call: every suggestion is a field the founder has already written
   * or approved. Questions four and five are brainstorms, and a brainstorm
   * that starts at a blank page is the one people abandon.
   */
  if (action === 'suggest') {
    const brandId = auth.brandId
    if (!brandId) return NextResponse.json({ error: 'No brand' }, { status: 400 })
    const strategy = await loadStrategy(brandId)
    return NextResponse.json({
      hasStrategy: Boolean(strategy),
      pillars: suggestPillars(strategy),
      audience: suggestAudience(strategy),
    })
  }

  /**
   * The week itself.
   *
   * This is what "the synthesis layer ships in step 2" meant: five questions
   * were answered, stored, and turned into nothing. It reads the row rather
   * than trusting the body — the answers are already saved, and a client that
   * could post its own would be writing a plan for a brand out of text it made
   * up.
   */
  if (action === 'generate') {
    const { id } = body
    const brandId = auth.brandId
    if (!id || !brandId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { data: row, error: readError } = await supabase
      .from('social_strategy').select('*').eq('id', id).eq('brand_id', brandId).maybeSingle()
    if (readError) {
      return migrationMissing(readError)
        ? NextResponse.json(MIGRATION, { status: 400 })
        : NextResponse.json({ error: readError.message }, { status: 500 })
    }
    if (!row) return NextResponse.json({ error: 'No such social strategy' }, { status: 404 })

    const channels: string[] = Array.isArray(row.channels) ? row.channels.filter(isChannel) : []
    const pillars: Pillar[] = Array.isArray(row.pillars) ? row.pillars : []
    const audience: AudienceProfile[] = Array.isArray(row.audience) ? row.audience : []
    // A plan for no channel, or with nothing to say, is not worth a minute of
    // the model's time. Say which answer is missing.
    if (channels.length === 0) {
      return NextResponse.json({ error: 'No channels chosen', errorKey: 'social.needChannels' }, { status: 400 })
    }
    if (pillars.length === 0) {
      return NextResponse.json({ error: 'No content pillars', errorKey: 'social.needPillars' }, { status: 400 })
    }

    const strategy = await loadStrategy(brandId)
    const perWeek = postsPerWeek(row.capacity_volume)

    let userText = 'THE BRAND\n\n'
    userText += strategy ? strategyPromptContext(strategy) : '(No brand strategy on file.)'
    userText += `\n\nCHANNELS — write for these and no others: ${channels.map(channelLabel).join(', ')}\n`
    userText += `POSTS THIS WEEK: exactly ${perWeek}\n`
    if (row.primary_goal) userText += `WHAT SOCIAL IS FOR: ${row.primary_goal}\n`
    userText += '\nCONTENT PILLARS — use these names exactly:\n'
    for (const p of pillars) {
      userText += `- ${p.name}${p.why ? ` — ${p.why}` : ''}\n`
      for (const subject of p.subjects ?? []) userText += `    · ${subject}\n`
    }
    if (audience.length) {
      userText += '\nWHO THIS IS FOR:\n'
      for (const a of audience) {
        userText += `- ${a.name}${a.role ? `, ${a.role}` : ''}${a.wants ? ` — wants: ${a.wants}` : ''}`
        userText += a.whereTheyAre ? ` (found on: ${a.whereTheyAre})\n` : '\n'
      }
    }
    userText += `\nWrite the coming week. Return ONLY the JSON object.`

    let text = ''
    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: MODEL,
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking and reply together: this would truncate.
      thinking: { type: 'disabled' },
      max_tokens: MAX_TOKENS,
      system: cachedSystem(SOCIAL_PLAN_STABLE),
      messages: [{ role: 'user', content: [{ type: 'text', text: userText }] }],
    }
    try {
      const message = await meter(
        {
          route: 'social-strategy',
          brandId,
          userId: auth.userId,
          estimateCents: estimateCents({ model: MODEL, inputChars: promptChars(params.system, params.messages), maxOutputTokens: MAX_TOKENS }),
          locale: requestLocale(req),
        },
        async () => {
          const m = await client.messages.create(params)
          return {
            value: m,
            model: MODEL,
            costCents: anthropicCostCents(MODEL, m.usage),
            inputTokens: m.usage.input_tokens,
            outputTokens: m.usage.output_tokens,
          }
        },
      )
      logCacheUsage('social-plan', message.usage)
      text = message.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('')
    } catch (e) {
      if (e instanceof BudgetRefused) return NextResponse.json(refusalBody(e), { status: e.status })
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Generation failed', errorKey: 'social.planFailed' },
        { status: 502 },
      )
    }

    const plan = parsePlan(text)
    if (!planIsUsable(plan)) {
      return NextResponse.json({ error: 'Unreadable plan', errorKey: 'social.planFailed' }, { status: 502 })
    }

    const { error: saveError } = await supabase
      .from('social_strategy')
      .update({
        plan,
        status: 'ready',
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('brand_id', brandId)
    if (saveError) {
      return migrationMissing(saveError)
        ? NextResponse.json(MIGRATION, { status: 400 })
        : NextResponse.json({ error: saveError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, plan })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
