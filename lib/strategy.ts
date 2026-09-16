/**
 * The brand strategy data model, from branditect-ui/spec/strategy.md.
 *
 * Two readers, and every decision here follows from serving both: a person
 * reading the page once to understand the brand, and Branditect itself —
 * Studio ▸ Write, Create images and AI Chat all read these fields.
 */
import { translate, type StringKey, type Vars } from "./i18n/index.ts";
import { isFromDocument, type Provenance, type StrategySource } from "./strategy-intake.ts";

type Tr = (key: StringKey, vars?: Vars) => string;
const EN: Tr = (key, vars) => translate("en", key, vars);

export type Stage = "discovery" | "consideration" | "decision" | "retention";

export const STAGES: Stage[] = ["discovery", "consideration", "decision", "retention"];

export interface Segment {
  name: string;
  age?: number;
  role: string;
  detail?: string;
  isPrimary: boolean;
  wants: string;
  frustratedBy: string;
  caresAbout: string[];
  channels: { label: string; stage: Stage | null }[];
}

export interface Pillar {
  title: string;
  body: string;
  /** A fact with a number in it. An adjective every competitor could claim is not proof. */
  proof: string;
  icon: string;
}

/** stage is null for content migrated from the legacy shape, which had no
 *  funnel tagging. Unassigned is the truth; guessing a stage is not. */
export interface Message { text: string; stage: Stage | null }

export interface Competitor {
  name: string;
  description: string;
  price: string;
  isUs?: boolean;
  /** 0–100. x: accessible → premium. y: consumer → professional. */
  map: { x: number; y: number };
}

/**
 * The working-out, kept.
 *
 * The generator is made to fill this BEFORE it writes a single conclusion, so
 * that every section below can be checked against it. parseStrategy picks keys
 * explicitly, so a shape that is not named here is silently dropped — which is
 * exactly how the old generator's entire output disappeared. Optional because
 * every strategy written before this existed has none.
 */
export interface StrategyAnalysis {
  themes: { theme: string; evidence: string[] }[];
  tensions: { tension: string; why: string }[];
  problemLadder: { functional: string; emotional: string; human: string };
  differentiation: { claim: string; verdict: string; why: string }[];
  whiteSpace: string;
  coreIdea: string;
  unresolved: string[];
}

/**
 * One empty of each list item, for the reader.
 *
 * A strategy is read back from a TEXT column that several generators have
 * written over time, so an item can arrive without a field the document
 * renders. These say what a complete one looks like; parseStrategy fills the
 * gaps from them rather than letting `seg.channels.length` throw.
 */
export const EMPTY_SEGMENT: Segment = {
  name: "", role: "", isPrimary: false, wants: "", frustratedBy: "",
  caresAbout: [], channels: [],
  // Optional, and listed anyway: the reader copies the keys it finds here, so
  // a field left out of this object is a field dropped off every persona.
  age: undefined, detail: undefined,
};
export const EMPTY_COMPETITOR: Competitor = {
  name: "", description: "", price: "", map: { x: 50, y: 50 }, isUs: undefined,
};
export const EMPTY_PILLAR: Pillar = { title: "", body: "", proof: "", icon: "" };

export const EMPTY_ANALYSIS: StrategyAnalysis = {
  themes: [], tensions: [],
  problemLadder: { functional: "", emotional: "", human: "" },
  differentiation: [], whiteSpace: "", coreIdea: "", unresolved: [],
};

export interface BrandStrategy {
  updatedAt: string | null;
  analysis: StrategyAnalysis;
  core: { whoWeAre: string; whatWeDo: string; whyWeExist: string; promise: string };
  positioning: {
    weAre: string; forWhom: string; unlike: string; because: string;
    /** The hero headline. */
    difference: string;
    /** A positioning statement without an exclusion is a description, not a position. */
    notFor: string;
  };
  pyramid: { essence: string; personality: string[]; benefits: string; attributes: string[] };
  /**
   * How the brand writes, in the founder's own description.
   *
   * This used to have no home: Tone of Voice read `voiceDescription` and
   * `voiceDoDont` straight off the generator's output, the document model kept
   * neither, so "Pull from brand strategy" filled a tone with an empty
   * expression and no do/don't pairs. One question feeds this now.
   */
  voice: { description: string; doSay: string[]; dontSay: string[] };
  audience: Segment[];
  competitors: Competitor[];
  pillars: Pillar[];
  messages: { tagline: string; supporting: Message[] };
  principles: { title: string; body: string }[];
  boundaries: {
    never: { rule: string; reason: string }[];
    always: string[];
    wordsUsed: string[];
    wordsAvoided: string[];
    neverCompromise: string[];
  };
  focus: { goal: string; priorities: { label: string; when: string }[] };
}

