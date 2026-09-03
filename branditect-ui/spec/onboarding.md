# Onboarding — the strategy questionnaire

Design: `reference/onboarding.html` (clickable, all 20 questions, all three tracks).
Content: `spec/onboarding-questions.ts` — the generated table. **Do not retype the questions into a component.**

---

## The decision that shapes everything

**The gate is five answers. The questionnaire is twenty.**

Twenty open text questions is 15–25 minutes of real work at first login. If all twenty are required, most people never see the dashboard.

| Required to open the workspace | Why |
|---|---|
| Profile — 3 taps | Sets track, `person` for the voice rubric, and the Numbers business profile |
| **Q6** what is it | Every downstream output depends on it |
| **Q11** who for | Nothing targeted can be generated without it |
| **Q13** what changes | The other half of the hero |
| **Q18** voice | The rubric Studio obeys |

Roughly four minutes. The other fifteen are skippable and become Brand Readiness items. `GATE` in `onboarding-questions.ts` is the single source of that list.

---

## Routes

```
/start                  welcome — states the time cost honestly
/start/profile/:step    1..3, three taps, no typing
/start/q/:n             n = 1..20, one question per screen
/start/resume           when onboarding_status = 'partial'
/start/strategy         the reward
/dashboard              opens once the gate is cleared
```

**A route per question, not a wizard in one URL.** Back must work, a link must be sendable, and a resumed session has to land somewhere. This is also what makes browser back and the in-app Back button behave identically, which is the difference between a form people trust and one they fight.

**Full screen throughout. Never a modal over the dashboard.** The current app opens a welcome modal over every page on every load; deleting that is part of this work.

---

## Saving — the three requirements

### 1. It saves as you type

Debounce **600ms** after the last keystroke, and force a write on blur, on navigation, and on `visibilitychange`. Never rely on a Save button; there isn't one.

```ts
// One row per brand. Upsert, never insert — the row is created by the
// first keystroke of Q1 and updated for the rest of the session.
await supabase.from("onboarding")
  .upsert({
    brand_id,
    user_id,
    profile,                 // { track, charge_model, team_size }
    answers,                 // { "6": "…", "11": "…" }
    skipped,                 // [7, 14]
    voice,                   // { primary, secondary | null }
    last_question,           // where to resume
    furthest_question,       // high-water mark — never decreases
    status,                  // not_started | partial | gated_complete | complete
    updated_at: new Date(),
  }, { onConflict: "brand_id" });
```

**Check the returned `error` on every write.** `supabase-js` returns `{data, error}` and does not throw, so a `try/catch` around an upsert catches nothing. The existing strategy page discards the error on all seven of its writes, which is why `brand_strategies` has no rows — do not repeat it here.

**Show the save.** A small `Saved ✓` pill next to the question counter, appearing for ~2s after each successful write. Silent saving is indistinguishable from broken saving, and this is a form people will abandon and return to — they need evidence it is safe to leave.

**Mirror to `localStorage` as a fallback, not as the store.** If the network write fails, keep the local copy and retry; surface `Saving…` rather than `Saved`. The database is the truth: someone who starts on a laptop and returns on a phone must find their answers.

### 2. It resumes

`status = 'partial'` sends the next login to `/start/resume`:

> **You were on question 9 of 20.**
> Everything you have written is saved.
> `Continue` · `Open my workspace instead`

**The second button is not optional.** Trapping someone in a questionnaire they already abandoned once is how you lose them the second time.

Resume goes to `furthest_question`, not `last_question` — if someone went back to reread Q3 and then closed the tab, they should not restart from Q3.

### 3. It commits at the end

Clearing the gate is a distinct event, not just another autosave:

1. Set `status = 'gated_complete'` (or `'complete'` at 20 of 20).
2. Generate the hero from Q6, Q11, Q13 in the chosen voice.
3. **Write the hero to Studio ▸ Library** — silently, with an undo in Library. They walked in with nothing and leave holding usable copy.
4. Write the derived strategy into `brand_strategies.strategy` (JSONB), mapping answers onto the `BrandStrategy` model in `lib/strategy.ts`.
5. Only then unlock `/dashboard`.

**Steps 2–4 must be idempotent and must not block the gate.** If generation fails, the answers are still saved and the workspace still opens — show the six voice tiles with static example copy and let them pick rather than holding the door shut. A failed generation must never cost someone their four minutes of typing.

---

## Going back

- **Back is always live**, including from question 1 (returns to the profile).
- Going back **never** lowers `furthest_question` and never clears an answer.
- Editing an earlier answer re-saves it and, if the hero has already been generated, marks it stale rather than silently regenerating. People rewrite Q6 after seeing Q11 — that is the system working.
- **Forward is blocked only on the four required questions**, and only until they have content. The button is disabled with the reason stated beside it: `An answer is needed to continue`. Never a silent dead button.

