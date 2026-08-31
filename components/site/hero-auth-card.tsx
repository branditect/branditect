"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthForm, { type AuthValues } from "@/components/auth/auth-form";
import { mapAuthError, AUTH_COPY, type AuthError } from "@/lib/auth-errors";
import { supabase } from "@/lib/supabase";
import { ensureBrand } from "@/lib/brand-bootstrap";
import { routeAfterAuth } from "@/lib/post-auth";
import s from "./site.module.css";

export type Tab = "signup" | "login";

/**
 * The hero's right column. Signing in and signing up both happen on the front
 * page: a returning customer should not have to hunt for a Sign in link, and a
 * new visitor should see the first step is small.
 *
 * The form itself is components/auth/auth-form.tsx, unchanged. Rebuilding it
 * here would fork the validation, the identical-error rule that keeps a wrong
 * password and an unknown email indistinguishable, and the aria-disabled
 * handling on the SSO buttons. The tabs are the only thing this adds.
 *
 * /login and /signup stay exactly as they are. They are linked from emails and
 * the back button has to work, so this is an additional entrance rather than a
 * replacement.
 */
export default function HeroAuthCard({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const router = useRouter();
  const [error, setError] = useState<AuthError | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmSentTo, setConfirmSentTo] = useState<string | null>(null);

  // A tab change is a different form; the previous form's error is not about it.
  useEffect(() => { setError(null); }, [tab]);

  const handleSignIn = useCallback(async ({ email, password }: AuthValues) => {
    setError(null);
    setPending(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(mapAuthError(err)); setPending(false); return; }
    router.push(await routeAfterAuth());
  }, [router]);

  const handleSignUp = useCallback(async ({ email, password }: AuthValues) => {
    setError(null);
    setPending(true);
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err) { setError(mapAuthError(err)); setPending(false); return; }
    // Email confirmation is on, so sign-up returns no session. Routing into
    // /start here would discard everything they then typed.
    if (!data.session) { setConfirmSentTo(email); setPending(false); return; }
    await ensureBrand();
    router.push("/start");
  }, [router]);

  return (
    <aside className={s.authCard} id="auth">
      <span className={s.orb} aria-hidden="true" />
      <span className={s.orb2} aria-hidden="true" />

      <div className={s.tabs} role="tablist" aria-label="Sign up or log in">
        <button type="button" role="tab" aria-selected={tab === "signup"}
          className={tab === "signup" ? s.on : undefined} onClick={() => onTab("signup")}>
          Start free
        </button>
        <button type="button" role="tab" aria-selected={tab === "login"}
          className={tab === "login" ? s.on : undefined} onClick={() => onTab("login")}>
          Log in
        </button>
      </div>

      {confirmSentTo ? (
        <div style={{ padding: "10px 2px 6px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Check your email</h2>
          <p style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6, color: "#6f6f8a" }}>
            {AUTH_COPY.confirmSent}
          </p>
          <p style={{ marginTop: 12, fontSize: 13, fontWeight: 700 }}>{confirmSentTo}</p>
          <Link href="/login" className={s.btn} style={{ marginTop: 18, width: "100%" }}>
            Go to sign in
          </Link>
        </div>
      ) : (
        <AuthForm
          key={tab}
          mode={tab === "signup" ? "signup" : "signin"}
          onSubmit={tab === "signup" ? handleSignUp : handleSignIn}
          error={error}
          pending={pending}
        />
      )}
    </aside>
  );
}
