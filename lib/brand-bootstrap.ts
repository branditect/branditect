"use client";

import { supabase } from "@/lib/supabase";

/**
 * Every /start screen writes against a brand_id. A brand row was only ever
 * created by the orphaned /onboarding wizard, so a fresh account had none —
 * useBrand resolved to the string "default" and every answer was written to
 * nowhere. Landing a new user on a questionnaire that silently discards their
 * typing is worse than not routing them there at all.
 *
 * Called on sign-in and on entering /start, so it also repairs any account that
 * already exists without a brand.
 */

export interface EnsureBrandResult {
  brandId: string | null;
  created: boolean;
  error?: string;
}

/** "saara@acme.io" → "acme-k3f9". Same shape the old wizard produced. */
export function brandIdFromEmail(email: string | null | undefined): string {
  const local = (email ?? "").split("@")[0] ?? "";
  const slug = local.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${slug || "brand"}-${Math.random().toString(36).slice(2, 6)}`;
}

export function brandNameFromEmail(email: string | null | undefined): string {
  const local = (email ?? "").split("@")[0] ?? "";
  const words = local.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  if (!words) return "Your Brand";
  return words.replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function ensureBrand(): Promise<EnsureBrandResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { brandId: null, created: false };

  const { data: existing, error: readError } = await supabase
    .from("brands")
    .select("brand_id, onboarding_completed")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (readError) return { brandId: null, created: false, error: readError.message };
  if (existing?.brand_id) {
    // useBrand only returns rows with onboarding_completed. That column is the
    // legacy brand-setup flag, not the questionnaire gate — the gate now lives
    // in onboarding.status — so a false here would hide a real brand.
    if (existing.onboarding_completed === false) {
      const { error } = await supabase
        .from("brands")
        .update({ onboarding_completed: true })
        .eq("brand_id", existing.brand_id);
      if (error) return { brandId: existing.brand_id, created: false, error: error.message };
    }
    return { brandId: existing.brand_id, created: false };
  }

  const brandId = brandIdFromEmail(user.email);
  const { error: insertError } = await supabase.from("brands").insert({
    user_id: user.id,
    brand_id: brandId,
    brand_name: brandNameFromEmail(user.email),
    website: null,
    industry: null,
    strategy_method: "skip",
    strategy_text: null,
    logo_url: null,
    colors: null,
    onboarding_completed: true,
  });

  // supabase-js resolves {data, error} and never throws — an unchecked call
  // here would report success while writing nothing.
  if (insertError) return { brandId: null, created: false, error: insertError.message };
  return { brandId, created: true };
}
