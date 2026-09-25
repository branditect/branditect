import type { Metadata } from "next";
import { alternatesFor, FI_COPY_READY } from "@/lib/site-locale";
import { translate } from "@/lib/i18n/index.ts";
import AboutBody from "../../about/about-body";

/**
 * The Finnish about route. See app/(site)/fi/page.tsx for why it is a real
 * route and why it is noindex until the copy lands.
 *
 * The body is app/(site)/about/about-body.tsx, shared with `/about` and given
 * the locale as a prop, rather than 250 copied lines that would then drift.
 */
export const metadata: Metadata = {
  title: translate("fi", "site.about.metaTitle"),
  description: translate("fi", "site.about.metaDesc"),
  alternates: alternatesFor("about", "fi"),
  robots: FI_COPY_READY ? undefined : { index: false, follow: true },
  openGraph: {
    title: translate("fi", "site.about.metaTitle"),
    description: translate("fi", "site.about.ogSub"),
    url: "/fi/about",
    type: "website",
  },
};

export default function FinnishAboutPage() {
  return <AboutBody locale="fi" />;
}
