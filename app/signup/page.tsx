"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/auth-layout";
import AuthForm, { type AuthValues } from "@/components/auth/auth-form";
import { mapAuthError, AUTH_COPY, type AuthError } from "@/lib/auth-errors";
import { supabase } from "@/lib/supabase";
import { ensureBrand } from "@/lib/brand-bootstrap";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<AuthError | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmSentTo, setConfirmSentTo] = useState<string | null>(null);

  async function handleSignUp({ email, password }: AuthValues) {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(mapAuthError(error));
      setLoading(false);
      return;
    }

    // Email confirmation is on in this project, so sign-up returns a user and
    // NO session. Pushing into /start here would be a trap: with no session
    // there is no brand row, useBrand resolves to "default", and every answer
    // they typed would be written to nowhere and lost when they finally
    // confirm. Say what happened instead, and let sign-in route them in.
    if (!data.session) {
      setConfirmSentTo(email);
      setLoading(false);
      return;
    }

    // A brand row is what every /start screen writes against, and only the old
    // /onboarding wizard ever created one.
    await ensureBrand();
    router.push("/start");
  }

  if (confirmSentTo) {
    return (
      <AuthLayout>
        <section className="w-full max-w-[420px] rounded-panel border border-rule bg-card p-8 drop-shadow-panel">
          <h1 className="text-h2 font-bold tracking-[-0.5px]">Check your email</h1>
          <p className="mt-3 text-sm font-normal leading-[1.6] text-muted">
            {AUTH_COPY.confirmSent}
          </p>
          <p className="mt-4 text-sm font-semibold text-ink-2">{confirmSentTo}</p>
          <Link
            href="/login"
            className="mt-7 inline-block rounded-tile bg-grad-mark px-6 py-3 text-sm font-bold text-white drop-shadow-btn"
          >
            Go to sign in
          </Link>
        </section>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthForm mode="signup" onSubmit={handleSignUp} error={error} pending={loading} />
    </AuthLayout>
  );
}
