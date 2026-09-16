"use client";

/**
 * The review screen. The thing that makes extraction safe to offer at all.
 *
 * branditect-ui/spec/strategy-in-and-again.md: "An extracted answer the founder
 * never read becomes a positioning they never chose, and everything Studio
 * writes is downstream of it. The review step is not politeness."
 *
 * So: every extracted answer is on screen, editable, with the sentence it came
 * from BESIDE it rather than behind a disclosure, and every question the
 * document did not answer is listed as a question. Nothing is written until the
 * button at the bottom.
 *
 * The counts come from intakeCounts() over the real question list, never from
 * the model: a model that claims twelve cannot make this screen say twelve.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authedJson } from "@/lib/authed-fetch";
import { useOnboarding } from "@/lib/use-onboarding";
import { StartShell } from "@/components/start/shell";
import { Rail, RailFoot } from "@/components/start/rail";
import { readHandoff, clearHandoff, type IntakeHandoff } from "@/components/start/intake-handoff";
import { intakeCounts, provenanceOf, answersOf, type ExtractedAnswer } from "@/lib/strategy-intake";
import { QUESTIONS, type Track } from "@/lib/onboarding-questions";
import { forLocale } from "@/lib/onboarding-locale";
import { useT, useLocale } from "@/lib/i18n/use-t.tsx";

/** Every question a person is actually asked. Q19 is generated, not asked. */
const ASKED = QUESTIONS.filter((q) => q.kind !== "antivoice");

