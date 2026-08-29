"use client";

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

/**
 * Two columns: the rail on the LEFT at 352px, the answer stage on the right.
 *
 * It shipped the other way round — main left, a 300px leftover card right —
 * which is why the screen read as a question fired at you with no context. The
 * brand mark and the question itself now live in the rail; the header carries
 * only the counter and the save pill.
 */
export function StartShell({
  rail,
  counter,
  save,
  children,
}: {
  /** The full left column. Every /start screen has one. */
  rail: React.ReactNode;
  counter?: React.ReactNode;
  save?: SaveState;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-[352px_minmax(0,1fr)] items-stretch bg-card stack:grid-cols-1">
      {/* Rail first in the DOM, so at `stack:` the guidance is still read
          before the input rather than being hidden. */}
      {rail}

      <div className="flex min-w-0 flex-col">
        <header className="flex flex-none items-center gap-2.5 px-8 pt-6 stack:px-6">
          {counter}
          {save && <SavePill save={save} />}
        </header>
        <main className="min-w-0 flex-1 px-8 pb-10 pt-4 stack:px-6">{children}</main>
      </div>
    </div>
  );
}
