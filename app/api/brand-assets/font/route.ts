import { NextRequest, NextResponse } from 'next/server'
import { serviceClient as supabase } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { brandId, name, role, google_font_url } = await req.json()

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

  const { error } = await supabase
    .from('brand_fonts')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
