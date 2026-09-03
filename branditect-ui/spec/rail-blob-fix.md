# Bug: the rail's decorative blob is in the document flow

The rail rebuild is otherwise correct and live at `87c18ae`. One defect, and it is **my mistake
in the reference CSS**, not a misreading of the spec.

---

## What is on screen

On every `/start` screen the rail's content starts **358px down the column**. The logo, the
eyebrow, the question and the guide card are all pushed below the fold, so the top third of the
rail is empty lavender and the page scrolls when it should not.

Measured on production:

```
blob            position: relative   ← should be absolute
                rect y=158  h=330
first child     top: 358             ← should be ~28 (the rail's padding)
rail height     859px  in a 648px viewport
```

`28 + 330 = 358`. The blob is being laid out as a 330px block and everything else starts after it.

---

## Why

`components/start/start.module.css` has these two rules, in this order:

```css
.blob   { position: absolute; left: -90px; bottom: -130px; width: 330px; height: 330px; … }

/* Everything sits above the blob. */
.rail > * { position: relative; z-index: 2; }
```

Both selectors have specificity **0-1-0**. On a tie the later rule wins, so `.rail > *` sets the
blob to `position: relative` and it rejoins the flow.

The reference this was ported from does not have the bug because there the selector is
`.rail .blob` — specificity **0-2-0**, which beats `.rail > *`. Flattening it to `.blob` for the
CSS module dropped a point of specificity and lost the tie. That flattening was the natural thing
to do and the reference gave no reason not to.

---

## Fix

Say what is actually meant — *everything except the blob* is the stacking context:

```css
.rail > *:not(.blob) { position: relative; z-index: 2; }
```

One line. Do not reorder the rules to fix it — the next person to sort this file
alphabetically reintroduces the bug silently.

After the change, verify `getComputedStyle(blob).position === "absolute"`.

---

## Regression guard

`npm run test` cannot catch this — it is computed style in a real browser. `scripts/smoke.mjs`
can. Add to the smoke run, on `/start/q/7`:

```js
// The rail's first real child sits at the top of the column. A decorative
// element that falls into the flow pushes the whole rail below the fold, which
// is invisible to a unit test and obvious to a user.
const railTop = await page.$eval("aside > *:nth-child(2)", el => el.getBoundingClientRect().top);
assert.ok(railTop < 60, `rail content starts at ${railTop}px, expected < 60`);

const railFits = await page.$eval("aside", el => el.getBoundingClientRect().height <= window.innerHeight + 1);
assert.ok(railFits, "the rail is taller than the viewport");
```

The second assertion is the one that matters long-term. The rail is a fixed-height column with
a foot note pinned to the bottom; anything that makes it exceed the viewport breaks that
contract, whatever the cause.

---

## Not in scope

Everything else in `87c18ae` is correct and verified on production:

- rail at `x=0, w=352` on every `/start` screen
- the stepper renders four rows with live counts — `1 of 5 answered`, `5 questions`
- no `<h1>` in the main column of a question screen
- `/start/resume` shows the stepper and both buttons

Fix the one line, keep the rest.
