# The public site — About, Pricing, and a front door

References: `reference/landing-page.html`, `reference/about-page.html`, `reference/pricing-page.html`.
Open all three. The landing page's auth tabs and nav anchors work, and the pricing page's
monthly/yearly toggle works.

---

## What exists today

`app/page.tsx` is four lines:

```tsx
export default function Home() {
  redirect("/login");
}
```

**branditect.io has no public face at all.** Anyone who hears about the product and types the
domain gets a login form for an account they do not have. There is no About, no Pricing, no
explanation, and nothing for a search engine to index. Before demo users arrive, that is the
single most valuable gap to close.

There is no `middleware.ts`, so auth is enforced per page rather than centrally. That is fine and
this work does not change it.

---

## Routes to add

A new route group `app/(site)/` for everything public, with its own layout carrying the marketing
nav and footer. It is a sibling of `(app)`, so it inherits none of the sidebar chrome.

```
app/(site)/layout.tsx        marketing nav + footer
app/(site)/page.tsx          /            the landing page
app/(site)/about/page.tsx    /about
app/(site)/pricing/page.tsx  /pricing
```

`app/page.tsx` is deleted; `(site)/page.tsx` takes the root.

### The root has to branch

Someone signed in who types `branditect.io` should land in their workspace, not on a sales page.

```tsx
// app/(site)/page.tsx — server component
const { data: { user } } = await supabase.auth.getUser();
if (user) redirect("/home");
// otherwise render the landing page
```

**Do this on the server.** A client-side redirect flashes the marketing page to a signed-in user
before bouncing them, which looks broken.

`/about` and `/pricing` never redirect. A signed-in customer has every reason to read the pricing
page, and bouncing them off it is the kind of small hostility people remember.

---

## The three pages

### `/pricing`

Built from `reference/pricing-page.html`. Everything in it is real and current:

| | Free | Pro | Pro Plus | Enterprise |
|---|---|---|---|---|
| Price inc. VAT | €0 | €29.90 | €45.90 | Contact us |
| Credits | 100 once | 350/mo | 600/mo | Agreed |
| Brands / seats | 1 / 1 | 1 / 1 | 3 / 3 | Unlimited |
| Storage | 200 MB | 5 GB | 20 GB | Agreed |

The numbers are derived in `spec/pricing.md`. **Do not change them in the page without changing
them there**, or the two drift and nobody knows which is right.

### `/about`

Built from `reference/about-page.html`. Its job is to answer "what is this, and why should I
trust it" for someone who has never heard of the product. Structure:

1. **The problem** — three questions every brand asks forever, and where the answer is currently
   buried. A slide deck, an inbox, a spreadsheet.
2. **Three truths** — brand, product, commercial. The same three as the pricing page, worded the
   same way. This is the positioning and it must not drift between pages.
3. **Define, feed, make** — the product architecture, straight from `CLAUDE.md`.
4. **Four decisions we will not trade away** — closed book, sourced claims, margin awareness,
   your brand stays yours.
5. **Who it is for, and who it is not for.** The "not for you" column is not modesty. It is what
   makes the "for you" column believable, and it saves you support conversations with people who
   were never going to be customers.
6. **The company** — Finland, EU data, GDPR, your content never trains a model.

**Two facts on that page need confirming before it ships**: the founding year, currently 2025, and
whether "your content never trains a model" is true of every provider you call. If it is not
exactly true, change the line. That is the one claim on the site that would cost you real trust.

### `/` — the landing page

Built from `reference/landing-page.html`. Sections in order: hero with the auth card, the Home
screenshot, three truths, Define · Feed · Make, pricing, about, final CTA.

#### The auth card is the hero's right column

**Signing in and signing up both happen on the front page.** A returning customer should not have
to find a Sign in link, and a new visitor should see the first step is small. The card tabs between
`Start free` and `Log in`, changing the heading, the button, the password placeholder and the
footnote, and it is `position: sticky` so it stays beside the copy as the page scrolls.

**Reuse `components/auth/auth-form.tsx` and `components/auth/sso-buttons.tsx`.** Do not rebuild the
form. The reference inlines a copy of it only because a standalone HTML file cannot import a
component, and rebuilding it would fork the validation, the identical-error rule on the sign-in
path, and the `aria-disabled` handling on the SSO buttons that `spec/auth.md` requires.

`/login` and `/signup` stay exactly as they are. They are linked from emails and the back button
has to work, so the landing page is an additional entrance, never a replacement.

#### Anchors, not pages

`How it works`, `Pricing` and `About` in the nav scroll to `#how`, `#pricing` and `#about` on this
page. The condensed pricing block ends with a link to the full `/pricing`, and the about block
links to `/about`. Someone who wants the detail gets a real page; someone skimming never leaves.

That is the Canva pattern and it works because the front page answers the whole question on its
own. Do not make the nav links go to separate pages while the sections also exist here, or the
same click does two different things depending on where you are.

---

## App screenshots

Four already exist in `public/`, used by the login page and now by the marketing pages too:

| File | Shows | Used on |
|---|---|---|
| `/login/dashboard.webp` | Home: readiness, knowledge counts, the Studio row | Landing, About hero, Pricing |
| `/login/products.webp` | Products with cost, price and real margin | Landing and About, after the three truths |
| `/login/create-tools.webp` | The Studio row on its own | Landing and About, in Define · Feed · Make |
| `/login/calculators.webp` | The three Numbers calculators | About, after the four decisions |

