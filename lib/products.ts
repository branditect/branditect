/**
 * Products — the data Studio reads to write, price and photograph.
 *
 * The scope test for anything added here: does this field change what Studio
 * writes, or what you'd price something at? If not it belongs in the user's
 * inventory system. That test is what keeps this from becoming a worse Shopify.
 */

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface Product {
  id: string;

  // identity — read by Studio ▸ Write
  name: string;
  description: string;
  category: string;
  sku: string;
  barcode?: string;
  tags: string[];
  /** Chosen from the brand image library. Null renders the category glyph. */
  imageUrl: string | null;

  // money — read by Numbers and by every offer Studio writes
  retailPrice: number | null;
  rrp?: number | null;
  /** e.g. 20 for UK VAT. null means unknown — never treat that as zero. */
  taxRatePct: number | null;
  /** factory + duty + freight + packaging */
  landedCost: number | null;
  /** COGS alone. Displayed, never the basis of a headline margin. */
  factoryCost?: number | null;
  currency: string;

  // guardrails enforced on generated copy
  floorPrice?: number | null;
  maxDiscountPct?: number | null;
  minMarginPct?: number | null;

  // availability — one flag, deliberately
  stockStatus: StockStatus | null;
  stockUnits?: number | null;
  stockSyncedAt?: string | null;
  stockSource?: string | null;

  // what the brain has
  indexed: boolean;
  sourceFileCount: number;
  imageCount: number;
  usedInOutputCount: number;
  lastUsedAt?: string | null;

  updatedAt?: string | null;
}

/** Why a margin figure is an estimate rather than the real number. */
export type MarginCaveat = "assumed_no_tax" | "factory_cost" | null;

export interface Margin {
  /** Retail with tax removed. */
  net: number;
  /** Cash margin per unit. */
  cash: number;
  pct: number;
  /**
   * False when a real input was missing and something had to be assumed. An
   * estimated margin must be labelled as one wherever it is shown.
   */
  exact: boolean;
  caveats: MarginCaveat[];
}

/**
 * The margin. Net price after tax, against landed cost.
 *
 * The obvious calculation — factory cost against gross price — is wrong, and
 * wrong in the flattering direction. On the spec's worked example it reports
 * 86.9% where the truth is 82.2%. Nearly five points, and it compounds: a
 * max-discount rule built on the inflated figure quietly eats the difference
 * on every promotion.
 *
 * Returns null when there is no honest number to show. A blank margin is
 * better than a fabricated one.
 */
export function margin(p: Pick<Product,
  "retailPrice" | "taxRatePct" | "landedCost" | "factoryCost">): Margin | null {
  if (p.retailPrice == null || p.retailPrice <= 0) return null;

  const caveats: MarginCaveat[] = [];

  // A missing tax rate cannot default to 0 — that silently treats gross as net
  // and inflates the margin, which is the exact trap this function exists for.
  const taxRate = p.taxRatePct;
  if (taxRate == null) caveats.push("assumed_no_tax");

  // Landed cost is the honest basis. Factory cost is a fallback that must be
  // labelled, never silently substituted.
  let cost = p.landedCost;
  if (cost == null) {
    if (p.factoryCost == null) return null;
    cost = p.factoryCost;
    caveats.push("factory_cost");
  }

  const net = p.retailPrice / (1 + (taxRate ?? 0) / 100);
  const cash = net - cost;

  return {
    net,
    cash,
    pct: (cash / net) * 100,
    exact: caveats.length === 0,
    caveats,
  };
}

/** The footnote under the margin figure. States which numbers were used. */
export function marginFootnote(
  p: Pick<Product, "retailPrice" | "taxRatePct" | "landedCost" | "factoryCost" | "currency">,
  m: Margin,
): string {
  const money = (n: number) => formatMoney(n, p.currency);
  const parts: string[] = [];

  parts.push(
    m.caveats.includes("assumed_no_tax")
      ? `Net price ${money(m.net)} — no tax rate set, so retail is treated as net.`
      : `Net price ${money(m.net)} after ${p.taxRatePct}% tax.`,
  );

  if (m.caveats.includes("factory_cost")) {
    parts.push(
      `Uses factory cost ${money(p.factoryCost!)}, not landed cost — this is an estimate and will read high. Add duty, freight and packaging for the real figure.`,
    );
  } else {
    parts.push(`Less landed cost ${money(p.landedCost!)}.`);
    if (p.factoryCost != null && p.retailPrice != null) {
      const flattering = ((p.retailPrice - p.factoryCost) / p.retailPrice) * 100;
      parts.push(
        `Gross margin on factory cost alone is ${flattering.toFixed(1)}% — landed is the honest number.`,
      );
    }
  }

  return parts.join(" ");
}

