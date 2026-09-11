"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/logo";
import LanguageToggle from "./language-toggle";
import { readSitePath, sitePath, type SiteLocale } from "@/lib/site-locale";
import s from "./site.module.css";

/**
 * One nav for the public site.
 *
 * On the landing page the three links are anchors into sections that are
 * already on screen; on /about and /pricing they are ordinary links back to
 * them. The same click must not do two different things depending on where you
 * are, which is why both forms point at the same three destinations.
 *
 * Log in and Start free carry ?auth=, which the landing page reads, so either
 * button opens the auth card on the matching tab from anywhere on the site.
 * A hash alone does not work: next/link navigates with pushState, which never
 * fires hashchange, so the card would never hear the click.
 *
 * There is no Product link. It had no page behind it, and a dead entry is
 * worse than a missing feature.
 *
 * EVERY LINK STAYS IN THE LANGUAGE YOU ARE IN: inbox 7b. On `/fi/pricing`,
 * "About" goes to `/fi/about`, not to `/about`. A nav that drops you back
 * into English on the second click is the same bug as having no Finnish
 * page: the language does not survive a navigation.
 */
export default function SiteNav() {
  const pathname = usePathname();
  const here = readSitePath(pathname ?? "/");
  const locale: SiteLocale = here?.locale ?? "en";
  const home = sitePath(locale, "home");
  const onLanding = here?.page === "home";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const href = (anchor: string, page: string) => (onLanding ? anchor : page);
  /* The auth card lives on the landing page of whichever language you are in. */
  const auth = (tab: string) => `${home}${home.endsWith("/") ? "" : "/"}?auth=${tab}#auth`
    .replace("//?", "/?");

  return (
    <nav className={`${s.nav} ${scrolled ? s.navScrolled : ""}`}>
      <div className={`${s.wrap} ${s.navIn}`}>
        {/* components/logo.tsx, never a hand-drawn mark. Five surfaces rolled
            their own before it existed, which is why it exists. */}
        <Link href={home} className={s.brand}>
          <Logo variant="mark" height={28} />
          Branditect
        </Link>
        <div className={s.links}>
          <Link href={href("#how", `${home === "/" ? "" : home}/#how`.replace("//", "/"))}>How it works</Link>
          <Link href={href("#pricing", sitePath(locale, "pricing"))}>Pricing</Link>
          <Link href={href("#about", sitePath(locale, "about"))}>About</Link>
        </div>
        <div className={s.navRight}>
          <LanguageToggle />
          <Link href={auth("login")} className={`${s.btn} ${s.ghost}`}>Log in</Link>
          <Link href={auth("signup")} className={s.btn}>Start free</Link>
        </div>
      </div>
    </nav>
  );
}
