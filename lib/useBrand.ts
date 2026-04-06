"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Brand {
  id: string;
  brand_id: string;
  brand_name: string;
  website: string | null;
  industry: string | null;
  logo_url: string | null;
  colors: { hex: string; name: string }[] | null;
}

interface UseBrandReturn {
  brand: Brand | null;
  brandId: string;
  brandName: string;
  loading: boolean;
}

let cachedBrand: Brand | null = null;

export function useBrand(): UseBrandReturn {
  const [brand, setBrand] = useState<Brand | null>(cachedBrand);
  const [loading, setLoading] = useState(!cachedBrand);

  useEffect(() => {
    if (cachedBrand) {
      setBrand(cachedBrand);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data } = await supabase
          .from("brands")
          .select("*")
          .eq("user_id", user.id)
          .eq("onboarding_completed", true)
          .limit(1)
          .maybeSingle();

        if (data) {
          cachedBrand = data as Brand;
          setBrand(cachedBrand);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return {
    brand,
    brandId: brand?.brand_id || "default",
    brandName: brand?.brand_name || "Your Brand",
    loading,
  };
}

// For clearing cache on logout or brand switch
export function clearBrandCache() {
  cachedBrand = null;
}
