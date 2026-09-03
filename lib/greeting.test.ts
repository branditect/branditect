/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { greeting, greetingsDisagree, GREETING_BEFORE_MOUNT } from "./greeting.ts";

describe("the greeting boundaries", () => {
  it("morning up to noon", () => {
    assert.equal(greeting(0), "Good morning");
    assert.equal(greeting(11), "Good morning");
  });
  it("afternoon from noon", () => {
    assert.equal(greeting(12), "Good afternoon");
    assert.equal(greeting(17), "Good afternoon");
  });
  it("evening from six", () => {
    assert.equal(greeting(18), "Good evening");
    assert.equal(greeting(23), "Good evening");
  });
});

/**
 * The windows named in the bug report, stated as a test so the reason the fix
 * exists cannot be lost. These are the hours where a server rendering in UTC
 * and a browser in UTC+3 would print different words into the same heading.
 */
describe("UTC and UTC+3 disagree in three windows a day", () => {
  const disagreeing = [...Array(24).keys()].filter((h) => greetingsDisagree(h, 3));

  it("nine hours a day, in three runs of three", () => {
    assert.deepEqual(disagreeing, [9, 10, 11, 15, 16, 17, 21, 22, 23]);
  });

  it("which is 12:00–15:00, 18:00–21:00 and 00:00–03:00 in Helsinki", () => {
    const local = disagreeing.map((h) => (h + 3) % 24).sort((a, b) => a - b);
    assert.deepEqual(local, [0, 1, 2, 12, 13, 14, 18, 19, 20]);
  });

  it("and agree the rest of the day, so the bug looked intermittent", () => {
    assert.equal(24 - disagreeing.length, 15);
  });
});

/**
 * The fix itself. A greeting computed during render is the bug; the hour has to
 * come from an effect, which only runs in the browser.
 */
describe("Home does not compute the hour during render", () => {
  const src = readFileSync("app/(app)/home/page.tsx", "utf8");

  it("no new Date() outside an effect", () => {
    // Concise or braced arrow body, either is fine — what matters is that the
    // only new Date() sits inside the effect and not in the render path.
    const inEffect = /useEffect\(\(\) =>[\s\S]{0,160}?new Date\(\)/.test(src);
    const dates = (src.match(/new Date\(\)/g) ?? []).length;
    assert.ok(inEffect, "the hour is not read in an effect");
    assert.equal(dates, 1, `expected exactly one new Date(), in the effect; found ${dates}`);
  });

  it("no useMemo(() => new Date(), []) — the shape that caused #425", () => {
    assert.ok(!/useMemo\(\(\) => new Date\(\)/.test(src));
  });

  it("renders a stable greeting before the hour is known", () => {
    // The shared constant, not a copy of its text, so the server render and
    // this test cannot drift apart from each other.
    assert.ok(src.includes("GREETING_BEFORE_MOUNT"), "the pre-mount greeting is not rendered");
    assert.ok(/hour === null \? GREETING_BEFORE_MOUNT/.test(src), "the null hour is not handled");
    assert.equal(GREETING_BEFORE_MOUNT, "Hello");
  });
});
