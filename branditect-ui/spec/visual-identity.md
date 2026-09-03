# Visual brand identity — build spec

Reference: `reference/visual-identity.html`. Open it. Click the swatches, the `Link` buttons and
the font `Copy CSS` buttons — they copy, and that behaviour is load-bearing, not decoration.

**The reference shows the content area only.** This route renders inside `app/(app)/layout.tsx`.
The left sidebar and the AI Chat rail both stay. The 1240px `.wrap` is the space between them.

---

## What replaces what

`app/(app)/brand/visual-identity/page.tsx` (640 lines) is **rebuilt**, not refactored. Its five
tabs — `logos | colors | typography | brandbook | package` — become one scrolling page. Tabs made
sense when each was a list; they stop making sense when the answer to "which file do I use" lives
in a different tab from the files.

Keep `app/api/visual/route.ts`. Keep the PDF page-extraction code that fills `brand_book_pages` —
it works and nothing here replaces it.

**Routing decision to settle first.** The page lives at `/brand/visual-identity` but the reference
header says `KNOWLEDGE · VISUAL IDENTITY`, and your screenshot has it under Knowledge in the nav.
This is the same unresolved split as `/knowledge/products` vs `/brand/products`. Pick one home for
both and redirect the other. **Recommendation: Knowledge.** Brand is where strategy is decided;
Knowledge is where things are found and taken. This page is for taking.

---

## Data

These tables already exist and are unchanged:

| Table | Columns in use |
|---|---|
| `brand_logos` | `slot`, `file_url`, `file_name` |
| `brand_book_colors` | `hex`, `name`, `created_at` |
| `brand_fonts` | `name`, `role`, `google_font_url` |
| `brand_book_pages` | `page_number`, `file_url`, `file_type` |
| `brand_visual` | `guideline_url` |
| `brand_templates` | existing |

### Migrations needed

```sql
-- Formats. Today one row is one file, so a logo with SVG + PNG + PDF is three
-- rows sharing a slot. Group by slot in the query rather than adding a column —
-- the shape is already right, the page just has to read it that way.
ALTER TABLE brand_logos ADD COLUMN IF NOT EXISTS format TEXT;   -- 'svg' | 'png' | 'pdf' | 'eps' | 'ico'
-- No `is_public` column. Every logo is on the kit link or the brand has no kit
-- link; a per-asset visibility flag is a second sharing model in disguise.

-- Colour roles. "Primary. Buttons, links, the mark." Contrast is COMPUTED, never
-- stored — a stored ratio goes stale the moment the hex changes.
ALTER TABLE brand_book_colors ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE brand_book_colors ADD COLUMN IF NOT EXISTS grouping TEXT DEFAULT 'core';  -- 'core' | 'gradient'
ALTER TABLE brand_book_colors ADD COLUMN IF NOT EXISTS css_value TEXT;  -- full gradient string

-- Weights actually in use, so the type card can show them lit against the rest.
ALTER TABLE brand_fonts ADD COLUMN IF NOT EXISTS weights_in_use INT[];
ALTER TABLE brand_fonts ADD COLUMN IF NOT EXISTS file_url TEXT;

-- The version stamp in the hero. Teams keep using a logo they downloaded in
-- March; a visible version is what lets someone tell.
ALTER TABLE brand_visual ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v1.0';
ALTER TABLE brand_visual ADD COLUMN IF NOT EXISTS assets_updated_at TIMESTAMPTZ;
```

`slot` values the page understands: `primary_light`, `primary_dark`, `symbol`, `mono`,
`wordmark`. Anything else renders in `All files` and not in the main grid.

**Contrast is computed at render**, WCAG relative luminance against `#FFFFFF`. Put it in
`lib/contrast.ts` as a pure function with tests — `≥4.5` passes AA, `≥7` AAA, `≥3` large text
only, below that surface-only. Never store it.

---

## Sections, in order

### 1 · Which one do I use?

Four cards, Home gradients, above the logo grid. Each maps a *situation* to a file.

This is the section that earns the page. Five files named "Primary / On light / Symbol only" is a
filing cabinet; nobody arrives with that question. They arrive with "it's going on a dark photo".
Same files, sorted by the question people actually have.

Cards 1–3 download the matching `slot`. Card 4 copies the share link (§7).

**A card whose slot has no file is not rendered.** Never a card that answers a question with
nothing.

### 2 · Logos

Grouped by `slot`. Each card: name, one line of usage guidance, the preview plate, format chips
from the rows in that group, then `Link` and `Download`.

Plate backgrounds are fixed per slot and are not a style choice — they are how you check a
reversed logo actually works: `primary_light` on white, `primary_dark` on `#15151b`, `symbol` on
a transparency checkerboard, `mono` on white.

