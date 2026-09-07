"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/auth-layout";
import AuthForm, { type AuthValues } from "@/components/auth/auth-form";
import { mapAuthError, type AuthError } from "@/lib/auth-errors";
import { supabase } from "@/lib/supabase";
import { routeAfterAuth } from "@/lib/post-auth";
import { withTimeout, mapThrown, POST_AUTH_FALLBACK } from "@/lib/auth-timeout";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<AuthError | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn({ email, password }: AuthValues) {
    setError(null);
    setLoading(true);

    try {
      // Bounded. An unbounded await here left the person watching a spinner
      // with no message and no way to tell whether it had worked — a promise
      // that never settles cannot be caught, only raced against a clock.
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        "Sign-in",
      );

      if (error) {
        // Raw driver strings never reach the user. mapAuthError also keeps a
        // wrong password and an unknown email on the same message, so neither
        // can be used to find out which emails have accounts.
        setError(mapAuthError(error));
        setLoading(false);
        return;
      }

      // not_started → /start, partial → /start/resume, gated_complete or
      // complete → /home. spec/onboarding.md.
      //
      // Bounded separately, and falls back rather than failing: by this point
      // they ARE signed in, so leaving them on the login form would be worse
      // than a slightly wrong destination.
      let destination = POST_AUTH_FALLBACK;
      try {
        destination = await withTimeout(routeAfterAuth(), "Routing");
      } catch {
        // Deliberately silent: they are signed in and going somewhere valid.
      }
      router.push(destination);
    } catch (e) {
      setError(mapThrown(e));
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <AuthForm mode="signin" onSubmit={handleSignIn} error={error} pending={loading} />
    </AuthLayout>
  );
}