export const EMPTY_STRATEGY: BrandStrategy = {
  updatedAt: null,
  analysis: EMPTY_ANALYSIS,
  core: { whoWeAre: "", whatWeDo: "", whyWeExist: "", promise: "" },
  positioning: { weAre: "", forWhom: "", unlike: "", because: "", difference: "", notFor: "" },
  pyramid: { essence: "", personality: [], benefits: "", attributes: [] },
  voice: { description: "", doSay: [], dontSay: [] },
  audience: [],
  competitors: [],
  pillars: [],
  messages: { tagline: "", supporting: [] },
  principles: [],
  boundaries: { never: [], always: [], wordsUsed: [], wordsAvoided: [], neverCompromise: [] },
  focus: { goal: "", priorities: [] },
};

/* ── Sections ───────────────────────────────────────────────────────────── */

export interface SectionDef {
  id: keyof BrandStrategy | "core" | "positioning";
  no: string;
  title: string;
  /** The one-line why. It is doing real work: "Boundaries" means nothing on its own. */
  why: string;
  /** What renders. `title` and `why` stay the English. */
  titleKey: StringKey;
  whyKey: StringKey;
  /** Complete: everything this section needs is there. */
  isFilled: (s: BrandStrategy) => boolean;
  /**
   * Anything at all, which is a different question from complete.
   *
   * A strategy read out of a founder's own document fills some sections and
   * not others. A half-filled section must still show what it has — hiding
   * content because it is incomplete would be its own kind of lie — and an
   * empty one must show the questions instead of an example. `isFilled`
   * cannot tell those two apart; this can.
   */
  hasAny: (s: BrandStrategy) => boolean;
}

const has = (v: string | undefined | null) => Boolean(v && v.trim());

