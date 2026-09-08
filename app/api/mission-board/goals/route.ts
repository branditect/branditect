import { NextRequest, NextResponse } from 'next/server'
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  // Ownership from the caller's token. The query parameter is checked
  // against the brand they own, never trusted as the scope.
  const auth = await resolveBrand(req, req.nextUrl.searchParams.get('brandId'));
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const brandId = auth.brandId;
  if (!brandId) return NextResponse.json({ error: 'Missing brandId' }, { status: 400 })

  const { data, error } = await supabase
    .from('mission_goals')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { brandId: requested, title, dueDate, category } = body
  const auth = await resolveBrand(req, requested)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
  const brandId = auth.brandId

  const { data, error } = await supabase
    .from('mission_goals')
    .insert({
      brand_id: brandId,
      title,
      due_date: dueDate || null,
      category: category || 'general',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...fields } = body
  const auth = await resolveBrand(req)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('mission_goals')
    .update(fields)
    .eq('id', id)
      .eq('brand_id', auth.brandId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const auth = await resolveBrand(req)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const { error } = await supabase
    .from('mission_goals')
    .delete()
    .eq('id', id)
      .eq('brand_id', auth.brandId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
