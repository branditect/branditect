"use client";

import Link from "next/link";
import { useOnboarding } from "@/lib/use-onboarding";
import { StartShell } from "@/components/start/shell";
import { Rail, RailFoot, RailSteps } from "@/components/start/rail";
import { resumeQuestion } from "@/lib/onboarding";
import { gateFootNote, gateProgress } from "@/lib/rail-steps";

export default function StartWelcome() {
  const { state, loading, flush } = useOnboarding();
  const partial = !loading && state.status === "partial";

  return (
    <StartShell
      flush={flush}
      counter={
        <span className="text-micro font-extrabold uppercase tracking-[1.2px] text-lav-ink">
          Before you begin
        </span>
      }
      rail={
        <Rail
          eyebrow="Getting started"
          heading="Four sections, twenty questions."
          lede="Five of them open your workspace. The rest sharpen it whenever you come back."
          foot={
            // The one place a count of the gate belongs: a reason to come back,
            // phrased as a fact. Never a warning that blocks.
            <RailFoot icon={gateProgress(state).cleared ? "spark" : "key"}>
              {gateFootNote(state)}
            </RailFoot>
          }
        >
          <RailSteps state={state} />
        </Rail>
      }
    >
      <h1 className="max-w-[18ch] text-display font-bold leading-[1.12] tracking-[-0.7px]">
        Let&apos;s teach Branditect your brand.
      </h1>
      {/* States the time cost honestly rather than hiding it. */}
      <p className="mt-4 max-w-[54ch] text-base font-normal leading-[1.6] text-muted">
        Twenty questions, but only five are needed to open your workspace — about
        four minutes. The rest can wait, and they show up in Brand Readiness so
        you know what is still missing.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={partial ? "/start/resume" : "/start/profile/1"}
          className="rounded-card bg-grad-mark px-6 py-3 text-sm font-bold text-white drop-shadow-btn">
          {partial ? "Pick up where you left off" : "Start"}
        </Link>
      </div>

      {partial && (
        <p className="mt-4 text-xs font-medium text-muted-2">
          You were on question {resumeQuestion(state)} of 20. Everything you wrote is saved.
        </p>
      )}
    </StartShell>
  );
}
