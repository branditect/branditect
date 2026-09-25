/**
 * The plan ladder, in one place.
 *
 * The public pricing page reads this and nothing else, so a price can never be
 * changed in the markup and forgotten in the comparison table two sections
 * below it.
 *
 * SOURCE OF TRUTH, AND A CONFLICT TO SETTLE.
 * branditect-ui/spec/pricing.md is titled "Pricing, a recommendation" and its
 * ladder proposes 44.90 and 59.90 with 550 and 800 credits. The reference page
 * this was built from, and the brief that commissioned it, both carry 29.90
 * and 45.90 with 350 and 600 credits, described as real and current. These are
 * the current numbers. Adopting the recommendation is a one-line change here.
 */

import { translate, type Locale, type StringKey, type Vars } from "./i18n/index.ts";

export interface Plan {
  id: "free" | "pro" | "proplus" | "enterprise";
  name: string;
  who: string;
  /** Shown as-is. Null for the plan that is priced on a call. */
  monthly: string | null;
  /** The monthly figure when billed for a year. */
  yearlyMonthly: string | null;
  /** What the yearly invoice says. */
  yearlyTotal: string | null;
  vatLine: string;
  credits: string;
  creditsLabel: string;
  cta: string;
  href: string;
  featured?: boolean;
  features: string[];
}

export const VAT_RATE = "25.5%";

/**
 * Copy is a dictionary key, or English that has no key yet.
 *
 * Inbox 7b. `{ en: "…" }` is the visible marker for a string still owed by the
 * design side: it renders in English on both sites, and the site gap scan
 * (`npm run i18n:gap:site`) lists it. When its key lands, the wrapper becomes
 * the key and nothing else changes.
 */
type Copy = StringKey | { key: StringKey; vars: Vars } | { en: string };
const text = (locale: Locale, c: Copy) =>
  typeof c === "string" ? translate(locale, c) : "key" in c ? translate(locale, c.key, c.vars) : c.en;

/**
 * A euro amount the way each language writes it.
 *
 * English puts the symbol first with no space and a decimal point: €29.90.
 * Finnish puts it after the number with a space and a decimal comma: 29,90 €.
 * Whole amounts drop the decimals in both: €299, 299 €. Built here from the
 * number rather than by swapping characters in a string, so a price can never
 * come out as "€29,90" or "29.90€".
 */
export function euro(amount: number, locale: Locale): string {
  const n = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return locale === "fi" ? `${n.replace(".", ",")}\u00a0€` : `€${n}`;
}

interface PlanCopy {
  id: Plan["id"];
  name: Copy;
  who: Copy;
  monthly: number | null;
  yearlyMonthly: number | null;
  yearlyTotal: number | null;
  vatLine: Copy;
  credits: Copy;
  creditsLabel: Copy;
  cta: Copy;
  href: string;
  featured?: boolean;
  features: Copy[];
}

const VAT_INCLUDED: Copy = { key: "site.pricing.vatLine", vars: { VAT_RATE } };

const PLAN_COPY: PlanCopy[] = [
  {
    id: "free",
    name: "plan.free.name",
    who: "plan.free.who",
    monthly: 0,
    yearlyMonthly: 0,
    yearlyTotal: null,
    vatLine: "plan.free.vatLine",
    credits: "plan.free.credits",
    creditsLabel: "plan.free.creditsLabel",
    cta: "site.startFree",
    href: "/signup",
    features: ["plan.free.f1", "plan.free.f2", "plan.free.f3", "plan.free.f4", "plan.free.f5", "plan.free.f6"],
  },
  {
    id: "pro",
    // The badge in the app sidebar names the same plan.
    name: "sidebar.pro",
    who: "plan.pro.who",
    monthly: 29.9,
    yearlyMonthly: 24.92,
    yearlyTotal: 299,
    vatLine: VAT_INCLUDED,
    credits: "plan.pro.credits",
    creditsLabel: "plan.everyMonth",
    cta: "plan.pro.cta",
    href: "/signup",
    featured: true,
    features: ["plan.pro.f1", "plan.pro.f2", "plan.pro.f3", "plan.pro.f4", "plan.pro.f5", "plan.pro.f6", "plan.pro.f7"],
  },
  {
    id: "proplus",
    name: "plan.proplus.name",
    who: "plan.proplus.who",
    monthly: 45.9,
    yearlyMonthly: 38.25,
    yearlyTotal: 459,
    vatLine: VAT_INCLUDED,
    credits: "plan.proplus.credits",
    creditsLabel: "plan.everyMonth",
    // The same words as Pro's button, so the same key.
    cta: "plan.pro.cta",
    href: "/signup",
    features: [
      "plan.everythingInPro",
      "plan.proplus.f1",
      "plan.proplus.f2",
      "plan.proplus.f3",
      "plan.proplus.f4",
    ],
  },
  {
    id: "enterprise",
    name: "plan.ent.name",
    who: "plan.ent.who",
    monthly: null,
    yearlyMonthly: null,
    yearlyTotal: null,
    vatLine: "plan.ent.vatLine",
    credits: "plan.ent.credits",
    creditsLabel: "plan.ent.creditsLabel",
    cta: "plan.ent.cta",
    href: "mailto:hello@branditect.io",
    features: ["plan.ent.f1", "plan.ent.f2", "plan.ent.f3", "plan.ent.f4", "plan.ent.f5"],
  },
];

