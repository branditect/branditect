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

export interface ReadinessInputs {
  /** true only when every question in the strategy questionnaire is answered */
  questionnaireComplete: boolean;
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
  | 'questionnaire'
  | 'knowledgeFiles'
  | 'brandImages'
  | 'brandGuideline';

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

export type ReadinessBand = 'Starting' | 'Building' | 'Good' | 'Complete';

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

const POINTS_PER_CHECK = 25;

export function computeReadiness(input: ReadinessInputs): Readiness {
  const checks: Check[] = [
    {
      id: 'questionnaire',
      label: 'Strategy questionnaire',
      detail: input.questionnaireComplete
        ? 'All questions answered'
        : 'Not finished yet',
      passed: input.questionnaireComplete,
      points: input.questionnaireComplete ? POINTS_PER_CHECK : 0,
      href: input.questionnaireComplete ? null : '/brand/strategy',
      action: input.questionnaireComplete ? null : 'Continue',
    },
    {
      id: 'knowledgeFiles',
      label: 'Files in Knowledge',
      detail: `${input.knowledgeFileCount} of ${THRESHOLDS.knowledgeFiles} required`,
      passed: input.knowledgeFileCount >= THRESHOLDS.knowledgeFiles,
      points:
        input.knowledgeFileCount >= THRESHOLDS.knowledgeFiles
          ? POINTS_PER_CHECK
          : 0,
      href:
        input.knowledgeFileCount >= THRESHOLDS.knowledgeFiles
          ? null
          : '/knowledge/documents',
      action:
        input.knowledgeFileCount >= THRESHOLDS.knowledgeFiles ? null : 'Upload',
    },
    {
      id: 'brandImages',
      label: 'Product & brand images',
      detail: `${input.brandImageCount} of ${THRESHOLDS.brandImages} required`,
      passed: input.brandImageCount >= THRESHOLDS.brandImages,
      points:
        input.brandImageCount >= THRESHOLDS.brandImages ? POINTS_PER_CHECK : 0,
      href:
        input.brandImageCount >= THRESHOLDS.brandImages
          ? null
          : '/knowledge/images',
      action: input.brandImageCount >= THRESHOLDS.brandImages ? null : 'Upload',
    },
    {
      id: 'brandGuideline',
      label: 'Brand guideline',
      detail: input.hasBrandGuideline ? 'Uploaded' : 'Not uploaded yet',
      passed: input.hasBrandGuideline,
      points: input.hasBrandGuideline ? POINTS_PER_CHECK : 0,
      href: input.hasBrandGuideline ? null : '/brand/visual-identity',
      action: input.hasBrandGuideline ? null : 'Upload',
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
  if (score >= 100) return 'Complete';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Building';
  return 'Starting';
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

/* ------------------------------------------------------------------
   Tests — port to whatever runner the project uses.

   describe('computeReadiness', () => {
     const base: ReadinessInputs = {
       questionnaireComplete: true,
       knowledgeFileCount: 124,
       brandImageCount: 356,
       hasBrandGuideline: false,
     };

     it('scores 75 with three of four passing', () => {
       expect(computeReadiness(base).score).toBe(75);
       expect(computeReadiness(base).band).toBe('Good');
     });

     it('names the first failing check', () => {
       expect(computeReadiness(base).nextAction?.id).toBe('brandGuideline');
     });

     it('reaches 100 and Complete', () => {
       const r = computeReadiness({ ...base, hasBrandGuideline: true });
       expect(r.score).toBe(100);
       expect(r.band).toBe('Complete');
       expect(r.nextAction).toBeNull();
     });

     it('scores 0 for a new workspace', () => {
       expect(computeReadiness({
         questionnaireComplete: false,
         knowledgeFileCount: 0,
         brandImageCount: 0,
         hasBrandGuideline: false,
       }).score).toBe(0);
     });

     it('gives no credit just below a threshold', () => {
       const r = computeReadiness({ ...base, knowledgeFileCount: 5 });
       expect(r.score).toBe(50);
       expect(r.checks.find(c => c.id === 'knowledgeFiles')?.detail)
         .toBe('5 of 6 required');
     });

     it('only ever returns a multiple of 25', () => {
       // exhaustive over the 4 booleans
       for (const q of [true, false])
       for (const k of [0, 6])
       for (const i of [0, 7])
       for (const g of [true, false]) {
         const s = computeReadiness({
           questionnaireComplete: q, knowledgeFileCount: k,
           brandImageCount: i, hasBrandGuideline: g,
         }).score;
         expect(s % 25).toBe(0);
       }
     });
   });
   ------------------------------------------------------------------ */

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
