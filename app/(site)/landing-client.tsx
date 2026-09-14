"use client";

import { Suspense, useEffect, useState } from "react";
import SiteLink from "@/components/site/site-link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Icon from "@/components/icon";
import HeroAuthCard, { type Tab } from "@/components/site/hero-auth-card";
import SignedInGate from "@/components/site/signed-in-gate";
import { plansIn } from "@/lib/pricing-plans";
import s from "@/components/site/site.module.css";
import { translate, type Locale, type StringKey } from "@/lib/i18n/index.ts";

const STEPS = [
  {
    n: "01", title: "site.home.yourStrategy", tone: "t1",
    body: "site.home.q25full",
    ask: "site.home.card1Ask",
    answer: "site.home.card1Answer",
  },
  {
    n: "02", title: "site.home.yourProductKnowledge", tone: "t2",
    ask: "site.home.card2Ask",
    answer: "site.home.card2Answer",
  },
  {
    n: "03", title: "site.home.yourTrueNumbers", tone: "t3",
    ask: "site.home.card3Ask",
    answer: "site.home.card3Answer",
  },
] satisfies { n: string; title: StringKey; tone: string; body?: StringKey; ask: StringKey; answer: StringKey }[];

const FLOW = [
  { v: "site.about.define", title: "site.home.step1", body: "site.home.step1Body" },
  { v: "site.about.feed", title: "site.home.step2", body: "site.home.step2Body" },
  { v: "site.about.make", title: "site.home.step3", body: "site.home.step3Body" },
] satisfies { v: StringKey; title: StringKey; body: StringKey }[];

const ROLES = ["site.home.role1", "site.home.role2", "site.home.role3", "site.home.role4",
  "site.home.role5", "site.home.role6"] satisfies StringKey[];

const TRUST = ["site.home.trust1", "site.home.trust2", "site.home.trust3", "site.home.trust4"] satisfies StringKey[];

/* The nav's Log in and Start free carry ?auth=, so either opens this card on
   the right tab from any page on the site. Read as a search param rather than
   a hash: next/link navigates with pushState, which never fires hashchange. */
