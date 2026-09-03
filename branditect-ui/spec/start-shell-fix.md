# Fix: the onboarding shell lost its left rail

Reference: `reference/onboarding.html`. Open it and click through. What is on screen there
is what should be on screen in the app, and it is not.

The routing is correct — `lib/post-auth.ts` and `lib/start-route.ts` both do the right thing.
**Do not change any routing.** This is entirely `components/start/shell.tsx` and the two
screens that use it.

---

## What is wrong

### 1. The two panes are the wrong way round

`components/start/shell.tsx` line 41:

```
grid-cols-[minmax(0,1fr)_300px]     // main left, small card right
```

The reference is:

```
grid-template-columns: 352px minmax(0,1fr);     // rail LEFT, answer stage RIGHT
```

Guide on the left, the box you type in on the right. That was the design decision and it is
the opposite of what shipped.

### 2. The rail is not a rail, it is a leftover card

The reference rail carries five things, top to bottom, on the `--grad-rail` tint with the
radial blob behind it:

| | |
|---|---|
| Brand mark | so the screen is identifiably Branditect, not a naked form |
| Eyebrow | `Step 2 of 4 · Positioning` |
| **The question itself**, as `h2` 23px | the question belongs in the rail, with its guidance |
| Guide card | `How to answer` + helper text + `Example answer` + *"— a boot repair business, not yours. Copy the shape, not the words."* |
| Foot note, pinned to the bottom | required: *"One of the five answers that unlocks your workspace."* · optional: *"Skippable — it becomes a Brand Readiness item you can come back to."* |

What shipped is one bare `An example` card, 300px, on the wrong side. The question and its
helper text are in the main column instead. That is why the screen reads as a question fired
at you with no context.

### 3. The four-section stepper is missing entirely

`stepsHTML()` in the reference renders the four sections as a vertical stepper with a
connecting line, each showing `3 of 5 answered`, the current one filled, completed ones
green-checked.

**This is the single thing that answers "where am I".** A grey `Question 7 of 20` in the
header corner does not. It shipped without the stepper.

Show the stepper on the **profile** and **resume** screens. On a question screen the rail is
carrying the question, so there it collapses to the eyebrow (`Step 2 of 4 · Positioning`)
plus the counter already in the header.

### 4. `/start/resume` has no rail at all

`app/start/resume/page.tsx` calls `<StartShell>` with no `guide`, so the first thing after
signing back in is a single sentence on an empty page, then a naked question. That is what
"thrown mid-questionnaire" is.

Resume gets the full rail: brand mark, eyebrow `Welcome back`, the stepper showing what is
answered and what is left, and the foot note
*"Saved to your account, not this browser. Sign in anywhere and it's there."*

That sentence matters more than it looks. Someone returning to an abandoned form needs to see
that leaving did not cost them anything.

---

## Build

**`components/start/shell.tsx`**

```tsx
export function StartShell({ rail, counter, save, children }: {
  rail?: React.ReactNode;          // renamed from `guide` — it is a full column now
  counter?: React.ReactNode;
  save?: SaveState;
  children: React.ReactNode;
}) {
```

- Grid becomes `grid-cols-[352px_minmax(0,1fr)]`, rail first in the DOM.
- Rail is a flex column, `--grad-rail` background, `border-r border-rule`, its own padding,
  and the foot note pushed down with `mt-auto`.
- At `stack:` the rail keeps `order-first` — on a narrow screen the guidance is still read
  before the input. The reference hides it under 1080px; **don't**. Stack it instead.
- The brand mark moves into the rail. The header above the grid keeps only the counter and
  the save pill.

**New `components/start/rail.tsx`** exporting `<Rail>`, `<RailSteps>` and `<GuideCard>`, so
the three screens compose the same pieces rather than each rebuilding them.

`<RailSteps activeSection={id} />` derives its counts from `state.answers` and `SECTIONS` —
never from a hard-coded array.

**`app/start/q/[n]/page.tsx`**

Move `<h1>` (the question) and the helper `<p>` out of the main column and into the rail.
The main column keeps: the skipped notice, the textarea, and the button row. The textarea
grows to fill the wider column — `rows={7}`, min-height about 200px. It is the only thing on
that side now and it should look like the place where the work happens.

**`app/start/resume/page.tsx`**

Add the rail described in §4. Keep both buttons; `Open my workspace instead` is not optional.

**`app/start/profile/[step]/page.tsx`**

Same rail, eyebrow `Getting started`, heading *"Let's get to know your business"*, the
stepper with nothing yet answered, foot note *"Your answers become your strategy, your tone
of voice and every word Studio writes."*

---

## Acceptance criteria

1. On `/start/q/7` the tinted rail is on the left at 352px and the textarea is on the right.
2. The rail on a question screen shows: brand mark, `Step n of 4 · <section>`, the question
   text, the How-to-answer card with the example and its attribution, and a foot note that
   differs between required and optional questions.
3. The main column on a question screen contains no `<h1>`.
4. `/start/resume` renders the stepper, and the counts in it match the saved answers —
   asserted by test against a fixture with 7 of 20 answered.
5. Signing in with `status = 'partial'` lands on `/start/resume`, never on `/start/q/n`
   directly — asserted by the existing `lib/start-route.test.ts`.
6. At 900px wide the rail stacks above the input, and is not hidden.
7. No screen in `/start` renders without a rail.

## Not changing

`lib/post-auth.ts`, `lib/start-route.ts`, `lib/use-onboarding.ts`, the questions table, the
save logic, or any route path. This is presentation only.
