/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { NAV } from "./nav.ts";

/**
 * nav.ts promises "no dead entries" in its own header comment. A comment does
 * not enforce anything: deleting a route leaves the link behind, and the only
 * thing that notices is somebody clicking it and getting a 404.
 */
describe("every nav link goes somewhere that exists", () => {
  const hrefs = NAV.flatMap((item) => [item.href, ...(item.children ?? []).map((c) => c.href)]);

  // /brand and /studio are parents that open a sub-menu rather than routes of
  // their own, so they are exempt. Everything else must have a page file.
  const PARENTS_ONLY = new Set(["/brand", "/studio", "/knowledge"]);

  for (const href of hrefs) {
    if (PARENTS_ONLY.has(href)) continue;
    it(`${href} has a page`, () => {
      assert.ok(
        existsSync(`app/(app)${href}/page.tsx`),
        `${href} is in the nav but app/(app)${href}/page.tsx does not exist`,
      );
    });
  }
});

/**
 * Visual identity superseded the Studio ▸ Brand assets tab. The tab is gone
 * from the nav; this fails if it comes back, which is how a superseded screen
 * quietly returns.
 */
describe("Brand assets is not a Studio tab any more", () => {
  it("the Studio section does not list it", () => {
    const studio = NAV.find((i) => i.label === "Studio");
    const labels = (studio?.children ?? []).map((c) => c.label);
    assert.ok(!labels.includes("Brand assets"), `Studio still lists: ${labels.join(", ")}`);
  });

  it("Visual identity is where logos and typefaces live", () => {
    const brand = NAV.find((i) => i.label === "Brand");
    const hrefs = (brand?.children ?? []).map((c) => c.href);
    assert.ok(hrefs.includes("/brand/visual-identity"));
  });

  it("the Home card points at Visual identity, not the retired tab", () => {
    const home = readFileSync("app/(app)/home/page.tsx", "utf8");
    assert.ok(!home.includes('href: "/studio/brand-assets"'), "Home still links to the retired tab");
    assert.ok(home.includes('href: "/brand/visual-identity"'));
  });
});
