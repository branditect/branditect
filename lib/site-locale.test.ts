/** Run with: npm test — inbox entry 7b of branditect-ui/spec/inbox.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  SITE_LOCALES, SITE_PAGES, SITE_LOCALE_NAME, FI_COPY_READY,
  sitePath, readSitePath, otherLanguage, alternatesFor, isSiteLocale,
} from "./site-locale.ts";
import { LOCALE_NAME } from "./i18n/index.ts";
import sitemap from "../app/sitemap.ts";
import { siteGap } from "./i18n-site-gap.ts";
import { en } from "./i18n/en.ts";
import { fi } from "./i18n/fi.ts";
import { PRICING_H1_BREAK_AFTER } from "./site-locale.ts";
import { euro, plansIn, comparisonIn, creditCostsIn, topUpIn, PLANS, TOP_UP } from "./pricing-plans.ts";
import { SITE_ORIGIN } from "./site-locale.ts";

const read = (f: string) => readFileSync(f, "utf8");

describe("the site switches by URL, not by cookie", () => {
  it("English keeps the bare paths", () => {
    assert.equal(sitePath("en", "home"), "/");
    assert.equal(sitePath("en", "pricing"), "/pricing");
    assert.equal(sitePath("en", "about"), "/about");
  });

  it("Finnish gets real routes", () => {
    assert.equal(sitePath("fi", "home"), "/fi");
    assert.equal(sitePath("fi", "pricing"), "/fi/pricing");
    assert.equal(sitePath("fi", "about"), "/fi/about");
  });

  it("reads a pathname back, trailing slash or not", () => {
    assert.deepEqual(readSitePath("/fi/pricing"), { locale: "fi", page: "pricing" });
    assert.deepEqual(readSitePath("/fi/pricing/"), { locale: "fi", page: "pricing" });
    assert.deepEqual(readSitePath("/"), { locale: "en", page: "home" });
    assert.deepEqual(readSitePath("/fi"), { locale: "fi", page: "home" });
  });

  it("and returns null for anything that is not a public page", () => {
    // So the nav does not try to find a Finnish twin for /settings.
    for (const p of ["/settings", "/knowledge/images", "/fi/nonsense", "/fi/about/extra", "/en"]) {
      assert.equal(readSitePath(p), null, p);
    }
  });

  it("every path round-trips", () => {
    for (const l of SITE_LOCALES) {
      for (const p of SITE_PAGES) {
        assert.deepEqual(readSitePath(sitePath(l, p)), { locale: l, page: p });
      }
    }
  });

  it("the other language is the same page, never the home page", () => {
    // Dropping someone on the front page because they changed language is
    // how a toggle becomes a back button.
    assert.deepEqual(otherLanguage("/pricing"), { locale: "fi", href: "/fi/pricing" });
    assert.deepEqual(otherLanguage("/fi/about"), { locale: "en", href: "/about" });
    assert.equal(otherLanguage("/settings"), null);
  });

  it("guards its own type", () => {
    assert.ok(isSiteLocale("fi"));
    assert.ok(!isSiteLocale("sv"));
    assert.ok(!isSiteLocale(null));
  });
});

describe("hreflang is reciprocal, or it is discarded", () => {
  it("every page names both languages and an x-default", () => {
    for (const p of SITE_PAGES) {
      for (const l of SITE_LOCALES) {
        const a = alternatesFor(p, l);
        assert.equal(a.languages.en, sitePath("en", p));
        assert.equal(a.languages.fi, sitePath("fi", p));
        assert.equal(a.languages["x-default"], sitePath("en", p));
      }
    }
  });

  it("each page is its own canonical, never its translation's", () => {
    // A canonical from /fi to / tells a crawler /fi is a duplicate, so it is
    // dropped from the index and its hreflang goes with it.
    for (const p of SITE_PAGES) {
      assert.equal(alternatesFor(p).canonical, sitePath("en", p));
      assert.equal(alternatesFor(p, "en").canonical, sitePath("en", p));
      assert.equal(alternatesFor(p, "fi").canonical, sitePath("fi", p));
    }
  });

  it("and both pages of every pair carry it", () => {
    // One-directional hreflang is the commonest way this is got wrong:
    // search engines drop an annotation the other page does not confirm.
    const pairs: [string, string][] = [
      ["app/(site)/page.tsx", "app/(site)/fi/page.tsx"],
      ["app/(site)/pricing/page.tsx", "app/(site)/fi/pricing/page.tsx"],
      ["app/(site)/about/page.tsx", "app/(site)/fi/about/page.tsx"],
    ];
    for (const [en, fi] of pairs) {
      assert.ok(existsSync(fi), `${fi} does not exist`);
      assert.match(read(en), /alternates: alternatesFor\("/, `${en} has no alternates`);
      assert.match(read(fi), /alternates: alternatesFor\("/, `${fi} has no alternates`);
    }
  });

  it("the two pages of a pair ask for the same page id", () => {
    for (const p of SITE_PAGES) {
      const dir = p === "home" ? "" : `/${p}`;
      const en = read(`app/(site)${dir}/page.tsx`);
      const fi = read(`app/(site)/fi${dir}/page.tsx`);
      assert.ok(en.includes(`alternatesFor("${p}")`), `the English ${p} page does not claim ${p}`);
      assert.ok(fi.includes(`alternatesFor("${p}", "fi")`),
        `the Finnish ${p} page does not claim ${p} in Finnish`);
    }
  });
});

describe("nothing is indexed as Finnish until all of it is", () => {
  it("the fi routes are noindex while the copy is English", () => {
    for (const f of ["app/(site)/fi/page.tsx", "app/(site)/fi/pricing/page.tsx",
                     "app/(site)/fi/about/page.tsx"]) {
      assert.match(read(f), /robots: FI_COPY_READY \? undefined : \{ index: false/,
        `${f} would be indexed as Finnish while written in English`);
    }
  });

  it("the toggle is visible on every public page, whatever the flag says", () => {
    // It used to render nothing until FI_COPY_READY. Saara's call on
    // 2026-09-14: show it now. The flag holds back indexing, not people.
    const src = read("components/site/language-toggle.tsx");
    assert.ok(!/FI_COPY_READY/.test(src.replace(/\/\*[\s\S]*?\*\//g, "")),
      "the toggle is gated on FI_COPY_READY again");
    assert.match(src, /if \(!here\) return null;/);
    assert.match(read("components/site/site-nav.tsx"), /<LanguageToggle \/>/);
  });

  it("the sitemap lists no alternate it cannot honour", () => {
    // Listing a noindex page as an alternate tells a crawler two
    // contradictory things and the hreflang goes with it.
    assert.match(read("app/sitemap.ts"), /FI_COPY_READY\s*\?\s*\{ alternates/);
  });

  it("and the flag cannot go true while the site gap has anything on it", () => {
    // Not a pinned value any more: the flag is tied to the scan that writes
    // branditect-ui/spec/i18n-gap-site.md. While strings are unkeyed or keys
    // are unusable, it must be false. When the list empties, this fails the
    // other way and says to flip it, and the noindex, sitemap and html lang
    // assertions around it are the ones to re-read.
    const { unkeyed, unwired, unread } = siteGap();
    const left = unkeyed.reduce((n, sec) => n + sec.rows.length, 0) +
      unwired.reduce((n, sec) => n + sec.rows.length, 0) + unread.length;
    if (FI_COPY_READY) {
      assert.equal(left, 0, `FI_COPY_READY is true but ${left} site strings are still English on /fi: ` +
        "npm run i18n:gap:site");
    } else {
      assert.ok(left > 0, "the site gap is empty: FI_COPY_READY can be true now");
    }
  });

  it("no Finnish was invented for the site", () => {
    // The ~70 marketing strings are the design side's. The structure is
    // built; the words are not guessed.
    for (const f of ["app/(site)/fi/page.tsx", "app/(site)/fi/pricing/page.tsx",
                     "app/(site)/fi/about/page.tsx", "components/site/language-toggle.tsx"]) {
      const src = read(f).replace(/\/\*[\s\S]*?\*\//g, "");
      assert.ok(!/[äöÄÖ]/.test(src.replace(/Suomi/g, "")), `${f} contains invented Finnish`);
    }
  });
});

describe("the toggle reads as the same feature as the one in Settings", () => {
  it("same two options, same labels", () => {
    // Two mechanisms underneath — routes here, a cookie and a column behind
    // the login — but a user should not be able to tell they are different
    // features.
    assert.deepEqual([...SITE_LOCALES], ["en", "fi"]);
    for (const l of SITE_LOCALES) {
      assert.equal(SITE_LOCALE_NAME[l], LOCALE_NAME[l],
        `the site calls ${l} something else than the app does`);
    }
  });

  it("it is a link, not a cookie write", () => {
    const src = read("components/site/language-toggle.tsx");
    assert.match(src, /<Link/);
    assert.ok(!/cookie/i.test(src.replace(/\/\*[\s\S]*?\*\//g, "")),
      "the public toggle writes a cookie, which is the bug this entry is about");
    assert.match(src, /hrefLang=\{l\}/);
  });
});

describe("the language survives a navigation", () => {
  const nav = read("components/site/site-nav.tsx");
  const footer = read("components/site/site-footer.tsx");

  it("the nav builds its links from the locale it is in", () => {
    // On /fi/pricing, About goes to /fi/about. A nav that drops you back
    // into English on the second click is the same bug as having no
    // Finnish page.
    assert.match(nav, /sitePath\(locale, "pricing"\)/);
    assert.match(nav, /sitePath\(locale, "about"\)/);
    assert.match(nav, /href=\{home\}/);
  });

  it("and so does the footer", () => {
    assert.match(footer, /sitePath\(locale, "about"\)/);
    assert.match(footer, /sitePath\(locale, "pricing"\)/);
  });

  it("nor in the page bodies, which are the second click nobody checks", () => {
    // The nav and footer were made locale-aware first and these were still
    // sending people from /fi back to /about and /?auth=signup.
    for (const f of ["app/(site)/landing-client.tsx", "app/(site)/pricing/pricing-client.tsx",
                     "app/(site)/about/about-body.tsx"]) {
      const code = read(f).replace(/\/\*[\s\S]*?\*\//g, "");
      for (const dead of [/href="\/about"/, /href="\/pricing"/, /href="\/\?auth=/]) {
        assert.ok(!dead.test(code), `${f} still hard-codes ${dead}`);
      }
    }
    // /signup is an app route, not a public page, and stays absolute.
    assert.match(read("app/(site)/about/about-body.tsx"), /href="\/signup"/);
  });

  it("no hard-coded English path is left in either", () => {
    for (const [name, src] of [["nav", nav], ["footer", footer]] as const) {
      const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
      for (const dead of [/href="\/pricing"/, /href="\/about"/, /href="\/\?auth=/]) {
        assert.ok(!dead.test(code), `${name} still hard-codes ${dead}`);
      }
    }
  });
});

describe("both languages read one dictionary", () => {
  // Inbox 7b, the copy half. The English pages used to carry their own
  // literals and the Finnish routes rendered the same components with no way
  // to be told otherwise. Now each route hands its locale down and every
  // string with a site.* key is looked up, on both sides.
  const bodies: [string, string, string][] = [
    ["app/(site)/page.tsx", "app/(site)/fi/page.tsx", "LandingClient"],
    ["app/(site)/pricing/page.tsx", "app/(site)/fi/pricing/page.tsx", "PricingClient"],
    ["app/(site)/about/page.tsx", "app/(site)/fi/about/page.tsx", "AboutBody"],
  ];

  it("each route renders the shared body with its own locale", () => {
    for (const [en, fi, body] of bodies) {
      assert.match(read(en), new RegExp(`<${body} locale="en" />`), en);
      assert.match(read(fi), new RegExp(`<${body} locale="fi" />`), fi);
    }
  });

  it("and titles itself from the dictionary in that locale", () => {
    for (const [en, fi] of bodies) {
      assert.match(read(en), /title: translate\("en", "site\.\w+\.metaTitle"\)/, en);
      assert.match(read(fi), /title: translate\("fi", "site\.\w+\.metaTitle"\)/, fi);
    }
  });

  it("the nav and footer look their labels up in the locale of the path", () => {
    const nav = read("components/site/site-nav.tsx");
    for (const k of ["site.nav.howItWorks", "site.nav.pricing", "site.nav.about", "site.nav.logIn", "site.startFree"]) {
      assert.ok(nav.includes(`"${k}"`), `the nav does not use ${k}`);
    }
    assert.match(nav, /translate\(locale, key\)/);
    assert.match(read("components/site/site-footer.tsx"), /translate\(locale, "site\.nav\.about"\)/);
  });

  it("the three-questions headline is one string with no seam in it", () => {
    // It was "Three questions every brand<br />answers forever. <em>Answer
    // them once.</em>". Finnish word order does not put the break where
    // English does, so the key is a whole sentence pair and renders whole.
    const about = read("app/(site)/about/about-body.tsx");
    assert.match(about, /<h1>\{t\("site\.about\.threeQuestions"\)\}<\/h1>/);
    assert.ok(!/Answer them once/.test(about), "the English headline is still hard-coded");
  });
});

describe("round two: the copy that needed care", () => {
  it("the pricing heading breaks after Brändisi in Finnish, not mid-phrase", () => {
    const first = (l: "en" | "fi", d: Record<string, string>) =>
      d["site.pricing.h1"].split(" ").slice(0, PRICING_H1_BREAK_AFTER[l]).join(" ");
    assert.equal(first("en", en), "The commercial brain");
    assert.equal(first("fi", fi), "Brändisi");
    assert.match(read("app/(site)/pricing/pricing-client.tsx"), /PRICING_H1_BREAK_AFTER\[locale\]/);
  });

  it("prices are written the way each language writes them", () => {
    assert.equal(euro(29.9, "en"), "€29.90");
    assert.equal(euro(299, "en"), "€299");
    assert.equal(euro(0, "en"), "€0");
    // Symbol after the number, a (non-breaking) space, a decimal comma.
    assert.equal(euro(29.9, "fi"), "29,90\u00a0€");
    assert.equal(euro(24.92, "fi"), "24,92\u00a0€");
    assert.equal(euro(299, "fi"), "299\u00a0€");
    const pro = plansIn("fi").find((p) => p.id === "pro")!;
    assert.equal(pro.monthly, "29,90\u00a0€");
    assert.equal(comparisonIn("fi")[0].values.proplus, "45,90\u00a0€");
  });

  it("the top-up is the key whole, never a € prefix on a number", () => {
    assert.equal(TOP_UP, en["credit.topUp"]);
    assert.equal(topUpIn("fi"), fi["credit.topUp"]);
    assert.ok(topUpIn("fi").startsWith("9 €"), topUpIn("fi"));
    const client = read("app/(site)/pricing/pricing-client.tsx");
    assert.match(client, /t\("site\.pricing\.topUpFull"\)\.split\("\{topUp\}"\)/);
    assert.match(client, /<b>\{topUpIn\(locale\)\}<\/b>/);
    assert.ok(!/€/.test(client), "the pricing client writes a euro sign of its own");
  });

  it("the English plan ladder is unchanged by being keyed", () => {
    assert.deepEqual(PLANS, plansIn("en"));
    assert.equal(PLANS.find((p) => p.id === "free")!.cta, "Start free");
    assert.equal(creditCostsIn("en")[0].action, "One image");
  });

  it("the Finnish plans carry no English where a key exists", () => {
    const enPlans = plansIn("en"), fiPlans = plansIn("fi");
    for (const [i, p] of fiPlans.entries()) {
      assert.notEqual(p.who, enPlans[i].who, `${p.id} who`);
      assert.notEqual(p.credits, enPlans[i].credits, `${p.id} credits`);
    }
    for (const c of creditCostsIn("fi")) assert.ok(!/credit/i.test(c.cost), c.cost);
  });
});

describe("no redirect decides for anyone", () => {
  it("nothing on the site reads Accept-Language", () => {
    // "Redirecting on a public page is how you end up with a Finn who
    // cannot reach the English page and an American who cannot reach the
    // Finnish one."
    for (const f of ["lib/site-locale.ts", "components/site/site-nav.tsx",
                     "components/site/language-toggle.tsx", "app/(site)/layout.tsx"]) {
      const code = read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
      assert.ok(!/accept-language/i.test(code), `${f} reads Accept-Language`);
      assert.ok(!/redirect\(/.test(code), `${f} redirects`);
    }
  });

  it("and there is no middleware doing it out of sight", () => {
    for (const f of ["middleware.ts", "src/middleware.ts"]) {
      if (!existsSync(f)) continue;
      const code = read(f);
      assert.ok(!/accept-language/i.test(code), `${f} redirects the site by Accept-Language`);
    }
  });
});

describe("the sitemap, called rather than pattern-matched", () => {
  const entries = sitemap();

  it("lists the three English routes", () => {
    assert.deepEqual(entries.map((e) => e.url).sort(), [
      "https://www.branditect.io/",
      "https://www.branditect.io/about",
      "https://www.branditect.io/pricing",
    ]);
  });

  it("and no Finnish alternate while the Finnish pages are noindex", () => {
    // Flipping FI_COPY_READY has to add them; until then, listing a page a
    // crawler is told not to index is two contradictory instructions.
    for (const e of entries) {
      const alt = (e as { alternates?: { languages?: Record<string, string> } }).alternates;
      if (FI_COPY_READY) assert.ok(alt?.languages?.fi?.startsWith(SITE_ORIGIN + "/fi"), e.url);
      else assert.equal(alt, undefined, e.url);
    }
  });

  it("keeps everything behind a session out", () => {
    const urls = entries.map((e) => e.url);
    for (const path of ["/home", "/start", "/k", "/api", "/settings"]) {
      assert.ok(!urls.some((u) => u.endsWith(path)), `${path} is in the sitemap`);
    }
  });
});

describe("hreflang is absolute, and what is still owed when the flag flips", () => {
  it("metadataBase is set, or every annotation is relative and ignored", () => {
    const root = read("app/layout.tsx");
    assert.match(root, /metadataBase: new URL\(SITE_ORIGIN\)/);
    assert.equal(SITE_ORIGIN, "https://www.branditect.io");
  });

  it("the sitemap and metadataBase share one origin", () => {
    // Two origins would drift, and only one of them would be the one search
    // engines saw.
    assert.match(read("app/sitemap.ts"), /const BASE = SITE_ORIGIN;/);
  });

  it("the html lang is still hard-coded, and that is owed before the flip", () => {
    // <html lang="en"> is in the root layout, shared by the app and the
    // site. Today the Finnish routes render English copy, so lang="en" is
    // the truthful value and changing it would be the lie. When
    // FI_COPY_READY goes true it stops being truthful, so this test starts
    // demanding it rather than leaving it to be remembered.
    const root = read("app/layout.tsx");
    const hardCoded = /<html lang="en">/.test(root);
    if (FI_COPY_READY) {
      assert.ok(!hardCoded,
        'FI_COPY_READY is true but <html lang="en"> is hard-coded: the Finnish routes ' +
        "would declare themselves English");
    } else {
      assert.ok(hardCoded, "the lang handling changed; re-read this test");
    }
  });
});
