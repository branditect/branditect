import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/icon";
import s from "@/components/site/site.module.css";

export const metadata: Metadata = {
  title: "About · Branditect",
  description:
    "Branditect is one place that knows your brand strategy, your products and your margins, and makes things from them. Built in Finland, on EU infrastructure.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About · Branditect",
    description:
      "One place that knows your strategy, your products and your margins, and makes things from them.",
    url: "/about",
    type: "website",
  },
};

const TRUTHS = [
  {
    title: "Brand truth",
    body: "Your strategy, positioning, tone of voice and visual identity, written down once and used by everything you make afterwards.",
    tone: "bg-grad-more",
  },
  {
    title: "Product truth",
    body: "Every product, its specifications and the claims you can actually prove. If a number is not in there, nothing will write it.",
    tone: "bg-grad-images",
  },
  {
    title: "Commercial truth",
    body: "Landed cost, real margin, floor price and the most you will discount. The part that decides whether the work was worth doing.",
    tone: "bg-grad-numbers",
  },
];

const DECISIONS = [
  {
    title: "Closed book",
    body: "It writes from what you gave it and nothing else. Ask for a product that is not in there and it says so rather than inventing one.",
  },
  {
    title: "Sourced claims",
    body: "Every hard fact in a draft carries the record it came from. An undeclared number is the failure this whole system exists to prevent.",
  },
  {
    title: "Margin awareness",
    body: "Offers and discounts are checked against your floor price before you see them, so nothing suggests a price that loses you money.",
  },
  {
    title: "Your brand stays yours",
    body: "Your files, your strategy and your numbers belong to you. There is one way anything leaves the system, and you send it deliberately.",
  },
];

