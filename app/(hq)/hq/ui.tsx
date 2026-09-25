"use client";

/** Pieces shared by the HQ screens. Every tier chip carries its word as well
 *  as its colour (hq-accounts.md criterion 14). */
import { TIER_LABEL } from "@/lib/hq-view";
import type { Tier } from "@/lib/plans";

export const TIER_CHIP: Record<Tier, { chip: string; dot: string }> = {
  free: { chip: "bg-tile text-ink-2", dot: "bg-faint-2" },
  pro: { chip: "bg-tint-1 text-accent-dark", dot: "bg-accent" },
  pro_plus: { chip: "bg-lavender/60 text-lav-ink", dot: "bg-violet" },
  enterprise: { chip: "bg-blue-wash text-blue-ink", dot: "bg-tier-ent" },
};

export function TierChip({ tier }: { tier: Tier }) {
  const c = TIER_CHIP[tier];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-1 text-[11.5px] font-extrabold ${c.chip}`}>
      <i className={`w-2 h-2 rounded-full flex-none ${c.dot}`} aria-hidden="true" />
      {TIER_LABEL[tier]}
    </span>
  );
}

