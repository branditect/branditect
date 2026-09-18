/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * The brand a route resolved must actually reach the query.
 *
 * lib/api-ownership.test.ts proves every service-role route CALLS
 * resolveBrand. That is a different claim from using the answer, and the
 * difference is where three cross-tenant holes lived on 2026-09-18:
 *
 *   - social-strategy 'answer' and 'reset' updated and deleted by `id` alone,
 *     with `id` taken from the body. The guard ran; its result was ignored.
 *     Any signed-in user could edit or delete any brand's social strategy.
 *   - templates DELETE removed a storage object at a path taken from the body,
 *     before the ownership-scoped row delete underneath it.
 *   - brand-guideline/index downloaded `bucket` + `storagePath` from the body
 *     with the service key, which reads any file in the project.
 *
 * Each is one missing clause, all three survived review, and none is visible
 * to a test that counts guards. These read the source for the specific shape.
 */

const read = (p: string) => readFileSync(p, "utf8");

describe("a resolved brand is applied, not just resolved", () => {
  it("social-strategy scopes every write by brand_id, not by id alone", () => {
    const src = read("app/api/social-strategy/route.ts");
    // Every update/delete on the table must carry a brand filter.
    const writes = src.split(/\n/).reduce<string[]>((acc, line, i, lines) => {
      // A generous window: the 'generate' action's update spans nine lines of
      // patch object before its .eq() clauses, and a window that clips it
      // would report a correctly scoped write as unscoped.
      if (/\.(update|delete)\(/.test(line)) acc.push(lines.slice(i, i + 14).join("\n"));
      return acc;
    }, []);
    assert.ok(writes.length > 0, "no writes found — did the file move?");
    for (const w of writes) {
      assert.match(
        w,
        /\.eq\(['"]brand_id['"],\s*(auth\.)?brandId\)/,
        `an unscoped write in social-strategy:\n${w}\n` +
          `The client is service-role, so RLS will not catch a missing brand filter.`,
      );
    }
  });

  it("templates DELETE takes the file path from the row, never from the body", () => {
    const src = read("app/api/templates/route.ts");
    const remove = src.slice(src.indexOf("export async function DELETE"));
    assert.ok(
      !/remove\(\[\s*thumbnail_path\s*\]\)/.test(remove),
      "templates DELETE still removes a caller-supplied path from storage",
    );
    assert.match(
      remove,
      /remove\(\[\s*row\.thumbnail_path\s*\]\)/,
      "the deleted file should be the one named by the row that was just deleted",
    );
  });

  it("brand-guideline/index proves the path belongs to the caller before downloading", () => {
    const src = read("app/api/brand-guideline/index/route.ts");
    const download = src.slice(0, src.indexOf(".download(storagePath)"));
    assert.match(
      download,
      /from\("brand_documents"\)[\s\S]{0,200}\.eq\("brand_id",\s*auth\.brandId\)[\s\S]{0,200}\.eq\("storage_path",\s*storagePath\)/,
      "the storagePath is downloaded without checking it belongs to the caller's brand",
    );
    assert.ok(
      !/\.from\(bucket\s*\|\|/.test(src),
      "the bucket is still caller-supplied, which reaches every file in the project",
    );
  });

  it("generate-from-reference authenticates before it decides what was asked for", () => {
    const src = read("app/api/brand/generate-from-reference/route.ts");
    const guard = src.indexOf("await resolveBrand(req");
    const conditional = src.indexOf("if (productId) {");
    assert.ok(guard !== -1, "no resolveBrand call at all");
    assert.ok(
      guard < conditional,
      "resolveBrand runs inside `if (productId)`, so a request without a product is unauthenticated",
    );
  });
});

/**
 * The storage lockdown has to stay in the repo, because the database is not
 * something a test can read. If this file disappears, the policies it creates
 * are the only record of why they are shaped that way.
 */
describe("the storage lockdown migration is present", () => {
  const sql = read("supabase/storage-lockdown.sql");

  it("closes every verb on the private bucket", () => {
    for (const verb of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
      assert.match(
        sql,
        new RegExp(`FOR ${verb} TO authenticated`),
        `no ${verb} policy scoped to authenticated`,
      );
    }
  });

  it("grants nothing to anon", () => {
    assert.ok(!/TO\s+anon/.test(sql), "the lockdown grants something to anon");
    assert.ok(!/TO\s+public/.test(sql), "the lockdown grants something to public");
  });

  it("says out loud what it does not close", () => {
    assert.match(sql, /STILL OPEN AFTER THIS FILE/,
      "a partial fix that does not name its remaining hole reads as a complete one");
  });
});
