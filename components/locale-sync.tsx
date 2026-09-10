"use client";

/**
 * Keeps the locale cookie in step with the brand's `interface_language`.
 *
 * Mounted once in the app shell. The cookie is what the server layout reads,
 * so this is what makes a person who set Finnish on another machine get
 * Finnish here — from the second paint, not the first. Changing the language
 * of the page under someone mid-read would be worse than one navigation in the
 * wrong language, so it deliberately does not re-render.
 */
import { useBrand } from "@/lib/useBrand";
import { useBrandLocale } from "@/lib/i18n/use-t.tsx";

export default function LocaleSync() {
  const { brand } = useBrand();
  useBrandLocale((brand as { interface_language?: string } | null)?.interface_language);
  return null;
}
