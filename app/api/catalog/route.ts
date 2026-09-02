import { NextRequest, NextResponse } from "next/server";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { liveOnly, deletedOnly } from "@/lib/product-delete";

export async function GET(req: NextRequest) {
  try {
    const brandId = req.nextUrl.searchParams.get("brand_id");
    if (!brandId) {
      return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
    }

    const [catalogRes, productsRes, rulesRes] = await Promise.all([
      supabase.from("brand_catalog").select("*").eq("brand_id", brandId).maybeSingle(),
      supabase.from("catalog_products").select("*").eq("brand_id", brandId).order("sort_order"),
      supabase.from("brand_financial_rules").select("*").eq("brand_id", brandId).maybeSingle(),
    ]);

    /* PostgREST expands `*` from its cached schema, and that cache lagged
       behind the pricing migration by more than fifteen minutes. Reading the
       new columns by name in a second query means the Pricing tab gets them
       whatever the cache is doing, and it stops being needed the moment the
       cache catches up without anything having to change. */
    const { data: priceRows } = await supabase
      .from("catalog_products")
      .select("id, price_lines_visible, price_lines_custom, pricing_notes, freight_duty, packaging_cost, licence_cost, labour_per_job, cac, payment_fees, shipping_cost, returns_allowance, platform_fee")
      .eq("brand_id", brandId);
    const byId = new Map((priceRows ?? []).map((r) => [r.id, r]));

    // A removed product is out of the list and out of everything that reads
    // it, including the brand context Studio writes from. It is returned
    // separately so the page can offer it back.
    const rows = (productsRes.data ?? []).map((r) => ({ ...r, ...(byId.get(r.id) ?? {}) }));
    return NextResponse.json({
      catalog: catalogRes.data,
      products: liveOnly(rows),
      deletedProducts: deletedOnly(rows),
      financialRules: rulesRes.data,
    });
  } catch (error) {
    console.error("Catalog GET error:", error);
    return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessTypes, products, financialRules, brand_id: brandId } = body;
    if (!brandId) {
      return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
    }

    // Upsert brand catalog
    await supabase.from("brand_catalog").upsert({
      brand_id: brandId,
      business_types: businessTypes,
      updated_at: new Date().toISOString(),
    }, { onConflict: "brand_id" });

    // Delete existing products and re-insert
    await supabase.from("catalog_products").delete().eq("brand_id", brandId);

    if (products && products.length > 0) {
      const rows = products.map((p: Record<string, unknown>, i: number) => ({
        brand_id: brandId,
        type: p.type,
        name: p.name,
        category: p.category || null,
        description: p.description || null,
        price_rrp: p.price_rrp || null,
        price_wholesale: p.price_wholesale || null,
        price_cogs: p.price_cogs || null,
        price_monthly: p.price_monthly || null,
        price_model: p.price_model || null,
        currency: p.currency || "EUR",
        sku: p.sku || null,
        variants: p.variants || null,
        inclusions: p.inclusions || [],
        ideal_client: p.ideal_client || [],
        delivery_time: p.delivery_time || null,
        capacity_per_month: p.capacity_per_month || null,
        is_active: p.is_active !== false,
        is_hero: p.is_hero || false,
        is_flagship: p.is_flagship || false,
        flag_margin: p.flag_margin !== false,
        sort_order: i,
      }));
      await supabase.from("catalog_products").insert(rows);
    }

    // Upsert financial rules
    if (financialRules) {
      await supabase.from("brand_financial_rules").upsert({
        brand_id: brandId,
        ...financialRules,
        updated_at: new Date().toISOString(),
      }, { onConflict: "brand_id" });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Catalog POST error:", error);
    return NextResponse.json({ error: "Failed to save catalog" }, { status: 500 });
  }
}
