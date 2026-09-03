# Fix: the nav is wearing the wrong wordmark

Live on `/`, `/about` and `/pricing` at `5ca28ff`. **My mistake in the reference files**, faithfully
built.

---

## What is on screen

```html
<a class="brand">
  <img src="/branditect-mark.svg">   <!-- the round mark, correct -->
  Branditect                          <!-- typed in Plus Jakarta Sans 800 -->
</a>
```

The mark is right. The word beside it is **not the Branditect wordmark** — it is the product UI
typeface set in bold and placed next to the logo. `public/branditect-logo.svg` contains the real
wordmark as thirteen drawn paths with no `<text>` element, because the letterforms are artwork.

Setting the name in a different typeface next to the mark does not produce the logo. It produces a
second, unauthorised lockup, and it sits on the front page of the company.

---

## The fix

```tsx
import Logo from "@/components/logo";

<Link href="/" aria-label="Branditect">
  <Logo height={28} />
</Link>
```

`Logo` already defaults to `variant="lockup"`, serves `/branditect-logo.svg`, and holds the aspect
ratio from the artwork so a caller cannot squash it. **Nothing new needs writing.** Delete the
`<img src="/branditect-mark.svg">` and the text node beside it.

Use `variant="mark"` only in square or round slots. The lockup is over four times wider than tall
and is unreadable much below 20px.

The updated references — `reference/landing-page.html`, `about-page.html`, `pricing-page.html` —
now inline the lockup as a data URI, which is what a standalone HTML file has to do. In the app it
is the component.

---

## Why this happened, and the guard

`components/logo.tsx` exists precisely because of this. Its own header says five surfaces once
hand-rolled a gradient square with a B beside the word "Branditect". The component fixed the app,
and then the marketing pages reintroduced the same bug from a reference file that had no way to
import a component.

Acceptance criterion 4 already said *"the nav uses `components/logo.tsx`, not an inline shape"*.
It passed, because `logo.tsx` **was** imported — for the mark. The criterion tested the wrong half.

Replace it:

```js
// No text node inside the brand link. The wordmark is artwork, and the moment a
// page types the name beside the mark it has invented a second lockup.
const brand = await page.$eval("nav a[aria-label='Branditect']", el => ({
  text: el.innerText.trim(),
  src:  el.querySelector("img")?.getAttribute("src") ?? "",
}));
assert.equal(brand.text, "", `brand link contains typed text: "${brand.text}"`);
assert.match(brand.src, /branditect-logo\.svg$/, `nav uses ${brand.src}, expected the lockup`);
```

Run it against the current production build first and watch it fail. An assertion that has never
failed has not been tested.

---

## Not changing

The mark on its own stays correct everywhere it is used in a square slot — the app sidebar, the
favicon, the auth card. Only the horizontal nav lockup is wrong.
