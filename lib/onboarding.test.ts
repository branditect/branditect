/** Run with: npm test — cases follow branditect-ui/spec/onboarding.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_ONBOARDING, applyAnswer, applyProfile, applySkip, applyVoice,
  bumpFurthest, computeStatus, fromRow, isGated, mergeState, resumeQuestion,
  type OnboardingState, type Profile,
} from "./onboarding.ts";
import { GATE } from "./onboarding-questions.ts";

const PROFILE: Profile = { track: "physical", charge_model: "one-off", team_size: "just-me" };

function gated(): OnboardingState {
  let s = applyProfile(EMPTY_ONBOARDING, PROFILE);
  s = applyAnswer(s, 6, "A boot repair kit");
  s = applyAnswer(s, 11, "People who cannot replace their boots");
  s = applyAnswer(s, 13, "They stop throwing boots away");
  return applyVoice(s, "confident");
}

describe("the gate", () => {
  it("is [6, 11, 13, 18] plus profile", () => {
    assert.deepEqual(GATE, [6, 11, 13, 18]);
    assert.ok(isGated(gated()));
  });

  it("is not cleared without the profile — three taps are part of it", () => {
    const s = { ...gated(), profile: null };
    assert.ok(!isGated(s));
    assert.equal(computeStatus(s), "partial");
  });

  GATE.forEach((n) => {
    it(`is not cleared while Q${n} is missing`, () => {
      const s = gated();
      const without = n === 18
        ? { ...s, voice: null }
        : { ...s, answers: { ...s.answers, [n]: "" } };
      assert.ok(!isGated(without), `Q${n} did not block the gate`);
    });
  });

  it("reaches gated_complete on five, not complete", () => {
    assert.equal(computeStatus(gated()), "gated_complete");
  });

  it("is not_started before anything is touched", () => {
    assert.equal(computeStatus(EMPTY_ONBOARDING), "not_started");
  });
});

describe("furthest_question", () => {
  it("never decreases when going back", () => {
    let s = applyAnswer(EMPTY_ONBOARDING, 9, "x");
    assert.equal(s.furthest_question, 9);
    s = applyAnswer(s, 3, "went back to reread");
    assert.equal(s.furthest_question, 9, "going back lowered the high-water mark");
    assert.equal(s.last_question, 3);
  });

  it("resume uses the high-water mark, not the last screen looked at", () => {
    const s = applyAnswer(applyAnswer(EMPTY_ONBOARDING, 9, "x"), 3, "y");
    assert.equal(resumeQuestion(s), 9);
  });

  it("bumpFurthest is monotonic", () => {
    const s = { ...EMPTY_ONBOARDING, furthest_question: 12 };
    assert.equal(bumpFurthest(s, 4), 12);
    assert.equal(bumpFurthest(s, 15), 15);
  });

  it("survives a row where last_question ran ahead of furthest", () => {
    assert.equal(fromRow({ last_question: 7, furthest_question: 2 }).furthest_question, 7);
  });
});

describe("skipping", () => {
  it("records a skip and then clears it when the question is answered", () => {
    let s = applySkip(EMPTY_ONBOARDING, 7);
    assert.deepEqual(s.skipped, [7]);
    s = applyAnswer(s, 7, "answered after all");
    assert.deepEqual(s.skipped, [], "answering did not clear the skipped flag");
  });

  it("does not clear the flag for a blank answer", () => {
    let s = applySkip(EMPTY_ONBOARDING, 7);
    s = applyAnswer(s, 7, "   ");
    assert.deepEqual(s.skipped, [7]);
  });

  it("refuses to skip a required question", () => {
    const s = applySkip(EMPTY_ONBOARDING, 6);
    assert.deepEqual(s.skipped, []);
  });

  it("does not double-record a repeated skip", () => {
    assert.deepEqual(applySkip(applySkip(EMPTY_ONBOARDING, 7), 7).skipped, [7]);
  });

  it("keeps a gated brand out of complete while anything is skipped", () => {
    const s = applySkip(gated(), 7);
    assert.equal(s.status, "gated_complete");
  });
});

describe("mergeState", () => {
  it("takes the higher water mark when a local mirror ran ahead", () => {
    const server = { ...EMPTY_ONBOARDING, furthest_question: 4, answers: { 1: "a" } };
    const local = { ...EMPTY_ONBOARDING, furthest_question: 9, answers: { 2: "b" } };
    const m = mergeState(server, local);
    assert.equal(m.furthest_question, 9);
    assert.deepEqual(m.answers, { 1: "a", 2: "b" });
  });

  it("returns the server state untouched when there is no mirror", () => {
    const server = { ...EMPTY_ONBOARDING, furthest_question: 4 };
    assert.deepEqual(mergeState(server, null), server);
  });
});

/* The failure path. supabase-js returns { data, error } and never throws, so a
   write that fails must be caught by checking the error — not by try/catch. */
describe("a failing write", () => {
  it("surfaces the error and never reports saved", async () => {
    const { OnboardingWriter } = await import("./onboarding-store.ts");
    const seen: string[] = [];
    const w = new OnboardingWriter("brand-x", null, (s) => seen.push(s.kind),
      async () => ({ ok: false, error: "permission denied for table onboarding" }));
    w.queue({ ...EMPTY_ONBOARDING, answers: { 6: "something" } });
    const res = await w.flush();
    w.dispose();

    assert.equal(res.ok, false);
    assert.ok(seen.includes("error"), `no error surfaced: ${seen.join(",")}`);
    assert.ok(!seen.includes("saved"), "reported saved despite a failed write");
  });

  it("reports saved only when the write actually succeeded", async () => {
    const { OnboardingWriter } = await import("./onboarding-store.ts");
    const seen: string[] = [];
    const w = new OnboardingWriter("brand-x", null, (s) => seen.push(s.kind), async () => ({ ok: true }));
    w.queue({ ...EMPTY_ONBOARDING, answers: { 6: "something" } });
    const res = await w.flush();
    w.dispose();

    assert.equal(res.ok, true);
    assert.ok(seen.includes("saved"));
    assert.ok(!seen.includes("error"));
  });
});
