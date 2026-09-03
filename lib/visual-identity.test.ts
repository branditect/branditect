/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { normaliseHex, googleFontUrl, logoUploadType, UPLOAD_SLOTS } from "./visual-identity.ts";

describe("a hex someone typed", () => {
  it("takes it with or without the hash", () => {
    assert.equal(normaliseHex("#1A1A1A"), "#1a1a1a");
    assert.equal(normaliseHex("1A1A1A"), "#1a1a1a");
    assert.equal(normaliseHex("  #f0562a  "), "#f0562a");
  });

  it("expands the three-character form, which CSS accepts and storage should not", () => {
    assert.equal(normaliseHex("#abc"), "#aabbcc");
    assert.equal(normaliseHex("f00"), "#ff0000");
  });

  it("refuses anything that is not a colour, rather than saving a blank swatch", () => {
    for (const bad of ["", "  ", "#12", "#12345", "#1234567", "rebeccapurple", "#gg0000", "1a1a1a1"]) {
      assert.equal(normaliseHex(bad), null, `${JSON.stringify(bad)} was accepted`);
    }
  });
});

describe("the Google Fonts URL", () => {
  it("joins the family name with plus signs", () => {
    assert.ok(googleFontUrl("DM Sans").includes("family=DM+Sans:"));
    assert.ok(googleFontUrl("  Plus Jakarta Sans ").includes("family=Plus+Jakarta+Sans:"));
  });
  it("asks for the weights the specimen renders", () => {
    assert.ok(googleFontUrl("Inter").includes("wght@300;400;500;600;700"));
  });
});

describe("the logo slots line up with the plates the page draws", () => {
  it("names all four", () => {
    assert.deepEqual(UPLOAD_SLOTS.map((s) => s.slot), ["primary", "dark", "icon", "white"]);
  });
  it("builds the uploadType the endpoint switches on", () => {
    assert.equal(logoUploadType("primary"), "logo_primary");
  });
});

/**
 * Studio ▸ Brand assets was a second home for the brand library: Visual
 * identity showed everything and could change nothing, so its own empty states
 * sent people into Studio. These fail if the page comes back or if the URLs
 * stop resolving — it was in the nav for months, so it is in bookmarks.
 */
describe("Brand assets is retired, not hidden", () => {
  it("the Studio page is gone", () => {
    assert.ok(!existsSync("app/(app)/studio/brand-assets/page.tsx"));
    assert.ok(!existsSync("app/(app)/studio/brand-assets"));
  });

  it("both old URLs redirect to Visual identity", () => {
    const cfg = readFileSync("next.config.mjs", "utf8");
    for (const src of ["/studio/brand-assets", "/dashboard/brand-assets"]) {
      const re = new RegExp(`source: '${src}', destination: '/brand/visual-identity'`);
      assert.ok(re.test(cfg), `${src} does not redirect to /brand/visual-identity`);
    }
  });

  it("nothing links to it any more", () => {
    for (const f of [
      "app/(app)/brand/visual-identity/page.tsx",
      "app/(app)/studio/brand-book/BrandBookClient.tsx",
      "app/(app)/home/page.tsx",
    ]) {
      assert.ok(!readFileSync(f, "utf8").includes("/studio/brand-assets"), `${f} still links to it`);
    }
  });

  it("Visual identity can now add a logo, a colour and a typeface", () => {
    const src = readFileSync("app/(app)/brand/visual-identity/page.tsx", "utf8");
    for (const c of ["AddLogo", "AddColour", "AddTypeface"]) {
      assert.ok(src.includes(`<${c}`), `${c} is not rendered on the page`);
    }
  });

  it("the colour section renders when there are no colours, or there is no way to add the first", () => {
    const src = readFileSync("app/(app)/brand/visual-identity/page.tsx", "utf8");
    assert.ok(!/\{colors\.length > 0 && \(\s*<section/.test(src),
      "the colour section is hidden when empty again");
  });
});

/**
 * These three endpoints ran on the service key and took brandId from the
 * request body, so an unauthenticated POST could write a logo, a colour or a
 * font into any brand, and DELETE removed any brand's typeface by id.
 */
describe("the brand-asset endpoints identify the caller", () => {
  const ROUTES = [
    "app/api/brand-assets/upload/route.ts",
    "app/api/brand-assets/font/route.ts",
    "app/api/brand-book/color/route.ts",
  ];

  for (const r of ROUTES) {
    it(`${r} resolves the brand from the token`, () => {
      const src = readFileSync(r, "utf8");
      assert.ok(src.includes("resolveBrand"), "no resolveBrand call");
      const handlers = (src.match(/export async function (POST|DELETE|PATCH|PUT)/g) ?? []).length;
      const guards = (src.match(/await resolveBrand\(/g) ?? []).length;
      assert.equal(guards, handlers,
        `${handlers} handler(s) but ${guards} guard(s) — one is unprotected`);
    });

    it(`${r} never trusts a brandId straight off the body`, () => {
      const src = readFileSync(r, "utf8");
      assert.ok(!/const \{ brandId[,\s}]/.test(src),
        "destructures brandId directly — it must be renamed and checked");
    });
  }

  it("deleting a font is scoped by brand, not just by id", () => {
    const src = readFileSync("app/api/brand-assets/font/route.ts", "utf8");
    const del = src.slice(src.indexOf("export async function DELETE"));
    assert.ok(del.includes(".eq('brand_id'"), "DELETE is not scoped to the caller's brand");
  });
});
