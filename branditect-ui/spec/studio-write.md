# Studio ▸ Write — build spec

Reference: `reference/studio-write.html`. Open it, click the format cards and the example chips.

**The reference shows the content area only.** This route renders inside `app/(app)/layout.tsx`.
**The left sidebar stays**, exactly as on every other page. Do not build a full-screen layout.
The mockup's `.wrap` is 1180px because that is the space beside the 228px sidebar.

---

## What replaces what

`app/(app)/studio/write/page.tsx` (518 lines) is **deleted and rebuilt**, not refactored. So is
`lib/copy-architect-config.ts` — its `NAV_ITEMS` structure is a different model (categories with
dropdowns and sub-maps) and carrying it forward reproduces the thing being replaced.

Keep: `app/api/copy-architect/route.ts` as the generation endpoint. It gets a new request shape
and the house-style rules, but it is not rewritten.

Keep: the four redirects in `next.config.mjs` pointing `/dashboard/copy-architect`,
`/dashboard/create`, `/dashboard/draft-pad` and `/studio` at `/studio/write`. They stay valid.

---

## The two required answers

Everything else is optional and pre-filled. Someone who wants copy in ten seconds gets it in two
taps; someone who wants control finds it in the same panel, not behind a settings screen.

### 1 · What are we writing?

Six cards plus a seventh, free-text option. Each card carries a Home gradient:

| Format | Gradient |
|---|---|
| Ad copy | `--grad-more` peach |
| Email | `--grad-images` lilac |
| Instagram caption | soft pink |
| LinkedIn post | `--grad-numbers` periwinkle |
| Product description | `--grad-assets` sage |
| Customer message | neutral grey |
| **Something else — tell us what** | white, dashed, full width |

The seventh is a real option, not a hidden dropdown. Six named formats cover most work; the
seventh is what stops the tool feeling like it can only do six things. Selecting it reveals a
one-line text input for the format name, which is passed to the model verbatim.

**Customer message is not marketing copy.** A maintenance notice or a complaint reply obeys tone
of voice and the facts, but must not reach for positioning or the difference statement. Build it
with a reduced context: profile, tone, product facts, boundaries — **no** positioning, no key
messages, no pillars. See "Context per format" below.

### 2 · What's it about?

Textarea, ~104px, vertical resize. Placeholder is an instruction, not an example:
*"One or two lines is enough. Say what happened and who it's for."*

Below it, **three tappable example chips that change with the selected format.** Tapping one fills
the textarea, and the user edits from there.

Examples teach the shape of a usable brief faster than helper text does — the same principle as
the onboarding placeholder matrix. Seed set:

```
ad          The new SORBIFY OIL launch
            A price change, going out to distributors
            Why we cost less than the category leader

email       Warehouse closed for maintenance next week
            A restock notice for people who asked
            Introducing a new size to existing customers

instagram   Behind the absorbency test
            A before and after from a customer site
            The new SORBIFY OIL launch

linkedin    What we learned testing to 800 km
            Why we publish the products we can't help
            A hire, or a milestone

product     A full description for SORBIFY OIL
            A short version for a distributor's catalogue

customer    Warehouse closed for maintenance next week
            A reply to a delivery complaint
            An order delay, with the new date
```

### 3 · Options (optional, collapsed by default is fine)

| Control | Default | Notes |
|---|---|---|
| About a product | none | Product picker. When set, that product's specs, price rules and notes enter context. |
| Length | Medium | Short / Medium / Long. Maps to word targets per format, not a global number. |
| Drafts | 3 | 1 or 3. |

**Three drafts by default.** Choosing between options is faster and more honest than judging one
draft alone — given a single draft people edit it out of politeness, given three they pick.

---

## Context per format

Built by the same retrieval contract as the product card (`spec/product-card.md`), filtered by
format. This is the difference between on-brand copy and generically competent copy.

| Layer | ad · ig · linkedin | product description | email | customer message |
|---|---|---|---|---|
| Profile (track, team size) | ✓ | ✓ | ✓ | ✓ |
| Tone of voice + anti-voice | ✓ | ✓ | ✓ | ✓ |
| Boundaries (never / always / vocabulary) | ✓ | ✓ | ✓ | ✓ |
| Positioning + difference | ✓ | ✓ | ✓ | — |
| Key messages, by funnel stage | ✓ | ✓ | ✓ | — |
| Pillars + proof | ✓ | ✓ | ✓ | — |
| Product record, specs, pinned notes | if product set | ✓ | if product set | if product set |
| Pricing rules (floor, max discount) | ✓ | ✓ | ✓ | — |

