"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useOnboarding } from "@/lib/use-onboarding";
import { StartShell } from "@/components/start/shell";
import { Rail, RailFoot, GuideCard } from "@/components/start/rail";
import { sectionIndex, sectionOf, sectionTitle } from "@/lib/rail-steps";
import {
  QUESTIONS, EXEMPLAR, forTrack, type Track,
} from "@/lib/onboarding-questions";

const TOTAL = QUESTIONS.length;

export default function QuestionScreen() {
  const router = useRouter();
  const params = useParams<{ n: string }>();
  const n = Math.min(Math.max(Number(params.n) || 1, 1), TOTAL);
  const q = QUESTIONS.find((x) => x.n === n)!;

  const { state, setAnswer, skip, flush, save, loading } = useOnboarding();
  const track: Track = state.profile?.track ?? "physical";
  const [text, setText] = useState("");

  // Seed from saved state once it arrives, without clobbering live typing.
  useEffect(() => { if (!loading) setText(state.answers[n] ?? ""); }, [loading, n, state.answers]);

  const sectionId = sectionOf(n);
  const wasSkipped = state.skipped.includes(n);
  const blocked = Boolean(q.required) && !text.trim();

  async function go(to: number) {
    await flush();
    router.push(to < 1 ? "/start/profile/3" : to > TOTAL ? "/home" : `/start/q/${to}`);
  }

  return (
    <StartShell
      save={save}
      counter={
        <span className="text-micro font-extrabold uppercase tracking-[1.2px] text-lav-ink">
          Question {n} of {TOTAL}
        </span>
      }
      rail={
        // The question belongs in the rail, with its guidance. On a question
        // screen the rail carries the question, so the stepper collapses to the
        // eyebrow plus the counter already in the header.
        <Rail
          eyebrow={`Step ${sectionIndex(sectionId)} of 4 · ${sectionTitle(sectionId)}`}
          heading={forTrack(q.q, track)}
          foot={
            <RailFoot icon={q.required ? "key" : "spark"}>
              {q.note ??
                (q.required
                  ? "One of the five answers that unlocks your workspace."
                  : "Skippable — it becomes a Brand Readiness item you can come back to.")}
            </RailFoot>
          }
        >
          <GuideCard
            help={forTrack(q.help, track)}
            example={q.ex[track]}
            exemplar={EXEMPLAR[track]}
          />
        </Rail>
      }
    >
      {wasSkipped && (
        <p className="mb-5 rounded-tile bg-tint-1 px-3.5 py-2.5 text-xs font-semibold text-accent-dark">
          You skipped this one. Answering it now removes it from the list.
        </p>
      )}

      {/* The only thing on this side now, and it should look like the place
          where the work happens. */}
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setAnswer(n, e.target.value); }}
        onBlur={() => { void flush(); }}
        rows={7}
        aria-label={forTrack(q.q, track)}
        placeholder="Write it the way you'd say it out loud…"
        className="min-h-[200px] w-full resize-y rounded-panel border-[1.5px] border-rule-2 bg-card px-5 py-[18px] text-base leading-[1.6] text-ink outline-none placeholder:font-normal placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-tint-1"
      />
      <span className="mt-2.5 block text-2xs font-medium text-faint">Saves as you type.</span>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void go(n - 1)}
          className="text-sm font-semibold text-muted-2 hover:text-ink-2">← Back</button>

        <button type="button" disabled={blocked} onClick={() => void go(n + 1)}
          className="ml-auto rounded-card bg-grad-mark px-6 py-3 text-sm font-bold text-white drop-shadow-btn disabled:opacity-50">
          {n === TOTAL ? "Finish" : "Next question"}
        </button>

        {/* Absent on the four required questions, never greyed out — a disabled
            Skip invites a fight with the form. */}
        {!q.required && (
          <button type="button"
            onClick={async () => { skip(n); await flush(); void go(n + 1); }}
            className="text-sm font-semibold text-muted-2 hover:text-ink-2">
            Skip for now
          </button>
        )}
      </div>

      {/* Never a silent dead button. */}
      {blocked && (
        <p className="mt-2.5 text-xs font-semibold text-accent-dark">
          An answer is needed to continue.
        </p>
      )}
    </StartShell>
  );
}
