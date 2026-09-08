import { NextRequest, NextResponse } from 'next/server'
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";

export async function DELETE(req: NextRequest) {
  const { id, table, brandId: requested } = await req.json()
  // The brand comes from the caller's token; the body is only checked.
  const auth = await resolveBrand(req, requested);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const brandId = auth.brandId

  if (!id || !table || !brandId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const validTables = ['brand_book_pages', 'brand_book_assets', 'brand_book_colors']
  if (!validTables.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  }

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('brand_id', brandId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
