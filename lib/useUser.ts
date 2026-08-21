"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface AppUser {
  /** Best available display name, already trimmed to a first name. */
  firstName: string | null;
  fullName: string | null;
  email: string | null;
  initials: string;
}

function toFirstName(full: string): string {
  return full.trim().split(/\s+/)[0];
}

function initialsFor(full: string | null, email: string | null): string {
  if (full) {
    return full
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

/**
 * The signed-in person, as distinct from the brand. The greeting addresses a
 * human — using the brand name there produced "Good afternoon, Your".
 */
export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (cancelled) return;
        const u = data.user;
        if (!u) {
          setLoading(false);
          return;
        }
        const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
        const fullName =
          (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          null;
        const email = u.email ?? null;

        setUser({
          fullName,
          email,
          firstName: fullName ? toFirstName(fullName) : email ? email.split("@")[0] : null,
          initials: initialsFor(fullName, email),
        });
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}
