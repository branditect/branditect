import type { Metadata } from "next";
import { alternatesFor } from "@/lib/site-locale";
import { translate } from "@/lib/i18n/index.ts";
import PricingClient from "./pricing-client";
import { PLANS } from "@/lib/pricing-plans";

/* A server component so the page can carry metadata; the monthly and yearly
   toggle needs state, so the body of the page is the client half. */
const FROM = PLANS.find((p) => p.id === "pro")!.monthly!;

export const metadata: Metadata = {
  title: translate("en", "site.pricing.metaTitle"),
  description: translate("en", "site.pricing.metaDesc", { FROM }),
  alternates: alternatesFor("pricing"),
  openGraph: {
    title: translate("en", "site.pricing.metaTitle"),
    description: translate("en", "site.pricing.ogSub", { FROM }),
    url: "/pricing",
    type: "website",
  },
};

export default function PricingPage() {
  return <PricingClient locale="en" />;
}
