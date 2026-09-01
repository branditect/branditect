"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/icon";
import HeroAuthCard, { type Tab } from "@/components/site/hero-auth-card";
import SignedInGate from "@/components/site/signed-in-gate";
import { PLANS } from "@/lib/pricing-plans";
import s from "@/components/site/site.module.css";

const TRUTHS = [
  {
    n: "01", title: "Brand truth", tone: "t1",
    body: "Your strategy, positioning, tone of voice and visual identity, written down once and used by everything you make afterwards.",
    foot: "Answered in about four minutes.",
  },
  {
    n: "02", title: "Product truth", tone: "t2",
    body: "Every product, its specifications and the claims you can actually prove. If a number is not in there, nothing will write it.",
    foot: "Every fact carries its source.",
  },
  {
    n: "03", title: "Commercial truth", tone: "t3",
    body: "Landed cost, real margin, floor price and the most you will discount. The part that decides whether the work was worth doing.",
    foot: "Net of tax, against landed cost.",
  },
];

const FLOW = [
  { v: "Define", title: "Say what the brand is", body: "Twenty questions build your strategy and your tone of voice. Five of them open the workspace. The rest can wait." },
  { v: "Feed", title: "Give it what you know", body: "Products, documents, images and links. Everything you upload is read and indexed, and that part never costs a credit." },
  { v: "Make", title: "Get work back", body: "Copy in your voice citing your own facts, images shot in your own light, and offers that respect your floor price." },
];

const ROLES = [
  "A strategist, who decides what the brand stands for and what it will never say",
  "A product manager, on top of every product, every detail and every price",
  "A copywriter, who can write it the same way twice",
  "A designer and a photographer, producing the images before anyone asks for them",
  "Someone who holds the library: every product image, video and logo, in every format and crop",
  "A shared drive that one person is supposed to maintain full time, and usually does not",
];

const LANDING_PLANS = PLANS.filter((p) => p.id !== "enterprise");

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

