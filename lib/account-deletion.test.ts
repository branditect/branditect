/** Run with: npm test — queue item 4 of branditect-ui/spec/queue.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ANCHOR_TABLE,
  relationsWithBrandId, storagePrefixesFor, confirmationMatches,
  deletionComplete, deletionFailures, formatDeletionLog,
  type DeletionLog,
} from "./account-deletion.ts";

/** A schema document in PostgREST's shape, with whatever tables a test needs. */
function schema(tables: Record<string, string[]>): unknown {
  const definitions: Record<string, { properties: Record<string, unknown> }> = {};
  for (const [name, cols] of Object.entries(tables)) {
    definitions[name] = { properties: Object.fromEntries(cols.map((c) => [c, { format: "text" }])) };
  }
  return { definitions };
}

const log = (over: Partial<DeletionLog> = {}): DeletionLog => ({
  brandId: "zz-a", brandName: "ZZ A", userId: "u1",
  buckets: [{ bucket: "brand-images", found: 2, remaining: 0 }],
  tables: [{ table: "notes", before: 1, after: 0 }, { table: "brands", before: 1, after: 0 }],
  userDeleted: true,
  ...over,
});

describe("what gets deleted is read from the database, never from a list here", () => {
  it("finds every relation with a brand_id", () => {
    const names = relationsWithBrandId(schema({
      notes: ["id", "brand_id"], brands: ["id", "brand_id"], product_specs: ["id", "product_id"],
    }));
    assert.deepEqual(names, ["notes", "brands"]);
  });

  /**
   * CRITERION 1, at the level where the decision is made.
   *
   * The spec asks for this with a throwaway table in the database. Rule 1 of
   * the queue allows no DDL, so the throwaway table is created here instead —
   * a table this codebase has never heard of, appearing in the schema
   * document and therefore in the plan, with nothing in account-deletion.ts
   * edited. The live half is scripts/account-delete-probe.mjs, which seeds
   * and clears all 27 relations the real schema currently has.
   */
  it("picks up a table nobody has heard of, with no code change", () => {
    const names = relationsWithBrandId(schema({
      brands: ["id", "brand_id"], zz_invented_tomorrow: ["id", "brand_id", "secret"],
    }));
    assert.ok(names.includes("zz_invented_tomorrow"), "a new table would be missed");
  });

  it("puts brands last, because while it exists the rest is still findable", () => {
    const names = relationsWithBrandId(schema({
      brands: ["brand_id"], notes: ["brand_id"], andy: ["brand_id"],
    }));
    assert.equal(names[names.length - 1], ANCHOR_TABLE);
  });

  it("refuses a schema document it cannot read, rather than returning a short list", () => {
    // A truncated enumeration reads as a successful deletion that quietly
    // left data behind. That is the failure this whole item is about, so
    // every unreadable shape throws.
    for (const bad of [null, undefined, {}, { definitions: null }, "definitions"]) {
      assert.throws(() => relationsWithBrandId(bad), /definitions/);
    }
  });

  it("refuses a schema with no brands table, because it cannot be the live one", () => {
    assert.throws(() => relationsWithBrandId(schema({ notes: ["brand_id"] })), /brands/);
  });

  it("has no table name in the source at all", () => {
    // The whole point. A name here is a list, and a list goes stale.
    const src = readFileSync("lib/account-deletion.ts", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    for (const t of ["notes", "catalog_products", "brand_images", "mission_goals", "onboarding"]) {
      assert.ok(!new RegExp(`["'\`]${t}["'\`]`).test(src), `${t} is named in the code`);
    }
    // brands is allowed, and only as the anchor constant.
    assert.equal((src.match(/"brands"/g) ?? []).length, 1);
  });
});

describe("both storage prefixes, because brand-assets uses the UUID too", () => {
  it("returns the slug and the UUID", () => {
    assert.deepEqual(storagePrefixesFor({ brand_id: "zz-a", id: "uuid-1" }), ["zz-a", "uuid-1"]);
  });

  it("drops blanks and duplicates rather than deleting a prefix twice", () => {
    assert.deepEqual(storagePrefixesFor({ brand_id: "zz-a", id: "zz-a" }), ["zz-a"]);
    assert.deepEqual(storagePrefixesFor({ brand_id: "", id: null }), []);
    assert.deepEqual(storagePrefixesFor({}), []);
  });
});

describe("the confirmation is the brand name, typed", () => {
  it("accepts the exact name, and a pasted one with whitespace", () => {
    assert.ok(confirmationMatches("Vetra", "Vetra"));
    assert.ok(confirmationMatches("  Vetra  ", "Vetra"));
  });

  it("rejects a near miss", () => {
    // Case is not forgiven. An exact match is the whole point of asking.
    assert.ok(!confirmationMatches("vetra", "Vetra"));
    assert.ok(!confirmationMatches("Vetr", "Vetra"));
    assert.ok(!confirmationMatches("Vetra Oy", "Vetra"));
  });

  it("never matches on an empty or missing brand name", () => {
    // A brand row that lost its name would otherwise delete on an empty box.
    assert.ok(!confirmationMatches("", ""));
    assert.ok(!confirmationMatches("  ", "   "));
    assert.ok(!confirmationMatches("anything", null));
    assert.ok(!confirmationMatches(undefined, "Vetra"));
    assert.ok(!confirmationMatches({ toString: () => "Vetra" }, "Vetra"));
  });
});

describe("the verdict is the counts afterwards, not the absence of an error", () => {
  it("is complete when nothing is left anywhere", () => {
    assert.ok(deletionComplete(log()));
    assert.deepEqual(deletionFailures(log()), []);
  });

  it("is not complete when a row survived, however quietly", () => {
    const l = log({ tables: [{ table: "notes", before: 3, after: 3 }] });
    assert.ok(!deletionComplete(l));
    assert.match(deletionFailures(l)[0], /notes: 3 row/);
  });

  it("is not complete when a file survived", () => {
    const l = log({ buckets: [{ bucket: "brand-assets", found: 4, remaining: 1 }] });
    assert.ok(!deletionComplete(l));
    assert.match(deletionFailures(l)[0], /brand-assets: 1 object/);
  });

  it("treats an unverifiable bucket as a failure, never as an empty one", () => {
    // Found by control: a listing that errors returned the keys it had so
    // far, both before and after, so the check agreed with the deletion
    // because both were blind the same way.
    const l = log({ buckets: [{ bucket: "brand-images", found: 0, remaining: -1, error: "timeout" }] });
    assert.ok(!deletionComplete(l));
    assert.match(deletionFailures(l)[0], /could not be verified/);
  });

  it("treats no buckets at all as a failure", () => {
    // Also found by control: with the bucket loop skipped the route reported
    // success having looked at nothing.
    const l = log({ buckets: [] });
    assert.ok(!deletionComplete(l));
    assert.match(deletionFailures(l)[0], /no bucket was looked at/);
  });

  it("is not complete while the auth user is still there", () => {
    const l = log({ userDeleted: false, userError: "rate limited" });
    assert.ok(!deletionComplete(l));
    assert.match(deletionFailures(l).join(" "), /auth user: rate limited/);
  });

  it("counts a table that could not be counted as a failure", () => {
    const l = log({ tables: [{ table: "notes", before: -1, after: -1, error: "no such table" }] });
    assert.ok(!deletionComplete(l));
  });
});

describe("the log demonstrates erasure rather than asserting it", () => {
  it("names every relation and bucket touched, including the empty ones", () => {
    const out = formatDeletionLog(log({
      tables: [{ table: "notes", before: 0, after: 0 }, { table: "brands", before: 1, after: 0 }],
    }));
    // A table absent from the log cannot be told from one never looked at.
    assert.match(out, /rows notes: 0 removed, 0 left/);
    assert.match(out, /rows brands: 1 removed, 0 left/);
    assert.match(out, /storage brand-images: 2 removed, 0 left/);
    assert.match(out, /auth user: deleted/);
    assert.match(out, /complete/);
  });

  it("says what is still there when it is not complete", () => {
    const out = formatDeletionLog(log({ tables: [{ table: "notes", before: 3, after: 3 }] }));
    assert.match(out, /INCOMPLETE: notes: 3 row/);
  });
});

describe("the route, as written", () => {
  const src = readFileSync("app/api/account/delete/route.ts", "utf8");
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  it("identifies the caller and never takes a brand id from the body", () => {
    assert.match(code, /resolveBrand\(req\)/);
    assert.ok(!/body\??\.\s*brand_?[iI]d/.test(code), "the route trusts a brand id from the request");
  });

  it("scopes every delete to the brand", () => {
    // The property that makes this safe, and the only one. Whatever relation
    // a name resolves to, a delete filtered on brand_id can only remove rows
    // belonging to the brand being deleted.
    const deletes = code.match(/\.delete\(\)[^\n]*/g) ?? [];
    assert.ok(deletes.length > 0, "no delete in the route at all");
    for (const d of deletes) assert.match(d, new RegExp(`\\.eq\\(BRAND_KEY`), `unscoped delete: ${d}`);
  });

  it("deletes the auth user last, and only when nothing is left", () => {
    const storage = code.indexOf("listBuckets");
    const rows = code.indexOf(".delete()");
    const user = code.indexOf("deleteUser");
    assert.ok(storage < rows && rows < user, "storage, then rows, then the user");
    assert.match(code, /residue\.length === 0[\s\S]{0,200}deleteUser/);
  });

  it("refuses rather than guessing when it cannot read the schema", () => {
    // A fallback list here would delete most of an account and report all.
    assert.match(code, /catch[\s\S]{0,400}Nothing was deleted/);
    assert.ok(!/const TABLES = \[/.test(code));
  });

  it("checks the typed confirmation before touching anything", () => {
    const confirm = code.indexOf("confirmationMatches");
    assert.ok(confirm > 0 && confirm < code.indexOf("listBuckets"));
  });
});

describe("criterion 7 · the policy stops promising what is no longer true", () => {
  const SPEC = "branditect-ui/spec/privacy-and-terms.md";

  it("no longer says a self-service button is coming", () => {
    // It is here. The page that renders this policy does not exist yet —
    // queue item 11 — so the spec is the only place the promise lives, and
    // it is the place item 11 will copy from.
    const policy = readFileSync(SPEC, "utf8").split("\n").filter((l) => l.startsWith(">")).join("\n");
    assert.ok(!/A self-service button is coming/.test(policy));
    assert.ok(!/confirm within 30/.test(policy));
    assert.match(policy, /Settings, at the foot of the page/);
  });

  it("no longer promises a backup sweep there is no backup for", () => {
    // Supabase Free has no scheduled backups and no point-in-time recovery,
    // so "removed from encrypted backups within a further 60 days" described
    // a system that does not exist.
    // The policy block only — the lines quoted as "> ". The note above it
    // quotes the old wording to say why it went, and a guard that cannot
    // tell a quotation from a promise gets loosened until it stops working.
    const policy = readFileSync(SPEC, "utf8").split("\n").filter((l) => l.startsWith(">")).join("\n");
    assert.ok(policy.length > 500, "the policy block was not found");
    assert.ok(!/encrypted backups within a further 60 days/.test(policy));
  });

  it("and the page, if it ever gets built, must not carry the old promise", () => {
    // Guards the real risk: item 11 builds /privacy by pasting the block
    // above. If that page appears with the old text, this fails.
    for (const f of ["app/(site)/privacy/page.tsx", "app/privacy/page.tsx"]) {
      let src;
      try { src = readFileSync(f, "utf8"); } catch { continue; }
      assert.ok(!/A self-service button is coming/.test(src), `${f} promises a button that exists`);
    }
  });
});

describe("the page it lives on can be reached by clicking", () => {
  it("Settings is a link in the account menu, with no Soon tag", () => {
    // A delete button on a page reachable only by typing the URL is not
    // shipped. spec/settings.md names this; the rest of that spec is its own
    // piece of work.
    const src = readFileSync("components/account-menu.tsx", "utf8");
    assert.match(src, /key: "accountMenu\.settings" as const,\s*\n\s*href: "\/settings"/);
    assert.ok(!/key: "accountMenu\.settings" as const,\s*\n\s*soon: true/.test(src),
      "Settings is tagged Soon over a page that exists");
  });

  it("and the Settings page still reaches the delete panel", () => {
    // Through the Account section since phase 1 restructured the page, so
    // the chain is followed rather than a single file grepped.
    const page = readFileSync("app/(app)/settings/page.tsx", "utf8");
    assert.match(page, /<AccountPanel \/>/);
    assert.match(readFileSync("components/settings/account-panel.tsx", "utf8"), /<DeleteAccount \/>/);
  });
});
