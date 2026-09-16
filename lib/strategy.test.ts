/**
 * Run with: npm test
 *
 * Node's built-in runner with native TypeScript — no framework dependency.
 * Cases follow branditect-ui/spec/strategy.md.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { QUESTIONS } from "./onboarding-questions.ts";
import {
  EMPTY_STRATEGY, SECTIONS, SECTION_QUESTIONS, missingQuestionsFor, quotesFor,
  completeness, firstIncompleteSection,
  pillarsMissingProof, derivePyramid, generateSummary, summaryText,
  parseStrategy, strategyPromptContext, primarySegment,
  isLegacyStrategy, migrateLegacyStrategy, readStrategy,
  oneLine, splitHeadline, hasUsableMap, anyPrices, ladder,
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

describe("migrateLegacyStrategy", () => {
  const legacy = {
    brandName: "Deklan",
    category: "Beauty-Tech Hair Tools",
    passport: { signature: "Deklan makes precision hair tools", purpose: "so styling stops damaging hair",
                promise: "salon results without the heat damage", onlyWeClaim: "the only dryer with plasma ion at 110,000 RPM",
                philosophy: "Design for the everyday", values: "Honest, exacting", targetGroup: "Aspirational optimizers" },
    pyramid: { essence: "Precision", whyChooseUs: "It just works" },
    solution: "Plasma-ion tools",
    exclusions: "salons buying trade equipment",
    differentiators: [{ label: "01", title: "Plasma ion", text: "Neutralises static" }],
    personas: [{ name: "Aspirational Optimizer", role: "Consumer", who: "18-80",
                 wants: "salon results", frustrations: "heat damage",
                 channels: ["Instagram", "TikTok"], brandGives: "confidence" },
               { name: "Second", role: "Pro" }],
    competitors: [{ name: "Dyson", type: "Premium", doWell: "Brand", isUs: false },
                  { name: "Deklan", doWell: "Precision", isUs: true }],
    messagingPillars: [{ title: "Precision", text: "Every degree measured" }],
    taglines: [{ text: "Precision, styled." }, { text: "second" }],
    alwaysUse: ["precise", "considered"],
    neverUse: ["luxury", "revolutionary"],
    voiceDescription: "Warm but exacting",
    voiceDoDont: [{ do: "Be direct", dont: "Never gush" }],
  };

  it("recognises the legacy shape and not the new one", () => {
    assert.ok(isLegacyStrategy(legacy));
    assert.ok(!isLegacyStrategy({ core: {}, positioning: {} }));
    assert.ok(!isLegacyStrategy(null));
  });

  it("puts onlyWeClaim in the hero headline slot", () => {
    const m = migrateLegacyStrategy(legacy);
    assert.equal(m.positioning.difference, "the only dryer with plasma ion at 110,000 RPM");
  });

  it("carries the exclusion, which the new positioning needs", () => {
    assert.equal(migrateLegacyStrategy(legacy).positioning.notFor, "salons buying trade equipment");
  });

  it("leaves every migrated pillar without proof, so the gap is surfaced", () => {
    const m = migrateLegacyStrategy(legacy);
    assert.equal(m.pillars.length, 1);
    assert.equal(m.pillars[0].proof, "");
    assert.deepEqual(pillarsMissingProof(m), ["Plasma ion"]);
  });

  it("flags exactly one primary segment", () => {
    const m = migrateLegacyStrategy(legacy);
    assert.equal(m.audience.filter((a) => a.isPrimary).length, 1);
    assert.equal(primarySegment(m)?.name, "Aspirational Optimizer");
  });

  it("keeps channels but marks them unstaged rather than inventing a stage", () => {
    const m = migrateLegacyStrategy(legacy);
    assert.deepEqual(m.audience[0].channels, [
      { label: "Instagram", stage: null }, { label: "TikTok", stage: null },
    ]);
    assert.equal(m.messages.supporting[0].stage, null);
  });

  it("maps the word lists into boundaries but invents no rules", () => {
    const b = migrateLegacyStrategy(legacy).boundaries;
    assert.deepEqual(b.wordsUsed, ["precise", "considered"]);
    assert.deepEqual(b.wordsAvoided, ["luxury", "revolutionary"]);
    assert.deepEqual(b.never, []);
    assert.deepEqual(b.always, []);
  });

  it("does not carry tone of voice, which has its own route", () => {
    const m = migrateLegacyStrategy(legacy) as unknown as Record<string, unknown>;
    assert.equal(m.voiceDescription, undefined);
    assert.ok(!JSON.stringify(m).includes("Never gush"));
  });

  it("takes only the first tagline", () => {
    assert.equal(migrateLegacyStrategy(legacy).messages.tagline, "Precision, styled.");
  });

  it("readStrategy routes a legacy record through the migration", () => {
    const s = readStrategy(JSON.stringify(legacy), "2026-04-10T15:09:39Z");
    assert.equal(s.positioning.difference, "the only dryer with plasma ion at 110,000 RPM");
    assert.equal(s.updatedAt, "2026-04-10T15:09:39Z");
  });

  it("readStrategy leaves a new-shape record alone", () => {
    const s = readStrategy(JSON.stringify({ core: { whoWeAre: "X" }, positioning: { difference: "D" } }));
    assert.equal(s.core.whoWeAre, "X");
    assert.equal(s.positioning.difference, "D");
  });
});

describe("generateSummary spacing", () => {
  it("keeps the separators between clauses", () => {
    const s = { ...EMPTY_STRATEGY,
      core: { whoWeAre: "Alpha", whatWeDo: "Beta.", whyWeExist: "", promise: "" },
      positioning: { ...EMPTY_STRATEGY.positioning, difference: "Gamma" } };
    const text = summaryText(s);
    assert.ok(!text.includes("AlphaBeta"), `clauses ran together: ${text}`);
    assert.ok(text.startsWith("Alpha Beta."), text);
  });
});

describe("generateSummary punctuation", () => {
  it("does not double the full stop when a field already ends in one", () => {
    const s = { ...EMPTY_STRATEGY,
      positioning: { ...EMPTY_STRATEGY.positioning, notFor: "bargain hunters." },
      core: { ...EMPTY_STRATEGY.core, promise: "salon results at home." } };
    const t = summaryText(s);
    assert.ok(!t.includes(".."), t);
  });
});

describe("presentation helpers", () => {
  it("oneLine truncates on a word boundary, never mid-word", () => {
    const t = oneLine("Rationally, we offer comparable performance to luxury brands at half the price", 40);
    assert.ok(t.length <= 41, t);
    assert.ok(t.endsWith("…"));
    assert.ok(!/\w…$/.test(t.replace(/\s\S*…$/, "")), "cut mid-word");
  });

  it("oneLine leaves short text alone", () => {
    assert.equal(oneLine("Elevated Everyday Beauty", 40), "Elevated Everyday Beauty");
  });

  it("splitHeadline caps the hero and moves the remainder to the sub", () => {
    const long = "Only we deliver 110,000 RPM performance with plasma ion technology at an accessible price point";
    const { head, rest } = splitHeadline(long, 12);
    assert.equal(head.split(/\s+/).length, 12 + 0, head);
    assert.ok(rest.length > 0, "remainder was dropped instead of moved");
    assert.ok(!head.includes(rest.split(" ")[0]));
  });

  it("splitHeadline leaves a short statement whole with no ellipsis", () => {
    const { head, rest } = splitHeadline("We make boots last", 12);
    assert.equal(head, "We make boots last");
    assert.equal(rest, "");
  });

  it("hasUsableMap is false when every competitor migrated to the same point", () => {
    const same = [
      { name: "A", description: "", price: "", map: { x: 50, y: 50 } },
      { name: "B", description: "", price: "", map: { x: 50, y: 50 } },
      { name: "Us", description: "", price: "", isUs: true, map: { x: 50, y: 50 } },
    ];
    assert.equal(hasUsableMap(same), false);
    assert.equal(hasUsableMap([...same.slice(0, 2), { ...same[2], map: { x: 70, y: 30 } }]), true);
  });

  it("hasUsableMap is false with fewer than two competitors", () => {
    assert.equal(hasUsableMap([{ name: "Us", description: "", price: "", map: { x: 10, y: 90 } }]), false);
  });

  it("ladder sorts by price and keeps own brand in the list", () => {
    const c = [
      { name: "Dyson", description: "", price: "€399", map: { x: 50, y: 50 } },
      { name: "Deklan", description: "", price: "€150", isUs: true, map: { x: 50, y: 50 } },
      { name: "Revlon", description: "", price: "€39", map: { x: 50, y: 50 } },
    ];
    assert.deepEqual(ladder(c).map((x) => x.name), ["Revlon", "Deklan", "Dyson"]);
    assert.ok(ladder(c).some((x) => x.isUs));
  });

  it("ladder puts priceless rows last rather than dropping them", () => {
    const c = [
      { name: "NoPrice", description: "", price: "", map: { x: 50, y: 50 } },
      { name: "Cheap", description: "", price: "€10", map: { x: 50, y: 50 } },
    ];
    assert.deepEqual(ladder(c).map((x) => x.name), ["Cheap", "NoPrice"]);
  });

  it("anyPrices is false when the record carried none", () => {
    assert.equal(anyPrices([{ name: "A", description: "", price: "", map: { x: 50, y: 50 } }]), false);
    assert.equal(anyPrices([{ name: "A", description: "", price: "€12.50", map: { x: 50, y: 50 } }]), true);
  });
});

describe("migration no longer leaks field names", () => {
  it("does not turn passport prose into principles named Philosophy/Values", () => {
    const m = migrateLegacyStrategy({ passport: { philosophy: "Design for the everyday", values: "Honest" } });
    assert.deepEqual(m.principles, []);
    assert.ok(!derivePyramid(m).personality.includes("Philosophy"));
  });
});

describe("the strategy document renders from keys", () => {
  it("every section's keys carry its English title and why", async () => {
    const { en } = await import("./i18n/en.ts");
    for (const s of SECTIONS) {
      assert.equal(en[s.titleKey], s.title, s.id);
      assert.equal(en[s.whyKey], s.why, s.id);
    }
  });

  it("the summary reads the same in English and has no English connectors in Finnish", async () => {
    const { translate } = await import("./i18n/index.ts");
    const fiT = (k: Parameters<typeof translate>[1], v?: Parameters<typeof translate>[2]) => translate("fi", k, v);
    const fiText = generateSummary(filled(), fiT).map((p) => p.text).join("");
    assert.ok(!/What makes it different|deliberately not for|The promise is|Proof:|It behaves by/.test(fiText), fiText);
    assert.ok(generateSummary(filled(), fiT).some((p) => p.strong && p.text.includes("Science-based")));
  });
});

/* ── A strategy the founder brought themselves ─────────────────────────────
 *
 * branditect-ui/spec/strategy-in-and-again.md. The rule: a strategy read from
 * a document shows what the document said and nothing else. A section it does
 * not answer stays a question, never an example of someone else's answer.
 */

