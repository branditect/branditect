/** Run with: npm test — item 2 of branditect-ui/spec/queue.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * A file in supabase/ may not create a world-open policy on a brand-scoped
 * table.
 *
 * brand_images.sql sat here for weeks containing
 *
 *   CREATE POLICY "Allow all for authenticated users" ON brand_images
 *     FOR ALL USING (true) WITH CHECK (true);
 *
 * The live database no longer had it — 082c26f closed it and
 * scripts/cross-tenant.mjs proves it — but PERMISSIVE policies are OR'd, so
 * re-running the file would have re-opened the table to every signed-in user
 * in one statement, with the scoped policy sitting beside it looking correct.
 *
 * Comments are stripped before matching. Two earlier tests in this repo
 * flagged a fix for containing, in prose, the very pattern it removed.
 */
const DIR = "supabase";
const files = readdirSync(DIR).filter((f) => f.endsWith(".sql"));

/** Statement text only: no `--` lines, no /* *​/ blocks. */
function statements(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/--.*$/, ""))
    .join("\n");
}

/**
 * Policies that are genuinely meant to be world-open. Empty, and adding to it
 * is a deliberate act somebody can review in a diff.
 *
 * There is no shape test here on purpose. The first version of this guard
 * checked "tables with a brand_id column", which skipped product_specs by
 * construction — it has no brand_id and scopes through
 * product_id → catalog_products → brands — and would have skipped the next
 * table shaped that way too. A guard that only inspects the shape you already
 * thought of is the same failure as the storage assertion that only checked
 * storage.objects.
 */
const PUBLIC_BY_DESIGN: { file: string; policy: string }[] = [];

describe("no file in supabase/ creates a world-open policy", () => {
  it("finds files to check, so this cannot pass vacuously", () => {
    assert.ok(files.length >= 8, `only ${files.length} sql files found`);
  });

  for (const f of files) {
    it(`${f} has no USING (true)`, () => {
      const sql = statements(readFileSync(join(DIR, f), "utf8"));
      const offenders: string[] = [];
      for (const m of sql.matchAll(/CREATE POLICY\s+("?[\w\s]+"?)\s+ON\s+([\w.]+)([\s\S]*?);/g)) {
        const policy = m[1].trim().replace(/^"|"$/g, "");
        const table = m[2].replace(/^public\./, "");
        if (!/USING\s*\(\s*true\s*\)/i.test(m[3])) continue;
        if (PUBLIC_BY_DESIGN.some((x) => x.file === f && x.policy === policy)) continue;
        offenders.push(`${policy} on ${table}`);
      }
      assert.deepEqual(offenders, [],
        `${f} would open ${offenders.join(", ")} to every signed-in user. ` +
        `Permissive policies are OR'd, so one of these defeats every scoped ` +
        `policy beside it, and a policy-reading audit will not show it.`);
    });
  }

  it("no allowlist entry is stale", () => {
    for (const x of PUBLIC_BY_DESIGN) {
      assert.ok(files.includes(x.file), `${x.file} is allowlisted but does not exist`);
      const sql = statements(readFileSync(join(DIR, x.file), "utf8"));
      assert.ok(sql.includes(x.policy), `${x.policy} is allowlisted but is not in ${x.file}`);
    }
  });

  it("brand_images.sql creates the scoped policy it is supposed to", () => {
    const sql = statements(readFileSync(join(DIR, "brand_images.sql"), "utf8"));
    assert.match(sql, /CREATE POLICY brand_images_own_brand ON brand_images/);
    assert.match(sql, /brand_id IN \(SELECT brand_id FROM brands WHERE user_id = auth\.uid\(\)\)/);
  });

  it("and drops what is there by discovery, not by name", () => {
    const sql = statements(readFileSync(join(DIR, "brand_images.sql"), "utf8"));
    assert.match(sql, /FROM pg_policies/,
      "dropping only the name it creates is how nine open policies survived close-rls.sql");
  });

  /**
   * product_specs has no brand_id — it scopes through the product. The join has
   * to be on brands.brand_id, which is TEXT, and not brands.id, which is a
   * UUID. Confusing those two is what made templates render nowhere.
   */
  it("product_specs scopes through its product, on the TEXT key", () => {
    const sql = statements(readFileSync(join(DIR, "product_specs.sql"), "utf8"));
    assert.match(sql, /CREATE POLICY product_specs_own_brand ON product_specs/);
    assert.match(sql, /JOIN brands b ON b\.brand_id = p\.brand_id/);
    assert.ok(!/JOIN brands b ON b\.id\b/.test(sql),
      "joins brands.id, a UUID, against a TEXT column");
  });

  it("brand_guideline is scoped by its own brand_id", () => {
    const sql = statements(readFileSync(join(DIR, "brand_guideline.sql"), "utf8"));
    assert.match(sql, /CREATE POLICY brand_guideline_own_brand ON brand_guideline/);
  });
});

describe("the storage half of brand_images.sql is not runnable yet", () => {
  const raw = readFileSync(join(DIR, "brand_images.sql"), "utf8");

  it("the DO NOT RUN YET line is there", () => {
    assert.match(raw, /BELOW THIS LINE: DO NOT RUN YET/);
  });

  it("every storage statement is below it", () => {
    // storage.buckets, not only storage.objects. The statement that actually
    // breaks every image is `UPDATE storage.buckets SET public = false`, and an
    // earlier version of this test checked only for storage.objects — a
    // deliberately broken run moved the bucket line above and it passed.
    const line = raw.indexOf("BELOW THIS LINE: DO NOT RUN YET");
    const above = statements(raw.slice(0, line));
    const leaked = (above.match(/storage\.\w+/g) ?? []);
    assert.deepEqual(leaked, [],
      `${leaked.join(", ")} moved above the line — the bucket cannot go private ` +
      `until storage_path is backfilled and both assertions pass, or every image ` +
      `in the app dies at once`);
  });

  it("the line says why, not just that", () => {
    const line = raw.indexOf("BELOW THIS LINE: DO NOT RUN YET");
    const reason = raw.slice(line, line + 600);
    assert.match(reason, /storage_path/,
      "the warning does not say what has to happen first");
    assert.match(reason, /breaks every image|every image in the app/i);
  });
});