export const SECTIONS: SectionDef[] = [
  { id: "core", no: "01", title: "Brand core", why: "The four answers everything else is built on",
    titleKey: "strategyDoc.sec.core", whyKey: "strategyDoc.why.core",
    isFilled: (s) => has(s.core.whoWeAre) && has(s.core.whatWeDo) && has(s.core.whyWeExist) && has(s.core.promise),
    hasAny: (s) => has(s.core.whoWeAre) || has(s.core.whatWeDo) || has(s.core.whyWeExist) || has(s.core.promise) },
  { id: "positioning", no: "02", title: "Positioning", why: "Where you sit, and who you are not for",
    titleKey: "strategyDoc.sec.positioning", whyKey: "strategyDoc.why.positioning",
    isFilled: (s) => has(s.positioning.difference) && has(s.positioning.notFor),
    hasAny: (s) => Object.values(s.positioning).some(has) },
  { id: "audience", no: "03", title: "Audience", why: "Who decides, and where they decide it",
    titleKey: "strategyDoc.sec.audience", whyKey: "strategyDoc.why.audience",
    isFilled: (s) => s.audience.length > 0 && s.audience.some((a) => a.isPrimary),
    hasAny: (s) => s.audience.length > 0 },
  { id: "competitors", no: "04", title: "Competitive landscape", why: "The gap you are standing in",
    titleKey: "strategyDoc.sec.competitors", whyKey: "strategyDoc.why.competitors",
    isFilled: (s) => s.competitors.length > 0,
    hasAny: (s) => s.competitors.length > 0 },
  { id: "pillars", no: "05", title: "What makes us different", why: "Three claims, each with a fact behind it",
    titleKey: "sdoc.different", whyKey: "strategyDoc.why.pillars",
    isFilled: (s) => s.pillars.length > 0 && s.pillars.every((p) => has(p.proof)),
    hasAny: (s) => s.pillars.length > 0 },
  { id: "messages", no: "06", title: "Key messages", why: "What to say, matched to when they hear it",
    titleKey: "strategyDoc.sec.messages", whyKey: "strategyDoc.why.messages",
    isFilled: (s) => has(s.messages.tagline) && s.messages.supporting.length > 0,
    hasAny: (s) => has(s.messages.tagline) || s.messages.supporting.length > 0 },
  // Voice sits with the words, not at the end: it is how everything above is
  // said. Numbering after it shifts by one, which is display only — `id` is
  // what anything stored refers to.
  { id: "voice", no: "07", title: "Voice", why: "How the brand sounds, and the words it will not use",
    titleKey: "strategyDoc.sec.voice", whyKey: "strategyDoc.why.voice",
    isFilled: (s) => has(s.voice.description) && s.voice.doSay.length > 0 && s.voice.dontSay.length > 0,
    hasAny: (s) => has(s.voice.description) || s.voice.doSay.length > 0 || s.voice.dontSay.length > 0 },
  { id: "principles", no: "08", title: "Brand principles", why: "How the brand behaves",
    titleKey: "strategyDoc.sec.principles", whyKey: "strategyDoc.why.principles",
    isFilled: (s) => s.principles.length > 0,
    hasAny: (s) => s.principles.length > 0 },
  { id: "boundaries", no: "09", title: "Boundaries", why: "The section that stops the AI writing the wrong thing",
    titleKey: "strategyDoc.sec.boundaries", whyKey: "strategyDoc.why.boundaries",
    isFilled: (s) => s.boundaries.never.length > 0 && s.boundaries.always.length > 0,
    hasAny: (s) => Object.values(s.boundaries).some((v) => v.length > 0) },
  { id: "focus", no: "10", title: "Strategic focus", why: "What this year is actually for",
    titleKey: "strategyDoc.sec.focus", whyKey: "strategyDoc.why.focus",
    isFilled: (s) => has(s.focus.goal) && s.focus.priorities.length > 0,
    hasAny: (s) => has(s.focus.goal) || s.focus.priorities.length > 0 },
];

/* ── Where a section's content comes from ───────────────────────────────── */

/**
 * The questions behind each section of the document.
 *
 * This exists so an empty section can say WHICH questions would fill it
 * instead of showing an example of what someone else's answer might look
 * like. Numbers are the stable `n` from lib/onboarding-questions.ts and are
 * never renumbered.
 *
 * A question appears under more than one section on purpose: Q7 "what do you
 * do differently" feeds both the positioning line and the pillars, and asking
 * it once fills both.
 */
export type DocSectionId =
  | "core" | "positioning" | "audience" | "competitors" | "pillars"
  | "messages" | "voice" | "principles" | "boundaries" | "focus";

export const SECTION_QUESTIONS: Record<DocSectionId, number[]> = {
  core: [1, 4, 6, 13],
  positioning: [2, 7, 9, 15],
  audience: [11, 12, 14],
  competitors: [9, 10],
  pillars: [7, 8],
  messages: [6, 16],
  // Q18 is the one that asks how the brand talks; Q19 names the words.
  voice: [18, 19],
  principles: [4, 17],
  boundaries: [5, 18, 19],
  focus: [3],
};

/** How this strategy came to exist, and the receipts for each answer. */
export interface StrategyOrigin {
  source: StrategySource;
  provenance: Provenance;
  /** Question numbers that have an answer, however it arrived. */
  answered: number[];
}

/**
 * The questions a section still has no answer to.
 *
 * Read from the answers rather than from the rendered content: a section can
 * look full and still rest on two answers out of four, and the founder is
 * owed the difference.
 */
export function missingQuestionsFor(id: SectionDef["id"], origin: StrategyOrigin | null): number[] {
  const asked = SECTION_QUESTIONS[id as DocSectionId] ?? [];
  if (!origin) return [];
  const answered = new Set(origin.answered);
  return asked.filter((n) => !answered.has(n));
}

