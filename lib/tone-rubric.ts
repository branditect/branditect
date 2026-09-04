/**
 * The rubric validator for tone-of-voice example lines.
 *
 * Criterion 3 of branditect-ui/spec/tone-examples.md: each tile's line must
 * satisfy its own archetype's rubric, and that check has to be a test rather
 * than a review, because an example line that violates the rubric it is
 * illustrating teaches the wrong thing to every founder who reads it.
 *
 * ── WHAT THIS CAN AND CANNOT CHECK ─────────────────────────────────────────
 *
 * The governing document the spec names — `claude/brand-voice-archetypes.md`,
 * with `sentence_words_avg`, `sentences_per_para`, `fragments`, `contractions`,
 * `person`, `humour`, `hedging`, `jargon_tolerance`, `cta_style`, the
 * banned-word lists and `claim_type` — IS NOT IN THIS REPOSITORY. Nothing in
 * lib/ or branditect-ui/ carries any of those fields.
 *
 * So this file enforces only what can be sourced from what is here:
 *
 *   1. The house rules, in full, from lib/house-style.ts. Those are real and
 *      absolute: no em dash, no markdown, no scaffolding phrases, no stacks of
 *      three adjectives.
 *   2. Per-archetype properties that the one-line definitions in
 *      lib/onboarding-questions.ts actually state. "Few words" is a length
 *      rule. "No hedging" is a banned-word rule. "Leads with the number" means
 *      a numeral must be present. "Tells you the risk" means a caveat must be.
 *   3. Nothing else. Every remaining rubric field is listed in `unsourced` and
 *      reported, never silently passed.
 *
 * A threshold invented here would make "the line satisfies its rubric"
 * circular: I would be authoring both sides. Where the definition says nothing
 * checkable, the field stays unsourced until the governing document lands.
 * That is why validate() distinguishes a pass from an unchecked field, and why
 * a missing rubric is an error rather than a silent success.
 */

import { ARCHETYPES, type ArchetypeId } from "./onboarding-questions.ts";

/* ── measurement ─────────────────────────────────────────────────────────── */

export function sentencesOf(line: string): string[] {
  // Written without a lookbehind on purpose: the project's TypeScript target
  // rejects both lookbehind and unicode property escapes, and this file has to
  // compile in the app as well as run under the test runner.
  const out: string[] = [];
  let current = "";
  for (const ch of line) {
    current += ch;
    if (/[.!?…]/.test(ch)) { out.push(current.trim()); current = ""; }
  }
  if (current.trim()) out.push(current.trim());
  return out.filter(Boolean);
}

