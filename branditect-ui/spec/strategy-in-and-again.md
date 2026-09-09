# Two more ways into a strategy — bring one, or start over

Amends `spec/onboarding.md` and `spec/strategy.md`. Governing document for the voice step:
`claude/brand-voice-archetypes.md`.

Two features that look unrelated and are not: both are about a founder who is not starting from
nothing.

---

# Part 1 · "I already have a strategy"

## It does not skip the questionnaire. It shortens it.

The request was to upload a PDF and skip the questions. Do not build that, and the reason is
arithmetic: the questionnaire has nineteen answers, and a brand strategy deck contains perhaps eight
of them. "Skip" means the other eleven get invented, silently, and an invented answer is
indistinguishable from a real one the moment it is saved.

So: **extract, show what was found, ask only what is missing.**

```
We read your strategy. 11 of 19 answered.

  ✓ What you sell            "premium absorbent products for workshops"      p.3
  ✓ Who it's for             "independent garages, 1-5 bays"                 p.4
  ✓ What changes for them    "no more sawdust, no more slip claims"          p.7
  ✓ …8 more
  — Category                 not in the document
  — Price positioning        not in the document
  — Your voice               we have a suggestion, see below

  [ Review the 11 ]      [ Answer the remaining 8 →  about 6 minutes ]
```

**Eight questions is a different product from nineteen.** That is the whole value, and it is a bigger
gift than skipping, because what comes out the other end is actually theirs.

## Every extracted answer is shown, sourced and editable before it is saved

Each carries the page it came from and the sentence it came from. Not a footnote — on the review
screen, next to the answer.

An extracted answer the founder never read becomes a positioning they never chose, and everything
Studio writes is downstream of it. The review step is not politeness, it is the thing that makes
extraction safe to offer at all.

**Never fill a field to reach a number.** A field the document does not answer stays a question. Nine
sourced answers and ten questions is a good outcome; nineteen answers where ten were guessed is a
brand built on fiction.

## The voice is proposed from how the document is written, not what it says

The one genuinely clever thing available here. A strategy deck is itself a sample of the brand's
writing, so the archetype can be proposed from its prose — sentence length, contractions, hedging,
whether it makes claims or states facts — which is exactly what the six rubrics measure.

**Proposed, then confirmed on the tile screen.** It arrives with the tile pre-selected and the
evidence shown:

> Your document runs short sentences, no hedging, and opens on the product rather than a belief.
> That reads as **Confident & precise**. Change it if that is not you.

Q18 still happens. The rubric is what everything hangs on, and it does not get set by inference alone.

## Cost, before page one

This is a vision job over a document of unknown length. Per `spec/hq-accounts.md`, the estimate is
made and the budget reserved **before the first page**, and a document the budget cannot cover is
refused with what it needs and what is left:

> This document needs about 40 credits to read and you have 12. Answer the questions instead, or
> upgrade.

Text extraction first, vision only on pages that need it. A strategy deck is mostly text.

## Where the file goes

Knowledge ▸ Documents, through the panel in `spec/document-upload-asks.md`, with a new
`doc_type: 'strategy'`. It is not a special store. It is a document that happens to have been read
for onboarding, and it stays available afterwards for the same reason every other document does.

## The three doors

At the top of `/start`, before question 1:

| | |
|---|---|
| **Answer the questions** | About 15 minutes. The full nineteen |
| **I already have a strategy** | Upload it. We read it and ask only what is missing |
| **Skip for now** | Straight to the dashboard. Already built |

---

# Part 2 · "Start fresh"

## The trap: it must not take effect when it starts

`brand_strategies` holds one row per brand, with `answers` and `generated_strategy`. A redo that
overwrites on the first click means a founder who starts one and gets interrupted has destroyed a
working strategy and replaced it with three answers.

**Archive on finish, never on start.** The existing strategy stays live and current the whole way
through the redo. The new one replaces it only when it is complete. Abandon halfway and nothing has
happened.

That single rule is most of this feature.

## Versions, not deletion

```sql
ALTER TABLE brand_strategies ADD COLUMN IF NOT EXISTS version    INT     NOT NULL DEFAULT 1;
ALTER TABLE brand_strategies ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE brand_strategies ADD COLUMN IF NOT EXISTS replaced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS brand_strategies_one_current
  ON brand_strategies (brand_id) WHERE is_current;
```

