/** Run with: npm test — queue item 3 / security-hardening part 2 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  parseStorageUrl, storagePathFromUrl, isSignedUrl, brandPrefixOf, COLUMNS,
  PUBLIC_MARK, SIGNED_MARK,
} from "./storage-paths.ts";
import { pathFor, signedUrl, signedUrls, SIGNED_URL_TTL_SECONDS, type StorageSigner } from "./signed-url.ts";

const BASE = "https://abc.supabase.co" + PUBLIC_MARK;

// ─────────────────────────────────────────────────────────────── the parse ──

describe("one parse, for every bucket", () => {
  it("splits a public URL into bucket and path", () => {
    assert.deepEqual(parseStorageUrl(`${BASE}brand-images/vetra-6zc3/web/a.png`),
      { bucket: "brand-images", path: "vetra-6zc3/web/a.png" });
    assert.deepEqual(parseStorageUrl(`${BASE}brand-assets/deklan/templates/x.png`),
      { bucket: "brand-assets", path: "deklan/templates/x.png" });
  });

  it("drops a cache-buster rather than making it part of the object key", () => {
    // The templates screen appends ?t=<timestamp> for display. It stores the
    // clean URL today, but one that ever reached the column would resolve to
    // nothing at all with the query string still attached.
    assert.equal(parseStorageUrl(`${BASE}brand-assets/b/t.png?t=1775564545052`)!.path, "b/t.png");
    assert.equal(parseStorageUrl(`${BASE}brand-assets/b/t.png#frag`)!.path, "b/t.png");
  });

  it("decodes, because a filename with a space is normal", () => {
    assert.equal(parseStorageUrl(`${BASE}brand-assets/s/small%20Guidelines%20(Final).pdf`)!.path,
      "s/small Guidelines (Final).pdf");
  });

  it("survives a stray percent instead of losing the row", () => {
    assert.equal(parseStorageUrl(`${BASE}brand-assets/s/100%.png`)!.path, "s/100%.png");
  });

  it("returns null for anything that is not one of ours", () => {
    for (const v of ["", null, undefined, 7, "https://example.com/a.png", `${BASE}`, `${BASE}bucket-only`]) {
      assert.equal(parseStorageUrl(v), null, `${String(v)} should not parse`);
    }
  });

  it("only hands back a path for the bucket the caller asked about", () => {
    const url = `${BASE}brand-assets/b/x.png`;
    assert.equal(storagePathFromUrl(url, "brand-assets"), "b/x.png");
    assert.equal(storagePathFromUrl(url, "brand-images"), null,
      "a path from the wrong bucket would delete or sign the wrong object");
  });

  it("knows a signed URL when it sees one", () => {
    assert.ok(isSignedUrl(`https://abc.supabase.co${SIGNED_MARK}brand-images/b/x.png?token=ey`));
    assert.ok(!isSignedUrl(`${BASE}brand-images/b/x.png`));
  });

  it("reads the brand off the front of a path", () => {
    assert.equal(brandPrefixOf("vetra-6zc3/web/a.png"), "vetra-6zc3");
    assert.equal(brandPrefixOf("logos/primary.png"), "logos");
  });
});

// ────────────────────────────────────────── correct before AND after the flip ──

/** A client that records what it was asked to sign. */
function fakeSigner(opts: { fail?: boolean } = {}) {
  const calls: { paths: string[]; expiresIn: number }[] = [];
  const client: StorageSigner = {
    storage: {
      from() {
        return {
          async createSignedUrl(path: string, expiresIn: number) {
            calls.push({ paths: [path], expiresIn });
            return opts.fail
              ? { data: null, error: { message: "Object not found" } }
              : { data: { signedUrl: `SIGNED:${path}` }, error: null };
          },
          async createSignedUrls(paths: string[], expiresIn: number) {
            calls.push({ paths, expiresIn });
            return opts.fail
              ? { data: null, error: { message: "Object not found" } }
              : { data: paths.map((p) => ({ path: p, signedUrl: `SIGNED:${p}`, error: null })), error: null };
          },
        };
      },
    },
  };
  return { client, calls };
}

describe("the helper is correct at every point in the migration", () => {
  const url = `${BASE}brand-images/vetra-6zc3/web/a.png`;

  it("before the backfill: no path column, so the path comes out of the URL", () => {
    assert.equal(pathFor({ fileUrl: url }, "brand-images"), "vetra-6zc3/web/a.png");
    assert.equal(pathFor({ storagePath: null, fileUrl: url }, "brand-images"), "vetra-6zc3/web/a.png");
  });

  it("after the backfill: the column wins", () => {
    assert.equal(pathFor({ storagePath: "b/other.png", fileUrl: url }, "brand-images"), "b/other.png");
  });

  it("an external URL is left alone rather than treated as broken", async () => {
    const { client, calls } = fakeSigner();
    const out = await signedUrl(client, "brand-images", { fileUrl: "https://cdn.example.com/x.png" });
    assert.equal(out, "https://cdn.example.com/x.png");
    assert.equal(calls.length, 0, "an external image must not be sent to the signer");
  });

  it("falls back to the stored URL when signing fails", async () => {
    // A bucket that is still public signs fine; one that is private and
    // missing the object is a broken image either way. The stored URL is never
    // a worse answer than null.
    const { client } = fakeSigner({ fail: true });
    assert.equal(await signedUrl(client, "brand-images", { storagePath: "b/x.png", fileUrl: url }), url);
  });

  it("signs for an hour", async () => {
    const { client, calls } = fakeSigner();
    await signedUrl(client, "brand-images", { storagePath: "b/x.png" });
    assert.equal(calls[0].expiresIn, SIGNED_URL_TTL_SECONDS);
    assert.equal(SIGNED_URL_TTL_SECONDS, 3600);
  });
});

