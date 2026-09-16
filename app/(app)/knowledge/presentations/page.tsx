import NotBuiltYet from "@/components/not-built-yet";
import { localeFromCookies } from "@/lib/i18n/server.tsx";
import { translate } from "@/lib/i18n/index.ts";

export default function Page() {
  const locale = localeFromCookies();
  return (
    <NotBuiltYet
      icon="pres"
      title={translate(locale, "presentations.title")}
      description={translate(locale, "presentations.body")}
      cta={{ label: translate(locale, "presentations.goToDocuments"), href: "/knowledge/documents" }}
    />
  );
}
