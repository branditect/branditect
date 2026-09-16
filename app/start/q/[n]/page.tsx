"use client";

import { authedJson } from "@/lib/authed-fetch";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useOnboarding } from "@/lib/use-onboarding";
import { StartShell } from "@/components/start/shell";
import { Rail, RailFoot, GuideCard } from "@/components/start/rail";
import { sectionIndex, sectionOf } from "@/lib/rail-steps";
import { QUESTIONS, type Track } from "@/lib/onboarding-questions";
import { forLocale, sectionTitleFor } from "@/lib/onboarding-locale";
import { useT, useLocale } from "@/lib/i18n/use-t.tsx";
import type { StringKey } from "@/lib/i18n/index.ts";

/** Why a question earns its place, for the four that say so. */
const NOTE_KEY: Partial<Record<number, StringKey>> = {
  6: "start.qNote.6", 8: "start.qNote.8", 10: "start.qNote.10", 20: "start.qNote.20",
};

/** Whose example this is, as a whole sentence per track. */
const EXEMPLAR_KEY: Record<Track, StringKey> = {
  physical: "start.exemplar.physical",
  digital: "start.exemplar.digital",
  service: "start.exemplar.service",
};

const TOTAL = QUESTIONS.length;

export default function QuestionScreen() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ n: string }>();
  const n = Math.min(Math.max(Number(params.n) || 1, 1), TOTAL);
  const q = QUESTIONS.find((x) => x.n === n)!;

  const { state, setAnswer, skip, flush, save, loading } = useOnboarding();
  const track: Track = state.profile?.track ?? "physical";
  // The question, its guidance and its example in the interface language,
  // falling back to English per field (lib/onboarding-locale.ts).
  const lq = forLocale(n, track, locale)!;
  const [text, setText] = useState("");
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  // Seed from saved state once it arrives, without clobbering live typing.
  useEffect(() => { if (!loading) setText(state.answers[n] ?? ""); }, [loading, n, state.answers]);

  const sectionId = sectionOf(n);
  const wasSkipped = state.skipped.includes(n);
  const blocked = Boolean(q.required) && !text.trim();

  /**
   * Finishing has to produce something. The last question used to route to
   * /home, and nothing anywhere turned the answers into a strategy: twenty
   * answers stored, no strategy, and Brand ▸ Strategy still offering to start
   * the questionnaire.
   */
  async function go(to: number) {
    await flush();
    if (to < 1) { router.push("/start/profile/3"); return; }
    if (to <= TOTAL) { router.push(`/start/q/${to}`); return; }

    setBuilding(true);
    setBuildError(null);
    const res = await authedJson("/api/strategy-generate", "POST", {});
    const body = await res.json().catch(() => ({}));
    setBuilding(false);
    if (!res.ok) {
      // The answers are safe either way; say so rather than stranding anyone.
      setBuildError(t("strategy.buildFailed", { message: body?.error ?? String(res.status) }));
      return;
    }
    router.push("/brand/strategy");
  }

  return (
    <StartShell
      save={save}
      flush={flush}
      counter={
        <span className="text-micro font-extrabold uppercase tracking-[1.2px] text-lav-ink">
          {t("start.questionOf", { n, total: TOTAL })}
        </span>
      }
      rail={
        // The question belongs in the rail, with its guidance. On a question
        // screen the rail carries the question, so the stepper collapses to the
        // eyebrow plus the counter already in the header.
        <Rail
          eyebrow={t("start.stepOf", { index: sectionIndex(sectionId), title: sectionId ? sectionTitleFor(sectionId, locale) : "" })}
          heading={lq.q}
          foot={
            <RailFoot icon={q.required ? "key" : "spark"}>
              {NOTE_KEY[n]
                ? t(NOTE_KEY[n]!)
                : q.required
                  ? t("start.requiredNote")
                  : t("start.skippableNote")}
            </RailFoot>
          }
        >
          <GuideCard
            help={lq.help}
            example={lq.ex}
            attribution={t(EXEMPLAR_KEY[track])}
          />
        </Rail>
      }
    >
      {wasSkipped && (
        <p className="mb-5 rounded-tile bg-tint-1 px-3.5 py-2.5 text-xs font-semibold text-accent-dark">
          {t("start.skippedNotice")}
        </p>
      )}

      {/* The only thing on this side now, and it should look like the place
          where the work happens. */}
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setAnswer(n, e.target.value); }}
        onBlur={() => { void flush(); }}
        rows={7}
        aria-label={lq.q}
        placeholder={t("start.answerPlaceholder")}
        className="min-h-[200px] w-full resize-y rounded-panel border-[1.5px] border-rule-2 bg-card px-5 py-[18px] text-base leading-[1.6] text-ink outline-none placeholder:font-normal placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-tint-1"
      />
      <span className="mt-2.5 block text-2xs font-medium text-faint">{t("start.savesAsYouType")}</span>

      {buildError && (
        <p className="mt-3 rounded-tile bg-red-50 px-3 py-2 text-xs font-semibold text-red-600" role="alert">
          {buildError}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void go(n - 1)}
          className="text-sm font-semibold text-muted-2 hover:text-ink-2">{t("onboarding.back")}</button>

        <button type="button" disabled={blocked || building} onClick={() => void go(n + 1)}
          className="ml-auto rounded-card bg-grad-mark px-6 py-3 text-sm font-bold text-white drop-shadow-btn disabled:opacity-50">
          {building ? t("strategy.building") : n === TOTAL ? t("start.finish") : t("start.nextQuestion")}
        </button>

        {/* Absent on the four required questions, never greyed out — a disabled
            Skip invites a fight with the form. */}
        {!q.required && (
          <button type="button"
            onClick={async () => { skip(n); await flush(); void go(n + 1); }}
            className="text-sm font-semibold text-muted-2 hover:text-ink-2">
            {t("common.skipForNow")}
          </button>
        )}
      </div>

      {/* Never a silent dead button. */}
      {blocked && (
        <p className="mt-2.5 text-xs font-semibold text-accent-dark">
          {t("start.answerNeeded")}
        </p>
      )}
    </StartShell>
  );
}