export default function LandingClient() {
  const [tab, setTab] = useState<Tab>("signup");

  return (
    <main>
      <SignedInGate />
      <Suspense fallback={null}>
        <AuthTabSync onTab={setTab} />
      </Suspense>
      <div className={s.wrap}>
        <section className={s.landingHero}>
          <div>
            <span className={s.heroKicker}>Brand truth · Product truth · Commercial truth</span>
            <h1>
              They have a marketing&nbsp;team.<br />You have <em>Branditect.</em>
            </h1>
            <p className={s.heroLede}>
              The commercial brain for product and ecommerce brands. It holds your strategy, your
              product truth and your margins together, so everything you publish is on brand,
              accurate and profitable. <b>Build the whole brain free.</b>
            </p>
            <div className={s.trust}>
              {["Free forever", "No card to start", "100 credits to try everything", "Your data stays in the EU"].map((t) => (
                <span key={t} className={s.tp}><Icon name="check" size={13} />{t}</span>
              ))}
            </div>
          </div>
          <HeroAuthCard tab={tab} onTab={setTab} />
        </section>

        <div style={{ marginTop: 14 }}>
          <div className={s.frame}>
            <Image src="/login/dashboard.webp" width={1010} height={552} priority
              alt="The Branditect home screen for a brand called Ruffle Studio: a Brand Readiness score with its four checks, counts of the documents and images the brain has read, and a row of Studio tools." />
          </div>
          <p className={s.cap}>
            <i className={s.capDot} />
            <span>
              <b>Home.</b> Brand Readiness tells you what is still missing, and the Studio row is
              what you can make with what the brain already knows. Nothing on this screen is a guess.
            </span>
          </p>
        </div>

        <section className={`${s.sec} ${s.anchor}`} id="how">
          <div className={`${s.sechead}`} style={{ textAlign: "center", margin: "0 auto 34px" }}>
            <div className={s.eyebrow}>How it works</div>
            <h2>Three kinds of truth, in one place.</h2>
            <p>
              Each one is usable by everything else, which is the whole difference between a brand
              brain and a folder of documents.
            </p>
          </div>
          <div className={s.truths}>
            {TRUTHS.map((t) => (
              <div key={t.n} className={`${s.tr} ${s[t.tone]}`}>
                <div className={s.tn}>{t.n}</div>
                <h3>{t.title}</h3>
                <p className={s.tw}>{t.body}</p>
                <div className={s.tf}><b>{t.foot}</b></div>
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
                <b>Products.</b> Look at the asterisk in the margin column. That is the system
                telling you a figure is estimated because a landed cost is missing. It would rather
                admit that than quietly overstate your margin.
              </span>
            </p>
          </div>

          <div style={{ marginTop: 34 }} className={s.flow}>
            {FLOW.map((f) => (
              <div key={f.v} className={s.fs}>
                <div className={s.fsV}>{f.v}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 26 }}>
            <div className={s.frame}>
              <Image src="/login/create-tools.webp" width={1010} height={552}
                alt="The Studio row in Branditect: cards for writing copy, creating images, doing the numbers and reaching your brand assets." />
            </div>
            <p className={s.cap}>
              <i className={s.capDot} />
              <span>
                <b>Studio.</b> Everything here reads the same brain. Nothing has its own separate
                idea of what your brand is.
              </span>
            </p>
          </div>
        </section>

        <section className={`${s.sec} ${s.anchor}`} id="pricing" style={{ paddingTop: 0 }}>
          <div className={s.sechead} style={{ textAlign: "center", margin: "0 auto 34px" }}>
            <div className={s.eyebrow}>Pricing</div>
            <h2>Get started for free!</h2>
            <p>A hundred credits, no card, no countdown. Pay when you want it working for you.</p>
          </div>
          <div className={`${s.plans} ${s.plansThree}`}>
            {LANDING_PLANS.map((plan) => (
              <div key={plan.id} className={`${s.plan} ${plan.featured ? s.featured : ""}`}>
                {plan.featured && <span className={s.flag}>Most popular</span>}
                <div className={s.pname}>{plan.name}</div>
                <p className={s.who}>{plan.who}</p>
                <div className={s.price}>
                  <span className={s.priceN}>{plan.monthly}</span>
                  {plan.id !== "free" && <span className={s.per}>/month</span>}
                </div>
                <div className={s.vatline}>{plan.vatLine}</div>
                <div className={s.planCta}>
                  <Link href="/?auth=signup#auth" className={`${s.btn} ${plan.featured ? "" : s.line}`}>{plan.cta}</Link>
                </div>
                <div className={s.credits}>
                  <div className={s.creditsBig}>{plan.credits}</div>
                  <div className={s.creditsLab}>{plan.creditsLabel}</div>
                </div>
              </div>
            ))}
          </div>
          <p className={s.allplans}>
            <Link href="/pricing">Every plan side by side, and what a credit buys</Link>
          </p>
        </section>

        <section className={`${s.sec} ${s.anchor}`} id="about" style={{ paddingTop: 0 }}>
          <div className={s.aboutStrip}>
            <div>
              <div className={s.aboutLead}>About</div>
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
              <p><b>Big brands close those gaps with people.</b></p>
            </div>

            <ul className={s.roles}>
              {ROLES.map((r) => (
                <li key={r}><i />{r}</li>
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
              <p className={s.aboutPunch}>They have a marketing team. You have Branditect.</p>
              <div className={s.bandCta} style={{ justifyContent: "flex-start", marginTop: 22 }}>
                <Link href="/about" className={`${s.btn} ${s.line}`}>Read the whole thing</Link>
              </div>
            </div>
          </div>
        </section>

        <section className={s.final}>
          <span className={s.rings} aria-hidden="true"><i /><i /><i /></span>
          <h2>Answer the three questions.</h2>
          <p>
            About four minutes for the five that matter. A hundred credits, no card, and nothing
            expires.
          </p>
          <Link href="/?auth=signup#auth" className={s.btn}>Start free</Link>
          <p className={s.finalFine}>No card required. Your brand brain is yours to keep.</p>
        </section>
      </div>
    </main>
  );
}
