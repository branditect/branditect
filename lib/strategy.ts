/**
 * The brand strategy data model, from branditect-ui/spec/strategy.md.
 *
 * Two readers, and every decision here follows from serving both: a person
 * reading the page once to understand the brand, and Branditect itself —
 * Studio ▸ Write, Create images and AI Chat all read these fields.
 */

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

export interface BrandStrategy {
  updatedAt: string | null;
  core: { whoWeAre: string; whatWeDo: string; whyWeExist: string; promise: string };
  positioning: {
    weAre: string; forWhom: string; unlike: string; because: string;
    /** The hero headline. */
    difference: string;
    /** A positioning statement without an exclusion is a description, not a position. */
    notFor: string;
  };
  pyramid: { essence: string; personality: string[]; benefits: string; attributes: string[] };
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
  core: { whoWeAre: "", whatWeDo: "", whyWeExist: "", promise: "" },
  positioning: { weAre: "", forWhom: "", unlike: "", because: "", difference: "", notFor: "" },
  pyramid: { essence: "", personality: [], benefits: "", attributes: [] },
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
  isFilled: (s: BrandStrategy) => boolean;
}

const has = (v: string | undefined | null) => Boolean(v && v.trim());

export const SECTIONS: SectionDef[] = [
  { id: "core", no: "01", title: "Brand core", why: "The four answers everything else is built on",
    isFilled: (s) => has(s.core.whoWeAre) && has(s.core.whatWeDo) && has(s.core.whyWeExist) && has(s.core.promise) },
  { id: "positioning", no: "02", title: "Positioning", why: "Where you sit, and who you are not for",
    isFilled: (s) => has(s.positioning.difference) && has(s.positioning.notFor) },
  { id: "audience", no: "03", title: "Audience", why: "Who decides, and where they decide it",
    isFilled: (s) => s.audience.length > 0 && s.audience.some((a) => a.isPrimary) },
  { id: "competitors", no: "04", title: "Competitive landscape", why: "The gap you are standing in",
    isFilled: (s) => s.competitors.length > 0 },
  { id: "pillars", no: "05", title: "What makes us different", why: "Three claims, each with a fact behind it",
    isFilled: (s) => s.pillars.length > 0 && s.pillars.every((p) => has(p.proof)) },
  { id: "messages", no: "06", title: "Key messages", why: "What to say, matched to when they hear it",
    isFilled: (s) => has(s.messages.tagline) && s.messages.supporting.length > 0 },
  { id: "principles", no: "07", title: "Brand principles", why: "How the brand behaves",
    isFilled: (s) => s.principles.length > 0 },
  { id: "boundaries", no: "08", title: "Boundaries", why: "The section that stops the AI writing the wrong thing",
    isFilled: (s) => s.boundaries.never.length > 0 && s.boundaries.always.length > 0 },
  { id: "focus", no: "09", title: "Strategic focus", why: "What this year is actually for",
    isFilled: (s) => has(s.focus.goal) && s.focus.priorities.length > 0 },
];

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

export function generateSummary(s: BrandStrategy): SummaryPart[] {
  const out: SummaryPart[] = [];
  // Guard on truthiness, not trim: the separators between clauses are single
  // spaces, and a trim guard drops every one of them — "…StandardDeklan…".
  const push = (text: string, strong?: boolean) => { if (text) out.push({ text, strong }); };

  if (has(s.core.whoWeAre)) { push(s.core.whoWeAre, true); push(" "); }
  if (has(s.core.whatWeDo)) { push(s.core.whatWeDo); push(" "); }
  if (has(s.positioning.difference)) { push("What makes it different: "); push(s.positioning.difference, true); push(" "); }
  // Fields are written as full sentences by the questionnaire, so trim any
  // trailing stop before adding our own — otherwise the paragraph reads "…results.. ".
  const stop = (t: string) => t.trim().replace(/[.]+$/, "");
  if (has(s.positioning.notFor)) { push(`It is deliberately not for ${stop(s.positioning.notFor)}. `); }
  if (has(s.core.promise)) { push("The promise is "); push(stop(s.core.promise), true); push(". "); }

  const proofs = s.pillars.map((p) => p.proof).filter(has);
  if (proofs.length) { push("Proof: "); push(proofs.map(stop).join("; "), true); push(". "); }

  if (s.principles.length) {
    push(`It behaves by ${s.principles.map((p) => p.title.toLowerCase()).join(", ")}. `);
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
    return {
      updatedAt: updatedAt ?? parsed.updatedAt ?? null,
      core: { ...EMPTY_STRATEGY.core, ...(parsed.core ?? {}) },
      positioning: { ...EMPTY_STRATEGY.positioning, ...(parsed.positioning ?? {}) },
      pyramid: { ...EMPTY_STRATEGY.pyramid, ...(parsed.pyramid ?? {}) },
      messages: { ...EMPTY_STRATEGY.messages, ...(parsed.messages ?? {}) },
      boundaries: { ...EMPTY_STRATEGY.boundaries, ...(parsed.boundaries ?? {}) },
      focus: { ...EMPTY_STRATEGY.focus, ...(parsed.focus ?? {}) },
      audience: parsed.audience ?? [],
      competitors: parsed.competitors ?? [],
      pillars: parsed.pillars ?? [],
      principles: parsed.principles ?? [],
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
    principles: [
      ...(p.philosophy?.trim() ? [{ title: "Philosophy", body: p.philosophy }] : []),
      ...(p.values?.trim() ? [{ title: "Values", body: p.values }] : []),
    ],
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