Exactly one current strategy per brand, enforced by a partial unique index rather than by application
code — the same pattern already used for `is_primary` on `product_images`.

The old version is kept and restorable. A founder who redoes their strategy and finds the new one
worse currently has no way back, and "I liked the old one" is a thing people say about their own
brand more often than about anything else.

Brand ▸ Strategy gains a quiet line: *"Version 2 · replaced 4 March · see version 1"*.

## Say exactly what it touches, on the screen

This is the difference between "redo my strategy" and "delete my account", and if the screen does not
say it nobody will press the button:

> **Starting fresh replaces** your strategy answers, your generated strategy, your tone of voice and
> your anti-voice.
>
> **It does not touch** your products, your documents, your images, your numbers, or anything Studio
> has already written for you. Your current strategy stays live until the new one is finished.

Three lines. They are the feature as much as the mechanism is.

## Where it lives

**Brand ▸ Strategy**, at the bottom, under the strategy itself. Not in the questionnaire — the person
is past that — and not next to Save.

Not a red destructive button either, because it is not destruction: it is a considered action with an
undo. A plain secondary control with the three lines above it.

## Readiness stays honest

Brand Readiness reads the **current** strategy, which is the old one until the redo finishes. So the
score does not drop while someone is halfway through, and it cannot be gamed by starting a redo. Four
checks, 25% each, computed and never stored — `CLAUDE.md` is unchanged by this.

---

## Acceptance criteria

**Part 1**

1. Uploading a strategy produces a review screen listing every extracted answer with its page and
   source sentence, and every unanswered field as a remaining question. Counts match the fields.
2. No answer is written to `brand_strategies` until the founder confirms the review.
3. A field the document does not answer is never filled — asserted with a fixture document that
   omits three fields, expecting three questions.
4. Every extracted answer is editable on the review screen and the edit is what gets saved.
5. The archetype is proposed with its evidence and still requires confirmation on the tile screen —
   asserted by a test that expects no stored archetype after extraction alone.
6. Indexing is estimated and the budget reserved before the first provider call, and an
   over-budget document is refused with the number it needs. Reuses `spec/hq-accounts.md`.
7. The uploaded file appears in Knowledge ▸ Documents with `doc_type = 'strategy'`.

**Part 2**

8. **Starting a redo changes nothing.** The current strategy is still returned by every read, and
   Brand Readiness is unchanged — asserted by starting a redo and reading both. **MERGE BLOCKER.**
9. Abandoning a redo halfway leaves the brand exactly as it was, including after a sign-out and back
   in.
10. Completing a redo sets the new version current and marks the old `is_current = false` with a
    `replaced_at`, in one transaction.
11. Exactly one current strategy per brand, enforced by the partial unique index — asserted by
    attempting a direct second insert with `is_current = true` and expecting the index to reject it.
12. The previous version is readable and restorable, and restoring is itself a version change rather
    than a delete.
13. A redo does not modify any row in `catalog_products`, `brand_documents`, `brand_images`, or the
    Studio library — asserted by counting all four before and after. **MERGE BLOCKER.**
14. The three lines saying what is and is not touched are on the screen, and a test fails if the
    "does not touch" line is removed.

---

## Build order

1. The version columns and the partial unique index. No UI. Criteria 10, 11.
2. Start fresh, with archive-on-finish. Criteria 8, 9, 12, 13, 14.
3. Extraction and the review screen, read-only first. Criteria 1, 3, 5, 7.
4. Confirm and save. Criteria 2, 4.
5. The budget reservation. Criterion 6.

Part 2 goes first even though Part 1 was asked for first: Part 2 is a data-safety mechanism, and the
longer the app has no strategy versioning, the more strategies exist that can be lost by a
half-finished redo.

---

## Not building

Diffing two strategy versions side by side, merging an uploaded document into an existing strategy
rather than starting one, extracting from a URL or a Google Doc, scheduled strategy reviews, or
letting Studio rewrite the strategy itself. The strategy is the thing the founder decides; everything
else in the app is downstream of it, and an app that edits it on its own has inverted the product.