const read = (f: string) => readFileSync(f, "utf8");
const DOC = "components/strategy/strategy-document.tsx";
const FRESH = "components/strategy/start-fresh.tsx";
const code = (f: string) =>
  read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("every section says which questions would fill it", () => {
  it("names real questions, for every section on the page", () => {
    for (const sec of SECTIONS) {
      const asked = SECTION_QUESTIONS[sec.id as keyof typeof SECTION_QUESTIONS];
      assert.ok(asked?.length, `${sec.id} has no questions behind it`);
      for (const n of asked) {
        assert.ok(QUESTIONS.some((q) => q.n === n), `${sec.id} names question ${n}, which does not exist`);
      }
    }
  });

  it("a question with no answer is still open, whichever row answered it", () => {
    const origin = { source: "document" as const, provenance: {}, answered: [1, 4] };
    // core asks 1, 4, 6 and 13; two are answered, so two remain.
    assert.deepEqual(missingQuestionsFor("core", origin), [6, 13]);
    // Nothing is claimed when there is no strategy row to read.
    assert.deepEqual(missingQuestionsFor("core", null), []);
  });

  it("the quotes shown on a section are the ones it was read from", () => {
    const origin = {
      source: "document" as const,
      answered: [1, 6],
      provenance: { 1: { quote: "We started after a spill.", page: 2 }, 6: { quote: "Absorbent granules.", page: null } },
    };
    assert.deepEqual(quotesFor("core", origin), [
      { n: 1, quote: "We started after a spill.", page: 2 },
      { n: 6, quote: "Absorbent granules.", page: null },
    ]);
    // A questionnaire strategy has no document to quote.
    assert.deepEqual(quotesFor("core", { ...origin, source: "questionnaire" }), []);
  });
});

