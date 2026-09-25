/**
 * HQ reads across every brand, so it bypasses RLS and needs the discipline the
 * spec asks for (hq.md "Access"; hq-accounts.md criteria 10 and 11):
 *
 *   11. No query on the HQ screens selects a content column — MERGE BLOCKER.
 *       Checked two ways: the SQL HQ runs (hq_accounts / hq_account in
 *       supabase/hq-accounts.sql) names no content column, and the HQ code
 *       selects no table at all except writing its own audit rows.
 *   10. A non-operator gets 404, never 403 — every HQ route answers
 *       hqNotFound() before it does anything, and the page layout calls
 *       notFound().
 *
 * Source-text scanning with comments stripped, the same technique as
 * lib/api-spend.test.ts: the property is "this text never appears", and a
 * scan checks that on every file without a database.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const stripSql = (s: string) => s.replace(/--[^\n]*/g, "");
const stripTs = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(e)) out.push(p);
  }
  return out;
}

/**
 * Columns that hold a customer's private thinking. HQ must never read one.
 * Table-qualified where the column name alone is ambiguous.
 */
const CONTENT = [
  // Tables whose every row is content: HQ may not touch them at all.
  /\bbrand_strategies\b/,
  /\bbrand_tone\b/,
  /\bstudio_drafts\b/,
  /\bnote_blocks\b/,
  /\bproduct_pricing\b/,
  /\bcatalog_products\b/,
  /\bbrand_financial_rules\b/,
  // Content columns on tables HQ does read metadata from.
  /\bstrategy_text\b/,
  /\bextracted_text\b/,
  /\bd\.description\b/, /\bdescription\b(?=[^\n]*from brand_documents)/,
  /\banswers\b/,
  /\bvoice\b/,
  /\bguideline_url\b(?![^\n]*is not null)/,
  /\bsummary\b/,
  /\bcontent\b(?!_sha256)/,
  /\bprompt\b/,
];

describe("criterion 11 — HQ's SQL names no content column", () => {
  const sql = stripSql(readFileSync("supabase/hq-accounts.sql", "utf8"));
  const fns = Array.from(sql.matchAll(/create or replace function (hq_accounts|hq_account)\([\s\S]*?\$fn\$([\s\S]*?)\$fn\$/g));

  it("finds both read functions", () => {
    assert.deepEqual(fns.map((m) => m[1]).sort(), ["hq_account", "hq_accounts"]);
  });

  for (const [, name, body] of fns) {
    it(`${name}() selects no content`, () => {
      for (const rx of CONTENT) {
        const hit = body.match(rx);
        assert.equal(hit, null, `${name}() mentions ${hit?.[0]} — HQ is metadata only`);
      }
    });
    it(`${name}() never selects everything from a table`, () => {
      assert.doesNotMatch(body, /select\s+\*\s+from\s+(?!hq_audit)/i, `${name}() has a select * on a customer table`);
      assert.doesNotMatch(body, /to_jsonb\((b|br|d|o|p)\)/, `${name}() serialises a whole customer row`);
    });
  }

  it("the guideline is read as a boolean, never as the URL", () => {
    const acc = fns.find((m) => m[1] === "hq_accounts")![2];
    assert.match(acc, /nullif\(v\.guideline_url, ''\) is not null\) as has_guideline/);
    assert.doesNotMatch(acc, /as\s+guideline_url/);
  });

  it("the questionnaire is read by status, never by its answers", () => {
    const acc = fns.find((m) => m[1] === "hq_accounts")![2];
    assert.match(acc, /o\.status from onboarding o/);
  });
});

const HQ_CODE = [
  ...walk("app/(hq)"),
  ...walk("app/api/hq"),
  "lib/hq-view.ts",
  "lib/hq-access.ts",
  "lib/hq-audit.ts",
];