export default function AboutPage() {
  return (
    <main>
      <div className={s.wrap}>
        <section className={s.hero}>
          <span className={s.kicker}>What this is</span>
          <h1>
            Three questions every brand<br />answers forever. <em>Answer them once.</em>
          </h1>
          <p className={s.lede}>
            What do we stand for. What exactly do we sell. What can we afford to charge. The
            answers exist already, buried in a slide deck nobody opens, an inbox nobody searches
            and a spreadsheet one person maintains. Branditect is where they live instead.
          </p>
        </section>

        <div className={s.shot}>
          <Image src="/login/dashboard.webp" width={1010} height={552} priority
            alt="The Branditect Home screen for a brand called Ruffle Studio: Brand Readiness with its four checks, counts of the files the brain has read, and the Studio tools underneath." />
        </div>
        <p className={s.caption}>
          One screen that knows how much of your brand has been written down, and what is still
          missing. It says the diagnosis rather than the compliment.
        </p>

        <section className={s.sec}>
          <div className={s.sechead}>
            <h2>Not a copy generator. A commercial brain.</h2>
            <p>Three kinds of truth, held in one place, each one usable by everything else.</p>
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
            Look at the asterisk in the margin column. That is the system telling you a figure is
            estimated because a landed cost is missing. It would rather admit that than quietly
            overstate your margin.
          </p>
        </section>

        <section className={s.sec} id="how" style={{ scrollMarginTop: 80 }}>
          <div className={s.sechead}>
            <div className={s.eyebrow}>How it works</div>
            <h2>Define, feed, make.</h2>
            <p>
              Three verbs in order. Every screen belongs to exactly one of them, and anything that
              belongs to none of them is not built.
            </p>
          </div>
          <div className={s.three}>
            <div className={s.card}>
              <span className={`${s.cardIc} bg-grad-more`}><Icon name="brand" size={18} /></span>
              <h3>Define</h3>
              <p>
                Twenty questions build your strategy, your tone of voice and your visual identity.
                Five of them are enough to open the workspace. The rest can wait.
              </p>
            </div>
            <div className={s.card}>
              <span className={`${s.cardIc} bg-grad-images`}><Icon name="know" size={18} /></span>
              <h3>Feed</h3>
              <p>
                Products, documents, images, links. Everything you upload is read and indexed, and
                that part never costs a credit.
              </p>
            </div>
            <div className={s.card}>
              <span className={`${s.cardIc} bg-grad-assets`}><Icon name="studio" size={18} /></span>
              <h3>Make</h3>
              <p>
                Copy in your voice citing your own facts, images shot in your own light, and offers
                that respect your floor price.
              </p>
            </div>
          </div>

          <div className={s.shot}>
            <Image src="/login/create-tools.webp" width={1010} height={552}
              alt="The Studio row in Branditect: cards for writing copy, creating images, doing the numbers and reaching your brand assets." />
          </div>
          <p className={s.caption}>
            Everything in Studio reads the same brain. Nothing here has its own separate idea of
            what your brand is.
          </p>
        </section>

        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.sechead}>
            <h2>Four decisions we will not trade away.</h2>
            <p>These are the ones that would be easy to soften and expensive to lose.</p>
          </div>
          <div className={s.qa}>
            {DECISIONS.map((d) => (
              <div key={d.title} className={s.q}>
                <h4>{d.title}</h4>
                <p>{d.body}</p>
              </div>
            ))}
          </div>

          <div className={s.shot}>
            <Image src="/login/calculators.webp" width={1010} height={552}
              alt="The Numbers section of Branditect showing three calculators for working out landed cost, margin and a floor price." />
          </div>
          <p className={s.caption}>
            Margins are calculated net of tax and against landed cost, never factory cost against a
            gross price. That difference is about five points, and it is the difference between a
            product you think is profitable and one that is.
          </p>
        </section>

        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.sechead}>
            <h2>Who it is for.</h2>
            <p>
              The second column is not modesty. It is what makes the first one believable, and it
              saves us both a conversation.
            </p>
          </div>
          <div className={s.forlist}>
            <div className={`${s.forbox} ${s.yes}`}>
              <h3>For you if</h3>
              <ul>
                <li><Icon name="check" size={14} />You sell something specific and you know what it costs you</li>
                <li><Icon name="check" size={14} />Your brand decisions live in your head or in one old deck</li>
                <li><Icon name="check" size={14} />You write your own copy and you are tired of explaining the brand each time</li>
                <li><Icon name="check" size={14} />You have been burned by a tool that invented a product feature</li>
                <li><Icon name="check" size={14} />You run one brand properly, or a few brands that must not bleed into each other</li>
              </ul>
            </div>
            <div className={`${s.forbox} ${s.no}`}>
              <h3>Not for you if</h3>
              <ul>
                <li><Icon name="close" size={14} />You want volume content and do not mind where the facts came from</li>
                <li><Icon name="close" size={14} />You have no products yet and nothing to be truthful about</li>
                <li><Icon name="close" size={14} />You need a design tool. This decides what to say, not how to lay it out</li>
                <li><Icon name="close" size={14} />You want a chatbot with no setup. The five questions are the whole point</li>
                <li><Icon name="close" size={14} />You need invoicing, VAT returns or accounting. Numbers is about margin, not books</li>
              </ul>
            </div>
          </div>
        </section>

        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.sechead}>
            <div className={s.eyebrow}>The company</div>
            <h2>Built in Finland.</h2>
          </div>
          <div className={s.three}>
            <div className={s.card}>
              <h3>Where it runs</h3>
              <p>Your data is held on EU infrastructure, and we handle it under GDPR as the processor of what you put in.</p>
            </div>
            <div className={s.card}>
              <h3>Who owns it</h3>
              <p>Your files, your strategy and everything you make stay yours. Close the account and you can take it with you.</p>
            </div>
            <div className={s.card}>
              <h3>Where to reach us</h3>
              <p>
                One inbox, read by the people who build it.{" "}
                <a href="mailto:hello@branditect.io" style={{ fontWeight: 700 }}>hello@branditect.io</a>
              </p>
            </div>
          </div>
        </section>

        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.band}>
            <h2>Answer the three questions.</h2>
            <p>
              About four minutes for the five that matter. A hundred credits, no card, and nothing
              expires.
            </p>
            <div className={s.bandCta}>
              <Link href="/signup" className={s.btn}>Start free</Link>
              <Link href="/pricing" className={`${s.btn} ${s.line}`}>See the plans</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
