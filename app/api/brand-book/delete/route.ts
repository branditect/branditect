import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alzqwhkkntfritasizzx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function DELETE(req: NextRequest) {
  const { id, table, brandId } = await req.json()

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
