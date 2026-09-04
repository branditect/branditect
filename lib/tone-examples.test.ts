/** Run with: npm test — criteria 3 and 4 of branditect-ui/spec/tone-examples.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ARCHETYPES, type ArchetypeId } from "./onboarding-questions.ts";
import {
  TONE_EXAMPLES, BASE_MESSAGE, CROSS_CATEGORY_CALLOUT,
  toneExample, anchorLabel, isAnchorName, toneExampleProblems,
} from "./tone-examples.ts";
import {
  validateLine, houseRuleProblems, sentencesOf, avgSentenceWords, hasContraction,
  usesSecondPerson, hasNumeral, hasCaveat, hedgesIn, hypeIn,
  RUBRICS, RUBRICS_ARE_COMPLETE, MISSING_RUBRIC_SOURCE, SPEC_RUBRIC_FIELDS,
} from "./tone-rubric.ts";

const IDS = Object.keys(ARCHETYPES) as ArchetypeId[];

describe("the six, and only the six", () => {
  it("there are six examples, one per archetype", () => {
    assert.equal(TONE_EXAMPLES.length, 6);
    assert.deepEqual(TONE_EXAMPLES.map((e) => e.id).sort(), [...IDS].sort());
  });

  it("no seventh archetype is introduced", () => {
    for (const e of TONE_EXAMPLES) {
      assert.ok(ARCHETYPES[e.id], `${e.id} is not one of the six`);
    }
    assert.equal(IDS.length, 6);
  });

  it("every line is a version of the same message", () => {
    assert.match(BASE_MESSAGE, /shipped/i);
    const shipped = /ship|dispatch|out the door|on its way|track|arrive/i;
    for (const e of TONE_EXAMPLES) {
      assert.match(e.line, shipped, `${e.id}'s line is not the shipping message`);
    }
  });

  it("and no two archetypes say it the same way", () => {
    const lines = TONE_EXAMPLES.map((e) => e.line.toLowerCase());
    assert.equal(new Set(lines).size, 6);
  });
});

/** CRITERION 3. The line must satisfy the rubric it illustrates. */
describe("each line satisfies its own archetype's rubric", () => {
  for (const e of TONE_EXAMPLES) {
    it(`${ARCHETYPES[e.id].name}`, () => {
      const v = validateLine(e.line, e.id);
      assert.deepEqual(v.problems, [], `${e.id}: ${v.problems.join("; ")}`);
    });
  }

  it("the house rules are enforced on every line", () => {
    for (const e of TONE_EXAMPLES) {
      assert.deepEqual(houseRuleProblems(e.line), [], `${e.id}: ${houseRuleProblems(e.line).join("; ")}`);
    }
  });

  it("no line uses an em dash, which house style bans outright", () => {
    for (const e of TONE_EXAMPLES) {
      assert.ok(!/[—–]/.test(e.line), `${e.id}'s line contains a dash`);
    }
  });

  /* The properties the in-repo definitions actually state, spelled out so a
     rewrite cannot quietly lose one. */
  it("Confident keeps its few words and does not hedge", () => {
    const e = toneExample("confident")!;
    assert.ok(avgSentenceWords(e.line) <= 9, `${avgSentenceWords(e.line)} words a sentence`);
    assert.deepEqual(hedgesIn(e.line), []);
  });

  it("Warm talks to you, like a person", () => {
    const e = toneExample("warm")!;
    assert.ok(usesSecondPerson(e.line));
    assert.ok(hasContraction(e.line));
  });

  it("Calm tells you the risk and does not hype", () => {
    const e = toneExample("calm")!;
    assert.ok(hasCaveat(e.line), "no caveat, and telling you the risk is the whole archetype");
    assert.deepEqual(hypeIn(e.line), []);
  });

  it("Expert leads with the number", () => {
    const e = toneExample("expert")!;
    assert.ok(hasNumeral(e.line));
    assert.deepEqual(hedgesIn(e.line), []);
  });

  /** A validator that cannot fail proves nothing about the six above. */
  it("and the validator would catch a line that broke its rubric", () => {
    const bad: [string, ArchetypeId, RegExp][] = [
      ["We think it probably shipped, and we hope it arrives when the courier gets round to it.", "confident", /hedges|over its/],
      ["Order dispatched.", "warm", /requires secondPerson|requires contraction/],
      ["Your order shipped today. It is an amazing journey.", "calm", /hype/],
      ["Dispatched today, tracked end to end.", "expert", /requires numeral/],
      ["Shipped today — track it.", "confident", /em or en dash/],
      ["Here's the thing: it shipped.", "confident", /scaffolding/],
    ];
    for (const [line, id, expected] of bad) {
      const v = validateLine(line, id);
      assert.ok(!v.ok, `not caught for ${id}: ${line}`);
      assert.ok(v.problems.some((p) => expected.test(p)),
        `wrong reason for ${id}: ${v.problems.join("; ")}`);
    }
  });
});

/**
 * The measurements themselves, pinned directly.
 *
 * Without these, sentencesOf() had no test that depended on it: its only
 * consumer is the length band, and collapsing the split makes the average
 * larger, which is stricter rather than looser — so breaking it could not turn
 * the suite red. A splitter that OVER-splits is the dangerous direction,
 * because it lets a long line through the band.
 */
