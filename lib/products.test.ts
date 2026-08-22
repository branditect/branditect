import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { margin, sortByMargin, categoryStyle, type Product } from "./products.ts";

/** The spec's worked example: the Deklan Pro 5000. */
const PRO_5000 = {
  retailPrice: 149,
  taxRatePct: 20,
  landedCost: 22.1,
  factoryCost: 19.45,
};

describe("margin", () => {
  it("uses net price after tax against landed cost", () => {
    const m = margin(PRO_5000)!;
    assert.equal(m.net.toFixed(2), "124.17");
    assert.equal(m.cash.toFixed(2), "102.07");
    assert.equal(m.pct.toFixed(1), "82.2");
    assert.equal(m.exact, true);
  });

  it("does NOT return the flattering factory-cost-on-gross figure", () => {
    const m = margin(PRO_5000)!;
    const flattering = ((149 - 19.45) / 149) * 100; // 86.9%
    assert.equal(flattering.toFixed(1), "86.9");
    assert.ok(
      m.pct < flattering - 4,
      `expected the honest margin to be ~5 points below ${flattering.toFixed(1)}%, got ${m.pct.toFixed(1)}%`,
    );
  });

  it("treats a missing tax rate as unknown, not as zero", () => {
    const m = margin({ ...PRO_5000, taxRatePct: null })!;
    assert.equal(m.exact, false);
    assert.ok(m.caveats.includes("assumed_no_tax"));
  });

  it("falls back to factory cost but marks the result inexact", () => {
    const m = margin({ ...PRO_5000, landedCost: null })!;
    assert.equal(m.exact, false);
    assert.ok(m.caveats.includes("factory_cost"));
    assert.equal(m.pct.toFixed(1), "84.3"); // net 124.17 vs factory 19.45
  });

  it("returns null when there is no cost at all", () => {
    assert.equal(margin({ ...PRO_5000, landedCost: null, factoryCost: null }), null);
  });

  it("returns null without a retail price", () => {
    assert.equal(margin({ ...PRO_5000, retailPrice: null }), null);
    assert.equal(margin({ ...PRO_5000, retailPrice: 0 }), null);
  });

  it("reports a negative margin when cost exceeds net price", () => {
    const m = margin({ retailPrice: 20, taxRatePct: 20, landedCost: 25, factoryCost: null })!;
    assert.ok(m.pct < 0, "selling below landed cost must show as negative");
  });

  it("a higher tax rate lowers the margin", () => {
    const low = margin({ ...PRO_5000, taxRatePct: 5 })!;
    const high = margin({ ...PRO_5000, taxRatePct: 25 })!;
    assert.ok(high.pct < low.pct);
  });
});

function product(over: Partial<Product>): Product {
  return {
    id: "x", name: "x", description: "", category: "", sku: "", tags: [],
    retailPrice: 100, taxRatePct: 0, landedCost: 50, currency: "GBP",
    stockStatus: null, indexed: false, sourceFileCount: 0, imageCount: 0,
    usedInOutputCount: 0, ...over,
  };
}

describe("sortByMargin", () => {
  it("puts the worst margin first by default", () => {
    const sorted = sortByMargin([
      product({ id: "good", landedCost: 10 }), // 90%
      product({ id: "bad", landedCost: 80 }),  // 20%
      product({ id: "mid", landedCost: 50 }),  // 50%
    ]);
    assert.deepEqual(sorted.map((p) => p.id), ["bad", "mid", "good"]);
  });

  it("sorts products with no computable margin last, not first", () => {
    const sorted = sortByMargin([
      product({ id: "unknown", landedCost: null, factoryCost: null }),
      product({ id: "bad", landedCost: 80 }),
    ]);
    // A data gap is not a zero-margin product; leading with it would bury the
    // real answer the sort exists to surface.
    assert.deepEqual(sorted.map((p) => p.id), ["bad", "unknown"]);
  });

  it("does not mutate its input", () => {
    const input = [product({ id: "a", landedCost: 10 }), product({ id: "b", landedCost: 80 })];
    sortByMargin(input);
    assert.deepEqual(input.map((p) => p.id), ["a", "b"]);
  });
});

describe("categoryStyle", () => {
  it("is stable for a known category regardless of casing", () => {
    assert.equal(categoryStyle("Hair Dryers"), categoryStyle("hair dryers"));
  });

  it("falls back to neutral rather than picking a colour at random", () => {
    assert.equal(categoryStyle("Something New"), "bg-tile text-ink-2");
    assert.equal(categoryStyle(null), "bg-tile text-muted");
  });
});
