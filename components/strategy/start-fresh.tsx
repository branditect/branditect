"use client";

/**
 * "Start fresh", at the foot of Brand ▸ Strategy.
 *
 * branditect-ui/spec/strategy-in-and-again.md, part 2.
 *
 * THIS COMPONENT WRITES NOTHING, AND THAT IS THE FEATURE. A redo that takes
 * effect on the first click means a founder who starts one and is interrupted
 * has destroyed a working strategy and replaced it with three answers. So both
 * controls are links: the current strategy stays live and current the whole way
 * through, and the new one replaces it only when it is finished. Abandon
 * halfway and nothing has happened.
 *
 * NOT A RED BUTTON. It is not destruction — the old version is kept and
 * restorable — so it is a plain secondary control, under the strategy rather
 * than next to Save, with the three lines above it saying exactly what it
 * touches. Those lines are the feature as much as the mechanism is: the
 * difference between "redo my strategy" and "delete my account" is whether the
 * screen says so.
 */
import Link from "next/link";
import { useT } from "@/lib/i18n/use-t.tsx";

export default function StartFresh() {
  const t = useT();

  return (
    <section className="mx-auto mt-10 w-full max-w-[860px] rounded-panel border border-rule bg-card px-6 py-5 drop-shadow-panel">
      <h2 className="text-h3 font-bold">{t("freshStart.title")}</h2>

      {/* The three lines. A test fails if the "does not touch" one is removed. */}
      <p className="mt-2 max-w-[70ch] text-sm font-medium leading-[1.6] text-ink-2">
        {t("freshStart.replaces")}
      </p>
      <p className="mt-1.5 max-w-[70ch] text-sm font-medium leading-[1.6] text-muted">
        {t("freshStart.doesNotTouch")}
      </p>
      <p className="mt-1.5 max-w-[70ch] text-sm font-medium leading-[1.6] text-muted">
        {t("freshStart.staysLive")}
      </p>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <Link
          href="/start"
          className="rounded-tile border border-rule-2 bg-white px-4 py-2.5 text-sm font-bold text-ink-2 hover:border-accent-line hover:text-accent-dark"
        >
          {t("freshStart.questionnaire")}
        </Link>
        <Link
          href="/start/strategy"
          className="rounded-tile border border-rule-2 bg-white px-4 py-2.5 text-sm font-bold text-ink-2 hover:border-accent-line hover:text-accent-dark"
        >
          {t("freshStart.upload")}
        </Link>
      </div>
    </section>
  );
}
