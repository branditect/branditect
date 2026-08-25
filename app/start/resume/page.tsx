"use client";

import Link from "next/link";
import { useOnboarding } from "@/lib/use-onboarding";
import { StartShell } from "@/components/start/shell";
import { resumeQuestion } from "@/lib/onboarding";

export default function Resume() {
  const { state, loading } = useOnboarding();
  const n = resumeQuestion(state);

  return (
    <StartShell>
      <h1 className="text-h2 font-bold tracking-[-0.5px]">
        {loading ? "Finding your place…" : `You were on question ${n} of 20.`}
      </h1>
      <p className="mt-3 text-base font-normal text-muted">Everything you have written is saved.</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link href={`/start/q/${n}`}
          className="rounded-tile bg-grad-mark px-6 py-3 text-sm font-bold text-white drop-shadow-btn">
          Continue
        </Link>
        {/* Not optional. Trapping someone in a form they already abandoned once
            is how you lose them the second time. */}
        <Link href="/home"
          className="rounded-tile border border-rule bg-card px-6 py-3 text-sm font-bold text-ink-2">
          Open my workspace instead
        </Link>
      </div>
    </StartShell>
  );
}