describe("criterion 11 — HQ's code selects no customer table", () => {
  it("covers the files it should", () => {
    assert.ok(HQ_CODE.some((f) => f.includes("app/(hq)/hq/page.tsx")));
    assert.ok(HQ_CODE.some((f) => f.includes("app/api/hq/accounts/route.ts")));
  });

  for (const file of HQ_CODE) {
    it(`${file} reads only through hq_* functions`, () => {
      const src = stripTs(readFileSync(file, "utf8"));
      const froms = Array.from(src.matchAll(/\.from\(\s*["'`]([^"'`]+)["'`]\s*\)/g), (m) => m[1]);
      const bad = froms.filter((t) => t !== "hq_audit");
      assert.deepEqual(bad, [], `${file} queries ${bad.join(", ")} directly`);
      assert.doesNotMatch(src, /\.select\(\s*["'`]\*["'`]/, `${file} has select("*")`);
      for (const rx of [/\bstrategy_text\b/, /\bextracted_text\b/, /\bbrand_strategies\b/, /\bbrand_tone\b/, /\bstudio_drafts\b/]) {
        assert.doesNotMatch(src, rx, `${file} mentions ${rx}`);
      }
      const rpcs = Array.from(src.matchAll(/\.rpc\(\s*["'`]([^"'`]+)["'`]/g), (m) => m[1]);
      for (const r of rpcs) {
        assert.ok(/^(hq_|budget_expire_stale$)/.test(r), `${file} calls rpc ${r}`);
      }
    });
  }
});

describe("criterion 10 — a non-operator gets 404, not 403", () => {
  const routes = walk("app/api/hq").filter((f) => f.endsWith("route.ts"));

  it("there are HQ routes to check", () => {
    assert.ok(routes.length >= 3, routes.join(", "));
  });

  for (const file of routes) {
    const src = stripTs(readFileSync(file, "utf8"));
    const handlers = Array.from(src.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\b[\s\S]*?(?=export async function|$)/g));

    it(`${file}: every handler checks the operator first and answers 404`, () => {
      assert.ok(handlers.length > 0);
      for (const [body, method] of handlers) {
        const check = body.indexOf("operatorFromRequest(");
        const firstAwait = body.search(/await\s/);
        assert.ok(check > 0 && check - firstAwait < 20, `${method}: operatorFromRequest is not the first thing awaited`);
        assert.match(body, /if \(!op\) return hqNotFound\(\)/, `${method}: a non-operator must get hqNotFound()`);
      }
    });

    it(`${file}: never answers 401 or 403`, () => {
      assert.doesNotMatch(src, /status:\s*40[13]\b/);
    });
  }

  it("the page layout calls notFound() without a valid cookie", () => {
    const src = stripTs(readFileSync("app/(hq)/hq/layout.tsx", "utf8"));
    assert.match(src, /if \(!operatorId\) notFound\(\)/);
    assert.match(src, /verifyHqCookie\(/);
  });

  it("the HQ nav lists only screens that exist", () => {
    const src = stripTs(readFileSync("app/(hq)/hq/layout.tsx", "utf8"));
    for (const unbuilt of ["Today", "Money", "Usage", "Activation", "Health"]) {
      assert.doesNotMatch(src, new RegExp(`>\\s*${unbuilt}\\b`), `${unbuilt} has no design yet and must not be in the nav`);
    }
  });

  it("the rail is the purple gradient", () => {
    assert.match(readFileSync("app/(hq)/hq/layout.tsx", "utf8"), /bg-grad-rail/);
    assert.match(readFileSync("tailwind.config.ts", "utf8"), /"grad-rail": "linear-gradient\(168deg, #6b53ac 0%, #4a3585 52%, #2f2159 100%\)"/);
  });

  it("the privacy note is on both screens", () => {
    for (const f of ["app/(hq)/hq/page.tsx", "app/(hq)/hq/accounts/[brandId]/page.tsx"]) {
      assert.match(readFileSync(f, "utf8"), /Metadata only\./, f);
    }
  });
});
