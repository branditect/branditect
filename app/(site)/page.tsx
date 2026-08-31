import type { Metadata } from "next";
import LandingClient from "./landing-client";

export const metadata: Metadata = {
  title: "Branditect · The commercial brain for your brand",
  description:
    "One place that holds your strategy, your product truth and your margins, so everything you publish is on brand, accurate and profitable. Build it free.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Branditect · The commercial brain for your brand",
    description:
      "One place that holds your strategy, your product truth and your margins. Build it free.",
    url: "/",
    type: "website",
  },
};

export default function LandingPage() {
  return <LandingClient />;
}
