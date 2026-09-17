/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SLOTS, USE_CASES, canonicalSlot, slotDef, formatOf } from "./logo-slots.ts";

describe("slots", () => {
  it("covers the four the database actually holds", () => {
    assert.deepEqual(SLOTS.map((s) => s.slot), ["primary", "dark", "white", "icon"]);
  });

  it("never puts a white logo on a white plate", () => {
    assert.equal(slotDef("white")!.plate, "dark");
    assert.equal(slotDef("dark")!.plate, "dark");
    assert.equal(slotDef("primary")!.plate, "light");
    assert.equal(slotDef("icon")!.plate, "check");
  });

  it("gives every slot a usage line", () => {
    for (const s of SLOTS) assert.ok(s.usage.length > 10, s.slot);
  });

  /** The spec's names are not in the data; they must still land somewhere. */
  it("maps the spec's slot names onto the real ones", () => {
    assert.equal(canonicalSlot("primary_light"), "primary");
    assert.equal(canonicalSlot("primary_dark"), "dark");
    assert.equal(canonicalSlot("symbol"), "icon");
    assert.equal(canonicalSlot("mono"), "white");
    assert.equal(canonicalSlot("wordmark"), "primary");
  });

  it("is case and whitespace insensitive", () => {
    assert.equal(canonicalSlot("  PRIMARY "), "primary");
  });

  it("returns null for a slot the grid does not understand", () => {
    assert.equal(canonicalSlot("banner"), null);
    assert.equal(canonicalSlot(null), null);
    assert.equal(canonicalSlot(""), null);
    assert.equal(slotDef("banner"), null);
  });
});

describe("which one do I use", () => {
  it("asks three questions, each answered by a real slot", () => {
    assert.equal(USE_CASES.length, 3);
    for (const u of USE_CASES) assert.ok(slotDef(u.slot), u.slot);
  });

  it("does not include the share-link card, which has nothing behind it yet", () => {
    assert.ok(!USE_CASES.some((u) => /link|outside/i.test(u.question + u.answer)));
  });
});

describe("formatOf", () => {
  it("reads the extension off the file name", () => {
    assert.equal(formatOf("Deklan_logo_white.svg"), "SVG");
    assert.equal(formatOf("NITRO ROUND LOGO.png"), "PNG");
    assert.equal(formatOf("Nitro Text logo@3x.PNG"), "PNG");
  });

  it("prefers the stored column once the migration has run", () => {
    assert.equal(formatOf("logo.png", "svg"), "SVG");
    assert.equal(formatOf("logo.png", "  "), "PNG");
  });

  it("returns null rather than a junk chip", () => {
    assert.equal(formatOf("logo"), null);
    assert.equal(formatOf(null), null);
    assert.equal(formatOf("archive.tarball"), null);
  });
});

describe("a logo fits the plate it is shown in", () => {
  const read = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");

  it("pins the image to the frame instead of trusting its intrinsic size", () => {
    // "In Sorbify brand mark, the brand mark stretches over the frame." An SVG
    // with only a viewBox has no intrinsic size and an SVG with width="2400"
    // has too much of one. max-width/max-height did not hold either, and
    // `height: 100%` has nothing definite to resolve against in a centred
    // grid, so a 120x900 mark rendered 1178px tall in an 84px frame.
    const css = read("components/visual-identity/visual-identity.module.css");
    const rule = css.slice(css.indexOf(".plate img {"));
    const block = rule.slice(0, rule.indexOf("}"));
    assert.match(block, /position:\s*absolute/, "the image is not pinned to the plate");
    assert.match(block, /object-fit:\s*contain/, "the image is not letterboxed");
    assert.ok(/width:\s*calc\(/.test(block) && /height:\s*calc\(/.test(block),
      "the pinned box has no definite size, so a replaced element keeps its own");
  });

  it("can be replaced and deleted from its own card", () => {
    const page = read("app/(app)/brand/visual-identity/page.tsx");
    assert.ok(page.includes("<ReplaceLogo"), "a logo cannot be replaced");
    assert.ok(page.includes("<DeleteLogo"), "a logo cannot be deleted");
    // Both know their slot, so neither asks which one it is changing.
    assert.ok(/<ReplaceLogo[\s\S]{0,160}slot=\{def\.slot\}/.test(page), "replace does not know its slot");
    assert.ok(/<DeleteLogo[\s\S]{0,160}slot=\{def\.slot\}/.test(page), "delete does not know its slot");
  });

  it("clears the logo the sidebar reads when the primary is deleted", () => {
    // brands.logo_url is what every screen renders in the corner. Deleting the
    // file it points at and leaving the column set is a broken image app-wide.
    const route = read("app/api/brand-assets/logo/route.ts");
    assert.match(route, /update\(\{ logo_url: null \}\)/, "the sidebar would keep a deleted logo");
    assert.match(route, /storage\.from\("brand-assets"\)\.remove/, "the stored file is left behind");
  });
});
