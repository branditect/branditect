import Link from "next/link";
import SiteNav from "@/components/site/site-nav";
import s from "@/components/site/site.module.css";

/**
 * The public site shell. A sibling of (app), so it inherits none of the
 * sidebar chrome.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.site}>
      <SiteNav />
      {children}
      <footer className={s.footer}>
        <div className={`${s.wrap} ${s.footIn}`}>
          <span>© 2026 Branditect</span>
          <Link href="/about">About</Link>
          <Link href="/pricing">Pricing</Link>
          <a href="mailto:hello@branditect.io">Contact</a>
          <span className={s.footSp}>Made in Finland</span>
        </div>
      </footer>
    </div>
  );
}
