/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitiseOutput, sanitiseDeep } from "./sanitise-output.ts";

/** Verbatim from production, 2026-08-28. */
const PRODUCTION = `**Why it works:** - Clean collection from smooth and uneven surfaces
- Non-toxic and biodegradable`;

describe("the production example", () => {
  const out = sanitiseOutput(PRODUCTION);

  it("leaves no asterisks", () => {
    assert.ok(!out.includes("*"), out);
  });

  it("leaves no bullet characters at the start of a line", () => {
    const bulleted = out.split("\n").filter((l) => /^\s*[-*•·]\s/.test(l));
    assert.deepEqual(bulleted, [], out);
  });

  it("leaves no em or en dashes", () => {
    assert.ok(!/[—–]/.test(out), out);
  });

  it("keeps the words", () => {
    assert.ok(out.includes("Clean collection from smooth and uneven surfaces"), out);
    assert.ok(out.includes("biodegradable"), out);
  });
});

describe("hyphenated compounds", () => {
  it("survives untouched", () => {
    assert.equal(sanitiseOutput("Non-toxic and high-viscosity."), "Non-toxic and high-viscosity.");
  });

  it("survives when it opens a bulleted line", () => {
    assert.equal(sanitiseOutput("- Non-toxic and biodegradable"), "Non-toxic and biodegradable");
  });

  it("does not eat a negative number", () => {
    assert.equal(sanitiseOutput("Margin fell to -5% last quarter."), "Margin fell to -5% last quarter.");
  });
});

describe("dashes", () => {
  it("becomes a full stop between two clauses, and the next word is capitalised", () => {
    assert.equal(
      sanitiseOutput("Absorbs liquids — engineered for demanding sites."),
      "Absorbs liquids. Engineered for demanding sites.",
    );
  });

  it("becomes a comma when it introduces a short fragment", () => {
    assert.equal(sanitiseOutput("The best option — by far."), "The best option, by far.");
  });

  it("becomes a comma before a connector", () => {
    assert.equal(
      sanitiseOutput("It works on water — and on hard surfaces too."),
      "It works on water, and on hard surfaces too.",
    );
  });

  it("handles an unspaced em dash", () => {
    assert.equal(
      sanitiseOutput("Absorbs liquids—engineered for demanding sites."),
      "Absorbs liquids. Engineered for demanding sites.",
    );
  });

  it("handles an en dash the same way", () => {
    assert.equal(sanitiseOutput("The best option – by far."), "The best option, by far.");
  });
});

describe("markdown markers", () => {
  it("strips bold and italics but keeps the text", () => {
    assert.equal(sanitiseOutput("**Bold** and *italic* and ***both***."), "Bold and italic and both.");
  });

  it("strips heading markers", () => {
    assert.equal(sanitiseOutput("## Key benefits\nOne per line"), "Key benefits\nOne per line");
  });

  it("does not double punctuation", () => {
    assert.ok(!/\.\./.test(sanitiseOutput("Ends here. — And continues onward now.")));
  });
});

describe("safety", () => {
  it("returns empty input unchanged", () => {
    assert.equal(sanitiseOutput(""), "");
  });

  it("leaves clean prose alone", () => {
    const clean = "Absorbs 8.4 litres per kilo. Stays intact when saturated.";
    assert.equal(sanitiseOutput(clean), clean);
  });
});

describe("sanitiseDeep", () => {
  it("cleans string values and leaves structure alone", () => {
    const input = { headline: "**Bold** claim", bullets: ["- one", "- two"], count: 3, ok: true };
    const out = sanitiseDeep(input);
    assert.deepEqual(out, { headline: "Bold claim", bullets: ["one", "two"], count: 3, ok: true });
  });

  it("leaves null and numbers untouched", () => {
    assert.deepEqual(sanitiseDeep({ a: null, b: -5, c: 0 }), { a: null, b: -5, c: 0 });
  });
});
