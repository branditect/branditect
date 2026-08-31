"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/icon";
import { PLANS, COMPARISON, CREDIT_COSTS, TOP_UP, VAT_RATE } from "@/lib/pricing-plans";
import s from "@/components/site/site.module.css";

/**
 * Every number on this page comes from lib/pricing-plans.ts, so the cards and
 * the comparison table cannot drift apart.
 */
export default function PricingClient() {
  const [yearly, setYearly] = useState(false);

  return (
    <main>
      <div className={s.wrap}>
        <section className={s.hero}>
          <span className={s.kicker}>Brand truth · Product truth · Commercial truth</span>
          <h1>
            The commercial brain<br />for your brand. <em>Free to build.</em>
          </h1>
          <p className={s.lede}>
            Branditect turns your scattered files, decisions and numbers into one knowledge layer
            that knows your strategy, your products and your margins. Build the whole thing for
            nothing. Pay when you want it working for you.
          </p>

          <div className={s.toggle} role="group" aria-label="Billing period">
            <button type="button" className={yearly ? undefined : s.on}
              aria-pressed={!yearly} onClick={() => setYearly(false)}>
              Monthly
            </button>
            <button type="button" className={yearly ? s.on : undefined}
              aria-pressed={yearly} onClick={() => setYearly(true)}>
              Yearly<span className={s.save}>2 months free</span>
            </button>
          </div>
        </section>

        <section className={s.plans} aria-label="Plans">
          {PLANS.map((plan) => {
            const amount = plan.monthly === null
              ? null
              : yearly ? plan.yearlyMonthly : plan.monthly;
            const vat = plan.monthly === null || plan.id === "free"
              ? plan.vatLine
              : yearly ? `Incl. VAT, billed ${plan.yearlyTotal} yearly` : `Incl. VAT ${VAT_RATE}`;
            return (
              <div key={plan.id} className={`${s.plan} ${plan.featured ? s.featured : ""}`}>
                {plan.featured && <span className={s.flag}>Most popular</span>}
                <div className={s.pname}>{plan.name}</div>
                <p className={s.who}>{plan.who}</p>
                <div className={s.price}>
                  <span className={s.priceN} style={amount === null ? { fontSize: 30 } : undefined}>
                    {amount ?? "Let’s talk"}
                  </span>
                  {amount !== null && plan.id !== "free" && <span className={s.per}>/month</span>}
                </div>
                <div className={s.vatline}>{vat}</div>
                <div className={s.planCta}>
                  <Link href={plan.href} className={`${s.btn} ${plan.featured ? "" : s.line}`}>
                    {plan.cta}
                  </Link>
                </div>
                <div className={s.credits}>
                  <div className={s.creditsBig}>{plan.credits}</div>
                  <div className={s.creditsLab}>{plan.creditsLabel}</div>
                </div>
                <ul className={s.feat}>
                  {plan.features.map((f) => (
                    <li key={f}><Icon name="check" size={13} />{f}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>

        <section className={s.sec}>
          <div className={s.sechead}>
            <h2>What is a credit?</h2>
            <p>
              One unit of work the brain does for you. Reading and indexing whatever you upload is
              always free, because a brain that charges you to learn is the wrong shape.
            </p>
          </div>
          <div className={s.tableWrap}>
            <table>
              <thead>
                <tr><th scope="col">Action</th><th scope="col">Cost</th></tr>
              </thead>
              <tbody>
                {CREDIT_COSTS.map((c) => (
                  <tr key={c.action}><th scope="row">{c.action}</th><td>{c.cost}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={s.caption}>
            Run out before the month does and you can add <b>{TOP_UP}</b> with one click, or wait
            for the next month. Nothing is deleted and nothing stops working. You keep reading your
            brand brain either way.
          </p>
        </section>

        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.sechead}><h2>Everything, side by side</h2></div>
          <div className={s.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th scope="col">&nbsp;</th>
                  {PLANS.map((p) => <th key={p.id} scope="col">{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {PLANS.map((p) => <td key={p.id}>{row.values[p.id]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.sechead}>
            <h2>Not a copy generator. A commercial brain.</h2>
            <p>
              This is your Home screen on the free plan. Brand Readiness on the left, what the
              brain has read on the right, and what you can make with it underneath.
            </p>
          </div>
          <div className={s.shot}>
            <Image src="/login/dashboard.webp" width={1010} height={552} priority
              alt="The Branditect Home screen for a brand called Ruffle Studio: a Brand Readiness score with its four checks, counts of the documents and images the brain has read, and a row of Studio tools." />
          </div>
          <p className={s.caption}>
            Brand Readiness is four checks, each worth a quarter. It says what is missing rather
            than congratulating you, because a score you can predict is worth more than one that
            looks precise.
          </p>
        </section>

        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.band}>
            <h2>Build the brain for nothing.</h2>
            <p>
              A hundred credits, no card, no countdown. Your strategy, your products and your
              guidelines stay yours to read for as long as you want them.
            </p>
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
