import type { Metadata } from "next";
import LandingClient from "../landing-client";
import { alternatesFor, FI_COPY_READY } from "@/lib/site-locale";

/**
 * The Finnish landing page. Inbox 7b.
 *
 * A real route, not a cookie: a public page switched by cookie serves one URL
 * with two languages and search indexes whichever it saw first.
 *
 * It renders the same component as `/` and therefore the same English copy -
 * the ~70 marketing strings are the design side's and have not arrived. That
 * is why `FI_COPY_READY` is false and this page is `noindex`: a page indexed
 * as Finnish and written in English is the duplicate-content problem this
 * route exists to avoid, inverted. The hreflang below is wired now so that
 * flipping one constant turns the whole thing on.
 */
export const metadata: Metadata = {
  title: "Branditect · The commercial brain for your brand",
  description:
    "One place that holds your strategy, your product truth and your margins, so everything you publish is on brand, accurate and profitable. Build it free.",
  alternates: alternatesFor("home"),
  robots: FI_COPY_READY ? undefined : { index: false, follow: true },
  openGraph: {
    title: "Branditect · The commercial brain for your brand",
    description:
      "One place that holds your strategy, your product truth and your margins. Build it free.",
    url: "/fi",
    type: "website",
  },
};

export default function FinnishLandingPage() {
  return <LandingClient />;
}
