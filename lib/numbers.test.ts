import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  breakEvenUnits, contribution, costLines, floorPrice, floorPriceBasis,
  marginPct, netPrice, operatingProfit, profileSentence, totalRunningCosts,
  type BusinessProfile,
} from "./numbers.ts";

/** The Pro 5000, as used throughout the specs. */
const GROSS = 149, TAX = 20, LANDED = 22.1, FACTORY = 19.45;

describe("per-sale maths", () => {
  it("nets tax out of the gross price", () => {
    assert.equal(netPrice(GROSS, TAX).toFixed(2), "124.17");
  });

  it("contribution matches the spec's worked example", () => {
    assert.equal(contribution(GROSS, TAX, LANDED).toFixed(2), "102.07");
  });

  it("margin is 82.2%, not the flattering 86.9%", () => {
    assert.equal(marginPct(GROSS, TAX, LANDED).toFixed(1), "82.2");
    const flattering = ((GROSS - FACTORY) / GROSS) * 100;
    assert.equal(flattering.toFixed(1), "86.9");
    assert.ok(marginPct(GROSS, TAX, LANDED) < flattering - 4);
  });

  it("returns 0% margin rather than dividing by zero on a free product", () => {
    assert.equal(marginPct(0, TAX, 10), 0);
  });
});

describe("breakEvenUnits", () => {
  it("rounds up — you cannot sell most of a unit", () => {
    assert.equal(breakEvenUnits(8400, 102.07), 83);
  });

  it("is Infinity when a sale contributes nothing", () => {
    // The UI must say "never breaks even at this price", not render a symbol.
    assert.equal(breakEvenUnits(8400, 0), Infinity);
    assert.equal(breakEvenUnits(8400, -5), Infinity);
  });
});

describe("operatingProfit", () => {
  it("is contribution times volume, less fixed costs", () => {
    assert.equal(Math.round(operatingProfit(240, 102.07, 8400)), 16097);
  });

  it("goes negative below break-even", () => {
    assert.ok(operatingProfit(10, 102.07, 8400) < 0);
  });
});

describe("floorPrice", () => {
  const base = {
    variableCost: LANDED, taxRatePct: TAX, minMarginPct: 60,
    monthlyOpEx: 8400, expectedVolume: 240,
  };

  it("takes the higher of the two tests", () => {
    // margin test: 22.10 / 0.4 = 55.25 net
    // overhead test: 22.10 + 8400/240 = 57.10 net  <- higher here
    assert.equal(floorPriceBasis(base), "overhead");
    assert.equal(floorPrice(base).toFixed(2), (57.1 * 1.2).toFixed(2));
  });

  it("uses the margin test when it is the binding one", () => {
    const highMargin = { ...base, minMarginPct: 80 };
    // 22.10 / 0.2 = 110.50 net, well above the 57.10 overhead test
    assert.equal(floorPriceBasis(highMargin), "margin");
    assert.equal(floorPrice(highMargin).toFixed(2), (110.5 * 1.2).toFixed(2));
  });

  it("without running costs the floor is only the margin test", () => {
    const noOpEx = { ...base, monthlyOpEx: 0 };
    assert.equal(floorPriceBasis(noOpEx), "margin");
  });

  it("does not divide by zero when volume is unset", () => {
    const r = floorPrice({ ...base, expectedVolume: 0 });
    assert.ok(Number.isFinite(r), "expected a finite floor, got " + r);
  });

  it("returns a gross price, so it is comparable to retail", () => {
    // Must be tax-inclusive — comparing a net floor to a gross retail price
    // would understate the floor by the whole VAT rate.
    const net = Math.max(LANDED / 0.4, LANDED + 8400 / 240);
    assert.ok(floorPrice(base) > net);
  });
});

describe("business profile", () => {
  const physicalDirect: BusinessProfile = {
    sells: "physical", charges: "oneoff", channels: ["direct"],
  };

  it("physical base lines are per unit made", () => {
    const labels = costLines(physicalDirect).map((l) => l.label);
    assert.ok(labels.includes("Production cost"));
    assert.ok(labels.includes("Freight & duty"));
  });

  it("digital base lines are per customer served", () => {
    const labels = costLines({ ...physicalDirect, sells: "digital" }).map((l) => l.label);
    assert.ok(labels.includes("Hosting & infra"));
    assert.ok(!labels.includes("Production cost"));
  });

  it("channels add lines rather than replacing the base", () => {
    const both = costLines({ ...physicalDirect, channels: ["direct", "trade"] });
    const labels = both.map((l) => l.label);
    // Ecommerce is a channel, not a business type — direct and trade coexist.
    assert.ok(labels.includes("Shipping"));
    assert.ok(labels.includes("Carton / pallet"));
  });

  it("recurring adds churn and acquisition cost", () => {
    const labels = costLines({ ...physicalDirect, charges: "recurring" }).map((l) => l.label);
    assert.ok(labels.includes("Churn rate"));
    assert.ok(labels.includes("Cost to acquire"));
  });

  it("reads back as a sentence", () => {
    assert.equal(
      profileSentence({ sells: "physical", charges: "oneoff", channels: ["direct", "trade"] }),
      "You sell physical goods as one-off purchases through your own site and wholesale.",
    );
  });
});

describe("running costs", () => {
  it("treats unset lines as zero, not NaN", () => {
    assert.equal(
      totalRunningCosts({ rent: 3000, salaries: null, software: 400, marketing: null, other: null }),
      3400,
    );
  });
});
