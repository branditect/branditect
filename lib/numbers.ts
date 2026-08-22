/**
 * Numbers — the per-sale and per-month maths.
 *
 * Ported from docs/handoff/spec/numbers.md. Ported, not rewritten: two of
 * these are easy to get subtly wrong in the flattering direction, and the
 * spec's versions are the agreed ones.
 *
 * Two altitudes, kept apart on purpose:
 *   per sale  — variable, moves with volume
 *   per month — fixed, paid whether you sell one or a thousand
 * Mixing them is how someone ends up subtracting rent from a unit price.
 */

/** Net of tax. Every margin calculation starts here. */
export function netPrice(retailGross: number, taxRatePct: number): number {
  return retailGross / (1 + taxRatePct / 100);
}

/** Per-sale contribution: what one sale leaves toward overhead and profit. */
export function contribution(
  retailGross: number,
  taxRatePct: number,
  variableCost: number,
): number {
  return netPrice(retailGross, taxRatePct) - variableCost;
}

export function marginPct(
  retailGross: number,
  taxRatePct: number,
  variableCost: number,
): number {
  const net = netPrice(retailGross, taxRatePct);
  return net === 0 ? 0 : ((net - variableCost) / net) * 100;
}

/**
 * Units per month needed just to cover fixed costs.
 *
 * Returns Infinity when a sale contributes nothing — the caller must render
 * "this never breaks even at this price", not the symbol.
 */
export function breakEvenUnits(monthlyOpEx: number, contributionPerSale: number): number {
  if (contributionPerSale <= 0) return Infinity;
  return Math.ceil(monthlyOpEx / contributionPerSale);
}

export function operatingProfit(
  volume: number,
  contributionPerSale: number,
  monthlyOpEx: number,
): number {
  return volume * contributionPerSale - monthlyOpEx;
}

/**
 * Floor price has TWO tests. Take the higher.
 *
 * Minimum margin alone is only half a floor: a price can clear the margin
 * target and still not cover overhead at the volume actually sold.
 */
export function floorPrice(opts: {
  variableCost: number;
  taxRatePct: number;
  minMarginPct: number;
  monthlyOpEx: number;
  expectedVolume: number;
}): number {
  const marginFloorNet = opts.variableCost / (1 - opts.minMarginPct / 100);
  const breakEvenNet = opts.variableCost + opts.monthlyOpEx / Math.max(opts.expectedVolume, 1);
  return Math.max(marginFloorNet, breakEvenNet) * (1 + opts.taxRatePct / 100);
}

/** Which of the two tests set the floor — the UI says which, so it isn't magic. */
export function floorPriceBasis(opts: {
  variableCost: number;
  minMarginPct: number;
  monthlyOpEx: number;
  expectedVolume: number;
}): "margin" | "overhead" {
  const marginFloorNet = opts.variableCost / (1 - opts.minMarginPct / 100);
  const breakEvenNet = opts.variableCost + opts.monthlyOpEx / Math.max(opts.expectedVolume, 1);
  return marginFloorNet >= breakEvenNet ? "margin" : "overhead";
}

/* ------------------------------------------------------------------ */
/*  Business profile — three axes, not five buckets                    */
/* ------------------------------------------------------------------ */

export type Sells = "physical" | "digital";
export type Charges = "oneoff" | "recurring";
export type Channel = "direct" | "trade" | "store";

export interface BusinessProfile {
  sells: Sells;
  charges: Charges;
  channels: Channel[];
}

/**
 * Never block the calculators behind a setup wizard — an unset profile
 * defaults rather than gating.
 */
export const DEFAULT_PROFILE: BusinessProfile = {
  sells: "physical",
  charges: "oneoff",
  channels: ["direct"],
};

/**
 * The cost lines a profile implies.
 *
 * Base comes from `sells` — physical costs land per unit made, digital per
 * customer served. Channels add to it; ecommerce is a channel, not a business
 * type, so a brand can be direct AND trade at once.
 */
export function costLines(p: BusinessProfile): { label: string; from: string }[] {
  const lines: { label: string; from: string }[] =
    p.sells === "physical"
      ? [
          { label: "Production cost", from: "base" },
          { label: "Freight & duty", from: "base" },
          { label: "Packaging", from: "base" },
        ]
      : [
          { label: "Hosting & infra", from: "base" },
          { label: "Support time", from: "base" },
        ];

  if (p.channels.includes("direct")) {
    lines.push(
      ...(p.sells === "physical"
        ? [
            { label: "Shipping", from: "direct" },
            { label: "Returns rate", from: "direct" },
          ]
        : [{ label: "Refund rate", from: "direct" }]),
      { label: "Payment fees", from: "direct" },
      { label: "Ad cost per sale", from: "direct" },
    );
  }
  if (p.channels.includes("trade")) {
    lines.push(
      p.sells === "physical"
        ? { label: "Carton / pallet", from: "trade" }
        : { label: "Reseller commission", from: "trade" },
      { label: "Payment terms", from: "trade" },
    );
  }
  if (p.channels.includes("store")) {
    lines.push({ label: "Store commission %", from: "store" });
  }
  if (p.charges === "recurring") {
    lines.push(
      { label: "Billing period", from: "recurring" },
      { label: "Churn rate", from: "recurring" },
      { label: "Cost to acquire", from: "recurring" },
    );
  }
  return lines;
}

