"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/logo";
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
 */
export default function SiteNav() {
  const pathname = usePathname();
  const onLanding = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const href = (anchor: string, page: string) => (onLanding ? anchor : page);

  return (
    <nav className={`${s.nav} ${scrolled ? s.navScrolled : ""}`}>
      <div className={`${s.wrap} ${s.navIn}`}>
        {/* components/logo.tsx, never a hand-drawn mark. Five surfaces rolled
            their own before it existed, which is why it exists. */}
        <Link href="/" className={s.brand}>
          <Logo variant="mark" height={28} />
          Branditect
        </Link>
        <div className={s.links}>
          <Link href={href("#how", "/#how")}>How it works</Link>
          <Link href={href("#pricing", "/pricing")}>Pricing</Link>
          <Link href={href("#about", "/about")}>About</Link>
        </div>
        <div className={s.navRight}>
          <Link href="/?auth=login#auth" className={`${s.btn} ${s.ghost}`}>Log in</Link>
          <Link href="/?auth=signup#auth" className={s.btn}>Start free</Link>
        </div>
      </div>
    </nav>
  );
}
