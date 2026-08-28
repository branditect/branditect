"use client";

import { useEffect } from "react";
import { ensureBrand } from "@/lib/brand-bootstrap";

/**
 * Renders nothing. Guarantees a brand row exists before any /start screen
 * writes an answer.
 *
 * Signup awaits ensureBrand itself, but someone can reach /start from Brand
 * Readiness, from the welcome modal, or by typing the URL — and an account
 * created before this existed has no brand at all. Without a row, useBrand
 * resolves to "default" and every answer is discarded silently.
 */
export default function EnsureBrand() {
  useEffect(() => {
    let alive = true;
    ensureBrand().then((r) => {
      if (alive && r.error) console.error("[start] brand bootstrap failed:", r.error);
    });
    return () => {
      alive = false;
    };
  }, []);
  return null;
}