/** The sentences this section's content was read out of, in document order. */
export function quotesFor(id: SectionDef["id"], origin: StrategyOrigin | null): { n: number; quote: string; page: number | null }[] {
  if (!origin || !isFromDocument(origin.source)) return [];
  return (SECTION_QUESTIONS[id as DocSectionId] ?? [])
    .map((n) => ({ n, entry: origin.provenance[n] }))
    .filter((x): x is { n: number; entry: { quote: string; page?: number | null } } => Boolean(x.entry?.quote))
    .map((x) => ({ n: x.n, quote: x.entry.quote, page: x.entry.page ?? null }));
}

/** Counts sections, never a percentage, and deliberately unrelated to Brand
 *  Readiness — that is four checks in lib/readiness.ts and stays the only score. */
export function completeness(s: BrandStrategy) {
  const filled = SECTIONS.filter((sec) => sec.isFilled(s));
  return { filled: filled.length, total: SECTIONS.length, label: `${filled.length} of ${SECTIONS.length} sections complete` };
}

/** The hero's Edit button opens the first incomplete section. */
export function firstIncompleteSection(s: BrandStrategy): SectionDef | null {
  return SECTIONS.find((sec) => !sec.isFilled(s)) ?? null;
}

/** Pillars with no proof are surfaced to the user, not hidden. */
export function pillarsMissingProof(s: BrandStrategy): string[] {
  return s.pillars.filter((p) => !has(p.proof)).map((p) => p.title);
}

export function primarySegment(s: BrandStrategy): Segment | null {
  return s.audience.find((a) => a.isPrimary) ?? s.audience[0] ?? null;
}

/* ── Derivations ────────────────────────────────────────────────────────── */

/**
 * The pyramid is derived, never typed twice. Essence comes from the difference
 * statement; attributes from the pillars' proof points. Anything the user has
 * explicitly set wins over the derived value.
 */
export function derivePyramid(s: BrandStrategy): BrandStrategy["pyramid"] {
  const p = s.pyramid;
  return {
    essence: has(p.essence) ? p.essence : s.positioning.difference,
    personality: p.personality.length ? p.personality : s.principles.map((x) => x.title).slice(0, 4),
    benefits: has(p.benefits) ? p.benefits : s.core.promise,
    attributes: p.attributes.length
      ? p.attributes
      : s.pillars.map((x) => x.proof).filter(has).slice(0, 4),
  };
}

/**
 * The summary is generated on read and never stored. A stored one goes stale;
 * an editable one becomes a second, competing truth.
 *
 * Returns segments so the caller can bold the key phrases without parsing
 * markup back out of a string.
 */
export type SummaryPart = { text: string; strong?: boolean };

export function generateSummary(s: BrandStrategy, t: Tr = EN): SummaryPart[] {
  const out: SummaryPart[] = [];
  // Guard on truthiness, not trim: the separators between clauses are single
  // spaces, and a trim guard drops every one of them — "…StandardDeklan…".
  const push = (text: string, strong?: boolean) => { if (text) out.push({ text, strong }); };

  if (has(s.core.whoWeAre)) { push(s.core.whoWeAre, true); push(" "); }
  if (has(s.core.whatWeDo)) { push(s.core.whatWeDo); push(" "); }
  // A sentence with its bold phrase where the language puts it: the key holds
  // {name}, and the text either side of it is pushed plain.
  const around = (key: StringKey, name: string, strong: string) => {
    const [pre, post = ""] = t(key).split(`{${name}}`);
    push(pre); push(strong, true); push(post);
  };
  if (has(s.positioning.difference)) { push(`${t("strategyDoc.sumDifferent")} `); push(s.positioning.difference, true); push(" "); }
  // Fields are written as full sentences by the questionnaire, so trim any
  // trailing stop before adding our own — otherwise the paragraph reads "…results.. ".
  const stop = (t: string) => t.trim().replace(/[.]+$/, "");
  // The model usually writes this field as its own sentence — "Not for
  // consumers, food-grade spill needs…" — and the sentence around it already
  // says "not for", which read: "It is deliberately not for Not for consumers".
  const notFor = stop(s.positioning.notFor).replace(/^not for\s+/i, "");
  if (has(s.positioning.notFor)) { push(`${t("strategyDoc.sumNotFor", { notFor })} `); }
  if (has(s.core.promise)) { around("strategyDoc.sumPromise", "promise", stop(s.core.promise)); push(" "); }

  const proofs = s.pillars.map((p) => p.proof).filter(has);
  if (proofs.length) { around("strategyDoc.sumProof", "proof", proofs.map(stop).join("; ")); push(" "); }

  if (s.principles.length) {
    push(`${t("strategyDoc.sumBehaves", { principles: s.principles.map((p) => p.title.toLowerCase()).join(", ") })} `);
  }
  return out;
}

