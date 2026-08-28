"use client";

import { supabase } from "@/lib/supabase";
import { ensureBrand } from "@/lib/brand-bootstrap";
import { startRouteFor } from "@/lib/start-route";
import type { Status } from "@/lib/onboarding";

/**
 * The single decision made after sign-in and sign-up. Nothing linked to /start
 * before this — a new account went straight to an empty /home and never met the
 * questionnaire.
 */
export async function routeAfterAuth(): Promise<string> {
  try {
    const { brandId } = await ensureBrand();
    if (!brandId) return "/start";

    const { data, error } = await supabase
      .from("onboarding")
      .select("status")
      .eq("brand_id", brandId)
      .maybeSingle();

    if (error) {
      console.error("[post-auth] status read failed:", error.message);
      return "/start";
    }

    const status = (data?.status as Status | undefined) ?? null;
    if (status) return startRouteFor({ status, hasStrategy: false });

    const { data: strategy } = await supabase
      .from("brand_strategies")
      .select("id")
      .eq("brand_id", brandId)
      .limit(1)
      .maybeSingle();

    return startRouteFor({ status: null, hasStrategy: Boolean(strategy) });
  } catch (err) {
    // A routing decision must never be what stops someone signing in.
    console.error("[post-auth] falling back to /start:", err);
    return "/start";
  }
}
