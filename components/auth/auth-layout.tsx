import Showcase from "./showcase";
import s from "./auth.module.css";

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

const FEATURES = [
  ["Write on brand", "On brand, on strategy, on the facts."],
  ["Create images", "New visuals based on your products and style."],
  ["Do the numbers", "Profitability, pricing and offers that make sense."],
  ["Brand assets", "Logos, colors, guidelines and everything in one place."],
  ["More studio tools", "Explore all the tools to build and grow your brand."],
] as const;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
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
            They have a marketing team.<br />You have <em>Branditect.</em>
          </h2>

          <div className={s.rightgrid}>
            <div className={s.feats}>
              {FEATURES.map(([title, line]) => (
                <div key={title} className={s.feat}>
                  <b>{title}</b>
                  <span>{line}</span>
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
