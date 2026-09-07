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
  RUBRICS, RUBRICS_ARE_COMPLETE, RUBRIC_SOURCE, RUBRIC_CANONICAL_SOURCE,
  PENDING_REDRAFT, failedFields, maxSentenceWords, fragmentsIn,
  perParaProblems, sentencesPerParagraph,
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

/**
 * CRITERION 3. The line must satisfy the rubric it illustrates.
 *
 * Five of the six drafts do not, and that is the check working rather than
 * failing. They are listed in PENDING_REDRAFT with the fields they break; a
 * line that starts passing makes its own entry fail, so the list cannot go
 * stale.
 */
describe("each line satisfies its own archetype's rubric", () => {
  for (const e of TONE_EXAMPLES) {
    const pending = PENDING_REDRAFT[e.id];
    if (!pending) {
      it(`${ARCHETYPES[e.id].name} passes`, () => {
        const v = validateLine(e.line, e.id);
        assert.deepEqual(v.problems, [], `${e.id}: ${v.problems.join("; ")}`);
      });
    } else {
      it(`${ARCHETYPES[e.id].name} is awaiting a redraft on ${pending.join(", ")}`, () => {
        const v = validateLine(e.line, e.id);
        assert.ok(!v.ok, `${e.id} now passes — remove it from PENDING_REDRAFT`);
        assert.deepEqual(failedFields(v), [...pending].sort(),
          `${e.id} fails on different fields than recorded: ${v.problems.join("; ")}`);
      });
    }
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
      ["We think it probably shipped, and we hope it arrives when the courier gets round to it.", "confident", /hedging: banned/],
      ["Order dispatched.", "warm", /contractions: always/],
      ["Your order shipped today. It is a miracle, and it will transform everything for you now.", "calm", /banned word/],
      ["Dispatched today, tracked end to end.", "expert", /fragments: never|sentence_words_avg/],
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

/**
 * The fragment detector, pinned in both directions.
 *
 * It wrongly called "Nothing in the forecast changes the date" a fragment,
 * because `changes` was missing from its verb list — and that would have
 * rejected a valid Expert line for a defect in the checker rather than in the
 * writing. Fixing a broken detector is not the same as relaxing a rule, but
 * the way to tell the difference is to pin both directions in the same commit:
 * sentences that MUST be flagged, and sentences that MUST NOT be.
 */
describe("what counts as a fragment", () => {
  const MUST_FLAG = [
    "Delivery estimate Thursday, based on the last 200 orders.",
    "Thursday.",
    "Shipped.",
    "Out the door.",
    "Packed and gone.",
  ];
  const MUST_NOT_FLAG = [
    "Nothing in the current weather forecast for that route changes the date.",
    "It is on its way.",
    "Your order left the workshop this morning.",
    "Most deliveries arrive within three working days.",
    "A workshop floor should never be the reason somebody slips.",
    "Go.",
    "Track it.",
  ];

  for (const f of MUST_FLAG) {
    it(`fragment: ${JSON.stringify(f)}`, () => {
      assert.equal(fragmentsIn(f).length, 1, "not flagged as a fragment");
    });
  }
  for (const f of MUST_NOT_FLAG) {
    it(`whole sentence: ${JSON.stringify(f)}`, () => {
      assert.equal(fragmentsIn(f).length, 0, "wrongly flagged as a fragment");
    });
  }

  it("a one-word participle is a fragment, a one-word imperative is not", () => {
    assert.equal(fragmentsIn("Shipped.").length, 1);
    assert.equal(fragmentsIn("Go.").length, 0);
    // The same word is finite in a longer sentence.
    assert.equal(fragmentsIn("Your order shipped today.").length, 0);
  });
});

/**
 * sentences_per_para, scoped to body paragraphs.
 *
 * The band is about body prose: Calm's is 2-4 and Expert's 3-5 while both
 * specify a CTA that is naturally one sentence, so a band governing the
 * closing paragraph would contradict those rubrics' own cta_style.
 *
 * Scoping a rule immediately after it catches something is how checks quietly
 * stop meaning anything, so this is pinned in both directions. The failing
 * cases are kept even where they are inconvenient.
 */
describe("sentences_per_para applies to body paragraphs, not the CTA", () => {
  const WARM: [number, number] = [2, 3];
  const CALM: [number, number] = [2, 4];
  const EXPERT: [number, number] = [3, 5];

  const p = (...counts: number[]) =>
    counts.map((n) => Array.from({ length: n },
      (_, i) => `This is body sentence number ${i + 1} and it runs to a normal length.`).join(" "))
      .join("\n\n");

  it("a closing paragraph of one sentence is exempt", () => {
    assert.deepEqual(perParaProblems(p(2, 1), WARM), []);
    assert.deepEqual(perParaProblems(p(3, 1), WARM), []);
  });

  /* ── and everywhere else it still bites ── */

  it("a body paragraph over its band still fails", () => {
    assert.notDeepEqual(perParaProblems(p(4, 1), WARM), []);
    assert.match(perParaProblems(p(4, 1), WARM)[0], /paragraph 1 has 4/);
  });

  it("a body paragraph under its band still fails", () => {
    assert.notDeepEqual(perParaProblems(p(2, 1), EXPERT), [],
      "a two-sentence body paragraph passed a 3-5 band");
  });

  it("a ONE-SENTENCE paragraph in the middle is body, and still fails", () => {
    const problems = perParaProblems(p(2, 1, 2), WARM);
    assert.notDeepEqual(problems, [], "a one-sentence middle paragraph was exempted");
    assert.match(problems[0], /paragraph 2 has 1/);
  });

  it("a note of a single paragraph has no CTA paragraph and is governed throughout", () => {
    assert.notDeepEqual(perParaProblems(p(1), CALM), [],
      "a one-sentence single-paragraph note was exempted");
    assert.deepEqual(perParaProblems(p(3), CALM), []);
  });

  it("a closing paragraph of more than one sentence is not a CTA and must be in band", () => {
    assert.notDeepEqual(perParaProblems(p(2, 5), WARM), [],
      "a five-sentence closing paragraph was exempted");
  });

  it("the rule is wired into validateLine, not just available", () => {
    const warm = toneExample("warm")!;
    assert.ok(validateLine(warm.line, "warm").ok, "the real Warm line should pass");

    // The same line with a one-sentence paragraph wedged into the middle.
    const [body, cta] = warm.line.split("\n\n");
    const broken = `${body}\n\nWe packed it carefully.\n\n${cta}`;
    const v = validateLine(broken, "warm");
    assert.ok(!v.ok, "a one-sentence middle paragraph passed validateLine");
    assert.match(v.problems.join(" "), /sentences_per_para/);
  });

  it("the six real lines all satisfy it", () => {
    for (const e of TONE_EXAMPLES) {
      assert.deepEqual(perParaProblems(e.line, RUBRICS[e.id].perPara), [],
        `${e.id}: ${perParaProblems(e.line, RUBRICS[e.id].perPara).join("; ")}`);
    }
  });

  it("the bands are the document's", () => {
    assert.deepEqual(RUBRICS.confident.perPara, [1, 2]);
    assert.deepEqual(RUBRICS.warm.perPara, [2, 3]);
    assert.deepEqual(RUBRICS.bold.perPara, [1, 2]);
    assert.deepEqual(RUBRICS.calm.perPara, [2, 4]);
    assert.deepEqual(RUBRICS.visionary.perPara, [1, 3]);
    assert.deepEqual(RUBRICS.expert.perPara, [3, 5]);
  });

  it("counts paragraphs and their sentences", () => {
    assert.deepEqual(sentencesPerParagraph("A one. A two.\n\nA three."), [2, 1]);
    assert.deepEqual(sentencesPerParagraph("Only one."), [1]);
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
 * The governing document is in the repo now, so every field the spec names has
 * a real value. This is the test that was armed to fail on exactly that day.
 */
describe("the rubrics come from the archetype document", () => {
  it("and are complete", () => {
    assert.equal(RUBRICS_ARE_COMPLETE, true);
    assert.equal(RUBRIC_SOURCE, "branditect-ui/spec/brand-voice-archetypes.md");
  });

  it("the project copy is still the canonical one", () => {
    assert.equal(RUBRIC_CANONICAL_SOURCE, "claude/brand-voice-archetypes.md");
    const doc = readFileSync("branditect-ui/spec/brand-voice-archetypes.md", "utf8");
    assert.match(doc, /project copy is canonical/i,
      "the repo copy lost its provenance header");
    assert.match(doc, /do not edit this one in place/i);
  });

  it("every archetype has a band, a cap and a banned list", () => {
    for (const id of IDS) {
      const r = RUBRICS[id];
      assert.ok(r.avg[0] > 0 && r.avg[1] >= r.avg[0], `${id} has no sentence band`);
      assert.ok(r.maxWords >= r.avg[1], `${id}'s cap is below its band`);
      assert.ok(r.banned.length > 0, `${id} has no banned words`);
    }
  });

  it("the other transcribed fields are the document's too", () => {
    // Without these, relaxing a ban would pass unnoticed: only the bands and
    // claim_type were pinned, and a control proved that gap.
    assert.equal(RUBRICS.confident.hedging, "banned");
    assert.equal(RUBRICS.warm.hedging, "allowed");
    assert.equal(RUBRICS.bold.hedging, "banned");
    assert.equal(RUBRICS.calm.hedging, "required");
    assert.equal(RUBRICS.visionary.hedging, "banned");
    assert.equal(RUBRICS.expert.hedging, "banned");

    assert.equal(RUBRICS.calm.fragments, "never");
    assert.equal(RUBRICS.expert.fragments, "never");
    assert.equal(RUBRICS.bold.fragments, "encouraged");
    assert.equal(RUBRICS.visionary.fragments, "heavy");

    assert.equal(RUBRICS.warm.contractions, "always");
    assert.equal(RUBRICS.bold.contractions, "always");
    assert.equal(RUBRICS.confident.contractions, "sparingly");

    assert.deepEqual(
      [RUBRICS.confident.maxWords, RUBRICS.warm.maxWords, RUBRICS.bold.maxWords,
       RUBRICS.calm.maxWords, RUBRICS.visionary.maxWords, RUBRICS.expert.maxWords],
      [18, 25, 20, 22, 16, 28]);
  });

  it("the measurements the bands rest on are pinned", () => {
    assert.equal(maxSentenceWords("One two. Three four five."), 3);
    assert.equal(maxSentenceWords(""), 0);
  });

  it("the bands are the document's, not rounded or widened", () => {
    assert.deepEqual(RUBRICS.confident.avg, [8, 12]);
    assert.deepEqual(RUBRICS.warm.avg, [12, 16]);
    assert.deepEqual(RUBRICS.bold.avg, [6, 14]);
    assert.deepEqual(RUBRICS.calm.avg, [12, 18]);
    assert.deepEqual(RUBRICS.visionary.avg, [7, 12]);
    assert.deepEqual(RUBRICS.expert.avg, [14, 20]);
  });

  it("claim_type separates Confident from Visionary, which is why it exists", () => {
    assert.equal(RUBRICS.confident.claimType, "product_fact");
    assert.equal(RUBRICS.visionary.claimType, "world_belief");
  });

  it("a missing rubric is an error, never a silent pass", () => {
    const v = validateLine("anything at all", "not-an-archetype" as ArchetypeId);
    assert.equal(v.ok, false);
    assert.match(v.problems.join(" "), /no rubric/);
  });

  it("the house rules apply on top and no archetype can unban them", () => {
    const v = validateLine("Your order is seamless and we will elevate it.", "warm");
    assert.match(v.problems.join(" "), /house banned word/);
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
