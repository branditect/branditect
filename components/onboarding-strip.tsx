"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/icon";
import { supabase } from "@/lib/supabase";
import { questionTotal } from "@/lib/rail-steps";
import type { OnboardingSummary } from "@/lib/useReadiness";

const KEY = "branditect_onboarding_strip_dismissed";

/**
 * The invitation back, shown above the fold while the questionnaire is
 * `partial`.
 *
 * Dismissible, because a permanent banner is a punishment. Back on the next
 * login, because the whole point of letting someone leave is that they can be
 * invited to return — so the flag lives in sessionStorage and is cleared on
 * sign-out rather than being written to the row.
 */
export default function OnboardingStrip({ onboarding }: { onboarding: OnboardingSummary }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(KEY) === "1");
    } catch {
      /* private mode — the strip simply stays */
    }
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        try { sessionStorage.removeItem(KEY); } catch { /* nothing to clear */ }
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Only while partial. Not started has nothing to continue; gated_complete and
  // complete have already had their reward.
  if (onboarding.status !== "partial" || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try { sessionStorage.setItem(KEY, "1"); } catch { /* it comes back next load */ }
  }

  return (
    <section
      aria-label="Continue your strategy"
      className="flex items-center gap-3 rounded-panel bg-grad-more px-[18px] py-3.5"
    >
      <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-tile bg-white/70 text-accent">
        <Icon name="spark" size={15} />
      </span>
      <p className="min-w-0 text-sm font-medium text-ink-2">
        <b className="font-bold text-ink">
          You&rsquo;re {onboarding.answered} of {questionTotal()} into your strategy.
        </b>{" "}
        Five answers open Studio.
      </p>
      <Link
        href="/start"
        className="ml-auto flex-none whitespace-nowrap text-xs font-bold text-accent-dark hover:underline"
      >
        Continue →
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex-none rounded-nav p-1 text-muted-2 hover:bg-white/60 hover:text-ink-2"
      >
        <Icon name="close" size={13} />
      </button>
    </section>
  );
}
