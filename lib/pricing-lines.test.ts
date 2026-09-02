/** Run with: npm test — criteria 3 to 9 of spec/product-card-rebuild.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LINES, GROUPS, PRESETS, lineDef, visibleLines, presetForTrack, toggleLine,
  groupTotal, cogsTotal, sellTotal, grossMargin, contributionMargin,
  derivedLandedCost, parseCustomLines, type LineId, type Values,
} from "./pricing-lines.ts";
import { netPrice, marginPct } from "./numbers.ts";

const ALL = LINES.map((l) => l.id);

describe("the line table", () => {
  it("puts every line in exactly one group", () => {
    for (const l of LINES) {
      assert.ok(GROUPS.some((g) => g.id === l.group), `${l.id} has no group`);
    }
    assert.equal(new Set(LINES.map((l) => l.id)).size, LINES.length, "a line id is duplicated");
  });

  it("does not treat retail, RRP or tax as costs", () => {
    for (const id of ["retail", "rrp", "tax"] as LineId[]) {
      assert.equal(lineDef(id)!.isCost, false, `${id} is counted as a cost`);
    }
  });

  /* The spec renames rather than adding a third word for one idea. The columns
     keep their names so nothing that reads them breaks. */
  it("relabels factory cost as Unit cost without renaming the column", () => {
    const unit = lineDef("unit")!;
    assert.equal(unit.label, "Unit cost");
    assert.equal(unit.column, "price_cogs");
  });
});

/** Criterion 9. */
describe("presets", () => {
  it("give the three tracks different sets", () => {
    const sets = Object.values(PRESETS).map((s) => s.join(","));
    assert.equal(new Set(sets).size, 3, "two presets are identical");
  });

  it("do not ask a digital product for freight or packaging", () => {
    assert.ok(!PRESETS.digital.includes("freight"));
    assert.ok(!PRESETS.digital.includes("pack"));
  });

  it("do not ask a service for freight", () => {
    assert.ok(!PRESETS.service.includes("freight"));
    assert.ok(PRESETS.service.includes("labour"));
  });

  it("maps a track onto a preset", () => {
    assert.equal(presetForTrack("saas_tier"), "digital");
    assert.equal(presetForTrack("service"), "service");
    assert.equal(presetForTrack("physical"), "physical");
    assert.equal(presetForTrack(null), "physical");
  });

  /* A product predating this feature has NULL and must render something. */
  it("falls back to the preset when nothing is stored", () => {
    assert.deepEqual(visibleLines(null, "saas_tier"), PRESETS.digital);
    assert.deepEqual(visibleLines(undefined, "physical"), PRESETS.physical);
  });

  it("uses the stored set when there is one, even an empty one", () => {
    assert.deepEqual(visibleLines(["retail", "tax"], "physical"), ["retail", "tax"]);
    assert.deepEqual(visibleLines([], "physical"), []);
  });

  it("drops a stored id it does not recognise rather than rendering a blank row", () => {
    assert.deepEqual(visibleLines(["retail", "nonsense"], "physical"), ["retail"]);
  });
});

/** Criterion 3. */
describe("hiding a line", () => {
  const values: Values = { price_retail: 100, tax_rate_pct: 0, price_cogs: 30, freight_duty: 10 };

  it("removes it from the visible set and puts it back", () => {
    const hidden = toggleLine(["unit", "freight"], "freight");
    assert.deepEqual(hidden, ["unit"]);
    assert.deepEqual(toggleLine(hidden, "freight"), ["unit", "freight"]);
  });

  it("never touches the stored value", () => {
    const before = { ...values };
    toggleLine(["unit", "freight"], "freight");
    assert.deepEqual(values, before, "toggling mutated the values");
  });

  /* Hide, save, re-show, read back. The value has to survive the round trip:
     there is no undo on a form field. */
  it("survives a hide, a save and a re-show", () => {
    let visible: LineId[] = ["unit", "freight"];
    assert.equal(cogsTotal(visible, values), 40);

    visible = toggleLine(visible, "freight");
    const saved = { visible: [...visible], values: { ...values } };   // what goes to the database
    assert.equal(cogsTotal(saved.visible, saved.values), 30, "a hidden line still counts");
    assert.equal(saved.values.freight_duty, 10, "hiding deleted the value");

    visible = toggleLine(saved.visible, "freight");
    assert.equal(cogsTotal(visible, saved.values), 40, "the value did not come back");
  });
});

