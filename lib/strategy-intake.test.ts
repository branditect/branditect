/**
 * Run with: npm test — "I already have a strategy", the server half.
 *
 * branditect-ui/spec/strategy-in-and-again.md. What these protect:
 *
 *   Part 1, criterion 3 — a field the document does not answer is NEVER
 *   filled. Everything in the first two blocks is that one rule, approached
 *   from the three directions a model gets around it: answering a question
 *   that does not exist, answering with no source, and answering with a
 *   "quote" it wrote itself.
 *
 *   Part 2, criteria 8 and 10 — a redo archives on finish, never on start,
 *   and two current strategies are impossible. The ordering is the feature,
 *   so it is driven here through a fake store that records it.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  keepOnlySourced, dropUnquoted, quoteIsInDocument, intakeCounts,
  answersOf, provenanceOf,
} from "./strategy-intake.ts";
import {
  archiveAndInsert, isMissingColumn, migrationMessage, MIGRATION_FILE,
  type StrategyStore, type StrategyRow, type StoreError,
} from "./strategy-versions.ts";
import { QUESTIONS } from "./onboarding-questions.ts";
import { STRATEGY_FROM_DOCUMENT_STABLE, STRATEGY_EXTRACT_STABLE, STRATEGY_STABLE } from "./prompts.ts";

const ASKABLE = QUESTIONS.filter((q) => q.kind === "text");
const read = (f: string) => readFileSync(f, "utf8");

/** A short strategy deck that answers three questions and no more. */
const FIXTURE = `SORBIFY BRAND STRATEGY 2026

What we sell: absorbent granules for workshops and industrial sites.

Who it is for: independent garages with one to five bays.

We will never claim that our products are food safe, because they are not.

The rest of this document is a list of dates and a budget table.`;

describe("only what the document answers", () => {
  it("drops a question number that does not exist", () => {
    const { found } = keepOnlySourced({ found: [
      { n: 999, answer: "something", quote: "something" },
      { n: ASKABLE[0].n, answer: "absorbent granules", quote: "What we sell: absorbent granules" },
    ] }, ASKABLE);
    assert.deepEqual(found.map((f) => f.n), [ASKABLE[0].n]);
  });

  it("drops an empty answer, and an answer with no quote", () => {
    const { found } = keepOnlySourced({ found: [
      { n: ASKABLE[0].n, answer: "   ", quote: "What we sell: absorbent granules" },
      { n: ASKABLE[1].n, answer: "independent garages", quote: "" },
      { n: ASKABLE[2].n, answer: "independent garages", quote: "Who it is for: independent garages" },
    ] }, ASKABLE);
    assert.deepEqual(found.map((f) => f.n), [ASKABLE[2].n],
      "an answer with no source is a guess wearing an answer's clothes");
  });

  it("uses each question at most once", () => {
    const { found } = keepOnlySourced({ found: [
      { n: ASKABLE[0].n, answer: "first", quote: "What we sell: absorbent granules" },
      { n: ASKABLE[0].n, answer: "second", quote: "Who it is for: independent garages" },
    ] }, ASKABLE);
    assert.equal(found.length, 1);
    assert.equal(found[0].answer, "first");
  });

  it("everything not answered is reported missing, from the questions", () => {
    const e = keepOnlySourced({ found: [
      { n: ASKABLE[0].n, answer: "absorbent granules", quote: "What we sell" },
    ] }, ASKABLE);
    assert.equal(e.missing.length, ASKABLE.length - 1);
    assert.ok(!e.missing.includes(ASKABLE[0].n));
  });

  it("the counts come from the questions, never from the model", () => {
    // A model that claims twelve answers cannot make the screen say twelve.
    const e = keepOnlySourced({ found: [
      { n: ASKABLE[0].n, answer: "a", quote: "What we sell" },
      { n: ASKABLE[1].n, answer: "b", quote: "Who it is for" },
    ], counts: { answered: 12, total: 19 } }, ASKABLE);
    const c = intakeCounts(e, ASKABLE);
    assert.deepEqual(c, { answered: 2, total: ASKABLE.length, remaining: ASKABLE.length - 2 });
  });
});

