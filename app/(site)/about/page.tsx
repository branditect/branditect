import type { Metadata } from "next";
import { alternatesFor } from "@/lib/site-locale";
import { translate } from "@/lib/i18n/index.ts";
import AboutBody from "./about-body";

export const metadata: Metadata = {
  title: translate("en", "site.about.metaTitle"),
  description: translate("en", "site.about.metaDesc"),
  alternates: alternatesFor("about"),
  openGraph: {
    title: translate("en", "site.about.metaTitle"),
    description: translate("en", "site.about.ogSub"),
    url: "/about",
    type: "website",
  },
};

export default function AboutPage() {
  return <AboutBody locale="en" />;
}
