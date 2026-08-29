"use client";

import Link from "next/link";
import { useOnboarding } from "@/lib/use-onboarding";
import { StartShell } from "@/components/start/shell";
import { Rail, RailFoot, RailSteps } from "@/components/start/rail";
import { resumeQuestion } from "@/lib/onboarding";
import { answeredTotal, questionTotal, sectionOf } from "@/lib/rail-steps";

export default function Resume() {
  const { state, loading, flush } = useOnboarding();
  const n = resumeQuestion(state);
  const answered = answeredTotal(state);
  const total = questionTotal();

  return (
    <StartShell
      flush={flush}
      counter={
        <span className="text-micro font-extrabold uppercase tracking-[1.2px] text-lav-ink">
          Picking up where you left off
        </span>
      }
      rail={
        // Someone returning to an abandoned form needs to see that leaving did
        // not cost them anything, and where they got to. A single sentence on
        // an empty page is what "thrown mid-questionnaire" feels like.
        <Rail
          eyebrow="Welcome back"
          heading="Nothing was lost."
          lede={
            loading
              ? "Finding your place…"
              : `${answered} of ${total} answered. Pick up at question ${n}, or open the workspace and come back to it.`
          }
          foot={
            <RailFoot icon="cloud">
              Saved to your account, not this browser. Sign in anywhere and it&rsquo;s there.
            </RailFoot>
          }
        >
          <RailSteps state={state} activeSection={sectionOf(n)} />
        </Rail>
      }
    >
      <h1 className="text-h2 font-bold tracking-[-0.5px]">
        {loading ? "Finding your place…" : `You were on question ${n} of ${total}.`}
      </h1>
      <p className="mt-3 max-w-[54ch] text-base font-normal leading-[1.6] text-muted">
        Everything you have written is saved. The questions you skipped are waiting in Brand
        Readiness, not lost.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link href={`/start/q/${n}`}
          className="rounded-card bg-grad-mark px-6 py-3 text-sm font-bold text-white drop-shadow-btn">
          Continue
        </Link>
        {/* Not optional. Trapping someone in a form they already abandoned once
            is how you lose them the second time. */}
        <Link href="/home"
          className="rounded-card border-[1.5px] border-rule-2 bg-card px-6 py-3 text-sm font-bold text-ink-2">
          Open my workspace instead
        </Link>
      </div>
    </StartShell>
  );
}
