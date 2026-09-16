import NotBuiltYet from "@/components/not-built-yet";
import { localeFromCookies } from "@/lib/i18n/server.tsx";
import { translate } from "@/lib/i18n/index.ts";

export default function Page() {
  const locale = localeFromCookies();
  return (
    <NotBuiltYet
      icon="chat"
      title={translate(locale, "chat.title")}
      description={translate(locale, "chat.pageDescription")}
      cta={{ label: translate(locale, "shell.backToHome"), href: "/home" }}
    />
  );
}
