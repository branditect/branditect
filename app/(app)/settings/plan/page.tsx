import NotBuiltYet from "@/components/not-built-yet";
import { localeFromCookies } from "@/lib/i18n/server.tsx";
import { translate } from "@/lib/i18n/index.ts";

export default function Page() {
  const locale = localeFromCookies();
  return (
    <NotBuiltYet
      icon="target"
      title={translate(locale, "settings.yourPlan")}
      description={translate(locale, "planPage.description")}
      cta={{ label: translate(locale, "shell.backToHome"), href: "/home" }}
    />
  );
}
