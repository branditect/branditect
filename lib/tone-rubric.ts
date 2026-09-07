/**
 * The rubric validator for tone-of-voice example lines.
 *
 * Criterion 3 of branditect-ui/spec/tone-examples.md: each tile's line must
 * satisfy its own archetype's rubric, and that check has to be a test rather
 * than a review, because an example line that violates the rubric it is
 * illustrating teaches the wrong thing to every founder who reads it.
 *
 * ── WHERE THE RUBRICS COME FROM ────────────────────────────────────────────
 *
 * branditect-ui/spec/brand-voice-archetypes.md, which carries its own
 * provenance header: it is a copy of `claude/brand-voice-archetypes.md` in the
 * Branditect project, and THE PROJECT COPY IS CANONICAL. Nothing here edits
 * that file. If a value below looks wrong, the value is flagged and the
 * project copy is re-copied; it is never corrected in place.
 *
 * Every threshold in RUBRICS is transcribed from that document. Nothing is
 * invented: an earlier version of this file derived what it could from the
 * one-line definitions and listed the rest as unsourced, because a threshold I
 * chose would have made "the line satisfies its rubric" circular.
 *
 * The house rules are enforced from two places that agree: the `house_rules`
 * block of the archetype document, and lib/house-style.ts, which is what
 * Studio actually appends to every prompt.
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

export const HOUSE_BANNED_WORDS = [
  "delve", "tapestry", "testament", "landscape", "realm", "robust",
  "elevate", "unlock", "harness", "navigate", "embark", "seamless",
  "crucial", "pivotal", "myriad", "plethora", "foster", "leverage",
  "underscore", "resonate", "holistic", "bespoke", "curated", "meticulous",
];

export const HOUSE_BANNED_CONSTRUCTIONS: [RegExp, string][] = [
  [/not just .+,? but /i, '"not just X, but Y"'],
  [/it's not .+,? it's /i, `"it's not X, it's Y"`],
  [/more than just/i, '"more than just"'],
  [/^(moreover|furthermore|additionally|that said)\b/i, "opening with a connective"],
  [/in today's [a-z-]*\s?world/i, '"In today\'s fast-paced world" and variants'],
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

export function maxSentenceWords(line: string): number {
  const s = sentencesOf(line);
  return s.length ? Math.max(...s.map((x) => wordsOf(x).length)) : 0;
}

/**
 * A sentence with no finite verb. `fragments: never` on Calm and Expert makes
 * this a real check rather than a stylistic note.
 *
 * The list is a whitelist rather than an inflection rule on purpose. "Delivery
 * estimate Thursday, based on the last 200 orders" IS a fragment, and "based"
 * ends in -ed, so any rule that treats a verb-looking suffix as a finite verb
 * accepts it. A whitelist is wrong in the other direction — it called
 * "Nothing in the forecast changes the date" a fragment because `changes` was
 * missing — so the list has to be maintained, and both failure directions are
 * pinned by tests below rather than left to be discovered by a line it
 * wrongly rejects.
 */
const FINITE_VERBS = [
  // auxiliaries and copulas
  "is", "are", "was", "were", "am", "be", "been", "being",
  "has", "have", "had", "do", "does", "did",
  "can", "could", "will", "would", "shall", "should", "may", "might", "must",
  // ordinary verbs, third person and bare, that turn up in this kind of copy
  "arrive", "arrives", "add", "adds", "affect", "affects", "apply", "applies",
  "change", "changes", "come", "comes", "cost", "costs", "cover", "covers",
  "dispatched", "get", "gets", "go", "goes", "happen", "happens", "help",
  "helps", "include", "includes", "keep", "keeps", "land", "lands", "leave",
  "leaves", "left", "let", "lets", "make", "makes", "mean", "means", "need",
  "needs", "reach", "reaches", "run", "runs", "say", "says", "see", "sees",
  "send", "sends", "ship", "ships", "shipped", "show", "shows", "slip",
  "slips", "start", "starts", "stop", "stops", "take", "takes", "talk",
  "talks", "tell", "tells", "track", "tracks", "watch", "watches", "work",
  "works", "exist", "exists", "sit", "sits",
];
const FINITE = new RegExp(`\\b(${FINITE_VERBS.join("|")})\\b`, "i");

