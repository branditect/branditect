# Why the navigation changed

Context for whoever implements this. Audited against the live app at branditect.io.

## The thesis

Monday is boards. Canva is designs. Every app that reads clearly has one object at its centre, and the navigation is that object's anatomy.

Branditect's object is **the brand brain**: one place that knows your strategy, voice, look, products and margins, and makes everything from it. Three verbs, in order: **Define → Feed → Make.**

Read the nav top to bottom and you get the pitch. That's the test.

## What was wrong

**Broken.** `Growth` 404s. `Finance Rules` points at `/dashboard/finance`, which 404s. `Productivity` loads `/dashboard/tools` — the same page as `Calculators` — and both entries highlight as active at the same time. Three of nineteen nav entries were dead or duplicated.

**Two navigations.** A top bar repeating Dashboard, Create and Brand Library from the sidebar. Its `Brand Library` link landed on Visual Identity, not the Brand Library.

**Four names for one thing.** Notes (sidebar), Draft Pad (URL, onboarding step 4, and a Mission Board tab), Quick Note (Home widget), Favorites (Mission Board tab) — all holding the same saved text.

**Four places to put a file.** Knowledge Vault, Asset Library, Visual Identity → Asset package, and Templates. Nothing told a user which one a brochure belonged in.

**Three ways to write the same post.** `/dashboard/create` (type, channel, tone, format, checks), `/dashboard/copy-architect` (its own type tabs), and six Quick Create tiles on Home. Two of those tiles — `Brand Audit`, `Write Ads` — mapped to nothing.

**Strategy already contained Voice.** The Brand Strategy page ended with Brand Voice, do/don't examples and always/never word lists: the entire Tone of Voice page, restated.

**No first thing on Home.** Quick Create, Strategic Goals, Today's Focus, Quick Note, Latest, Recent Outputs and Brand Pulse all rendered at equal weight. Seven modules, no lead. Brand Pulse — the one number saying whether the brain was trained — was the last card in the right rail, below the fold.

**Ghost surfaces.** Recent Outputs credited work to "Content Architect" and "Financial Tools". Neither appeared anywhere in the navigation.

**The welcome modal never left.** It reopened over every page on every load, covering the pages it was telling you to visit.

## What the new structure does

Nineteen sidebar destinations become six. Maximum depth three. Every existing screen lands somewhere or is deliberately cut.

Two changes carry most of the improvement:

**Readiness leads.** The score moves from the bottom of the right rail to the top of the page, and What's Next becomes its breakdown rather than a second, contradicting list. One computation, two views.

**Numbers becomes a destination.** The Create page already had a `Brand + Financial + Pulse` checks toggle while Finance Rules 404'd — the product already assumed financial constraints gated output, with nowhere for them to live. Pricing is positioning: Deklan's own strategy uses the €150–200 price point as a pillar. The claim this unlocks — *it won't write a promo that kills your margin* — is one no agency tool can make.

## Naming decisions worth not relitigating

**Knowledge, not Vault.** A vault protects things; this feature's job is the opposite — it's fuel, it wants to be read. "Knowledge" names the function rather than the container, and makes the sidebar read as a sentence: Brand → Knowledge → Studio. It also merged the old "Knowledge Vault" and "Asset Library" into one word. `Library` was unavailable because Studio needs it for saved outputs.

**Numbers, not Finance.** "Finance" promises invoicing, VAT and P&L. The scope guardrail: *if a number doesn't change what Studio writes or what you'd price something at, it doesn't belong there.*

**Plain nouns in the nav.** "Architect" was a suffix on five items — Image, Copy, Code, Brand Code, Social Strategy. As a brand voice it works; as five labels in a column it stops distinguishing anything. Keep it for page titles.