export function summaryText(s: BrandStrategy): string {
  return generateSummary(s).map((p) => p.text).join("").trim();
}

/* ── Persistence ────────────────────────────────────────────────────────── */

/**
 * `generated_strategy` is a TEXT column that has held two different things over
 * time: prose from the first version, and JSON from later ones. Parse
 * defensively and fall back to empty rather than throwing on a page load.
 */
export function parseStrategy(raw: string | null | undefined, updatedAt?: string | null): BrandStrategy {
  if (!raw) return { ...EMPTY_STRATEGY, updatedAt: updatedAt ?? null };
  try {
    const parsed = JSON.parse(raw) as Partial<BrandStrategy>;
    if (!parsed || typeof parsed !== "object") throw new Error("not an object");
    // Keys are picked explicitly rather than spread. A spread would carry
    // through anything an older writer stored — a `summary` above all, which
    // the spec says must never persist because it goes stale the moment a
    // section below it changes.
    // A spread fills a missing OBJECT but not a missing FIELD INSIDE one: a
    // row whose `boundaries` was written with the old field names merged to an
    // object with no `never` array, and `never.length` in the document threw,
    // and the whole page became "Something went wrong". So every field is taken
    // with its own type or replaced by the empty one. A strategy from an older
    // writer renders with holes, which is what a reader is for.
    const shape = <T extends object>(empty: T, got: unknown): T => {
      if (!got || typeof got !== "object") return { ...empty };
      const src = got as Record<string, unknown>;
      const out = { ...empty } as Record<string, unknown>;
      for (const key of Object.keys(empty)) {
        const want = (empty as Record<string, unknown>)[key];
        const have = src[key];
        if (Array.isArray(want)) out[key] = Array.isArray(have) ? have : want;
        else if (typeof want === "string") out[key] = typeof have === "string" ? have : want;
        else if (want && typeof want === "object") out[key] = shape(want as object, have);
        else if (have !== undefined) out[key] = have;
      }
      return out as T;
    };
    // And the same for the items inside a list: one persona written without
    // `channels` took the page down the same way one renamed boundaries key did.
    const list = <T extends object>(empty: T, got: unknown): T[] =>
      (Array.isArray(got) ? got : []).map((item) => shape(empty, item));

    return {
      updatedAt: updatedAt ?? parsed.updatedAt ?? null,
      analysis: shape(EMPTY_ANALYSIS, parsed.analysis),
      core: shape(EMPTY_STRATEGY.core, parsed.core),
      positioning: shape(EMPTY_STRATEGY.positioning, parsed.positioning),
      pyramid: shape(EMPTY_STRATEGY.pyramid, parsed.pyramid),
      voice: shape(EMPTY_STRATEGY.voice, parsed.voice),
      messages: shape(EMPTY_STRATEGY.messages, parsed.messages),
      boundaries: shape(EMPTY_STRATEGY.boundaries, parsed.boundaries),
      focus: shape(EMPTY_STRATEGY.focus, parsed.focus),
      audience: list(EMPTY_SEGMENT, parsed.audience),
      competitors: list(EMPTY_COMPETITOR, parsed.competitors),
      pillars: list(EMPTY_PILLAR, parsed.pillars),
      principles: list({ title: "", body: "" }, parsed.principles),
    };
  } catch {
    // Legacy prose. Keep it readable rather than discarding the user's content.
    return { ...EMPTY_STRATEGY, updatedAt: updatedAt ?? null, core: { ...EMPTY_STRATEGY.core, whoWeAre: raw.trim() } };
  }
}

