# Pricing — a recommendation

Built from current model prices, checked August 2026. Verify before you publish anything: these
move, and the whole ladder is derived from them.

---

## First, what an action actually costs you

| Model | Price | Source |
|---|---|---|
| Gemini 3.1 Flash Image | $0.067 per 1K image · $0.045 at 0.5K | Google AI pricing |
| Gemini 3.1 Flash **Lite** Image | $0.034 per 1K image | Google AI pricing |
| Gemini 3 Pro Image | $0.134 per 1K image | Google AI pricing |
| Claude Haiku 4.5 | $1 in / $5 out per MTok | Claude pricing |
| Claude Sonnet 5 | $2 in / $10 out per MTok | Claude pricing |

**Your route calls `gemini-2.5-flash-image`, which is no longer on the pricing page.** Check it
still responds, and plan the move to `gemini-3.1-flash-image`. Note the Lite variant at half the
price — for a first draft that someone will regenerate anyway, Lite may be the right default with
the full model behind a "make it properly" action.

At roughly $1.08 to the euro:

| Action | Your cost |
|---|---|
| One generated image | **≈ €0.06** |
| One copy generation, 3 drafts | **≈ €0.02** (Sonnet) · €0.01 (Haiku) |
| One AI Chat message with brand context | **≈ €0.02** |

**Images cost about three times what text costs.** That single fact should shape the credit model,
because a flat "1 action = 1 credit" either overcharges writers or bankrupts you on image users.

---

## The change I would make to your plan

You said: free for 7 days, then subscribe, because their brand information is already in there.

The instinct is right and the mechanism is backwards. **The lock-in only works if they can still
log in.** A trial that expires and locks the door destroys the very asset that converts them —
they stop seeing their strategy, stop feeling the pull of the work they put in, and simply forget.
Someone who can log in and look at their own brand brain every week, but cannot generate much, is
being reminded of what they built and what they are missing. That is a far stronger position than
a paywall.

So: **free forever, capped by credits rather than by a clock.**

They keep their strategy, their guidelines, their products, their saved outputs — permanently.
What they run out of is throughput. Every time they want to make something, the upgrade prompt
lands at the exact moment of intent, which is the only moment it ever works.

**No countdown at all.** A 7- or 14-day window creates a "your trial has ended" moment, generates
a class of support email, and punishes the founder who signs up on a Friday and gets busy — which
is most of them. A credit balance does none of that: it only runs down when someone has actually
had value out of it.

---

## The credit unit

Two counters is honest but nobody wants to track two numbers. One counter, weighted:

```
1 image                    = 3 credits
1 copy generation (3 drafts) = 1 credit
1 AI Chat message          = 1 credit
Indexing a document        = free
```

