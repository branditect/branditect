"use client";

import { supabase } from "@/lib/supabase";
import { EMPTY_ONBOARDING, fromRow, mergeState, toRow, type OnboardingState } from "@/lib/onboarding";
import { OnboardingWriter, readMirror, type SaveState, type WriteResult } from "@/lib/onboarding-store";

/**
 * The Supabase half of onboarding persistence.
 *
 * Kept apart from onboarding-store.ts so the debounce and retry logic can be
 * unit-tested without constructing a database client.
 */

/**
 * One row per brand: upsert on brand_id, never insert. Returns the error rather
 * than throwing it, and callers must not treat a missing throw as success.
 */
export async function writeOnboarding(
  state: OnboardingState, brandId: string, userId: string | null,
): Promise<WriteResult> {
  const { error } = await supabase
    .from("onboarding")
    .upsert(toRow(state, brandId, userId), { onConflict: "brand_id" });

  if (error) {
    console.error("[onboarding] write failed:", error.message, error.details ?? "");
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function loadOnboarding(brandId: string): Promise<{ state: OnboardingState; error?: string }> {
  const { data, error } = await supabase
    .from("onboarding").select("*").eq("brand_id", brandId).maybeSingle();

  if (error) {
    console.error("[onboarding] load failed:", error.message);
    // Fall back to the mirror so a network blip does not look like a blank form.
    const local = readMirror(brandId);
    return { state: local ?? { ...EMPTY_ONBOARDING }, error: error.message };
  }
  return { state: mergeState(fromRow(data), readMirror(brandId)) };
}

/** Wires the real writer to the real database. */
export function createOnboardingWriter(
  brandId: string, userId: string | null, onSaveState: (s: SaveState) => void,
): OnboardingWriter {
  return new OnboardingWriter(brandId, userId, onSaveState, writeOnboarding);
}
