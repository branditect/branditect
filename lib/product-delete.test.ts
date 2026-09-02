/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  isLive, liveOnly, deletedOnly, daysLeft, recoveryNote, confirmCopy, RECOVERABLE_DAYS,
} from "./product-delete.ts";

describe("what counts as live", () => {
  it("a row with no stamp is live", () => {
    assert.equal(isLive({ deleted_at: null }), true);
    assert.equal(isLive({}), true);
  });

  it("a stamped row is not", () => {
    assert.equal(isLive({ deleted_at: "2026-09-02T10:00:00Z" }), false);
  });

  /**
   * The column does not exist until supabase/product-delete.sql is run. Until
   * then every row arrives without the field, and every one of them must read
   * as live rather than as deleted.
   */
  it("treats a missing column as live, so nothing vanishes before the migration", () => {
    const beforeMigration = [{ id: "a" }, { id: "b" }] as { id: string; deleted_at?: string | null }[];
    assert.equal(liveOnly(beforeMigration).length, 2);
    assert.equal(deletedOnly(beforeMigration).length, 0);
  });

  it("splits a mixed list", () => {
    const rows = [
      { id: "a" }, { id: "b", deleted_at: "2026-09-01T00:00:00Z" }, { id: "c", deleted_at: null },
    ];
    assert.deepEqual(liveOnly(rows).map((r) => r.id), ["a", "c"]);
    assert.deepEqual(deletedOnly(rows).map((r) => r.id), ["b"]);
  });

  it("survives null and undefined", () => {
    assert.deepEqual(liveOnly(null), []);
    assert.deepEqual(deletedOnly(undefined), []);
    assert.equal(isLive(null), false);
  });
});

describe("how long it stays recoverable", () => {
  const at = (iso: string) => new Date(iso);

  it("is the full window on the day it goes", () => {
    assert.equal(daysLeft("2026-09-02T10:00:00Z", at("2026-09-02T10:00:00Z")), RECOVERABLE_DAYS);
  });

  it("counts down", () => {
    assert.equal(daysLeft("2026-09-02T10:00:00Z", at("2026-09-12T10:00:00Z")), 20);
    assert.equal(daysLeft("2026-09-02T10:00:00Z", at("2026-10-01T10:00:00Z")), 1);
  });

  it("never goes negative", () => {
    assert.equal(daysLeft("2026-01-01T00:00:00Z", at("2026-09-02T00:00:00Z")), 0);
  });

  it("does not crash on a stamp it cannot read", () => {
    assert.equal(daysLeft("not a date"), RECOVERABLE_DAYS);
  });

  it("reads as a sentence", () => {
    assert.equal(recoveryNote("2026-09-02T10:00:00Z", at("2026-10-01T10:00:00Z")), "1 day left to restore");
    assert.equal(recoveryNote("2026-09-02T10:00:00Z", at("2026-09-12T10:00:00Z")), "20 days left to restore");
    assert.equal(recoveryNote("2026-01-01T00:00:00Z", at("2026-09-02T00:00:00Z")), "Due to be cleared");
  });
});

describe("the confirm step", () => {
  const copy = confirmCopy("SORBIFY OIL");

  it("names the product, so it is not a dialog people click through", () => {
    assert.ok(copy.title.includes("SORBIFY OIL"), copy.title);
  });

  it("says the costs are kept, and for how long", () => {
    assert.ok(copy.body.includes(String(RECOVERABLE_DAYS)), copy.body);
    assert.ok(/costs, prices and guardrails/.test(copy.body), copy.body);
  });

  it("labels the button with the action, not with Yes", () => {
    assert.equal(copy.confirm, "Remove it");
  });

  it("has no em dash", () => {
    for (const v of Object.values(copy)) assert.ok(!/[—–]/.test(v), v);
  });
});

/**
 * The thing that would actually lose someone's work. Supabase is on the Free
 * plan: no scheduled backups, no point-in-time recovery.
 */
describe("nothing on this path hard deletes", () => {
  const route = readFileSync(new URL("../app/api/catalog/product/route.ts", import.meta.url), "utf8");

  it("the product route never calls .delete()", () => {
    assert.ok(!/\.delete\(\)/.test(route), "the product route calls .delete()");
  });

  it("its DELETE handler stamps deleted_at instead", () => {
    assert.ok(/export async function DELETE/.test(route), "there is no DELETE handler");
    assert.ok(/deleted_at: restore \? null : new Date\(\)\.toISOString\(\)/.test(route),
      "DELETE does not stamp deleted_at");
  });

  it("refuses rather than falling back to a real delete when the column is missing", () => {
    assert.ok(/not_migrated/.test(route), "there is no guard for the missing column");
  });

  it("scopes the write by brand_id as well as id", () => {
    const handler = route.slice(route.indexOf("export async function DELETE"));
    assert.ok(/\.eq\("brand_id", brandId\)/.test(handler), "DELETE is not scoped by brand");
  });
});

/** A removed product must be out of everything, not just the list. */
describe("a removed product leaves every surface", () => {
  const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");

  it("is filtered out of the brand context Studio writes from", () => {
    assert.ok(/liveOnly/.test(read("./brandContext.ts")), "brandContext does not filter removed products");
  });

  it("is filtered out of the catalog listing", () => {
    assert.ok(/liveOnly/.test(read("../app/api/catalog/route.ts")), "the catalog route does not filter");
  });

  it("is filtered out of the image generator's product picker", () => {
    assert.ok(/liveOnly/.test(read("../app/(app)/studio/create-images/page.tsx")), "the picker does not filter");
  });

  it("is refused by the image route, like a foreign product", () => {
    assert.ok(/isLive/.test(read("../app/api/brand/generate-from-reference/route.ts")),
      "the image route does not check for a removed product");
  });

  it("stops counting toward Brand Readiness", () => {
    assert.ok(/liveOnly/.test(read("./useReadiness.ts")), "readiness still counts removed products");
  });
});
