import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://alzqwhkkntfritasizzx.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function GET(req: NextRequest) {
  const brandId = req.nextUrl.searchParams.get("brand_id") || "vetra";
  const { data, error } = await supabase
    .from("brand_tone")
    .select("*")
    .eq("brand_id", brandId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tone: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brand_id, ...fields } = body;
    const id = brand_id || "vetra";

    // Check if row exists
    const { data: existing } = await supabase
      .from("brand_tone")
      .select("id")
      .eq("brand_id", id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("brand_tone")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("brand_id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("brand_tone")
        .insert({ brand_id: id, ...fields });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to save";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