/** Calculator 1 is named for the unit of analysis, which `sells` decides. */
export function costCalculatorTitle(p: BusinessProfile): string {
  return p.sells === "physical" ? "True cost per unit" : "Cost to serve one customer";
}

export function unitNoun(p: BusinessProfile, plural = true): string {
  if (p.sells === "digital") return plural ? "customers" : "customer";
  return plural ? "units" : "unit";
}

/** The read-back sentence under the profile toggles. */
export function profileSentence(p: BusinessProfile): string {
  const what = p.sells === "physical" ? "physical goods" : "digital products and access";
  const how = p.charges === "recurring" ? "on subscription" : "as one-off purchases";
  const names: Record<Channel, string> = {
    direct: "your own site",
    trade: "wholesale",
    store: "an app store",
  };
  const where = p.channels.length
    ? p.channels.map((c) => names[c]).join(", ").replace(/, ([^,]*)$/, " and $1")
    : "nowhere selected yet";
  return `You sell ${what} ${how} through ${where}.`;
}

/* ------------------------------------------------------------------ */
/*  Running costs — per month, business-level                          */
/* ------------------------------------------------------------------ */

export interface RunningCosts {
  rent: number | null;
  salaries: number | null;
  software: number | null;
  marketing: number | null;
  other: number | null;
}

export const EMPTY_RUNNING_COSTS: RunningCosts = {
  rent: null,
  salaries: null,
  software: null,
  marketing: null,
  other: null,
};

export const RUNNING_COST_LINES: { key: keyof RunningCosts; label: string }[] = [
  { key: "rent", label: "Rent & premises" },
  { key: "salaries", label: "Salaries" },
  { key: "software", label: "Software & tools" },
  { key: "marketing", label: "Marketing" },
  { key: "other", label: "Other overheads" },
];

export function totalRunningCosts(c: RunningCosts): number {
  return RUNNING_COST_LINES.reduce((sum, l) => sum + (c[l.key] ?? 0), 0);
}

/** True when nothing has been entered — the floor is then only half a floor. */
export function runningCostsUnset(c: RunningCosts): boolean {
  return RUNNING_COST_LINES.every((l) => c[l.key] == null);
}

/* ------------------------------------------------------------------ */
/*  Recurring revenue                                                  */
/* ------------------------------------------------------------------ */

export interface Recurring {
  /** Average revenue per customer per month, net of tax. */
  arpu: number;
  /** Monthly churn as a percentage. */
  churnPct: number;
  /** Cost to acquire one customer. */
  cac: number;
  /** Gross margin on the recurring revenue, as a percentage. */
  grossMarginPct: number;
}

export interface RecurringResult {
  /** Average months a customer stays. */
  lifetimeMonths: number;
  /** Lifetime value, on gross profit rather than revenue. */
  ltv: number;
  /** Months of margin needed to earn back acquisition cost. */
  paybackMonths: number;
  /** LTV against CAC. Below 1 means every customer loses money. */
  ltvToCac: number;
}

/**
 * Lifetime value on GROSS PROFIT, not revenue.
 *
 * LTV computed on revenue ignores the cost of serving the customer and
 * overstates what they are worth — the same class of error as computing
 * margin on factory cost. Returns null when churn is zero, because an
 * infinite lifetime is not a number to put in front of someone.
 */
export function recurring(r: Recurring): RecurringResult | null {
  if (r.churnPct <= 0) return null;
  const lifetimeMonths = 100 / r.churnPct;
  const monthlyGross = r.arpu * (r.grossMarginPct / 100);
  const ltv = monthlyGross * lifetimeMonths;
  return {
    lifetimeMonths,
    ltv,
    paybackMonths: monthlyGross <= 0 ? Infinity : r.cac / monthlyGross,
    ltvToCac: r.cac <= 0 ? Infinity : ltv / r.cac,
  };
}

/**
 * The deepest discount a price can carry and still clear a minimum margin.
 *
 * Returns 0 when the price is already at or below the floor — a negative
 * "discount" is a price rise, and offering it as a discount would be absurd.
 */
export function maxDiscountPct(opts: {
  retailGross: number; taxRatePct: number; variableCost: number; minMarginPct: number;
}): number {
  const net = netPrice(opts.retailGross, opts.taxRatePct);
  if (net <= 0) return 0;
  // The lowest net price that still leaves minMarginPct.
  const floorNet = opts.variableCost / (1 - opts.minMarginPct / 100);
  if (floorNet >= net) return 0;
  return ((net - floorNet) / net) * 100;
}

/** The price implied by a target margin. Returns gross, so it's comparable to retail. */
export function priceForMargin(opts: {
  variableCost: number; taxRatePct: number; targetMarginPct: number;
}): number | null {
  if (opts.targetMarginPct >= 100) return null; // unreachable: no cost can be 0% of price
  const net = opts.variableCost / (1 - opts.targetMarginPct / 100);
  return net * (1 + opts.taxRatePct / 100);
}