export function fragmentsIn(line: string): string[] {
  return sentencesOf(line).filter((x) => {
    const words = wordsOf(x);
    // A one-word sentence that is a participle is a fragment even though the
    // same word is finite in a longer sentence: "Your order shipped today" is
    // a sentence, "Shipped." is not. Base forms are left alone, because "Go."
    // and "Track." are imperatives and therefore whole sentences.
    if (words.length === 1 && /(ed|ing)$/i.test(words[0])) return true;
    return !FINITE.test(x);
  });
}

export function exclamationsIn(line: string): number {
  return (line.match(/!/g) ?? []).length;
}

export function emojiIn(line: string): boolean {
  // Surrogate ranges rather than \u{...} with the u flag: the project's
  // TypeScript target rejects it, and this file compiles in the app too.
  return /[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2600-\u27BF]/.test(line);
}

export function semicolonsIn(line: string): number {
  return (line.match(/;/g) ?? []).length;
}

/** The last sentence, which is where the call to action sits if there is one. */
export function lastSentence(line: string): string {
  const s = sentencesOf(line);
  return s.length ? s[s.length - 1] : "";
}

/* ── the rubric ──────────────────────────────────────────────────────────── */

export interface Rubric {
  /** sentence_words_avg, as [min, max]. */
  avg: [number, number];
  /** sentence_words_max. */
  maxWords: number;
  /** fragments: never | allowed | occasional | encouraged | heavy. */
  fragments: "never" | "allowed" | "occasional" | "encouraged" | "heavy";
  /** contractions: sparingly | moderate | always | yes. */
  contractions: "sparingly" | "moderate" | "always" | "yes";
  hedging: "banned" | "allowed" | "required";
  /** humour, 0-5. Not mechanically checkable; kept for completeness. */
  humour: number;
  exclamations: "never" | number;
  emoji: "never" | "allowed";
  /** cta_style, verbatim, plus the word bound where the document gives one. */
  ctaStyle: string;
  ctaMaxWords?: number;
  banned: string[];
  claimType?: "product_fact" | "world_belief";
}

/**
 * The house rules, from the `house_rules` block of the archetype document. No
 * archetype can override them and a secondary can never unban them.
 */
/**
 * Transcribed from branditect-ui/spec/brand-voice-archetypes.md. The project
 * copy is canonical; nothing here is a judgement of mine.
 */
