import type { Metadata } from "next";
import PricingClient from "../../pricing/pricing-client";
import { PLANS } from "@/lib/pricing-plans";
import { alternatesFor, FI_COPY_READY } from "@/lib/site-locale";
import { translate } from "@/lib/i18n/index.ts";

/* The Finnish pricing route. See app/(site)/fi/page.tsx for why it is a real
   route and why it is noindex until the copy lands. */
const FROM = PLANS.find((p) => p.id === "pro")!.monthly;

export const metadata: Metadata = {
  title: translate("fi", "site.pricing.metaTitle"),
  description:
    `Build your brand brain free, with 100 credits and no card. Plans from ${FROM} a month including VAT.`,
  alternates: alternatesFor("pricing", "fi"),
  robots: FI_COPY_READY ? undefined : { index: false, follow: true },
  openGraph: {
    title: translate("fi", "site.pricing.metaTitle"),
    description: `Build your brand brain free. Plans from ${FROM} a month including VAT.`,
    url: "/fi/pricing",
    type: "website",
  },
};

export default function FinnishPricingPage() {
  return <PricingClient locale="fi" />;
}
