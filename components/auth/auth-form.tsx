"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/logo";
import PasswordField from "./password-field";
import SsoButtons from "./sso-buttons";
import { AUTH_COPY, MIN_PASSWORD, looksLikeEmail, type AuthError } from "@/lib/auth-errors";
import s from "./auth.module.css";
import { useT } from "@/lib/i18n/use-t.tsx";

export interface AuthValues {
  email: string;
  password: string;
}

/**
 * The frosted card. One component, two modes — /login and /signup are separate
 * routes so the back button works and either can be linked directly.
 *
 * The submit button is disabled only while in flight, never because the form
 * looks invalid: disabling it up front hides the reason nothing is happening.
 */
export default function AuthForm({
  mode,
  onSubmit,
  error,
  pending,
}: {
  mode: "signin" | "signup";
  onSubmit: (values: AuthValues) => Promise<void>;
  error?: AuthError | null;
  pending?: boolean;
}) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const isSignup = mode === "signup";

  function validate(): boolean {
    const next: { email?: string; password?: string } = {};

    if (!email.trim()) next.email = AUTH_COPY.emptyEmail;
    else if (!looksLikeEmail(email)) next.email = AUTH_COPY.badEmail;

    if (!password) next.password = AUTH_COPY.emptyPassword;
    // Length is only enforced on sign-up — old accounts may predate the rule.
    else if (isSignup && password.length < MIN_PASSWORD) next.password = AUTH_COPY.shortPassword;

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!validate()) return;
    // Trim and lowercase before submit, per spec.
    await onSubmit({ email: email.trim().toLowerCase(), password });
  }

  return (
    <section className={s.login}>
      <span className={s.orb} aria-hidden="true" />

      <div className={s.brand}>
        <Logo height={32} />
      </div>

      <h1 className={s.title}>{isSignup ? t("auth.createAccount") : t("auth.welcomeBack")}</h1>
      <p className={s.sub}>
        {isSignup ? t("auth.startBuilding") : t("auth.logInToWorkspace")}
      </p>

      <SsoButtons emailFieldId="email" />

      <div className={s.or}>{t("auth.orContinueEmail")}</div>

      <form onSubmit={handleSubmit} noValidate>
        <div className={s.field}>
          <label htmlFor="email">{t("auth.email")}</label>
          <div className={s.inp}>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder={t("auth.emailPlaceholder")}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              aria-invalid={fieldErrors.email ? true : undefined}
            />
            <span className={s.ic}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5zm2.2-.3 6.8 5 6.8-5z" />
              </svg>
            </span>
          </div>
          {fieldErrors.email && (
            <p className={s.fieldError} id="email-error" role="alert">{fieldErrors.email}</p>
          )}
        </div>

        <PasswordField
          id="password"
          label={t("auth.password")}
          value={password}
          onChange={setPassword}
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder={isSignup ? t("auth.minChars", { MIN_PASSWORD }) : t("auth.enterPassword")}
          describedBy={fieldErrors.password ? "password-error" : undefined}
          invalid={Boolean(fieldErrors.password)}
        />
        {fieldErrors.password && (
          <p className={s.fieldError} id="password-error" role="alert">{fieldErrors.password}</p>
        )}

        {/* Two controls from the reference are deliberately absent.

            Remember me: it changes session lifetime and nothing wires it.
            Unlike a Demo tag on an SSO button there is no honest label — the
            user would simply believe they will stay signed in.

            Forgot password: /forgot-password does not exist yet, and a link
            that 404s is the same dead control this design removes everywhere
            else. Restore it in the same change that adds the route. */}
        <div className={s.spacer} />

        {error && (
          <p className={s.formError} role="alert" aria-live="polite">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 5a1.3 1.3 0 1 1 0 2.6A1.3 1.3 0 0 1 12 7m1.2 10.5h-2.4v-6h2.4z" />
            </svg>
            <span>
              {error.message}
              {error.linkHref && (
                <>
                  {" "}
                  <Link href={error.linkHref}>{error.linkLabel}</Link>
                </>
              )}
            </span>
          </p>
        )}

        <button className={s.submit} type="submit" disabled={pending} aria-busy={pending}>
          {pending ? (isSignup ? t("auth.creatingAccount") : t("auth.signingIn")) : isSignup ? t("auth.createAccountBtn") : t("auth.logIn")}
          {!pending && (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M13.06 4.4a1.3 1.3 0 0 0-1.84 1.84L16.98 12l-5.76 5.76a1.3 1.3 0 1 0 1.84 1.84l6.68-6.68a1.3 1.3 0 0 0 0-1.84z" />
            </svg>
          )}
        </button>
      </form>

      <p className={s.swap}>
        {isSignup ? (
          <>{t("auth.haveAccount")} <Link href="/login">{t("auth.logIn")}</Link></>
        ) : (
          <>{t("auth.noAccount")} <Link href="/signup">{t("auth.createOne")}</Link></>
        )}
      </p>
    </section>
  );
}
