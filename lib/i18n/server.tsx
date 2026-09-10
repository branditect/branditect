/**
 * The server half: read the cookie once, per section, and hand the locale down
 * as a prop.
 *
 * This is a server component on purpose. `cookies()` makes the section it sits
 * in dynamic, which every section that uses it already is — they are all
 * behind a login. The marketing site under app/(site) does not use it and
 * stays static, which is the whole reason this is not in the root layout.
 */
import { cookies } from "next/headers";
import { toLocale, LOCALE_COOKIE, type Locale } from "./index.ts";
import { I18nProvider } from "./use-t.tsx";

export function localeFromCookies(): Locale {
  return toLocale(cookies().get(LOCALE_COOKIE)?.value);
}

export default function Localised({ children }: { children: React.ReactNode }) {
  return <I18nProvider locale={localeFromCookies()}>{children}</I18nProvider>;
}
