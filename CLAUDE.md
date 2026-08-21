# Branditect — working notes

## What this app is

Branditect is a brand brain. One place that knows a company's strategy, voice, look, products and margins, and produces on-brand output from them. Three verbs in order: **Define → Feed → Make.**

Every screen belongs to exactly one of those. Anything that belongs to none of them is a candidate for deletion, not a new nav item. This test resolves most product arguments before they start.

## Navigation — the shape it must keep

```
Home        the landing screen: readiness, then what to make
Brand       define · Strategy · Tone of voice · Visual identity · Products
Knowledge   feed   · Documents · Images · Presentations · Links
Studio      make   · Write · Create images · Brand assets
Numbers     define · Profitability · Product costs · Pricing & offers
AI Chat     the brand-trained assistant
```

Rules that hold across changes:

- **One navigation.** There is no top nav bar duplicating the sidebar. The old app had both; that was the single biggest source of confusion.
- **Max depth 3.** Section → sub-section → detail. No fourth level.
- **Max 6 primary items.** Adding a seventh means something else merges or leaves.
- **No dead entries.** A nav item that 404s is worse than a missing feature. The old app shipped three.
- **One home per concept.** A thing belongs in exactly one place. If assets live in Knowledge, there is no "Brand Assets" destination elsewhere — a Studio card may *link* there, but it isn't a second home.

## Naming

Nav labels are plain nouns a user already knows. Keep "Architect" for page titles and product voice if you want it, never as a nav label — five items ending in "Architect" stop distinguishing anything.

Words that mean one thing each:

- **Knowledge** — the files you feed it. Not "Vault", not "Library", not "Assets".
- **Library** — reserved for saved outputs inside Studio. Do not use it for inputs.
- **Numbers** — costs, margins, pricing rules. Never "Finance": that promises invoicing and VAT, which this app does not do.

## Copy

Say the diagnosis, not the compliment. "Your brand is strong and getting stronger" tells the user nothing; "One check left — upload your brand guideline" tells them what to do. Sublabels carry the real state (`124 of 6 required`, `Not uploaded yet`), never filler.

Every surface named in an output must exist in the nav. The old app credited outputs to "Content Architect" and "Financial Tools", neither of which was reachable.

## Design system

Tokens live in `tailwind.config.ts` under the **v6 tokens** block — that is the single source of truth. Use them; do not introduce new hex values. If a colour is missing from the palette, that is a design decision, not a CSS one.

The `Legacy palette` block below it exists only so un-migrated inner pages keep rendering. Delete entries from it as pages move across; do not add to it.

Icons come from `components/icon.tsx` — one mechanism, not two. Reference material for the rebuild is in `docs/handoff/`.

The type scale is Airbnb-density: 14px body, 12px meta, 22px section headings, 26px page title. Product UI does not use 40px text.

Icons live in `components/icon.tsx` and are drawn in `currentColor` — orange (`accent`) everywhere except on the orange hero, where they are white.

The real Branditect icons are **stroked outlines**, not filled; each declares `outline: true`. (An earlier version of this line said "filled" — that described the MingCute stand-ins, not the brand set.) Nine are real; ten are still filled stand-ins — `search`, `bell`, `doc`, `img`, `bag`, `pres`, `link`, `check`, `arrow`, `send` — and read visibly heavier beside the real ones. Replacing them is the open task; when exporting, keep `stroke="currentColor"` rather than a baked-in hex or the icon cannot go white on the hero.

## Brand Readiness

Four checks, 25% each, defined in `lib/readiness.ts` (tests in `lib/readiness.test.ts`, run with `npm test`). The score is computed, never stored as a number. Do not add partial credit without a product decision — the reason for equal quarters is that a founder can predict the score, which a continuous number destroys.

## Where things live

| Concern | File |
|---|---|
| Navigation shape | `lib/nav.ts` |
| Design tokens | `tailwind.config.ts` (v6 block) |
| Icons | `components/icon.tsx` |
| Readiness scoring | `lib/readiness.ts` + `.test.ts` |
| Readiness data | `lib/useReadiness.ts` |
| Questionnaire | `lib/strategy-questions.ts` |
| Old URL redirects | `next.config.mjs` |
| Original handoff package | `docs/handoff/` |
| Superseded design system | `CLAUDE.editorial-architect.md` |