function AuthTabSync({ onTab }: { onTab: (t: Tab) => void }) {
  const params = useSearchParams();
  const wanted = params.get("auth");
  useEffect(() => {
    if (wanted !== "login" && wanted !== "signup") return;
    onTab(wanted);
    document.getElementById("auth")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [wanted, onTab]);
  return null;
}

/**
 * `locale` comes from the route, not the pathname: `/` and `/fi` each render
 * this with their own, so the server HTML is already in the right language.
 */
export default function LandingClient({ locale }: { locale: Locale }) {
  const [tab, setTab] = useState<Tab>("signup");
  const t = (key: StringKey) => translate(locale, key);
  const landingPlans = plansIn(locale).filter((p) => p.id !== "enterprise");

  return (
    <main>
      <SignedInGate />
      <Suspense fallback={null}>
        <AuthTabSync onTab={setTab} />
      </Suspense>
      <div className={s.wrap}>
        <section className={s.landingHero}>
          <div>
            <span className={s.heroKicker}>{t("site.threeTruths")}</span>
            <h1>
              {t("site.home.h1a")}<br /><em>{t("site.home.h1b")}</em>
            </h1>
            <p className={s.heroLede}>
              The commercial brain for product and ecommerce brands. It holds your strategy, your
              product truth and your margins together, so everything you publish is on brand,
              accurate and profitable. It writes your copy understanding each and every one of your
              products, your tone of voice and style. And makes your images, too. It&rsquo;s like
              having a superstar marketing team behind you.{" "}
              <b>{t("site.home.cta")}</b>
            </p>
            <div className={s.trust}>
              {TRUST.map((k) => (
                <span key={k} className={s.tp}><Icon name="check" size={13} />{t(k)}</span>
              ))}
            </div>
          </div>
          <HeroAuthCard tab={tab} onTab={setTab} locale={locale} />
        </section>

        <div style={{ marginTop: 14 }}>
          <div className={s.frame}>
            <Image src="/login/dashboard.webp" width={1010} height={552} priority
              alt="The Branditect home screen for a brand called Ruffle Studio: a Brand Readiness score with its four checks, counts of the documents and images the brain has read, and a row of Studio tools." />
          </div>
          <p className={s.cap}>
            <i className={s.capDot} />
            <span>
              <b>{t("site.home.secHome")}</b> Brand Readiness tells you what is still missing, and the Studio row is
              what you can make with what the brain already knows. Nothing on this screen is a guess.
            </span>
          </p>
        </div>

        <section className={`${s.sec} ${s.anchor}`} id="how">
          <div className={`${s.sechead}`} style={{ textAlign: "center", margin: "0 auto 34px" }}>
            <div className={s.eyebrow}>{t("site.nav.howItWorks")}</div>
            <h2>{t("site.home.sub")}</h2>
            <p>
              Each one is usable by everything else, which is the whole difference between a brand
              brain and a folder of documents.
            </p>
          </div>
          <div className={s.truths}>
            {STEPS.map((step) => (
              <div key={step.n} className={`${s.tr} ${s[step.tone]}`}>
                <div className={s.tn}>{step.n}</div>
                <h3>{t(step.title)}</h3>
                {step.body && <p className={s.tw}>{t(step.body)}</p>}
                {/* The question and its answer are the argument. A claim about
                    what it can do is worth less than the exchange itself. */}
                <div className={s.qa2}>
                  <p className={s.askLine}><span>{t("site.home.askIt")}</span>{t(step.ask)}</p>
                  <p className={s.answerLine}><span>{t("site.home.itAnswers")}</span>{t(step.answer)}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 26 }}>
            <div className={s.frame}>
              <Image src="/login/products.webp" width={1010} height={552}
                alt="The Products screen for Ruffle Studio, listing each product with its cost, its price and its real margin, with one margin figure marked by an asterisk." />
            </div>
            <p className={s.cap}>
              <i className={s.capDot} />
              <span>
                <b>{t("site.home.secProducts")}</b> Look at the asterisk in the margin column. That is the system
                telling you a figure is estimated because a landed cost is missing. It would rather
                admit that than quietly overstate your margin.
              </span>
            </p>
          </div>

          <div style={{ marginTop: 34 }} className={s.flow}>
            {FLOW.map((f) => (
              <div key={f.v} className={s.fs}>
                <div className={s.fsV}>{t(f.v)}</div>
                <h3>{t(f.title)}</h3>
                <p>{t(f.body)}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 26 }}>
            <div className={s.frame}>
              <Image src="/login/create-tools.webp" width={1010} height={552}
                alt={t("site.about.altStudio")} />
            </div>
            <p className={s.cap}>
              <i className={s.capDot} />
              <span>
                <b>{t("site.home.secStudio")}</b> Everything here reads the same brain. Nothing has its own separate
                idea of what your brand is.
              </span>
            </p>
          </div>
        </section>

        <section className={`${s.sec} ${s.anchor}`} id="pricing" style={{ paddingTop: 0 }}>
          <div className={s.sechead} style={{ textAlign: "center", margin: "0 auto 34px" }}>
            <div className={s.eyebrow}>{t("site.nav.pricing")}</div>
            <h2>{t("site.home.getStartedFree")}</h2>
            <p>{t("site.home.freeTerms")}</p>
          </div>
          <div className={`${s.plans} ${s.plansThree}`}>
            {landingPlans.map((plan) => (
              <div key={plan.id} className={`${s.plan} ${plan.featured ? s.featured : ""}`}>
                {plan.featured && <span className={s.flag}>{t("site.mostPopular")}</span>}
                <div className={s.pname}>{plan.name}</div>
                <p className={s.who}>{plan.who}</p>
                <div className={s.price}>
                  <span className={s.priceN}>{plan.monthly}</span>
                  {plan.id !== "free" && <span className={s.per}>/month</span>}
                </div>
                <div className={s.vatline}>{plan.vatLine}</div>
                <div className={s.planCta}>
                  <SiteLink page="home" auth="signup" className={`${s.btn} ${plan.featured ? "" : s.line}`}>{plan.cta}</SiteLink>
                </div>
                <div className={s.credits}>
                  <div className={s.creditsBig}>{plan.credits}</div>
                  <div className={s.creditsLab}>{plan.creditsLabel}</div>
                </div>
              </div>
            ))}
          </div>
          <p className={s.allplans}>
            <SiteLink page="pricing">{t("site.home.everyPlan")}</SiteLink>
          </p>
        </section>

        <section className={`${s.sec} ${s.anchor}`} id="about" style={{ paddingTop: 0 }}>
          <div className={s.aboutStrip}>
            <div>
              <div className={s.aboutLead}>{t("site.nav.about")}</div>
              <h2>
                Built by a team that has spent two decades building brands around the world.
                Made in Finland.
              </h2>
              <p>
                A brand rarely fails on strategy alone. It fails in the gaps between strategy,
                product and price. The launch that was on brand and under margin. The claim nobody
                checked before it went to print. The retailer description written from memory at
                eleven at night, because the spec sheet was somewhere in an inbox.
              </p>
              <p><b>{t("site.home.gaps")}</b></p>
            </div>

            <ul className={s.roles}>
              {ROLES.map((r) => (
                <li key={r}><i />{t(r)}</li>
              ))}
            </ul>
          </div>

          <div className={s.aboutStrip} style={{ display: "block", marginTop: 14 }}>
            <div className={s.aboutClose} style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
              <p>
                What a big brand has is not better instincts than you. It is strategy and
                infrastructure.
              </p>
              <p>
                Branditect gives you both, at whatever stage you are at. First product or four
                hundredth. You still make every decision. You stop making them from memory.
              </p>
              <p className={s.aboutPunch}>{t("site.home.gapsPunch")}</p>
              <div className={s.bandCta} style={{ justifyContent: "flex-start", marginTop: 22 }}>
                <SiteLink page="about" className={`${s.btn} ${s.line}`}>{t("site.home.readWhole")}</SiteLink>
              </div>
            </div>
          </div>
        </section>

        <section className={s.final}>
          <span className={s.rings} aria-hidden="true"><i /><i /><i /></span>
          <h2>{t("site.about.answerThree")}</h2>
          <p>
            About four minutes for the five that matter. A hundred credits, no card, and nothing
            expires.
          </p>
          <SiteLink page="home" auth="signup" className={s.btn}>{t("site.startFree")}</SiteLink>
          <p className={s.finalFine}>{t("site.home.noCard")}</p>
        </section>
      </div>
    </main>
  );
}
