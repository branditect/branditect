import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://alzqwhkkntfritasizzx.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsenF3aGtrbnRmcml0YXNpenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDIwMzQsImV4cCI6MjA5MDYxODAzNH0.rnOj0oZ5urAQndVAgaNniUKoith7Zl0X3hag7kS5Jq8"
);

export async function GET(req: NextRequest) {
  const brandId = req.nextUrl.searchParams.get("brand_id") || "default";
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
    const id = brand_id || "default";

    // Remove brand_id from fields if it leaked through
    delete (fields as Record<string, unknown>).brand_id;

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