/**
 * The block the generation prompts read. Boundaries are the point of this:
 * a model is far better at avoiding a *named* mistake than at inferring taste.
 * "Don't use the word luxury" is enforceable; "be tasteful" is not.
 */
export function strategyPromptContext(s: BrandStrategy): string {
  const L: string[] = [];
  const add = (label: string, value: string) => { if (value.trim()) L.push(`${label}: ${value}`); };

  if (has(s.positioning.difference)) add("WHAT MAKES THIS BRAND DIFFERENT", s.positioning.difference);
  if (has(s.core.promise)) add("THE PROMISE", s.core.promise);
  if (has(s.positioning.notFor)) add("EXPLICITLY NOT FOR", s.positioning.notFor);

  const primary = primarySegment(s);
  if (primary) {
    L.push(`PRIMARY AUDIENCE: ${primary.name}${primary.role ? ` — ${primary.role}` : ""}`);
    add("  They want", primary.wants);
    add("  They are frustrated by", primary.frustratedBy);
  }

  const proofs = s.pillars.filter((p) => has(p.proof));
  if (proofs.length) {
    L.push("PROOF POINTS — prefer these facts over adjectives:");
    proofs.forEach((p) => L.push(`  - ${p.title}: ${p.proof}`));
  }

  const b = s.boundaries;
  if (b.never.length) {
    L.push("NEVER — these are hard constraints, not preferences:");
    b.never.forEach((n) => L.push(`  - ${n.rule}${n.reason ? ` (because ${n.reason})` : ""}`));
  }
  if (b.always.length) { L.push("ALWAYS:"); b.always.forEach((a) => L.push(`  - ${a}`)); }
  if (b.wordsUsed.length) add("WORDS TO USE", b.wordsUsed.join(", "));
  if (b.wordsAvoided.length) {
    L.push(`WORDS TO NEVER USE: ${b.wordsAvoided.join(", ")}`);
  }
  if (b.neverCompromise.length) add("NEVER COMPROMISE ON", b.neverCompromise.join(", "));

  /**
   * THE ANALYSIS IS INPUT, NOT A SECTION.
   *
   * `analysis` is the strategist's working — themes, tensions, the problem
   * ladder, which claims are table stakes, the white space — and the document
   * above is what it concluded. Printing the workings next to the conclusions
   * would make the strategy harder to read and no truer, so it is not in
   * SECTIONS. It is exactly what Andy and Studio need, though: the core idea
   * is the organising thought every draft should hold, and a claim marked
   * "table-stakes" is one no copy should boast about.
   *
   * The one part the founder does see is `unresolved`, at the foot of the
   * document: a conflict the analysis could not settle from their answers is
   * theirs to decide, and hiding it decides it by silence.
   */
  const a = s.analysis;
  if (has(a.coreIdea)) add("THE CORE IDEA — everything should hold this", a.coreIdea);
  if (has(a.whiteSpace)) add("THE SPACE THIS BRAND HOLDS", a.whiteSpace);
  const tableStakes = a.differentiation.filter((d) => /table.?stakes/i.test(d.verdict));
  if (tableStakes.length) {
    L.push("NOT A DIFFERENTIATOR — true, but every competitor says it, so never lead with:");
    tableStakes.forEach((d) => L.push(`  - ${d.claim}`));
  }
  if (has(a.problemLadder.human)) add("WHAT THE CUSTOMER ULTIMATELY WANTS", a.problemLadder.human);

  return L.length ? L.join("\n") : "";
}

/* ── Legacy migration ───────────────────────────────────────────────────── */

/**
 * The shape /brand/strategy stored before the redesign. Kept here rather than
 * in the page so the page can stop declaring its own BrandStrategy.
 */
