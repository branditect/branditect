/**
 * Run with: npm test
 *
 * Node's built-in runner with native TypeScript — no framework dependency.
 * Cases follow branditect-ui/spec/strategy.md.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_STRATEGY, SECTIONS, completeness, firstIncompleteSection,
  pillarsMissingProof, derivePyramid, generateSummary, summaryText,
  parseStrategy, strategyPromptContext, primarySegment,
  type BrandStrategy,
} from "./strategy.ts";

function filled(): BrandStrategy {
  return {
    ...EMPTY_STRATEGY,
    core: { whoWeAre: "Sorbify", whatWeDo: "absorbents", whyWeExist: "spills", promise: "fast, clean, responsible" },
    positioning: {
      weAre: "a", forWhom: "b", unlike: "c", because: "d",
      difference: "Science-based absorbents that clean up faster",
      notFor: "bargain hunters",
    },
    audience: [{ name: "Facility manager", role: "ops", isPrimary: true, wants: "less downtime",
                 frustratedBy: "slow cleanup", caresAbout: [], channels: [] }],
    competitors: [{ name: "Us", description: "", price: "€10", isUs: true, map: { x: 60, y: 70 } }],
    pillars: [
      { title: "Fast", body: "", proof: "absorbs in 30 seconds", icon: "" },
      { title: "Safe", body: "", proof: "non-toxic, REACH registered", icon: "" },
    ],
    messages: { tagline: "Protective science", supporting: [{ text: "x", stage: "discovery" }] },
    principles: [{ title: "Honest", body: "" }],
    boundaries: {
      never: [{ rule: "never compete on price", reason: "it contradicts honestly priced" }],
      always: ["lead with the result"],
      wordsUsed: ["reliable"],
      wordsAvoided: ["luxury", "revolutionary"],
      neverCompromise: ["safety"],
    },
    focus: { goal: "grow", priorities: [{ label: "EU", when: "Q1" }] },
  };
}

describe("completeness", () => {
  it("counts sections and never returns a percentage", () => {
    const c = completeness(EMPTY_STRATEGY);
    assert.equal(c.total, 9);
    assert.equal(c.filled, 0);
    assert.equal(c.label, "0 of 9 sections complete");
    assert.ok(!c.label.includes("%"));
  });

  it("reaches 9 of 9 when every section is filled", () => {
    assert.equal(completeness(filled()).label, "9 of 9 sections complete");
  });

  it("does not count a pillars section where any pillar lacks proof", () => {
    const s = filled();
    s.pillars[1].proof = "";
    assert.ok(!SECTIONS.find((x) => x.id === "pillars")!.isFilled(s));
  });
});

describe("firstIncompleteSection", () => {
  it("is the section the hero Edit button opens", () => {
    assert.equal(firstIncompleteSection(EMPTY_STRATEGY)?.no, "01");
    const s = filled();
    s.focus = { goal: "", priorities: [] };
    assert.equal(firstIncompleteSection(s)?.no, "09");
    assert.equal(firstIncompleteSection(filled()), null);
  });
});

describe("proof", () => {
  it("surfaces pillars with no proof rather than hiding them", () => {
    const s = filled();
    s.pillars[0].proof = "  ";
    assert.deepEqual(pillarsMissingProof(s), ["Fast"]);
  });
});

describe("derivePyramid", () => {
  it("takes essence from the difference statement and attributes from proof", () => {
    const p = derivePyramid(filled());
    assert.equal(p.essence, "Science-based absorbents that clean up faster");
    assert.deepEqual(p.attributes, ["absorbs in 30 seconds", "non-toxic, REACH registered"]);
    assert.equal(p.benefits, "fast, clean, responsible");
  });

  it("does not overwrite values the user set explicitly", () => {
    const s = filled();
    s.pyramid = { essence: "Chosen by hand", personality: ["Direct"], benefits: "B", attributes: ["A"] };
    const p = derivePyramid(s);
    assert.equal(p.essence, "Chosen by hand");
    assert.deepEqual(p.attributes, ["A"]);
  });
});

describe("summary", () => {
  it("is generated from the sections and bolds key phrases", () => {
    const parts = generateSummary(filled());
    assert.ok(parts.some((p) => p.strong && p.text.includes("Science-based")));
    assert.ok(summaryText(filled()).includes("deliberately not for bargain hunters"));
  });

  it("is empty when there is nothing to summarise", () => {
    assert.equal(summaryText(EMPTY_STRATEGY), "");
  });

  it("is never persisted — parseStrategy ignores any stored summary", () => {
    const withSummary = JSON.stringify({ ...filled(), summary: "stale text" });
    const parsed = parseStrategy(withSummary) as BrandStrategy & { summary?: string };
    assert.equal(parsed.summary, undefined);
  });
});

describe("parseStrategy", () => {
  it("returns an empty strategy for null rather than throwing", () => {
    assert.deepEqual(parseStrategy(null).core, EMPTY_STRATEGY.core);
  });

  it("keeps legacy prose instead of discarding the user's content", () => {
    const s = parseStrategy("We are a company that sells things.");
    assert.equal(s.core.whoWeAre, "We are a company that sells things.");
  });

  it("fills missing keys from the empty strategy", () => {
    const s = parseStrategy(JSON.stringify({ core: { whoWeAre: "X" } }));
    assert.equal(s.core.whoWeAre, "X");
    assert.equal(s.core.promise, "");
    assert.deepEqual(s.pillars, []);
  });
});

describe("primarySegment", () => {
  it("returns the flagged segment so the AI has one unambiguous audience", () => {
    const s = filled();
    s.audience.unshift({ name: "Second", role: "", isPrimary: false, wants: "", frustratedBy: "", caresAbout: [], channels: [] });
    assert.equal(primarySegment(s)?.name, "Facility manager");
  });
});

describe("strategyPromptContext", () => {
  it("states avoided words as a hard rule the model can act on", () => {
    const ctx = strategyPromptContext(filled());
    assert.ok(ctx.includes("WORDS TO NEVER USE: luxury, revolutionary"));
  });

  it("carries the never-rules with their reasons", () => {
    const ctx = strategyPromptContext(filled());
    assert.ok(ctx.includes("never compete on price"));
    assert.ok(ctx.includes("because it contradicts honestly priced"));
  });

  it("passes proof points as facts to prefer over adjectives", () => {
    const ctx = strategyPromptContext(filled());
    assert.ok(ctx.includes("absorbs in 30 seconds"));
    assert.ok(ctx.includes("prefer these facts over adjectives"));
  });

  it("includes the exclusion, which bounds an otherwise unbounded audience", () => {
    assert.ok(strategyPromptContext(filled()).includes("EXPLICITLY NOT FOR: bargain hunters"));
  });

  it("is empty for an empty strategy, so nothing meaningless is sent", () => {
    assert.equal(strategyPromptContext(EMPTY_STRATEGY), "");
  });
});
