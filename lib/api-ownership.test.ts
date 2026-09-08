/** Run with: npm test — criterion 4 of branditect-ui/spec/security-hardening.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * CRITERION 4, and the one that matters.
 *
 * Twenty-one routes drifted into using the service-role client with no
 * ownership check, one at a time, and the twenty-second would too. The service
 * role bypasses RLS completely, so closing RLS at the database does nothing
 * for a route that holds it.
 *
 * The rule: a route that imports supabase-admin must also import api-auth.
 * Exemptions are listed by name and each one carries its reason, so adding to
 * the list is a deliberate act somebody can review rather than a silent drift.
 */
function routeFiles(dir = "app/api"): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...routeFiles(p));
    else if (entry === "route.ts") out.push(p);
  }
  return out;
}

const name = (p: string) => p.replace("app/api/", "").replace("/route.ts", "");

/**
 * Routes that hold the service key and legitimately need no ownership check.
 * Each one must touch no brand-scoped table and accept no brand id.
 */
const EXEMPT: Record<string, string> = {};

describe("every route that holds the service key checks ownership", () => {
  const files = routeFiles();

  it("finds the routes at all, so this cannot pass vacuously", () => {
    assert.ok(files.length > 20, `only ${files.length} route files found`);
  });

  for (const file of routeFiles()) {
    const src = readFileSync(file, "utf8");
    if (!src.includes("supabase-admin")) continue;
    const n = name(file);
    if (n in EXEMPT) continue;

    it(`${n} imports api-auth`, () => {
      assert.ok(src.includes("api-auth"),
        `${file} uses the service-role client and never identifies the caller. ` +
        `The service role bypasses RLS, so this route is open to anyone with the URL.`);
    });

    it(`${n} guards every handler`, () => {
      const handlers = (src.match(/export async function (GET|POST|PATCH|PUT|DELETE)/g) ?? []).length;
      const guards = (src.match(/resolveBrand\(/g) ?? []).length;
      assert.ok(guards >= handlers,
        `${file} has ${handlers} handler(s) but ${guards} resolveBrand call(s)`);
    });
  }

  it("no exemption is stale", () => {
    for (const n of Object.keys(EXEMPT)) {
      const f = files.find((x) => name(x) === n);
      assert.ok(f, `${n} is exempted but no longer exists — remove the exemption`);
      assert.ok(readFileSync(f!, "utf8").includes("supabase-admin"),
        `${n} no longer uses the service key — remove the exemption`);
    }
  });
});

/** CRITERION 5. */
describe("the comment that stopped anyone looking", () => {
  const src = readFileSync("app/api/numbers/route.ts", "utf8");

  it("is gone", () => {
    assert.ok(!/nothing in this app sends an\s*\n?\s*\*?\s*Authorization header/i.test(src),
      "numbers/route.ts still claims no Authorization header is ever sent");
    assert.ok(!/Ownership is\s*\n?\s*\*?\s*enforced by the explicit brand_id scoping/i.test(src),
      "numbers/route.ts still claims caller-supplied brand_id scoping is ownership enforcement");
  });
});
