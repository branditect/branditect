"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBrand } from "@/lib/useBrand";
import { useUser } from "@/lib/useUser";
import { useReadiness } from "@/lib/useReadiness";
import { readinessHeadline } from "@/lib/readiness";
import { greeting, GREETING_BEFORE_MOUNT } from "@/lib/greeting";
import Icon from "@/components/icon";
import ReadinessCard from "@/components/readiness-card";
import WhatsNextPanel from "@/components/whats-next-panel";
import OnboardingStrip from "@/components/onboarding-strip";
import StudioCard, { type StudioVariant } from "@/components/studio-card";
import ActivityList from "@/components/activity-list";
import ChatRail from "@/components/chat-rail";
import { useT } from "@/lib/i18n/use-t.tsx";
import type { StringKey } from "@/lib/i18n/index.ts";

// Keys, not words: translated where they render, so the row follows the
// interface language rather than being fixed at module load.
const STUDIO: { title: StringKey; description: StringKey; href: string; variant: StudioVariant }[] = [
  {
    title: "nav.studio.write",
    description: "home.writeDesc",
    href: "/studio/write",
    variant: "write",
  },
  {
    title: "nav.studio.createImages",
    description: "home.imagesDesc",
    href: "/studio/create-images",
    variant: "images",
  },
  {
    title: "home.numbersTitle",
    description: "home.numbersDesc",
    href: "/numbers",
    variant: "numbers",
  },
  {
    title: "nav.brand.visual",
    description: "home.visualDesc",
    href: "/brand/visual-identity",
    variant: "assets",
  },
];

const SUGGESTIONS: StringKey[] = ["home.prompt1", "home.prompt2", "home.prompt3"];

export default function HomePage() {
  const t = useT();
  const { brandId } = useBrand();
  const { user } = useUser();
  const { readiness, counts, onboarding } = useReadiness(brandId);

  // The hour is read after mount, never during render. A client component still
  // renders on the server, so computing it inline took the hour from the
  // server's clock (UTC on Vercel) and then from the browser's, and the two
  // print different words into this heading for nine hours a day — React error
  // #425. See lib/greeting.ts for the windows.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const hour = now === null ? null : now.getHours();
  // Greet the person, not the brand. Falls back to a nameless greeting rather
  // than inventing one — "Good afternoon, Your" is worse than no name.
  const firstName = user?.firstName ?? null;

  return (
    <div className="mx-auto flex max-w-shell items-start gap-3 stack:flex-col">
      <div className="flex min-w-0 flex-1 flex-col gap-[18px] px-4 pb-12 pt-[22px]">
        <header className="flex items-start gap-4">
          <div className="min-w-0">
            <h1 className="text-display font-bold leading-[1.15] stack:text-h2">
              {t(hour === null ? GREETING_BEFORE_MOUNT : greeting(hour))}
              {firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-[3px] text-base font-normal text-muted-2">
              {(() => {
                const headline = readinessHeadline(readiness);
                const line = t(headline.key, headline.vars);
                // English puts the diagnosis after a dash and bolds it; a
                // language without the dash renders the sentence plain.
                const [head, ...rest] = line.split("—");
                return rest.length ? (
                  <>
                    {head}—<b className="font-semibold text-ink-2">{rest.join("—")}</b>
                  </>
                ) : (
                  line
                );
              })()}
            </p>
          </div>

          <div className="ml-auto flex shrink-0 gap-2">
            <Link
              href="/knowledge/documents"
              aria-label={t("home.search")}
              className="grid h-[34px] w-[34px] place-items-center rounded-nav text-accent hover:bg-tint-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Icon name="search" size={18} />
            </Link>
            <Link
              href="/home"
              aria-label={t("home.notifications")}
              className="relative grid h-[34px] w-[34px] place-items-center rounded-nav text-accent hover:bg-tint-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Icon name="bell" size={18} />
            </Link>
          </div>
        </header>

        {/* Above the fold: someone who left mid-questionnaire is invited back
            before anything else competes for the decision. */}
        <OnboardingStrip onboarding={onboarding} />

        <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] items-stretch gap-3 stack:grid-cols-1">
          <ReadinessCard readiness={readiness} knowledge={counts} />
          <WhatsNextPanel
            checks={readiness.checks}
            score={readiness.score}
            passedCount={readiness.passedCount}
            totalCount={readiness.totalCount}
          />
        </div>

        <h2 className="text-h2 font-bold">
          {t("home.studio")}
          <small className="ml-[9px] text-sm font-medium tracking-normal text-muted-2">
            {t("home.createWithBrand")}
          </small>
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3">
          {STUDIO.map((c) => (
            <StudioCard key={c.href} {...c} title={t(c.title)} description={t(c.description)} />
          ))}
        </div>

        <ActivityList items={[]} now={now} />
      </div>

      <ChatRail
        indexedFileCount={counts.documents + counts.presentations + counts.links}
        suggestions={SUGGESTIONS.map((k) => t(k))}
      />
    </div>
  );
}
