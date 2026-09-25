import { ogImage, ogAlt, OG_SIZE } from "@/components/site/og-image";
import { translate } from "@/lib/i18n/index.ts";

/* The Finnish card: the heading reads site.pricing.h1 and the subtitle its
   own key, both in Finnish. */
export const runtime = "edge";
export const alt = ogAlt("fi");
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage(translate("fi", "site.pricing.ogTag"), "fi");
}
