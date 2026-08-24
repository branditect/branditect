"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/auth-layout";
import AuthForm, { type AuthValues } from "@/components/auth/auth-form";
import { mapAuthError, type AuthError } from "@/lib/auth-errors";
import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<AuthError | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp({ email, password }: AuthValues) {
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(mapAuthError(error));
      setLoading(false);
      return;
    }

    router.push("/home");
  }

  return (
    <AuthLayout>
      <AuthForm mode="signup" onSubmit={handleSignUp} error={error} pending={loading} />
    </AuthLayout>
  );
}
