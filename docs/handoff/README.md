# Branditect — Dashboard rebuild package

Everything needed to implement the new Home screen and navigation in the live app.

**Start here:** open `IMPLEMENTATION.md`. It has the phased plan, acceptance criteria per phase, and the order to do things in.

## What's in the box

```
reference/
  dashboard.html      ← the approved design, self-contained, open it in a browser
  ia-audit.md         ← what's wrong with the current app and why the new IA fixes it
design/
  tokens.css          ← CSS custom properties: colour, type scale, radii, shadows
  tailwind.theme.cjs  ← the same tokens as a Tailwind theme extension
  type-scale.md       ← every text role with its exact size/weight/colour
spec/
  routes.md           ← new route map + the redirects the old URLs need
  readiness.ts        ← Brand Readiness scoring: types + pure function + tests
  components.md       ← component inventory with props and states
assets/icons/         ← 19 SVGs, 24×24, currentColor
CLAUDE.md             ← drop this at the repo root before starting
```

## The one-line summary

The app's job is to be **the brand brain**: define your brand, feed it what you know, make everything from it. Navigation is `Home · Brand · Knowledge · Studio · Numbers · AI Chat`, and the Home screen leads with Brand Readiness — a score computed from four explicit checks, where every gap is a link to the thing that closes it.

## Read this before writing code

`reference/dashboard.html` is a **visual specification, not source to port**. It's one hand-written file with plain CSS and hardcoded content. Do not lift it wholesale into the app. Take from it: exact colours, sizes, weights, spacing, radii, copy, and layout. Rebuild it with the project's own components, data fetching, and conventions.

Three things in it are approximations, flagged here so nobody treats them as final:

1. **Icons** are hand-drawn stand-ins for the MingCute filled set used in Figma. Replace with the real exports if the licence allows; the SVGs in `assets/icons/` are correct in size, weight and colour behaviour.
2. **Card artwork** — the pen, the purple image card, the coloured bars, the collage tile — is CSS shapes standing in for exported PNGs from Figma.
3. **The "BUILT FOR MORE." tile** in the hero is a placeholder for whatever brand imagery ships there.

The Figma file this came from is `WyphBCrLRfCaUkqZb2Fskf`, frame `58:13755`.
