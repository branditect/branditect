import { localeFromCookies } from "@/lib/i18n/server.tsx";
import { translate } from "@/lib/i18n/index.ts";
import SettingsHero from "@/components/settings/settings-hero";
import { Panel } from "@/components/settings/save-state";
import YouPanel from "@/components/settings/you-panel";
import BrandPanel from "@/components/settings/brand-panel";
import LanguagePanel from "@/components/settings/language-panel";
import AccountPanel from "@/components/settings/account-panel";
import ComingSoon from "@/components/settings/coming-soon";

/**
 * Settings, phase 1. branditect-ui/spec/settings.md and reference/settings.html.
 *
 * Four sections in order — You, Brand, Language, Account — then the line,
 * then five named rows that are visibly not yet. Profile and Settings are one
 * page: for a single-seat product they hold the same three fields, and a
 * separate Profile screen is a second place to look for the same thing.
 *
 * A server component so the page exists before any hook resolves; every
 * section that reads the user or the brand is a client island.
 *
 * THE FOUR TILES ARE THE HIERARCHY — orange for you, sage for the brand,
 * lavender for language, navy for the account. You can find a section by
 * colour before reading a word. The reference uses violet for the third;
 * there is none in the palette, so it is the lavender pair that is there.
 */
export default function SettingsPage() {
  const locale = localeFromCookies();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <div className="mx-auto max-w-[780px] px-[22px] pb-[60px] pt-[22px]">
      <SettingsHero />

      <Panel tile={<Tile className="bg-grad-mark" fill="#fff" d={ICON_YOU} />}
             title={t("settings.you")} sub={t("settings.youSub")}>
        <YouPanel />
      </Panel>

      <Panel tile={<Tile className="bg-grad-assets" fill="#2c5b52" d={ICON_BRAND} />}
             title={t("settings.brand")} sub={t("settings.brandSub")}>
        <BrandPanel />
      </Panel>

      <Panel tile={<Tile className="bg-lavender" fill="#5b4a80" d={ICON_LANG} />}
             title={t("settings.language")} sub={t("settings.languageIntro")}>
        <LanguagePanel />
      </Panel>

      <Panel tile={<Tile className="bg-navy" fill="#fff" d={ICON_ACCOUNT} />}
             title={t("settings.account")} sub={t("settings.accountSub")}>
        <AccountPanel />
      </Panel>

      <ComingSoon />
    </div>
  );
}

/**
 * The section tile. Inline paths rather than components/icon.tsx: that file
 * is the app's icon set and these four are section marks from
 * reference/settings.html, two of which (the brand cube, the globe) are not
 * in it. Adding them there would put reference-only art in the icon set.
 */
function Tile({ className, fill, d }: { className: string; fill: string; d: string }) {
  return (
    <div className={`grid h-[34px] w-[34px] flex-none place-items-center rounded-tile ${className}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[17px] w-[17px]" style={{ fill }}>
        <path d={d} />
      </svg>
    </div>
  );
}

const ICON_YOU = "M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10m0 2c-5 0-9 2.7-9 6v2h18v-2c0-3.3-4-6-9-6";
const ICON_BRAND = "M12 2 3 7v10l9 5 9-5V7zm0 2.3 6.5 3.6L12 11.5 5.5 7.9zM5 9.6l6 3.3v6.5l-6-3.3zm8 9.8v-6.5l6-3.3v6.5z";
const ICON_LANG = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m6.9 6h-2.9a15 15 0 0 0-1.3-3.4A8 8 0 0 1 18.9 8M12 4c.8 1.2 1.4 2.5 1.8 4h-3.6c.4-1.5 1-2.8 1.8-4M4.3 14a8 8 0 0 1 0-4h3.3a16 16 0 0 0 0 4zm.8 2H8a15 15 0 0 0 1.3 3.4A8 8 0 0 1 5.1 16m2.9-8H5.1a8 8 0 0 1 4.2-3.4A15 15 0 0 0 8 8m4 12c-.8-1.2-1.4-2.5-1.8-4h3.6c-.4 1.5-1 2.8-1.8 4m2.2-6H9.8a14 14 0 0 1 0-4h4.4a14 14 0 0 1 0 4m.5 5.4A15 15 0 0 0 16 16h2.9a8 8 0 0 1-4.2 3.4m1.7-5.4a16 16 0 0 0 0-4h3.3a8 8 0 0 1 0 4z";
const ICON_ACCOUNT = "M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5v-2H5V5h5zm5.6 3.6L14.2 8l3 3H9v2h8.2l-3 3 1.4 1.4L21 12z";
