"use client";

import { useRouter, useParams } from "next/navigation";
import { useOnboarding } from "@/lib/use-onboarding";
import { StartShell } from "@/components/start/shell";
import { Rail, RailFoot, RailSteps } from "@/components/start/rail";
import type { Profile } from "@/lib/onboarding";
import { supabase } from "@/lib/supabase";
import { gateFootNote, gateProgress } from "@/lib/rail-steps";

/** Three taps, no typing. Sets the track, the voice rubric and the Numbers profile. */
const STEPS = [
  { key: "track", q: "What do you sell?",
    options: [["physical", "Physical products"], ["digital", "Digital products or software"], ["service", "A service"]] },
  { key: "charge_model", q: "How do people pay?",
    options: [["one-off", "One-off purchases"], ["recurring", "On subscription"]] },
  { key: "team_size", q: "Who is doing the work?",
    options: [["just-me", "Just me"], ["2-3", "Two or three of us"], ["4-10", "A team of four to ten"]] },
  /**
   * The half that matters, and the one that was missing.
   *
   * interface_language decides what the founder reads. This decides what her
   * CUSTOMERS read, which is the thing she is paying for. Asked here rather
   * than in Settings because it is a decision about the business, and asked
   * separately from the interface because a founder who has read English
   * software for fifteen years may well want English on screen and Finnish in
   * the copy.
   */
  { key: "output_language", q: "What language should we write in?",
    options: [["en", "English"], ["fi", "Suomi"]] },
] as const;

export default function ProfileStep() {
  const router = useRouter();
  const params = useParams<{ step: string }>();
  const idx = Math.min(Math.max(Number(params.step) || 1, 1), STEPS.length) - 1;
  const step = STEPS[idx];
  const { state, setProfile, flush, save, loading } = useOnboarding();

  const current = (state.profile ?? {}) as Partial<Profile>;

  async function choose(value: string) {
    const next = { ...current, [step.key]: value } as Profile;
    setProfile(next);

    // The output language also belongs on the brand row, because that is what
    // every generation route reads. The column does not exist until
    // supabase/brand-language.sql is run, so this write is allowed to fail —
    // the answer is still kept in the onboarding profile either way, and
    // outputLanguageFor defaults to English until the column is there.
    if (step.key === "output_language") {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("brands")
          .update({ output_language: value })
          .eq("user_id", user.id);
      }
    }

    await flush(); // forced write on navigation
    router.push(idx + 1 < STEPS.length ? `/start/profile/${idx + 2}` : "/start/q/1");
  }

  return (
    <StartShell
      save={save}
      flush={flush}
      counter={
        <span className="text-micro font-extrabold uppercase tracking-[1.2px] text-lav-ink">
          Setup {idx + 1} of {STEPS.length}
        </span>
      }
      rail={
        <Rail
          eyebrow="Getting started"
          heading="Let’s get to know your business"
          lede="Four quick taps, no typing. This sets the examples you’ll see, the language Studio writes in, and the profile your Numbers section needs."
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
      <h1 className="text-h2 font-bold tracking-[-0.5px]">{step.q}</h1>

      <div className="mt-6 flex max-w-[640px] flex-col gap-2.5">
        {step.options.map(([value, label]) => {
          const on = current[step.key as keyof Profile] === value;
          return (
            <button key={value} type="button" disabled={loading} onClick={() => choose(value)}
              className={`rounded-card border px-5 py-4 text-left text-base font-semibold transition-colors
                ${on ? "border-accent bg-tint-1 text-accent-dark" : "border-rule bg-card text-ink-2 hover:border-accent-line"}`}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Back is always live, including from step one. */}
      <button type="button"
        onClick={() => (idx === 0 ? router.push("/start") : router.push(`/start/profile/${idx}`))}
        className="mt-6 text-sm font-semibold text-muted-2 hover:text-ink-2">
        ← Back
      </button>
    </StartShell>
  );
}
