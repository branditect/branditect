/**
 * Run with: npm test
 *
 * Uses Node's built-in test runner and native TypeScript support — no test
 * framework dependency. The cases are ported verbatim from the spec.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeReadiness, questionnairePassed, questionnaireDetail, type ReadinessInputs } from "./readiness.ts";

describe("computeReadiness", () => {
  const base: ReadinessInputs = {
    questionnaireComplete: true,
    knowledgeFileCount: 124,
    brandImageCount: 356,
    hasBrandGuideline: false,
  };

  it("scores 75 with three of four passing", () => {
    assert.equal(computeReadiness(base).score, 75);
    assert.equal(computeReadiness(base).band, "Good");
  });

  it("names the first failing check", () => {
    assert.equal(computeReadiness(base).nextAction?.id, "brandGuideline");
  });

  it("reaches 100 and Complete", () => {
    const r = computeReadiness({ ...base, hasBrandGuideline: true });
    assert.equal(r.score, 100);
    assert.equal(r.band, "Complete");
    assert.equal(r.nextAction, null);
  });

  it("scores 0 for a new workspace", () => {
    assert.equal(
      computeReadiness({
        questionnaireComplete: false,
        knowledgeFileCount: 0,
        brandImageCount: 0,
        hasBrandGuideline: false,
      }).score,
      0,
    );
  });

  it("gives no credit just below a threshold", () => {
    const r = computeReadiness({ ...base, knowledgeFileCount: 5 });
    assert.equal(r.score, 50);
    assert.equal(
      r.checks.find((c) => c.id === "knowledgeFiles")?.detail,
      "5 of 6 required",
    );
  });

  it("only ever returns a multiple of 25", () => {
    // exhaustive over the 4 booleans
    for (const q of [true, false])
      for (const k of [0, 6])
        for (const i of [0, 7])
          for (const g of [true, false]) {
            const s = computeReadiness({
              questionnaireComplete: q,
              knowledgeFileCount: k,
              brandImageCount: i,
              hasBrandGuideline: g,
            }).score;
            assert.equal(s % 25, 0);
          }
  });

  it("gives every failing check a destination and an action", () => {
    const r = computeReadiness({
      questionnaireComplete: false,
      knowledgeFileCount: 0,
      brandImageCount: 0,
      hasBrandGuideline: false,
    });
    for (const c of r.checks) {
      assert.ok(c.href, `${c.id} must link somewhere`);
      assert.ok(c.action, `${c.id} must name an action`);
    }
  });

  it("clears href and action once a check passes", () => {
    const r = computeReadiness({
      questionnaireComplete: true,
      knowledgeFileCount: 6,
      brandImageCount: 7,
      hasBrandGuideline: true,
    });
    for (const c of r.checks) {
      assert.equal(c.href, null);
      assert.equal(c.action, null);
    }
  });
});

/**
 * The way back. Brand Readiness used to read the retired 38-question module
 * against the old strategy_questions answers, so finishing the new
 * questionnaire left this quarter on 0% no matter what anyone did.
 */
describe("the questionnaire check reads onboarding status", () => {
  it("ticks at the gate, not at 20 of 20", () => {
    assert.equal(questionnairePassed("gated_complete"), true);
  });

  it("stays ticked at 20 of 20", () => {
    assert.equal(questionnairePassed("complete"), true);
  });

  it("does not tick before the gate", () => {
    assert.equal(questionnairePassed("partial"), false);
    assert.equal(questionnairePassed("not_started"), false);
  });

  it("treats a missing onboarding row as not started", () => {
    assert.equal(questionnairePassed(null), false);
    assert.equal(questionnairePassed(undefined), false);
  });

  /** Criterion 6. */
  it("puts Brand Readiness at 25% once the gate is cleared", () => {
    const r = computeReadiness({
      questionnaireComplete: questionnairePassed("gated_complete"),
      knowledgeFileCount: 0,
      brandImageCount: 0,
      hasBrandGuideline: false,
    });
    assert.equal(r.score, 25);
    assert.equal(r.checks.find((c) => c.id === "questionnaire")?.passed, true);
    assert.equal(r.band, "Starting");
  });

  it("gives no partial credit for a half-finished questionnaire", () => {
    const r = computeReadiness({
      questionnaireComplete: questionnairePassed("partial"),
      knowledgeFileCount: 0,
      brandImageCount: 0,
      hasBrandGuideline: false,
    });
    assert.equal(r.score, 0);
  });
});

/**
 * Criterion 5. A grep test, because the failure it guards against is an import
 * quietly surviving a refactor — which is exactly how this broke.
 */
describe("useReadiness no longer touches the retired module", () => {
  const source = readFileSync(new URL("./useReadiness.ts", import.meta.url), "utf8");

  it("does not import lib/strategy-questions", () => {
    assert.ok(!/strategy-questions/.test(source), "useReadiness.ts still references strategy-questions");
  });

  it("reads the onboarding table", () => {
    assert.ok(/from\("onboarding"\)/.test(source), "useReadiness.ts does not query the onboarding table");
  });

  it("does not read brand_strategies for the questionnaire check", () => {
    // The name may still appear in a comment explaining what broke; what must
    // not survive is the query and the call.
    assert.ok(!/from\("brand_strategies"\)/.test(source));
    assert.ok(!/isQuestionnaireComplete\(/.test(source));
  });
});

/**
 * §4c. "Not finished yet" tells someone nothing about whether coming back
 * costs four minutes or forty.
 */
describe("the questionnaire row says where they got to", () => {
  const row = (answered: number, status: "partial" | "gated_complete" | "not_started") =>
    computeReadiness({
      questionnaireComplete: questionnairePassed(status),
      questionnaireAnswered: answered,
      knowledgeFileCount: 0,
      brandImageCount: 0,
      hasBrandGuideline: false,
    }).checks.find((c) => c.id === "questionnaire")!;

  it("reads 'Not started' at zero, and offers Start", () => {
    const c = row(0, "not_started");
    assert.equal(c.detail, "Not started");
    assert.equal(c.action, "Start");
    assert.equal(c.href, "/start");
  });

  it("reads '7 of 20 answered' part way, and offers to pick up", () => {
    const c = row(7, "partial");
    assert.equal(c.detail, "7 of 20 answered");
    assert.equal(c.action, "Pick up where you left off");
    assert.equal(c.href, "/start");
  });

  /** The lie this replaces: at the gate the row claimed all questions were in. */
  it("does not claim all questions are answered at the gate", () => {
    const c = row(5, "gated_complete");
    assert.equal(c.detail, "5 of 20 answered");
    assert.equal(c.passed, true);
    assert.equal(c.href, null);
    assert.equal(c.action, null);
  });

  it("says all 20 only when all 20 are in", () => {
    assert.equal(questionnaireDetail(20), "All 20 answered");
    assert.equal(questionnaireDetail(19), "19 of 20 answered");
    assert.equal(questionnaireDetail(0), "Not started");
    assert.equal(questionnaireDetail(-1), "Not started");
  });
});
