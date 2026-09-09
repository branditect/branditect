# Privacy policy and terms

**I am not a lawyer, and this is a draft to be reviewed by one.** What follows is accurate about
what the app actually does, which is the part a template cannot give you and the part most policies
get wrong. The legal sufficiency of the terms in particular is not something I can sign off.

---

## The Gemini tier question — answered, 8 September 2026

`app/api/brand/generate-from-reference/route.ts` sends images to
`generativelanguage.googleapis.com` using `GEMINI_API_KEY`, and Google's terms split hard on tier:

> **Unpaid:** *"Google uses the content you submit to the Services and any generated responses to
> provide, improve, and develop Google products and services"*, and *"human reviewers may read,
> annotate, and process your API input and output."*
>
> **Paid:** *"Google doesn't use your prompts (including associated system instructions, cached
> content, and files such as images, videos, or documents) or responses to improve our products."*

**Checked: the key's project is on Tier 1, postpay.** Tier 1 sits above Free and is reached by
having billing enabled on the project, so this is a paid tier and the protection applies. The
policy's sentence about content not being used for training can stand for Google as well as
Anthropic.

Two things to keep true rather than assume:

- **The tier belongs to the project, not the account.** If the key is ever rotated or moved to
  another project, that project must be on a paid tier before the key ships. Worth a line in
  whatever runbook holds the environment variables.
- **It is a statement about now.** If the project was ever on the Free tier, images sent during
  that period went under the other terms. No customer other than Saara has uploaded anything yet,
  so nothing needs disclosing, but the policy describes the arrangement as it stands today.

---

## What is actually true today, verified in the code

### Four processors, not three

Your list was Vercel, Supabase, Anthropic. **Google is missing**, and it receives images.

| Processor | What it gets | Where |
|---|---|---|
| **Vercel** | Hosting, request logs, IP addresses | Ireland once `dub1` is set. Vercel Inc. is a US company |
| **Supabase** | The database and all uploaded files | West EU (Ireland) |
| **Anthropic** | Text sent for generation: strategy answers, product descriptions, notes, chat | US |
| **Google** | **Images** sent to Gemini for generation and analysis | US |
| Stripe | Nothing yet. Payment details when it is added | — |

**Supabase is West EU (Ireland)**, so customer data stays in the EU at rest. That is the single most
consequential fact in the policy and it is a good one: the database and every uploaded file are in
Ireland. What leaves the EU is text sent to Anthropic and images sent to Google, both in the United
States, under the standard contractual clauses in their processing terms.

### Anthropic's position, quoted accurately

> *"By default, we will not use your inputs or outputs from our commercial products (e.g. Claude for
> Work, Anthropic API, Claude Gov, etc.) to train our models."*

With an exception worth stating rather than hiding: Anthropic may use data where a customer
*"explicitly report[s] feedback or bugs"* or otherwise opts in. **If Branditect ever adds a thumbs
up/down that forwards content to Anthropic, that content leaves the default protection.** There is
no such control today. Do not add one without changing this policy.

### There is no way to delete an account

No route in `app/api` and nothing in Settings deletes a user or their data. The policy therefore
cannot promise self-serve deletion. It must give an email route and a response time, and the
self-serve version becomes a piece of work.

This matters more than it looks: erasure is a right, not a feature, and *"email us"* is a lawful
answer only if someone actually answers.

### `/privacy` and `/terms` 404 and there is no footer

Confirmed. Both pages do not exist and `app/(site)/page.tsx` has no footer at all.

---

## The details, as given

| | |
|---|---|
| Registered company | **Creativegoodlife Oy** |
| Business ID | **3439261-2** |
| Registered address | **Aurorankatu 11 A 2, 00100 Helsinki, Finland** — see the note below |
| Privacy contact | **saara@cgl.agency** |
| Supabase region | **West EU (Ireland)** — data at rest stays in the EU |
| Vercel region | **Not set.** Set it to `dub1` rather than inheriting the default |
| Gemini tier | **Tier 1, postpay.** Paid, verified 8 September 2026 |

