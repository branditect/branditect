# Documentation audit — 2026-09-03

Every `.md` in the repo read against the shipped code. Findings are verified against `lib/nav.ts`,
the `app/**/page.tsx` route list, `next.config.mjs`, `lib/pricing-plans.ts` and `git ls-files` —
not inferred.

Fix top to bottom. The first item is structural and makes the rest durable.

---

## 0 · The living specs are not in version control

```
git ls-files | grep -c "^branditect-ui/"   →  0
git ls-files | grep -c "^docs/handoff/"    →  15
```

`branditect-ui/` is untracked. It is not in `.gitignore` — it was simply never added. And it is the
directory the code actually cites:

```
lib/auth-errors.ts          "Auth copy, from branditect-ui/spec/auth.md"
lib/onboarding.ts           "Rules from branditect-ui/spec/onboarding.md"
lib/strategy.ts             "from branditect-ui/spec/strategy.md"
lib/studio-write.ts         "Ported from branditect-ui/spec/studio-write.md"
lib/start-route.ts          lib/pricing-plans.ts
lib/image-brief.test.ts     lib/product-attachments.test.ts     lib/strategy.test.ts
```

Nine references to the untracked copy; one — `lib/numbers.ts` — to `docs/handoff`. So the specs
being written and cited today exist only on one laptop, while the frozen 2026-08 handoff package is
the part with history. That is exactly backwards.

**Fix.** `git add branditect-ui/` and commit. Leave `docs/handoff/` where it is: `CLAUDE.md:89`
calls it the *"Original handoff package"* and it is worth keeping as the record of what was
originally asked for. It stops being a place anyone reads for current truth.

Then add one line to `CLAUDE.md` so the split is stated rather than inferred:

> `branditect-ui/spec/` is current and authoritative. `docs/handoff/` is the original August handoff,
> frozen — read it for history, never for what to build.

### Five files exist twice and have diverged

| File | Differs by | Which is right |
|---|---|---|
| `spec/routes.md` | Numbers routes | **docs/handoff** — it lists `cost · offers · pricing · recurring · running-costs`, which is what shipped. `branditect-ui` invents `/numbers/profitability` and `/numbers/product-costs`, neither of which exists |
| `spec/components.md` | `<AccountMenu>` | **branditect-ui** — both say "eleven components", only branditect-ui defines eleven |
| `spec/auth.md` | SSO buttons, feature cards | **branditect-ui** — three demo-tagged SSO buttons is what ships; see finding 9. Its `:211` feature-card list still needs finding 8's fix |
| `README.md`, `IMPLEMENTATION.md` | handoff has a Numbers section | **docs/handoff** is more complete |

Before deleting anything, port the Numbers route list from `docs/handoff/spec/routes.md` into
`branditect-ui/spec/routes.md`. It is the one place the frozen copy is more accurate than the live one.

---

## HIGH · would cause wrong code to be written

**1 · `CLAUDE.md:16` — the Numbers row of the nav table is wrong.**

```
Numbers     define · Profitability · Product costs · Pricing & offers
```

Numbers has **no children in the nav**. The routes that exist are `/numbers`, `/numbers/cost`,
`/numbers/offers`, `/numbers/pricing`, `/numbers/recurring`, `/numbers/running-costs` — so all three
names in that line are also wrong as route names. This is the nav table in the file every session
reads first, so it is the highest-leverage line in the repo to get right.

Replace with:

```
Numbers     define · one landing page; cost, pricing, offers, recurring and running costs
                     are routes beneath it, not nav children
```

**2 · `/brand/products` appears in six places and does not exist.**

Products moved to Knowledge on 2026-08-22 — `CLAUDE.md:36` says so, and these were never updated:

| | |
|---|---|
| `spec/products.md:3` | ``Route: `/brand/products`.`` |
| `spec/routes.md:22-23` | two entries |
| `spec/routes.md:56` | redirect target |
| `spec/numbers.md:167` | ``Opens `/brand/products/:id` with those fields pre-filled`` |
| `spec/create-images.md:61` | ``same source as `/brand/products``` |
| `spec/visual-identity.md:23` | calls it an *"unresolved split"* |

All become `/knowledge/products`. `visual-identity.md:23` needs more than a substitution — see
finding 5.

**3 · `spec/products.md` describes three things that were deliberately removed.**

| Line | Says | Actually |
|---|---|---|
| 113 | *"Write about it · Make images · Ask about it"* | Row removed |
| 119 | *"a `What Branditect knows` block"* | Section removed |
| 121 | *"the guardrails panel... displayed here"* | Guardrails moved to Numbers ▸ Pricing & offers |
| 50-51 | `sourceFileCount` / `imageCount` on the interface | Both deleted from `lib/products.ts` |

Every one of these is an instruction to rebuild something that was taken out on purpose.

**4 · `spec/products.md:91` has the cost labels backwards.**

> `| Cost | Landed cost | Header says "Cost", not "COGS" — the value is landed |`

The shipped card labels `landed_cost` as **COGS** and `price_cogs` as **Unit cost**. A builder
following this line would relabel the column back.

**5 · `spec/visual-identity.md:23` reopens a settled decision.**

