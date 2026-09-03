# The product card — rebuild

Reference: `reference/product-card.html`. Open it, click the tabs, and click the line chips under
Pricing.

This is `components/products/product-drawer.tsx` (749 lines). The five tabs stay:
`Details · Pricing · Inventory · Media · History`.

---

## 1 · Remove the Studio button row

Lines 446–448 render `Write about it`, `Make images`, `Ask about it`. **All three go.**

They were shortcuts into Studio from a data screen. The product card is where you check what is
true about a product, and three orange buttons above the tabs made the first thing on the screen a
question about what to make rather than what is there.

Nothing is lost: Studio ▸ Write and Create images both have their own product picker in step 1.

---

## 2 · Details keeps only what a person types

Delete two sections:

- **`Specifications`** (line 515)
- **`What Branditect knows`** (line 523)

What remains: name, description, category, SKU, barcode, tags. Fields someone fills in, and
nothing computed.

The description hint stays as it is — *"Studio writes from this. Facts, not adjectives — it will
find its own."* — with the character count.

---

## 3 · Pricing, rebuilt

The current tab shows Retail price, RRP, Tax rate, Landed cost and Factory cost to every product.
A digital product has no freight. A service has no packaging. The fixed list is why it does not
make sense.

### Four groups, and a line belongs to one

| Group | Lines |
|---|---|
| **What comes in** | Retail price · RRP · Tax rate · *Net price (calculated)* |
| **Cost of goods · COGS** | Unit cost · Freight & duty · Packaging · Licence cost · Labour per job |
| **Cost to sell** | CAC · Payment fees · Shipping to customer · Returns allowance · Platform fee |
| **Result** | Gross margin · Contribution |

Each group shows a running total in its header. That is what makes a configurable list readable:
a line has a home, and the home has a number.

### Renaming, rather than adding a third word for one thing

You asked to add COGS. The card already had **landed cost** and **factory cost**, which are two
names for nearly the same idea; adding a third would have made it worse. So:

| Was | Is | Meaning |
|---|---|---|
| Factory cost | **Unit cost** | What the supplier charges |
| Landed cost | **COGS** — the group total | Unit cost + freight + duty + packaging |

The database columns `factory_cost` and `landed_cost` keep their names. Only the labels change, and
`landed_cost` is now written as the sum of the goods group rather than typed directly.

### Two margins, because CAC is not a cost of goods

```
net price      = retail / (1 + tax/100)
gross margin   = (net − COGS) / net
contribution   = (net − COGS − cost to sell) / net
```

**Gross margin is unchanged and still obeys the house rule** in `CLAUDE.md`: net of tax, against
landed cost. Contribution is added beside it, not instead of it.

Folding CAC into COGS would understate gross margin on every product and quietly break that rule.
Keeping them apart is also what a founder actually needs — **contribution is the number that says
whether an ad spend survives contact with reality**, and nothing in the app shows it today.

Both cards show a percentage, the cash figure, and a bar. When there is no retail price or no cost,
they show `—`. A blank figure is better than a fabricated one, and that is already the rule on this
tab.

### Choosing the lines

A chip row above the groups, one chip per available line, tagged with its group. Three presets —
**Physical goods · Digital · Service** — set a sensible default selection.

**Turning a line off hides it and stops it asking. It does not delete the value.** Turn it back on
and the number is still there. Deleting on hide is how someone loses a figure they spent an hour
finding, and there is no undo on a form field.

Plus **`+ Add your own line`** per group: a name and a value, counted into that group's total. Not
every business's costs are on our list, and a card that cannot hold the real ones sends people back
to the spreadsheet.

```sql
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS price_lines_visible TEXT[];
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS price_lines_custom  JSONB DEFAULT '[]';
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS cac                 NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS payment_fees        NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS shipping_cost       NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS returns_allowance   NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS platform_fee        NUMERIC;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS pricing_notes       TEXT;
```

`price_lines_visible` NULL means "use the preset for this brand's track" — so an existing product
with no selection still renders something sensible rather than an empty tab.

**Custom lines go in JSONB, not new columns.** `[{ "label": "Sample kits", "value": 0.40, "group":
"sell" }]`. A column per idea is how a table gets to eighty columns, and none of them are queried.

Port the formulas from `spec/numbers.md`. Do not rewrite them.

---

## 4 · Guardrails move, they do not disappear

