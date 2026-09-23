import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * A signed-in account always ends up with a brand.
 *
 * Confirming an address from the email signs the person in without passing
 * through /signup or /login, so neither screen's ensureBrand() call runs. The
 * account then has no brand row, useBrand hands back "default", and every
 * write is refused by row-level security: "the account exists, it just will
 * not save anything". scripts/brand-repair-check.mjs walks that door against
 * the live project; this holds the shape of the fix in place.
 */
const useBrand = readFileSync("lib/useBrand.ts", "utf8");

describe("a confirmed account gets a brand however it arrived", () => {
  it("useBrand repairs a missing brand instead of returning default", () => {
    assert.match(useBrand, /import \{ ensureBrand \} from "@\/lib\/brand-bootstrap"/);
    assert.match(useBrand, /if \(!data && !repairAttempted\.has\(user\.id\)\)/);
    assert.match(useBrand, /const \{ brandId \} = await ensureBrand\(\)/);
  });

  it("the repaired brand is read back, not assumed", () => {
    // ensureBrand returns an id; the row itself is what useBrand renders, and
    // a row it cannot see is no repair at all.
    assert.match(useBrand, /if \(brandId\) data = await read\(\)/);
  });

  it("one attempt per account, so a failure cannot loop", () => {
    assert.match(useBrand, /repairAttempted\.add\(user\.id\)/);
    assert.match(useBrand, /const repairAttempted = new Set<string>\(\)/);
  });

  it("signing out forgets the attempt, so the next account gets its own", () => {
    assert.match(useBrand, /SIGNED_OUT[\s\S]{0,80}forgetRepairs\(\)/);
  });

  it("brandId still falls back to default for a signed-out visitor", () => {
    // The fallback is correct when nobody is signed in — it is only a bug
    // when an account has one. Removing it would break the public pages.
    assert.match(useBrand, /brandId: brand\?\.brand_id \|\| "default"/);
  });
});
