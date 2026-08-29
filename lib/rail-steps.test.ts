/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_ONBOARDING, type OnboardingState } from "./onboarding.ts";
import {
  railSteps, answeredInSection, answeredTotal, questionTotal,
  sectionOf, sectionIndex, sectionTitle,
} from "./rail-steps.ts";

/**
 * Criterion 4's fixture — 7 of 20 answered.
 *
 * Why you exist  1,2,3        3 of 5
 * What you sell  6,7          2 of 5
 * Who it's for   11           1 of 5
 * How you show up  Q18 voice  1 of 5
 */
const SEVEN_OF_TWENTY: OnboardingState = {
  ...EMPTY_ONBOARDING,
  status: "partial",
  profile: { track: "physical", charge_model: "one-off", team_size: "just-me" },
  answers: {
    1: "I worked in an outdoor shop for four years.",
    2: "People bin boots that only need a sole.",
    3: "Resoling costs less than replacing.",
    6: "A resole and a full rebuild.",
    7: "Two weeks, posted back.",
    11: "Hikers who already own good boots.",
  },
  voice: { primary: "expert", secondary: null },
  last_question: 11,
  furthest_question: 18,
};

describe("the stepper counts", () => {
  const rows = railSteps(SEVEN_OF_TWENTY);

  it("has one row per section", () => {
    assert.equal(rows.length, 4);
    assert.deepEqual(rows.map((r) => r.id), ["why", "sell", "who", "show"]);
  });

  it("matches the saved answers", () => {
    assert.deepEqual(
      rows.map((r) => [r.id, r.answered, r.total]),
      [["why", 3, 5], ["sell", 2, 5], ["who", 1, 5], ["show", 1, 5]],
    );
  });

  it("adds up to 7 of 20", () => {
    assert.equal(answeredTotal(SEVEN_OF_TWENTY), 7);
    assert.equal(questionTotal(), 20);
  });

  it("reads '3 of 5 answered', and '5 questions' before anything is written", () => {
    assert.equal(rows[0].meta, "3 of 5 answered");
    assert.equal(railSteps(EMPTY_ONBOARDING)[0].meta, "5 questions");
  });

  /** Q18 carries no text answer — it counts once a voice is picked. */
  it("counts the voice question from the voice, not from answers", () => {
    assert.equal(answeredInSection(SEVEN_OF_TWENTY, "show"), 1);
    assert.equal(answeredInSection({ ...SEVEN_OF_TWENTY, voice: null }, "show"), 0);
  });

  it("ignores whitespace-only answers", () => {
    const padded = { ...EMPTY_ONBOARDING, answers: { 1: "   ", 2: "real" } };
    assert.equal(answeredInSection(padded, "why"), 1);
  });
});

describe("step state", () => {
  it("marks the active section active, even when it is finished", () => {
    const done = { ...EMPTY_ONBOARDING, answers: { 1: "a", 2: "b", 3: "c", 4: "d", 5: "e" } };
    assert.equal(railSteps(done, "why")[0].state, "active");
    assert.equal(railSteps(done, null)[0].state, "done");
  });

  it("marks a part-answered section started and an untouched one todo", () => {
    const rows = railSteps(SEVEN_OF_TWENTY);
    assert.equal(rows[0].state, "started");
    assert.equal(railSteps(EMPTY_ONBOARDING)[3].state, "todo");
  });

  it("numbers the bubbles 1 to 4", () => {
    assert.deepEqual(railSteps(EMPTY_ONBOARDING).map((r) => r.index), [1, 2, 3, 4]);
  });
});

describe("the eyebrow", () => {
  it("puts every question in a section", () => {
    for (let n = 1; n <= 20; n++) assert.ok(sectionOf(n), `question ${n} has no section`);
  });

  it("reads 'Step 2 of 4 · What you sell' for question 7", () => {
    const id = sectionOf(7);
    assert.equal(`Step ${sectionIndex(id)} of 4 · ${sectionTitle(id)}`, "Step 2 of 4 · What you sell");
  });

  it("does not blow up on a question outside the range", () => {
    assert.equal(sectionOf(99), null);
    assert.equal(sectionIndex(null), 0);
    assert.equal(sectionTitle(null), "");
  });
});
