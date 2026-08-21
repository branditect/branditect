/**
 * Run with: npm test
 *
 * Uses Node's built-in test runner and native TypeScript support — no test
 * framework dependency. The cases are ported verbatim from the spec.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeReadiness, type ReadinessInputs } from "./readiness.ts";

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
