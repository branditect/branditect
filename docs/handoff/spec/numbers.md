# Numbers

Route: `/numbers`. Design: `reference/numbers.html`.

Calculators that tell a brand what it really makes on every sale, what to charge, what it can afford to give away, and what it must sell each month to cover the business.

---

## The one architectural decision

**Calculators are a sandbox. The product card is the source of truth.**

- Calculators **read** from a product to prefill their fields.
- Calculators **never write** back. Nothing they hold is persisted or read by anything else.
- The only bridge is one explicit action — **Apply to product** — which opens the product card with the field filled in and highlighted, for the user to confirm and save.

Prefill is not a write. The user still presses save on the product.

Three things follow from this, and they are why the decision is worth protecting:

**There is no live/draft state machine.** The product card *is* the live version, by definition. Nothing needs promoting.

**Saved calculator runs are permanently what-ifs.** "Live" isn't a state a scenario can be in, so scenarios can be added later without reworking anything.

**Studio can never be surprised.** Guardrails read the product record. A calculator session cannot change what the copywriter is allowed to say.

### The risk this creates, and the fix

People explore, get their answer, and never write it back — so Studio's guardrails run on stale costs.

Two mitigations, both required:

1. **Apply to product must be the visually dominant action** on every results screen. Not a link under the numbers.
2. **The product list flags stale or missing costs.** It already shows `—` for margin when landed cost is absent (`spec/products.md`); extend that to "costs last touched 8 months ago".

---

## Business profile — three axes, not five buckets

Stored on the workspace, not on this page. Ask it in the 20-question onboarding; the panel on `/numbers` is a quiet override.

```ts
interface BusinessProfile {
  sells: 'physical' | 'digital';        // one
  charges: 'oneoff' | 'recurring';      // one
  channels: Array<'direct' | 'trade' | 'store'>;  // many
}
```

**Why not "ecommerce" as a type.** Ecommerce is a channel, not a business. A brand can make physical goods, sell them direct, *and* wholesale — all three at once. Shipping, returns and ad spend attach to selling direct, not to the company. Forcing one choice produces a wrong cost model for most real brands.

**Why not "apps" vs "courses".** A course can be a membership; an app can be a one-off purchase. What changes the maths is one-off vs recurring, which cuts across both.

**What `sells` actually changes** is the unit of analysis: physical costs land *per unit made*, digital costs land *per customer served*. That is a real difference, and the only one worth a separate axis.

### Cost lines by axis

Base lines come from `sells`. Channels add to them. The UI highlights added lines so the user can see their answers building the model.

| | Physical | Digital |
|---|---|---|
| **Base** | Production cost, Freight & duty, Packaging | Hosting & infra, Support time |
| **+ direct** | Shipping, Returns rate, Payment fees, Ad cost per sale | Payment fees, Refund rate, Ad cost per sale |
| **+ trade** | Carton / pallet, Payment terms | Reseller commission, Payment terms |
| **+ store** | Store commission % | Store commission % |
| **+ recurring** | Billing period, Churn rate, Cost to acquire | same |

---

## Two altitudes — keep them apart

Calculators 1–3 are **per sale** (variable — moves with volume). Running costs are **per month** (fixed — paid either way). The page labels both with a badge and a section heading.

Mixing altitudes in one row is how people end up subtracting rent from a unit price. Don't put running costs in the calculator card row.

### Per sale

| # | Name | Physical → Digital | Purpose |
|---|---|---|---|
| 1 | True cost per unit → Cost to serve one customer | renamed by `sells` | everything one sale costs |
| 2 | Pricing & margin | same | price ↔ margin ↔ profit, both directions |
| 3 | Offers & discounts | same | what you can give away before it hurts |
| 4 | Recurring revenue | **only when `charges === 'recurring'`** | MRR, churn, LTV, payback |

Card 4 is hidden, not disabled, when it doesn't apply.

### Per month

**Running costs & break-even.** Five monthly totals — rent & premises, salaries, software & tools, marketing, other overheads. Business-level and shared across every product: rent is not a property of a hair dryer.

**Monthly totals, not receipts.** This line is in the field label on purpose. The moment it wants categories, dates and history, it stops being a calculator and becomes bookkeeping — at which point the product competes with Xero rather than with an agency.

---

## Formulas

