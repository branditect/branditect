import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decideAccess } from "./ownership.ts";

describe("ownership", () => {
  it("lets a user reach their own brand", () => {
    assert.deepEqual(decideAccess("brand-a", "brand-a"), { ok: true, brandId: "brand-a" });
  });

  it("refuses user A asking for user B's brand", () => {
    const r = decideAccess("brand-a", "brand-b");
    assert.equal(r.ok, false);
    assert.equal((r as { status: number }).status, 403);
  });

  it("refuses with 403, never 404 — a 404 would confirm the id exists", () => {
    const real = decideAccess("brand-a", "brand-b");
    const madeUp = decideAccess("brand-a", "does-not-exist-anywhere");
    assert.deepEqual(real, madeUp, "a real id and an invented one must be indistinguishable");
  });

  it("falls back to the session's brand when none is requested", () => {
    assert.deepEqual(decideAccess("brand-a", undefined), { ok: true, brandId: "brand-a" });
    assert.deepEqual(decideAccess("brand-a", null), { ok: true, brandId: "brand-a" });
  });

  it("refuses when the account owns no brand", () => {
    assert.equal(decideAccess(null, "brand-a").ok, false);
    assert.equal(decideAccess(null, undefined).ok, false);
  });
});
