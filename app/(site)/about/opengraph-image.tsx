import { ogImage, ogAlt, OG_SIZE } from "@/components/site/og-image";
import { translate } from "@/lib/i18n/index.ts";

export const runtime = "edge";
export const alt = ogAlt();
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage(translate("en", "site.about.ogTag"));
}
