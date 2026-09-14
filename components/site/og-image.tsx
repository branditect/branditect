import { ImageResponse } from "next/og";
import { translate, type Locale } from "@/lib/i18n/index.ts";
import { PRICING_H1_BREAK_AFTER } from "@/lib/site-locale";

/**
 * The card every link to the public site renders in a Slack channel or a
 * WhatsApp group. Generated rather than shipped as a file, so it cannot drift
 * from the wording on the pages.
 *
 * Each public segment has its own opengraph-image.tsx calling this. One file
 * at the group level is not enough: a segment that declares its own openGraph
 * metadata overrides the inherited image and ends up with none, which is how
 * /about and /pricing were shipping without a card.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = "Branditect, the commercial brain for your brand";

export function ogImage(subtitle: string, locale: Locale = "en") {
  /* The same sentence as the pricing heading, broken at the same word for the
     same reason: Finnish puts "Brändisi" first. See PRICING_H1_BREAK_AFTER. */
  const words = translate(locale, "site.pricing.h1").split(" ");
  const cut = PRICING_H1_BREAK_AFTER[locale];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "0 90px", background: "#F4F3F2", color: "#15151B",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 54, height: 54, borderRadius: 27, background: "linear-gradient(135deg, #F2773B, #FE4401)" }} />
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>Branditect</div>
        </div>
        <div style={{ fontSize: 74, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05, marginTop: 34 }}>
          {words.slice(0, cut).join(" ")}
        </div>
        <div style={{ fontSize: 74, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05, color: "#F0562A" }}>
          {words.slice(cut).join(" ")}
        </div>
        <div style={{ fontSize: 30, color: "#6F6F8A", marginTop: 30, maxWidth: 900, lineHeight: 1.4 }}>
          {subtitle}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
