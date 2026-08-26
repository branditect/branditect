import { NextRequest, NextResponse } from "next/server";
import { serviceClient as supabase } from "@/lib/supabase-admin";

/**
 * Specifications for one product.
 *
 * Separate from PATCH /api/catalog/product because specs are their own table.
 * They are the values Studio must quote verbatim; the description is the prose
 * it rewrites. One field cannot carry both contracts.
 */

export interface SpecRow { id?: string; key: string; value: string }

/** The product must belong to the brand before anything is written to it. */
async function ownsProduct(productId: string, brandId: string) {
  const { data, error } = await supabase
    .from("catalog_products").select("id").eq("id", productId).eq("brand_id", brandId).maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  return { ok: Boolean(data), error: data ? undefined : "Not this brand's product" };
}

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("product_id");
  const brandId = req.nextUrl.searchParams.get("brand_id");
  if (!productId || !brandId) {
    return NextResponse.json({ error: "product_id and brand_id are required" }, { status: 400 });
  }

  const owned = await ownsProduct(productId, brandId);
  if (!owned.ok) return NextResponse.json({ error: owned.error }, { status: 403 });

  const { data, error } = await supabase
    .from("product_specs").select("id, key, value, sort_order")
    .eq("product_id", productId).order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ specs: data ?? [] });
}

/**
 * Replaces the set for a product by diffing rather than deleting everything and
 * re-inserting: ids survive, so phase-2 reordering has something stable to move,
 * and a failure part-way cannot leave the product with no specs at all.
 *
 * Every write checks its returned error. supabase-js resolves with
 * { data, error } instead of throwing, so a try/catch around these would catch
 * nothing — the bug that left brand_strategies empty.
 */
export async function PUT(req: NextRequest) {
  const { product_id: productId, brand_id: brandId, specs } =
    (await req.json()) as { product_id?: string; brand_id?: string; specs?: SpecRow[] };

  if (!productId || !brandId || !Array.isArray(specs)) {
    return NextResponse.json({ error: "product_id, brand_id and specs are required" }, { status: 400 });
  }

  const owned = await ownsProduct(productId, brandId);
  if (!owned.ok) return NextResponse.json({ error: owned.error }, { status: 403 });

  // A spec with no key has nothing to quote, so it is dropped rather than stored.
  const clean = specs
    .map((s) => ({ id: s.id, key: (s.key ?? "").trim(), value: (s.value ?? "").trim() }))
    .filter((s) => s.key.length > 0);

  const { data: existing, error: readErr } = await supabase
    .from("product_specs").select("id").eq("product_id", productId);
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

  const keepIds = new Set(clean.map((s) => s.id).filter(Boolean) as string[]);
  const toDelete = (existing ?? []).map((r) => r.id as string).filter((id) => !keepIds.has(id));

  const updates = clean.filter((s) => s.id);
  const inserts = clean.filter((s) => !s.id);

  for (let i = 0; i < updates.length; i++) {
    const s = updates[i];
    const { error } = await supabase.from("product_specs")
      .update({ key: s.key, value: s.value, sort_order: clean.indexOf(s) })
      .eq("id", s.id!).eq("product_id", productId);
    if (error) return NextResponse.json({ error: `Row ${i + 1}: ${error.message}` }, { status: 500 });
  }

  if (inserts.length) {
    const { error } = await supabase.from("product_specs").insert(
      inserts.map((s) => ({ product_id: productId, key: s.key, value: s.value, sort_order: clean.indexOf(s) })),
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deletes go last: if anything above failed the old rows are still there.
  if (toDelete.length) {
    const { error } = await supabase.from("product_specs").delete().in("id", toDelete);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: fresh, error: freshErr } = await supabase
    .from("product_specs").select("id, key, value, sort_order")
    .eq("product_id", productId).order("sort_order");
  if (freshErr) return NextResponse.json({ error: freshErr.message }, { status: 500 });

  return NextResponse.json({ specs: fresh ?? [] });
}
