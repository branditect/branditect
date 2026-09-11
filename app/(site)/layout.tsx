import SiteNav from "@/components/site/site-nav";
import SiteFooter from "@/components/site/site-footer";
import s from "@/components/site/site.module.css";

/**
 * The public site shell. A sibling of (app), so it inherits none of the
 * sidebar chrome.
 *
 * The footer moved into its own client component for inbox 7b: its links
 * have to stay in the language you are in, and that needs the pathname.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.site}>
      <SiteNav />
      {children}
      <SiteFooter />
    </div>
  );
}