describe("a grid signs once", () => {
  /** CRITERION 5. Forty images, one call. */
  it("issues one signing call for forty images, not forty", async () => {
    const { client, calls } = fakeSigner();
    const items = Array.from({ length: 40 }, (_, i) => ({
      storagePath: `vetra-6zc3/web/${i}.png`, fileUrl: `${BASE}brand-images/vetra-6zc3/web/${i}.png`,
    }));
    const out = await signedUrls(client, "brand-images", items);
    assert.equal(calls.length, 1, `signed in ${calls.length} calls — a grid must not be forty round trips`);
    assert.equal(calls[0].paths.length, 40);
    assert.equal(out[0], "SIGNED:vetra-6zc3/web/0.png");
    assert.equal(out[39], "SIGNED:vetra-6zc3/web/39.png");
  });

  it("keeps the array the same length and order when some rows cannot be signed", async () => {
    // A caller zipping a shorter array back onto its rows would shift every
    // image by one, which looks like the grid working and shows the wrong
    // picture for every product.
    const { client, calls } = fakeSigner();
    const items = [
      { storagePath: "b/a.png", fileUrl: `${BASE}brand-images/b/a.png` },
      { fileUrl: "https://cdn.example.com/outside.png" },
      { storagePath: "b/c.png", fileUrl: `${BASE}brand-images/b/c.png` },
    ];
    const out = await signedUrls(client, "brand-images", items);
    assert.equal(out.length, 3);
    assert.deepEqual(out, ["SIGNED:b/a.png", "https://cdn.example.com/outside.png", "SIGNED:b/c.png"]);
    assert.deepEqual(calls[0].paths, ["b/a.png", "b/c.png"]);
  });

  it("never calls the signer when there is nothing to sign", async () => {
    const { client, calls } = fakeSigner();
    assert.deepEqual(await signedUrls(client, "brand-images", [{ fileUrl: null }]), [null]);
    assert.equal(calls.length, 0);
  });

  it("falls back for the whole grid when the batch call fails", async () => {
    const { client } = fakeSigner({ fail: true });
    const items = [{ storagePath: "b/a.png", fileUrl: `${BASE}brand-images/b/a.png` }];
    assert.deepEqual(await signedUrls(client, "brand-images", items), [`${BASE}brand-images/b/a.png`]);
  });
});

// ───────────────────────────────────── criterion 4: no signed URL is stored ──

describe("a signed URL is never written to a table", () => {
  const dirs = ["app", "components", "lib"];
  function files(dir: string): string[] {
    const out: string[] = [];
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) out.push(...files(p));
      else if (p.endsWith(".ts") || p.endsWith(".tsx")) out.push(p);
    }
    return out;
  }

  it("no insert or update takes its value from a signing call", () => {
    // The failure this prevents: a link with an expiry date sitting in a
    // column, working for an hour and dead after it, in a row nobody looks at
    // again for a month.
    const offenders: string[] = [];
    for (const f of dirs.flatMap(files)) {
      if (f.endsWith(".test.ts")) continue;
      const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      if (!/createSignedUrls?\(/.test(src)) continue;
      if (/(insert|update|upsert)\s*\(\s*\{[^}]*sign/i.test(src)) offenders.push(f);
    }
    assert.deepEqual(offenders, []);
  });

  it("the audit checks the live database for the same thing", () => {
    const audit = readFileSync("scripts/storage-audit.mjs", "utf8");
    assert.match(audit, /isSignedUrl/, "the audit does not look for stored signed URLs");
  });
});

// ──────────────────────────────────────────── the registry, and the SQL ──

