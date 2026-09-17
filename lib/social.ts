/**
 * The social media plan: what it is made of, and what can be derived without
 * asking a model anything.
 *
 * Brand ▸ Channels asked five questions and then said "the synthesis layer
 * ships in step 2". The answers were stored and nothing was ever made from
 * them, so the page could be completed and still produce nothing to post.
 *
 * The five questions now are: which channels (two at most), what social is
 * for, how often you can post, which content pillars, and who you are talking
 * to. The last two are brainstorms rather than blanks — the brand strategy
 * already names the pillars and the people, so the page suggests them and the
 * founder edits, removes and adds.
 *
 * Pure, and tested. The model call lives in the route.
 */
import type { BrandStrategy } from "./strategy.ts";
import type { StringKey } from "./i18n/index.ts";

/* ── channels ──────────────────────────────────────────────────────────── */

/**
 * Two, not five.
 *
 * A founder who can post three times a week and picks five platforms is
 * posting to each one every other week, which is the same as not being on any
 * of them. The cap is the advice.
 */
export const MAX_CHANNELS = 2;

export const CHANNELS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
  { id: "youtube", label: "YouTube" },
  { id: "pinterest", label: "Pinterest" },
  { id: "reddit", label: "Reddit" },
  { id: "x", label: "X" },
] as const;

export type ChannelId = (typeof CHANNELS)[number]["id"];

export function channelLabel(id: string): string {
  return CHANNELS.find((c) => c.id === id)?.label ?? id;
}

/** Names are not translated — a platform is called the same thing in Finnish. */
export function isChannel(id: string): boolean {
  return CHANNELS.some((c) => c.id === id);
}

/* ── how often ─────────────────────────────────────────────────────────── */

/** Posts per week, as a range with a number the plan can actually use. */
export const CADENCES = [
  { id: "1", perWeek: 1, labelKey: "social.cadence.1" as StringKey },
  { id: "2-3", perWeek: 3, labelKey: "social.cadence.2to3" as StringKey },
  { id: "4-5", perWeek: 5, labelKey: "social.cadence.4to5" as StringKey },
  { id: "daily", perWeek: 7, labelKey: "social.cadence.daily" as StringKey },
] as const;

export type CadenceId = (typeof CADENCES)[number]["id"];

/** How many posts a week to plan for. Unknown or missing is a careful 3. */
export function postsPerWeek(cadence: string | null | undefined): number {
  return CADENCES.find((c) => c.id === cadence)?.perWeek ?? 3;
}

/* ── the two brainstorms ───────────────────────────────────────────────── */

export interface Pillar {
  /** 2-4 words. "Tested, not claimed". */
  name: string;
  /** Why this brand can hold it, one line. */
  why: string;
  /** Things to actually post under it. The brainstorm lives here. */
  subjects: string[];
  /** True when the founder typed it rather than accepting a suggestion. */
  added?: boolean;
}

export interface AudienceProfile {
  name: string;
  /** Their job or situation. */
  role: string;
  /** What they want, in their words rather than the brand's. */
  wants: string;
  /** Where they already are — not where the brand wishes they were. */
  whereTheyAre: string;
  added?: boolean;
}

const has = (v: string | null | undefined): v is string => Boolean(v && v.trim());

/**
 * Pillars suggested from the strategy, with nothing invented.
 *
 * Every suggestion here is a field the founder already wrote or approved: the
 * strategy's own pillars first, then the promise, then what this year is for.
 * Nothing is phrased for them — a suggestion they have to rewrite is worse
 * than a blank field, and a suggestion they accept without reading is worse
 * than both.
 */
export function suggestPillars(s: BrandStrategy | null): Pillar[] {
  if (!s) return [];
  const out: Pillar[] = [];
  const push = (name: string, why: string, subjects: string[] = []) => {
    if (!has(name) || out.some((p) => p.name.toLowerCase() === name.trim().toLowerCase())) return;
    out.push({ name: name.trim(), why: why.trim(), subjects: subjects.filter(has) });
  };

  // The strategy's own pillars first: they were written to be talked about.
  for (const pillar of s.pillars) {
    push(pillar.title, pillar.body, [pillar.proof]);
  }
  // Then the two things a brand can say every week without repeating itself:
  // what it promises, and what this year is for.
  if (has(s.core.promise)) push(s.core.promise, s.positioning.difference, []);
  if (has(s.focus.goal)) push(s.focus.goal, s.positioning.because, []);
  // What is NOT suggested: `unlike`, which is a competitor's name — "Sawdust"
  // is not a content pillar — and the word lists, which are vocabulary rather
  // than subjects. Both read as pillars in a list and neither is one.
  return out.slice(0, 6);
}

