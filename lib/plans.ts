/**
 * The four tiers, as HQ reads them. spec: hq.md "The thing to settle first",
 * hq-accounts.md Part 1 table.
 *
 * The caps that ENFORCE are budget_tier_caps() in supabase/hq-billing.sql.
 * This file mirrors them for display, and lib/plans.test.ts reads the SQL and
 * fails if the two disagree — two sources for one number drift, and the one
 * that drifted would be the one on screen.
 *
 * Storage caps are the ones the pricing page promises (lib/pricing-plans.ts,
 * "cmp.storage"): 200 MB, 5 GB, 20 GB, and agreed for Enterprise.
 */

export type Tier = "free" | "pro" | "pro_plus" | "enterprise";
export type PlanStatus = "active" | "trialing" | "past_due" | "cancelled";

export interface TierCaps {
  creditsCap: number;
  costCapCents: number;
  period: "once" | "month";
  /** null: agreed per contract, no default. */
  storageCapBytes: number | null;
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const TIER_CAPS: Record<Tier, TierCaps> = {
  free: { creditsCap: 100, costCapCents: 220, period: "once", storageCapBytes: 200 * MB },
  pro: { creditsCap: 350, costCapCents: 1100, period: "month", storageCapBytes: 5 * GB },
  pro_plus: { creditsCap: 600, costCapCents: 1800, period: "month", storageCapBytes: 20 * GB },
  // Agreed per contract; until it is, the budget gets Pro Plus's caps.
  enterprise: { creditsCap: 600, costCapCents: 1800, period: "month", storageCapBytes: null },
};

export const TIERS: Tier[] = ["free", "pro", "pro_plus", "enterprise"];
export const STATUSES: PlanStatus[] = ["active", "trialing", "past_due", "cancelled"];

export function isTier(v: unknown): v is Tier {
  return typeof v === "string" && (TIERS as string[]).includes(v);
}
export function isStatus(v: unknown): v is PlanStatus {
  return typeof v === "string" && (STATUSES as string[]).includes(v);
}
