import type { Metadata } from "next";
import PricingClient from "../../pricing/pricing-client";
import { plansIn } from "@/lib/pricing-plans";
import { alternatesFor, FI_COPY_READY } from "@/lib/site-locale";
import { translate } from "@/lib/i18n/index.ts";

/* The Finnish pricing route. See app/(site)/fi/page.tsx for why it is a real
   route and why it is noindex until the copy lands. */
// The Finnish ladder, so the price reads "29,90 €" inside a Finnish sentence.
const FROM = plansIn("fi").find((p) => p.id === "pro")!.monthly!;

export const metadata: Metadata = {
  title: translate("fi", "site.pricing.metaTitle"),
  description: translate("fi", "site.pricing.metaDesc", { FROM }),
  alternates: alternatesFor("pricing", "fi"),
  robots: FI_COPY_READY ? undefined : { index: false, follow: true },
  openGraph: {
    title: translate("fi", "site.pricing.metaTitle"),
    description: translate("fi", "site.pricing.ogSub", { FROM }),
    url: "/fi/pricing",
    type: "website",
  },
};

export default function FinnishPricingPage() {
  return <PricingClient locale="fi" />;
}
