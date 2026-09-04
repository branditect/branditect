/** Run with: npm test — criterion 6 of branditect-ui/spec/tone-examples.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  TONE_EXAMPLES, BASE_MESSAGE, REGISTER_IDS, comparatorLabel, toneExample,
  isRegisterId, isComparatorName, toneExampleProblems,
} from "./tone-examples.ts";

/**
 * CRITERION 6. Twelve entries, each with a unique register, at least one
 * comparator and exactly one line, and no entry presented as a quotation from
 * its comparator.
 */
describe("the twelve", () => {
  it("there are twelve", () => {
    assert.equal(TONE_EXAMPLES.length, 12);
  });

  it("every register is unique", () => {
    const names = TONE_EXAMPLES.map((e) => e.register);
    assert.equal(new Set(names).size, 12, `duplicates in ${names.join(", ")}`);
  });

  it("every id is unique and stable-looking", () => {
    assert.equal(new Set(REGISTER_IDS).size, 12);
    for (const id of REGISTER_IDS) {
      assert.match(id, /^[a-z][a-z-]*$/, `${id} is not a stable id`);
    }
  });

  it("every entry has at least one comparator", () => {
    for (const e of TONE_EXAMPLES) {
      assert.ok(e.comparators.length >= 1, `${e.register} has none`);
    }
  });

  it("every entry has exactly one line, and it is a sentence", () => {
    for (const e of TONE_EXAMPLES) {
      assert.equal(typeof e.line, "string");
      assert.ok(e.line.trim().length > 8, `${e.register}'s line is too short to read`);
    }
  });
});

/** The part that matters. Nothing is put in anyone's mouth. */
describe("no entry is presented as a quotation from its comparator", () => {
  for (const e of TONE_EXAMPLES) {
    it(`${e.register} is clean`, () => {
      assert.deepEqual(toneExampleProblems(e), [],
        `${e.register}: ${toneExampleProblems(e).join("; ")}`);
    });
  }

  it("no line carries quotation marks of any kind", () => {
    for (const e of TONE_EXAMPLES) {
      for (const q of ['"', "“", "”", "«", "»"]) {
        assert.ok(!e.line.includes(q), `${e.register}'s line contains ${q}`);
      }
    }
  });

  it("no line names the company it sits under", () => {
    for (const e of TONE_EXAMPLES) {
      for (const c of e.comparators) {
        assert.ok(!e.line.includes(c), `${e.register}'s line names ${c}`);
      }
    }
  });

  /**
   * The detector has to be able to fail, or the twelve passes above mean
   * nothing. These are the shapes it exists to catch.
   */
  it("and the check would catch it if one did", () => {
    const attributed = [
      { id: "x", register: "X", comparators: ["Duolingo"], line: "Track it — Duolingo" },
      { id: "x", register: "X", comparators: ["Oatly"], line: "Shipped, by Oatly" },
      { id: "x", register: "X", comparators: ["Monzo"], line: "It shipped late (Monzo)" },
      { id: "x", register: "X", comparators: ["Aesop"], line: "Aesop said it has left us" },
      { id: "x", register: "X", comparators: ["Nike"], line: "“It's on its way.”" },
      { id: "x", register: "X", comparators: ["Nike"], line: '"It is on its way."' },
    ];
    for (const bad of attributed) {
      assert.notDeepEqual(toneExampleProblems(bad), [],
        `not caught: ${bad.line}`);
    }
  });

  it("but an ordinary apostrophe is not a quotation mark", () => {
    const fine = { id: "x", register: "X", comparators: ["IKEA"],
      line: "It's on its way to you. Pop the kettle on." };
    assert.deepEqual(toneExampleProblems(fine), []);
  });
});

/** Criterion 5's data half: what is stored is the register, never a brand. */
describe("what may be stored", () => {
  it("a register id is storable", () => {
    assert.ok(isRegisterId("premium"));
    assert.ok(isRegisterId("plain-spoken"));
  });

  it("a comparator name is not a register id", () => {
    for (const name of ["Aesop", "Duolingo", "Monzo", "IKEA"]) {
      assert.ok(!isRegisterId(name), `${name} would be storable as a tone`);
      assert.ok(isComparatorName(name), `${name} is not recognised as a brand name`);
    }
  });

  it("lookup is by id", () => {
    assert.equal(toneExample("candid")?.register, "Candid");
    assert.equal(toneExample("Buffer"), null);
    assert.equal(toneExample("nonsense"), null);
  });
});

describe("the card's comparator line", () => {
  it("frames the names as comparison, not as a source", () => {
    assert.equal(comparatorLabel(TONE_EXAMPLES[0]), "like Duolingo, Innocent");
    for (const e of TONE_EXAMPLES) {
      assert.ok(comparatorLabel(e).startsWith("like "), `${e.register} drops the framing`);
    }
  });
});

/** One message, twelve ways — the thing that makes the grid teach. */
describe("the message is held constant", () => {
  it("there is one, and it is a message these customers actually send", () => {
    assert.match(BASE_MESSAGE, /shipped/i);
  });

  it("every line is about that message, not twelve unrelated slogans", () => {
    // Each line has to carry the shipped-and-trackable idea in some form.
    const shipped = /ship|dispatch|out the door|on its way|left (us|the building)|packed|rolling/i;
    for (const e of TONE_EXAMPLES) {
      assert.match(e.line, shipped, `${e.register}'s line is not about the shipping message`);
    }
  });

  it("and no two registers say it the same way", () => {
    const lines = TONE_EXAMPLES.map((e) => e.line.toLowerCase());
    assert.equal(new Set(lines).size, 12, "two registers share a line");
  });
});

/** Fixed for every account. No generation, no cost. */
describe("nothing here is per-brand", () => {
  const src = readFileSync("lib/tone-examples.ts", "utf8");

  it("the data file fetches nothing and calls no model", () => {
    for (const forbidden of ["fetch(", "supabase", "anthropic", "await "]) {
      assert.ok(!src.includes(forbidden),
        `lib/tone-examples.ts contains ${forbidden} — this must stay a static file`);
    }
  });

  it("it takes no brand id", () => {
    assert.ok(!/brandId|brand_id/.test(src));
  });
});