`Guardrails Studio obeys` — floor price, max discount, min margin — comes off this tab.

**The values are not deleted and the enforcement does not stop.** They move to
**Numbers ▸ Pricing & offers**, which is where `CLAUDE.md` says pricing rules live. Three reasons
this matters:

1. `spec/create-images.md` and the product-card spec both have Studio check offers against the
   floor price.
2. The live pricing page says in writing that offers are *"checked against your floor price before
   you see them."* Deleting the field makes a public claim false.
3. `CLAUDE.md`: *"Guardrails are per product. A £6 clip can't carry a £99 floor."*

So: same columns, same checks, different room. If you want them genuinely gone, that is a separate
decision and the pricing page has to change with it.

---

## 5 · Notes

Replaces the guardrails block at the bottom of Pricing.

**Styled exactly like Description on the Details tab** — label in the left column, box in the
right, same border, same focus ring, same character count underneath. A pricing note is a typed
field like any other and should not look like a different kind of thing.

Stored in `pricing_notes`. Autosaved on blur with the same debounce as the rest of the drawer.

**Studio reads it.** A line like *"never quote below 26.00 on the webshop, it undercuts our own
resellers"* becomes a rule it follows. That is the soft half of a guardrail, and often the more
useful half, because most real pricing rules are sentences rather than numbers.

---

## 6 · Inventory

Unchanged.

---

## 7 · Media

Two sections, from the tables in `spec/product-attachments.md`.

**Images and video** — a four-across grid of square tiles. The primary image carries a `Primary`
tag; video carries a duration badge and a play glyph. **Clicking a tile opens it** in the existing
lightbox, full size. Hover gives Download and Untag.

**Documents** — a list, because documents are found by their names. Each row: icon, filename, size
and date, the `doc_role` chip (Safety sheet · Certificate · Spec), and a download. **Clicking the
row opens the PDF.**

Both sections have `Tag more` and `Download all`. The zip streams from the server — never assemble
it in the browser.

Untag removes the link, never the file. Say so: *"Removes it from this product. The file stays in
Knowledge."*

Empty state names the fix rather than the absence: *"No images yet. Generate some in Studio, or tag
existing ones from Knowledge."*

---

## 8 · History

Unchanged.

---

## Acceptance criteria

1. No `Write about it`, `Make images` or `Ask about it` control anywhere in the drawer.
2. Details renders no `Specifications` or `What Branditect knows` section.
3. Turning a pricing line off hides its row and preserves its stored value — asserted by a test
   that hides, saves, re-shows and reads the value back.
4. Group totals equal the sum of their visible lines only.
5. Gross margin is `(net − COGS) / net` and is unaffected by any cost-to-sell line — asserted by a
   test that changes CAC and expects gross margin unchanged.
6. Contribution subtracts every visible cost-to-sell line.
7. Both margins render `—` when retail price or cost is missing, never a computed zero.
8. A custom line saves to `price_lines_custom` and counts into its group.
9. The three presets set different visible sets, and a product with `price_lines_visible = NULL`
   renders the preset for its brand's track.
10. `pricing_notes` saves and survives a reload, and uses the same field styling as Description —
    asserted by a test that both render the same field component.
11. Media shows exactly the images and documents linked in `product_images` / `product_documents`.
12. Clicking an image opens the lightbox; clicking a document row opens the file.
13. Untagging removes only the link — the row stays in `brand_images` / `brand_documents`.
14. Floor price, max discount and min margin are still stored and still enforced by Studio, and are
    editable at Numbers ▸ Pricing & offers. **MERGE BLOCKER** — a released promise depends on it.

---

## Build order

1. The migration, and the pricing model in `lib/pricing-lines.ts` with its tests. Criteria 3–9.
2. The Pricing tab against it.
3. Details cleanup and the Studio row removal. Criteria 1, 2.
4. Notes. Criterion 10.
5. Media, which needs `spec/product-attachments.md` steps 1 and 2 first. Criteria 11–13.
6. Move the guardrail fields into Numbers ▸ Pricing & offers. Criterion 14.

Step 6 ships in the same release as step 2, not later. There must be no window where the floor
price has left the product card and has not arrived in Numbers.

---

## Not building

Currency conversion, price history charts, per-channel pricing, bulk price edits across products,
supplier records, or a margin target that auto-adjusts the price. Calculators stay a sandbox that
reads from a product and never writes back — `CLAUDE.md`, and this card is the live version.