/** Criterion 4. */
describe("group totals", () => {
  const values: Values = {
    price_retail: 100, tax_rate_pct: 25, price_cogs: 20, freight_duty: 5, packaging_cost: 2,
    cac: 8, payment_fees: 3,
  };

  it("sum their visible cost lines only", () => {
    assert.equal(groupTotal("goods", ["unit", "freight", "pack"], values), 27);
    assert.equal(groupTotal("goods", ["unit", "freight"], values), 25);
    assert.equal(groupTotal("sell", ["cac", "fees"], values), 11);
  });

  it("ignore a line whose value is not set", () => {
    assert.equal(groupTotal("goods", ["unit", "licence"], values), 20);
  });

  it("never count an input as a cost", () => {
    // retail and tax are in the "in" group and are not costs.
    assert.equal(groupTotal("in", ["retail", "tax"], values), null);
  });

  it("return null rather than zero when nothing is set", () => {
    assert.equal(groupTotal("goods", ["unit"], {}), null);
    assert.equal(groupTotal("sell", [], values), null);
  });
});

/** Criterion 5, the one that protects the house rule. */
describe("gross margin", () => {
  const values: Values = { price_retail: 100, tax_rate_pct: 0, price_cogs: 40 };

  it("is net of tax against cost of goods", () => {
    const m = grossMargin(["unit"], values)!;
    assert.equal(m.pct, 60);
    assert.equal(m.cash, 60);
  });

  it("takes tax out of the price first", () => {
    const m = grossMargin(["unit"], { price_retail: 125, tax_rate_pct: 25, price_cogs: 50 })!;
    assert.equal(Math.round(m.cash), 50);      // net 100, cost 50
    assert.equal(Math.round(m.pct), 50);
  });

  /* Folding CAC into COGS would understate gross margin on every product. */
  it("is UNAFFECTED by any cost to sell line", () => {
    const withCac = { ...values, cac: 25, payment_fees: 5 };
    const before = grossMargin(["unit"], values)!;
    const after = grossMargin(["unit", "cac", "fees"], withCac)!;
    assert.equal(after.pct, before.pct, "a cost-to-sell line moved gross margin");
    assert.equal(after.cash, before.cash);
  });

  it("matches lib/numbers.ts rather than reimplementing it", () => {
    const m = grossMargin(["unit"], { price_retail: 240, tax_rate_pct: 20, price_cogs: 80 })!;
    assert.equal(m.pct, marginPct(240, 20, 80));
    assert.equal(m.cash, netPrice(240, 20) - 80);
  });
});

/** Criterion 6. */
describe("contribution", () => {
  const values: Values = {
    price_retail: 100, tax_rate_pct: 0, price_cogs: 40, cac: 15, payment_fees: 3, shipping_cost: 2,
  };

  it("subtracts every visible cost to sell line", () => {
    const c = contributionMargin(["unit", "cac", "fees", "ship"], values)!;
    assert.equal(c.cash, 40);      // 100 - 40 - 20
    assert.equal(c.pct, 40);
  });

  it("subtracts only the visible ones", () => {
    const c = contributionMargin(["unit", "cac"], values)!;
    assert.equal(c.cash, 45);      // 100 - 40 - 15
  });

  it("equals gross margin when no cost to sell is shown", () => {
    const g = grossMargin(["unit"], values)!;
    const c = contributionMargin(["unit"], values)!;
    assert.equal(c.cash, g.cash);
  });

  it("can go negative, and says so rather than clamping", () => {
    const c = contributionMargin(["unit", "cac"], { price_retail: 50, tax_rate_pct: 0, price_cogs: 40, cac: 20 })!;
    assert.equal(c.cash, -10);
    assert.ok(c.pct < 0);
  });
});