**One action per card: `Download`.** The reference shows a second `Link` button that copied a
permanent public URL per asset. **That is removed.** There is exactly one way anything leaves this
system — the kit link in §8 — and one external surface is the whole point of the decision. Two
sharing mechanisms means two things to reason about and two things to get wrong.

What that costs, stated plainly so it is a choice and not a surprise: a logo pasted into a Canva
design can no longer be a live URL that updates when the file is replaced. To give someone a
logo, you send them the kit link and they download from it.

Usage copy is a constant keyed by slot in `lib/logo-slots.ts`, not a database column — it is
product copy, and it should change with a deploy rather than needing every brand to write it.

### 3 · Colour

Two groups: `core` and `gradient`. Every swatch is a button that copies — hex for solids, the
full CSS string for gradients. Hover reveals `Copy HEX` / `Copy CSS` over the chip.

Each carries name, value, role, and the computed contrast badge. The badge is the point: it is
the difference between a colour you can set text in and one you can only fill a shape with.
Signal orange at 3.1:1 gets `large text only` — that is a useful, slightly unwelcome fact, and
hiding it is how brands ship unreadable buttons.

### 4 · Typefaces

One card per `brand_fonts` row. Specimen (`Ag` + a pangram) on a gradient, then name, role,
weights with `weights_in_use` lit and the rest dimmed, a copyable CSS block, and two actions:
`Copy CSS` and `Download`.

The specimen must render **in the actual font**. Load `google_font_url` when present; when the
font is a `file_url` upload, inject an `@font-face`. A specimen set in the wrong typeface is
worse than no specimen.

### 5 · Templates

From `brand_templates`. Thumbnail, name, one line, ratio badge. Click opens or downloads.

### 6 · How to hold it

Clear space, minimum size, and four visual don'ts — stretched, recoloured, effects, busy
background. Rendered with CSS transforms on the real logo, not stock illustrations.

These normally live on page 34 of a PDF nobody opens. Inline, they become enforceable. Static
content, no schema.

### 7 · The guidelines PDF

From `brand_visual.guideline_url`, with page count from `brand_book_pages`. `Read here` uses the
existing viewer. Version and date from the new columns.


### 8 · The kit link

One button, in the hero: **`Share with someone outside`**.

---

## Sharing outside the account

**One link. Fixed contents. Nothing else, ever.**

There is exactly one way anything leaves this system. Not a scope system, not per-asset URLs, not
a permissions matrix — one link whose payload is written into the route and cannot be configured.
Everything else stays inside the account, always.

This is a much stronger position than the tiered design it replaces, because the boundary stops
being a policy that could drift and becomes the code itself. There is no setting that widens it,
so there is no setting to get wrong.

### What the link contains

| On the link | Why |
|---|---|
| **Logos** — every `brand_logos` row | The thing people ask for |
| **Fonts** — files, weights in use, the CSS snippet | A designer cannot set the brand without them |
| **Colours** — hex, CSS, role | Already inside the guidelines PDF below; excluding them only makes a printer open a 64-page document to find a hex code |
| **The brand guidelines PDF** | The rules that make the rest usable |

Colours were not in the original three. I have included them because the guidelines PDF on the
same link already contains them, so leaving them off the page is a distinction without a
difference that costs the printer ten minutes. **Say the word and they come off.**

### What never leaves, under any condition

`brand_strategies` · `brand_financial_rules` · `brand_catalog` · `brand_documents` ·
`brand_tone` · `brand_images` · `brand_templates` · `onboarding` · `studio_drafts` · `products`

Strategy, positioning, tone of voice, key messages, products, costs, margins, price floors,
maximum discounts, uploaded documents, saved Studio output, questionnaire answers. None of it is
reachable from the public route, and no configuration can make it reachable.

`brand_financial_rules` is the one to be most careful about. It holds price floors and maximum
discounts. That leaking is not embarrassment — it is a competitor learning exactly how far you
will drop.

### The link itself

```sql
CREATE TABLE brand_share_links (
  brand_id       TEXT PRIMARY KEY,        -- one link per brand, enforced by the schema
  token          TEXT NOT NULL UNIQUE,    -- 22-char base62, crypto.randomBytes. NOT the brand_id
  created_by     UUID REFERENCES auth.users(id),
  last_viewed_at TIMESTAMPTZ,
  view_count     INT NOT NULL DEFAULT 0,
  rotated_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);
```

**`brand_id` is the primary key.** One link per brand, guaranteed by the database rather than by
remembering. There is no list of links to manage, no labels, no expiry settings — the simplicity
is the feature.

**The token is not the brand id.** A URL containing `brand_id` can be enumerated by counting; a
22-character random token cannot. This is the single most important line in the schema.

