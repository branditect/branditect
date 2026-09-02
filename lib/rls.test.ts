/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { auditResult } from "./rls-audit.ts";
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

/**
 * The first migration failed because it dropped only the policy name it
 * creates. Postgres ORs PERMISSIVE policies, so nine pre-existing
 * `USING (true)` policies kept every table world-readable while RLS was on and
 * scoped policies sat beside them. Naming the offenders is the thing that went
 * wrong; the follow-up finds them instead.
 */
describe("the follow-up drops world-open policies by discovery", () => {
  const sql2 = readFileSync(new URL("../supabase/close-rls-2.sql", import.meta.url), "utf8");

  it("sweeps pg_policies rather than naming policies", () => {
    assert.ok(/FROM pg_policies\s/.test(sql2), "it does not read pg_policies");
    assert.ok(/permissive = 'PERMISSIVE'/.test(sql2), "it does not filter to permissive policies");
    assert.ok(/\(qual = 'true' OR with_check = 'true'\)/.test(sql2),
      "it does not catch both a world-open read and a world-open write");
    assert.ok(/EXECUTE format\('DROP POLICY %I ON %I\.%I'/.test(sql2), "it does not drop what it finds");
  });

  it("recreates a scoped policy for every table it sweeps", () => {
    // RLS on with no policy denies everyone including the owner, which is a
    // different outage rather than a fix.
    assert.ok(/CREATE POLICY %I ON %I/.test(sql2), "no scoped policy is recreated");
    for (const t of ["catalog_products", "brand_images", "brand_guideline", "brand_visual_dna"]) {
      assert.ok(new RegExp(`'${t}'`).test(sql2), `${t} gets no policy back`);
    }
  });

  it("covers the three tables the first migration missed", () => {
    for (const t of ["brand_guideline", "brand_visual_dna", "product_specs"]) {
      assert.ok(sql2.includes(t), `${t} is not covered`);
    }
  });

  /* product_specs has no brand_id. Its offending policy came from
     supabase/product_specs.sql, which this repo wrote. */
  it("scopes product_specs through its product, since it has no brand_id", () => {
    assert.ok(/product_id IN \(\s*SELECT id FROM catalog_products/.test(sql2),
      "product_specs is not scoped through catalog_products");
  });

  it("exposes the audit to the service role only", () => {
    assert.ok(/CREATE OR REPLACE FUNCTION public\.rls_open_policies/.test(sql2), "no audit function");
    assert.ok(/REVOKE ALL ON FUNCTION public\.rls_open_policies\(\) FROM anon, authenticated/.test(sql2),
      "the audit function is callable by ordinary users");
    assert.ok(/GRANT EXECUTE ON FUNCTION public\.rls_open_policies\(\) TO service_role/.test(sql2),
      "the audit function is not callable by the server");
  });
});

/**
 * The check that has to keep working. npm test is offline, so the database
 * half is scripts/rls-audit.mjs; this asserts it exists, is wired up, and
 * fails rather than passing when it cannot reach the audit.
 */
describe("the standing RLS audit", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

  it("is wired to an npm script", () => {
    assert.ok(/scripts\/rls-audit\.mjs/.test(pkg.scripts["rls:audit"]), pkg.scripts["rls:audit"]);
  });

  it("passes only when the database answered and there are no offenders", () => {
    assert.equal(auditResult({ reachable: true, policies: [] }).exitCode, 0);
  });

  it("fails when a world-open policy exists, and names it", () => {
    const r = auditResult({ reachable: true, policies: [
      { table_name: "brand_images", policy_name: "Allow all for now", cmd: "ALL", qual: "true", with_check: "true" },
    ]});
    assert.equal(r.exitCode, 1);
    assert.ok(r.message.includes("brand_images.Allow all for now"), r.message);
    assert.ok(r.message.includes("qual=true"), r.message);
    assert.ok(r.message.includes("with_check=true"), r.message);
  });

  /* A check that goes green because it could not run is worse than none. */
  it("fails when the audit function is missing", () => {
    const r = auditResult({ reachable: false, errorBody: "404 Could not find the function public.rls_open_policies" });
    assert.equal(r.exitCode, 1);
    assert.ok(/close-rls-2\.sql/.test(r.message), r.message);
  });

  it("fails when the request itself failed", () => {
    assert.equal(auditResult({ reachable: false, errorBody: "500 boom" }).exitCode, 1);
    assert.equal(auditResult({ reachable: false, errorBody: "TypeError: fetch failed" }).exitCode, 1);
  });

  it("fails on a response that is not a list, rather than assuming it is empty", () => {
    assert.equal(auditResult({ reachable: true, policies: { message: "nope" } }).exitCode, 1);
    assert.equal(auditResult({ reachable: true, policies: undefined }).exitCode, 1);
    assert.equal(auditResult({ reachable: true, policies: null }).exitCode, 1);
  });

  it("uses the service key, the only role granted the function", () => {
    const script = readFileSync(new URL("../scripts/rls-audit.mjs", import.meta.url), "utf8");
    assert.ok(/SUPABASE_SERVICE_ROLE_KEY/.test(script));
    assert.ok(/rpc\/rls_open_policies/.test(script), "it does not call the audit function");
    assert.ok(/process\.exit\(result\.exitCode\)/.test(script), "it does not exit on the decision");
  });
});