---

## Skipping

`Skip for now` appears on the fifteen optional questions and is **absent** on the required ones — not greyed out. A disabled Skip invites a fight with the form.

A skipped question goes into `skipped[]`, becomes a Brand Readiness item, and shows a line when revisited: *"You skipped this one. Answering it now removes it from the list."* Skipped is a state, not a void.

---

## Track branching

Three tracks, one questionnaire. From `spec/onboarding-questions.ts`:

| Varies by track | Count |
|---|---|
| Placeholder only | 13 questions |
| Placeholder + helper | 5 questions (2, 8, 12, 14, 17) |
| Question wording | **1** (Q17 — party / conference / kitchen) |
| Voice tile order | Q18 |

**No question is added, removed or renumbered by track.** The branching is a content table, so a fourth track costs one column rather than a new build. Resolve values with `forTrack(value, track)`; never `if (track === 'physical')` inside a component.

**Question numbers are stable identifiers.** `answers` is keyed by `n`. Never renumber — a reordered question set orphans every stored answer.

### The example, not a placeholder

The worked example lives in the **left guide rail as a labelled card**, not as ghost text in the input. Ghost text disappears the moment someone starts typing, which is exactly when they want to check their answer against the standard.

It is captioned with whose example it is — *"a boot repair business, not yours"*. The exemplars are deliberately in verticals nobody signing up is in: close enough to teach the shape, far enough to be useless as a template.

---

## The voice question (Q18)

**Step A** — six tiles, ordered by track. Nothing hidden, only ordered.

**Step B** — the chosen voice plus its two nearest neighbours (`NEIGHBOURS`), each rendering a real hero from Q6, Q11 and Q13. **Not samples — their actual homepage hero.**

Render the card frames with archetype names immediately and stream the copy in. Never a spinner on a blank screen when someone is seconds from the reward.

**The proof gate.** `Calm & reassuring` and `Expert & direct` both collapse without a real Q8. If Q8 is empty, annotate those tiles rather than generating hollow copy:

> *This voice needs proof. Add a number, a test or a certification to question 8 and we'll write it properly.*

Annotate, don't block. Blocking a tile at the gate is a wall; the note is a reason to go back one screen.

**Q19 is generated, not asked.** The four rejected tiles become the anti-voice — a banned register list Studio reads. One tap to confirm. This is the highest-value field for generation quality: a named mistake is enforceable, "be tasteful" is not.

---

## Three things not to build

**No progress percentage.** "35% complete" on a twenty-question form is a discouragement engine. Four sections of five, plus `Question n of 20`.

**No auto-advance on select.** Tapping a voice tile must not jump the screen. People tap to read, then decide.

**No congratulations screen.** The hero is the reward. A screen that says "Nice work!" and nothing else is a click tax.

---

## State

```ts
type Status = "not_started" | "partial" | "gated_complete" | "complete";

interface OnboardingState {
  status: Status;
  profile: { track: Track; charge_model: "one-off" | "recurring"; team_size: "just-me" | "2-3" | "4-10" };
  answers: Record<number, string>;      // keyed by question n
  skipped: number[];
  voice: { primary: ArchetypeId; secondary: ArchetypeId | null } | null;
  last_question: number;
  furthest_question: number;            // never decreases
  generated: { hero_id: string | null };
}
```

`gated_complete` is the one that matters. Five in, fifteen outstanding, workspace open. **Most users will live here**, and Brand Readiness is what moves them to `complete`.

---

## Two conflicts to settle before building

**Naming.** The flow spec says **Brand Pulse**; the live app, the Home design and `spec/readiness.ts` all say **Brand Readiness**. The reference uses Brand Readiness. Two names for one score is exactly the confusion this redesign removed — pick one, change the other everywhere.

**When the questionnaire check flips.** Brand Readiness is four checks at 25% each. If the questionnaire check needs all twenty, someone clears the gate and still sees **0%**, which reads as broken. Recommend flipping it at the **five-answer gate**, so the reward screen honestly says 25%. Partial credit inside the check is not the answer — it destroys the "a founder can predict the score" rule that the equal quarters exist to protect.

---

## Known approximations in the reference

- The preview bar (Start over / Jump to Q6 / …) is a device for reviewing. Ship the routes.
- State is in memory only. The real thing writes to Supabase with a `localStorage` mirror.
- Step B copy is hard-coded per track; in the app it is generated from Q6, Q11 and Q13.
- The third voice card is permanently in its loading state to show the streaming pattern.
