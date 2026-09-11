import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/site-locale";
import { DM_Mono } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
});

// The v6 base font. Body runs at 500 and meta at 400, so the full range is
// needed — loading 700/800 only silently faked every lighter weight.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  /**
   * Absolute URLs for canonical, hreflang and Open Graph.
   *
   * Without this Next emits them relative, and a relative `hreflang` is
   * ignored outright: the Finnish routes would exist and announce nothing.
   * It was already making the canonicals relative before inbox 7b; the
   * hreflang is what made it matter.
   */
  metadataBase: new URL(SITE_ORIGIN),
  title: "Branditect",
  description: "AI-powered brand operating system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${dmMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
