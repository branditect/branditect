import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Update ONE product.
 *
 * Deliberately separate from POST /api/catalog, which deletes every product
 * for the brand and re-inserts them. Routing a single-field edit through that
 * would drop every v6 column it doesn't know about (landed_cost, tax_rate_pct,
 * guardrails, stock) and regenerate every product id along the way.
 */

/** Only these may be written from the drawer. */
const EDITABLE = new Set([
  "name",
  "description",
  "category",
  "sku",
  "barcode",
  "tags",
  "image_url",
  "price_retail",
  "price_rrp",
  "tax_rate_pct",
  "landed_cost",
  "price_cogs",
  "floor_price",
  "max_discount_pct",
  "min_margin_pct",
  "stock_status",
  "stock_units",
]);

const NUMERIC = new Set([
  "price_retail",
  "price_rrp",
  "tax_rate_pct",
  "landed_cost",
  "price_cogs",
  "floor_price",
  "max_discount_pct",
  "min_margin_pct",
  "stock_units",
]);

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, brand_id: brandId, changes } = body as {
      id?: string;
      brand_id?: string;
      changes?: Record<string, unknown>;
    };

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    if (!brandId) return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
    if (!changes || typeof changes !== "object") {
      return NextResponse.json({ error: "changes is required" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(changes)) {
      if (!EDITABLE.has(key)) continue;

      if (NUMERIC.has(key)) {
        // An empty field means "not recorded", which must round-trip as NULL.
        // Coercing it to 0 would be a lie — a zero landed cost reports a 100%
        // margin, which is exactly the kind of fabricated number this page
        // exists to avoid.
        if (value === "" || value === null || value === undefined) {
          patch[key] = null;
        } else {
          const n = Number(value);
          if (Number.isNaN(n)) {
            return NextResponse.json(
              { error: `${key} must be a number` },
              { status: 400 },
            );
          }
          patch[key] = n;
        }
        continue;
      }

      if (key === "tags") {
        patch[key] = Array.isArray(value) ? value : [];
        continue;
      }

      patch[key] = value === "" ? null : value;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "no editable fields supplied" }, { status: 400 });
    }

    patch.updated_at = new Date().toISOString();

    // Scoped by brand_id as well as id so a guessed id can't reach another
    // brand's product.
    const { data, error } = await supabase
      .from("catalog_products")
      .update(patch)
      .eq("id", id)
      .eq("brand_id", brandId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: data });
  } catch (error) {
    console.error("Product PATCH error:", error);
    const message = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