It calls the location of Visual identity *"the same unresolved split as `/knowledge/products` vs
`/brand/products`"* and recommends moving it to Knowledge. It shipped under **Brand**, and
`/brand/products` does not exist. Delete the paragraph rather than editing it — a spec that argues
for a move already decided against will get acted on eventually.

**6 · `spec/pricing.md` carries the superseded price points.**

Line 87 and the whole VAT table below it say **€44.90** and **€59.90**. The live figures in
`lib/pricing-plans.ts` and on `/pricing` are **€29.90** and **€45.90**, both including 25.5% VAT.

`lib/pricing-plans.ts:9-12` shows the trap already sprung once — the builder found the conflict,
reasoned about it and picked correctly. It should not have had to. Recompute the VAT and net-revenue
tables at the real prices; the credit allowances (350 / 600) are already right elsewhere.

**7 · `spec/numbers.md:150` and `IMPLEMENTATION.md` still put guardrails on the product card.**

> *"Stored on the product, **displayed** in the product drawer's Pricing tab, **edited** in Numbers."*

They are no longer displayed on the card. One home, one place. `spec/product-card-rebuild.md`
section 4 is the current word.

**8 · `spec/routes.md:35` and `:63` still list `/studio/brand-assets`.**

The page is deleted and `next.config.mjs` permanently redirects it — along with
`/dashboard/brand-assets` — to `/brand/visual-identity`. Line 63 makes it a *redirect target*, which
would send `/dashboard/brand-code-architect` to a 308.

`spec/auth.md:211` also advertises a *"Brand assets"* feature card on the login page. That surface no
longer exists.

---

## MED · stale, not dangerous

**9 · `spec/auth.md` — RESOLVED 2026-09-03, no code change.**
~~Two copies disagree about sign-in and neither was checked against the app.~~
`components/auth/sso-buttons.tsx` renders three providers — Google, Microsoft and Apple, all
carrying a `Demo` tag and the note *"Demo version. Sign in with email for now."* So
**`branditect-ui/spec/auth.md` is correct** and the `docs/handoff` single-Google version is the
stale one. Delete the handoff copy with the other duplicates in step 5 of the order below.

**10 · `spec/product-card.md` proposes `document_links` and `asset_links` as new tables.**
They shipped as `product_documents` and `product_images`, with RLS, a partial unique index on
`is_primary` and a `product_attachment_counts` view. Lines 58, 69 and 79 are headed *"— new"* and
are not. This whole spec is superseded by `spec/product-card-rebuild.md` plus
`spec/product-attachments.md`; mark it so at the top rather than editing it line by line.

**11 · `spec/components.md:144` — `<StudioCard>` still offers an `'assets'` variant.**
Studio has two children. An `'assets'` tile would be a dead nav entry, which `CLAUDE.md` calls worse
than a missing feature.

**12 · `spec/strategy.md`** lists *"Tone of voice · Visual identity · Products"* as where to go next,
grouping Products with two Brand children. Products is under Knowledge.

**13 · `IMPLEMENTATION.md`** heads a section *"Parallel track — Brand ▸ Products"* and tells the
builder the *"use this product"* row *"is why the page exists"*. Both wrong now.

**14 · `CLAUDE.md:26`** says the Brand assets page *"survives only as the upload destination Visual
identity links to, and is being folded into Visual identity next."* That fold is in the working tree
now — the page is gone, `components/visual-identity/uploads.tsx` exists, the redirect is in
`next.config.mjs`. Update the sentence in the same commit that lands the move.

---

## What is already correct

Worth saying, so nobody re-checks it: `CLAUDE.md`'s Brand and Knowledge nav rows, the Define → Feed →
Make rule, the naming rules, the margin rule, Brand Readiness, `spec/numbers.md`'s formulas,
`reference/ia-audit.md`, `spec/wordmark-fix.md`, `spec/visual-identity-fixes.md`, and the four specs
written this week — `product-card-rebuild.md`, `product-attachments.md`,
`product-attachments-tags.md`, `document-upload-asks.md`.

---

## Order

1. `git add branditect-ui/`, and add the authority line to `CLAUDE.md`. Nothing below survives a
   laptop without this.
2. `CLAUDE.md:16` and `:26`. One file, two lines, read every session.
3. Findings 2 and 8 — the dead routes. Mechanical.
4. Findings 3, 4, 5, 6, 7 — the specs that would rebuild removed things.
5. Port the Numbers routes from `docs/handoff/spec/routes.md`, then delete the four duplicate files
   that lose nothing.
6. The MED list.

Finding 9 is closed — the login page renders three demo-tagged SSO buttons, so `branditect-ui`
wins. Everything is decided.

### Progress

- **0 · done** — `8b17c04` tracked all 69 files of `branditect-ui/`; `CLAUDE.md` states the
  authority split. The Numbers-route port and the duplicate deletions are still open (step 5).
- **1 · done** — `f6dbf19` fixed the Numbers nav row and added a test that compares the CLAUDE.md
  nav table against `lib/nav.ts` as an exact ordered list.
- **9 · closed** — no code change; see above.
- **14 · done** — the CLAUDE.md:26 sentence landed in `2531703`, the same commit as the move,
  which is what this finding asked for. It was written against the tree before that commit.