**The postcode was given as `0010`, which is four digits.** Finnish postcodes are five, and Aurorankatu
in Helsinki is `00100`. I have written `00100` and am flagging it rather than correcting it silently,
because this is the registered address on a legal document. Confirm before publishing.

**Check the company name's exact registered form** against the trade register entry for 3439261-2.
`Creativegoodlife Oy` is written here as given; if the register has different capitalisation or
spacing, the register wins.

### Set the Vercel region rather than discovering it

`vercel.json` currently sets no region, so the deployment runs wherever Vercel defaults to, which
is not guaranteed to be the EU and can change.

```json
{ "framework": "nextjs", "regions": ["dub1"] }
```

Dublin puts the functions in the same region as the database. The policy then states an EU region
as a fact about your configuration rather than an observation that might drift. **Vercel's CDN is
global regardless** — static assets are served from points of presence worldwide, which is normal
and is worded that way below.

---

# Page copy — `/privacy`

> **Privacy policy**
> Last updated *(date)*
>
> **Who we are**
> Creativegoodlife Oy, business ID 3439261-2, Aurorankatu 11 A 2, 00100 Helsinki, Finland. We are the **controller** of the
> personal data described here. Contact: saara@cgl.agency.
>
> **What we store**
>
> *Your account* — email address, an encrypted password, and sign-in times.
>
> *Your brand* — everything you enter or upload: strategy answers, tone of voice, products with
> their costs and prices, documents, images and video, notes, and anything Branditect generates for
> you.
>
> *Your usage* — how many generations you have run, and when, so we can apply your plan's limits.
>
> We do not ask for, and have no use for, special category data. Please do not upload it.
>
> **Why we may hold it**
> To provide the service you have signed up for, which is a contract between us. We also keep
> security and abuse logs on the basis of our legitimate interest in keeping the service working.
>
> **Who processes it for us**
>
> | | What they do | Where |
> |---|---|---|
> | Supabase | Stores the database and your uploaded files | West EU (Ireland) |
> | Vercel | Runs the website and keeps request logs | Ireland, on a globally distributed CDN |
> | Anthropic | Generates text from what you have given us | United States |
> | Google | Generates and analyses images | United States |
>
> Each is a **processor** acting on our instructions under a data processing agreement. We are the
> controller. Transfers to the United States rely on the European Commission's standard contractual
> clauses, which form part of those agreements.
>
> **Your content is not used to train models**
> Anthropic's terms state that by default they do not use inputs or outputs from their commercial
> API to train models. Google's paid API terms state that prompts and responses are not used to
> improve Google's products. We use both on those terms. *(Verified 8 September 2026: the Gemini project is Tier 1,
> postpay.)*
>
> We do not sell your data, and we do not use it to train anything of our own.
>
> **How long we keep it**
> While your account exists. After you ask us to delete it, your data is removed within 30 days, and
> from encrypted backups within a further 60 days. Invoices are kept for six years because Finnish
> accounting law requires it.
>
> **Deleting your account**
> Email saara@cgl.agency from the address on the account. We will delete everything and confirm within 30
> days. A self-service button is coming; until it does, this is the route and we answer it.
>
> **Your rights**
> You may ask for a copy of your data, correct it, delete it, take it elsewhere, restrict what we do
> with it, or object. Email saara@cgl.agency. If you are not satisfied you can complain to the Finnish Data
> Protection Ombudsman, Tietosuojavaltuutetun toimisto, tietosuoja.fi.
>
> **Cookies**
> We set one cookie, to keep you signed in. There is no advertising or third-party tracking on this
> site. *(Confirm before publishing — if analytics is ever added, this paragraph changes and a
> consent banner becomes necessary.)*
>
> **Changes**
> If we change this materially we will email account holders before it takes effect.

---

# Page copy — `/terms`

**Every clause below needs a lawyer's eye, and the two marked need it most.** Limitation of
liability and warranty language decide what happens on the worst day, and getting them wrong is
expensive in exactly the situation where it matters.

