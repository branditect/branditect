"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useOnboarding } from "@/lib/use-onboarding";
import { StartShell } from "@/components/start/shell";
import {
  QUESTIONS, SECTIONS, forTrack, type Track,
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

  const section = SECTIONS.find((s) => n >= s.range[0] && n <= s.range[1]);
  const wasSkipped = state.skipped.includes(n);
  const blocked = Boolean(q.required) && !text.trim();

  async function go(to: number) {
    await flush();
    router.push(to < 1 ? "/start/profile/3" : to > TOTAL ? "/home" : `/start/q/${to}`);
  }

  return (
    <StartShell save={save}
      counter={
        <span className="text-xs font-bold text-muted-2">
          {section?.title} · Question {n} of {TOTAL}
        </span>
      }
      guide={
        <div className="rounded-card border border-rule bg-card p-4">
          <div className="text-micro font-bold uppercase tracking-[1.2px] text-muted-2">
            An example
          </div>
          <p className="mt-2 text-sm font-medium leading-[1.55] text-ink-2">{q.ex[track]}</p>
          <p className="mt-3 border-t border-rule pt-2.5 text-2xs font-medium text-faint">
            From a different business, not yours — close enough to show the shape.
          </p>
        </div>
      }>
      <h1 className="max-w-[26ch] text-h2 font-bold leading-[1.25] tracking-[-0.5px]">
        {forTrack(q.q, track)}
      </h1>
      <p className="mt-2.5 max-w-[52ch] text-sm font-normal text-muted">{forTrack(q.help, track)}</p>

      {wasSkipped && (
        <p className="mt-4 rounded-tile bg-tint-1 px-3.5 py-2.5 text-xs font-semibold text-accent-dark">
          You skipped this one. Answering it now removes it from the list.
        </p>
      )}

      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setAnswer(n, e.target.value); }}
        onBlur={() => { void flush(); }}
        rows={5}
        className="mt-5 w-full rounded-card border border-rule bg-card px-4 py-3.5 text-base leading-[1.6] text-ink outline-none focus:border-accent focus:ring-4 focus:ring-tint-1"
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void go(n - 1)}
          className="text-sm font-semibold text-muted-2 hover:text-ink-2">← Back</button>

        <button type="button" disabled={blocked} onClick={() => void go(n + 1)}
          className="ml-auto rounded-tile bg-grad-mark px-6 py-2.5 text-sm font-bold text-white drop-shadow-btn disabled:opacity-50">
          {n === TOTAL ? "Finish" : "Continue"}
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
