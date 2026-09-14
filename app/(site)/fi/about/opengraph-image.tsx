import { ogImage, OG_SIZE, OG_ALT } from "@/components/site/og-image";

/* The Finnish card. Its heading reads site.pricing.h1 in Finnish; the
   subtitle has no key yet and is on branditect-ui/spec/i18n-gap-site.md. */
export const runtime = "edge";
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage("What it is, what it will not do, and who it is for.", "fi");
}
