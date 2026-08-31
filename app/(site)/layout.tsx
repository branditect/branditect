import Link from "next/link";
import Logo from "@/components/logo";
import s from "@/components/site/site.module.css";

/**
 * The public site shell. A sibling of (app), so it inherits none of the
 * sidebar chrome.
 *
 * The nav carries only pages that exist. A dead entry is worse than a missing
 * feature, and that rule applies here as much as it does inside the product.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.site}>
      <nav className={s.nav}>
        <div className={`${s.wrap} ${s.navIn}`}>
          {/* components/logo.tsx, never a hand-drawn mark. Five surfaces rolled
              their own before it existed, which is why it exists. */}
          <Link href="/" className={s.brand}>
            <Logo variant="mark" height={26} />
            Branditect
          </Link>
          <div className={s.links}>
            <Link href="/pricing">Pricing</Link>
            <Link href="/about">About</Link>
            <Link href="/about#how">How it works</Link>
          </div>
          <div className={s.navRight}>
            <Link href="/login" className={`${s.btn} ${s.ghost}`}>Sign in</Link>
            <Link href="/signup" className={s.btn}>Start free</Link>
          </div>
        </div>
      </nav>

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
