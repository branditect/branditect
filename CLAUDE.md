# Branditect — working notes

## What this app is

Branditect is a brand brain. One place that knows a company's strategy, voice, look, products and margins, and produces on-brand output from them. Three verbs in order: **Define → Feed → Make.**

Every screen belongs to exactly one of those. Anything that belongs to none of them is a candidate for deletion, not a new nav item. This test resolves most product arguments before they start.

## Navigation — the shape it must keep

```
Home        the landing screen: readiness, then what to make
Brand       define · Strategy · Tone of voice · Visual identity · Channels
Knowledge   feed   · Products · Documents · Images · Presentations · Links
Studio      make   · Write · Create images
Numbers     define · Profitability · Product costs · Pricing & offers
AI Chat     the brand-trained assistant
```

Rules that hold across changes:

- **One navigation.** There is no top nav bar duplicating the sidebar. The old app had both; that was the single biggest source of confusion.
- **Max depth 3.** Section → sub-section → detail. No fourth level.
- **Max 6 primary items.** Adding a seventh means something else merges or leaves.
- **No dead entries.** A nav item that 404s is worse than a missing feature. The old app shipped three.
- **One home per concept.** A thing belongs in exactly one place. Logos, colours and typefaces live on **Brand ▸ Visual identity**; the Studio "Brand assets" tab was the same library reached a second way and was retired on 2026-09-03. The page survives only as the upload destination Visual identity links to, and is being folded into Visual identity next.

## Naming

Nav labels are plain nouns a user already knows. Keep "Architect" for page titles and product voice if you want it, never as a nav label — five items ending in "Architect" stop distinguishing anything.

Words that mean one thing each:

- **Knowledge** — everything you feed the brain: products, files, images, links. Not "Vault", not "Library", not "Assets".

**Products lives under Knowledge, not Brand** (moved 2026-08-22). Apply the Define → Feed → Make test: a product is something the brain *learns about*, not something that defines the brand's identity. The Products spec says it itself — "Products is where the brand brain learns what you sell." Brand holds the things you decide; Knowledge holds the things you feed it.
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

## Numbers

**Calculators are a sandbox.** They read from a product to prefill and never write back. The only bridge is one explicit **Apply to product** action, which pre-fills the product form for the user to confirm and save. Do not add auto-save or sync.

**The product card is the live version.** There is no live/draft state, nothing to promote, and Studio's guardrails read the product record — never a calculator session.

**Per sale and per month stay apart.** Calculators 1–4 are variable costs; running costs are fixed. Mixing altitudes is how someone ends up subtracting rent from a unit price.

**Margins are always net of tax, against landed cost.** Factory cost against gross price overstates by about five points. The formulas live in `lib/numbers.ts` (tests in `lib/numbers.test.ts`) — ported from `docs/handoff/spec/numbers.md`, not rewritten.

**Guardrails are per product.** A £6 clip can't carry a £99 floor. And the floor price is the higher of two tests: minimum margin, and covering overhead at your volume.

**Do not allocate overhead per unit.** It makes every product's margin depend on how many of everything else sold. Contribution plus a break-even figure gives the same insight without the instability.

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

## Testing against real data

**Never run a browser check against a real product, document or brand record.**
Use the scratch product `ZZ TEST — do not use`
(`43655187-c36a-445c-ab29-1b485f7e60f5`, brand `sorbify-13t9`). If it is missing,
insert one directly — never through `POST /api/catalog`, which deletes every
product for the brand and re-inserts them.

This is not a style preference. Supabase is on the Free plan: **no scheduled
backups, no point-in-time recovery**, and product data is not in the repo or the
build. Anything overwritten is gone. SORBIFY OIL's description was lost this way
on 2026-08-26 — typed over during a browser check that had no business touching
a real row.

**A UI test that fakes events can report a bug the product does not have.**
Synthetic `dispatchEvent(new Event('input'))` does not drive React state, so
fields save empty and the app looks broken when the harness is. Drive the real
thing: CDP `Input.insertText` after `focus()`. And beware escaping — a
JSON-encoded `\n` types a literal backslash-n, which then "proves" that
newlines are being stripped.

**Never run `npm run build` while `npm run dev` is up.** The build rewrites
`.next` underneath the dev server, which then serves 404s for its own JS
chunks. The page renders from server HTML and never hydrates: forms submit
natively, putting the password in the URL, and React state is dead. It looks
exactly like a hydration bug in the app. Stop dev, build, restart dev.

**Run `npm test` before every commit.** `server-only` added in b46c701 broke
`api-auth.test.ts` transitively and the suite stayed red until it was noticed by
accident two commits later.
