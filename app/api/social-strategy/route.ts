import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alzqwhkkntfritasizzx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

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
    supabase.from('brand_strategies').select('generated_strategy').eq('brand_id', brandId).is('section_positioning', null).order('created_at', { ascending: false }).limit(1).maybeSingle(),
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
      archetype = parsed?.archetype ?? null
      voiceDescription = parsed?.voiceDescription ?? null
      personasCount = Array.isArray(parsed?.personas) ? parsed.personas.length : 0
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
  const brandId = req.nextUrl.searchParams.get('brandId')
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
])

export async function POST(req: NextRequest) {
  const body = await req.json()
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

    const patch: Record<string, unknown> = {
      [field]: value,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('social_strategy')
      .update(patch)
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'reset') {
    const { id } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const { error } = await supabase.from('social_strategy').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'generate') {
    // Step 2 will implement the full Claude synthesis.
    // For now we just record the answers and return a placeholder.
    const { id } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await supabase
      .from('social_strategy')
      .update({ status: 'awaiting_synthesis', updated_at: new Date().toISOString() })
      .eq('id', id)
    return NextResponse.json({
      ok: true,
      pending: true,
      message: 'Synthesis layer ships in step 2 — your answers are saved.',
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