export function wordsOf(text: string): string[] {
  // Same constraint: no \p{L}. Accented letters are kept explicitly rather
  // than by property class.
  return text
    .replace(/[^A-Za-z0-9À-ÿ'’\-:]+/g, " ")
    .trim().split(/\s+/).filter(Boolean);
}

export function avgSentenceWords(line: string): number {
  const s = sentencesOf(line);
  if (!s.length) return 0;
  return s.reduce((n, x) => n + wordsOf(x).length, 0) / s.length;
}

/** A sentence with no finite verb reads as a fragment. Deliberately blunt. */
export function hasFragment(line: string): boolean {
  const VERBISH = /\b(is|are|was|were|be|been|being|has|have|had|do|does|did|can|could|will|would|shall|should|may|might|must|arrive|arrives|track|watch|see|go|get|add|send|ship|shipped|dispatched|left|talks|lets)\b|\w+(s|ed|ing)\b/i;
  return sentencesOf(line).some((s) => !VERBISH.test(s));
}

export function hasContraction(line: string): boolean {
  return /\b\w+['’](s|re|ve|ll|d|t|m)\b/i.test(line);
}

export function usesSecondPerson(line: string): boolean {
  return /\b(you|your|yours|you're|you'll)\b/i.test(line);
}

export function hasNumeral(line: string): boolean {
  return /\d/.test(line);
}

const HEDGES = [
  "maybe", "perhaps", "possibly", "probably", "we think", "we believe",
  "sort of", "kind of", "somewhat", "fairly", "quite possibly", "hopefully",
  "should be", "we hope",
];
export function hedgesIn(line: string): string[] {
  const l = line.toLowerCase();
  return HEDGES.filter((h) => l.includes(h));
}

const HYPE = [
  "amazing", "incredible", "revolutionary", "game-changing", "unbeatable",
  "world-class", "best-in-class", "unrivalled", "unrivaled", "magical",
  "stunning", "phenomenal",
];
export function hypeIn(line: string): string[] {
  const l = line.toLowerCase();
  return HYPE.filter((h) => l.includes(h));
}

/** "though weather can add one" — the thing Calm is for. */
export function hasCaveat(line: string): boolean {
  return /\b(though|although|but|unless|if|most|usually|typically|can add|may add|allow for)\b/i.test(line);
}

/* ── house rules, from lib/house-style.ts ────────────────────────────────── */

const SCAFFOLDING = [
  "why it works:", "key benefits:", "here's the thing:",
  "in today's", "in the world of", "not just",
];

export function houseRuleProblems(line: string): string[] {
  const problems: string[] = [];
  if (/[—–]/.test(line)) problems.push("uses an em or en dash, which house style bans outright");
  if (/\*\*|\*[^*]+\*|^#{1,6}\s|^\s*[-•*]\s/m.test(line)) problems.push("contains markdown");
  const l = line.toLowerCase();
  for (const p of SCAFFOLDING) {
    if (l.includes(p)) problems.push(`uses the banned scaffolding phrase "${p}"`);
  }
  // No stacks of three adjectives. Approximated as three comma-separated
  // single words in a row, which is the shape the rule is aimed at.
  if (/\b(\w+),\s*(\w+),\s*(and\s+)?(\w+)\b/.test(line)) {
    const m = line.match(/\b(\w+),\s*(\w+),\s*(and\s+)?(\w+)\b/);
    if (m && [m[1], m[2], m[4]].every((w) => /(ous|ive|ful|able|ible|al|ic|y)$/i.test(w))) {
      problems.push("stacks three adjectives");
    }
  }
  return problems;
}

/* ── the rubric ──────────────────────────────────────────────────────────── */

export interface Rubric {
  /** Upper bound on mean sentence length, where the definition states one. */
  maxAvgSentenceWords?: number;
  /** Words the archetype may never use. */
  banned?: "hedging" | "hype";
  /** Properties the definition requires the line to have. */
  requires?: Array<"numeral" | "caveat" | "secondPerson" | "contraction">;
  /**
   * Rubric fields the spec names that this repo cannot source. Reported on
   * every validation so the gap stays visible.
   */
  unsourced: string[];
}

/** Every field the spec lists, so the gap can be named precisely. */
export const SPEC_RUBRIC_FIELDS = [
  "sentence_words_avg", "sentences_per_para", "fragments", "contractions",
  "person", "humour", "hedging", "jargon_tolerance", "cta_style",
  "banned_words", "claim_type",
];

/**
 * Derived ONLY from the one-line definitions already in
 * lib/onboarding-questions.ts. Each entry cites the words it comes from.
 * Nothing here is a threshold I chose to make a draft line pass.
 */
export const RUBRICS: Record<ArchetypeId, Rubric> = {
  // "Few words. No hedging. Lets the product speak."
  confident: {
    maxAvgSentenceWords: 9,
    banned: "hedging",
    unsourced: ["sentences_per_para", "fragments", "contractions", "person",
      "humour", "jargon_tolerance", "cta_style", "claim_type"],
  },
  // "Talks like a person who likes you."
  warm: {
    requires: ["secondPerson", "contraction"],
    unsourced: ["sentence_words_avg", "sentences_per_para", "fragments",
      "humour", "hedging", "jargon_tolerance", "cta_style", "claim_type"],
  },
  // "Breaks the rules your category takes seriously." Nothing mechanically
  // checkable in that sentence; the whole rubric is unsourced.
  bold: {
    unsourced: [...SPEC_RUBRIC_FIELDS],
  },
  // "Plain, careful, no hype. Tells you the risk."
  calm: {
    banned: "hype",
    requires: ["caveat"],
    unsourced: ["sentence_words_avg", "sentences_per_para", "fragments",
      "contractions", "person", "humour", "jargon_tolerance", "cta_style",
      "claim_type"],
  },
  // "Talks about what becomes possible." Not mechanically checkable without
  // claim_type, which is exactly the field the doc says separates it from
  // Confident.
  visionary: {
    unsourced: [...SPEC_RUBRIC_FIELDS],
  },
  // "Leads with the number. Proof in every sentence."
  expert: {
    requires: ["numeral"],
    banned: "hedging",
    unsourced: ["sentence_words_avg", "sentences_per_para", "fragments",
      "contractions", "person", "humour", "jargon_tolerance", "cta_style",
      "claim_type"],
  },
};

export interface Validation {
  ok: boolean;
  /** Real violations. Any entry here means the line must be rewritten. */
  problems: string[];
  /** Rubric fields that could not be checked, and why. */
  unchecked: string[];
}

/**
 * Validate one line against one archetype.
 *
 * A missing rubric is a problem, never a pass. Returning ok for an archetype
 * nobody wrote a rubric for is how a check reports success on work it never
 * did.
 */
export function validateLine(line: string, id: ArchetypeId): Validation {
  const rubric = RUBRICS[id];
  if (!rubric) {
    return { ok: false, problems: [`no rubric for ${id}`], unchecked: SPEC_RUBRIC_FIELDS };
  }
  const problems = houseRuleProblems(line);
  const name = ARCHETYPES[id]?.name ?? id;

  if (rubric.maxAvgSentenceWords !== undefined) {
    const avg = avgSentenceWords(line);
    if (avg > rubric.maxAvgSentenceWords) {
      problems.push(
        `${name} averages ${avg.toFixed(1)} words a sentence, over its ${rubric.maxAvgSentenceWords}`);
    }
  }
  if (rubric.banned === "hedging") {
    for (const h of hedgesIn(line)) problems.push(`${name} hedges: "${h}"`);
  }
  if (rubric.banned === "hype") {
    for (const h of hypeIn(line)) problems.push(`${name} uses hype: "${h}"`);
  }
  for (const need of rubric.requires ?? []) {
    const met =
      need === "numeral" ? hasNumeral(line)
      : need === "caveat" ? hasCaveat(line)
      : need === "secondPerson" ? usesSecondPerson(line)
      : hasContraction(line);
    if (!met) problems.push(`${name} requires ${need}, and the line has none`);
  }

  return { ok: problems.length === 0, problems, unchecked: rubric.unsourced };
}

/** True only when the governing document has actually been brought in. */
export const RUBRICS_ARE_COMPLETE = Object.values(RUBRICS)
  .every((r) => r.unsourced.length === 0);

export const MISSING_RUBRIC_SOURCE = "claude/brand-voice-archetypes.md";