describe("the column registry matches the migration", () => {
  const sql = readFileSync("supabase/private-buckets.sql", "utf8");

  it("names a path column for every URL column that can have one", () => {
    for (const c of COLUMNS) {
      if (c.pathColumn === null) {
        assert.ok(c.note, `${c.table}.${c.column} has no path column and no reason given`);
        continue;
      }
      const inThisFile = new RegExp(`${c.table}[\\s\\S]{0,120}${c.pathColumn}`).test(sql);
      const inImages = c.bucket === "brand-images" && c.table === "brand_images";
      assert.ok(inThisFile || inImages,
        `${c.table}.${c.pathColumn} is in the registry but no migration adds or fills it`);
    }
  });

  it("records the one column a path cannot help", () => {
    const prose = COLUMNS.find((c) => c.table === "mission_notes");
    assert.ok(prose && prose.pathColumn === null);
    assert.match(prose!.note!, /free text|prose/i);
  });

  it("backfills trim a query string", () => {
    // split_part alone would carry ?t=<timestamp> into the object key.
    const backfills = sql.match(/split_part\([^;]*/g) ?? [];
    assert.ok(backfills.length >= 6, `only ${backfills.length} backfills found`);
    for (const b of backfills) {
      assert.match(b, /'\?'/, `a backfill does not trim the query string: ${b.slice(0, 80)}`);
    }
  });

  it("accepts the brand UUID as well as the slug, and says why", () => {
    assert.match(sql, /SELECT id::text\s+FROM brands WHERE user_id = auth\.uid\(\)/);
    assert.match(sql, /templates render nowhere|UUID/i);
  });
});

/**
 * The storage guard, widened twice.
 *
 * Inbox entry 1's lesson, applied again: a guard that only inspects the shape
 * you already thought of misses the next file with the same shape. The
 * USING (true) check could not see
 *
 *   CREATE POLICY "Allow brand-assets reads" ON storage.objects
 *     FOR SELECT USING (bucket_id = 'brand-assets');
 *
 * because the text is not literally "true" — and that policy let any signed-in
 * person read, update and delete every object in the bucket, across every
 * tenant. Two files carried it. So the rule here is not about a word: a
 * storage.objects policy must name the caller.
 */
describe("no migration can open a bucket", () => {
  const DIR = "supabase";
  const strip = (s: string) => s.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const sqlFiles = readdirSync(DIR).filter((f) => f.endsWith(".sql"));

  it("finds the migrations at all, so this cannot pass vacuously", () => {
    assert.ok(sqlFiles.length > 10, `only ${sqlFiles.length} .sql files found`);
  });

  /**
   * A: every storage.objects policy scopes to the caller.
   *
   * Split into statements FIRST. Matching CREATE POLICY ... ON storage.objects
   * across the whole file spans from a table policy near the top to a DROP near
   * the bottom, and reported two files as unscoped that are not.
   */
  const storagePolicies = (f: string) =>
    strip(readFileSync(join(DIR, f), "utf8"))
      .split(/;\s*/)
      .filter((st) => /\bCREATE POLICY\b/.test(st) && /\bON\s+storage\.objects\b/.test(st));

  for (const f of sqlFiles) {
    if (storagePolicies(f).length === 0) continue;

    it(`${f}: every storage.objects policy names the caller`, () => {
      const policies = storagePolicies(f);
      assert.ok(policies.length > 0);
      for (const p of policies) {
        assert.match(p, /auth\.uid\(\)/,
          `an unscoped storage policy in ${f}: ${p.replace(/\s+/g, " ").slice(0, 120)}. ` +
          `bucket_id alone is every user in the bucket, and RLS policies are OR'd, ` +
          `so one of these beside a scoped one defeats it.`);
      }
    });
  }

  /** B: no file makes a bucket public. */
  for (const f of sqlFiles) {
    const body = strip(readFileSync(join(DIR, f), "utf8"));
    if (!/storage\.buckets/.test(body)) continue;

    it(`${f}: does not create or flip a bucket to public`, () => {
      assert.ok(!/SET\s+public\s*=\s*true/i.test(body), `${f} flips a bucket back to public`);
      const inserts = body.split(/;\s*/).filter((s) => /INSERT INTO storage\.buckets/.test(s));
      for (const ins of inserts) {
        assert.ok(!/\btrue\b/.test(ins),
          `${f} creates a public bucket: ${ins.replace(/\s+/g, " ").slice(0, 120)}`);
      }
    });
  }

  /** C: the files that flip a bucket private carry the warning, with its reason. */
  const flippers = sqlFiles.filter((f) =>
    /SET\s+public\s*=\s*false/i.test(strip(readFileSync(join(DIR, f), "utf8"))));

  it("the files that make a bucket private are the two expected ones", () => {
    assert.deepEqual(flippers.sort(), ["brand_images.sql", "private-buckets.sql"]);
  });

  for (const f of flippers) {
    it(`${f} is marked not-runnable, with every storage statement below the line`, () => {
      const raw = readFileSync(join(DIR, f), "utf8");
      const at = raw.indexOf("BELOW THIS LINE: DO NOT RUN YET");
      assert.notEqual(at, -1, `${f} makes a bucket private and has no DO NOT RUN line`);
      const leaked = strip(raw.slice(0, at)).match(/storage\.\w+/g) ?? [];
      assert.deepEqual(leaked, [],
        `${leaked.join(", ")} is above the line in ${f} — the bucket cannot go private ` +
        `until every stored path resolves, or every image in the app dies at once`);
    });

    it(`${f} says why, not just that`, () => {
      const raw = readFileSync(join(DIR, f), "utf8");
      const at = raw.indexOf("BELOW THIS LINE: DO NOT RUN YET");
      const reason = raw.slice(at, at + 900);
      assert.match(reason, /storage_path|every stored path/i);
      assert.match(reason, /breaks every image|every image in the app/i);
    });
  }
});
