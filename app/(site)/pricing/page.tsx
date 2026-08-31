import type { Metadata } from "next";
import PricingClient from "./pricing-client";
import { PLANS } from "@/lib/pricing-plans";

/* A server component so the page can carry metadata; the monthly and yearly
   toggle needs state, so the body of the page is the client half. */
const FROM = PLANS.find((p) => p.id === "pro")!.monthly;

export const metadata: Metadata = {
  title: "Pricing · Branditect",
  description:
    `Build your brand brain free, with 100 credits and no card. Plans from ${FROM} a month including VAT.`,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing · Branditect",
    description: `Build your brand brain free. Plans from ${FROM} a month including VAT.`,
    url: "/pricing",
    type: "website",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