> **Terms of service**
> Last updated *(date)*
>
> **1 · Who this is between**
> Creativegoodlife Oy, business ID 3439261-2, and you. If you are using Branditect for a company, you are
> agreeing on its behalf and confirm you may.
>
> **2 · The service**
> Branditect stores your brand's strategy, voice, look, products and figures, and generates text and
> images from them. It is provided as it is described on the site at the time you subscribe.
>
> **3 · Your content stays yours**
> Everything you upload remains yours. Everything Branditect generates for you is yours to use
> commercially without restriction. You grant us only the licence needed to run the service:
> to store your content, and to send it to the processors named in the privacy policy so they can
> produce your output.
>
> **4 · What you are responsible for**
> That you have the right to upload what you upload. That you check generated output before
> publishing it — it can be wrong, and it is your name on it. That you do not use the service
> unlawfully or to generate content that infringes someone else's rights.
>
> **5 · Accounts**
> One account per person. Keep your password to yourself. Tell us if you think someone else has it.
>
> **6 · Plans and payment**
> Free accounts get a fixed number of credits, once. Paid plans are billed monthly in advance at the
> price shown, including Finnish VAT at 25.5%. *(Payment is not yet live. When it is, Stripe will be
> the payment processor and this clause needs its terms: renewal, card storage, failed payments,
> refunds.)*
>
> **7 · Cancelling**
> Cancel whenever you like and it runs to the end of the paid month. We do not refund part months
> unless the law requires it. **As a business customer you do not have the consumer right of
> withdrawal.** *(Lawyer: confirm the framing if consumers may subscribe.)*
>
> **8 · Availability**
> We work to keep it running but do not promise it never stops. There is no service level agreement
> on these plans.
>
> **9 · Liability** — **needs a lawyer**
> *(Do not let me draft the cap. It needs to be a real number tied to what you charge, and it needs
> to survive Finnish and EU consumer law, which limits what can be excluded.)*
>
> **10 · Ending it**
> You can close your account at any time. We can close yours if you break these terms, and we will
> tell you why.
>
> **11 · Law**
> Finnish law. Disputes go to the District Court of Helsinki.
>
> **12 · Changes**
> We will email you at least 30 days before any material change, and you can cancel if you do not
> like it.

---

## The footer

`app/(site)/page.tsx` has no footer. Add one on every page of `(site)`, and link both pages from the
signup form as well — the moment someone creates an account is the moment consent is given.

```
© 2026 (Company)  ·  Privacy  ·  Terms  ·  (email)
```

---

## Acceptance criteria

1. `/privacy` and `/terms` return 200 and render their content.
2. A footer on every `(site)` page links both, and the signup form links both above its button.
3. No placeholder survives: a test fails if the rendered text contains `(fill`, `(Company)`,
   `(Y-tunnus)`, `(region)` or `(date)`. **This is the criterion that stops a half-finished legal
   page going live.**
4. The processor table names four processors, including Google.
5. The policy does not claim self-serve deletion while none exists.
6. The pages are indexable and reachable without signing in.
7. A test fails if a new external API host appears in `app/api` that is not named in the privacy
   policy. **This is the one worth having** — the policy goes stale the moment a fifth processor is
   added, and nobody remembers to update it.

---

## Order

1. ~~Confirm the Gemini tier.~~ Done — Tier 1, postpay.
2. Fill the remaining blanks: company name, Y-tunnus, address, privacy email, Supabase region,
   Vercel region.
3. Build the pages, the footer, and the signup links.
4. Criterion 7, the processor drift test.
5. Self-serve deletion, as its own piece of work. Until it exists, someone must actually answer that
   email inside 30 days.

---

## Not in scope here

Cookie consent banner (not needed while there is one session cookie and no analytics — but the day
analytics is added, it is), a DPA for your own customers to sign, sub-processor change
notifications, or an accessibility statement. Each is real and none is blocking a soft launch.