So **1 credit ≈ €0.02 of cost to you**, whichever way it is spent. The weighting is legible ("an
image costs three"), and it stops an image-heavy account quietly eating a text-priced plan.

Indexing stays free deliberately. Charging someone to feed the brain is charging them to make your
product better at its job, and it discourages the exact behaviour that makes them stay.

---

## The ladder

Prices shown **including Finnish VAT at 25.5%**, because the first users are in Finland and a
consumer-facing price should be the price they pay. See the VAT section for what changes when you
sell to a business in another EU country.

| | **Free** | **Pro** | **Pro Plus** | **Enterprise** |
|---|---|---|---|---|
| Price inc. VAT | €0 | **€44.90/mo** | **€59.90/mo** | Contact us |
| Annual inc. VAT | — | €449/yr | €599/yr | — |
| Credits | **100, one-time** + 10/mo | **550/mo** | **800/mo** | Agreed |
| Brands | 1 | 1 | **3** | Unlimited |
| Seats | 1 | 1 | **3** | Agreed |
| Storage | 200 MB | 5 GB | 20 GB | Agreed |
| Brand kit share link | — | ✓ | ✓ | ✓ |
| Support | Docs | Email | Email, priority | Named contact |

### What you actually keep

| Shown | ex-VAT | Card fee ~3% | **Net to you** |
|---|---|---|---|
| €44.90 | €35.78 | €1.35 | **€34.43** |
| €59.90 | €47.73 | €1.80 | **€45.93** |

VAT-inclusive pricing at €44.90 nets you more than €29.90 ex-VAT did (€34.43 against €29.00), so
this is a real price rise, not just a relabel. Worth knowing that is what you are doing.

### What a plan buys, and what it costs you

One credit costs you about €0.02 whichever way it is spent.

| | Pro · 550 credits | Pro Plus · 800 credits |
|---|---|---|
| All images | 183 | 266 |
| All chat | 550 messages | 800 messages |
| All copy | 550 generations (1,650 drafts) | 800 (2,400 drafts) |
| Worst-case cost to you | €11.00 = **32%** of net | €16.00 = **35%** of net |

Worst case means burning the whole allowance. Typical consumption runs 20–30% of allowance, so
your real average will be nearer €3–5 per paying account.

**Nobody generates one image and stops.** They make four and pick one — the Again button
guarantees it. So 183 image generations is realistically 45–50 finished images a month.

---

## What a free user costs you

The important finding first.

### The brand strategy costs eleven cents

| | |
|---|---|
| Three voice preview heroes at Q18 | €0.017 |
| The strategy document itself | €0.040 |
| The homepage hero written at the gate | €0.005 |
| Analysing an uploaded brand guideline | €0.030 |
| Indexing a couple of other documents | €0.020 |
| **The entire onboarding experience** | **€0.11** |

You were right that the strategy is what hooks people, and the economics agree completely: **the
thing that engages them is essentially free to give away, and the thing that costs money is
images.** Text is cheap; pictures are not.

So be lavish with the questionnaire, the strategy, the tone of voice and the chat. Be careful with
image generation. Every instinct you have about giving the strategy away is correct, and you can
afford to go further with it than you probably think.

### The full picture

| | |
|---|---|
| Onboarding, one-time | €0.11 |
| 100 credits, fully burned | €2.00 |
| **Total per free signup, worst case** | **€2.11** |
| Storage, 200 MB, per month | €0.004 |

### One-time, not monthly — this is the decision that matters

**100 credits as a one-time grant costs €2.11 per signup, ever.** A thousand signups is €2,100 in
total, and a free user who never converts stops costing you anything.

**100 credits *per month* costs €2 per free user per month, forever.** A thousand free accounts is
€2,000 every month whether anyone converts or not. That is the difference between a growth cost
and a structural leak, and it is invisible until it is large.

So: **100 credits once, at signup, no expiry.** No 14-day clock either — an expiry date creates a
"your trial ended" moment and a class of support email, and it punishes the person who signed up
on a Friday. Let them spend it at their own pace.

Then **10 credits a month, granted on login rather than by a scheduled job.** Dormant accounts
cost nothing, and the trickle gives someone a reason to come back and see their brand brain again.

### The number that makes this safe

A Pro customer over twelve months: €413 net revenue, €124 to serve, **€289 gross profit.**

| | |
|---|---|
| Break-even conversion | **0.73%** — 1 in 137 signups |
| At 2% | 100 signups cost €211, return €578 |
| At 3% | 100 signups cost €211, return €868 |
| At 5% | 100 signups cost €211, return €1,446 |

Typical freemium converts at 2–5%. You need **0.73%**. There is an enormous amount of room here,
which is the real argument for being generous rather than cautious with the free tier.

### The actual risk is abuse, not cost

€2.11 a signup is nothing. A hundred accounts farmed by one person for free credits is €211 and a
distorted view of your funnel. Guard it cheaply:

- Verified email before credits are granted
- One grant per email address, ever — even after deletion and re-signup
- Watch signups-per-domain in HQ; a spike is either a real team or a farm, and both are worth a
  message

---

## VAT, as a Finnish seller

**Finland's standard rate is 25.5%**, raised from 24% on 1 September 2024.

You are showing **€44.90 including VAT**, which is the right call for Finnish customers — a price
someone pays is the price they should see. What it means underneath:

| Customer | Treatment | You keep |
|---|---|---|
| Finnish business or consumer | €44.90 inc. 25.5%; you remit €9.12 | **€35.78** |
| EU business with a valid VAT number | Reverse charge — charge €35.78, no VAT | €35.78 |
| EU consumer, other country | Their rate, filed through OSS | varies |
| Outside the EU | No EU VAT | €35.78 |

**The catch with inclusive pricing across borders.** A German consumer pays 19% VAT, a Hungarian
27%. If you show one inclusive price everywhere, your net revenue changes by country — €44.90 inc.
VAT nets €35.78 in Finland and €37.73 in Germany. That is fine, and simpler than showing a
different price in every country. Just know the number moves.

For EU business customers, the honest display is **"€35.78 excl. VAT"** once they enter a valid
VAT number, since reverse charge means you never collect it. Stripe Tax handles this switch
automatically at checkout.

Validate EU VAT numbers through VIES before applying reverse charge — an unvalidated number that
turns out to be wrong leaves you owing VAT you never collected.

Cross-border B2C has a €10,000 annual threshold; below it you charge Finnish VAT, above it the
customer's country rate through the Union OSS scheme — one quarterly return covering all 27 states
rather than 27 registrations. Set this up before the first paid signup; retrofitting tax onto live
subscriptions is genuinely unpleasant.

Corporate tax in Finland is 20%, on profit rather than revenue, so it should not influence the
price. **None of this is tax advice — confirm your own position with your accountant.**

---

## Three things to get right around the price

**Annual billing is worth more than it looks.** Two months free is the standard shape and it does
two things at once: cash up front, and a customer who cannot churn in month three. Offer it at
signup, not buried in settings.

**Never hold their data hostage.** Your lock-in is that everything is already in there — which
means the export button must exist and be obvious. GDPR gives them the right anyway, and
counter-intuitively a visible export raises conversion, because the fear of being trapped is what
stops people committing in the first place.

**Do not publish these numbers as final.** Run the demo cohort on them, watch the cost-to-serve
scatter in HQ for six weeks, and then set the real allowances. That is the entire reason
`usage_events` comes before the dashboard: you are currently guessing at consumption, and in six
weeks you will not have to.

---

## What I would not do

**No per-seat pricing below Enterprise.** Your buyer is a founder or a small team; per-seat makes
them ration access to their own brand brain, which is the opposite of what you want.

**No feature-gating the brand brain.** Strategy, tone of voice, Knowledge and Readiness stay
available on every tier including Free. Gate *output*, never *understanding* — a Free user who can
see their own strategy is a walking advertisement, and one who cannot is a churned account that
never happened.

**No credit rollover.** It sounds generous and it turns your cost forecasting into guesswork,
because a year of hoarded credits can land in one month.
