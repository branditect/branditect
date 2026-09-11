import type { Metadata } from "next";
import { alternatesFor, FI_COPY_READY } from "@/lib/site-locale";

/**
 * The Finnish about route. See app/(site)/fi/page.tsx for why it is a real
 * route and why it is noindex until the copy lands.
 *
 * The English about page is a server component with its body inline rather
 * than split into a client half, so this re-exports it rather than copying
 * 250 lines that would then drift. Its `metadata` is not re-exported: the
 * one below replaces it, which is the whole point of the file.
 */
export { default } from "../../about/page";

export const metadata: Metadata = {
  title: "About · Branditect",
  description:
    "Branditect is one place that knows your brand strategy, your products and your margins, and makes things from them. Built in Finland, on EU infrastructure.",
  alternates: alternatesFor("about"),
  robots: FI_COPY_READY ? undefined : { index: false, follow: true },
  openGraph: {
    title: "About · Branditect",
    description:
      "One place that knows your strategy, your products and your margins, and makes things from them.",
    url: "/fi/about",
    type: "website",
  },
};
