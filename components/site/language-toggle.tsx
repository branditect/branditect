"use client";

/**
 * The language toggle for the public site. Inbox 7b.
 *
 * IT CHANGES THE URL, NOT A COOKIE. `/fi/pricing` is a different page from
 * `/pricing`, which is the only way a Finnish marketing page can be found by
 * a Finnish company: one URL serving two languages is indexed as whichever
 * the crawler saw first.
 *
 * SAME TOGGLE AS THE APP'S. Two mechanisms underneath: routes here, a
 * cookie and a column behind the login: because they answer different
 * questions. What must match is this: the same two options, the same labels,
 * in the same place. `SITE_LOCALE_NAME` and `LOCALE_NAME` are asserted equal
 * by a test so they cannot drift into reading as two different features.
 *
 * NO AUTOMATIC REDIRECT, so both options are always here. Nothing reads
 * `Accept-Language`: sending a Finn to `/fi` from `/` makes the same URL
 * serve different people different pages, which is the cookie problem again.
 *
 * It renders nothing while `FI_COPY_READY` is false. Offering "Suomi" over a
 * page written in English is a promise the page does not keep, and a dead
 * control is worse than a missing one.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./site.module.css";
import {
  FI_COPY_READY, SITE_LOCALES, SITE_LOCALE_NAME, readSitePath, sitePath,
} from "@/lib/site-locale";

export default function LanguageToggle() {
  const pathname = usePathname();
  const here = readSitePath(pathname ?? "/");
  if (!FI_COPY_READY || !here) return null;

  return (
    <div className={s.langToggle} role="group" aria-label="Language">
      {SITE_LOCALES.map((l) => (
        <Link
          key={l}
          href={sitePath(l, here.page)}
          hrefLang={l}
          aria-current={l === here.locale ? "true" : undefined}
          className={l === here.locale ? s.langOn : s.langOff}
        >
          {SITE_LOCALE_NAME[l]}
        </Link>
      ))}
    </div>
  );
}
