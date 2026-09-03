# Leaving the questionnaire early

A door out of `/start` on every screen, landing on `/home`.

The door is the easy half. **The way back is the half that decides whether this feature helps or
quietly loses people**, and it is currently broken — see §4, which is a prerequisite, not a
nice-to-have.

---

## 1 · The button

**Placement.** In the `StartShell` header, opposite the counter and the save pill. Persistent on
every `/start` screen: welcome, profile 1–3, all twenty questions, resume.

```
┌──────────────────────────────────────────────────────────────────┐
│  [rail]          QUESTION 7 OF 20   Saved ✓        Finish later → │
```

Not in the button row at the bottom. `Next question` and `Skip for now` already live there, and a
third exit beside them is how someone leaves the whole flow when they meant to skip one question.

**Label: `Finish later`.** Not "Skip" — `Skip for now` already means *skip this one question*, and
two different meanings for one word in the same viewport is the confusion this redesign exists to
remove. Not "Skip the strategy", which describes abandoning the product's core value. `Finish
later` is honest: this is a pause, not a cancellation.

Style it as quiet text with an arrow, `text-muted-2`, no fill. It should be findable and never
compete with `Next question`.

**No confirmation dialog.** Autosave means nothing is at risk, and a modal asking "are you sure?"
converts a calm decision into a guilt trip. Instead put one line under the header button, at
`text-2xs text-faint`:

> Your answers are saved. Pick up any time.

**What it does:**

```ts
async function finishLater() {
  await flush();            // force the pending write, don't rely on the debounce
  router.push("/home");
}
```

`flush()` before navigating is not optional. The 600ms debounce means the last thing someone typed
before deciding to leave is exactly the thing most likely to be lost.

Status stays `partial` — the autosave already sets it. Do not introduce a fourth status for
"left early"; `partial` is what `/start/resume` and `startRouteFor` already understand, and
next sign-in routes them back correctly with no new code.

---

## 2 · What is behind the door

Nothing currently guards `/home`. Someone can already reach the workspace by typing the URL, so
this button is not opening a hole — it is making an existing state visible and supported. That is
the right call, but it means the empty workspace is now a **designed state**, not an accident.

Any page that needs strategy and has none renders the same shape as the one already built for
`/brand/strategy`: a plain heading, one sentence explaining what fills it, and one button back to
`/start`. Never a spinner, never a fake skeleton, never a zero.

---

## 3 · Leaving before the gate

Someone who leaves at question 2 has a workspace where Studio cannot write in their voice and the
strategy page is empty. Say so, once, in the rail on the way out — not as a warning that blocks,
as information:

| When they leave | The rail's foot note reads |
|---|---|
| Under 5 gate answers | *"Studio needs five answers before it can write in your voice. You're 2 of 5 in."* |
| Gate cleared | *"Your workspace is open. The remaining questions are in Brand Readiness."* |

This is the one place a count of the gate belongs. It is a reason to come back, phrased as a fact.

---

## 4 · The way back — PREREQUISITE

**This is currently broken, and shipping the button without fixing it makes the app worse.**

`lib/useReadiness.ts` line 109:

```ts
import { isQuestionnaireComplete } from "@/lib/strategy-questions";
...
questionnaireComplete: isQuestionnaireComplete(strategy.data?.answers)
```

It reads `isQuestionnaireComplete` from **the old 38-question module**, against the **old
`strategy_questions` answers**. The new questionnaire writes to the `onboarding` table, which this
never looks at.

Consequences today, before any button is added:

- Finishing the new questionnaire leaves the Strategy questionnaire check **unticked**.
- Brand Readiness stays at 0% for that quarter no matter what someone does.
- This is a concrete cause of the "Home shows 0%" problem already reported.

### 4a. Point the check at the real table

Read `onboarding.status` and `onboarding.answers` for the brand. Delete the
`lib/strategy-questions` import from `useReadiness.ts`; it is part of the flow being retired.

### 4b. Flip the check at the gate, not at 20

From `spec/onboarding.md`, still unsettled and now forced by this feature: if the check needs all
twenty, someone clears the gate, opens their workspace and sees **0%**, which reads as broken.

Flip it at `status === 'gated_complete'`. The reward screen then honestly says 25%. Do not give
partial credit inside the check — that destroys the "a founder can predict their score" rule the
equal quarters exist to protect.

### 4c. Make the check say where they got to

```ts
detail: answered === 0
  ? "Not started"
  : `${answered} of 20 answered`,
action: answered === 0 ? "Start" : "Pick up where you left off",
href: "/start",          // startRouteFor sends 'partial' on to /start/resume
```

"Not finished yet" tells someone nothing about whether returning costs four minutes or forty.

### 4d. A strip on Home while `status = 'partial'`

Above the fold, using `--grad-more`, dismissible for the session but back on next login:

> **You're 7 of 20 into your strategy.** Five answers open Studio. `Continue →`

Dismissible, because a permanent banner is a punishment. Returning next session, because the
whole point of letting someone leave is that they can be invited back.

---

## Acceptance criteria

1. `Finish later` appears in the header on every `/start` route, including `/start/resume`.
2. Clicking it lands on `/home` with `status` still `partial`.
3. Text typed immediately before clicking it is present in the database — asserted by a test that
   types, clicks within the debounce window, and reads the row back.
4. Signing out and back in after `Finish later` lands on `/start/resume` at the right question.
5. Brand Readiness reads the `onboarding` table; `lib/strategy-questions` is no longer imported by
   `useReadiness.ts` — asserted by a grep test.
6. `gated_complete` ticks the questionnaire check and Brand Readiness reads 25% — asserted by test.
7. The Home strip renders only when `status = 'partial'`, and its count matches the saved answers.
8. `Skip for now` and `Finish later` are never both described as "skip" in any copy on screen.

---

## Build order

1. §4a and §4b — the way back. Ship this **before** the button exists.
2. §1 — the button and the flush.
3. §4c and §4d — the count and the strip.
4. §3 — the gate-aware foot note.

If only step 1 ships this week, the app is already better. If only step 2 ships, it is worse.
