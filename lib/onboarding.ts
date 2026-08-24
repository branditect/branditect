/**
 * Onboarding state — the pure half. Persistence lives in lib/onboarding-store.ts.
 * Rules from branditect-ui/spec/onboarding.md.
 */

import { GATE, QUESTIONS, isGateComplete, type Track, type ArchetypeId } // Explicit extension: Node's native TS runner needs it for the test suite,
// and tsconfig has allowImportingTsExtensions on so the bundler is fine with it.
from "./onboarding-questions.ts";

export type Status = "not_started" | "partial" | "gated_complete" | "complete";

export interface Profile {
  track: Track;
  charge_model: "one-off" | "recurring";
  team_size: "just-me" | "2-3" | "4-10";
}

export interface OnboardingState {
  status: Status;
  profile: Profile | null;
  answers: Record<number, string>;
  skipped: number[];
  voice: { primary: ArchetypeId; secondary: ArchetypeId | null } | null;
  last_question: number;
  /** High-water mark. Going back to reread Q3 must not restart anyone from Q3. */
  furthest_question: number;
  generated: { hero_id: string | null };
}

export const EMPTY_ONBOARDING: OnboardingState = {
  status: "not_started",
  profile: null,
  answers: {},
  skipped: [],
  voice: null,
  last_question: 1,
  furthest_question: 1,
  generated: { hero_id: null },
};

/** Three taps, and the gate needs all three. */
export function isProfileComplete(p: Profile | null): boolean {
  return Boolean(p && p.track && p.charge_model && p.team_size);
}

/** Every question that a person is actually asked. Q19 is generated, not asked. */
const ASKED = QUESTIONS.filter((q) => q.kind !== "antivoice");

export function answeredCount(s: OnboardingState): number {
  return ASKED.filter((q) => (q.kind === "voice" ? Boolean(s.voice?.primary) : Boolean(s.answers[q.n]?.trim()))).length;
}

/**
 * The gate is profile plus GATE ([6, 11, 13, 18]). isGateComplete owns the
 * question half; profile is checked here because it is not a question.
 */
export function isGated(s: OnboardingState): boolean {
  return isProfileComplete(s.profile) && isGateComplete(s.answers, s.voice?.primary ?? null);
}

export function computeStatus(s: OnboardingState): Status {
  const touched = isProfileComplete(s.profile) || Object.values(s.answers).some((a) => a?.trim()) || s.skipped.length > 0;
  if (!touched) return "not_started";
  if (!isGated(s)) return "partial";
  // gated_complete is where most people will live: five in, fifteen outstanding.
  return answeredCount(s) === ASKED.length && s.skipped.length === 0 ? "complete" : "gated_complete";
}

/** Never decreases. */
export function bumpFurthest(s: OnboardingState, n: number): number {
  return Math.max(s.furthest_question, n);
}

export function applyAnswer(s: OnboardingState, n: number, text: string): OnboardingState {
  const next: OnboardingState = {
    ...s,
    answers: { ...s.answers, [n]: text },
    // Answering a skipped question clears the flag — skipped is a state, not a void.
    skipped: text.trim() ? s.skipped.filter((x) => x !== n) : s.skipped,
    last_question: n,
    furthest_question: bumpFurthest(s, n),
  };
  return { ...next, status: computeStatus(next) };
}

export function applySkip(s: OnboardingState, n: number): OnboardingState {
  if (GATE.includes(n)) return s; // Skip is absent on required questions, not disabled.
  const next: OnboardingState = {
    ...s,
    skipped: s.skipped.includes(n) ? s.skipped : [...s.skipped, n],
    last_question: n,
    furthest_question: bumpFurthest(s, n),
  };
  return { ...next, status: computeStatus(next) };
}

export function applyProfile(s: OnboardingState, profile: Profile): OnboardingState {
  const next = { ...s, profile };
  return { ...next, status: computeStatus(next) };
}

export function applyVoice(s: OnboardingState, primary: ArchetypeId, secondary: ArchetypeId | null = null): OnboardingState {
  const next = { ...s, voice: { primary, secondary }, furthest_question: bumpFurthest(s, 18) };
  return { ...next, status: computeStatus(next) };
}

/** Resume goes to the high-water mark, not the last screen looked at. */
export function resumeQuestion(s: OnboardingState): number {
  return Math.max(1, s.furthest_question);
}

/** The row shape written to `onboarding`. One row per brand. */
export interface OnboardingRow {
  brand_id: string;
  user_id: string | null;
  profile: Profile | null;
  answers: Record<number, string>;
  skipped: number[];
  voice: { primary: ArchetypeId; secondary: ArchetypeId | null } | null;
  last_question: number;
  furthest_question: number;
  status: Status;
  updated_at: string;
}

export function toRow(s: OnboardingState, brandId: string, userId: string | null): OnboardingRow {
  return {
    brand_id: brandId,
    user_id: userId,
    profile: s.profile,
    answers: s.answers,
    skipped: s.skipped,
    voice: s.voice,
    last_question: s.last_question,
    furthest_question: s.furthest_question,
    status: s.status,
    updated_at: new Date().toISOString(),
  };
}

export function fromRow(row: Partial<OnboardingRow> | null | undefined): OnboardingState {
  if (!row) return { ...EMPTY_ONBOARDING };
  const s: OnboardingState = {
    ...EMPTY_ONBOARDING,
    profile: row.profile ?? null,
    answers: row.answers ?? {},
    skipped: row.skipped ?? [],
    voice: row.voice ?? null,
    last_question: row.last_question ?? 1,
    furthest_question: Math.max(row.furthest_question ?? 1, row.last_question ?? 1),
  };
  return { ...s, status: row.status ?? computeStatus(s) };
}

/**
 * Merge a local mirror over a server row. The server is the truth, but a mirror
 * that is ahead means a write never landed — so the higher water mark and any
 * answers the server lacks win.
 */
export function mergeState(server: OnboardingState, local: OnboardingState | null): OnboardingState {
  if (!local) return server;
  const merged: OnboardingState = {
    ...server,
    answers: { ...server.answers, ...local.answers },
    skipped: Array.from(new Set([...server.skipped, ...local.skipped])),
    profile: server.profile ?? local.profile,
    voice: server.voice ?? local.voice,
    furthest_question: Math.max(server.furthest_question, local.furthest_question),
    last_question: Math.max(server.last_question, local.last_question),
  };
  return { ...merged, status: computeStatus(merged) };
}
