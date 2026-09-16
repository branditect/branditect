"use client";

import Link from "next/link";
import { useOnboarding } from "@/lib/use-onboarding";
import { StartShell } from "@/components/start/shell";
import { Rail, RailFoot, RailSteps } from "@/components/start/rail";
import { resumeQuestion } from "@/lib/onboarding";
import { gateFootNote, gateProgress } from "@/lib/rail-steps";
import LanguageSwitch from "@/components/language-switch";
import { useT } from "@/lib/i18n/use-t.tsx";

export default function StartWelcome() {
  const t = useT();
  const { state, loading, flush } = useOnboarding();
  const partial = !loading && state.status === "partial";

  return (
    <StartShell
      flush={flush}
      counter={
        <span className="text-micro font-extrabold uppercase tracking-[1.2px] text-lav-ink">
          {t("start.beforeYouBegin")}
        </span>
      }
      rail={
        <Rail
          eyebrow={t("profile.gettingStarted")}
          heading={t("start.fourSections")}
          lede={t("start.fiveOpen")}
          foot={
            // The one place a count of the gate belongs: a reason to come back,
            // phrased as a fact. Never a warning that blocks.
            <RailFoot icon={gateProgress(state).cleared ? "spark" : "key"}>
              {(() => { const note = gateFootNote(state); return t(note.key, note.vars); })()}
            </RailFoot>
          }
        >
          <RailSteps state={state} />
        </Rail>
      }
    >
      <h1 className="max-w-[18ch] text-display font-bold leading-[1.12] tracking-[-0.7px]">
        {t("start.teachUs")}
      </h1>
      {/* States the time cost honestly rather than hiding it. */}
      <p className="mt-4 max-w-[54ch] text-base font-normal leading-[1.6] text-muted">
        {t("start.timeCost")}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={partial ? "/start/resume" : "/start/profile/1"}
          className="rounded-card bg-grad-mark px-6 py-3 text-sm font-bold text-white drop-shadow-btn">
          {partial ? t("start.pickUp") : t("start.start")}
        </Link>
      </div>

      {/* Before twenty questions, not after them. */}
      <div className="mt-10 max-w-[420px] rounded-card bg-white p-5 drop-shadow-panel">
        <LanguageSwitch />
      </div>

      {partial && (
        <p className="mt-4 text-xs font-medium text-muted-2">
          {t("start.wereOnOf20", { n: resumeQuestion(state) })}
        </p>
      )}
    </StartShell>
  );
}
