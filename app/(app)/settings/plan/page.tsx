import NotBuiltYet from "@/components/not-built-yet";
import { localeFromCookies } from "@/lib/i18n/server.tsx";
import { translate } from "@/lib/i18n/index.ts";

export default function Page() {
  return (
    <NotBuiltYet
      icon="target"
      title={translate(localeFromCookies(), "settings.yourPlan")}
      description="Billing, plan tier and renewal date. Not wired up yet — your workspace is unaffected."
      cta={{ label: "Back to Home", href: "/home" }}
    />
  );
}
