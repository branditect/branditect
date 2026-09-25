import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { guidelineCopyHash, isMissingTable } from "./guideline-copy.ts";

const strategy = { id: "s1", brand_id: "b", mission: "Clean water", updated_at: "2026-09-01T00:00:00Z" };
const dna = { brand_id: "b", mood: "calm", created_at: "2026-09-01T00:00:00Z" };

describe("the guideline copy source hash", () => {
  it("ignores timestamps and ids, so a no-op save does not regenerate", () => {
    const again = { ...strategy, id: "s2", updated_at: "2026-09-25T00:00:00Z" };
    assert.equal(guidelineCopyHash(strategy, dna), guidelineCopyHash(again, dna));
  });
  it("ignores column order", () => {
    const reordered = { mission: "Clean water", brand_id: "b", id: "s1", updated_at: "x" };
    assert.equal(guidelineCopyHash(strategy, dna), guidelineCopyHash(reordered, dna));
  });
  it("changes when the strategy or the visual DNA changes", () => {
    const base = guidelineCopyHash(strategy, dna);
    assert.notEqual(base, guidelineCopyHash({ ...strategy, mission: "Clean air" }, dna));
    assert.notEqual(base, guidelineCopyHash(strategy, { ...dna, mood: "loud" }));
    assert.notEqual(base, guidelineCopyHash(strategy, null));
  });
  it("an unapplied migration is a miss, other errors are not", () => {
    assert.equal(isMissingTable({ code: "42P01" }), true);
    assert.equal(isMissingTable({ code: "PGRST205" }), true);
    assert.equal(isMissingTable({ code: "23505" }), false);
    assert.equal(isMissingTable(null), false);
  });
});

describe("the route", () => {
  const src = readFileSync("app/api/brand-guideline/brand-text/route.ts", "utf8");
  it("reads the saved copy before it meters a call", () => {
    assert.ok(src.indexOf(".from('guideline_copy')") < src.indexOf("await meter("));
  });
  it("saves what it generated", () => {
    assert.match(src, /\.from\('guideline_copy'\)\s*\.upsert\(/);
  });
});