describe("a document-sourced section is never filled with an example", () => {
  it("hasAny separates empty from incomplete, for every section", () => {
    // isFilled means complete; a half-answered section must still show what it
    // has. Nothing in EMPTY_STRATEGY has content, so nothing claims any.
    for (const sec of SECTIONS) {
      assert.equal(sec.hasAny(EMPTY_STRATEGY), false, `${sec.id} claims content when empty`);
    }
    const f = filled();
    for (const sec of SECTIONS) {
      assert.equal(sec.hasAny(f), true, `${sec.id} finds no content in a filled strategy`);
    }
  });

  it("the document suppresses the example prompts when the section is empty", () => {
    const src = code(DOC);
    assert.match(src, /origin\?\.source === "document" && !def\.hasAny\(strategy\)/,
      "the section does not decide emptiness from the strategy and its source");
    assert.match(src, /\{!empty && children\}/,
      "an empty document-sourced section still renders its example prompt");
    assert.match(src, /<NotAnswered def=\{def\} empty=\{empty\}/);
  });

  it("a questionnaire strategy renders exactly as it did before", () => {
    // The feature must not redesign the questionnaire screen underneath anyone:
    // no "still open" block, no quotes, and its own example prompts intact.
    const src = code(DOC);
    assert.match(src, /origin\?\.source !== "document" \|\| !missing\.length/,
      "the not-answered block is not gated to document-sourced strategies");
  });

  it("and shows the sentence each answer was read from", () => {
    const src = code(DOC);
    assert.match(src, /quotesFor\(def\.id, origin\)/);
    assert.match(src, /t\("strategyDoc\.fromYourDocument"\)/);
  });
});

