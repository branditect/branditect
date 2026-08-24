"use client";

import { type OnboardingState } from "./onboarding.ts";

/**
 * Persistence for the questionnaire.
 *
 * Debounce, retry and the localStorage mirror. No database client here — see
 * onboarding-db.ts for that, and note the rule it exists to enforce: supabase-js returns { data, error } and
 * does not throw, so wrapping an upsert in try/catch catches nothing. The
 * strategy page discarded the error on all seven of its writes, which is why
 * brand_strategies has no rows. Every write here checks the returned error,
 * surfaces it, and retries — never falling through to a success path.
 */

export type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "error"; message: string; pending: true };

export const DEBOUNCE_MS = 600;
const RETRY_MS = [1000, 3000, 8000];

const mirrorKey = (brandId: string) => `branditect:onboarding:${brandId}`;

/** The mirror is a fallback for a failed write, never the store. */
export function readMirror(brandId: string): OnboardingState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(mirrorKey(brandId));
    return raw ? (JSON.parse(raw) as OnboardingState) : null;
  } catch {
    return null;
  }
}

export function writeMirror(brandId: string, state: OnboardingState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(mirrorKey(brandId), JSON.stringify(state));
  } catch {
    /* quota or private mode — the database is still the truth */
  }
}

export function clearMirror(brandId: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(mirrorKey(brandId)); } catch { /* ignore */ }
}

export interface WriteResult { ok: boolean; error?: string }

/**
 * Debounced writer with forced flush.
 *
 * Debounces 600ms after the last keystroke; flush() writes immediately and is
 * what blur, navigation and visibilitychange call. A pending debounce is always
 * cancelled by a flush so the same edit is never written twice.
 */
export class OnboardingWriter {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private latest: OnboardingState | null = null;
  private inFlight = false;

  // Fields are declared rather than written as constructor parameter
  // properties: the test suite runs under Node's strip-only TypeScript, which
  // rejects those outright.
  private brandId: string;
  private userId: string | null;
  private onSaveState: (s: SaveState) => void;
  /** Injectable so the failure path can be tested without a network. */
  private write: (s: OnboardingState, b: string, u: string | null) => Promise<WriteResult>;

  constructor(
    brandId: string,
    userId: string | null,
    onSaveState: (s: SaveState) => void,
    write: (s: OnboardingState, b: string, u: string | null) => Promise<WriteResult>,
  ) {
    this.brandId = brandId;
    this.userId = userId;
    this.onSaveState = onSaveState;
    this.write = write;
  }

  /** Call on every change. Mirrors immediately, writes after the debounce. */
  queue(state: OnboardingState): void {
    this.latest = state;
    writeMirror(this.brandId, state);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.flush(); }, DEBOUNCE_MS);
  }

  /** Force a write now — blur, navigation, visibilitychange. */
  async flush(): Promise<WriteResult> {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (!this.latest) return { ok: true };
    if (this.inFlight) return { ok: true };

    const state = this.latest;
    this.inFlight = true;
    this.onSaveState({ kind: "saving" });

    const res = await this.write(state, this.brandId, this.userId);
    this.inFlight = false;

    if (!res.ok) {
      // Surfaced, kept locally, and retried with backoff. Never silently dropped.
      this.onSaveState({ kind: "error", message: res.error ?? "Save failed", pending: true });
      this.scheduleRetry();
      return res;
    }

    this.attempt = 0;
    clearMirror(this.brandId);
    this.onSaveState({ kind: "saved", at: Date.now() });
    return res;
  }

  private scheduleRetry(): void {
    if (this.retry) clearTimeout(this.retry);
    const wait = RETRY_MS[Math.min(this.attempt, RETRY_MS.length - 1)];
    this.attempt += 1;
    this.retry = setTimeout(() => { void this.flush(); }, wait);
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.retry) clearTimeout(this.retry);
  }
}

/** Wire the three forced-write triggers. Returns a teardown. */
export function attachFlushTriggers(writer: OnboardingWriter): () => void {
  if (typeof window === "undefined") return () => {};
  const onHide = () => { if (document.visibilityState === "hidden") void writer.flush(); };
  const onLeave = () => { void writer.flush(); };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onLeave);
  window.addEventListener("beforeunload", onLeave);
  return () => {
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", onLeave);
    window.removeEventListener("beforeunload", onLeave);
  };
}
