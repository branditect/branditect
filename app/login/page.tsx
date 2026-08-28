"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/auth-layout";
import AuthForm, { type AuthValues } from "@/components/auth/auth-form";
import { mapAuthError, type AuthError } from "@/lib/auth-errors";
import { supabase } from "@/lib/supabase";
import { routeAfterAuth } from "@/lib/post-auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<AuthError | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn({ email, password }: AuthValues) {
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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
    router.push(await routeAfterAuth());
  }

  return (
    <AuthLayout>
      <AuthForm mode="signin" onSubmit={handleSignIn} error={error} pending={loading} />
    </AuthLayout>
  );
}
