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

/**
 * The cross-tenant read.
 *
 * A policy audit checks what is written down. This checks what happens over
 * the wire: sign in as user A with the anon key and a real JWT, the same path
 * the browser uses, and try to select user B's rows from every table.
 * scripts/cross-tenant.mjs does that; these guard the properties that make its
 * result mean something.
 */
describe("the cross-tenant check cannot pass vacuously", () => {
  const src = readFileSync("scripts/cross-tenant.mjs", "utf8");

  it("seeds B before looking, so an empty table is not mistaken for a closed one", () => {
    assert.ok(/Seed BOTH brands/.test(src) || /seedRow\(t, B\.brandId/.test(src) || src.includes("parents["),
      "B is never given a row to find");
    assert.ok(src.includes("__unseedable"), "a table that cannot be seeded is not tracked");
  });

  it("a table it could not seed is UNVERIFIED, never PASS", () => {
    assert.match(src, /verdict: "UNVERIFIED"/);
    const passBranch = src.slice(src.indexOf('verdict: "PASS"') - 400, src.indexOf('verdict: "PASS"'));
    assert.ok(passBranch.includes("seesOwn"),
      "a table passes without A being able to read its own row");
  });

  it("requires A to read its own row, or the pass proves nothing", () => {
    assert.ok(src.includes("A cannot read its own row either"),
      "there is no guard against A being able to read nothing anywhere");
  });

  it("signs in with the anon key, not the service key", () => {
    assert.ok(/createClient\(URL_, ANON/.test(src), "it queries as the service role");
    assert.ok(src.includes("signInWithPassword"), "there is no real session");
  });

  it("exits non-zero when anything leaks", () => {
    assert.match(src, /process\.exit\(leaks\.length \? 1 : 0\)/);
  });

  it("covers every table the app touches", () => {
    const listed = (src.match(/TABLES = \[([\s\S]*?)\]/)?.[1] ?? "")
      .split(",").map((x) => x.trim().replace(/['"]/g, "")).filter(Boolean);
    // The list is checked for duplicates and shape; the grep that produced it
    // is recorded in the script's header.
    assert.equal(new Set(listed).size, listed.length, "duplicate table in the list");
    assert.ok(listed.length >= 25, `only ${listed.length} tables listed`);
    for (const t of ["catalog_products", "brands", "brand_images", "notes"]) {
      assert.ok(listed.includes(t), `${t} is not covered`);
    }
  });
});

/** What the run found, recorded so a regression is visible as a diff. */
describe("the four tables close-rls-3 exists to close", () => {
  const sql = readFileSync("supabase/close-rls-3.sql", "utf8");

  for (const t of ["brand_book_assets", "mission_goals", "mission_notes", "mission_tasks"]) {
    it(`${t} gets RLS and a brand-scoped policy`, () => {
      assert.ok(new RegExp(`ALTER TABLE ${t}\\s+ENABLE ROW LEVEL SECURITY`).test(sql), t);
      assert.ok(new RegExp(`CREATE POLICY ${t}_own_brand`).test(sql), `${t} has no policy`);
    });
  }

  it("drops existing policies by discovery, not by name", () => {
    assert.match(sql, /FROM pg_policies/,
      "close-rls.sql dropped only the name it creates, and nine open policies survived it");
  });

  it("adds no USING (true)", () => {
    // Comments stripped first: the file explains that nine `USING (true)`
    // policies survived close-rls.sql, and matching that flagged the fix as
    // the defect it describes.
    const active = sql.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
    assert.deepEqual(active.match(/USING\s*\(\s*true\s*\)/gi) ?? [], []);
  });
});

/**
 * Two tables the cross-tenant run could not prove anything about, and what
 * turned out to be behind each.
 */
describe("social_strategy: the table Channels reads", () => {
  const sql = readFileSync("supabase/social-strategy.sql", "utf8");

  it("is created with every column the code already uses", () => {
    for (const col of ["channels", "primary_goal", "secondary_goal", "capacity_volume",
                       "production_setup", "reference_accounts", "anti_patterns", "status"]) {
      assert.ok(new RegExp(`\\b${col}\\b`).test(sql), `${col} is missing`);
    }
  });

  it("has RLS from the start rather than as a later sweep", () => {
    assert.match(sql, /ALTER TABLE social_strategy\s+ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /CREATE POLICY social_strategy_own_brand/);
    const active = sql.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
    assert.deepEqual(active.match(/USING\s*\(\s*true\s*\)/gi) ?? [], []);
  });

  it("the columns match what the route is allowed to write", () => {
    const route = readFileSync("app/api/social-strategy/route.ts", "utf8");
    const allowed = (route.match(/ALLOWED_FIELDS = new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? "")
      .split(",").map((x) => x.trim().replace(/['"]/g, "")).filter(Boolean);
    assert.ok(allowed.length >= 7, `only ${allowed.length} editable fields found`);
    for (const f of allowed) assert.ok(sql.includes(f), `${f} is editable but not a column`);
  });

  it("the page reports a failed read instead of showing an empty state", () => {
    const page = readFileSync("app/(app)/brand/channels/page.tsx", "utf8");
    assert.ok(/if \(recordRes\.error\)/.test(page), "the read error is discarded again");
    assert.ok(page.includes("data-channels-error"), "the failure is never rendered");
    assert.ok(page.includes('role="alert"'), "the failure is not announced");
  });
});

describe("brand_templates: the key type nothing could read through", () => {
  const sql = readFileSync("supabase/brand-templates-key.sql", "utf8");

  it("moves brand_id to TEXT, matching every other table", () => {
    assert.match(sql, /RENAME COLUMN brand_slug TO brand_id/);
    assert.match(sql, /ALTER COLUMN brand_id SET NOT NULL/);
  });

  it("maps the existing rows rather than dropping them", () => {
    assert.match(sql, /UPDATE brand_templates[\s\S]{0,200}FROM brands/);
    assert.match(sql, /RAISE EXCEPTION/,
      "an orphaned row would be silently dropped instead of stopping the migration");
  });

  it("closes RLS while it is in there", () => {
    assert.match(sql, /ALTER TABLE brand_templates\s+ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /CREATE POLICY brand_templates_own_brand/);
  });

  it("drops policies by discovery, not by name", () => {
    assert.match(sql, /FROM pg_policies/);
  });

  it("runs the swap in a transaction", () => {
    assert.match(sql, /^BEGIN;/m);
    assert.match(sql, /^COMMIT;/m);
  });
});
