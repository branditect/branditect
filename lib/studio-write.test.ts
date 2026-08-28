/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FORMATS,
  FORMAT_IDS,
  findFormat,
  contextLayersFor,
  isThinBrief,
  wordCount,
  normaliseDraft,
} from "./studio-write.ts";

describe("formats", () => {
  it("has the six named formats plus the free-text seventh", () => {
    assert.deepEqual(FORMAT_IDS, [
      "ad",
      "email",
      "instagram",
      "linkedin",
      "product",
      "customer",
      "other",
    ]);
  });

  it("gives every format three examples", () => {
    for (const f of FORMATS) {
      assert.equal(f.examples.length, 3, f.id);
    }
  });

  /** Criterion 3: switching format changes the three example chips. */
  it("changes the chips when the format changes", () => {
    const seen = new Set<string>();
    for (const f of FORMATS) {
      const key = f.examples.join("|");
      assert.ok(!seen.has(key), `${f.id} repeats another format's chips`);
      seen.add(key);
    }
  });

  it("gives every format a word target per length", () => {
    for (const f of FORMATS) {
      for (const len of ["short", "medium", "long"] as const) {
        assert.ok(f.words[len], `${f.id}.${len}`);
      }
    }
  });

  it("does not use one global word count for every format", () => {
    const ad = findFormat("ad")!;
    const email = findFormat("email")!;
    assert.notEqual(ad.words.medium, email.words.medium);
  });

  it("returns undefined for a format it does not know", () => {
    assert.equal(findFormat("tiktok"), undefined);
    assert.equal(findFormat(null), undefined);
  });
});

/**
 * Criterion 9. A maintenance notice or a complaint reply is not marketing
 * copy — it obeys tone and the facts and must not reach for positioning.
 */
describe("context per format", () => {
  it("gives customer message no positioning, key messages or pillars", () => {
    const layers = contextLayersFor("customer");
    assert.ok(!layers.includes("positioning"), layers.join(","));
    assert.ok(!layers.includes("key_messages"), layers.join(","));
    assert.ok(!layers.includes("pillars"), layers.join(","));
    assert.ok(!layers.includes("pricing"), layers.join(","));
  });

  it("still gives customer message tone, boundaries and the facts", () => {
    const layers = contextLayersFor("customer");
    for (const need of ["profile", "tone", "boundaries", "product"] as const) {
      assert.ok(layers.includes(need), need);
    }
  });

  it("gives every other format the full set", () => {
    for (const id of FORMAT_IDS.filter((f) => f !== "customer")) {
      const layers = contextLayersFor(id);
      assert.ok(layers.includes("positioning"), id);
      assert.ok(layers.includes("pillars"), id);
    }
  });

  it("cannot be mutated by a caller", () => {
    const layers = contextLayersFor("ad");
    layers.pop();
    assert.ok(contextLayersFor("ad").includes("pricing"));
  });
});

/**
 * Criterion 8, against a fixture that previously produced all five: bold,
 * a heading, a leading bullet, an em dash and an en dash.
 */
describe("normaliseDraft", () => {
  const DIRTY = `## Why it works

**SORBIFY OIL** lifts oil in one pass — engineered for demanding sites.
- Non-toxic and biodegradable
- Holds 12 times its weight – tested to 800 km`;

  const out = normaliseDraft({
    body: DIRTY,
    provenance: [{ claim: "**12 times** its weight", source: "Product range specs" }],
  })!;

  it("returns a draft", () => {
    assert.ok(out);
  });

  it("has no asterisks", () => {
    assert.ok(!out.body.includes("*"), out.body);
  });

  it("has no heading markers", () => {
    assert.ok(!/^#{1,6}\s/m.test(out.body), out.body);
  });

  it("has no leading bullet", () => {
    const bulleted = out.body.split("\n").filter((l) => /^\s*[-*•·]\s/.test(l));
    assert.deepEqual(bulleted, [], out.body);
  });

  it("has no em or en dash", () => {
    assert.ok(!/[—–]/.test(out.body), out.body);
  });

  it("keeps the hyphenated compound", () => {
    assert.ok(out.body.includes("Non-toxic"), out.body);
  });

  it("sanitises the provenance claim too", () => {
    assert.equal(out.provenance[0].claim, "12 times its weight");
    assert.equal(out.provenance[0].source, "Product range specs");
  });

  it("drops a draft with no body", () => {
    assert.equal(normaliseDraft({ body: "" }), null);
    assert.equal(normaliseDraft({ provenance: [] }), null);
    assert.equal(normaliseDraft(null), null);
    assert.equal(normaliseDraft("a string"), null);
  });

  it("drops a provenance entry missing its source", () => {
    const d = normaliseDraft({
      body: "Holds 12 times its weight.",
      provenance: [{ claim: "12 times", source: "" }, { claim: "", source: "Specs" }],
    })!;
    assert.deepEqual(d.provenance, []);
  });

  it("survives provenance that is not an array", () => {
    const d = normaliseDraft({ body: "Copy.", provenance: "none" })!;
    assert.deepEqual(d.provenance, []);
  });
});

describe("brief helpers", () => {
  it("flags a brief under three words without blocking it", () => {
    assert.equal(isThinBrief("new launch"), true);
    assert.equal(isThinBrief("  "), true);
    assert.equal(isThinBrief("The new SORBIFY OIL launch"), false);
  });

  it("counts words the way the draft card shows them", () => {
    assert.equal(wordCount("Absorbs liquids.\n\nStays intact when saturated."), 6);
    assert.equal(wordCount("   "), 0);
  });
});
