import NotBuiltYet from "@/components/not-built-yet";
import { localeFromCookies } from "@/lib/i18n/server.tsx";
import { translate } from "@/lib/i18n/index.ts";

export default function Page() {
  const locale = localeFromCookies();
  return (
    <NotBuiltYet
      icon="chat"
      title={translate(locale, "chat.title")}
      description="The full-page conversation with your brand-trained assistant, reading your Brand, your Numbers and everything in Knowledge. The rail on Home is live; this larger view is still to come."
      cta={{ label: "Back to Home", href: "/home" }}
    />
  );
}
