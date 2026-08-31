/** Run with: npm test — criteria from the public site brief. */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PLANS, COMPARISON } from "./pricing-plans.ts";

const SITE = new URL("../app/(site)", import.meta.url).pathname;
const REFERENCE = new URL("../branditect-ui/reference/pricing-page.html", import.meta.url).pathname;

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });
}

const SITE_FILES = filesUnder(SITE);
const read = (f: string) => readFileSync(f, "utf8");

describe("the public site exists", () => {
  it("has a landing page, an About and a Pricing", () => {
    for (const page of ["page.tsx", "about/page.tsx", "pricing/page.tsx", "layout.tsx"]) {
      assert.ok(SITE_FILES.some((f) => f.endsWith(page)), `missing ${page}`);
    }
  });

  it("no longer has the old root that redirected to the login form", () => {
    let existed = true;
    try { statSync(new URL("../app/page.tsx", import.meta.url).pathname); } catch { existed = false; }
    assert.equal(existed, false, "app/page.tsx still exists and would shadow the landing page");
  });
});

/** Criterion 4. Five surfaces hand-rolled the mark before logo.tsx existed. */
describe("the nav uses components/logo.tsx", () => {
  it("imports Logo in the layout", () => {
    const layout = read(SITE_FILES.find((f) => f.endsWith("(site)/layout.tsx"))!);
    assert.ok(/from "@\/components\/logo"/.test(layout), "the layout does not import Logo");
    assert.ok(/<Logo\b/.test(layout), "the layout does not render Logo");
  });

  it("draws no mark of its own anywhere under (site)", () => {
    for (const f of SITE_FILES) {
      const src = read(f);
      assert.ok(!/linearGradient/i.test(src), `${f} draws a gradient of its own`);
      assert.ok(!/viewBox="0 0 119 123"/.test(src), `${f} inlines the mark artwork`);
      // A lone "B" in a coloured box was the shape five surfaces reinvented.
      assert.ok(!/>\s*B\s*</.test(src), `${f} looks like a hand-drawn B mark`);
    }
  });
});

/**
 * Criterion 6, amended. The brief's own table and reference/pricing-page.html
 * carry 29.90 and 45.90 and call them current; spec/pricing.md is titled
 * "a recommendation" and proposes 44.90 and 59.90. These assert the shipped
 * numbers against the reference, and that the page cannot drift from the
 * module it reads.
 */
describe("the prices match the reference the page was built from", () => {
  const ref = read(REFERENCE);
  const pro = PLANS.find((p) => p.id === "pro")!;
  const proPlus = PLANS.find((p) => p.id === "proplus")!;

  it("Pro is €29.90 a month, €24.92 billed yearly, 350 credits", () => {
    assert.equal(pro.monthly, "€29.90");
    assert.equal(pro.yearlyMonthly, "€24.92");
    assert.equal(pro.yearlyTotal, "€299");
    assert.equal(pro.credits, "350 credits");
    for (const v of ["€29.90", "€24.92", "€299", "350 credits"]) {
      assert.ok(ref.includes(v), `the reference does not carry ${v}`);
    }
  });

  it("Pro Plus is €45.90 a month, €38.25 billed yearly, 600 credits", () => {
    assert.equal(proPlus.monthly, "€45.90");
    assert.equal(proPlus.yearlyMonthly, "€38.25");
    assert.equal(proPlus.yearlyTotal, "€459");
    assert.equal(proPlus.credits, "600 credits");
    for (const v of ["€45.90", "€38.25", "€459", "600 credits"]) {
      assert.ok(ref.includes(v), `the reference does not carry ${v}`);
    }
  });

  it("Free is €0 with 100 one-time credits", () => {
    const free = PLANS.find((p) => p.id === "free")!;
    assert.equal(free.monthly, "€0");
    assert.equal(free.credits, "100 credits");
    assert.match(free.creditsLabel, /one time/i);
  });

  /** The cards and the table read the same module, so they cannot disagree. */
  it("the comparison table agrees with the cards", () => {
    const priceRow = COMPARISON.find((r) => /price/i.test(r.label))!;
    const creditRow = COMPARISON.find((r) => /credit/i.test(r.label))!;
    assert.equal(priceRow.values.pro, PLANS.find((p) => p.id === "pro")!.monthly);
    assert.equal(priceRow.values.proplus, PLANS.find((p) => p.id === "proplus")!.monthly);
    assert.ok(creditRow.values.pro.startsWith("350"));
    assert.ok(creditRow.values.proplus.startsWith("600"));
  });

  it("brands, seats and storage match the brief", () => {
    const by = (label: string) => COMPARISON.find((r) => r.label === label)!.values;
    assert.deepEqual(by("Brands"), { free: "1", pro: "1", proplus: "3", enterprise: "Unlimited" });
    assert.deepEqual(by("Seats"), { free: "1", pro: "1", proplus: "3", enterprise: "Agreed" });
    assert.deepEqual(by("Storage"), { free: "200 MB", pro: "5 GB", proplus: "20 GB", enterprise: "Agreed" });
  });

  it("the page never writes a price of its own", () => {
    for (const f of SITE_FILES) {
      const src = read(f);
      // €0 is the free plan's label inside the module; anywhere else a euro
      // figure in the markup means a number that can drift.
      const euros = src.match(/€\d[\d.,]*/g) ?? [];
      assert.deepEqual(euros, [], `${f} hard-codes ${euros.join(", ")}`);
    }
  });
});

