import LanguageSwitch from "@/components/language-switch";
import { localeFromCookies } from "@/lib/i18n/server.tsx";
import { translate } from "@/lib/i18n/index.ts";

/**
 * Settings. Today it holds one thing: the interface language.
 *
 * A server component so the page title is right on the first paint rather than
 * after a hook resolves. The switch itself is a client island.
 */
export default function SettingsPage() {
  const locale = localeFromCookies();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <div className="mx-auto max-w-[760px] px-8 py-10">
      <div className="text-micro font-extrabold uppercase tracking-[1.2px] text-muted-2">
        {t("settings.breadcrumb")}
      </div>
      <h1 className="mt-2 text-page-title font-bold tracking-[-0.5px] text-ink">
        {t("settings.title")}
      </h1>

      <section className="mt-8 rounded-card bg-white p-6 drop-shadow-panel">
        <h2 className="text-section font-bold tracking-[-0.4px] text-ink">
          {t("settings.language")}
        </h2>
        <p className="mt-1 text-sm font-medium text-muted">{t("settings.languageIntro")}</p>
        <div className="mt-5">
          <LanguageSwitch />
        </div>
      </section>
    </div>
  );
}
