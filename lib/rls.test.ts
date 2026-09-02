/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const sql = readFileSync(new URL("../supabase/close-rls.sql", import.meta.url), "utf8");

/** Every table measured as readable by a stranger on 2026-09-02. */
const EXPOSED = [
  "catalog_products", "brand_images", "brand_documents", "brand_financial_rules",
  "brand_tone", "brand_logos", "brand_fonts", "brand_templates", "brand_visual",
  "onboarding", "brand_book_colors", "brand_book_pages",
];

describe("the RLS migration covers every exposed table", () => {
  for (const t of EXPOSED) {
    it(`turns RLS on for ${t}`, () => {
      const inLoop = new RegExp(`'${t}'`).test(sql);
      const standalone = new RegExp(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`).test(sql);
      assert.ok(inLoop || standalone, `${t} is not covered`);
    });
  }

  it("gives every table a policy, not just RLS", () => {
    // RLS with no policy denies everyone, including the owner. That would be a
    // different outage rather than a fix.
    assert.ok(/CREATE POLICY %I ON %I/.test(sql), "the loop creates no policy");
    assert.ok(/CREATE POLICY brand_templates_own_brand/.test(sql), "brand_templates has no policy");
  });

  it("scopes each policy with both USING and WITH CHECK", () => {
    // USING alone filters reads and leaves writes open.
    const using = sql.match(/USING\s+\(/g) ?? [];
    const check = sql.match(/WITH CHECK \(/g) ?? [];
    assert.equal(using.length, check.length, "a policy has USING without WITH CHECK");
    assert.ok(using.length >= 2, "expected a policy for the loop and one for brand_templates");
  });

  /**
   * brand_templates.brand_id holds brands.id, the UUID primary key, not
   * brands.brand_id. All 8 rows do. The ordinary predicate matches none of
   * them, and every template would vanish from Visual identity.
   */
  it("gives brand_templates its own predicate against brands.id", () => {
    assert.ok(/brand_id::text IN \(SELECT id::text FROM brands WHERE user_id = auth\.uid\(\)\)/.test(sql),
      "brand_templates would be filtered against the wrong column");
    // and it must not be in the loop that uses the ordinary predicate
    const loop = sql.slice(sql.indexOf("FOREACH t IN ARRAY"), sql.indexOf("END LOOP"));
    assert.ok(!/'brand_templates'/.test(loop), "brand_templates is in the loop with the wrong predicate");
  });

  it("leaves the three already closed tables alone", () => {
    const statements = sql.replace(/^--.*$/gm, "");
    for (const t of ["brands", "brand_strategies", "brand_catalog"]) {
      assert.ok(!new RegExp(`'${t}'|ALTER TABLE ${t} `).test(statements), `${t} is touched`);
    }
  });

  it("carries no trailing verification query", () => {
    const statements = sql.replace(/^--.*$/gm, "").trim();
    assert.ok(!/ORDER BY/i.test(statements), "a trailing ORDER BY is what got mangled before");
  });

  it("does not silently repair the orphan rows", () => {
    // Both fixes are data changes to someone's library, so they are recorded
    // as comments to be decided rather than run.
    const statements = sql.replace(/^--.*$/gm, "");
    assert.ok(!/UPDATE brand_images/.test(statements), "the migration rewrites image rows");
    assert.ok(!/DELETE FROM brand_tone/.test(statements), "the migration deletes tone rows");
    assert.ok(/UPDATE brand_images SET brand_id/.test(sql), "the orphan fix is not written down");
  });
});

/**
 * A route handler carries no user session, so the anon client sees nothing
 * once RLS is on. Any route still using it would report "not found" for rows
 * that exist, which is the failure that looks like a product bug.
 */
describe("no route handler uses the anon client", () => {
  function routes(dir: string): string[] {
    return readdirSync(dir).flatMap((n) => {
      const f = join(dir, n);
      return statSync(f).isDirectory() ? routes(f) : (n === "route.ts" ? [f] : []);
    });
  }
  const all = routes(new URL("../app/api", import.meta.url).pathname);

  it("finds the route handlers", () => {
    assert.ok(all.length > 5, `only found ${all.length}`);
  });

  for (const f of all) {
    const name = f.slice(f.indexOf("app/api"));
    it(`${name} uses the service client`, () => {
      const src = readFileSync(f, "utf8");
      if (!/supabase/.test(src)) return;
      assert.ok(!/from "@\/lib\/supabase"/.test(src),
        `${name} imports the anon client and would read nothing under RLS`);
    });
  }
});
