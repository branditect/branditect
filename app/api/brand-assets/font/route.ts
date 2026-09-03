import { NextRequest, NextResponse } from 'next/server'
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { brandId: requested, name, role, google_font_url } = await req.json()
  const auth = await resolveBrand(req, requested ?? null)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
  const brandId = auth.brandId

  const { data, error } = await supabase
    .from('brand_fonts')
    .insert({ brand_id: brandId, name, role, google_font_url })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id: data.id })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const auth = await resolveBrand(req)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  // Scoped by brand as well as id. Deleting by id alone let anyone remove any
  // brand's typeface by guessing a number.
  const { error } = await supabase
    .from('brand_fonts')
    .delete()
    .eq('id', id)
    .eq('brand_id', auth.brandId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
