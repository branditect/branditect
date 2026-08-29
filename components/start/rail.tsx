"use client";

import Link from "next/link";
import Icon from "@/components/icon";
import Logo from "@/components/logo";
import { railSteps } from "@/lib/rail-steps";
import type { OnboardingState } from "@/lib/onboarding";
import type { SectionId } from "@/lib/onboarding-questions";
import s from "./start.module.css";

/**
 * The left rail. Guide on the left, the box you type in on the right — the
 * three /start screens compose these pieces rather than each rebuilding them.
 */
export function Rail({
  eyebrow,
  heading,
  lede,
  children,
  foot,
}: {
  eyebrow: string;
  heading?: string;
  lede?: string;
  children?: React.ReactNode;
  /** Pinned to the bottom of the rail. */
  foot?: React.ReactNode;
}) {
  return (
    <aside className={s.rail}>
      <span className={s.blob} aria-hidden="true" />
      {/* So the screen is identifiably Branditect, not a naked form. */}
      <div className="mb-[26px] flex items-center gap-2.5">
        <Link href="/home" aria-label="Branditect">
          <Logo height={26} />
        </Link>
      </div>

      <div className={s.eyebrow}>{eyebrow}</div>
      {heading && <h2 className={s.heading}>{heading}</h2>}
      {lede && <p className={s.lede}>{lede}</p>}
      {children}
      {foot}
    </aside>
  );
}

/** The foot note. `key` on a required question, `spark` otherwise. */
export function RailFoot({ icon = "spark", children }: { icon?: "spark" | "key" | "cloud"; children: React.ReactNode }) {
  return (
    <p className={s.footNote}>
      <Icon name={icon} size={15} />
      <span>{children}</span>
    </p>
  );
}

/**
 * The four-section stepper. Counts come from SECTIONS and the saved answers,
 * never from a hard-coded array.
 */
export function RailSteps({
  state,
  activeSection = null,
}: {
  state: OnboardingState;
  activeSection?: SectionId | null;
}) {
  const rows = railSteps(state, activeSection);
  return (
    <ol className={s.steps} aria-label="Your progress">
      {rows.map((row) => (
        <li
          key={row.id}
          className={`${s.st} ${s[row.state]}`}
          aria-current={row.state === "active" ? "step" : undefined}
        >
          <span className={s.n} aria-hidden="true">
            {row.answered === row.total ? <Icon name="check" size={12} /> : row.index}
          </span>
          <div>
            <div className={s.t}>{row.title}</div>
            <div className={s.m}>{row.meta}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * How to answer, plus the worked example and who it belongs to. The attribution
 * is the point — without it people copy the words instead of the shape.
 */
export function GuideCard({
  help,
  example,
  exemplar,
}: {
  help: string;
  example?: string;
  /** "a boot repair business" — the business the example came from. */
  exemplar?: string;
}) {
  return (
    <div className={s.guide}>
      <div className={s.guideKey}>
        <Icon name="spark" size={13} />
        How to answer
      </div>
      <p className={s.help}>{help}</p>
      {example && (
        <>
          <div className={s.exlab}>Example answer</div>
          <p className={s.ex}>{example}</p>
          {exemplar && (
            <p className={s.exwho}>— {exemplar}, not yours. Copy the shape, not the words.</p>
          )}
        </>
      )}
    </div>
  );
}
