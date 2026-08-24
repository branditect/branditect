"use client";

import { useState } from "react";
import s from "./auth.module.css";

/**
 * Password input with a reveal toggle.
 *
 * The toggle is `type="button"` on purpose — inside a form a bare <button>
 * submits it, so revealing the password would post the form.
 */
export default function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  describedBy,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  const [shown, setShown] = useState(false);

  return (
    <div className={s.field}>
      <label htmlFor={id}>{label}</label>
      <div className={s.inp}>
        <input
          id={id}
          name={id}
          type={shown ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
        />
        <button
          type="button"
          className={s.eye}
          aria-label={shown ? "Hide password" : "Show password"}
          onClick={() => setShown((v) => !v)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {shown ? (
              <path d="M12 4.6c-4.7 0-8.5 3.2-10.2 6.6a1.8 1.8 0 0 0 0 1.6C3.5 16.2 7.3 19.4 12 19.4c1.5 0 2.9-.33 4.16-.88l-1.7-1.7c-.76.25-1.58.38-2.46.38-3.5 0-6.5-2.4-8-5.2a11.3 11.3 0 0 1 3.1-3.5L5.7 7.3A1.1 1.1 0 0 1 7.25 5.75l11 11A1.1 1.1 0 0 1 16.7 18.3zm0 3.3c2.26 0 4.1 1.84 4.1 4.1 0 .5-.09.98-.26 1.42l-5.26-5.26c.44-.17.92-.26 1.42-.26m7.9 7.3-1.62-1.62c.6-.66 1.12-1.4 1.52-2.18-1.5-2.8-4.5-5.2-8-5.2-.3 0-.6.02-.89.05L9.3 4.94c.87-.22 1.77-.34 2.7-.34 4.7 0 8.5 3.2 10.2 6.6a1.8 1.8 0 0 1 0 1.6c-.5 1-1.2 1.98-2.05 2.84z" />
            ) : (
              <path d="M12 4.6c-4.7 0-8.5 3.2-10.2 6.6a1.8 1.8 0 0 0 0 1.6C3.5 16.2 7.3 19.4 12 19.4s8.5-3.2 10.2-6.6a1.8 1.8 0 0 0 0-1.6C20.5 7.8 16.7 4.6 12 4.6m0 3.3a4.1 4.1 0 1 1 0 8.2 4.1 4.1 0 0 1 0-8.2m0 2.2a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