describe("a quote has to be in the document", () => {
  it("keeps a real sentence", () => {
    assert.ok(quoteIsInDocument("Who it is for: independent garages with one to five bays.", FIXTURE));
  });

  it("keeps one that differs only in spacing, line breaks and curly quotes", () => {
    assert.ok(quoteIsInDocument("Who it is for:\n  independent garages — with one to five bays", FIXTURE));
    assert.ok(quoteIsInDocument("“absorbent granules for workshops”", FIXTURE));
  });

  it("rejects a paraphrase, however close", () => {
    // This is the failure the whole feature turns on: a model that rewrites its
    // own source produces an answer that LOOKS sourced.
    assert.ok(!quoteIsInDocument("It is aimed at small independent garages.", FIXTURE));
  });

  it("rejects a quote too short to mean anything", () => {
    assert.ok(!quoteIsInDocument("for", FIXTURE));
  });

  it("dropUnquoted removes exactly those, and puts them back in missing", () => {
    const shaped = keepOnlySourced({ found: [
      { n: ASKABLE[0].n, answer: "absorbent granules", quote: "absorbent granules for workshops and industrial sites" },
      { n: ASKABLE[1].n, answer: "small garages", quote: "It is aimed at small independent garages." },
    ] }, ASKABLE);
    const { extraction, dropped } = dropUnquoted(shaped, FIXTURE, ASKABLE);
    assert.deepEqual(dropped.map((d) => d.n), [ASKABLE[1].n]);
    assert.deepEqual(extraction.found.map((f) => f.n), [ASKABLE[0].n]);
    assert.ok(extraction.missing.includes(ASKABLE[1].n), "a dropped answer is a question again");
  });
});

describe("a document that answers three questions produces three answers", () => {
  // Spec criterion 3, as a whole flow: the model is generous, the filters are
  // not, and what reaches the founder is three sourced answers and sixteen
  // questions — never nineteen answers with sixteen guesses in them.
  const modelReply = {
    found: [
      { n: 1, answer: "Absorbent granules for workshops and industrial sites", quote: "What we sell: absorbent granules for workshops and industrial sites.", page: 1 },
      { n: 2, answer: "Independent garages with one to five bays", quote: "Who it is for: independent garages with one to five bays.", page: 1 },
      { n: 3, answer: "Never that the products are food safe", quote: "We will never claim that our products are food safe, because they are not.", page: 1 },
      // The three below are what a helpful model adds: plausible, unsourced.
      { n: 4, answer: "Premium pricing", quote: "The document positions the brand at the premium end." },
      { n: 5, answer: "Sustainability is a core value", quote: "Sustainability runs through everything we do." },
      { n: 6, answer: "Founded in 2019 in Helsinki", quote: "" },
    ],
  };

  const shaped = keepOnlySourced(modelReply, ASKABLE);
  const { extraction, dropped } = dropUnquoted(shaped, FIXTURE, ASKABLE);

  it("keeps the three the document states", () => {
    assert.deepEqual(extraction.found.map((f) => f.n), [1, 2, 3]);
  });

  it("drops the invented ones, quote and all", () => {
    assert.equal(dropped.length, 2, "two plausible answers with invented quotes");
    assert.equal(shaped.found.length, 5, "the one with no quote never made it this far");
  });

  it("and the rest stay questions", () => {
    assert.equal(intakeCounts(extraction, ASKABLE).remaining, ASKABLE.length - 3);
    for (const n of [4, 5, 6]) assert.ok(extraction.missing.includes(n), `Q${n} must still be asked`);
  });

  it("what gets saved carries the page and the sentence", () => {
    assert.deepEqual(answersOf(extraction.found)[2], "Independent garages with one to five bays");
    assert.equal(provenanceOf(extraction.found)[2].page, 1);
    assert.match(provenanceOf(extraction.found)[2].quote, /Who it is for/);
  });
});

/* ───────────────────────────────────────────── part 2: archive on finish ── */

/**
 * Records the order of the four writes, and can fail any of them on demand.
 * An override still records its call: what these tests are about is the
 * sequence, so a fake that hid a call would hide the thing under test.
 */