export interface LegacyStrategy {
  brandName?: string; category?: string; stage?: string; target?: string; archetype?: string;
  passport?: { signature?: string; purpose?: string; promise?: string; philosophy?: string;
               values?: string; insight?: string; targetGroup?: string; onlyWeClaim?: string };
  pyramid?: { essence?: string; behavior?: string; whyChooseUs?: string; audience?: string };
  problems?: { title: string; text: string }[];
  solution?: string;
  firstTo?: { claim?: string; explanation?: string };
  onlyOnesWho?: { claim?: string; explanation?: string };
  differentiators?: { label?: string; title?: string; text?: string }[];
  personas?: { name?: string; role?: string; who?: string; wants?: string;
               frustrations?: string; channels?: string[]; brandGives?: string }[];
  exclusions?: string;
  competitiveIntro?: string;
  competitors?: { name?: string; type?: string; doWell?: string; fail?: string;
                  vsUs?: string; isUs?: boolean }[];
  messagingPillars?: { title?: string; text?: string }[];
  voiceDescription?: string;
  voiceDoDont?: { do: string; dont: string }[];
  alwaysUse?: string[]; neverUse?: string[];
  taglines?: { text?: string; rationale?: string }[];
}

/** A record written before the redesign, recognised by keys the new shape lacks. */
export function isLegacyStrategy(raw: unknown): raw is LegacyStrategy {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  if ("core" in o || "positioning" in o || "boundaries" in o) return false;
  return "brandName" in o || "passport" in o || "differentiators" in o;
}

/**
 * One-way map from the legacy shape onto the spec's.
 *
 * Content carries over; fields the legacy shape never had arrive empty and
 * surface as the spec's section prompts. Nothing is invented — in particular
 * every migrated pillar has an empty `proof`, which is exactly the finding the
 * spec wants shown rather than hidden.
 *
 * Deliberately not carried: voiceDescription and voiceDoDont, which belong to
 * Tone of Voice and have their own route; and risks, opportunities and
 * channelMessages, which the new model has no home for.
 */
export function migrateLegacyStrategy(l: LegacyStrategy, updatedAt?: string | null): BrandStrategy {
  const p = l.passport ?? {};
  const pick = (...v: (string | undefined)[]) => v.find((x) => x && x.trim()) ?? "";

  return {
    updatedAt: updatedAt ?? null,
    // A legacy strategy was written before the method existed, so there is no
    // working-out to carry. Empty is the honest value; inventing one here
    // would make a migrated strategy look reasoned when it was not.
    analysis: EMPTY_ANALYSIS,
    voice: {
      description: pick(l.voiceDescription),
      doSay: (l.voiceDoDont ?? []).map((v) => v?.do ?? "").filter(Boolean),
      dontSay: (l.voiceDoDont ?? []).map((v) => v?.dont ?? "").filter(Boolean),
    },
    core: {
      whoWeAre: pick(p.signature, l.brandName),
      whatWeDo: pick(l.solution),
      whyWeExist: pick(p.purpose),
      promise: pick(p.promise),
    },
    positioning: {
      weAre: pick(l.category),
      forWhom: pick(p.targetGroup, l.target),
      unlike: pick(l.competitiveIntro),
      because: pick(l.firstTo?.explanation, l.onlyOnesWho?.explanation),
      // The hero headline. onlyWeClaim is the closest thing the legacy shape had.
      difference: pick(p.onlyWeClaim, l.onlyOnesWho?.claim, l.firstTo?.claim),
      notFor: pick(l.exclusions),
    },
    pyramid: {
      essence: pick(l.pyramid?.essence),
      personality: [],
      benefits: pick(l.pyramid?.whyChooseUs),
      attributes: [],
    },
    audience: (l.personas ?? []).map((x, i) => ({
      name: pick(x.name),
      role: pick(x.role),
      detail: pick(x.who),
      // Exactly one primary. The legacy shape had no flag, so the first wins.
      isPrimary: i === 0,
      wants: pick(x.wants),
      frustratedBy: pick(x.frustrations),
      caresAbout: x.brandGives ? [x.brandGives] : [],
      channels: (x.channels ?? []).map((c) => ({ label: c, stage: null })),
    })),
    competitors: (l.competitors ?? []).map((c) => ({
      name: pick(c.name),
      description: pick(c.doWell, c.type),
      price: "",
      isUs: Boolean(c.isUs),
      map: { x: 50, y: 50 },
    })),
    pillars: (l.differentiators ?? []).map((d) => ({
      title: pick(d.title, d.label),
      body: pick(d.text),
      proof: "",
      icon: "",
    })),
    messages: {
      tagline: pick(l.taglines?.[0]?.text),
      supporting: (l.messagingPillars ?? []).map((m) => ({
        text: pick(m.text, m.title),
        stage: null,
      })),
    },
    // Not migrated: passport.philosophy and passport.values are prose, and
    // titling them "Philosophy"/"Values" leaked field names straight into the
    // pyramid's Personality tier. Principles are instructions for how the brand
    // behaves; an empty section shows its prompt, which is the honest state.
    principles: [],
    boundaries: {
      never: [],
      always: [],
      wordsUsed: l.alwaysUse ?? [],
      wordsAvoided: l.neverUse ?? [],
      neverCompromise: [],
    },
    focus: { goal: "", priorities: [] },
  };
}