export function formatMoney(n: number, currency = "EUR"): string {
  const symbols: Record<string, string> = { GBP: "£", EUR: "€", USD: "$" };
  const symbol = symbols[currency] ?? "";
  return `${symbol}${n.toFixed(2)}`;
}

/**
 * Category pill colours. A fixed map, not random assignment — the spec calls
 * for deciding this before there are twenty categories and someone starts
 * picking at random. Unknown categories fall to a neutral, which is a visible
 * prompt to add them here rather than a silent random colour.
 */
export const CATEGORY_STYLES: Record<string, string> = {
  "hair dryers": "bg-lavender text-lav-ink",
  straighteners: "bg-tint-2 text-accent-dark",
  brushes: "bg-blue-wash text-blue-ink",
  accessories: "bg-green-wash text-green-ink",
  "hair care": "bg-tint-4 text-accent-dark",
};

export function categoryStyle(category: string | null | undefined): string {
  if (!category) return "bg-tile text-muted";
  return CATEGORY_STYLES[category.trim().toLowerCase()] ?? "bg-tile text-ink-2";
}

export const STOCK_LABELS: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

/** Status is never colour alone — the word carries it. */
export const STOCK_STYLES: Record<StockStatus, string> = {
  in_stock: "text-green-ink",
  low_stock: "text-amber",
  out_of_stock: "text-accent-dark",
};

/**
 * Default sort: margin ascending — worst first.
 *
 * Your worst-margin products are the most useful thing this page can tell you
 * the moment it loads. Alphabetical tells you nothing you don't already know.
 * Products with no computable margin sort last; they are a data gap, not a
 * zero-margin product, and putting them first would bury the real answer.
 */
export function sortByMargin(products: Product[], direction: "asc" | "desc" = "asc"): Product[] {
  return [...products].sort((a, b) => {
    const ma = margin(a);
    const mb = margin(b);
    if (ma == null && mb == null) return 0;
    if (ma == null) return 1;
    if (mb == null) return -1;
    return direction === "asc" ? ma.pct - mb.pct : mb.pct - ma.pct;
  });
}

/** Maps a Supabase catalog_products row onto Product. */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function fromRow(row: any): Product {
  const num = (v: any): number | null =>
    v === null || v === undefined || v === "" ? null : Number(v);

  return {
    id: row.id,
    name: row.name ?? "",
    description: row.description ?? "",
    category: row.category ?? "",
    sku: row.sku ?? "",
    barcode: row.barcode ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    imageUrl: row.image_url ?? null,

    retailPrice: num(row.price_retail) ?? num(row.price_rrp),
    rrp: num(row.price_rrp),
    taxRatePct: num(row.tax_rate_pct),
    landedCost: num(row.landed_cost),
    factoryCost: num(row.price_cogs),
    currency: row.currency ?? "EUR",

    floorPrice: num(row.floor_price),
    maxDiscountPct: num(row.max_discount_pct),
    minMarginPct: num(row.min_margin_pct),

    stockStatus: (row.stock_status as StockStatus) ?? null,
    stockUnits: num(row.stock_units),
    stockSyncedAt: row.stock_synced_at ?? null,
    stockSource: row.stock_source ?? null,

    indexed: Boolean(row.indexed),
    sourceFileCount: Number(row.source_file_count ?? 0),
    imageCount: Number(row.image_count ?? 0),
    usedInOutputCount: Number(row.used_in_output_count ?? 0),
    lastUsedAt: row.last_used_at ?? null,

    updatedAt: row.updated_at ?? row.created_at ?? null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
