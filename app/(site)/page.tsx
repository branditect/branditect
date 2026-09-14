import type { Metadata } from "next";
import { alternatesFor } from "@/lib/site-locale";
import { translate } from "@/lib/i18n/index.ts";
import LandingClient from "./landing-client";

export const metadata: Metadata = {
  title: translate("en", "site.home.metaTitle"),
  description:
    "One place that holds your strategy, your product truth and your margins, so everything you publish is on brand, accurate and profitable. Build it free.",
  alternates: alternatesFor("home"),
  openGraph: {
    title: translate("en", "site.home.metaTitle"),
    description:
      "One place that holds your strategy, your product truth and your margins. Build it free.",
    url: "/",
    type: "website",
  },
};

export default function LandingPage() {
  return <LandingClient locale="en" />;
}
