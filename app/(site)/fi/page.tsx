import type { Metadata } from "next";
import LandingClient from "../landing-client";
import { alternatesFor, FI_COPY_READY } from "@/lib/site-locale";
import { translate } from "@/lib/i18n/index.ts";

/**
 * The Finnish landing page. Inbox 7b.
 *
 * A real route, not a cookie: a public page switched by cookie serves one URL
 * with two languages and search indexes whichever it saw first.
 *
 * It renders the same component as `/` with `locale="fi"`, so every string
 * that has a `site.*` key comes from lib/i18n/fi.ts. The body copy that has
 * no key yet is still English, which is why this stays `noindex` until
 * `FI_COPY_READY` is true: see lib/site-locale.ts.
 *
 * The description is English for the same reason: it has no key.
 */
export const metadata: Metadata = {
  title: translate("fi", "site.home.metaTitle"),
  description:
    "One place that holds your strategy, your product truth and your margins, so everything you publish is on brand, accurate and profitable. Build it free.",
  alternates: alternatesFor("home", "fi"),
  robots: FI_COPY_READY ? undefined : { index: false, follow: true },
  openGraph: {
    title: translate("fi", "site.home.metaTitle"),
    description:
      "One place that holds your strategy, your product truth and your margins. Build it free.",
    url: "/fi",
    type: "website",
  },
};

export default function FinnishLandingPage() {
  return <LandingClient locale="fi" />;
}