/** Criterion 7. A blank figure beats a fabricated one. */
describe("a missing number", () => {
  it("gives no margin when there is no retail price", () => {
    assert.equal(grossMargin(["unit"], { price_cogs: 10 }), null);
    assert.equal(contributionMargin(["unit"], { price_cogs: 10 }), null);
  });

  it("gives no margin when there is no cost", () => {
    assert.equal(grossMargin(["unit"], { price_retail: 100, tax_rate_pct: 0 }), null);
  });

  it("gives no margin on a zero or negative price, rather than dividing by it", () => {
    assert.equal(grossMargin(["unit"], { price_retail: 0, price_cogs: 5 }), null);
    assert.equal(grossMargin(["unit"], { price_retail: -5, price_cogs: 5 }), null);
  });

  /* A missing tax rate cannot silently default to zero without saying so:
     that treats gross as net and inflates the margin. */
  it("flags an assumed tax rate rather than hiding it", () => {
    const m = grossMargin(["unit"], { price_retail: 100, price_cogs: 40 })!;
    assert.equal(m.assumedNoTax, true);
    assert.equal(grossMargin(["unit"], { price_retail: 100, tax_rate_pct: 0, price_cogs: 40 })!.assumedNoTax, false);
  });

  it("falls back to RRP when there is no retail price", () => {
    const m = grossMargin(["unit"], { price_rrp: 100, tax_rate_pct: 0, price_cogs: 40 })!;
    assert.equal(m.cash, 60);
  });
});

/** Criterion 8. */
describe("custom lines", () => {
  const custom = [{ label: "Sample kits", value: 0.4, group: "sell" as const }];

  it("count into their group's total", () => {
    const values: Values = { price_retail: 100, tax_rate_pct: 0, price_cogs: 40, cac: 10 };
    assert.equal(sellTotal(["cac"], values, custom), 10.4);
  });

  it("reach contribution but not gross margin", () => {
    const values: Values = { price_retail: 100, tax_rate_pct: 0, price_cogs: 40, cac: 10 };
    assert.equal(grossMargin(["unit"], values, custom)!.cash, 60);
    assert.equal(contributionMargin(["unit", "cac"], values, custom)!.cash, 49.6);
  });

  it("read back from JSONB, dropping anything unusable", () => {
    const parsed = parseCustomLines([
      { label: "Sample kits", value: 0.4, group: "sell" },
      { label: "  ", value: 1, group: "sell" },
      { label: "No value", group: "goods" },
      { label: "Bad group", value: 2, group: "nonsense" },
      null, "string",
    ]);
    assert.deepEqual(parsed, [
      { label: "Sample kits", value: 0.4, group: "sell" },
      { label: "No value", value: null, group: "goods" },
      { label: "Bad group", value: 2, group: "sell" },
    ]);
  });

  it("survives a column that is not an array", () => {
    assert.deepEqual(parseCustomLines(null), []);
    assert.deepEqual(parseCustomLines({}), []);
  });
});

describe("landed_cost stays derived", () => {
  it("is the cost of goods total, so the column keeps meaning what it meant", () => {
    const values: Values = { price_cogs: 20, freight_duty: 5, packaging_cost: 2 };
    assert.equal(derivedLandedCost(["unit", "freight", "pack"], values), 27);
  });

  it("is null when nothing is known, not zero", () => {
    // A zero landed cost reports a 100% margin, which is the trap the card exists to avoid.
    assert.equal(derivedLandedCost(["unit"], {}), null);
  });
});
