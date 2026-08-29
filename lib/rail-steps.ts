/**
 * The four-section stepper in the onboarding rail.
 *
 * This is the single thing that answers "where am I". A grey "Question 7 of 20"
 * in the header corner does not, which is why the counts are derived here from
 * SECTIONS and the saved answers rather than from a hard-coded array that goes
 * stale the first time a question moves section.
 *
 * Pure — no React, no client, so the counts can be asserted against a fixture.
 */

import { SECTIONS, type SectionId } from "./onboarding-questions.ts";
import type { OnboardingState } from "./onboarding.ts";

export type StepState = "todo" | "started" | "done" | "active";

export interface StepRow {
  id: SectionId;
  title: string;
  /** 1-based, shown in the bubble until the section is finished. */
  index: number;
  answered: number;
  total: number;
  state: StepState;
  /** "3 of 5 answered", or "5 questions" before anything is written. */
  meta: string;
}

/**
 * Q18 is the voice question and carries no text answer — it counts as answered
 * once a voice is picked, the same rule computeStatus uses.
 */
function isAnswered(state: OnboardingState, n: number): boolean {
  if (n === 18) return Boolean(state.voice?.primary);
  return Boolean(state.answers[n]?.trim());
}

export function answeredInSection(state: OnboardingState, id: SectionId): number {
  const section = SECTIONS.find((s) => s.id === id);
  if (!section) return 0;
  let count = 0;
  for (let n = section.range[0]; n <= section.range[1]; n++) {
    if (isAnswered(state, n)) count++;
  }
  return count;
}

export function sectionOf(n: number): SectionId | null {
  return SECTIONS.find((s) => n >= s.range[0] && n <= s.range[1])?.id ?? null;
}

/** 1-based position of a section, for the "Step 2 of 4" eyebrow. */
export function sectionIndex(id: SectionId | null): number {
  const i = SECTIONS.findIndex((s) => s.id === id);
  return i < 0 ? 0 : i + 1;
}

export function sectionTitle(id: SectionId | null): string {
  return SECTIONS.find((s) => s.id === id)?.title ?? "";
}

export function railSteps(state: OnboardingState, activeSection: SectionId | null = null): StepRow[] {
  return SECTIONS.map((section, i) => {
    const total = section.range[1] - section.range[0] + 1;
    const answered = answeredInSection(state, section.id);

    // Active wins over done: someone rereading a finished section still needs
    // to see where they are standing.
    const stepState: StepState =
      section.id === activeSection ? "active" : answered === total ? "done" : answered > 0 ? "started" : "todo";

    return {
      id: section.id,
      title: section.title,
      index: i + 1,
      answered,
      total,
      state: stepState,
      meta: answered ? `${answered} of ${total} answered` : `${total} questions`,
    };
  });
}

/** Total answered across every section — the number beside "of 20". */
export function answeredTotal(state: OnboardingState): number {
  return railSteps(state).reduce((sum, s) => sum + s.answered, 0);
}

export function questionTotal(): number {
  return SECTIONS.reduce((sum, s) => sum + (s.range[1] - s.range[0] + 1), 0);
}