Nothing marked `reference_only` or `feeds_studio = false` ever enters this set.

**House style applies last, to every format.** Import `HOUSE_STYLE` from `lib/house-style.ts` and
append it after the brand context — no markdown, no em dashes, no scaffolding phrases. Run every
response through `sanitise-output.ts` before it reaches the UI or the database.

---

## Drafts

Each draft card carries:

- `Draft n` tag and a live word count
- the body, `white-space: pre-wrap`, 15.5px / 1.68 — this is copy, it needs reading line-length
- three actions: **Save**, **Copy**, **Again**
- a provenance row: the tone used, and one chip per hard fact with its source

### The provenance row is not decoration

> `Tone: Confident & precise`  ·  `Fact: 12× weight, from Product range specs`

This is what makes generated copy trustworthy, and it is how a user spots a claim that came from
nowhere. It keeps the Knowledge page's closed-book promise at the point of output.

Implementation: ask the model to return facts as a structured list alongside the copy, each with
the source document or field it came from. **If a numeric claim appears in the body with no
source, flag the draft** rather than shipping it silently — an unsourced number is the failure
mode this whole system exists to prevent.

### Saving

**Save**, not Pin. Saved drafts go to **Studio ▸ Library**, which `CLAUDE.md` reserves as the one
home for saved outputs. The Library button in the header carries a count so it means something
before it is clicked.

Saved drafts get the accent border and sort to the top of the current session.

```sql
CREATE TABLE studio_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  format TEXT NOT NULL,            -- 'ad' | 'email' | ... | 'other'
  format_other TEXT,               -- free text when format = 'other'
  brief TEXT NOT NULL,             -- what it's about
  product_id UUID,                 -- nullable
  length TEXT,                     -- 'short' | 'medium' | 'long'
  body TEXT NOT NULL,
  provenance JSONB,                -- [{ claim, source }]
  created_at TIMESTAMPTZ DEFAULT now()
);
```

RLS on `studio_drafts` follows the same predicate as every other table:
`brand_id IN (SELECT brand_id FROM brands WHERE user_id = auth.uid())`.

### Streaming

Draft cards render their frame and word-count slot immediately, then stream the body in. The
status line reads **"Checking every claim against your product records…"** — never a bare spinner.
A wait that explains what it is buying you is a different experience from a wait that doesn't.

---

## States

- **Empty** (nothing generated yet): the brief panel centres in the column, the drafts side shows
  one line — *"Pick a format and say what it's about."* No fake skeleton.
- **Generating**: brief stays interactive, Write it becomes `Writing…` and disables.
- **Failed**: the draft card shows the reason and a Retry, and the brief is untouched. Never lose
  the brief on a failure.
- **No tone of voice set**: generate anyway, and put one chip on every draft —
  *"No tone of voice yet — using plain, neutral copy. Set one →"*. Never block.
- **Brief under 3 words**: don't block. Generate, and add a chip: *"A fuller brief gets better
  copy."*

---

## Acceptance criteria

1. The left sidebar renders on `/studio/write`, identical to every other app route.
2. Two taps and a sentence produce drafts. No required field beyond format and brief.
3. Switching format changes the three example chips.
4. Tapping an example chip fills the textarea and leaves it editable.
5. `Something else` reveals a text input and passes its value to the model.
6. Save writes to `studio_drafts` and the Library count increments without a reload.
7. A saved draft survives a page reload.
8. No draft body contains `**`, `##`, a leading `- `, an em dash or an en dash — asserted by test
   against a fixture that previously produced all five.
9. Customer message context contains no positioning, key messages or pillars — asserted by test.
10. A numeric claim with no matching source in `provenance` flags the draft.
11. `studio_drafts` rows are invisible to another brand's user — asserted by test.

---

## Build order

1. **Delete and rebuild the page.** Format cards, brief, options, the Write it button. Wire to the
   existing `/api/copy-architect` with the new request shape. Drafts render, nothing saves yet.
2. **House style.** `HOUSE_STYLE` + `sanitise-output.ts` into the route. Criterion 8.
3. **Context per format.** The table above, plus criterion 9's test.
4. **Save + Library.** `studio_drafts`, RLS, the header count, the Library view.
5. **Provenance.** Structured facts from the model, the chips, criterion 10.

Steps 1 and 2 ship together — the old page's output is the thing being complained about, and
shipping the new UI with the old formatting fixes nothing visible.

---

## Not building

Multi-step campaign flows, a rich text editor, scheduling, direct posting to any platform,
per-draft comments, A/B variant tracking, image generation from this page (Create images is its
own route).
