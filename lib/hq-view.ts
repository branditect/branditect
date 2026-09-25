/**
 * HQ · Accounts — turning hq_accounts() rows into what the screen shows.
 * spec: hq-accounts.md Part 2. Pure, so criteria 12–14 are testable without
 * a browser (lib/hq-view.test.ts).
 *
 * Nothing on this screen is colour alone (criterion 14): every tier carries its
 * word, every status a word or a number. The `tone` fields below pick a colour;
 * the `label` fields carry the meaning.
 */

import { computeReadiness, questionnairePassed } from "./readiness.ts";
import { TIER_CAPS, type PlanStatus, type Tier } from "./plans.ts";
import type { Status } from "./onboarding.ts";

/** One row of hq_accounts(), as the database returns it. Metadata only. */
export interface AccountRow {
  brand_id: string;
  brand_name: string | null;
  owner_email: string | null;
  signed_up_at: string | null;
  last_active_at: string | null;
  active_days: string[];
  tier: Tier;
  status: PlanStatus;
  mrr_cents: number;
  trial_ends_at: string | null;
  storage_cap_bytes_override: number | null;
  credits_cap: number | null;
  credits_used: number | null;
  cost_cap_cents: number | null;
  cost_used_cents: number | string | null;
  period: "once" | "month" | null;
  storage_bytes: number;
  storage_files: number;
  questionnaire_status: Status | null;
  documents: number;
  presentations: number;
  links: number;
  brand_images: number;
  has_guideline: boolean;
  cost_credits_30d: number | string;
  cost_indexing_30d: number | string;
  cost_failures_30d: number | string;
  generations_30d: number;
  generation_failures_30d: number;
  indexed_30d: number;
  events_7d: number;
  failures_7d: number;
  cost_month_cents: number | string;
}

export type Tone = "ok" | "warn" | "bad" | "none";

export const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro Plus",
  enterprise: "Enterprise",
};

export const STATUS_LABEL: Record<PlanStatus, string> = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Past due",
  cancelled: "Cancelled",
};

const num = (v: number | string | null | undefined) => Number(v ?? 0) || 0;

export interface AccountView {
  brandId: string;
  name: string;
  email: string;
  initials: string;
  tier: Tier;
  tierLabel: string;
  status: PlanStatus;
  statusLabel: string;
  trialDaysLeft: number | null;
  signedUpAt: string | null;
  lastActiveAt: string | null;
  lastActive: { label: string; tone: "recent" | "cold" | "dead" | "never" };
  activity14: number[];
  readiness: number;
  readinessChecks: number;
  gateCleared: boolean;
  storageBytes: number;
  storageCapBytes: number | null;
  storagePct: number | null;
  creditsUsed: number;
  creditsCap: number;
  creditsPct: number;
  creditsCapped: boolean;
  costCents: number;
  costSplit: { credits: number; indexing: number; failures: number };
  revenueCents: number;
  ratio: { pct: number | null; tone: Tone; label: string; why: string | null };
  failureRate7d: number | null;
}

