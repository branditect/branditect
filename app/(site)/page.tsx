import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/icon";
import SignedInGate from "@/components/site/signed-in-gate";
import { PLANS } from "@/lib/pricing-plans";
import s from "@/components/site/site.module.css";

export const metadata: Metadata = {
  title: "Branditect · The commercial brain for your brand",
  description:
    "One place that knows your strategy, your products and your margins, and writes from them. Build it free, with 100 credits and no card.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Branditect · The commercial brain for your brand",
    description:
      "One place that knows your strategy, your products and your margins, and writes from them.",
    url: "/",
    type: "website",
  },
};

const TRUTHS = [
  { title: "Brand truth", body: "Strategy, positioning, tone of voice and visual identity, written down once.", tone: "bg-grad-more" },
  { title: "Product truth", body: "Every product, its specifications and the claims you can actually prove.", tone: "bg-grad-images" },
  { title: "Commercial truth", body: "Landed cost, real margin, floor price and the most you will discount.", tone: "bg-grad-numbers" },
];

const DECISIONS = [
  { title: "Closed book", body: "It writes from what you gave it. Ask for something that is not in there and it says so." },
  { title: "Sourced claims", body: "Every hard fact carries the record it came from. An undeclared number is the thing this prevents." },
  { title: "Margin awareness", body: "Offers are checked against your floor price before you see them." },
  { title: "Your brand stays yours", body: "One way anything leaves the system, and you send it deliberately." },
];

/* Three of the four plans. The fourth is a conversation, and it lives on the
   pricing page where there is room to explain it. */
const LANDING_PLANS = PLANS.filter((p) => p.id !== "enterprise");

export default function LandingPage() {
  return (
    <main>
      <SignedInGate />
      <div className={s.wrap}>
        <section className={s.hero}>
          <span className={s.kicker}>Brand truth · Product truth · Commercial truth</span>
          <h1>
            The commercial brain<br />for your brand. <em>Free to build.</em>
          </h1>
          <p className={s.lede}>
            What do we stand for, what exactly do we sell, and what can we afford to charge. The
            answers are already in a deck nobody opens and a spreadsheet one person maintains.
            Branditect is where they live instead, and everything you make comes out of them.
          </p>
          <div className={s.bandCta} style={{ marginTop: 26 }}>
            <Link href="/signup" className={s.btn}>Start free</Link>
            <Link href="/about" className={`${s.btn} ${s.line}`}>See what it does</Link>
          </div>
        </section>

        {/* Nothing on a marketing site converts like seeing the thing work. */}
        <div className={s.shot}>
          <Image src="/login/dashboard.webp" width={1010} height={552} priority
            alt="The Branditect Home screen for a brand called Ruffle Studio: Brand Readiness with its four checks, counts of the files the brain has read, and the Studio tools underneath." />
        </div>
        <p className={s.caption}>
          Brand Readiness is four checks, each worth a quarter. It tells you what is missing rather
          than congratulating you.
        </p>

        <section className={s.sec}>
          <div className={s.sechead}>
            <h2>Not a copy generator. A commercial brain.</h2>
            <p>Three kinds of truth, held in one place, each usable by everything else.</p>
          </div>
          <div className={s.three}>
            {TRUTHS.map((t) => (
              <div key={t.title} className={s.card}>
                <span className={`${s.cardIc} ${t.tone}`}><Icon name="check" size={18} /></span>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
              </div>
            ))}
          </div>
          <div className={s.shot}>
            <Image src="/login/products.webp" width={1010} height={552}
              alt="The Products screen for Ruffle Studio, listing each product with its cost, its price and its real margin, one margin figure marked with an asterisk." />
          </div>
          <p className={s.caption}>
            The asterisk in the margin column is the system saying a figure is estimated because a
            landed cost is missing. It would rather admit that than quietly overstate your margin.
          </p>
        </section>

        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.sechead}>
            <h2>Four decisions we will not trade away.</h2>
          </div>
          <div className={s.qa}>
            {DECISIONS.map((d) => (
              <div key={d.title} className={s.q}>
                <h4>{d.title}</h4>
                <p>{d.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.sechead}>
            <h2>Build it for nothing.</h2>
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
                  <Link href={plan.href} className={`${s.btn} ${plan.featured ? "" : s.line}`}>{plan.cta}</Link>
                </div>
                <div className={s.credits}>
                  <div className={s.creditsBig}>{plan.credits}</div>
                  <div className={s.creditsLab}>{plan.creditsLabel}</div>
                </div>
              </div>
            ))}
          </div>
          <p className={s.caption}>
            <Link href="/pricing" style={{ fontWeight: 700, color: "inherit", textDecoration: "underline" }}>
              Every plan side by side, and what a credit buys
            </Link>
          </p>
        </section>

        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.band}>
            <h2>Answer the three questions.</h2>
            <p>About four minutes for the five that matter. Nothing expires, and you keep what you built.</p>
            <div className={s.bandCta}>
              <Link href="/signup" className={s.btn}>Start free</Link>
              <Link href="/about" className={`${s.btn} ${s.line}`}>Read what it does</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
