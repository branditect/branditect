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
import type { StringKey } from "./i18n/index.ts";
import type { Msg } from "./i18n/msg.ts";

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

/**
 * Every piece of copy on a check is a key, not an English string: What's next
 * and the hero render them in the interface language. `id` is the identity.
 */
export interface Check {
  id: CheckId;
  /** row title in What's next */
  label: StringKey;
  /** row sublabel — states the real number, never filler */
  detail: Msg;
  passed: boolean;
  /** 25 when passed, 0 when not */
  points: number;
  /** where the user goes to close this gap; null when passed */
  href: string | null;
  /** button text; null when passed */
  action: StringKey | null;
}

/** Identity, compared and asserted in English. Rendered through BAND_KEY. */
export type ReadinessBand = "Starting" | "Building" | "Good" | "Complete";

export const BAND_KEY: Record<ReadinessBand, StringKey> = {
  Starting: "readiness.band.starting",
  Building: "readiness.band.building",
  Good: "readiness.band.good",
  Complete: "readiness.band.complete",
};

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

export function questionnaireDetail(answered: number): Msg {
  const total = questionTotal();
  if (answered <= 0) return { key: "readiness.detail.notStarted" };
  if (answered >= total) return { key: "readiness.detail.allAnswered", vars: { total } };
  return { key: "readiness.detail.answeredOf", vars: { answered, total } };
}

const POINTS_PER_CHECK = 25;

export function computeReadiness(input: ReadinessInputs): Readiness {
  const checks: Check[] = [
    {
      id: "questionnaire",
      label: "readiness.check.questionnaire",
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
          ? "readiness.action.start"
          : "common.continue",
    },
    {
      id: "knowledgeFiles",
      label: "readiness.check.knowledgeFiles",
      detail: { key: "readiness.detail.required", vars: { count: input.knowledgeFileCount, required: THRESHOLDS.knowledgeFiles } },
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
        input.knowledgeFileCount >= THRESHOLDS.knowledgeFiles ? null : "ci.upload",
    },
    {
      id: "brandImages",
      label: "readiness.check.brandImages",
      detail: { key: "readiness.detail.required", vars: { count: input.brandImageCount, required: THRESHOLDS.brandImages } },
      passed: input.brandImageCount >= THRESHOLDS.brandImages,
      points:
        input.brandImageCount >= THRESHOLDS.brandImages ? POINTS_PER_CHECK : 0,
      href:
        input.brandImageCount >= THRESHOLDS.brandImages
          ? null
          : "/knowledge/images",
      action: input.brandImageCount >= THRESHOLDS.brandImages ? null : "ci.upload",
    },
    {
      id: "brandGuideline",
      label: "readiness.check.brandGuideline",
      detail: { key: input.hasBrandGuideline ? "readiness.detail.uploaded" : "readiness.detail.notUploaded" },
      passed: input.hasBrandGuideline,
      points: input.hasBrandGuideline ? POINTS_PER_CHECK : 0,
      href: input.hasBrandGuideline ? null : "/brand/visual-identity",
      action: input.hasBrandGuideline ? null : "ci.upload",
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
 *
 * One whole sentence per check and branch. It used to be assembled from the
 * lowercased label and action ("One check left — upload your …"), which only
 * English word order survives.
 */
export function readinessHeadline(r: Readiness): Msg {
  if (!r.nextAction) return { key: "readiness.headline.allDone" };
  const remaining = r.totalCount - r.passedCount;
  const id = r.nextAction.id;
  if (remaining === 1) {
    const key: StringKey = id === "questionnaire"
      ? r.nextAction.action === "readiness.action.start"
        ? "readiness.headline.oneLeft.questionnaireStart"
        : "readiness.headline.oneLeft.questionnaireContinue"
      : ONE_LEFT[id];
    return { key };
  }
  return { key: MANY_LEFT[id], vars: { remaining } };
}

const ONE_LEFT: Record<Exclude<CheckId, "questionnaire">, StringKey> = {
  knowledgeFiles: "readiness.headline.oneLeft.knowledgeFiles",
  brandImages: "readiness.headline.oneLeft.brandImages",
  brandGuideline: "readiness.headline.oneLeft.brandGuideline",
};

const MANY_LEFT: Record<CheckId, StringKey> = {
  questionnaire: "readiness.headline.manyLeft.questionnaire",
  knowledgeFiles: "readiness.headline.manyLeft.knowledgeFiles",
  brandImages: "readiness.headline.manyLeft.brandImages",
  brandGuideline: "readiness.headline.manyLeft.brandGuideline",
};

const DONE_COUNT: StringKey[] = [
  "readiness.copy.done0", "readiness.copy.done1", "readiness.copy.done2", "readiness.copy.done3",
];

const GAP: Record<CheckId, StringKey> = {
  questionnaire: "readiness.copy.gap.questionnaire",
  knowledgeFiles: "readiness.copy.gap.knowledgeFiles",
  brandImages: "readiness.copy.gap.brandImages",
  brandGuideline: "readiness.copy.gap.brandGuideline",
};

/**
 * The line inside the hero, under the score, as the sentences that make it.
 * Two whole sentences rather than one built around a number word: "Zero of 4
 * checks done." and "Your … is the gap …" each translate on their own.
 */
export function readinessCopy(r: Readiness): Msg[] {
  if (!r.nextAction) return [{ key: "readiness.copy.allDone" }];
  return [
    { key: DONE_COUNT[r.passedCount], vars: { totalCount: r.totalCount } },
    { key: GAP[r.nextAction.id] },
  ];
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
