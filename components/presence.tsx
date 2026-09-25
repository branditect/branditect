"use client";

/**
 * Two quiet calls from the app shell, neither of which the person sees.
 *
 *   /api/activity    — "this brand was used", for HQ's last-active column and
 *                      its 14-day sparkline. At most every five minutes, on
 *                      load and when the tab comes back into view.
 *   /api/hq/session  — gives an operator the cookie that unlocks /hq. Every
 *                      account makes it; everyone but an operator gets the
 *                      same 404 a missing route gives. Six hours after it
 *                      worked; fifteen minutes after it did not — so an
 *                      operator added to HQ_OPERATOR_IDS is not locked out
 *                      for six hours by a 404 they got before the change.
 *
 * Throttles live in localStorage. If storage is blocked they simply run on
 * each load, which is harmless: both routes are cheap and idempotent.
 */
import { useEffect } from "react";
import { authedFetch } from "@/lib/authed-fetch";

const ACTIVITY_EVERY_MS = 5 * 60 * 1000;
const HQ_EVERY_MS = 6 * 60 * 60 * 1000;
const HQ_RETRY_MS = 15 * 60 * 1000;

function due(key: string, every: number): boolean {
  try {
    const last = Number(localStorage.getItem(key) ?? 0);
    if (Date.now() - last < every) return false;
    localStorage.setItem(key, String(Date.now()));
  } catch {
    /* storage blocked: run anyway */
  }
  return true;
}

/** When the HQ session is next due: "next" holds an absolute time. */
function hqDue(): boolean {
  try {
    return Date.now() >= Number(localStorage.getItem("bd_hq_next") ?? 0);
  } catch {
    return true;
  }
}
function hqNext(ms: number) {
  try { localStorage.setItem("bd_hq_next", String(Date.now() + ms)); } catch { /* storage blocked */ }
}

export default function Presence() {
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState !== "visible") return;
      if (due("bd_activity_at", ACTIVITY_EVERY_MS)) {
        void authedFetch("/api/activity", { method: "POST" }).catch(() => undefined);
      }
      if (hqDue()) {
        hqNext(HQ_RETRY_MS); // until we know how it went
        void authedFetch("/api/hq/session", { method: "POST", credentials: "same-origin" })
          .then((r) => hqNext(r.status === 204 ? HQ_EVERY_MS : HQ_RETRY_MS))
          .catch(() => undefined);
      }
    };
    ping();
    document.addEventListener("visibilitychange", ping);
    return () => document.removeEventListener("visibilitychange", ping);
  }, []);
  return null;
}
