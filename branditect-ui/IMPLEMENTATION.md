# Implementation plan

Six phases, ordered by clarity gained per unit of work. Phases 1 and 2 are mostly deletion and produce most of the visible improvement — do them first even if the rest slips.

Open `reference/dashboard.html` in a browser before starting. Read `CLAUDE.md`.

---

## Before phase 1 — three answers needed

Don't start without these. Each one changes the shape of the work.

1. **Styling system.** Tailwind, CSS modules, or something else? Use `design/tailwind.theme.cjs` or `design/tokens.css` accordingly, and delete the one you don't use so they can't drift.
2. **Existing components.** Is there a component library or a `components/ui` directory already? Reuse beats rebuild — `spec/components.md` describes shapes, not files to create blindly.
3. **Data for the readiness inputs.** Do `questionnaireComplete`, `knowledgeFileCount`, `brandImageCount` and `hasBrandGuideline` exist as queryable state today? If not, that's backend work and it blocks phase 4, not phases 1–3.

---

## Phase 1 — delete what's already broken

Pure removal. Nothing is lost.

- Remove nav entries and routes: `Growth` (404), `Finance Rules` → `/dashboard/finance` (404), `Productivity` (duplicate route to `/dashboard/tools`, and both entries highlight as active simultaneously).
- Remove the **top navigation bar** entirely. Every destination is already in the sidebar, and its `Brand Library` link goes to Visual Identity, which is a bug in itself.
- Fix the welcome modal so it shows **once**. It currently reopens over every page on every load, including the pages it tells you to visit.

**Done when:** no nav entry 404s, there is exactly one navigation, and a reload doesn't reopen the modal.

---

## Phase 2 — regroup the sidebar

Re-parenting plus redirects. No page needs rebuilding yet.

- Build `<Sidebar>` per `spec/components.md` with the six primary items and their children.
- Add the new routes and the 301s in `spec/routes.md`.
- Decide the two open questions flagged there: where **Social Strategy** lives, and what happens to **Code Architect**.

**Done when:** every old URL redirects, sub-nav expands and collapses, the active section is expanded on load, and nothing in the app links to a path that no longer exists.

---

## Phase 3 — tokens and the icon set

- Install the tokens as the project's theme. One source of truth.
- Add the 19 icons from `assets/icons/` as a sprite or component set.
- Set the base font to Plus Jakarta Sans, body weight **500** (see `design/type-scale.md` — 400 is meta only).

**Done when:** no component contains a raw hex value, and swapping one token visibly changes every place it's used.

---

## Phase 4 — Brand Readiness

- Port `spec/readiness.ts` and its tests.
- Wire the four inputs to real data.
- Build `<ReadinessCard>` and `<WhatsNextPanel>`.

Both components read the **same** `Readiness` object. `WhatsNextPanel` renders `readiness.checks` — it does not fetch its own list. This is the fix for the current app, where a hero claiming 87% sits beside a panel listing three unfinished things.

**Done when:** uploading a brand guideline moves the score from 75 to 100, flips the row to `Done`, changes the band pill to `Complete`, and updates the greeting subtitle — all without a second query, and without any number stored anywhere.

---

## Phase 5 — the rest of Home

- `<StudioCard>` × 5 with the gradient variants.
- `<ActivityList>` — check every title names a surface that exists in the nav.
- `<ChatRail>` with the `TRAINED` badge, indexed count, three suggestions, and the source chip on answers.

**Done when:** Home matches `reference/dashboard.html` at 1280px, 1440px and 1920px, and fits 1280px with no horizontal scroll.

---

## Phase 6 — copy and assets

