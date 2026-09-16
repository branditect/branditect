"use client";

import Link from "next/link";
import { useOnboarding } from "@/lib/use-onboarding";
import { StartShell } from "@/components/start/shell";
import { Rail, RailFoot, RailSteps } from "@/components/start/rail";
import { resumeQuestion } from "@/lib/onboarding";
import { gateFootNote, gateProgress } from "@/lib/rail-steps";
import LanguageSwitch from "@/components/language-switch";
import Icon, { type IconName } from "@/components/icon";
import { useT } from "@/lib/i18n/use-t.tsx";
import type { StringKey } from "@/lib/i18n/index.ts";

/**
 * The three doors, from branditect-ui/spec/strategy-in-and-again.md.
 *
 * The middle one is the new one. It does not skip the questionnaire, it
 * shortens it: a deck answers perhaps eight of the twenty questions, and the
 * other twelve stay questions rather than being invented.
 */
function Door({
  href, icon, title, note, primary = false,
}: {
  href: string; icon: IconName; title: StringKey; note: StringKey; primary?: boolean;
}) {
  const t = useT();
  return (
    <Link
      href={href}
      className={`flex items-start gap-3.5 rounded-panel border px-5 py-4 transition-colors ${
        primary
          ? "border-accent-line bg-tint-1 hover:border-accent"
          : "border-rule-2 bg-card hover:border-accent-line"
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${primary ? "text-accent" : "text-muted-2"}`}>
        <Icon name={icon} size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-bold tracking-[-0.2px] text-ink">{t(title)}</span>
        <span className="mt-0.5 block text-sm font-normal leading-[1.5] text-muted">{t(note)}</span>
      </span>
    </Link>
  );
}

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

      {/* Three doors, not one button. Someone who already has a strategy was
          previously told to type it in again twenty answers at a time. */}
      <div className="mt-8 flex max-w-[520px] flex-col gap-3">
        <Door
          href={partial ? "/start/resume" : "/start/profile/1"}
          icon="pen"
          title={partial ? "intake.door.resume" : "intake.door.answer"}
          note="intake.door.answerNote"
          primary
        />
        <Door href="/start/strategy" icon="doc" title="intake.door.have" note="intake.door.haveNote" />
        <Door href="/home" icon="arrow" title="intake.door.skip" note="intake.door.skipNote" />
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
