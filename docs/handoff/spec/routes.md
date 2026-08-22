# Routes

## Target map

Auth routes and their rules are in `spec/auth.md`. Summary:

```
/login  /signup  /forgot-password  /reset-password  /verify-email  /logout
```

## App map

```
/                              → redirect to /home (authed) or /login
/home                          Home
/onboarding                    First run — 4 full-screen gates, see spec/auth.md

/brand                         → redirect to /brand/strategy
/brand/strategy                Strategy (strip the duplicated voice section from the bottom)
/brand/tone-of-voice           Tone of voice — the single home for tone
/brand/visual-identity         Visual identity — logos, colour, type, brand guideline upload
/brand/products                Products — list + drawer, see spec/products.md
/brand/products/:id            Deep link to one product (opens the drawer, or a full
                               page below 1280px where the drawer is hidden)

/knowledge                     → redirect to /knowledge/documents
/knowledge/documents           Documents
/knowledge/images              Images (tagged)
/knowledge/presentations       Presentations
/knowledge/links               Links

/studio                        → redirect to /studio/write
/studio/write                  Write
/studio/create-images          Create images
/studio/brand-assets           Brand assets

/numbers                       Numbers landing — profile, calculators, running costs
                               (see spec/numbers.md; this is a real page, not a redirect)
/numbers/cost                  1 · True cost per unit / Cost to serve one customer
/numbers/pricing               2 · Pricing & margin
/numbers/offers                3 · Offers & discounts
/numbers/recurring             4 · Recurring revenue (only when charges = recurring)
/numbers/running-costs         5 · Running costs & break-even

  Each accepts ?product=:id to prefill. Without it, the calculator runs in
  quick-calculation mode with no Apply to product action.

/chat                          AI Chat
```

## Redirects from today's URLs

Permanent (301). Every one of these is live now — bookmarks and any links already sent to users will break without them.

| Old | New |
|---|---|
| `/dashboard` | `/home` |
| `/dashboard/brand-strategy` | `/brand/strategy` |
| `/dashboard/brand-strategy/social` | `/brand/channels` *(see note)* |
| `/dashboard/brand-library/tone-of-voice` | `/brand/tone-of-voice` |
| `/dashboard/brand-library` | `/brand/visual-identity` |
| `/dashboard/catalog` | `/brand/products` |
| `/dashboard/brand-library/knowledge-vault` | `/knowledge/documents` |
| `/dashboard/assets` | `/knowledge/images` |
| `/dashboard/brand-library/templates` | `/knowledge/links` |
| `/dashboard/copy-architect` | `/studio/write` |
| `/dashboard/create` | `/studio/write` |
| `/dashboard/brand-library/image-architect` | `/studio/create-images` |
| `/dashboard/brand-code-architect` | `/studio/brand-assets` *(see note)* |
| `/dashboard/draft-pad` | `/studio/write` |
| `/dashboard/mission-board` | `/home` |
| `/dashboard/tools` | `/numbers/profitability` |

**Note — Social Strategy.** `/dashboard/brand-strategy/social` currently exists and works. The approved nav has no home for it. Either add `Channels` as a fifth item under Brand, or park the route and hide the entry. Do not leave it linked from a page that no longer exists in the nav.

**Note — Code Architect.** `/dashboard/brand-code-architect` is a real working feature (screenshots → on-brand HTML) with nowhere to live in the five-card Studio. Decide before shipping: fold it behind the `More` card, or drop it from the nav and keep the route reachable by link.

## Delete

These 404 today or duplicate another route. Remove the nav entries and the routes.

- `/dashboard/growth` — 404
- `/dashboard/finance` — 404 (the "Finance Rules" nav entry points here)
- `/dashboard/tools` reached from both `Calculators` and `Productivity`; both highlight as active at once

## Also delete

The **top navigation bar**. Every destination in it already exists in the sidebar, and its `Brand Library` link lands on Visual Identity rather than the Brand Library — which is its own bug. One navigation, no exceptions.

## Data each route needs on first paint

`/home` is the only complex one:

| Region | Needs |
|---|---|
| Greeting | user first name |
| Readiness hero | the four `ReadinessInputs` from `spec/readiness.ts` |
| Knowledge tiles | counts: documents, images, products, presentations, links |
| What's next | derived from readiness — no separate fetch |
| Recent activity | last 4 events: type, title, timestamp |
| AI Chat rail | indexed file count, last exchange, 3 suggested prompts |

`What's next` must be **derived from the readiness computation**, not fetched separately. Two sources for one truth is how the current app ended up with a hero saying "you're doing great" beside a panel listing three unfinished things.
