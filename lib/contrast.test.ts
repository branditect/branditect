/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseHex, relativeLuminance, contrastRatio, levelFor, contrastOnWhite, readableInkOn,
} from "./contrast.ts";

describe("parseHex", () => {
  it("reads six digits with or without the hash", () => {
    assert.deepEqual(parseHex("#f0562a"), [240, 86, 42]);
    assert.deepEqual(parseHex("f0562a"), [240, 86, 42]);
    assert.deepEqual(parseHex("  #F0562A  "), [240, 86, 42]);
  });

  it("expands the three-digit form", () => {
    assert.deepEqual(parseHex("#fff"), [255, 255, 255]);
    assert.deepEqual(parseHex("#000"), [0, 0, 0]);
  });

  it("returns null for anything that is not a hex colour", () => {
    for (const v of ["", "rgb(0,0,0)", "linear-gradient(90deg,#fff,#000)", "#gggggg", "#ff", "red"]) {
      assert.equal(parseHex(v), null, v);
    }
  });
});

describe("relative luminance", () => {
  it("is 1 for white and 0 for black", () => {
    assert.equal(relativeLuminance("#ffffff"), 1);
    assert.equal(relativeLuminance("#000000"), 0);
  });

  it("crosses the sRGB gamma cutoff without a jump", () => {
    // #0a is 10/255 = 0.0392, just under 0.03928; #0b is just over.
    const below = relativeLuminance("#0a0a0a")!;
    const above = relativeLuminance("#0b0b0b")!;
    assert.ok(above > below, `${above} should exceed ${below}`);
    assert.ok(above - below < 0.001, "the two branches should meet, not step");
  });
});

describe("contrast ratios", () => {
  it("is 21:1 for black on white, the maximum", () => {
    assert.equal(Math.round(contrastRatio("#000000", "#ffffff")!), 21);
  });

  it("is 1:1 for a colour against itself", () => {
    assert.equal(contrastRatio("#f0562a", "#f0562a"), 1);
  });

  it("does not care which way round the pair is given", () => {
    assert.equal(contrastRatio("#15151b", "#ffffff"), contrastRatio("#ffffff", "#15151b"));
  });

  it("returns null when either side is not a hex colour", () => {
    assert.equal(contrastRatio("linear-gradient(90deg,#fff,#000)", "#ffffff"), null);
  });
});

/** Criterion 4: a known AAA pair, a known AA pair and a known fail. */
describe("the three badges the spec names", () => {
  it("AAA — the v6 ink on white, 16.9:1", () => {
    const c = contrastOnWhite("#15151b")!;
    assert.equal(c.level, "AAA");
    assert.ok(c.ratio >= 7, String(c.ratio));
    assert.equal(c.label, "AAA on white");
  });

  it("AA — a mid grey that clears 4.5 but not 7", () => {
    // #6f6f8a, the v6 `muted`. 4.99:1 on white.
    const c = contrastOnWhite("#6f6f8a")!;
    assert.equal(c.level, "AA");
    assert.ok(c.ratio >= 4.5 && c.ratio < 7, String(c.ratio));
  });

  it("large text only — signal orange at about 3.1:1", () => {
    const c = contrastOnWhite("#f0562a")!;
    assert.equal(c.level, "large");
    assert.ok(c.ratio >= 3 && c.ratio < 4.5, String(c.ratio));
    assert.equal(c.label, "Large text only");
  });

  it("surface only — a pale tint you cannot set text in", () => {
    const c = contrastOnWhite("#fef0ea")!;
    assert.equal(c.level, "surface");
    assert.ok(c.ratio < 3, String(c.ratio));
  });

  it("white on white is the floor, not an error", () => {
    const c = contrastOnWhite("#ffffff")!;
    assert.equal(c.ratio, 1);
    assert.equal(c.level, "surface");
  });
});

describe("the level boundaries are inclusive at the WCAG numbers", () => {
  it("7.0 is AAA, 6.9 is AA", () => {
    assert.equal(levelFor(7), "AAA");
    assert.equal(levelFor(6.9), "AA");
  });

  it("4.5 is AA, 4.4 is large only", () => {
    assert.equal(levelFor(4.5), "AA");
    assert.equal(levelFor(4.4), "large");
  });

  it("3.0 is large only, 2.9 is surface", () => {
    assert.equal(levelFor(3), "large");
    assert.equal(levelFor(2.9), "surface");
  });
});

describe("contrastOnWhite refuses non-colours", () => {
  it("returns null for a gradient string, so the badge is omitted", () => {
    assert.equal(contrastOnWhite("linear-gradient(120deg,#f16d2c,#fe4401)"), null);
    assert.equal(contrastOnWhite(""), null);
  });
});

describe("readableInkOn", () => {
  it("puts ink on a light chip and white on a dark one", () => {
    assert.equal(readableInkOn("#ffffff"), "#15151b");
    assert.equal(readableInkOn("#15151b"), "#ffffff");
    assert.equal(readableInkOn("#f0562a"), "#ffffff");
  });

  it("falls back to ink rather than throwing on a gradient", () => {
    assert.equal(readableInkOn("linear-gradient(90deg,#fff,#000)"), "#15151b");
  });
});
