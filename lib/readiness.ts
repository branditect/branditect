/**
 * Brand Readiness — the score on the Home hero.
 *
 * Four checks, 25% each. Nothing hidden, nothing weighted.
 *
 * The score is ALWAYS computed from current state. Never store the
 * number — store the inputs. A stored score goes stale the moment
 * someone uploads a file, and a readiness meter that lies is worse
 * than no meter.
 */

import type { Status } from "./onboarding.ts";
import { questionTotal } from "./rail-steps.ts";

export interface ReadinessInputs {
  /** true once the gate is cleared — see questionnairePassed */
  questionnaireComplete: boolean;
  /**
   * How many of the twenty are answered. Drives the row's sublabel: "Not
   * finished yet" tells someone nothing about whether coming back costs four
   * minutes or forty.
   */
  questionnaireAnswered?: number;
  /** total files in Knowledge (documents + presentations + links) */
  knowledgeFileCount: number;
  /** images in Knowledge tagged as product or brand */
  brandImageCount: number;
  /** true when at least one brand guideline document is uploaded */
  hasBrandGuideline: boolean;
}

export const THRESHOLDS = {
  knowledgeFiles: 6,
  brandImages: 7,
} as const;

export type CheckId =
  | "questionnaire"
  | "knowledgeFiles"
  | "brandImages"
  | "brandGuideline";

export interface Check {
  id: CheckId;
  /** row title in What's next */
  label: string;
  /** row sublabel — states the real number, never filler */
  detail: string;
  passed: boolean;
  /** 25 when passed, 0 when not */
  points: number;
  /** where the user goes to close this gap; null when passed */
  href: string | null;
  /** button text; null when passed */
  action: string | null;
}

export type ReadinessBand = "Starting" | "Building" | "Good" | "Complete";

export interface Readiness {
  /** 0 | 25 | 50 | 75 | 100 */
  score: number;
  band: ReadinessBand;
  checks: Check[];
  passedCount: number;
  totalCount: number;
  /** the first failing check — drives the greeting subtitle and the hero copy */
  nextAction: Check | null;
}

/**
 * The questionnaire check ticks at the GATE, not at 20 of 20.
 *
 * If it needed all twenty, someone would clear the gate, open their workspace
 * and see 0% — which reads as broken and is the opposite of the reward the
 * gate exists to give. `gated_complete` is five answers in and fifteen
 * outstanding; that is a finished check.
 *
 * No partial credit inside the check. Equal quarters exist so a founder can
 * predict their score, and a continuous number destroys that.
 */
export function questionnairePassed(status: Status | null | undefined): boolean {
  return status === "gated_complete" || status === "complete";
}

export function questionnaireDetail(answered: number): string {
  const total = questionTotal();
  if (answered <= 0) return "Not started";
  if (answered >= total) return `All ${total} answered`;
  return `${answered} of ${total} answered`;
}

const POINTS_PER_CHECK = 25;

