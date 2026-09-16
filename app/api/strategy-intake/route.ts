/**
 * Saving a strategy the founder brought, after they have reviewed it.
 *
 * branditect-ui/spec/strategy-in-and-again.md, criterion 2: nothing is written
 * to brand_strategies until the review is confirmed. So /api/strategy-extract
 * reads and returns, and this route is the confirmation — it is the only place
 * an extracted answer becomes the brand's.
 *
 * TWO WRITES, AND BOTH MATTER.
 *
 *   1. brand_strategies, as a new version. The old one is archived in the same
 *      call, never earlier: see lib/strategy-versions.ts.
 *   2. the onboarding row, so /start knows these eleven are answered and asks
 *      only the other eight. Without this the founder is handed nineteen
 *      questions again and the feature has done nothing for them.
 *
 * AN INTAKE NEVER OVERWRITES AN ANSWER SOMEBODY TYPED. Extracted answers fill
 * blanks only. A founder who answered six questions and then uploaded a deck
 * keeps their six words for word, and the deck fills what it can around them.
 */
import { NextRequest, NextResponse } from "next/server";
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";
import { QUESTIONS } from "@/lib/onboarding-questions";
import { fromRow, toRow, computeStatus, type OnboardingState } from "@/lib/onboarding";
import {
  archiveAndInsert, supabaseStrategyStore, isMissingColumn, migrationMessage,
} from "@/lib/strategy-versions";
import type { Provenance } from "@/lib/strategy-intake";

export const dynamic = "force-dynamic";

const ASKABLE_NUMBERS = QUESTIONS.filter((q) => q.kind === "text").map((q) => q.n);
const ASKABLE = new Set(ASKABLE_NUMBERS);

export async function POST(req: NextRequest) {
  const auth = await resolveBrand(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  let body: {
    answers?: Record<string, string>;
    provenance?: Provenance;
    sourceDocumentId?: string | null;
    source?: string;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  // Only real questions, only real answers. A number that is not a question,
  // or an empty string, is dropped rather than stored: the row this writes is
  // what Studio reads for the rest of the brand's life.
  const answers: Record<number, string> = {};
  for (const [key, value] of Object.entries(body.answers ?? {})) {
    const n = Number(key);
    if (!Number.isInteger(n) || !ASKABLE.has(n)) continue;
    const text = typeof value === "string" ? value.trim() : "";
    if (text) answers[n] = text;
  }
  if (!Object.keys(answers).length) {
    return NextResponse.json(
      { error: "There is nothing to save.", errorKey: "intake.nothingToSave" },
      { status: 400 },
    );
  }

  const provenance: Provenance = {};
  for (const [key, value] of Object.entries(body.provenance ?? {})) {
    const n = Number(key);
    if (!Number.isInteger(n) || !(n in answers)) continue;
    const quote = typeof value?.quote === "string" ? value.quote.trim() : "";
    if (quote) provenance[n] = { quote, page: typeof value?.page === "number" ? value.page : null };
  }

  // The document is the caller's, or it is not referenced. An id from the body
  // is otherwise a way to point your strategy at somebody else's file.
  /**
   * The table's own vocabulary: questionnaire | paste | pdf, enforced by
   * brand_strategies_source_check. "document" was rejected outright, so a
   * pasted strategy is "paste" and an uploaded file is "pdf". Anything else
   * the client sends is refused here rather than by a 500 from Postgres.
   */
  const docSource: "paste" | "pdf" = body.source === "pdf" || body.sourceDocumentId ? "pdf" : "paste";

  let sourceDocumentId: string | null = null;
  if (body.sourceDocumentId) {
    const { data: doc } = await supabase
      .from("brand_documents").select("id")
      .eq("id", body.sourceDocumentId).eq("brand_id", auth.brandId).maybeSingle();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    sourceDocumentId = doc.id;
  }

  const saved = await archiveAndInsert(supabaseStrategyStore(supabase), {
    brandId: auth.brandId,
    userId: auth.userId,
    answers,
    provenance,
    source: docSource,
    sourceDocumentId,
    generatedStrategy: null,
  });
  if (!saved.ok) {
    return NextResponse.json(
      { error: saved.message, ...(saved.migration ? { errorKey: "intake.migrationMissing" } : {}) },
      { status: saved.status },
    );
  }

  // ── the questionnaire half ────────────────────────────────────────────────
  const { data: row, error: readError } = await supabase
    .from("onboarding").select("*").eq("brand_id", auth.brandId).maybeSingle();
  if (readError && isMissingColumn(readError)) {
    return NextResponse.json({ error: migrationMessage(readError), errorKey: "intake.migrationMissing" }, { status: 503 });
  }

  const before: OnboardingState = fromRow(row);
  const merged: Record<number, string> = { ...before.answers };
  let filled = 0, keptExisting = 0;
  for (const [n, text] of Object.entries(answers)) {
    const num = Number(n);
    if (merged[num]?.trim()) { keptExisting++; continue; }
    merged[num] = text;
    filled++;
  }
  const next: OnboardingState = { ...before, answers: merged };
  const state: OnboardingState = { ...next, status: computeStatus(next) };

  const { error: writeError } = await supabase
    .from("onboarding")
    .upsert(toRow(state, auth.brandId, auth.userId), { onConflict: "brand_id" });
  // The strategy row is already written, so this is reported rather than
  // fatal: the founder's answers are saved, and /start would ask again.
  if (writeError) {
    console.error("[strategy-intake] onboarding mirror failed:", writeError.message);
    return NextResponse.json({
      ok: true, id: saved.id, version: saved.version,
      answered: Object.keys(answers).length, filled, keptExisting,
      warning: writeError.message, warningKey: "intake.questionnaireNotUpdated",
    });
  }

  const remaining = ASKABLE_NUMBERS.filter((n) => !merged[n]?.trim());
  return NextResponse.json({
    ok: true,
    id: saved.id,
    version: saved.version,
    answered: Object.keys(answers).length,
    filled,
    keptExisting,
    remaining,
    status: state.status,
  });
}