function fakeStore(over: Partial<StrategyStore> & { current?: StrategyRow | null; maxVersion?: number } = {}) {
  const calls: string[] = [];
  const current = over.current === undefined ? null : over.current;
  const step = <T>(name: string, fallback: () => T) => (...args: unknown[]): T => {
    calls.push(name);
    const custom = (over as Record<string, unknown>)[name];
    return typeof custom === "function"
      ? (custom as (...a: unknown[]) => T)(...args)
      : fallback();
  };
  const store: StrategyStore = {
    head: step("head", async () => ({ current, maxVersion: over.maxVersion ?? (current?.version ?? 0) })) as StrategyStore["head"],
    markReplaced: step("markReplaced", async () => ({})) as StrategyStore["markReplaced"],
    insert: step("insert", async () => ({ id: "new-id" })) as StrategyStore["insert"],
    restoreCurrent: step("restoreCurrent", async () => ({})) as StrategyStore["restoreCurrent"],
  };
  return { store, calls };
}

const row = (o: Partial<StrategyRow> = {}): StrategyRow => ({
  id: "old-id", brand_id: "b1", version: 2, is_current: true, replaced_at: null,
  source: "questionnaire", provenance: {}, answers: { "1": "kept" },
  generated_strategy: "{}", source_document_id: null, ...o,
});

describe("a redo archives on finish, never on start", () => {
  it("stands the old row down before inserting, so two current rows are impossible", () => {
    // The partial unique index rejects a second current row, so the order is
    // not a preference: insert-then-archive cannot work at all.
    const { store, calls } = fakeStore({ current: row() });
    return archiveAndInsert(store, {
      brandId: "b1", userId: "u1", answers: { 1: "a" }, provenance: {}, source: "paste",
    }).then((res) => {
      assert.deepEqual(calls, ["head", "markReplaced", "insert"]);
      assert.ok(res.ok && res.version === 3, "the new version follows the highest ever used");
    });
  });

  it("writes nothing to the old row when there is no old row", async () => {
    const { store, calls } = fakeStore({ current: null });
    const res = await archiveAndInsert(store, {
      brandId: "b1", userId: null, answers: { 1: "a" }, provenance: {}, source: "paste",
    });
    assert.deepEqual(calls, ["head", "insert"]);
    assert.ok(res.ok && res.version === 1);
  });

  it("puts the old one back when the insert fails, so a brand is never left with none", async () => {
    const { store, calls } = fakeStore({
      current: row(),
      insert: async () => ({ error: { message: "insert exploded" } }),
    });
    const res = await archiveAndInsert(store, {
      brandId: "b1", userId: null, answers: { 1: "a" }, provenance: {}, source: "paste",
    });
    assert.deepEqual(calls, ["head", "markReplaced", "insert", "restoreCurrent"]);
    assert.ok(!res.ok);
  });

  it("answers are written with string keys, like every other reader expects", async () => {
    let written: Record<string, unknown> | null = null;
    const { store } = fakeStore({
      insert: async (r: Omit<StrategyRow, "id">) => { written = r as unknown as Record<string, unknown>; return { id: "x" }; },
    });
    await archiveAndInsert(store, {
      brandId: "b1", userId: null, answers: { 3: "granules" }, provenance: { 3: { quote: "q", page: 1 } },
      source: "pdf", sourceDocumentId: "doc-1",
    });
    assert.deepEqual((written as unknown as StrategyRow).answers, { "3": "granules" });
    assert.equal((written as unknown as StrategyRow).source, "pdf");
    assert.equal((written as unknown as StrategyRow).source_document_id, "doc-1");
    assert.equal((written as unknown as StrategyRow).is_current, true);
  });
});

describe("the migration that has not been run says so", () => {
  // Three migrations in this repo were written, committed and never run, and
  // each one looked like a broken feature rather than a missing table.
  it("recognises a missing column by code and by message", () => {
    assert.ok(isMissingColumn({ message: "whatever", code: "42703" }));
    assert.ok(isMissingColumn({ message: `column "is_current" does not exist` }));
    assert.ok(!isMissingColumn({ message: "network unreachable" }));
    assert.ok(!isMissingColumn(null));
  });

  it("names the file to run", () => {
    assert.match(migrationMessage(), /strategy-sources-and-versions\.sql/);
    assert.equal(MIGRATION_FILE, "supabase/strategy-sources-and-versions.sql");
  });

  it("and the save reports it as 503 rather than a silent failure", async () => {
    const { store } = fakeStore({
      head: async () => ({ current: null, maxVersion: 0, error: { message: "x", code: "42703" } as StoreError }),
    });
    const res = await archiveAndInsert(store, {
      brandId: "b1", userId: null, answers: { 1: "a" }, provenance: {}, source: "paste",
    });
    assert.ok(!res.ok && res.status === 503 && res.migration);
    assert.match(res.message, /Supabase SQL editor/);
  });

  it("the file itself backfills before it builds the unique index", () => {
    // An existing brand with two strategy rows would otherwise make the index
    // fail, and the whole migration with it.
    const sql = read(MIGRATION_FILE);
    assert.ok(sql.indexOf("UPDATE brand_strategies") < sql.indexOf("brand_strategies_one_current"));
    assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS brand_strategies_one_current[\s\S]*WHERE is_current/);
  });
});

