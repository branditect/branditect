"use client";

import Link from "next/link";
import Logo from "@/components/logo";
import type { SaveState } from "@/lib/onboarding-store";

/** Saved ✓ next to the counter. Silent saving is indistinguishable from broken. */
export function SavePill({ save }: { save: SaveState }) {
  if (save.kind === "idle") return null;
  const map = {
    saving: ["Saving…", "bg-tile text-muted-2"],
    saved: ["Saved ✓", "bg-green-wash text-green-ink"],
    error: ["Not saved — retrying", "bg-tint-1 text-accent-dark"],
  } as const;
  const [label, cls] = map[save.kind];
  return (
    <span role="status" aria-live="polite"
      className={`rounded-pill px-2.5 py-1 text-2xs font-bold ${cls}`}>
      {label}
    </span>
  );
}

export function StartShell({
  counter, save, children, guide,
}: {
  counter?: React.ReactNode;
  save?: SaveState;
  children: React.ReactNode;
  guide?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1100px] flex-col px-6 py-7">
      <header className="flex items-center gap-3">
        <Link href="/home" aria-label="Branditect"><Logo height={24} /></Link>
        <div className="ml-auto flex items-center gap-2.5">
          {counter}
          {save && <SavePill save={save} />}
        </div>
      </header>

      <div className="mt-8 grid flex-1 grid-cols-[minmax(0,1fr)_300px] items-start gap-10 stack:grid-cols-1">
        <main className="min-w-0">{children}</main>
        {/* The worked example lives here as a labelled card, never as ghost text
            in the input — placeholder text vanishes exactly when it is wanted. */}
        {guide && <aside className="stack:order-first">{guide}</aside>}
      </div>
    </div>
  );
}
