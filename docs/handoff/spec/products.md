# Products

Route: `/brand/products`. Design: `reference/products.html`.

A master list with a slide-over detail drawer. The reference shows four rows because those four cover every state the list can be in — four categories, in-stock and low-stock, one row selected and three not. There are 128 in the real data.

---

## What this page is for

Products is where the brand brain learns what you sell. Every field on it exists because it changes what Studio writes, what an image contains, or what price an offer can quote.

**The scope test:** *does this field change what Studio writes, or what you'd price something at?* If not, it belongs in the user's inventory system, not here. Applying that test is what keeps this page from turning into a worse Shopify.

---

## Data model

```ts
interface Product {
  id: string;
  // --- identity: read by Studio ▸ Write ---
  name: string;
  description: string;          // the copywriter's source of truth
  category: string;
  sku: string;
  barcode?: string;
  tags: string[];               // steer tone and angle, e.g. "Professional", "Ionic"

  // --- money: read by Numbers and by every offer Studio writes ---
  retailPrice: number;          // gross, what the customer pays
  rrp?: number;
  taxRatePct: number;           // 20 for UK VAT
  landedCost: number;           // factory + duty + freight + packaging
  factoryCost?: number;         // COGS alone — shown, never used for margin

  // --- guardrails: enforced on generated copy ---
  floorPrice?: number;
  maxDiscountPct?: number;
  minMarginPct?: number;

  // --- availability: one flag, deliberately ---
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  stockUnits?: number;
  stockSyncedAt?: Date;
  stockSource?: string;         // "Shopify", "Manual"

  // --- what the brain has ---
  indexed: boolean;
  sourceFileCount: number;      // files in Knowledge mentioning this product
  imageCount: number;           // images tagged to it
  usedInOutputCount: number;
  lastUsedAt?: Date;

  updatedAt: Date;
}
```

### Margin — get this right

The obvious calculation is wrong, and it's wrong in the flattering direction.

```ts
export function margin(p: Product) {
  const net = p.retailPrice / (1 + p.taxRatePct / 100);
  const cash = net - p.landedCost;
  return { net, cash, pct: (cash / net) * 100 };
}
```

Worked example, the Pro 5000:

| Using | Sum | Result |
|---|---|---|
| Factory cost, gross price | (149 − 19.45) / 149 | **86.9%** ← flattering, wrong |
| Landed cost, net price | (124.17 − 22.10) / 124.17 | **82.2%** ← correct |

Nearly five points. And it compounds: a max-discount rule built on the wrong figure quietly eats the difference on every promotion. **Always compute on net price after tax, against landed cost.** Show factory cost in the UI if the user wants it, but never derive a margin from it.

If `landedCost` is missing, fall back to `factoryCost` and **label the figure as an estimate**. Do not silently present it as the real margin.

---

## The list

| Column | Content | Notes |
|---|---|---|
| Product | 52px thumb, name, one-line description | Description truncates at ~34ch |
| Category | Pill | Colour is per category, from a fixed map |
| Stock | Units + status word | Status word is the signal; units are secondary |
| Cost | Landed cost | Header says "Cost", not "COGS" — the value is landed |
| Price | Retail, gross | Bolder than cost — it's the anchor |
| Margin | Percentage + cash below | **Sortable, and the default sort** |
| — | Chevron | Whole row is the click target |

Rows are clickable and set `aria-selected`. The selected row gets `--tint-3` and a 3px accent bar via `box-shadow: inset`.

**Default sort is margin, ascending.** Your worst-margin products first is the most useful thing this page can tell someone the moment it loads. Alphabetical tells them nothing they don't already know.

Pagination, not infinite scroll — people come here to find a specific product and need to be able to get back to where they were.

---

## The drawer

Opens on row click, 400px, five tabs. Hidden below 1280px, where row click should route to a full page instead.

### Header
Thumb, name, stock status pill, category pill, close button.

### "Use this product" row

Three actions directly under the header: **Write about it · Make images · Ask about it.**

This row is the point of the page. Without it Products is a catalogue; with it, it's the thing that feeds Studio — which is the only reason a brand tool holds products at all. Each opens the relevant Studio surface pre-loaded with this product.

### Tabs

**Details** — name, description, category, SKU, barcode, tags. Plus a "What Branditect knows" block: indexed status, source file count, image count, how many outputs used it and when. That block is what makes the brain feel real on a per-product basis.

**Pricing** — margin box (percentage, cash, bar, and the honest footnote about which cost was used), then prices, then the guardrails panel: floor price, deepest discount, minimum margin. The guardrails are displayed here and **edited in Numbers ▸ Pricing & offers** — one home, shown in two places.

**Inventory** — status, units, and where the number came from with a timestamp. Nothing else. See scope below.

**Media** — images tagged to this product, which are what the image creator reads. Links to Knowledge ▸ Images filtered to this product.

**History** — an audit trail. Price changes especially: someone will need to know when £139 became £149 and who did it.

### Footer
Delete (secondary, with confirmation) and Save changes (primary). Save is disabled until something changes.

---

## Deliberately out of scope

Kept out of the data model on purpose. Each was on the original design.

| Field | Why not |
|---|---|
| Reorder point | Ops. Doesn't change copy or price. |
| Supplier | Ops. |
| Lead time | Ops. |
| Purchase orders, stock movements | An inventory system's job |

Stock **status** stays because it has a real brand use: Studio shouldn't promote something that can't ship. Stock **management** doesn't, and carrying it has two costs — stale numbers become a brand risk rather than a warehouse problem, and the product starts competing with Shopify instead of with an agency.

If a user genuinely has no other product record, the answer is an import and a sync, not a second inventory system.

---

## Import

The current app has "Import from text / PDF" on the catalogue page. Keep it, and put it next to **Add product** as a secondary action. Also worth having: a CSV import and a Shopify/WooCommerce sync, since a user with 128 products will not type them in.

On import, run each product through the same indexing that Knowledge files get, so it becomes answerable in AI Chat immediately.

---

## States

**Empty (no products yet):** this is a Brand Readiness gap, so say so. "Branditect can't write about products it doesn't know. Add your first, or import your catalogue." Two buttons: Add product, Import.

**Search with no results:** show the query back and offer to clear the filters. Never a bare "No results".

**Missing landed cost on a product:** the margin cell shows `—` with a tooltip, not a fabricated number. A wrong margin is worse than a blank one.

---

## Accessibility

- The table is a real `<table>` with `<thead>` and scope-correct headers — do not build it from divs.
- Rows are keyboard-reachable and open the drawer on Enter.
- The drawer is a focus trap while open; Escape closes it and returns focus to the row that opened it.
- Tabs use `role="tablist"` / `role="tab"` with arrow-key navigation.
- Money and percentages use `font-variant-numeric: tabular-nums` so columns align.
- Stock status is never colour alone — the word carries it.

---

## Known approximations in `reference/products.html`

- **Product images are placeholders** — tinted tiles with category glyphs stand in for real photography. Everything else (type, colour, spacing, radii) is the shipped token set.
- Category pill colours are a plausible map, not a decided one. Fix the set before there are twenty categories and someone starts picking at random.