/** Criterion 7. */
describe("every public page carries metadata", () => {
  const pages = SITE_FILES.filter((f) => f.endsWith("page.tsx"));

  it("finds all three", () => {
    assert.equal(pages.length, 3, pages.join(", "));
  });

  for (const page of pages) {
    const name = page.slice(page.indexOf("(site)"));
    it(`${name} exports a title and a description`, () => {
      const src = read(page);
      assert.ok(/export const metadata/.test(src), `${name} exports no metadata`);
      assert.ok(/title:\s*"[^"]{8,}"/.test(src), `${name} has no real title`);
      assert.ok(/description:\s*\n?\s*[`"][^`"]{30,}/.test(src), `${name} has no real description`);
      assert.ok(/openGraph/.test(src), `${name} has no Open Graph block`);
      // The card itself is a sibling file; a segment that declares openGraph
      // without one ships with no image at all.
      const dir = page.slice(0, page.lastIndexOf("/"));
      assert.ok(SITE_FILES.some((f) => f === `${dir}/opengraph-image.tsx`),
        `${name} declares openGraph but has no opengraph-image.tsx beside it`);
    });
  }
});

/** Criterion 8. */
describe("sitemap and robots", () => {
  const sitemap = read(new URL("../app/sitemap.ts", import.meta.url).pathname);
  const robots = read(new URL("../app/robots.ts", import.meta.url).pathname);

  it("lists exactly the three public routes", () => {
    const urls = [...sitemap.matchAll(/\$\{BASE\}(\/[a-z]*)/g)].map((m) => m[1]);
    assert.deepEqual(urls.sort(), ["/", "/about", "/pricing"]);
  });

  it("keeps the app, onboarding and the kit portal out of the sitemap", () => {
    // The comment above the entries names what it excludes; the entries are
    // what matters.
    const urls = [...sitemap.matchAll(/\$\{BASE\}(\/[a-z]*)/g)].map((m) => m[1]);
    for (const path of ["/home", "/start", "/k", "/api"]) {
      assert.ok(!urls.includes(path), `${path} is in the sitemap`);
    }
  });

  it("disallows the api, the kit portal, onboarding and the app routes", () => {
    for (const path of ["/api/", "/k/", "/start", "/home", "/brand/", "/knowledge/", "/studio/"]) {
      assert.ok(robots.includes(`"${path}"`), `robots does not disallow ${path}`);
    }
  });

  it("points at the sitemap", () => {
    assert.ok(/sitemap:\s*`\$\{BASE\}\/sitemap\.xml`/.test(robots));
  });
});

/**
 * Criterion 10. The house style lib/house-style.ts enforces on generated
 * output applies to what we write ourselves. Checked across the whole file,
 * comments included, so there is nothing to argue about.
 */
describe("no em dashes on the public site", () => {
  for (const f of [...SITE_FILES, new URL("../components/site/site.module.css", import.meta.url).pathname,
                   new URL("../components/site/signed-in-gate.tsx", import.meta.url).pathname,
                   new URL("./pricing-plans.ts", import.meta.url).pathname]) {
    const name = f.slice(f.lastIndexOf("/") + 1);
    it(`${name} has none`, () => {
      const src = read(f);
      const found = [...src.matchAll(/.{0,40}[—–].{0,40}/g)].map((m) => m[0]);
      assert.deepEqual(found, [], `${f}:\n${found.join("\n")}`);
    });
  }
});
