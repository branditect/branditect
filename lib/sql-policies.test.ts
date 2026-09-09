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
 * Tables keyed by brand, discovered from the CREATE TABLE statements in this
 * directory rather than from a list somebody maintains by hand.
 */
function brandScopedTables(): Set<string> {
  const found = new Set<string>();
  for (const f of files) {
    const sql = statements(readFileSync(join(DIR, f), "utf8"));
    for (const m of sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)\s*\(([\s\S]*?)\n\);/g)) {
      if (/\bbrand_id\b/.test(m[2])) found.add(m[1]);
    }
  }
  // Tables the app uses that no file in here creates. Named so the gap is
  // visible rather than silently uncovered.
  for (const t of ["brand_images", "brand_logos", "brand_documents", "catalog_products",
                   "brands", "brand_templates", "mission_goals", "mission_notes",
                   "mission_tasks", "brand_book_assets"]) found.add(t);
  return found;
}

describe("no file in supabase/ re-opens a brand-scoped table", () => {
  const scoped = brandScopedTables();

  it("finds tables to check, so this cannot pass vacuously", () => {
    assert.ok(scoped.size >= 10, `only ${scoped.size} brand-scoped tables found`);
    assert.ok(files.length >= 8, `only ${files.length} sql files found`);
  });

  for (const f of files) {
    it(`${f} has no USING (true) on a brand-scoped table`, () => {
      const sql = statements(readFileSync(join(DIR, f), "utf8"));
      const offenders: string[] = [];
      for (const m of sql.matchAll(/CREATE POLICY\s+("?[\w\s]+"?)\s+ON\s+([\w.]+)([\s\S]*?);/g)) {
        const table = m[2].replace(/^public\./, "");
        if (!scoped.has(table)) continue;
        if (/USING\s*\(\s*true\s*\)/i.test(m[3])) {
          offenders.push(`${m[1].trim()} on ${table}`);
        }
      }
      assert.deepEqual(offenders, [],
        `${f} would re-open ${offenders.join(", ")} to every signed-in user. ` +
        `Permissive policies are OR'd, so one of these defeats every scoped policy beside it.`);
    });
  }

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
});

/**
 * The storage half of security-hardening part 2 must stay below the line.
 *
 * brand_images.file_url stores a full public URL and a signed URL expires, so
 * it cannot be stored. Making the bucket private before storage_path is
 * backfilled and both assertions pass breaks every image in the app at once,
 * for everyone.
 */
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
