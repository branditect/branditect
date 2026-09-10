import Localised from "@/lib/i18n/server.tsx";

/**
 * There is no brand yet on this screen, so the language comes from the cookie
 * alone — set on a previous visit, or English. A returning Finnish founder
 * signs in in Finnish; a new one sees English until onboarding asks.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Localised>{children}</Localised>;
}