export function computeReadiness(input: ReadinessInputs): Readiness {
  const checks: Check[] = [
    {
      id: "questionnaire",
      label: "Strategy questionnaire",
      // The real count, always. "All questions answered" was a lie at the gate,
      // where five of twenty is a passing check.
      detail: questionnaireDetail(input.questionnaireAnswered ?? 0),
      passed: input.questionnaireComplete,
      points: input.questionnaireComplete ? POINTS_PER_CHECK : 0,
      // /start, not /brand/strategy. That route is the strategy DOCUMENT; the
      // questionnaire lives at /start, and startRouteFor sends a `partial`
      // brand on to /start/resume from there.
      href: input.questionnaireComplete ? null : "/start",
      action: input.questionnaireComplete
        ? null
        : (input.questionnaireAnswered ?? 0) === 0
          ? "Start"
          : "Continue",
    },
    {
      id: "knowledgeFiles",
      label: "Files in Knowledge",
      detail: `${input.knowledgeFileCount} of ${THRESHOLDS.knowledgeFiles} required`,
      passed: input.knowledgeFileCount >= THRESHOLDS.knowledgeFiles,
      points:
        input.knowledgeFileCount >= THRESHOLDS.knowledgeFiles
          ? POINTS_PER_CHECK
          : 0,
      href:
        input.knowledgeFileCount >= THRESHOLDS.knowledgeFiles
          ? null
          : "/knowledge/documents",
      action:
        input.knowledgeFileCount >= THRESHOLDS.knowledgeFiles ? null : "Upload",
    },
    {
      id: "brandImages",
      label: "Product & brand images",
      detail: `${input.brandImageCount} of ${THRESHOLDS.brandImages} required`,
      passed: input.brandImageCount >= THRESHOLDS.brandImages,
      points:
        input.brandImageCount >= THRESHOLDS.brandImages ? POINTS_PER_CHECK : 0,
      href:
        input.brandImageCount >= THRESHOLDS.brandImages
          ? null
          : "/knowledge/images",
      action: input.brandImageCount >= THRESHOLDS.brandImages ? null : "Upload",
    },
    {
      id: "brandGuideline",
      label: "Brand guideline",
      detail: input.hasBrandGuideline ? "Uploaded" : "Not uploaded yet",
      passed: input.hasBrandGuideline,
      points: input.hasBrandGuideline ? POINTS_PER_CHECK : 0,
      href: input.hasBrandGuideline ? null : "/brand/visual-identity",
      action: input.hasBrandGuideline ? null : "Upload",
    },
  ];

  const score = checks.reduce((sum, c) => sum + c.points, 0);
  const passedCount = checks.filter((c) => c.passed).length;

  return {
    score,
    band: bandFor(score),
    checks,
    passedCount,
    totalCount: checks.length,
    nextAction: checks.find((c) => !c.passed) ?? null,
  };
}

export function bandFor(score: number): ReadinessBand {
  if (score >= 100) return "Complete";
  if (score >= 75) return "Good";
  if (score >= 50) return "Building";
  return "Starting";
}

/**
 * The greeting subtitle. Says the diagnosis, never a compliment —
 * "Your brand is strong and getting stronger" tells the user nothing.
 */
export function readinessHeadline(r: Readiness): string {
  if (!r.nextAction) return "Every check is done. Your brand brain is fully trained.";
  const remaining = r.totalCount - r.passedCount;
  const verb = r.nextAction.label.toLowerCase();
  return remaining === 1
    ? `One check left — ${r.nextAction.action?.toLowerCase()} your ${verb} to reach 100%.`
    : `${remaining} checks left — start with your ${verb}.`;
}

/** The line inside the hero, under the score. */
export function readinessCopy(r: Readiness): string {
  if (!r.nextAction) {
    return "All four checks are done. Everything Studio makes is grounded in your brand.";
  }
  const { passedCount, totalCount } = r;
  const words = ["Zero", "One", "Two", "Three", "Four"];
  return `${words[passedCount]} of ${totalCount} checks done. Your ${r.nextAction.label.toLowerCase()} is the gap — closing it is what teaches Branditect the rest.`;
}

/**
 * WHY EQUAL QUARTERS, AND WHY NOT 87%
 *
 * Four binary checks can only produce 0, 25, 50, 75 or 100. The
 * mockups previously showed 87%, which is unreachable — that number
 * was decorative.
 *
 * Partial credit on the two count-based checks (4 of 7 images =
 * 14.3% rather than 0%) would give continuous scores. It was
 * considered and rejected: the bar then creeps upward from
 * uploading almost anything, which weakens the signal. A score a
 * founder can predict is worth more than one that looks precise.
 *
 * If this is revisited, it is a product decision, not an
 * implementation one. Change the spec, not the function.
 *
 * LIKELY FIFTH CHECK: "product costs entered". It is what gates
 * whether Studio can protect margins, and five checks give 20%
 * steps — finer without going continuous. Deliberately not included
 * yet because Numbers has no data model.
 */
