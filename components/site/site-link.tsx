"use client";

/**
 * A link to another public page, in the language you are already in.
 *
 * Inbox 7b. The nav and the footer were made locale-aware first, and the
 * page bodies were still sending people to `/about` and `/?auth=signup` from
 * `/fi`. One English link inside the copy undoes the route the page just
 * used, and it is the second click, which nobody checks.
 *
 * A client component so `app/(site)/about/about-body.tsx` can use it too: it
 * is a server component rendered from both `/about` and `/fi/about`, so it
 * cannot be told which it is except by asking the pathname here.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { readSitePath, sitePath, type SitePage, type SiteLocale } from "@/lib/site-locale";

export default function SiteLink({
  page, auth, hash, className, children,
}: {
  page: SitePage;
  /** Opens the auth card on the landing page of this language. */
  auth?: "login" | "signup";
  hash?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale: SiteLocale = readSitePath(pathname ?? "/")?.locale ?? "en";
  const base = sitePath(locale, page);
  const href = `${base}${auth ? `?auth=${auth}` : ""}${hash ? `#${hash}` : auth ? "#auth" : ""}`;

  return <Link href={href} className={className}>{children}</Link>;
}
