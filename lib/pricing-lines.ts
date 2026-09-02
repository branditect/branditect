/**
 * The Pricing tab's model.
 *
 * A line belongs to one group, a group carries its own total, and a product
 * shows only the lines that apply to it. The old tab showed the same five
 * fields to everything, which is why a digital product was asked for freight.
 *
 * Formulas are ported from lib/numbers.ts, not rewritten. The house rule in
 * CLAUDE.md holds: margins are net of tax, against landed cost.
 */

import { netPrice, marginPct } from "./numbers.ts";

export type LineGroup = "in" | "goods" | "sell";
export type LineId =
  | "retail" | "rrp" | "tax"
  | "unit" | "freight" | "pack" | "licence" | "labour"
  | "cac" | "fees" | "ship" | "returns" | "platform";

export interface LineDef {
  id: LineId;
  label: string;
  group: LineGroup;
  /** The catalog_products column this reads and writes. */
  column: string;
  /** Retail, RRP and tax are inputs, not costs, and are never summed as one. */
  isCost: boolean;
  hint?: string;
}

export const GROUPS: { id: LineGroup; label: string; note: string }[] = [
  { id: "in", label: "What comes in", note: "What the customer pays, and the tax inside it." },
  { id: "goods", label: "Cost of goods", note: "What the thing costs you before you sell it." },
  { id: "sell", label: "Cost to sell", note: "What it costs to get that sale, per sale." },
];

export const LINES: LineDef[] = [
  { id: "retail", label: "Retail price", group: "in", column: "price_retail", isCost: false },
  { id: "rrp", label: "RRP", group: "in", column: "price_rrp", isCost: false },
  { id: "tax", label: "Tax rate", group: "in", column: "tax_rate_pct", isCost: false, hint: "%" },

  // "Unit cost" is the old "factory cost". The column keeps its name.
  { id: "unit", label: "Unit cost", group: "goods", column: "price_cogs", isCost: true,
    hint: "What the supplier charges" },
  { id: "freight", label: "Freight & duty", group: "goods", column: "freight_duty", isCost: true },
  { id: "pack", label: "Packaging", group: "goods", column: "packaging_cost", isCost: true },
  { id: "licence", label: "Licence cost", group: "goods", column: "licence_cost", isCost: true },
  { id: "labour", label: "Labour per job", group: "goods", column: "labour_per_job", isCost: true },

  { id: "cac", label: "CAC", group: "sell", column: "cac", isCost: true,
    hint: "What one customer costs to win" },
  { id: "fees", label: "Payment fees", group: "sell", column: "payment_fees", isCost: true },
  { id: "ship", label: "Shipping to customer", group: "sell", column: "shipping_cost", isCost: true },
  { id: "returns", label: "Returns allowance", group: "sell", column: "returns_allowance", isCost: true },
  { id: "platform", label: "Platform fee", group: "sell", column: "platform_fee", isCost: true },
];

export function lineDef(id: string): LineDef | null {
  return LINES.find((l) => l.id === id) ?? null;
}

/** A line the business added itself. Stored in price_lines_custom as JSONB. */
export interface CustomLine {
  label: string;
  value: number | null;
  group: LineGroup;
}

export function parseCustomLines(raw: unknown): CustomLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
    .map((r) => ({
      label: typeof r.label === "string" ? r.label.trim() : "",
      value: typeof r.value === "number" && Number.isFinite(r.value) ? r.value : null,
      group: (["in", "goods", "sell"] as const).includes(r.group as LineGroup)
        ? (r.group as LineGroup) : "sell",
    }))
    .filter((l) => l.label.length > 0);
}

/* ------------------------------------------------------------------ */
/*  Presets                                                            */
/* ------------------------------------------------------------------ */

export type Preset = "physical" | "digital" | "service";

export const PRESETS: Record<Preset, LineId[]> = {
  physical: ["retail", "tax", "unit", "freight", "pack", "fees", "ship", "returns"],
  digital: ["retail", "tax", "licence", "cac", "fees", "platform"],
  service: ["retail", "tax", "labour", "cac", "fees"],
};

export const PRESET_LABELS: Record<Preset, string> = {
  physical: "Physical goods", digital: "Digital", service: "Service",
};

