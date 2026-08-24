"use client";

import { useEffect, useRef, useState } from "react";
import s from "./auth.module.css";

/**
 * Google, Microsoft and Apple — none of them wired.
 *
 * Per spec/auth.md these stay for the demo, visibly labelled. They are
 * `aria-disabled`, never `disabled`: a disabled button takes no focus, fires
 * no events, and so cannot tell anyone why it did nothing.
 *
 * Both affordances are needed. The tooltip is invisible on touch and silent to
 * a screen reader; the aria-live note is what makes a click legible to
 * everyone. Focus then moves to the email field — the path that does work.
 *
 * When a provider is wired, drop `demo` and its tag from that button only.
 */

const NOTE = "Demo version — sign in with email for now";

const PROVIDERS = [
  {
    name: "Google",
    mark: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.35" />
        <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A10 10 0 0 0 12 22" />
        <path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.06a10 10 0 0 0 0 9.02z" />
        <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87A10 10 0 0 0 3.06 7.49l3.35 2.6C7.2 7.72 9.4 5.96 12 5.96" />
      </svg>
    ),
  },
  {
    name: "Microsoft",
    mark: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#F25022" d="M2 2h9.4v9.4H2z" />
        <path fill="#7FBA00" d="M12.6 2H22v9.4h-9.4z" />
        <path fill="#00A4EF" d="M2 12.6h9.4V22H2z" />
        <path fill="#FFB900" d="M12.6 12.6H22V22h-9.4z" />
      </svg>
    ),
  },
  {
    name: "Apple",
    mark: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#111" d="M16.7 12.5c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.15-2.8.85-3.5.85s-1.85-.83-3-.81c-1.55.02-3 .9-3.8 2.29-1.62 2.8-.41 6.95 1.16 9.22.77 1.11 1.68 2.36 2.88 2.31 1.16-.05 1.6-.75 3-.75s1.79.75 3.01.72c1.24-.02 2.03-1.13 2.79-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.41-.93-2.4-3.68M14.4 5.4c.63-.77 1.06-1.83.94-2.9-.91.04-2.01.61-2.66 1.37-.58.68-1.09 1.77-.96 2.81 1.02.08 2.06-.52 2.68-1.28" />
      </svg>
    ),
  },
];

export default function SsoButtons({ emailFieldId }: { emailFieldId: string }) {
  const [showNote, setShowNote] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function handleDemoClick() {
    setShowNote(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShowNote(false), 4000);
    document.getElementById(emailFieldId)?.focus();
  }

  return (
    <>
      <div className={s.sso}>
        {PROVIDERS.map((p) => (
          <button
            key={p.name}
            type="button"
            className={`${s.ssoBtn} ${s.demo}`}
            aria-disabled="true"
            onClick={handleDemoClick}
          >
            <span className={s.g}>{p.mark}</span>
            <span className={s.lbl}>Continue with {p.name}</span>
            <span className={s.tag}>Demo</span>
            <span className={s.tip} role="tooltip">{NOTE}</span>
          </button>
        ))}
      </div>

      <p
        className={`${s.ssonote} ${showNote ? s.show : ""}`}
        role="status"
        aria-live="polite"
      >
        {showNote && (
          <>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 5a1.3 1.3 0 1 1 0 2.6A1.3 1.3 0 0 1 12 7m1.2 10.5h-2.4v-6h2.4z" />
            </svg>
            {NOTE}
          </>
        )}
      </p>
    </>
  );
}
