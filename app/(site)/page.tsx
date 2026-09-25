import type { Metadata } from "next";
import { alternatesFor } from "@/lib/site-locale";
import { translate } from "@/lib/i18n/index.ts";
import LandingClient from "./landing-client";

export const metadata: Metadata = {
  title: translate("en", "site.home.metaTitle"),
  description: translate("en", "site.home.metaDesc"),
  alternates: alternatesFor("home"),
  openGraph: {
    title: translate("en", "site.home.metaTitle"),
    description: translate("en", "site.home.ogSub"),
    url: "/",
    type: "website",
  },
};

export default function LandingPage() {
  return <LandingClient locale="en" />;
}
