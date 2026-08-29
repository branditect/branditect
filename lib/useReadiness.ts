"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { computeReadiness, questionnairePassed, type Readiness } from "@/lib/readiness";
import type { Status } from "@/lib/onboarding";

export interface KnowledgeCounts {
  documents: number;
  images: number;
  products: number;
  presentations: number;
  links: number;
}

const EMPTY_COUNTS: KnowledgeCounts = {
  documents: 0,
  images: 0,
  products: 0,
  presentations: 0,
  links: 0,
};

const PRESENTATION_TYPES = ["ppt", "pptx", "key", "odp"];

/**
 * One query pass, one Readiness object.
 *
 * The hero and the What's next panel both read what this returns. They must
 * never fetch separately — that is how the old app ended up with a hero
 * claiming 87% beside a panel listing three unfinished things.
 */
/** A workspace with nothing in it yet — four checks, all actionable. */
const ZERO_STATE = computeReadiness({
  questionnaireComplete: false,
  knowledgeFileCount: 0,
  brandImageCount: 0,
  hasBrandGuideline: false,
});

export function useReadiness(brandId: string) {
  // Starts at the zero state rather than null. Supabase resolves with an
  // error object instead of rejecting, so a failed or empty query would
  // otherwise leave the hero on a skeleton that never resolves. Zero is both
  // honest and actionable; the real numbers overwrite it a moment later.
  const [readiness, setReadiness] = useState<Readiness>(ZERO_STATE);
  const [counts, setCounts] = useState<KnowledgeCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;

    async function load() {
      const count = { count: "exact" as const, head: true };

      const [onboarding, docs, presentations, images, brandImages, products, links, visual] =
        await Promise.all([
          // The `onboarding` table, not `brand_strategies`. This used to read
          // isQuestionnaireComplete from the retired 38-question module against
          // the old strategy_questions answers, which the new questionnaire
          // never writes — so finishing it left the check unticked and Brand
          // Readiness stuck on 0% for that quarter whatever anyone did.
          supabase
            .from("onboarding")
            .select("status")
            .eq("brand_id", brandId)
            .maybeSingle(),
          supabase
            .from("brand_documents")
            .select("*", count)
            .eq("brand_id", brandId)
            .not("file_type", "in", `(${PRESENTATION_TYPES.join(",")})`),
          supabase
            .from("brand_documents")
            .select("*", count)
            .eq("brand_id", brandId)
            .in("file_type", PRESENTATION_TYPES),
          supabase.from("brand_images").select("*", count).eq("brand_id", brandId),
          // The readiness check counts only product and brand images — the
          // `category` enum on brand_images already carries exactly these.
          supabase
            .from("brand_images")
            .select("*", count)
            .eq("brand_id", brandId)
            .in("category", ["product", "brand"]),
          supabase.from("catalog_products").select("*", count).eq("brand_id", brandId),
          supabase.from("brand_templates").select("*", count).eq("brand_id", brandId),
          supabase
            .from("brand_visual")
            .select("guideline_url")
            .eq("brand_id", brandId)
            .maybeSingle(),
        ]);

      if (cancelled) return;

      const documents = docs.count ?? 0;
      const presentationCount = presentations.count ?? 0;
      const linkCount = links.count ?? 0;

      setCounts({
        documents,
        images: images.count ?? 0,
        products: products.count ?? 0,
        presentations: presentationCount,
        links: linkCount,
      });

      setReadiness(
        computeReadiness({
          questionnaireComplete: questionnairePassed(
            onboarding.data?.status as Status | undefined,
          ),
          // "Files in Knowledge" is documents + presentations + links.
          knowledgeFileCount: documents + presentationCount + linkCount,
          brandImageCount: brandImages.count ?? 0,
          hasBrandGuideline: Boolean(visual.data?.guideline_url),
        }),
      );
      setLoading(false);
    }

    load().catch(() => {
      if (cancelled) return;
      setCounts(EMPTY_COUNTS);
      setReadiness(ZERO_STATE);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [brandId]);

  return { readiness, counts, loading };
}
