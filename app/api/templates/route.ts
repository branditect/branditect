import { NextRequest, NextResponse } from 'next/server'
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";

// Create template
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { brand_id: requested, name, platform, url } = body
  const auth = await resolveBrand(req, requested);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const brand_id = auth.brandId

  if (!brand_id || !name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('brand_templates')
    .insert({ brand_id, name, platform, url: url || '' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

// Update template field
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, field, value } = body
  const auth = await resolveBrand(req)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  if (!id || !field) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const validFields = ['name', 'url', 'platform', 'thumbnail_url', 'thumbnail_path']
  if (!validFields.includes(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }

  const { error } = await supabase
    .from('brand_templates')
    .update({ [field]: value })
    .eq('id', id)
    .eq('brand_id', auth.brandId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// Delete template
export async function DELETE(req: NextRequest) {
  const { id, thumbnail_path } = await req.json()
  const auth = await resolveBrand(req)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  if (thumbnail_path) {
    await supabase.storage.from('brand-assets').remove([thumbnail_path])
  }

  const { error } = await supabase
    .from('brand_templates')
    .delete()
    .eq('id', id)
    .eq('brand_id', auth.brandId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