/** Reads either shape. Legacy records are migrated on read and never written back. */
export function readStrategy(raw: string | null | undefined, updatedAt?: string | null): BrandStrategy {
  if (!raw) return { ...EMPTY_STRATEGY, updatedAt: updatedAt ?? null };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isLegacyStrategy(parsed)) return migrateLegacyStrategy(parsed, updatedAt);
  } catch {
    /* fall through to parseStrategy, which handles prose */
  }
  return parseStrategy(raw, updatedAt);
}

/* ── Presentation helpers ───────────────────────────────────────────────── */

/** Truncate on a word boundary. Callers keep the full text for a title attr. */
/**
 * A reason written as its own sentence, dropped into the middle of one.
 *
 * The model writes the never-rule's reason as "It is not certified", and the
 * line renders "Claim food safety — because It is not certified". Only the
 * first word, and only when that word is a sentence opener: lowercasing
 * "Finnish" or "EU" would be worse than the capital.
 */
export function midSentence(text: string): string {
  const t = text.trim().replace(/[.]+$/, "");
  const first = t.split(/\s+/)[0] ?? "";
  return /^(It|This|That|They|We|The|A|An|There|You|Our|Its)$/.test(first)
    ? t[0].toLowerCase() + t.slice(1)
    : t;
}

export function oneLine(text: string, max = 46): string {
  const t = (text ?? "").trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(" ");
  return (at > max * 0.5 ? cut.slice(0, at) : cut).replace(/[,;:.]$/, "") + "…";
}

/**
 * The hero headline is stored as a full sentence and runs to three lines. Cap
 * it and move the remainder into the sub rather than shrinking the type.
 */
export function splitHeadline(text: string, maxWords = 12): { head: string; rest: string } {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return { head: (text ?? "").trim(), rest: "" };
  const head = words.slice(0, maxWords).join(" ").replace(/[,;:]$/, "");
  return { head: head + "…", rest: words.slice(maxWords).join(" ") };
}

/**
 * The 2×2 map is only worth drawing when the points differ. The legacy shape
 * carried no coordinates, so every competitor migrates to 50/50 — plotting that
 * stacks the whole field on one spot with the labels overprinted. An absent map
 * beats a wrong one, and the ladder already carries the ranking.
 */
export function hasUsableMap(competitors: Competitor[]): boolean {
  const pts = competitors.map((c) => `${c.map?.x ?? 50},${c.map?.y ?? 50}`);
  return competitors.length >= 2 && new Set(pts).size >= 2;
}

/** Returns null when there is no figure to read. */
export function parsePrice(price: string): number | null {
  const m = (price ?? "").replace(/[\s,]/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

export function anyPrices(competitors: Competitor[]): boolean {
  return competitors.some((c) => parsePrice(c.price) !== null);
}

/** Cheapest first, own brand kept in the list — the gap is the point. */
export function ladder(competitors: Competitor[]): Competitor[] {
  return [...competitors].sort((a, b) => {
    const pa = parsePrice(a.price), pb = parsePrice(b.price);
    if (pa === null && pb === null) return 0;
    if (pa === null) return 1;
    if (pb === null) return -1;
    return pa - pb;
  });
}
