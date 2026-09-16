/**
 * What the reading screen hands the review screen, and where it lives.
 *
 * In the tab, not in the database. branditect-ui/spec/strategy-in-and-again.md
 * is explicit that nothing is written until the founder has read what was
 * found: "an extracted answer the founder never read becomes a positioning
 * they never chose". So the extraction sits in sessionStorage between the two
 * screens and is thrown away if they walk off.
 *
 * The full document text is deliberately NOT carried: the server has already
 * checked every quote against it, and the review screen has no use for it.
 */
import type { ExtractedAnswer } from "@/lib/strategy-intake";

export const INTAKE_HANDOFF = "bd_strategy_intake";

export interface IntakeHandoff {
  found: ExtractedAnswer[];
  missing: number[];
  /** The brand_documents row, when it came from a file. Null for pasted text. */
  documentId: string | null;
  fileName: string | null;
}

export function readHandoff(): IntakeHandoff | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(INTAKE_HANDOFF);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IntakeHandoff;
    if (!Array.isArray(parsed?.found) || !Array.isArray(parsed?.missing)) return null;
    return parsed;
  } catch {
    // A half-written or foreign value is the same as none: send them back to
    // the screen that produces one rather than rendering half a review.
    return null;
  }
}

export function clearHandoff(): void {
  try { sessionStorage.removeItem(INTAKE_HANDOFF); } catch { /* nothing to clear */ }
}
