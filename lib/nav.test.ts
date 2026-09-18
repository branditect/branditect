/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { NAV, visibleChildren } from "./nav.ts";

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

/**
 * CLAUDE.md opens with a nav table, and it is the first thing read every
 * session. Its Numbers row said "Profitability · Product costs · Pricing &
 * offers" for weeks: Numbers has no nav children at all, and none of those
 * three are route names either. A wrong line there produces wrong code before
 * anyone opens lib/nav.ts.
 *
 * Finding 1 of branditect-ui/spec/doc-audit.md.
 */
describe("the nav table in CLAUDE.md matches lib/nav.ts", () => {
  const doc = readFileSync("CLAUDE.md", "utf8");
  const table = doc.slice(doc.indexOf("## Navigation"), doc.indexOf("Rules that hold"));
  const rowFor = (label: string) => {
    const lines = table.split("\n");
    const i = lines.findIndex((l) => l.startsWith(label));
    if (i === -1) return null;
    // A row may wrap onto continuation lines, which are indented.
    let row = lines[i];
    for (let j = i + 1; j < lines.length && /^\s{4,}\S/.test(lines[j]); j++) row += " " + lines[j].trim();
    return row;
  };

  for (const item of NAV) {
    it(`${item.label} has a row`, () => {
      assert.ok(rowFor(item.label), `no row for ${item.label}`);
    });
  }

  for (const item of NAV.filter((i) => visibleChildren(i).length)) {
    it(`${item.label} lists exactly its real children`, () => {
      const row = rowFor(item.label)!;
      // Exact set equality, not "contains". Checking only for missing names let
      // a row keep advertising a page that had been deleted — "Brand assets"
      // survived in the Studio row that way, and a stale name in this table is
      // an instruction to rebuild something that was removed on purpose.
      const listed = row.split(" · ").slice(1).map((x) => x.trim()).filter(Boolean);
      // Visible children only: a parked entry (hidden: true) is not in the
      // sidebar, so the table must not advertise it either.
      const real = visibleChildren(item).map((c) => c.label);
      assert.deepEqual(listed, real,
        `${item.label} row lists ${JSON.stringify(listed)} but lib/nav.ts has ${JSON.stringify(real)}`);
    });
  }

  it("Numbers is not described as having nav children, because it has none", () => {
    const numbers = NAV.find((i) => i.label === "Numbers")!;
    assert.equal(numbers.children, undefined, "lib/nav.ts gave Numbers children");
    const row = rowFor("Numbers")!;
    assert.ok(/not nav children/.test(row), "the row does not say they are not nav children");
  });

  it("every route the Numbers row names actually exists", () => {
    const row = rowFor("Numbers")!;
    const named = row.slice(row.indexOf(";") + 1)
      .replace(/are routes beneath it.*$/, "")
      .split(/,| and /)
      .map((w) => w.replace(/[^a-z ]/gi, "").trim().replace(/\s+/g, "-"))
      .filter(Boolean);
    assert.ok(named.length >= 5, `expected the five child routes, parsed ${JSON.stringify(named)}`);
    for (const r of named) {
      assert.ok(existsSync(`app/(app)/numbers/${r}/page.tsx`),
        `the row names ${r}, but app/(app)/numbers/${r}/page.tsx does not exist`);
    }
  });
});

/**
 * Parking a screen.
 *
 * `hidden: true` takes a page out of the sidebar without deleting it. Two
 * things have to stay true or parking becomes a way to lose work: the route
 * must still exist (so the page can be finished), and the sidebar must not
 * render it (so nobody finds a half-thought screen through the menu).
 */
describe("parked nav entries", () => {
  const parked = NAV.flatMap((i) => (i.children ?? []).filter((c) => c.hidden));

  it("the sidebar renders visibleChildren, not children", () => {
    const sidebar = readFileSync("components/sidebar.tsx", "utf8");
    assert.ok(sidebar.includes("visibleChildren"), "sidebar does not filter parked entries");
    assert.ok(
      !/item\.children\.map/.test(sidebar),
      "sidebar still maps over item.children, so parked entries would render",
    );
  });

  for (const child of parked) {
    it(`${child.href} is parked but still built`, () => {
      assert.ok(
        existsSync(`app/(app)${child.href}/page.tsx`),
        `${child.href} is parked but the page is gone — delete the nav entry instead`,
      );
    });
  }

  it("Channels is the one parked entry, and it is parked", () => {
    // If this fails because Channels came back, delete this test with it.
    const brand = NAV.find((i) => i.label === "Brand")!;
    const channels = brand.children!.find((c) => c.label === "Channels");
    assert.ok(channels, "Channels left lib/nav.ts entirely");
    assert.equal(channels!.hidden, true, "Channels is no longer parked — update CLAUDE.md too");
  });
});
