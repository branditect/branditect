import { NextRequest, NextResponse } from "next/server";
import { serviceClient as supabase } from "@/lib/supabase-admin";

/**
 * Uses the service-role client, not the anon one.
 *
 * A route handler carries no user session: nothing in this app sends an
 * Authorization header, so `auth.uid()` is null here. With RLS on the table
 * below, the anon client would read and write nothing and the route would
 * report "not found" for rows that exist. Ownership is enforced by the
 * explicit brand_id scoping on every query instead.
 */

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

/**
 * Remove ONE product, or put one back.
 *
 * Soft delete. `deleted_at` is stamped and the row stays, because the row
 * carries the landed cost, the floor price and the margin guardrails somebody
 * worked out once, and this project has no database backups of any kind.
 *
 * If the column is missing the route refuses rather than falling back to a
 * real DELETE. Silently doing the destructive thing because the safe thing was
 * unavailable is how data goes missing.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");
    const brandId = searchParams.get("brand_id");
    const restore = searchParams.get("restore") === "1";

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    if (!brandId) return NextResponse.json({ error: "brand_id is required" }, { status: 400 });

    // Scoped by brand_id as well as id, so a guessed id cannot reach another
    // brand's product.
    const { data, error } = await supabase
      .from("catalog_products")
      .update({ deleted_at: restore ? null : new Date().toISOString() })
      .eq("id", id)
      .eq("brand_id", brandId)
      .select()
      .maybeSingle();

    if (error) {
      // PGRST204 is "column not found in the schema cache".
      if (/deleted_at/.test(error.message)) {
        console.error("[product DELETE] deleted_at is missing:", error.message);
        return NextResponse.json({
          error: "not_migrated",
          message: "Removing a product needs one more database column. Run supabase/product-delete.sql.",
        }, { status: 501 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // supabase-js resolves { data, error } and never throws, so a missing row
    // arrives here as data === null rather than as a failure.
    if (!data) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json({ product: data, restored: restore });
  } catch (error) {
    console.error("Product DELETE error:", error);
    const message = error instanceof Error ? error.message : "Failed to remove product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
