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
      const a = alternatesFor(p);
      assert.equal(a.languages.en, sitePath("en", p));
      assert.equal(a.languages.fi, sitePath("fi", p));
      assert.equal(a.languages["x-default"], sitePath("en", p));
      assert.equal(a.canonical, sitePath("en", p));
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
      const want = `alternatesFor("${p}")`;
      assert.ok(en.includes(want), `the English ${p} page does not claim ${p}`);
      assert.ok(fi.includes(want), `the Finnish ${p} page does not claim ${p}`);
    }
  });
});

describe("nothing claims Finnish until the Finnish arrives", () => {
  it("the fi routes are noindex while the copy is English", () => {
    for (const f of ["app/(site)/fi/page.tsx", "app/(site)/fi/pricing/page.tsx",
                     "app/(site)/fi/about/page.tsx"]) {
      assert.match(read(f), /robots: FI_COPY_READY \? undefined : \{ index: false/,
        `${f} would be indexed as Finnish while written in English`);
    }
  });

  it("the toggle renders nothing, rather than offering Suomi over English", () => {
    assert.match(read("components/site/language-toggle.tsx"), /if \(!FI_COPY_READY \|\| !here\) return null;/);
  });

  it("the sitemap lists no alternate it cannot honour", () => {
    // Listing a noindex page as an alternate tells a crawler two
    // contradictory things and the hreflang goes with it.
    assert.match(read("app/sitemap.ts"), /FI_COPY_READY\s*\?\s*\{ alternates/);
  });

  it("and one constant turns all of it on", () => {
    // The value today. If this ever fails, the switch was flipped and the
    // three assertions above are the ones to re-read.
    assert.equal(FI_COPY_READY, false,
      "FI_COPY_READY is true — check the Finnish copy actually landed");
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
                     "app/(site)/about/page.tsx"]) {
      const code = read(f).replace(/\/\*[\s\S]*?\*\//g, "");
      for (const dead of [/href="\/about"/, /href="\/pricing"/, /href="\/\?auth=/]) {
        assert.ok(!dead.test(code), `${f} still hard-codes ${dead}`);
      }
    }
    // /signup is an app route, not a public page, and stays absolute.
    assert.match(read("app/(site)/about/page.tsx"), /href="\/signup"/);
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
      assert.equal((e as { alternates?: unknown }).alternates, undefined, e.url);
    }
    assert.equal(FI_COPY_READY, false);
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
