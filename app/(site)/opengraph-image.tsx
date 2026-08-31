import { ogImage, OG_SIZE, OG_ALT } from "@/components/site/og-image";

export const runtime = "edge";
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage("One place that knows your strategy, your products and your margins.");
}