function initials(name: string): string {
  return name
    .replace(/[^A-Za-z0-9\u00C0-\u024F ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";
}

export function daysAgo(iso: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  return Math.floor((now - Date.parse(iso)) / 86_400_000);
}

export function lastActiveLabel(iso: string | null, now = Date.now()): AccountView["lastActive"] {
  const d = daysAgo(iso, now);
  if (d === null) return { label: "Never", tone: "never" };
  if (d <= 0) return { label: "Today", tone: "recent" };
  if (d === 1) return { label: "Yesterday", tone: "recent" };
  if (d <= 7) return { label: `${d} days ago`, tone: "recent" };
  if (d <= 30) return { label: `${d} days ago`, tone: "cold" };
  return { label: `${d} days ago`, tone: "dead" };
}

/** 14 slots, oldest first: 1 when the brand was active that day. */
export function activity14(days: string[], now = Date.now()): number[] {
  const set = new Set(days.map((d) => d.slice(0, 10)));
  const out: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
    out.push(set.has(d) ? 1 : 0);
  }
  return out;
}

/**
 * Cost vs revenue. Green under 30%, amber to 60%, red above (spec). A free
 * account has no revenue, so it reads "Free · no revenue" rather than a
 * meaningless percentage, and sorts separately (criterion 13). Under amber or
 * red, one line of why.
 */
export function costRatio(r: AccountRow, costCents: number): AccountView["ratio"] {
  const revenue = num(r.mrr_cents);
  if (revenue <= 0) {
    return { pct: null, tone: "warn", label: "Free · no revenue", why: null };
  }
  const pct = Math.round((costCents / revenue) * 100);
  const tone: Tone = pct < 30 ? "ok" : pct <= 60 ? "warn" : "bad";
  return { pct, tone, label: `${pct}%`, why: tone === "ok" ? null : whyLine(r) };
}

/** The one line that says which problem a bad ratio is. */
export function whyLine(r: AccountRow): string | null {
  const failures = num(r.generation_failures_30d);
  const gens = num(r.generations_30d);
  const failRate = gens > 0 ? failures / gens : 0;
  const idx = num(r.cost_indexing_30d);
  const cred = num(r.cost_credits_30d);
  const fail = num(r.cost_failures_30d);
  if (failRate >= 0.2 && fail >= Math.max(idx, cred) * 0.5) {
    return `${Math.round(failRate * 100)}% of generations failed`;
  }
  if (idx >= cred && idx >= fail && num(r.indexed_30d) > 0) {
    return `indexed ${num(r.indexed_30d)} documents`;
  }
  if (fail > cred) return `${failures} failed generations`;
  return gens > 0 ? `${gens} generations` : null;
}

export function toView(r: AccountRow, now = Date.now()): AccountView {
  const name = r.brand_name || r.brand_id;
  const caps = TIER_CAPS[r.tier] ?? TIER_CAPS.free;
  const creditsCap = r.credits_cap ?? caps.creditsCap;
  // Criterion 12: a rendered row never shows more credits used than the cap.
  // The database CHECK makes that impossible; this makes it impossible to draw.
  const rawUsed = r.credits_used ?? 0;
  const creditsUsed = Math.min(rawUsed, creditsCap);
  const storageCapBytes = r.storage_cap_bytes_override ?? caps.storageCapBytes;
  const split = {
    credits: num(r.cost_credits_30d),
    indexing: num(r.cost_indexing_30d),
    failures: num(r.cost_failures_30d),
  };
  const cost = split.credits + split.indexing + split.failures;
  const readiness = computeReadiness({
    questionnaireComplete: questionnairePassed(r.questionnaire_status),
    knowledgeFileCount: num(r.documents) + num(r.presentations) + num(r.links),
    brandImageCount: num(r.brand_images),
    hasBrandGuideline: !!r.has_guideline,
  });
  const trialDaysLeft = r.status === "trialing" && r.trial_ends_at
    ? Math.max(0, Math.ceil((Date.parse(r.trial_ends_at) - now) / 86_400_000))
    : null;
  return {
    brandId: r.brand_id,
    name,
    email: r.owner_email ?? "",
    initials: initials(name),
    tier: r.tier,
    tierLabel: TIER_LABEL[r.tier] ?? r.tier,
    status: r.status,
    statusLabel: STATUS_LABEL[r.status] ?? r.status,
    trialDaysLeft,
    signedUpAt: r.signed_up_at,
    lastActiveAt: r.last_active_at,
    lastActive: lastActiveLabel(r.last_active_at, now),
    activity14: activity14(r.active_days ?? [], now),
    readiness: readiness.score,
    readinessChecks: readiness.passedCount,
    gateCleared: questionnairePassed(r.questionnaire_status),
    storageBytes: num(r.storage_bytes),
    storageCapBytes,
    storagePct: storageCapBytes ? Math.min(100, Math.round((num(r.storage_bytes) / storageCapBytes) * 100)) : null,
    creditsUsed,
    creditsCap,
    creditsPct: creditsCap > 0 ? Math.min(100, Math.round((creditsUsed / creditsCap) * 100)) : 0,
    creditsCapped: creditsCap > 0 && creditsUsed >= creditsCap,
    costCents: cost,
    costSplit: split,
    revenueCents: num(r.mrr_cents),
    ratio: costRatio(r, cost),
    failureRate7d: num(r.events_7d) > 0 ? num(r.failures_7d) / num(r.events_7d) : null,
  };
}

export type SortKey =
  | "ratio" | "name" | "tier" | "signedUp" | "lastActive" | "readiness" | "storage" | "credits" | "cost";

const TIER_ORDER: Record<Tier, number> = { free: 0, pro: 1, pro_plus: 2, enterprise: 3 };

/**
 * Sorting. Default: cost vs revenue, worst first. Free accounts have no ratio
 * and sort as their own group AFTER every paid account (never as infinity at
 * the top), ordered among themselves by what they cost (criterion 13).
 */
export function sortAccounts(rows: AccountView[], key: SortKey = "ratio", dir: "desc" | "asc" = "desc"): AccountView[] {
  const sign = dir === "desc" ? -1 : 1;
  const val = (a: AccountView): number | string => {
    switch (key) {
      case "name": return a.name.toLowerCase();
      case "tier": return TIER_ORDER[a.tier];
      case "signedUp": return a.signedUpAt ? Date.parse(a.signedUpAt) : 0;
      case "lastActive": return a.lastActiveAt ? Date.parse(a.lastActiveAt) : 0;
      case "readiness": return a.readiness;
      case "storage": return a.storageBytes;
      case "credits": return a.creditsUsed;
      case "cost": return a.costCents;
      default: return a.ratio.pct ?? 0;
    }
  };
  return [...rows].sort((a, b) => {
    if (key === "ratio") {
      const aFree = a.ratio.pct === null, bFree = b.ratio.pct === null;
      if (aFree !== bFree) return aFree ? 1 : -1; // paid first, free as their own group
      if (aFree && bFree) return b.costCents - a.costCents;
    }
    const va = val(a), vb = val(b);
    if (va < vb) return -1 * sign;
    if (va > vb) return 1 * sign;
    return a.name.localeCompare(b.name);
  });
}

export function filterAccounts(
  rows: AccountView[],
  q: string,
  tier: Tier | "all",
  status: PlanStatus | "any",
): AccountView[] {
  const needle = q.trim().toLowerCase();
  return rows.filter((r) =>
    (tier === "all" || r.tier === tier) &&
    (status === "any" || r.status === status) &&
    (!needle || r.name.toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle) || r.brandId.includes(needle)),
  );
}

