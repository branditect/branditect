# Branditect — UI rebuild package

Everything needed to implement the new **login** and **Home** screens, plus the navigation that connects them.

**Supersedes the earlier `branditect-dashboard` zip.** Delete that one — this contains all of it plus auth.

**Start here:** open `IMPLEMENTATION.md`. It has the phased plan, acceptance criteria per phase, and the order to do things in.

## What's in the box

```
reference/
  dashboard.html      ← approved Home design, self-contained, open it in a browser
  login.html          ← approved login / sign-up design, both states in one file
  products.html       ← approved Brand ▸ Products: list + detail drawer
  ia-audit.md         ← what's wrong with the current app and why the new IA fixes it
design/
  tokens.css          ← CSS custom properties: colour, type scale, radii, shadows, controls
  tailwind.theme.cjs  ← the same tokens as a Tailwind theme extension
  type-scale.md       ← every text role with its exact size/weight/colour
spec/
  routes.md           ← app route map + the redirects the old URLs need
  auth.md             ← login, sign-up, error copy, security floor, first-run sequence
  products.md         ← Products data model, the margin formula, scope boundary
  readiness.ts        ← Brand Readiness scoring: types + pure function + tests
  components.md       ← component inventory with props and states
assets/icons/         ← 19 SVGs, 24×24, currentColor
CLAUDE.md             ← drop this at the repo root before starting
```

## Two independent tracks

Login and Home don't block each other. If two people are working, one takes `spec/auth.md` and the other takes phases 1–5 of `IMPLEMENTATION.md`. They meet at the tokens, which should land first.

## The one-line summary

The app's job is to be **the brand brain**: define your brand, feed it what you know, make everything from it. Navigation is `Home · Brand · Knowledge · Studio · Numbers · AI Chat`, and the Home screen leads with Brand Readiness — a score computed from four explicit checks, where every gap is a link to the thing that closes it.

## Read this before writing code

Both files in `reference/` are **visual specifications, not source to port**. Each is one hand-written file with plain CSS and hardcoded content. Do not lift them wholesale into the app. Take from them: exact colours, sizes, weights, spacing, radii, copy, and layout. Rebuild with the project's own components, data fetching, and conventions.

In `login.html` specifically: the sign-in / create-account tab control is a preview device so you can see both states in one file — ship two routes instead. And `onsubmit="return false"` plus `autocomplete="off"` are there only to stop the mockup autofilling; remove both. See `spec/auth.md`.

In `products.html`: the four rows are chosen to cover every state (four categories, in-stock and low-stock, selected and unselected), not because four is the real page size. Product thumbnails are tinted placeholders. The margin figures are computed on net price after VAT against landed cost — `spec/products.md` explains why the obvious calculation is wrong by five points.

Three things in `dashboard.html` are approximations, flagged here so nobody treats them as final:

1. **Icons** are hand-drawn stand-ins for the MingCute filled set used in Figma. Replace with the real exports if the licence allows; the SVGs in `assets/icons/` are correct in size, weight and colour behaviour.
2. **Card artwork** — the pen, the purple image card, the coloured bars, the collage tile — is CSS shapes standing in for exported PNGs from Figma.
3. **The "BUILT FOR MORE." tile** in the hero is a placeholder for whatever brand imagery ships there.

The Figma file this came from is `WyphBCrLRfCaUkqZb2Fskf`, frame `58:13755`.
