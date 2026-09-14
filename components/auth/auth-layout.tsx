import Showcase from "./showcase";
import s from "./auth.module.css";
import { useT } from "@/lib/i18n/use-t.tsx";
import type { StringKey } from "@/lib/i18n/index.ts";

/** A key, or English with no key yet (rendered as written, listed by the gap scan). */
type Copy = StringKey | { en: string };

/**
 * Two full-height halves, each centring its own content — neither sticky nor
 * top-anchored, which is what made an earlier version read as floating.
 *
 * The form is the only thing in its half. Everything persuasive lives on the
 * right, where someone who just wants to get in can ignore it.
 *
 * Below 900px the order flips and the pitch comes first: a first-time visitor
 * needs it, and a returning one scrolls past in half a second.
 */

const FEATURES: [Copy, Copy][] = [
  [{ en: "Write on brand" }, "home.writeDesc"],
  ["nav.studio.createImages", { en: "New visuals based on your products and style." }],
  ["home.numbersTitle", { en: "Profitability, pricing and offers that make sense." }],
  [{ en: "Brand assets" }, { en: "Logos, colors, guidelines and everything in one place." }],
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useT();
  const tx = (c: Copy) => (typeof c === "string" ? t(c) : c.en);
  return (
    <>
      <div className={s.bg} aria-hidden="true">
        <i className={s.b1} /><i className={s.b2} /><i className={s.b3} /><i className={s.b4} />
      </div>

      <div className={s.screen}>
        <main className={s.loginwrap}>{children}</main>

        {/* Decorative content beside the form, not a landmark. */}
        <div className={s.right}>
          <h2 className={s.pitch}>
            {t("auth.showcaseLine1")}<br />{t("auth.showcaseLine2")} <em>{t("auth.showcaseBrand")}</em>
          </h2>

          <div className={s.rightgrid}>
            <div className={s.feats}>
              {FEATURES.map(([title, line]) => (
                <div key={tx(title)} className={s.feat}>
                  <b>{tx(title)}</b>
                  <span>{tx(line)}</span>
                </div>
              ))}
            </div>
            <Showcase />
          </div>
        </div>
      </div>
    </>
  );
}
