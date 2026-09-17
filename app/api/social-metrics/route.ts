import { NextRequest, NextResponse } from "next/server";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";
import { isChannel } from "@/lib/social";

/**
 * What actually happened after the posts went out.
 *
 * Typed in by hand, one row per channel per week, and the screen says so:
 * reading these from the platforms means an app registration and a stored
 * token per channel, which is a different piece of work. The shape of what is
 * worth watching does not change when the numbers start arriving by API, so
 * this table is the one either way — which is why it is worth filling in now.
 */

const TABLE_MISSING = {
  error: "Run supabase/social-media.sql in the Supabase SQL editor.",
  errorKey: "social.migrationMissing",
};

/** PostgREST's word for a table that is not there. */
function tableMissing(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || /social_metrics/.test(error.message ?? "");
}

export async function GET(req: NextRequest) {
  const auth = await resolveBrand(req, req.nextUrl.searchParams.get("brandId"));
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { data, error } = await supabase
    .from("social_metrics")
    .select("*")
    .eq("brand_id", auth.brandId)
    .order("week_start", { ascending: false })
    .limit(26);

  if (error) {
    return tableMissing(error)
      ? NextResponse.json({ ...TABLE_MISSING, weeks: [] }, { status: 400 })
      : NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ weeks: data ?? [] });
}

/** A number, or null for a field left blank. Zero is a real answer. */
function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = await resolveBrand(req, body.brandId ?? null);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const brandId = auth.brandId;

  const week = typeof body.week_start === "string" ? body.week_start : "";
  const channel = typeof body.channel === "string" ? body.channel : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) {
    return NextResponse.json({ error: "Missing week", errorKey: "social.needWeek" }, { status: 400 });
  }
  if (!isChannel(channel)) {
    return NextResponse.json({ error: "Not a channel", errorKey: "social.needChannels" }, { status: 400 });
  }

  const row = {
    brand_id: brandId,
    week_start: week,
    channel,
    posts: num(body.posts),
    followers: num(body.followers),
    reach: num(body.reach),
    engagements: num(body.engagements),
    note: typeof body.note === "string" ? body.note.trim() || null : null,
    updated_at: new Date().toISOString(),
  };

  // One row per brand, week and channel — entering the same week twice edits
  // it rather than leaving two rows nobody can tell apart.
  const { data, error } = await supabase
    .from("social_metrics")
    .upsert(row, { onConflict: "brand_id,week_start,channel" })
    .select();

  if (error) {
    return tableMissing(error)
      ? NextResponse.json(TABLE_MISSING, { status: 400 })
      : NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, week: data?.[0] ?? null });
}