**The reference HTML inlines them as data URIs** so the standalone file renders anywhere. In the
build, replace each with `next/image`:

```tsx
<Image src="/login/dashboard.webp" width={1010} height={552} alt="…" />
```

Give every one a real `alt` describing what is on screen, not "screenshot". They are content.

They show a fictional brand, **Ruffle Studio**, so nothing belonging to a real customer is on the
public site. Keep it that way: if these are ever regenerated, regenerate them from a demo brand,
never from a live account.

### Captions do the work

Each screenshot carries one sentence tying it to the claim above it, and the captions are the
argument rather than decoration. The products one, for instance, points at the asterisk in the
margin column: *"the system telling you a figure is estimated because a landed cost is missing. It
would rather admit that than quietly overstate your margin."*

That detail is worth more than the screenshot itself. It is visible proof of the closed-book
promise, in a product screen, where a competitor's marketing site can only make the claim.

---

## Shared shell

`app/(site)/layout.tsx` holds the nav and footer once.

**Nav**: the real mark plus wordmark, then `How it works · Pricing · About`, then `Log in` and
`Start free`. Sticky, with a translucent blurred background that grows a bottom border once the
page scrolls.

On the landing page the three links are anchors and the two buttons open the auth card on the
matching tab. On `/about` and `/pricing` they are ordinary links back to `/#how`, `/pricing` and
`/about`.

**Use `components/logo.tsx`.** It already exists, it already serves `public/branditect-logo.svg`
and `public/branditect-mark.svg`, and it protects the aspect ratio. The reference HTML inlines the
mark only because a standalone file cannot import a component. **Do not hand-roll a gradient
square with a B in it** — five surfaces did that before `logo.tsx` existed, which is why it exists.

**Footer**: copyright, Terms, Privacy, Security, Contact, "Made in Finland".

There is no `Product` link. It had no page behind it, and `CLAUDE.md` is explicit that a dead
entry is worse than a missing feature. That rule applies to the public site as much as the app.

---

## Design system

The reference pages use the Branditect tokens exactly as the Visual identity page defines them:

```
Signal orange  #F0562A    Ink         #15151B    Deep navy  #1D2748
Paper          #F4F3F2    Orange tint #FEF0EA    Violet     #6B53AC
Confirm green  #2FBF71
Gradients: hero · lilac (images) · periwinkle (numbers) · sage (assets) · peach (more)
```

**One hero gradient per screen, on the biggest thing.** The marketing pages allow larger type than
the app's Airbnb-density scale, because a landing page and a product UI are different jobs. The
colours, the radii and the mark do not change.

Copy on all three pages follows the house style: **no em dashes, no markdown bold in prose, no
scaffolding phrases.** The same rules `lib/house-style.ts` enforces on generated output apply to
what we write ourselves.

---

## SEO and metadata

Each page exports `metadata` with a real title and description. This is a public site now and it
should be findable.

```tsx
export const metadata = {
  title: "Pricing · Branditect",
  description: "Build your brand brain free. Plans from €29.90 a month including VAT.",
  openGraph: { images: ["/og-pricing.png"] },
};
```

Add `app/sitemap.ts` and `app/robots.ts` covering `/`, `/about`, `/pricing`. Keep `(app)`, `/start`
and `/k` out of the sitemap and disallowed in robots.

Open Graph images matter more than they look: every link shared in a WhatsApp group or a Slack
channel renders one, and a missing image reads as an unfinished product.

---

## Acceptance criteria

1. `/`, `/about` and `/pricing` render without a session.
2. A signed-in user hitting `/` is redirected to `/home` **server side**, with no flash of the
   marketing page.
3. A signed-in user can read `/about` and `/pricing` without being redirected.
4. The nav uses `components/logo.tsx`, not an inline shape — asserted by a test that no file under
   `app/(site)/` contains a hand-drawn mark.
5. No nav link 404s.
6. The prices and credit numbers on `/pricing` match `spec/pricing.md` exactly.
7. Every page exports `metadata` with a title and description.
8. `sitemap.ts` lists exactly the three public routes; `robots.ts` disallows `/api`, `(app)`
   routes, `/start` and `/k`.
9. Both pages are usable at 390px wide.
10. No em dashes in the page copy — asserted by test.
11. The landing page's auth card uses `components/auth/auth-form.tsx`, not a second copy of the
    form — asserted by a test that no `<input type="password">` is declared under `app/(site)/`.
12. The auth card tabs between Start free and Log in without a page load, and the nav's Log in and
    Start free buttons each open the card on the right tab.
13. `#how`, `#pricing` and `#about` all resolve to sections on the landing page.

---

## Build order

1. `(site)` layout with the nav and footer, and the **landing page** at `/`. It is the front door
   and it carries the login, so it replaces the current redirect-to-login on day one.
2. `/pricing`.
3. `/about`.
4. Sitemap, robots, Open Graph images.

The landing page goes first this time. Until it exists, branditect.io is a login form for an
account nobody has, and that is the thing costing you visitors right now.

---

## Not building

A blog, a changelog, case studies, a careers page, live chat, cookie-consent theatre beyond what
the law requires, or a newsletter signup. Every one is a thing to maintain, and none of them will
convert your first hundred users. Two clear pages and a working product demo will.
