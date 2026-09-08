/**
 * Notes: the list, and creating one.
 *
 * Step 2 of branditect-ui/spec/studio-notes.md. Every handler resolves the
 * brand from the caller's token and ignores anything the body claims — this
 * route runs on the service key, so a brand_id in the payload would be an
 * instruction to read or write someone else's notes.
 */
import { NextRequest, NextResponse } from "next/server";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";
import { flattenBlocks, type NoteBlock } from "@/lib/notes";

export const dynamic = "force-dynamic";

/** Criterion 1: pinned first, then newest. The bin is not the list. */
export async function GET(req: NextRequest) {
  const auth = await resolveBrand(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { data, error } = await supabase
    .from("notes")
    .select("id, title, flat_text, pinned, collecting, updated_at, created_at")
    .eq("brand_id", auth.brandId)
    .is("deleted_at", null)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  // supabase-js resolves { data, error } and never throws, so an unchecked
  // read here would render an empty library as if the brand had no notes.
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await resolveBrand(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { data, error } = await supabase
    .from("notes")
    .insert({ brand_id: auth.brandId, title: "Untitled" })
    .select("id, title, flat_text, pinned, collecting, updated_at, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data });
}

/**
 * Update a note. Title, pinned and the block list all come through here.
 *
 * CRITERION 11: flat_text is regenerated from the blocks on every block
 * change, never left to a later job. It powers search, the card preview and
 * the brain, and a preview built from stale flat_text is the same lie as a
 * count that does not match its grid.
 */
export async function PATCH(req: NextRequest) {
  const auth = await resolveBrand(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  let body: { id?: string; title?: string; pinned?: boolean; blocks?: NoteBlock[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  // Ownership, before anything is written. A note that is not this brand's is
  // reported as not found rather than forbidden, so probing tells you nothing.
  const { data: owned } = await supabase
    .from("notes").select("id").eq("id", body.id).eq("brand_id", auth.brandId).maybeSingle();
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  // A blank title is skipped rather than written. The backstop matters even
  // though the editor already skips: an empty string here would put an empty
  // line on the card where a name should be.
  if (typeof body.title === "string" && body.title.trim() !== "") {
    patch.title = body.title.trim();
  }
  if (typeof body.pinned === "boolean") patch.pinned = body.pinned;

  if (Array.isArray(body.blocks)) {
    // Replace the block list wholesale. The editor holds the note in memory
    // and sends what it has; diffing here would be a second source of truth
    // about block order.
    const { error: delErr } = await supabase.from("note_blocks").delete().eq("note_id", body.id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    const rows = body.blocks.map((b, i) => ({
      note_id: body.id,
      brand_id: auth.brandId,
      kind: b.kind,
      body: b.body ?? null,
      image_id: b.image_id ?? null,
      width: b.width ?? "full",
      caption: b.caption ?? null,
      source: b.source ?? "manual",
      source_ref: b.source_ref ?? null,
      sort_order: i,
    }));
    if (rows.length) {
      const { error: insErr } = await supabase.from("note_blocks").insert(rows);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
    patch.flat_text = flattenBlocks(body.blocks);
  }

  if (Object.keys(patch).length === 0) return NextResponse.json({ note: null, changed: false });

  const { data, error } = await supabase
    .from("notes").update(patch).eq("id", body.id).eq("brand_id", auth.brandId)
    .select("id, title, flat_text, pinned, collecting, updated_at, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data });
}

/** Criterion 12: a deleted note is restorable for 30 days, so this is soft. */
export async function DELETE(req: NextRequest) {
  const auth = await resolveBrand(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabase
    .from("notes").update({ deleted_at: new Date().toISOString() })
    .eq("id", id).eq("brand_id", auth.brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
