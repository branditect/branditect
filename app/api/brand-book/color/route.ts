import { NextRequest, NextResponse } from 'next/server'
import { serviceClient as supabase } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { brandId, hex, name } = await req.json()

  const { data, error } = await supabase
    .from('brand_book_colors')
    .insert({ brand_id: brandId, hex, name })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id: data.id })
}
