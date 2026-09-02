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
 * Business profile and running costs — both business-level, stored on
 * brand_financial_rules.
 *
 * Note what this route does NOT do: it never touches catalog_products. The
 * calculators are a sandbox; the product card is the live version, and the
 * only bridge between them is the user pressing save on a product.
 */

const num = (v: unknown): number | null => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export async function GET(req: NextRequest) {
  const brandId = req.nextUrl.searchParams.get("brand_id");
  if (!brandId) {
    return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("brand_financial_rules")
    .select("*")
    .eq("brand_id", brandId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rules: data });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { brand_id: brandId, profile, runningCosts, expectedVolume } = body;
    if (!brandId) {
      return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
    }

    const patch: Record<string, unknown> = { brand_id: brandId };

    if (profile) {
      if (profile.sells) patch.sells = profile.sells;
      if (profile.charges) patch.charges = profile.charges;
      if (Array.isArray(profile.channels)) patch.channels = profile.channels;
    }

    if (runningCosts) {
      // Blank stays null. Zero is a real answer ("we pay no rent"); null means
      // "not told us yet", and the break-even figure has to distinguish them.
      patch.opex_rent = num(runningCosts.rent);
      patch.opex_salaries = num(runningCosts.salaries);
      patch.opex_software = num(runningCosts.software);
      patch.opex_marketing = num(runningCosts.marketing);
      patch.opex_other = num(runningCosts.other);
    }

    if (expectedVolume !== undefined) patch.expected_volume = num(expectedVolume);

    patch.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("brand_financial_rules")
      .upsert(patch, { onConflict: "brand_id" })
      .select()
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rules: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