export interface Attention {
  tone: "warn" | "bad";
  brandId: string | null;
  text: string;
}

/** Needs attention: what to do this morning (hq.md §1). */
export function needsAttention(views: AccountView[], rows: AccountRow[], now = Date.now()): Attention[] {
  const out: Attention[] = [];
  const byId = new Map(rows.map((r) => [r.brand_id, r]));
  for (const v of views) {
    const r = byId.get(v.brandId)!;
    const month = num(r.cost_month_cents);
    if (v.revenueCents > 0 && month > v.revenueCents) {
      out.push({ tone: "bad", brandId: v.brandId,
        text: `${v.name} cost ${euros(month)} this month on a ${euros(v.revenueCents)} account.${v.ratio.why ? ` It ${v.ratio.why}.` : ""}` });
    }
    if (v.trialDaysLeft !== null && v.trialDaysLeft <= 3) {
      out.push({ tone: "warn", brandId: v.brandId, text: `${v.name} trial ends in ${v.trialDaysLeft} ${v.trialDaysLeft === 1 ? "day" : "days"}.` });
    }
    if (v.failureRate7d !== null && v.failureRate7d > 0.2 && num(r.events_7d) >= 5) {
      out.push({ tone: "bad", brandId: v.brandId,
        text: `${v.name} has a ${Math.round(v.failureRate7d * 100)}% failure rate this week. Failures are never charged to the customer, so every one is ours.` });
    }
  }
  const stuck = views.filter((v) => !v.gateCleared && v.signedUpAt && (daysAgo(v.signedUpAt, now) ?? 0) > 7).length;
  if (stuck > 0) {
    out.push({ tone: "warn", brandId: null,
      text: `${stuck} ${stuck === 1 ? "signup" : "signups"} older than 7 days never cleared the questionnaire gate.` });
  }
  return out;
}

export function euros(cents: number): string {
  const v = cents / 100;
  return `€${v >= 100 ? v.toFixed(0) : v.toFixed(2)}`;
}

export function bytes(n: number): string {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(n >= 100 * 1024 ** 2 ? 0 : 1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

/** CSV of what the table shows. Metadata only, same as the screen. */
export function toCsv(views: AccountView[]): string {
  const head = ["brand_id", "brand", "owner", "tier", "status", "signed_up", "last_active", "readiness",
    "storage_bytes", "credits_used", "credits_cap", "cost_30d_eur", "revenue_eur", "cost_vs_revenue"];
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = views.map((v) => [
    v.brandId, v.name, v.email, v.tierLabel, v.statusLabel, v.signedUpAt ?? "", v.lastActiveAt ?? "",
    v.readiness, v.storageBytes, v.creditsUsed, v.creditsCap, (v.costCents / 100).toFixed(2),
    (v.revenueCents / 100).toFixed(2), v.ratio.label,
  ].map(esc).join(","));
  return [head.join(","), ...lines].join("\n");
}
