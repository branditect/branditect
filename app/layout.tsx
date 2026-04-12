import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import { Manrope } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
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
      <body className={`${dmSans.variable} ${dmMono.variable} ${manrope.variable} ${jakarta.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
