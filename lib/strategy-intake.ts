/**
 * Bringing a strategy you already have, and the shape everything agrees on.
 *
 * branditect-ui/spec/strategy-in-and-again.md, part 1. The rule the whole
 * feature hangs on, in one line:
 *
 *   NEVER FILL A FIELD THE DOCUMENT DOES NOT ANSWER.
 *
 * A strategy deck answers perhaps eight of the nineteen questions. Filling the
 * other eleven from a model is indistinguishable, once saved, from answers the
 * founder wrote — and everything Studio writes afterwards is downstream of
 * them. So extraction returns only what the document actually says, each with
 * the sentence it came from, and the rest stay questions.
 *
 * This module is types and pure functions only: no React, no network, no
 * supabase client, so both the route and the tests can use it.
 */
import { QUESTIONS, type Question } from "./onboarding-questions.ts";

/**
 * How a strategy row came to exist. Stored in brand_strategies.source, which
 * already existed with a CHECK constraint allowing exactly these three — an
 * `ADD COLUMN IF NOT EXISTS source` did nothing, and the first save failed on
 * `brand_strategies_source_check`. The vocabulary is the table's, not ours.
 */
export type StrategySource = "questionnaire" | "paste" | "pdf";

/** The two that mean "read out of something the founder already had". */
export const DOCUMENT_SOURCES: StrategySource[] = ["paste", "pdf"];

export function isFromDocument(source: string | null | undefined): boolean {
  return source === "paste" || source === "pdf";
}

/** One answer the document actually contains. */
export interface ExtractedAnswer {
  /** The question this answers, by its stable `n` (1-20). Never renumbered. */
  n: number;
  /** The answer, in the founder's own words where possible. */
  answer: string;
  /** The sentence it came from, verbatim. Shown beside the answer, not hidden. */
  quote: string;
  /** 1-based page, when the source was a paginated document. */
  page?: number | null;
}

/** What a model is allowed to return from a document. */
export interface Extraction {
  found: ExtractedAnswer[];
  /** Question numbers the document does not answer. Derived, never from the model. */
  missing: number[];
}

/** Per-answer provenance, keyed by question number, as stored in provenance. */
export type Provenance = Record<number, { quote: string; page?: number | null }>;

/**
 * Drop anything the model returned that is not usable.
 *
 * Three ways a model breaks the rule above, all seen in practice: it answers a
 * question that does not exist, it answers with an empty string, or it answers
 * without a quote — which means it inferred rather than read. All three are
 * dropped rather than shown, because a plausible answer with no source is the
 * exact failure this feature exists to avoid.
 */
export function keepOnlySourced(
  raw: unknown,
  questions: Question[] = QUESTIONS,
): Extraction {
  const byNumber = new Map(questions.map((q) => [q.n, q]));
  const seen = new Set<number>();
  const found: ExtractedAnswer[] = [];

  const rows = Array.isArray(raw) ? raw : Array.isArray((raw as { found?: unknown })?.found)
    ? (raw as { found: unknown[] }).found
    : [];

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const n = typeof r.n === "number" ? Math.trunc(r.n) : Number.NaN;
    const answer = typeof r.answer === "string" ? r.answer.trim() : "";
    const quote = typeof r.quote === "string" ? r.quote.trim() : "";
    if (!byNumber.has(n) || seen.has(n) || !answer || !quote) continue;
    const page = typeof r.page === "number" && Number.isFinite(r.page) ? Math.trunc(r.page) : null;
    seen.add(n);
    found.push({ n, answer, quote, page });
  }

  return { found, missing: questions.map((q) => q.n).filter((n) => !seen.has(n)) };
}

/**
 * The quote has to be IN the document, or it is not a quote.
 *
 * A model that paraphrases its own source produces an answer that looks sourced
 * and is not. Compared on letters and digits only, so line breaks, spacing and
 * curly quotes in the extracted text do not fail an honest match.
 */
export function quoteIsInDocument(quote: string, documentText: string): boolean {
  // Letters and digits only, Latin-1 included so ä and ö survive: line breaks,
  // spacing and curly quotes in the extracted text must not fail an honest match.
  const flat = (s: string) => s.toLowerCase().replace(/[^0-9a-z\u00c0-\u024f]+/g, "");
  const q = flat(quote);
  return q.length >= 12 && flat(documentText).includes(q);
}

/** Everything whose quote cannot be found in the source, dropped with its reason. */
export function dropUnquoted(
  extraction: Extraction,
  documentText: string,
  questions: Question[] = QUESTIONS,
): { extraction: Extraction; dropped: ExtractedAnswer[] } {
  const dropped = extraction.found.filter((f) => !quoteIsInDocument(f.quote, documentText));
  if (!dropped.length) return { extraction, dropped };
  const kept = extraction.found.filter((f) => !dropped.includes(f));
  const keptNumbers = new Set(kept.map((f) => f.n));
  return {
    extraction: { found: kept, missing: questions.map((q) => q.n).filter((n) => !keptNumbers.has(n)) },
    dropped,
  };
}

/** What the review screen shows, and what gets written when it is confirmed. */
export function provenanceOf(found: ExtractedAnswer[]): Provenance {
  const out: Provenance = {};
  for (const f of found) out[f.n] = { quote: f.quote, page: f.page ?? null };
  return out;
}

export function answersOf(found: ExtractedAnswer[]): Record<number, string> {
  const out: Record<number, string> = {};
  for (const f of found) out[f.n] = f.answer;
  return out;
}

/**
 * "We read your strategy. 11 of 19 answered."
 *
 * The counts come from the questions, never from the model, so a model that
 * claims twelve cannot make the screen say twelve.
 */
export function intakeCounts(extraction: Extraction, questions: Question[] = QUESTIONS) {
  return {
    answered: extraction.found.length,
    total: questions.length,
    remaining: questions.length - extraction.found.length,
  };
}
