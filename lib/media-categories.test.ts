/** Run with: npm test — criterion 11 of branditect-ui/spec/knowledge-images.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ALLOWED_CATEGORIES, ORIGINAL_CATEGORIES, MEDIA_CATEGORIES,
  TYPE_TABS, isAllowedCategory, unwritableTabs,
} from "./media-categories.ts";

/**
 * CRITERION 11. Every type tab must write a category the database accepts.
 *
 * The spec expected four of the five to fail. Probed live first: the
 * constraint had already been widened by hand, so nothing was migrated. What
 * remains is that nothing stopped it and nothing would stop the next one.
 */
describe("every media tab writes a category the database accepts", () => {
  it("all five", () => {
    assert.deepEqual(unwritableTabs(), [],
      `these tabs write a value the constraint rejects: ${JSON.stringify(unwritableTabs())}`);
  });

  it("there are five of them", () => {
    assert.equal(TYPE_TABS.length, 5);
    assert.deepEqual(TYPE_TABS.map((t) => t.icon), ["IMG", "VID", "SND", "GFX", "WEB"]);
  });

  it("the four media values are the ones that were missing", () => {
    assert.deepEqual([...MEDIA_CATEGORIES], ["video", "audio", "graphic", "web"]);
    for (const c of MEDIA_CATEGORIES) assert.ok(isAllowedCategory(c), c);
  });

  it("widened, never replaced — the original six are still allowed", () => {
    // Dropping one orphans live rows using it.
    for (const c of ORIGINAL_CATEGORIES) {
      assert.ok(isAllowedCategory(c), `${c} was dropped from the allowed list`);
    }
    assert.equal(ALLOWED_CATEGORIES.length, 10);
  });

  it("a value nobody agreed on is not allowed", () => {
    assert.ok(!isAllowedCategory("zz-not-a-real-category"));
    assert.ok(!isAllowedCategory(""));
  });
});

/**
 * The page held these as loose strings in two places — a list for the buttons
 * and a category= prop per panel — so the two could disagree without anything
 * noticing. That is how a tab ends up writing a value the constraint refuses.
 */
describe("the page and the list cannot drift apart", () => {
  const src = readFileSync("app/(app)/knowledge/images/page.tsx", "utf8");

  it("the page takes its tabs from the shared list", () => {
    assert.ok(src.includes("TYPE_TABS") || src.includes("media-categories"),
      "the page still declares its own tab list");
  });

  it("no category= prop names a value outside the allowed list", () => {
    const used = [...src.matchAll(/category="([a-z-]+)"/g)].map((m) => m[1]);
    for (const c of used) {
      assert.ok(isAllowedCategory(c), `the page passes category="${c}", which the constraint rejects`);
    }
  });
});

/** The recorded state, so the next reader does not re-run the probe. */
describe("the finding is written down", () => {
  const sql = readFileSync("supabase/brand-images-categories.sql", "utf8");

  it("records that the constraint was already widened", () => {
    assert.ok(/already been widened by hand/i.test(sql));
  });

  it("has no live statement to run", () => {
    const active = sql.split("\n").filter((l) => !l.trim().startsWith("--")).join("").trim();
    assert.equal(active, "", `the file has runnable SQL in it: ${active.slice(0, 80)}`);
  });

  it("warns that the spec's DROP-then-ADD could narrow the constraint", () => {
    assert.ok(/narrow the\s*\n?--\s*constraint|silently narrow/i.test(sql));
  });
});
