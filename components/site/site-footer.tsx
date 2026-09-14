"use client";

/**
 * The public footer. Split out of the layout for inbox 7b.
 *
 * Its two links have to stay in the language you are in, the same as the
 * nav's: a footer that drops you back into English on `/fi/about` undoes the
 * route the page just used.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { readSitePath, sitePath, type SiteLocale } from "@/lib/site-locale";
import { translate } from "@/lib/i18n/index.ts";
import s from "./site.module.css";

export default function SiteFooter() {
  const pathname = usePathname();
  const locale: SiteLocale = readSitePath(pathname ?? "/")?.locale ?? "en";

  return (
    <footer className={s.footer}>
      <div className={`${s.wrap} ${s.footIn}`}>
        <span>© 2026 Branditect</span>
        <Link href={sitePath(locale, "about")}>{translate(locale, "site.nav.about")}</Link>
        <Link href={sitePath(locale, "pricing")}>{translate(locale, "site.nav.pricing")}</Link>
        <a href="mailto:hello@branditect.io">Contact</a>
        <span className={s.footSp}>Made in Finland</span>
      </div>
    </footer>
  );
}