describe("start fresh says what it touches, and does nothing until it is finished", () => {
  it("carries all three lines", () => {
    const src = read(FRESH);
    for (const key of ["freshStart.replaces", "freshStart.doesNotTouch", "freshStart.staysLive"]) {
      assert.ok(src.includes(`t("${key}")`), `${key} is not on the screen`);
    }
  });

  it("the 'does not touch' line cannot quietly go", () => {
    // Criterion 14. This is the line that makes the difference between "redo my
    // strategy" and "delete my account" legible, and it is the one that would
    // be dropped first in a tidy-up.
    const src = read(FRESH);
    assert.ok(src.includes('t("freshStart.doesNotTouch")'),
      "the line saying what starting fresh does NOT touch has been removed");
  });

  it("offers both ways back in", () => {
    const src = read(FRESH);
    assert.match(src, /href="\/start"/, "no way back to the questionnaire");
    assert.match(src, /href="\/start\/strategy"/, "no way to bring a new document");
  });

  it("writes nothing: starting a redo must change nothing", () => {
    // Criterion 8, a merge blocker. A redo that takes effect on the first click
    // destroys a working strategy for anyone who is interrupted. Both controls
    // are links; the new strategy replaces the old one only when it is finished.
    const src = code(FRESH);
    for (const write of ["supabase", "authedFetch", "authedJson", "fetch(", ".update(", ".insert(", ".delete("]) {
      assert.ok(!src.includes(write), `start fresh calls ${write} — it must only navigate`);
    }
  });

  it("sits under the strategy, not beside Save", () => {
    const page = code("app/(app)/brand/strategy/page.tsx");
    assert.match(page, /footer=\{<StartFresh \/>\}/,
      "start fresh is not rendered at the foot of the document");
  });
});