- Replace icon and artwork stand-ins with the Figma exports.
- Sweep the copy: "Brand Vault" → "Knowledge" everywhere; fix the `Create new campaing` typo; make every sublabel carry real state rather than filler.
- Delete the duplicated Figma layers if anyone is still working from that file — `58:14084` (a full copy of the What's next panel parked at y=804) and `58:14070` (a Studio card stacked exactly on top of `58:13949`).

**Done when:** no user-facing string names a concept that isn't in the nav.

---

---

## Parallel track — Brand ▸ Products

Independent of Home. Depends only on phase 3, the tokens. Full spec in `spec/products.md`; design in `reference/products.html`.

- Build the list as a real `<table>`, with a 400px slide-over drawer. Below 1280px, a row click routes to a full page instead of opening the drawer.
- **Default sort is margin ascending.** Worst-margin products first is the most useful thing this page can say on load.
- Port the `margin()` function from `spec/products.md` verbatim. The obvious calculation — factory cost against gross price — overstates by roughly five points, and a max-discount rule built on it eats the difference on every promotion. Net price after tax, against landed cost.
- Build the "use this product" row: Write about it · Make images · Ask about it, each opening the matching Studio surface pre-loaded. This row is why the page exists.
- Guardrails (floor price, deepest discount, minimum margin) are **displayed** in the Pricing tab and **edited** in Numbers ▸ Pricing & offers. One home, two places it shows.
- Hold the scope line: stock *status* stays, stock *management* doesn't. No reorder point, supplier or lead time.

**Done when:** a product with no landed cost shows `—` for margin rather than a number derived from factory cost, and the three "use this" actions each land in Studio with the product already selected.

---

## Parallel track — login and first run

Independent of phases 1–5. Only dependency is phase 3, the tokens. If two people are working, this is the clean split.

Full spec in `spec/auth.md`; design in `reference/login.html`.

- Build `<AuthLayout>` once, then thin `/login` and `/signup` pages on top of it. **Two routes, not a client-side tab** — the tabs in the reference exist so you can see both states in one file.
- Add `/forgot-password`, `/reset-password`, `/verify-email`, and a **POST-only** `/logout`.
- Take the error copy verbatim from `spec/auth.md`. Two of those strings are security decisions, not preferences: wrong-password and unknown-email must return the **same** message, and the reset confirmation must be non-committal. Different messages let anyone enumerate your users.
- Validate the `next` parameter as same-origin before redirecting. An unchecked `next` is an open redirect.
- Decide on Google OAuth. If it isn't shipping, **delete the button and the divider** — a dead SSO button is the worst possible first interaction.
- Build the four onboarding gates. Full-screen and sequential, never a modal over the dashboard. Steps 1 and 2 are required; 3 and 4 are skippable via an explicit link, and whatever gets skipped shows up as a failing Brand Readiness check.

**Done when:** a new account goes sign-up → 20 questions → strategy document → upload → first output → `/home`, without ever seeing a modal; and a returning user with an incomplete questionnaire lands on `/onboarding` rather than a half-empty Home.

---

## What is deliberately NOT in this plan

**Mission Board, Strategic Goals, Today's Focus.** Cut, or reduced to one collapsible strip on Home. It's the least brand-specific surface in the app and it's where the product starts looking like a worse Monday. Bringing it back is a product decision, not a scope oversight.

**The Numbers data model.** `Numbers` is in the nav with its three children, but nothing behind it. It needs its own design pass — particularly **Rules** (floor price, max discount, minimum margin), which is the piece that makes it brand infrastructure rather than a spreadsheet. That's also where the likely fifth readiness check comes from.

**Dark mode.** The design is light-only by decision. Tokens are structured so a dark palette is a token swap, not a rewrite, if that changes.

---

## Known approximations in the reference file

Do not treat these as final; everything else in the file is exact.

| What | Status |
|---|---|
| All 19 icons | Hand-drawn stand-ins for MingCute filled |
| Studio card artwork | CSS shapes standing in for Figma PNGs |
| Hero "BUILT FOR MORE." tile | Placeholder for real brand imagery |
| Hero gradient | Rebuilt from `92.52deg #f16d2c → #fe4401`; the current Figma frame flattened it to a raster so the value no longer exists there |

Colours, type sizes, weights, spacing, radii, shadows and copy are all lifted from Figma node data and are correct.