describe("the measurements", () => {
  it("counts sentences", () => {
    assert.equal(sentencesOf("Shipped this morning. Track it.").length, 2);
    assert.equal(sentencesOf("One only").length, 1);
    assert.equal(sentencesOf("Go! Now? Yes.").length, 3);
    assert.equal(sentencesOf("").length, 0);
  });

  it("averages words per sentence, not words per line", () => {
    assert.equal(avgSentenceWords("Shipped this morning. Track it."), 2.5);
    assert.equal(avgSentenceWords("One two three four"), 4);
  });

  it("a splitter that over-splits would let a long line through the band", () => {
    const long = "This sentence is deliberately far longer than the confident band permits here.";
    assert.ok(avgSentenceWords(long) > 9, `measured ${avgSentenceWords(long)}`);
    assert.ok(!validateLine(long, "confident").ok);
  });

  it("finds contractions, second person, numerals and caveats", () => {
    assert.ok(hasContraction("It's on its way"));
    assert.ok(!hasContraction("It is on its way"));
    assert.ok(usesSecondPerson("on its way to you"));
    assert.ok(!usesSecondPerson("on its way"));
    assert.ok(hasNumeral("Dispatched 14:20"));
    assert.ok(!hasNumeral("Dispatched today"));
    assert.ok(hasCaveat("though weather can add one"));
    assert.ok(!hasCaveat("It shipped."));
  });
});

/** CRITERION 4. Named, never quoted. */
describe("no line is attributed to an anchor", () => {
  for (const e of TONE_EXAMPLES) {
    it(`${e.id} is clean`, () => {
      assert.deepEqual(toneExampleProblems(e), [], toneExampleProblems(e).join("; "));
    });
  }

  it("no line carries quotation marks of any kind", () => {
    for (const e of TONE_EXAMPLES) {
      for (const q of ['"', "“", "”", "«", "»"]) {
        assert.ok(!e.line.includes(q), `${e.id}'s line contains ${q}`);
      }
    }
  });

  it("and the check would catch an attribution if one appeared", () => {
    const bad = [
      { id: "warm" as ArchetypeId, anchors: ["Glossier"], line: "It's on its way — Glossier" },
      { id: "warm" as ArchetypeId, anchors: ["Glossier"], line: "Shipped, by Glossier" },
      { id: "warm" as ArchetypeId, anchors: ["Glossier"], line: "Glossier said it shipped" },
      { id: "warm" as ArchetypeId, anchors: ["Glossier"], line: "“It's on its way.”" },
    ];
    for (const b of bad) {
      assert.notDeepEqual(toneExampleProblems(b), [], `not caught: ${b.line}`);
    }
  });

  it("an ordinary apostrophe is not a quotation mark", () => {
    assert.deepEqual(
      toneExampleProblems({ id: "warm", anchors: ["Glossier"], line: "It's on its way to you." }), []);
  });
});

describe("anchors", () => {
  it("come from ARCHETYPES.think, so there is one list not two", () => {
    for (const e of TONE_EXAMPLES) {
      const fromDoc = ARCHETYPES[e.id].think.split(",").map((s) => s.trim());
      assert.deepEqual(e.anchors, fromDoc, `${e.id} keeps its own copy of the anchors`);
    }
  });

  it("are framed as comparison, not as a source", () => {
    for (const e of TONE_EXAMPLES) {
      assert.ok(anchorLabel(e).startsWith("like "), `${e.id} drops the framing`);
    }
  });

  it("an anchor name is not mistaken for an archetype", () => {
    for (const name of ["Aesop", "Glossier", "Duolingo", "Stripe"]) {
      assert.ok(isAnchorName(name));
      assert.equal(toneExample(name as ArchetypeId), null);
    }
  });

  it("the cross-category callout is three beauty brands in three tiles", () => {
    const { anchors } = CROSS_CATEGORY_CALLOUT;
    assert.equal(anchors.length, 3);
    const tiles = anchors.map((a) => TONE_EXAMPLES.find((e) => e.anchors.includes(a))?.id);
    assert.equal(new Set(tiles).size, 3, `they are not in three different tiles: ${tiles.join(", ")}`);
    assert.ok(tiles.every(Boolean), `an anchor in the callout is on no tile: ${tiles.join(", ")}`);
  });
});

/**
 * The honest limit. `claude/brand-voice-archetypes.md` is not in this
 * repository, so most of each rubric cannot be checked. This fails the day
 * someone fills the rubrics in, which is exactly when criterion 3 needs
 * finishing rather than assuming.
 */
describe("what criterion 3 does not yet cover", () => {
  it("the governing document is still missing", () => {
    assert.equal(RUBRICS_ARE_COMPLETE, false,
      `rubrics now look complete — bring ${MISSING_RUBRIC_SOURCE} in and check every field of criterion 3`);
  });

  it("every archetype names the fields it cannot check", () => {
    for (const id of IDS) {
      assert.ok(RUBRICS[id].unsourced.length > 0, `${id} claims full rubric coverage`);
      for (const f of RUBRICS[id].unsourced) {
        assert.ok(SPEC_RUBRIC_FIELDS.includes(f), `${id} lists an unknown field ${f}`);
      }
    }
  });

  it("a missing rubric is an error, never a silent pass", () => {
    const v = validateLine("anything at all", "not-an-archetype" as ArchetypeId);
    assert.equal(v.ok, false);
    assert.match(v.problems.join(" "), /no rubric/);
  });
});

describe("nothing here is per-brand", () => {
  const src = readFileSync("lib/tone-examples.ts", "utf8");
  it("the data file fetches nothing and calls no model", () => {
    for (const forbidden of ["fetch(", "supabase", "anthropic", "await "]) {
      assert.ok(!src.includes(forbidden), `contains ${forbidden}`);
    }
  });
  it("it takes no brand id", () => {
    assert.ok(!/brandId|brand_id/.test(src));
  });
});
