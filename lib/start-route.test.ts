/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { startRouteFor } from "./start-route.ts";
import { computeReadiness } from "./readiness.ts";

describe("where sign-in lands", () => {
  it("sends a new account to /start", () => {
    assert.equal(startRouteFor({ status: "not_started", hasStrategy: false }), "/start");
  });

  it("sends a half-finished account to /start/resume", () => {
    assert.equal(startRouteFor({ status: "partial", hasStrategy: false }), "/start/resume");
  });

  it("sends a gated account to /home", () => {
    assert.equal(startRouteFor({ status: "gated_complete", hasStrategy: false }), "/home");
  });

  it("sends a finished account to /home", () => {
    assert.equal(startRouteFor({ status: "complete", hasStrategy: false }), "/home");
  });

  it("sends an account with no onboarding row to /start", () => {
    assert.equal(startRouteFor({ status: null, hasStrategy: false }), "/start");
  });

  /**
   * Someone who finished the old 38-question flow has a strategy and no
   * onboarding row. A welcome screen on every sign-in would be wrong.
   */
  it("does not send an established account back to the welcome screen", () => {
    assert.equal(startRouteFor({ status: null, hasStrategy: true }), "/home");
  });

  it("ignores hasStrategy once a real status exists", () => {
    assert.equal(startRouteFor({ status: "partial", hasStrategy: true }), "/start/resume");
    assert.equal(startRouteFor({ status: "not_started", hasStrategy: true }), "/start");
  });
});

describe("Brand Readiness check 1", () => {
  const r = computeReadiness({
    questionnaireComplete: false,
    knowledgeFileCount: 0,
    brandImageCount: 0,
    hasBrandGuideline: false,
  });
  const check = r.checks.find((c) => c.id === "questionnaire")!;

  it("points at /start, not the strategy document", () => {
    assert.equal(check.href, "/start");
  });

  it("is still the first thing on the list", () => {
    assert.equal(r.checks[0].id, "questionnaire");
    assert.equal(r.nextAction?.id, "questionnaire");
  });
});
