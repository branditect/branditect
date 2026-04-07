import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alzqwhkkntfritasizzx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Get note
export async function GET(req: NextRequest) {
  const brandId = req.nextUrl.searchParams.get('brandId')
  if (!brandId) return NextResponse.json({ error: 'Missing brandId' }, { status: 400 })

  const { data } = await supabase
    .from('brands')
    .select('templates_note')
    .eq('id', brandId)
    .single()

  return NextResponse.json({ note: data?.templates_note || '' })
}

// Save note
export async function PATCH(req: NextRequest) {
  const { brandId, note } = await req.json()
  if (!brandId) return NextResponse.json({ error: 'Missing brandId' }, { status: 400 })

  const { error } = await supabase
    .from('brands')
    .update({ templates_note: note })
    .eq('id', brandId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
