import SiteLink from "@/components/site/site-link";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/icon";
import s from "@/components/site/site.module.css";
import { translate, type Locale, type StringKey } from "@/lib/i18n/index.ts";

/**
 * The About page body, rendered by both `/about` and `/fi/about` with the
 * locale of the route. A server component: the locale arrives as a prop, so
 * nothing here needs the pathname and the HTML is served in its language.
 */

const TRUTHS = [
  {
    title: "site.about.brandTruth",
    body: "site.about.brandTruthBody",
    tone: "bg-grad-more",
  },
  {
    title: "site.about.productTruth",
    body: "site.about.productTruthBody",
    tone: "bg-grad-images",
  },
  {
    title: "site.about.commercialTruth",
    body: "site.about.commercialTruthBody",
    tone: "bg-grad-numbers",
  },
] satisfies { title: StringKey; body: StringKey; tone: string }[];

const DECISIONS = [
  {
    title: "site.about.closedBook",
    body: "site.about.closedBookBody",
  },
  {
    title: "site.about.sourcedClaims",
    body: "site.about.sourcedClaimsBody",
  },
  {
    title: "site.about.marginAwareness",
    body: "site.about.marginAwarenessBody",
  },
  {
    title: "site.about.staysYours",
    body: "site.about.staysYoursBody",
  },
] satisfies { title: StringKey; body: StringKey }[];

const FOR_YOU = ["site.about.for1", "site.about.for2", "site.about.for3", "site.about.for4",
  "site.about.for5"] satisfies StringKey[];
const NOT_FOR_YOU = ["site.about.not1", "site.about.not2", "site.about.not3", "site.about.not4",
  "site.about.not5"] satisfies StringKey[];

export default function AboutBody({ locale }: { locale: Locale }) {
  const t = (key: StringKey) => translate(locale, key);

  return (
    <main>
      <div className={s.wrap}>
        <section className={s.hero}>
          <span className={s.kicker}>{t("site.about.whatThisIs")}</span>
          {/* One key, rendered whole. It used to be two strings with an <em>
              between them, and Finnish word order does not put the seam
              where English does, so there is no seam. */}
          <h1>{t("site.about.threeQuestions")}</h1>
          <p className={s.lede}>{t("site.about.opening")}</p>
        </section>

        <div className={s.shot}>
          <Image src="/login/dashboard.webp" width={1010} height={552} priority
            alt={t("site.about.altHome")} />
        </div>
        <p className={s.caption}>{t("site.about.homeCaption")}</p>

        <section className={s.sec}>
          <div className={s.sechead}>
            <h2>{t("site.notAGenerator")}</h2>
            <p>{t("site.about.threeTruthsBody")}</p>
          </div>
          <div className={s.three}>
            {TRUTHS.map((truth) => (
              <div key={truth.title} className={s.card}>
                <span className={`${s.cardIc} ${truth.tone}`}><Icon name="check" size={18} /></span>
                <h3>{t(truth.title)}</h3>
                <p>{t(truth.body)}</p>
              </div>
            ))}
          </div>

          <div className={s.shot}>
            <Image src="/login/products.webp" width={1010} height={552}
              alt={t("site.about.altProducts")} />
          </div>
          <p className={s.caption}>{t("site.about.asteriskCaption")}</p>
        </section>

        <section className={s.sec} id="how" style={{ scrollMarginTop: 80 }}>
          <div className={s.sechead}>
            <div className={s.eyebrow}>{t("site.about.howItWorks")}</div>
            <h2>{t("site.about.defineFeedMake")}</h2>
            <p>{t("site.about.threeVerbs")}</p>
          </div>
          <div className={s.three}>
            <div className={s.card}>
              <span className={`${s.cardIc} bg-grad-more`}><Icon name="brand" size={18} /></span>
              <h3>{t("site.about.define")}</h3>
              <p>{t("site.about.defineBody")}</p>
            </div>
            <div className={s.card}>
              <span className={`${s.cardIc} bg-grad-images`}><Icon name="know" size={18} /></span>
              <h3>{t("site.about.feed")}</h3>
              <p>{t("site.about.feedBody")}</p>
            </div>
            <div className={s.card}>
              <span className={`${s.cardIc} bg-grad-assets`}><Icon name="studio" size={18} /></span>
              <h3>{t("site.about.make")}</h3>
              <p>{t("site.home.step3Body")}</p>
            </div>
          </div>

          <div className={s.shot}>
            <Image src="/login/create-tools.webp" width={1010} height={552}
              alt={t("site.about.altStudio")} />
          </div>
          <p className={s.caption}>{t("site.about.makeBody")}</p>
        </section>

        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.sechead}>
            <h2>{t("site.about.fourDecisions")}</h2>
            <p>{t("site.about.fourDecisionsBody")}</p>
          </div>
          <div className={s.qa}>
            {DECISIONS.map((d) => (
              <div key={d.title} className={s.q}>
                <h4>{t(d.title)}</h4>
                <p>{t(d.body)}</p>
              </div>
            ))}
          </div>

          <div className={s.shot}>
            <Image src="/login/calculators.webp" width={1010} height={552}
              alt={t("site.about.altNumbers")} />
          </div>
          <p className={s.caption}>{t("site.about.marginMath")}</p>
        </section>

        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.sechead}>
            <h2>{t("site.about.whoItIsFor")}</h2>
            <p>{t("site.about.secondColumn")}</p>
          </div>
          <div className={s.forlist}>
            <div className={`${s.forbox} ${s.yes}`}>
              <h3>{t("site.about.forYouIf")}</h3>
              <ul>
                {FOR_YOU.map((k) => <li key={k}><Icon name="check" size={14} />{t(k)}</li>)}
              </ul>
            </div>
            <div className={`${s.forbox} ${s.no}`}>
              <h3>{t("site.about.notForYouIf")}</h3>
              <ul>
                {NOT_FOR_YOU.map((k) => <li key={k}><Icon name="close" size={14} />{t(k)}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.sechead}>
            <div className={s.eyebrow}>{t("site.about.theCompany")}</div>
            <h2>{t("site.about.builtInFinland")}</h2>
          </div>
          <div className={s.three}>
            <div className={s.card}>
              <h3>{t("site.about.whereItRuns")}</h3>
              <p>{t("site.about.whereItRunsBody")}</p>
            </div>
            <div className={s.card}>
              <h3>{t("site.about.whoOwnsIt")}</h3>
              <p>{t("site.about.whoOwnsItBody")}</p>
            </div>
            <div className={s.card}>
              <h3>{t("site.about.reachUs")}</h3>
              <p>
                {t("site.about.oneInbox")}{" "}
                <a href="mailto:hello@branditect.io" style={{ fontWeight: 700 }}>hello@branditect.io</a>
              </p>
            </div>
          </div>
        </section>

        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.band}>
            <h2>{t("site.about.answerThree")}</h2>
            <p>{t("site.about.fourMinutes")}</p>
            <div className={s.bandCta}>
              <Link href="/signup" className={s.btn}>{t("site.startFree")}</Link>
              <SiteLink page="pricing" className={`${s.btn} ${s.line}`}>{t("site.about.seePlans")}</SiteLink>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
