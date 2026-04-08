import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://alzqwhkkntfritasizzx.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsenF3aGtrbnRmcml0YXNpenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDIwMzQsImV4cCI6MjA5MDYxODAzNH0.rnOj0oZ5urAQndVAgaNniUKoith7Zl0X3hag7kS5Jq8"
);

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

    return NextResponse.json({
      catalog: catalogRes.data,
      products: productsRes.data || [],
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
