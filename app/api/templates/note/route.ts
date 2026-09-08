import { NextRequest, NextResponse } from 'next/server'
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";

// Get note
export async function GET(req: NextRequest) {
  // Ownership from the caller's token. The query parameter is checked
  // against the brand they own, never trusted as the scope.
  const auth = await resolveBrand(req, req.nextUrl.searchParams.get('brandId'));
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const brandId = auth.brandId;
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
  const { brandId: requested, note } = await req.json()
  const auth = await resolveBrand(req, requested)
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
  const brandId = auth.brandId
  if (!brandId) return NextResponse.json({ error: 'Missing brandId' }, { status: 400 })

  const { error } = await supabase
    .from('brands')
    .update({ templates_note: note })
    .eq('id', brandId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
