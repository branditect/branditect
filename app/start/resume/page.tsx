"use client";

import Link from "next/link";
import { useOnboarding } from "@/lib/use-onboarding";
import { StartShell } from "@/components/start/shell";
import { Rail, RailFoot, RailSteps } from "@/components/start/rail";
import { resumeQuestion } from "@/lib/onboarding";
import { answeredTotal, questionTotal, sectionOf, gateFootNote } from "@/lib/rail-steps";
import { useT } from "@/lib/i18n/use-t.tsx";

export default function Resume() {
  const t = useT();
  const { state, loading, flush } = useOnboarding();
  const n = resumeQuestion(state);
  const answered = answeredTotal(state);
  const total = questionTotal();

  return (
    <StartShell
      flush={flush}
      counter={
        <span className="text-micro font-extrabold uppercase tracking-[1.2px] text-lav-ink">
          {t("start.resume.title")}
        </span>
      }
      rail={
        // Someone returning to an abandoned form needs to see that leaving did
        // not cost them anything, and where they got to. A single sentence on
        // an empty page is what "thrown mid-questionnaire" feels like.
        <Rail
          eyebrow={t("start.resume.welcomeBack")}
          heading={t("start.resume.nothingLost")}
          lede={
            loading
              ? t("start.resume.finding")
              : `${t("start.resume.answeredOf", { answered, total })} ${(() => { const note = gateFootNote(state); return t(note.key, note.vars); })()}`
          }
          foot={
            <RailFoot icon="cloud">
              {t("start.resume.body")}
            </RailFoot>
          }
        >
          <RailSteps state={state} activeSection={sectionOf(n)} />
        </Rail>
      }
    >
      <h1 className="text-h2 font-bold tracking-[-0.5px]">
        {loading ? t("start.resume.finding") : t("start.resume.wereOn", { n, total })}
      </h1>
      <p className="mt-3 max-w-[54ch] text-base font-normal leading-[1.6] text-muted">
        {t("start.resume.allSaved")}
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link href={`/start/q/${n}`}
          className="rounded-card bg-grad-mark px-6 py-3 text-sm font-bold text-white drop-shadow-btn">
          {t("common.continue")}
        </Link>
        {/* Not optional. Trapping someone in a form they already abandoned once
            is how you lose them the second time. */}
        <Link href="/home"
          className="rounded-card border-[1.5px] border-rule-2 bg-card px-6 py-3 text-sm font-bold text-ink-2">
          {t("start.resume.openWorkspace")}
        </Link>
      </div>
    </StartShell>
  );
}
