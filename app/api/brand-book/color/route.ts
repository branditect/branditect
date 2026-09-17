import { NextRequest, NextResponse } from 'next/server'
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { brandId: requested, hex, name } = await req.json()
  const auth = await resolveBrand(req, requested ?? null)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
  const brandId = auth.brandId

  const { data, error } = await supabase
    .from('brand_book_colors')
    .insert({ brand_id: brandId, hex, name })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id: data.id })
}

/**
 * Change a colour that is already saved.
 *
 * Adding a wrong hex used to mean deleting the swatch and adding it again,
 * which loses its place in the list. The brand comes from the caller's token,
 * and the row is matched on brand as well as id so a guessed id cannot reach
 * another brand's palette.
 *
 * Hex and name only: the live brand_book_colors has id, brand_id, hex, name
 * and created_at, and nothing else. The role, grouping and css_value columns
 * that supabase/*.sql declares do not exist there, and naming one in an update
 * fails the whole write.
 */
export async function PATCH(req: NextRequest) {
  const { id, brandId: requested, hex, name } = await req.json()
  const auth = await resolveBrand(req, requested ?? null)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
  const brandId = auth.brandId
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const fields: Record<string, string | null> = {}
  if (typeof hex === 'string') fields.hex = hex
  if (typeof name === 'string') fields.name = name
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('brand_book_colors')
    .update(fields)
    .eq('id', id)
    .eq('brand_id', brandId)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // No row means the id is not this brand's. Say so rather than reporting a
  // save that changed nothing.
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'No such colour for this brand' }, { status: 404 })
  }
  return NextResponse.json({ success: true, color: data[0] })
}