export default function ReviewExtraction() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { state, flush, loading } = useOnboarding();
  const track: Track = state.profile?.track ?? "physical";

  const [handoff, setHandoff] = useState<IntakeHandoff | null>(null);
  const [ready, setReady] = useState(false);
  const [edited, setEdited] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // sessionStorage is not there on the server render, so this waits for mount
  // rather than rendering an empty state the client then contradicts.
  useEffect(() => {
    const h = readHandoff();
    setHandoff(h);
    setEdited(h ? answersOf(h.found) : {});
    setReady(true);
  }, []);

  const found = handoff?.found ?? [];
  const counts = useMemo(() => intakeCounts({ found, missing: handoff?.missing ?? [] }, ASKED), [found, handoff]);
  const missingQuestions = useMemo(() => {
    const answered = new Set(found.map((f) => f.n));
    return ASKED.filter((q) => !answered.has(q.n));
  }, [found]);

  /** Where the remaining questions start: the first nobody has answered yet. */
  const firstUnanswered = useMemo(() => {
    const fromDocument = new Set(found.map((f) => f.n));
    return ASKED.find((q) => !fromDocument.has(q.n) && !state.answers[q.n]?.trim())?.n ?? null;
  }, [found, state.answers]);

  async function saveAndGo() {
    if (saving || !handoff) return;
    setSaving(true);
    setError(null);
    // What is saved is what is on screen, edits included — never the raw
    // extraction. The quote stays the quote: an edit changes the answer, not
    // where it came from.
    const confirmed: ExtractedAnswer[] = found.map((f) => ({ ...f, answer: (edited[f.n] ?? f.answer).trim() }))
      .filter((f) => f.answer);
    try {
      await flush();
      const res = await authedJson("/api/strategy-intake", "POST", {
        // The table stores how it arrived: a file is "pdf", pasted text is
        // "paste". See brand_strategies_source_check.
        source: handoff.documentId ? "pdf" : "paste",
        answers: answersOf(confirmed),
        provenance: provenanceOf(confirmed),
        sourceDocumentId: handoff.documentId,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? String(res.status));
      clearHandoff();
      router.push(firstUnanswered ? `/start/q/${firstUnanswered}` : "/home");
    } catch (e) {
      setSaving(false);
      setError(t("intake.review.saveFailed", { msg: e instanceof Error ? e.message : String(e) }));
    }
  }

  const minutes = Math.max(1, Math.round(counts.remaining * 0.75));

  return (
    <StartShell
      flush={flush}
      counter={
        <span className="text-micro font-extrabold uppercase tracking-[1.2px] text-lav-ink">
          {t("intake.review.counter")}
        </span>
      }
      rail={
        <Rail
          eyebrow={t("intake.review.eyebrow")}
          heading={t("intake.review.heading")}
          lede={t("intake.review.lede")}
          foot={<RailFoot icon="key">{t("intake.review.foot")}</RailFoot>}
        />
      }
    >
      {!ready || loading ? (
        <p className="text-sm font-medium text-muted-2">{t("start.resume.finding")}</p>
      ) : !handoff ? (
        <>
          <h1 className="text-h2 font-bold tracking-[-0.5px]">{t("intake.review.nothingToReview")}</h1>
          <Link href="/start/strategy"
            className="mt-6 inline-block rounded-card bg-grad-mark px-6 py-3 text-sm font-bold text-white drop-shadow-btn">
            {t("intake.review.startOver")}
          </Link>
        </>
      ) : (
        <>
          <h1 className="max-w-[24ch] text-h2 font-bold leading-[1.15] tracking-[-0.5px]">
            {t("intake.review.weRead", { answered: counts.answered, total: counts.total })}
          </h1>
          {handoff.fileName && (
            <p className="mt-2 text-xs font-medium text-muted-2">{handoff.fileName}</p>
          )}

          {counts.answered === 0 && (
            <div className="mt-6 max-w-[620px] rounded-panel border border-rule-2 bg-card px-5 py-4">
              <p className="text-sm font-bold text-ink">{t("intake.review.foundNone")}</p>
              <p className="mt-1.5 text-sm font-normal leading-[1.55] text-muted">
                {t("intake.review.foundNoneHelp")}
              </p>
            </div>
          )}

          {/* ── what the document answered ───────────────────────────────── */}
          {counts.answered > 0 && (
            <>
              <h2 className="mt-8 text-micro font-extrabold uppercase tracking-[1.2px] text-lav-ink">
                {t("intake.review.fromYourDocument")}
              </h2>
              <ol className="mt-3 flex max-w-[760px] flex-col gap-3">
                {found.map((f) => {
                  const q = forLocale(f.n, track, locale);
                  return (
                    <li key={f.n} className="rounded-panel border border-rule-2 bg-card px-5 py-4">
                      <div className="text-sm font-bold leading-[1.4] text-ink">{q?.q ?? `Q${f.n}`}</div>
                      <textarea
                        value={edited[f.n] ?? f.answer}
                        onChange={(e) => setEdited((prev) => ({ ...prev, [f.n]: e.target.value }))}
                        rows={3}
                        aria-label={t("intake.review.editAria", { n: f.n })}
                        className="mt-2.5 w-full resize-y rounded-tile border-[1.5px] border-rule-2 bg-page px-3.5 py-2.5 text-sm leading-[1.55] text-ink outline-none focus:border-accent focus:ring-4 focus:ring-tint-1"
                      />
                      {/* Beside the answer, not behind a disclosure. */}
                      <div className="mt-2.5 border-l-2 border-lav-line pl-3">
                        <div className="text-micro font-extrabold uppercase tracking-[.9px] text-faint">
                          {t("intake.review.sourceQuote")}
                          {typeof f.page === "number" && ` · ${t("intake.review.sourcePage", { page: f.page })}`}
                        </div>
                        <p className="mt-1 text-xs font-medium italic leading-[1.5] text-muted">“{f.quote}”</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </>
          )}

          {/* ── what it did not ──────────────────────────────────────────── */}
          {missingQuestions.length > 0 && (
            <>
              <h2 className="mt-9 text-micro font-extrabold uppercase tracking-[1.2px] text-lav-ink">
                {t("intake.review.stillToAnswer")}
              </h2>
              <p className="mt-1.5 text-sm font-medium text-muted">
                {t(missingQuestions.length === 1
                  ? "intake.review.stillToAnswerOne"
                  : "intake.review.stillToAnswerCount", { count: missingQuestions.length })}
                {" · "}
                {t("intake.review.timeLeft", { minutes })}
              </p>
              <ul className="mt-3 flex max-w-[760px] flex-col">
                {missingQuestions.map((q) => (
                  <li key={q.n} className="flex items-baseline gap-3 border-b border-rule py-2.5 last:border-b-0">
                    <span className="text-sm font-medium leading-[1.45] text-ink-2">
                      {forLocale(q.n, track, locale)?.q ?? `Q${q.n}`}
                    </span>
                    <span className="ml-auto shrink-0 text-2xs font-semibold text-faint">
                      {t("intake.review.notInDocument")}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {error && (
            <p className="mt-5 max-w-[620px] rounded-tile bg-tint-1 px-3.5 py-2.5 text-sm font-semibold text-accent-dark">
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/start/strategy" className="text-sm font-semibold text-muted-2 hover:text-ink-2">
              {t("intake.review.tryAgain")}
            </Link>
            <Link href="/start/profile/1" className="text-sm font-semibold text-muted-2 hover:text-ink-2">
              {t("intake.review.answerAll")}
            </Link>
            <button
              type="button"
              onClick={() => void saveAndGo()}
              disabled={saving || counts.answered === 0}
              className="ml-auto rounded-card bg-grad-mark px-6 py-3 text-sm font-bold text-white drop-shadow-btn disabled:opacity-50"
            >
              {saving
                ? t("intake.review.saving")
                : t(firstUnanswered ? "intake.review.saveAndContinue" : "intake.review.saveAndFinish")}
            </button>
          </div>
        </>
      )}
    </StartShell>
  );
}