**Rotate, don't revoke.** One button, `Generate a new link`, which replaces the token. The old URL
dies immediately, the new one is ready to send. That is the whole access-control model, and it is
enough: if a link reaches someone it should not have, you rotate and re-send to the people who
should have it.

Warn before rotating, in one line: *"Anyone you sent the old link to will lose access."*

### The route

`app/k/[token]/page.tsx` is unauthenticated and needs the service role key to read across users,
which means **it bypasses RLS**. Given the cross-user leak already fixed once in this codebase,
treat it as the highest-risk file in the repo.

1. **Four tables. Explicit column allowlist. Never `select("*")`.** Write out every column by
   name. A future `ALTER TABLE brand_logos ADD COLUMN internal_note` must not become public
   because a query said `*`.

   ```ts
   // The only four reads this route is allowed to perform. Adding a fifth is a
   // product decision, not a refactor.
   brand_logos       → slot, file_url, file_name, format
   brand_fonts       → name, role, google_font_url, file_url, weights_in_use
   brand_book_colors → hex, name, role, grouping, css_value
   brand_visual      → guideline_url, version, assets_updated_at
   ```

2. **One resolver.** `lib/share-link.ts` turns a token into a `brand_id` or null. Every read uses
   what it returns. **No route handler on this path accepts a `brand_id` from the client**, ever.

3. **`noindex`.** `robots: { index: false }` plus an `X-Robots-Tag` header, so a link pasted into
   a public brief does not put the kit into Google.

4. **Rate limit by token**, and count views. `last_viewed_at` answers "did the printer open it".

5. **No write path.** The route is read-only. It renders and serves files; it accepts no input.

### What the page says

Plainly, under the copy button — one line, not a modal:

> **Anyone with this link can view it. It is not password protected.**

And on the shared page itself, so the recipient understands what they have:

> The logos, fonts, colours and guidelines for Ruffle Studio. Always the current version.

Never describe the link as private, secure or protected. Overstating it is how someone puts an
unreleased rebrand on it.

### Team members are not this

Someone inside the company gets a real account against the same `brand_id` and sees the whole app
under RLS. The kit link is for people who will never have an account — a freelancer, a printer, an
agency. Do not build team access out of share tokens.

---

## Acceptance criteria

1. The left sidebar and AI Chat rail render on this route.
2. A slot with no file renders no card, in both §1 and §2 — never a dead action.
3. Every swatch copies its value; gradients copy the full CSS string.
4. Contrast badges are computed, and `lib/contrast.ts` has tests including a known AAA pair, a
   known AA pair and a known fail.
5. Specimens render in the real typeface, including an uploaded `file_url` font.
6. No logo card renders a "copy link" action — `Download` is the only action.
7. `/k/{token}` renders logos, fonts, colours and the guidelines PDF with no session.
8. A rotated token 404s on the old URL and works on the new one.
9. **The `/k` route returns no field from any table other than the four allowlisted.** Asserted by
   seeding `brand_strategies`, `brand_financial_rules`, `brand_catalog`, `brand_documents`,
   `brand_tone`, `onboarding` and `studio_drafts` with sentinel strings, rendering the portal, and
   grepping the response for every sentinel.
10. A token for brand A exposes nothing belonging to brand B — same sentinel technique.
11. `/k/{token}` sends `X-Robots-Tag: noindex`.
12. The `/k` route rejects every HTTP method except GET.
13. Copy on screen never claims the link is private, secure or protected.
14. There is at most one row in `brand_share_links` per brand — enforced by the primary key and
    asserted by a test that calls the create path twice.

**Criteria 9 and 10 are MERGE BLOCKERS.** Not "should pass before release" — the branch does not
merge until they are green.

---

## Build order

1. Migrations, `lib/contrast.ts` + tests, `lib/logo-slots.ts`.
2. The page: hero, §1–§7. Download-only actions. Criteria 1–6.
3. `brand_share_links`, `lib/share-link.ts`, the `/k/[token]` portal. Criteria 7–14.
4. The hero's `Share with someone outside` button and the rotate control.

Steps 1 and 2 ship together. **Step 3 does not ship until criteria 9 and 10 pass**, and the share
button in step 4 stays hidden until they do — a button that leaks is worse than a button that is
missing.

---

## Not building

Multiple links per brand, link labels, expiry dates, per-asset permissions, password protection,
approval workflows, comments on assets, version history browsing beyond the current stamp,
auto-generating logo variants, brand-compliance scanning of uploaded artwork.

Every one of those is a reason to reopen the question of what leaves the system. The answer is
fixed: logos, fonts, colours, guidelines. Nothing else, ever.
