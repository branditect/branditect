/** The blocks of one note. Reading only; writes go through PATCH /api/notes. */
import { NextRequest, NextResponse } from "next/server";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await resolveBrand(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const noteId = req.nextUrl.searchParams.get("note_id");
  if (!noteId) return NextResponse.json({ error: "note_id is required" }, { status: 400 });

  const { data: owned } = await supabase
    .from("notes").select("id, title").eq("id", noteId).eq("brand_id", auth.brandId).maybeSingle();
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("note_blocks")
    .select("id, kind, body, image_id, width, caption, source, source_ref, sort_order")
    .eq("note_id", noteId)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: owned, blocks: data ?? [] });
}