/**
 * The people, taken from the strategy's audience section.
 *
 * `whereTheyAre` comes from the segment's own channels when the strategy names
 * them, and is left empty otherwise rather than guessed: "on LinkedIn" is a
 * claim about a real person, and the founder is the one who knows.
 */
export function suggestAudience(s: BrandStrategy | null): AudienceProfile[] {
  if (!s) return [];
  return s.audience
    .filter((seg) => has(seg.name) || has(seg.role))
    .map((seg) => ({
      name: seg.name || seg.role,
      role: [seg.role, seg.detail].filter(has).join(" · "),
      wants: seg.wants || "",
      whereTheyAre: (seg.channels ?? []).map((c) => c.label).filter(has).join(", "),
    }));
}

/* ── the plan ──────────────────────────────────────────────────────────── */

export interface PlannedPost {
  /** Monday…Sunday, as the model wrote it. Rendered as given. */
  day: string;
  channel: string;
  /** The pillar this post belongs to, by name. */
  pillar: string;
  /** What it is about, one line. */
  subject: string;
  /** The post itself, ready to edit. */
  copy: string;
  /** The first line, called out because it is the part that decides. */
  hook: string;
}

export interface SocialPlan {
  /** One or two sentences: the shape of the week and why. */
  summary: string;
  postsPerWeek: number;
  channels: string[];
  /** Pillar name → how many posts a week it should carry. */
  mix: { pillar: string; share: string }[];
  week: PlannedPost[];
  /** What to stop doing, in this brand's words. Optional. */
  avoid: string[];
}

export const EMPTY_PLAN: SocialPlan = {
  summary: "", postsPerWeek: 0, channels: [], mix: [], week: [], avoid: [],
};

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/**
 * What the model returned, made safe to render.
 *
 * Same rule as the brand strategy document: keys are picked by name and a
 * missing one renders as a hole, never as a crash. A plan is thrown away and
 * regenerated all the time, so being strict here would cost a minute of the
 * model's time for a field nobody needed.
 */
export function parsePlan(raw: string | null | undefined): SocialPlan | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    const cleaned = String(raw).replace(/^```(?:json)?/gm, "").replace(/```$/gm, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;

  const week: PlannedPost[] = list(p.week).map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      day: str(row.day), channel: str(row.channel), pillar: str(row.pillar),
      subject: str(row.subject), copy: str(row.copy), hook: str(row.hook),
    };
  }).filter((post) => post.copy || post.subject);

  return {
    summary: str(p.summary),
    postsPerWeek: typeof p.postsPerWeek === "number" ? p.postsPerWeek : week.length,
    channels: list(p.channels).map(str).filter(Boolean),
    mix: list(p.mix).map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return { pillar: str(row.pillar), share: str(row.share) };
    }).filter((m) => m.pillar),
    week,
    avoid: list(p.avoid).map(str).filter(Boolean),
  };
}

/**
 * Whether to print the hook on its own line above the post.
 *
 * The hook IS the first line of the post — that is what a hook is — so a plan
 * that writes it into both fields renders the same sentence twice, once
 * labelled and once not. Shown only when the copy does not already open with
 * it, because when it does not, the hook is the thing worth seeing first.
 */
export function showHook(hook: string, copy: string): boolean {
  const h = hook.trim().toLowerCase();
  if (!h) return false;
  return !copy.trim().toLowerCase().startsWith(h);
}

/** Enough of a plan to show. An empty week is a failed generation, not a plan. */
export function planIsUsable(plan: SocialPlan | null): boolean {
  return Boolean(plan && plan.week.length > 0);
}

/* ── metrics ───────────────────────────────────────────────────────────── */

export interface WeekMetrics {
  week_start: string;
  channel: string;
  posts: number | null;
  followers: number | null;
  reach: number | null;
  engagements: number | null;
  note?: string | null;
}

/** The Monday of the week a date falls in, as YYYY-MM-DD. */
export function weekStart(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // getUTCDay: 0 is Sunday. Monday-first, so Sunday belongs to the week before.
  const shift = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - shift);
  return d.toISOString().slice(0, 10);
}

/**
 * The change from one week to the one before it, per field.
 *
 * Returned as a number, not a string with an arrow in it: the page decides how
 * to render a fall, and "+0" and "no data yet" are different things — a field
 * that was not filled in last week returns null rather than a 100% rise.
 */
export function weekOnWeek(
  current: WeekMetrics | null | undefined,
  previous: WeekMetrics | null | undefined,
): Record<"posts" | "followers" | "reach" | "engagements", number | null> {
  const delta = (a: number | null | undefined, b: number | null | undefined) =>
    typeof a === "number" && typeof b === "number" ? a - b : null;
  return {
    posts: delta(current?.posts, previous?.posts),
    followers: delta(current?.followers, previous?.followers),
    reach: delta(current?.reach, previous?.reach),
    engagements: delta(current?.engagements, previous?.engagements),
  };
}