```ts
/** Net of tax. Every margin calculation starts here. */
export function netPrice(retailGross: number, taxRatePct: number) {
  return retailGross / (1 + taxRatePct / 100);
}

/** Per-sale contribution: what one sale leaves toward overhead and profit. */
export function contribution(retailGross: number, taxRatePct: number, variableCost: number) {
  return netPrice(retailGross, taxRatePct) - variableCost;
}

export function marginPct(retailGross: number, taxRatePct: number, variableCost: number) {
  const net = netPrice(retailGross, taxRatePct);
  return net === 0 ? 0 : ((net - variableCost) / net) * 100;
}

/** Units per month needed just to cover fixed costs. */
export function breakEvenUnits(monthlyOpEx: number, contributionPerSale: number) {
  if (contributionPerSale <= 0) return Infinity;   // never breaks even — say so, don't render a number
  return Math.ceil(monthlyOpEx / contributionPerSale);
}

export function operatingProfit(volume: number, contributionPerSale: number, monthlyOpEx: number) {
  return volume * contributionPerSale - monthlyOpEx;
}

/** Floor price has TWO tests. Take the higher. */
export function floorPrice(opts: {
  variableCost: number; taxRatePct: number;
  minMarginPct: number; monthlyOpEx: number; expectedVolume: number;
}) {
  const marginFloorNet = opts.variableCost / (1 - opts.minMarginPct / 100);
  const breakEvenNet   = opts.variableCost + opts.monthlyOpEx / Math.max(opts.expectedVolume, 1);
  return Math.max(marginFloorNet, breakEvenNet) * (1 + opts.taxRatePct / 100);
}
```

**Two rules that are easy to get wrong:**

**Always net of tax, always against landed cost.** Factory cost against gross price overstates the Pro 5000's margin by five points (86.9% vs 82.2%), and a max-discount rule built on the wrong figure eats the difference on every promotion. Same rule as `spec/products.md`.

**Do not allocate overhead per unit.** Dividing £8,400 across 240 units to show a "fully loaded" cost of £57 makes every product's margin depend on how many of everything *else* sold. Contribution plus a break-even figure gives the same insight without the instability.

---

## Guardrails are per product

With 18 products there are 18 sets, not one. A £6 sectioning clip cannot carry a £99 floor.

```ts
interface Guardrails { floorPrice: number; maxDiscountPct: number; minMarginPct: number }
```

Stored on the product, **displayed** in the product drawer's Pricing tab, **edited** in Numbers. One home, two places it shows.

The `/numbers` hero therefore reports portfolio state, not one number: how many products are priced, which has the lowest margin, and break-even across the range. With a portfolio, the useful question is which product is dragging — not what the average is.

---

## Apply to product

```ts
interface ApplyPayload {
  productId: string;
  fields: Partial<Pick<Product,
    'landedCost' | 'retailPrice' | 'floorPrice' | 'maxDiscountPct' | 'minMarginPct'>>;
  source: 'cost' | 'pricing' | 'offers';
}
```

Opens `/brand/products/:id` with those fields **pre-filled and visually flagged as changed**, and the save button enabled. It does not save. If the user navigates away, nothing happened.

Show the before/after inline on each changed field — `£19.45 → £22.10` — so the user can see what they're accepting.

### Two entry modes

**With a product** — fields prefill, Apply is available at the end.

**Quick calculation** — no product selected, blank fields, no Apply. This is a real and common case: someone pricing a product they haven't added yet, often on their first session. Don't force product creation before the tool will run.

---

## Scenarios — phase 2, deliberately deferred

Not in this build. Documented so the phase-1 data model doesn't preclude it.

A scenario is a **saved input set** for the calculators, named, with an optional note. Always a what-if — "live" is not a state it can hold, because the product card is live.

- **Auto-suggest the name from what changed** — "Factory +12%", "£169 launch price". Blank names become "Untitled 4" and are never found again.
- **Comparison is the point.** Two or three side by side as columns, only changed rows highlighted, and the same bottom row on each: operating profit and break-even volume. Saving without comparing is a filing cabinet.
- **Two scopes.** Per product ("Pro 5000 at £169") and portfolio-wide ("freight up 12% across everything"). The second is what a brand with 128 SKUs actually needs, and it's the harder build — it applies a delta across every product and flags which break their minimum margin.
- **Staleness.** A scenario built on costs that have since changed is misleading. Show "built on costs from 3 August" with options to refresh or keep as a record.

**Not building, at any phase:** version trees or branching, scheduled scenarios ("apply from January"), comments and approval flows. Each is a doorway to becoming planning software.

---

## States

**No products yet** — the calculators still work in quick-calculation mode. Say so rather than showing an empty product picker.

**Contribution ≤ 0** — break-even is infinite. Render "this never breaks even at this price" and point at calculator 2, not `∞`.

**Missing landed cost** — margin shows `—` with a tooltip, never a number derived from factory cost. A wrong margin is worse than a blank one.

**Business profile unset** — default to physical / one-off / direct, and surface the panel. Never block the calculators behind a setup wizard.

---

## Accessibility

- The three profile groups are `radiogroup` (sells, charges) and `group` (channels, multi-select) with `aria-pressed` on each toggle.
- The read-back sentence is `aria-live="polite"` so the change is announced.
- All money and counts use `font-variant-numeric: tabular-nums`.
- Card 4 is removed from the DOM flow when hidden, not just visually hidden.
- Every calculator result must be readable as text, not only as a chart.

---

## Known approximations in `reference/numbers.html`

- The hero's decorative arc and the icon set are CSS/hand-drawn stand-ins.
- All figures are illustrative: £8,400 OpEx, £102.07 contribution, 83 units break-even, 12 of 18 products priced.
- The profile toggles rewrite copy live so the mechanic is demonstrable — in the app they persist to the workspace.
