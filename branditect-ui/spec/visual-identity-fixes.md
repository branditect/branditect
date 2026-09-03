# Visual identity — three fixes

`6423cba` is live and structurally right: sidebar and chat rail intact, no copy-link anywhere,
contrast badges computed and correct, 230 tests passing. Three defects, found on production
against the Sorbify brand.

---

## 1 · The colour page shows no colour — BLOCKER

Every swatch renders its label, hex and contrast badge. **The colour block itself is invisible.**

Measured on `/brand/visual-identity`:

```
.chip   display: inline        ← the bug
        height: 70px           (declared, and ignored)
        rendered  0 × 18px     (should be ~105 × 70)
        background  rgb(35,40,44)   ← correct, but on a zero-width box
```

The chip is a `<span>`. `height` and `width` do not apply to inline boxes, so the element
collapses to a zero-width sliver the height of a line box. The background colour is being set
correctly and painted onto nothing.

The reference used a `<div>`, which is block by default, so the omission never showed there.

**Fix in the CSS, not the JSX** — it then holds whichever element is used:

```css
.chip { display: block; height: 70px; position: relative; }
```

Check the same thing on `.plate`, `.thumb`, `.dstage` and `.spec`. Any of them rendered as a
`<span>` has the identical silent failure, and a fixed height on an inline box is the pattern to
grep for.

**Regression guard**, in `scripts/smoke.mjs` on this route:

```js
// A fixed-height box that is inline renders as a zero-width sliver and paints
// its background onto nothing. Silent in every unit test, obvious to a user.
const chip = await page.$eval("[class*=_chip__]", el => el.getBoundingClientRect());
assert.ok(chip.width > 40 && chip.height > 50, `colour chip is ${chip.width}×${chip.height}`);
```

---

## 2 · "How to hold it" vanishes without a logo

`page.tsx` line 529 gates the whole section:

```tsx
{heroLogo?.file_url && (      // §6 disappears entirely
```

The spec says §6 is **static content, no schema**. The reasoning for the gate is understandable —
the four don'ts render the real logo — but the result is that the brand rules disappear for
exactly the brands that have not set anything up yet, which are the ones that most need to read
them.

**Render the section always.** Inside it, gate only the parts that need artwork:

- No logo → show `Clear space`, `Minimum size` and the four `Never` captions as text, with the
  visual examples replaced by a neutral placeholder mark.
- Logo present → today's behaviour, unchanged.

---

## 3 · Sections with no data vanish silently

On a brand with no logos and no fonts, the page renders a hero, `Colour`, and the guidelines PDF.
`Which one do I use?`, `Logos` and `Typefaces` are simply absent, and the hero reads `— FILES`.

Criterion 2 said *a slot with no file renders no card*. That was about individual cards, and it
has been applied to whole sections. The difference matters: an empty card is clutter, but a
missing section is a page that gives no hint anything is missing.

**Each section renders its own empty state**, in the shape already used on `/brand/strategy`:
a heading, one sentence, one button.

| Section | Empty state |
|---|---|
| Logos | *"No logos yet. Upload the primary, a reversed version and the symbol on its own — those three cover almost every use."* `Upload logos` |
| Typefaces | *"No typefaces yet. Add the one for headlines and the one for everything else."* `Add a typeface` |
| Which one do I use? | Hidden while there are no logos. This one **is** correct as a card-level rule — a question with no answer is worse than no question. |
| Hero `— FILES` | Show `0`. An em dash reads as broken; a zero reads as empty. |

---

## Not changing

Everything else in `6423cba` is verified correct and stays: the download-only logo cards, the
computed contrast badges and their thresholds, the three real typefaces with the uploaded
`@font-face`, the guidelines panel, `lib/contrast.ts` and `lib/logo-slots.ts` with their tests.

Still not building the `/k` portal or the share button. That remains gated on criteria 9 and 10.

---

## Also outstanding, from the previous job

`spec/leave-the-questionnaire.md` criterion 3 has no test. Type into a question, call
`finishLater()` inside the 600ms debounce window, read the row back and assert the text is there.
That is the one failure mode that loses someone's work silently, and it is currently unguarded.
