/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
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
