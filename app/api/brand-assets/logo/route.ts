import { NextRequest, NextResponse } from "next/server";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";
import { storagePathFromUrl } from "@/lib/brand-colors";

/**
 * Removing a logo.
 *
 * Uploading one has existed since Visual identity took the controls off
 * Studio; taking one away had not, so a logo uploaded into the wrong slot — or
 * an old mark after a redesign — stayed on the page with no way to remove it.
 * Replacing is the same upload again: /api/brand-assets/upload upserts on
 * (brand_id, slot), so a second file in a slot overwrites the first.
 *
 * The stored object goes with the row. A file nobody can reach through the app
 * is still a file the brand is paying to store, and a logo is the one asset
 * most likely to be replaced because it is wrong.
 */
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // The brand comes from the caller's token; the body is only a request.
  const auth = await resolveBrand(req, body.brandId ?? null);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const brandId = auth.brandId;

  const slot = typeof body.slot === "string" ? body.slot : null;
  const id = body.id ?? null;
  if (!slot && !id) return NextResponse.json({ error: "Missing slot or id" }, { status: 400 });

  const query = supabase.from("brand_logos").select("id, file_url, slot").eq("brand_id", brandId);
  const { data: rows, error: readError } = id ? await query.eq("id", id) : await query.eq("slot", slot!);
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: "No such logo for this brand" }, { status: 404 });
  }

  const { error } = await supabase
    .from("brand_logos").delete().eq("brand_id", brandId).in("id", rows.map((r) => r.id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // The sidebar and topbar read brands.logo_url. Leaving it pointing at a file
  // that has just been deleted is a broken image on every screen.
  if (rows.some((r) => r.slot === "primary")) {
    await supabase.from("brands").update({ logo_url: null }).eq("brand_id", brandId);
  }

  const paths = rows.map((r) => storagePathFromUrl(r.file_url)).filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from("brand-assets").remove(paths);

  return NextResponse.json({ success: true, removed: rows.length });
}