/** catalog_products.type, or the brand's track, mapped onto a preset. */
export function presetForTrack(track: string | null | undefined): Preset {
  const t = (track ?? "").toLowerCase();
  if (t.includes("saas") || t.includes("digital") || t.includes("subscription")) return "digital";
  if (t.includes("service")) return "service";
  return "physical";
}

/**
 * NULL means "use the preset", so a product that predates this feature renders
 * something sensible instead of an empty tab.
 */
export function visibleLines(stored: string[] | null | undefined, track?: string | null): LineId[] {
  if (Array.isArray(stored)) {
    const known = stored.filter((id): id is LineId => Boolean(lineDef(id)));
    return known;
  }
  return PRESETS[presetForTrack(track)];
}

/* ------------------------------------------------------------------ */
/*  Totals                                                             */
/* ------------------------------------------------------------------ */

export type Values = Record<string, number | null | undefined>;

/**
 * A group's total counts its VISIBLE cost lines only.
 *
 * Hiding a line does not delete its value, so a hidden number must not keep
 * being counted. That is the whole point of hiding it.
 */
export function groupTotal(
  group: LineGroup, visible: LineId[], values: Values, custom: CustomLine[] = [],
): number | null {
  const ids = LINES.filter((l) => l.group === group && l.isCost && visible.includes(l.id));
  const customInGroup = custom.filter((c) => c.group === group);
  const parts = [
    ...ids.map((l) => values[l.column]),
    ...customInGroup.map((c) => c.value),
  ].filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!parts.length) return null;
  return parts.reduce((a, b) => a + b, 0);
}

export const cogsTotal = (v: LineId[], vals: Values, c: CustomLine[] = []) => groupTotal("goods", v, vals, c);
export const sellTotal = (v: LineId[], vals: Values, c: CustomLine[] = []) => groupTotal("sell", v, vals, c);

/* ------------------------------------------------------------------ */
/*  The two margins                                                    */
/* ------------------------------------------------------------------ */

export interface MarginResult {
  pct: number;
  cash: number;
  /** True when a tax rate was missing and zero had to be assumed. */
  assumedNoTax: boolean;
}

function retailAndTax(values: Values): { retail: number; tax: number; assumed: boolean } | null {
  const retail = values.price_retail ?? values.price_rrp;
  if (typeof retail !== "number" || !Number.isFinite(retail) || retail <= 0) return null;
  const raw = values.tax_rate_pct;
  const known = typeof raw === "number" && Number.isFinite(raw);
  return { retail, tax: known ? raw : 0, assumed: !known };
}

/**
 * Gross margin: net of tax, against cost of goods only.
 *
 * Cost to sell is deliberately excluded. Folding CAC in here would understate
 * gross margin on every product and quietly break the rule CLAUDE.md sets.
 */
export function grossMargin(visible: LineId[], values: Values, custom: CustomLine[] = []): MarginResult | null {
  const base = retailAndTax(values);
  if (!base) return null;
  const cogs = cogsTotal(visible, values, custom);
  if (cogs == null) return null;
  return {
    pct: marginPct(base.retail, base.tax, cogs),
    cash: netPrice(base.retail, base.tax) - cogs,
    assumedNoTax: base.assumed,
  };
}

/** Contribution: after cost of goods AND cost to sell. */
export function contributionMargin(
  visible: LineId[], values: Values, custom: CustomLine[] = [],
): MarginResult | null {
  const base = retailAndTax(values);
  if (!base) return null;
  const cogs = cogsTotal(visible, values, custom);
  if (cogs == null) return null;
  const sell = sellTotal(visible, values, custom) ?? 0;
  const variable = cogs + sell;
  return {
    pct: marginPct(base.retail, base.tax, variable),
    cash: netPrice(base.retail, base.tax) - variable,
    assumedNoTax: base.assumed,
  };
}

/** What the card writes back to landed_cost, which is now derived. */
export function derivedLandedCost(visible: LineId[], values: Values, custom: CustomLine[] = []): number | null {
  return cogsTotal(visible, values, custom);
}

/**
 * Hiding a line must not delete its value. This returns the next visible set
 * and never touches the values, so turning a line back on finds its number
 * still there. There is no undo on a form field.
 */
export function toggleLine(visible: LineId[], id: LineId): LineId[] {
  return visible.includes(id) ? visible.filter((x) => x !== id) : [...visible, id];
}
