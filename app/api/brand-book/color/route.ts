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