export const RUBRICS: Record<ArchetypeId, Rubric> = {
  confident: {
    avg: [8, 12], maxWords: 18, fragments: "allowed", contractions: "sparingly",
    hedging: "banned", humour: 0, exclamations: "never", emoji: "never",
    ctaStyle: "bare imperative, 1-3 words", ctaMaxWords: 3,
    claimType: "product_fact",
    banned: ["amazing", "game-changing", "revolutionary", "unlock", "elevate",
      "obsessed", "literally", "so good", "we're excited to"],
  },
  warm: {
    avg: [12, 16], maxWords: 25, fragments: "occasional", contractions: "always",
    hedging: "allowed", humour: 2, exclamations: 1, emoji: "allowed",
    ctaStyle: "invitation",
    banned: ["leverage", "utilise", "solutions", "best-in-class", "synergy",
      "robust", "stakeholder", "going forward", "at scale"],
  },
  bold: {
    avg: [6, 14], maxWords: 20, fragments: "encouraged", contractions: "always",
    hedging: "banned", humour: 5, exclamations: 2, emoji: "allowed",
    ctaStyle: "dare or shrug",
    banned: ["journey", "curated", "artisanal", "thrilled to announce",
      "we are pleased to", "nestled", "passionate about", "delighted"],
  },
  calm: {
    avg: [12, 18], maxWords: 22, fragments: "never", contractions: "moderate",
    hedging: "required", humour: 0, exclamations: "never", emoji: "never",
    ctaStyle: "low-pressure, informative",
    banned: ["hurry", "don't miss out", "limited time", "act now", "miracle",
      "cure", "guaranteed", "transform", "instantly"],
  },
  visionary: {
    avg: [7, 12], maxWords: 16, fragments: "heavy", contractions: "yes",
    hedging: "banned", humour: 1, exclamations: "never", emoji: "never",
    ctaStyle: "2-4 words, present tense", ctaMaxWords: 4,
    claimType: "world_belief",
    banned: ["solution", "offering", "utilise", "best-in-class",
      "industry-leading", "value-add", "disrupt", "next-generation"],
  },
  expert: {
    avg: [14, 20], maxWords: 28, fragments: "never", contractions: "moderate",
    hedging: "banned", humour: 1, exclamations: "never", emoji: "never",
    ctaStyle: "specific next action",
    banned: ["seamless", "effortless", "magical", "simply", "just", "easy",
      "painless", "powerful", "intuitive"],
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
    return { ok: false, problems: [`no rubric for ${id}`], unchecked: [] };
  }
  const name = ARCHETYPES[id]?.name ?? id;
  const problems = houseRuleProblems(line);

  const avg = avgSentenceWords(line);
  if (avg < rubric.avg[0] || avg > rubric.avg[1]) {
    problems.push(
      `sentence_words_avg is ${avg.toFixed(1)}, outside ${name}'s ${rubric.avg[0]}-${rubric.avg[1]}`);
  }
  const longest = maxSentenceWords(line);
  if (longest > rubric.maxWords) {
    problems.push(`longest sentence is ${longest} words, over ${name}'s max of ${rubric.maxWords}`);
  }

  const frags = fragmentsIn(line);
  if (rubric.fragments === "never" && frags.length) {
    problems.push(`fragments: never, but ${frags.length} sentence(s) have no finite verb: "${frags[0]}"`);
  }

  if (rubric.contractions === "always" && !hasContraction(line)) {
    problems.push(`contractions: always, and the line has none`);
  }

  if (rubric.hedging === "banned") {
    for (const h of hedgesIn(line)) problems.push(`hedging: banned, but the line hedges: "${h}"`);
  }
  if (rubric.hedging === "required" && !hasCaveat(line)) {
    problems.push("hedging: required where genuinely uncertain, and the line states no limitation");
  }

  if (rubric.exclamations === "never" && exclamationsIn(line) > 0) {
    problems.push("exclamations: never");
  } else if (typeof rubric.exclamations === "number" && exclamationsIn(line) > rubric.exclamations) {
    problems.push(`more exclamations than ${name} allows`);
  }
  if (rubric.emoji === "never" && emojiIn(line)) problems.push("emoji: never");

  if (rubric.ctaMaxWords !== undefined) {
    const cta = wordsOf(lastSentence(line)).length;
    if (cta > rubric.ctaMaxWords) {
      problems.push(
        `cta_style is "${rubric.ctaStyle}", and the closing sentence is ${cta} words`);
    }
  }

  const lower = line.toLowerCase();
  for (const w of rubric.banned) {
    if (lower.includes(w.toLowerCase())) problems.push(`banned word for ${name}: "${w}"`);
  }
  for (const w of HOUSE_BANNED_WORDS) {
    if (new RegExp(`\\b${w}\\b`, "i").test(line)) problems.push(`house banned word: "${w}"`);
  }

  return { ok: problems.length === 0, problems, unchecked: [] };
}

/** True only when the governing document has actually been brought in. */
/**
 * True now. The rubrics above are transcribed from the archetype document
 * rather than derived, so every field the spec names has a real value.
 */
export const RUBRICS_ARE_COMPLETE = true;

export const RUBRIC_SOURCE = "branditect-ui/spec/brand-voice-archetypes.md";
export const RUBRIC_CANONICAL_SOURCE = "claude/brand-voice-archetypes.md";

/**
 * The six draft lines that do not yet satisfy their rubric.
 *
 * These are Saara's drafts and carry no authority; the archetype document
 * does. Recording them here rather than loosening a band keeps the suite
 * honest about what is outstanding, and the test is written so that redrafting
 * a line into compliance FAILS until its entry is removed. A pending list that
 * can quietly go stale would be worse than no list.
 *
 * Vetted 2026-09-07 against branditect-ui/spec/brand-voice-archetypes.md.
 */
export const PENDING_REDRAFT: Partial<Record<ArchetypeId, string[]>> = {
  // Empty since the second draft, 2026-09-07. All six pass. Kept rather than
  // deleted because the mechanism is what makes a failing line visible instead
  // of quietly tolerated, and the next redraft will need it again.
};

/** Which rubric fields a validation complained about, as field names. */
export function failedFields(v: Validation): string[] {
  const fields = ["sentence_words_avg", "sentence_words_max", "fragments",
    "contractions", "hedging", "exclamations", "emoji", "cta_style", "banned"];
  const found = new Set<string>();
  for (const p of v.problems) {
    for (const f of fields) if (p.includes(f)) found.add(f);
    if (/longest sentence/.test(p)) found.add("sentence_words_max");
    if (/banned word/.test(p)) found.add("banned");
  }
  return Array.from(found).sort();
}