/* ────────────────────────────────────────────── the prompts, and the mode ── */

describe("the document mode does not write a strategy", () => {
  it("forbids inventing, and says empty is the right answer", () => {
    assert.match(STRATEGY_FROM_DOCUMENT_STABLE, /LEAVE IT EMPTY/);
    assert.match(STRATEGY_FROM_DOCUMENT_STABLE, /Never add a fact, a name, a number, a persona, a competitor or a claim/);
    assert.match(STRATEGY_FROM_DOCUMENT_STABLE, /There are NO required counts/);
    assert.ok(!/Fill every field/.test(STRATEGY_FROM_DOCUMENT_STABLE),
      "the questionnaire rule that fills every field has leaked into the document mode");
  });

  it("while the questionnaire mode still builds a whole strategy", () => {
    // The old assertions pinned two literal sentences: "Fill every field with
    // specific content" and "Generate exactly: 2 personas". Both are gone on
    // purpose. "Fill every field" is what made a thin questionnaire produce an
    // invented strategy, and a hard count is what padded a two-competitor
    // market to three. The distinction this suite exists to protect is not
    // those sentences — it is that questionnaire mode SYNTHESISES where
    // document mode may only restructure, so that is what is asserted.
    assert.notEqual(STRATEGY_STABLE, STRATEGY_FROM_DOCUMENT_STABLE);
    assert.ok(!/LEAVE IT EMPTY/.test(STRATEGY_STABLE),
      "the questionnaire prompt has been given the document mode's rules");
    assert.ok(!/There are NO required counts/.test(STRATEGY_STABLE));
    assert.match(STRATEGY_STABLE, /strateg/i, "the questionnaire prompt no longer asks for a strategy");
  });

  it("both describe the same JSON, from one copy", () => {
    const shape = '"messagingPillars": [{"title":"string","text":"1-2 sentences"}]';
    assert.ok(STRATEGY_STABLE.includes(shape) && STRATEGY_FROM_DOCUMENT_STABLE.includes(shape));
    assert.equal((read("lib/prompts.ts").match(/"messagingPillars"/g) ?? []).length, 1,
      "the JSON shape is written twice and the two will drift");
  });

  it("the route picks the mode from the source, not from a guess", () => {
    const src = read("app/api/brand-strategy/route.ts");
    assert.match(src, /const fromDocument = source === "paste" || source === "pdf"/);
    assert.match(src, /cachedSystem\(fromDocument \? STRATEGY_FROM_DOCUMENT_STABLE : STRATEGY_STABLE\)/);
    assert.match(src, /Leave every field the input does not support empty/);
  });
});

describe("the reader is told to quote, and then checked", () => {
  it("the prompt bans inference and requires the sentence", () => {
    assert.match(STRATEGY_EXTRACT_STABLE, /ONLY answer a question the document actually answers/);
    assert.match(STRATEGY_EXTRACT_STABLE, /NEVER infer/);
    assert.match(STRATEGY_EXTRACT_STABLE, /NEVER fill to reach a number/);
    assert.match(STRATEGY_EXTRACT_STABLE, /copied EXACTLY/);
  });

  it("but the route does not take its word for it", () => {
    const src = read("app/api/strategy-extract/route.ts");
    assert.match(src, /keepOnlySourced\(/);
    assert.match(src, /dropUnquoted\(/, "nothing checks the quotes against the document");
    assert.ok(!/from\("brand_strategies"\)/.test(src), "extraction writes a strategy; it must only read");
  });

  it("and saving is a separate, confirmed step", () => {
    // Criterion 2: no answer is written until the founder confirms the review.
    const intake = read("app/api/strategy-intake/route.ts");
    assert.match(intake, /archiveAndInsert\(/);
    assert.match(intake, /resolveBrand\(req\)/);
    assert.match(intake, /merged\[num\]\?\.trim\(\)/, "an intake overwrites an answer somebody typed");
  });
});
