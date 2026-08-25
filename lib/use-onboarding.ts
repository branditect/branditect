"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBrand } from "@/lib/useBrand";
import { supabase } from "@/lib/supabase";
import { loadOnboarding, createOnboardingWriter } from "@/lib/onboarding-db";
import { attachFlushTriggers, type SaveState, type OnboardingWriter } from "@/lib/onboarding-store";
import {
  EMPTY_ONBOARDING, applyAnswer, applyProfile, applySkip, applyVoice,
  type OnboardingState, type Profile,
} from "@/lib/onboarding";
import type { ArchetypeId } from "@/lib/onboarding-questions";

/**
 * One hook per screen. State is loaded from the onboarding row (merged with the
 * local mirror), and every change goes through the writer — debounced, forced
 * on blur and navigation, error-checked.
 */
export function useOnboarding() {
  const { brandId, loading: brandLoading } = useBrand();
  const [state, setState] = useState<OnboardingState>(EMPTY_ONBOARDING);
  const [loading, setLoading] = useState(true);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [loadError, setLoadError] = useState<string | null>(null);
  const writerRef = useRef<OnboardingWriter | null>(null);

  useEffect(() => {
    if (brandLoading) return;
    // Resolved with no brand: clear the flag so the screen renders rather than
    // spinning forever — the same trap that made /brand/strategy unreachable.
    if (!brandId || brandId === "default") { setLoading(false); return; }

    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { state: loaded, error } = await loadOnboarding(brandId);
      if (!alive) return;
      setState(loaded);
      setLoadError(error ?? null);
      setLoading(false);

      const w = createOnboardingWriter(brandId, user?.id ?? null, setSave);
      writerRef.current = w;
    })();
    return () => { alive = false; };
  }, [brandId, brandLoading]);

  useEffect(() => {
    const w = writerRef.current;
    if (!w) return;
    return attachFlushTriggers(w);
  }, [loading]);

  useEffect(() => () => { writerRef.current?.dispose(); }, []);

  const commit = useCallback((next: OnboardingState) => {
    setState(next);
    writerRef.current?.queue(next);
  }, []);

  /** Forced write — blur, and before any navigation. */
  const flush = useCallback(async () => { await writerRef.current?.flush(); }, []);

  return {
    state, loading: loading || brandLoading, save, loadError, brandId,
    setAnswer: (n: number, text: string) => commit(applyAnswer(state, n, text)),
    skip: (n: number) => commit(applySkip(state, n)),
    setProfile: (p: Profile) => commit(applyProfile(state, p)),
    setVoice: (primary: ArchetypeId, secondary: ArchetypeId | null = null) =>
      commit(applyVoice(state, primary, secondary)),
    flush,
  };
}