const money = (amount: number | null, locale: Locale) => (amount === null ? null : euro(amount, locale));

/** The plan ladder in one language. */
export function plansIn(locale: Locale): Plan[] {
  return PLAN_COPY.map((p) => ({
    id: p.id,
    name: text(locale, p.name),
    who: text(locale, p.who),
    monthly: money(p.monthly, locale),
    yearlyMonthly: money(p.yearlyMonthly, locale),
    yearlyTotal: money(p.yearlyTotal, locale),
    vatLine: text(locale, p.vatLine),
    credits: text(locale, p.credits),
    creditsLabel: text(locale, p.creditsLabel),
    cta: text(locale, p.cta),
    href: p.href,
    ...(p.featured ? { featured: true } : {}),
    features: p.features.map((f) => text(locale, f)),
  }));
}

/** The English ladder: what the tests and the metadata quote. */
export const PLANS: Plan[] = plansIn("en");

type Row = { label: Copy; values: Record<Plan["id"], Copy | ((l: Locale) => string)> };

const price = (id: Plan["id"]) => (l: Locale) => money(PLAN_COPY.find((p) => p.id === id)!.monthly, l)!;

const COMPARISON_COPY: Row[] = [
  { label: "cmp.price", values: { free: price("free"), pro: price("pro"), proplus: price("proplus"), enterprise: "plan.ent.cta" } },
  { label: "cmp.credits", values: { free: "cmp.onceOnly", pro: "cmp.perMonth350", proplus: "cmp.perMonth600", enterprise: "cmp.agreed" } },
  { label: "cmp.brands", values: { free: { en: "1" }, pro: { en: "1" }, proplus: { en: "3" }, enterprise: "cmp.unlimited" } },
  { label: "cmp.seats", values: { free: { en: "1" }, pro: { en: "1" }, proplus: { en: "3" }, enterprise: "cmp.agreed" } },
  { label: "cmp.storage", values: { free: "plan.storage200mb", pro: "plan.storage5gb", proplus: "plan.storage20gb", enterprise: "cmp.agreed" } },
  { label: "cmp.kitLink", values: { free: "cmp.no", pro: "cmp.yes", proplus: "cmp.yes", enterprise: "cmp.yes" } },
  { label: "cmp.support", values: { free: "cmp.docs", pro: "cmp.email", proplus: "cmp.emailPriority", enterprise: "cmp.namedContact" } },
];

/** The comparison table, so it can never disagree with the cards above it. */
export function comparisonIn(locale: Locale): { label: string; values: Record<Plan["id"], string> }[] {
  const cell = (v: Row["values"][Plan["id"]]) => (typeof v === "function" ? v(locale) : text(locale, v));
  return COMPARISON_COPY.map((r) => ({
    label: text(locale, r.label),
    values: { free: cell(r.values.free), pro: cell(r.values.pro), proplus: cell(r.values.proplus), enterprise: cell(r.values.enterprise) },
  }));
}
export const COMPARISON = comparisonIn("en");

/** What a credit buys. One number, quoted in two places on the page. */
const CREDIT_COPY: { action: StringKey; cost: StringKey }[] = [
  { action: "credit.image", cost: "credit.image.cost" },
  { action: "credit.copy", cost: "credit.copy.cost" },
  { action: "credit.question", cost: "credit.question.cost" },
  { action: "credit.indexing", cost: "credit.indexing.cost" },
];
export function creditCostsIn(locale: Locale) {
  return CREDIT_COPY.map((c) => ({ action: translate(locale, c.action), cost: translate(locale, c.cost) }));
}
export const CREDIT_COSTS = creditCostsIn("en");

/**
 * The top-up, whole. `credit.topUp` carries its own amount in each language's
 * order ("€9 for…", "9 € …"), so nothing here prefixes a symbol onto it.
 */
export const topUpIn = (locale: Locale) => translate(locale, "credit.topUp");
export const TOP_UP = topUpIn("en");
