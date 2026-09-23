/**
 * A confirmed account can save things.
 *
 * THE BUG THIS GUARDS. A brand row was only ever written by the sign-up and
 * sign-in screens. Confirming the address from the email lands the person back
 * on the site with a session already established, so neither screen runs: the
 * account is real, they are signed in, and `useBrand` resolves to the string
 * "default". No account owns "default", so every storage write is refused by
 * row-level security and nothing they do sticks — reported as "the account
 * exists, it just will not save anything".
 *
 * This walks that exact door: a confirmed user with no brand row, the repair
 * lib/useBrand.ts now performs, and then a real upload. Steps 3 and 4 mirror
 * lib/brand-bootstrap.ts — if that file changes shape, change them together.
 *
 * Runs against the live project with the anon key, as a browser would, so RLS
 * is what answers. Everything it creates is deleted in the finally block.
 *
 * Käyttö: node scripts/brand-repair-check.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const svc = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let fails = 0;
const ok = (m, d = "") => console.log(`PASS  ${m}${d ? " — " + d : ""}`);
const bad = (m, d = "") => { fails++; console.log(`FAIL  ${m}${d ? " — " + d : ""}`); };

const stamp = Date.now().toString(36);
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/** lib/brand-bootstrap.ts, brandIdFromEmail. */
const brandIdFromEmail = (email) => {
  const local = (email ?? "").split("@")[0] ?? "";
  const slug = local.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${slug || "brand"}-${Math.random().toString(36).slice(2, 6)}`;
};

let userId = null;
let brandId = null;
let uploaded = null;

try {
  const email = `zz-repair-${stamp}@branditect-test.invalid`;
  const password = "TestPassword!2026";

  // email_confirm: true is the state the confirmation link leaves behind.
  const { data: created, error: ce } = await svc.auth.admin.createUser({ email, password, email_confirm: true });
  if (ce) throw ce;
  userId = created.user.id;

  const c = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { error: se } = await c.auth.signInWithPassword({ email, password });
  se ? bad("confirmed account can sign in", se.message) : ok("confirmed account can sign in");

  /* ── The state the bug leaves behind ────────────────────────────── */

  const before = await c.from("brands").select("brand_id").eq("user_id", userId);
  (before.data ?? []).length === 0
    ? ok("a freshly confirmed account has no brand yet")
    : bad("test premise wrong: the account already had a brand");

  // What the app did before the fix: no brand row means brandId "default".
  const denied = await c.storage.from("brand-images").upload(`default/zz-${stamp}.png`, png, { contentType: "image/png" });
  /row-level security/i.test(denied.error?.message ?? "")
    ? ok('without a brand, saving is refused ("default" is owned by nobody)')
    : bad("expected the refusal the user reported", denied.error?.message ?? "the upload succeeded");

  /* ── The repair useBrand now performs ───────────────────────────── */

  brandId = brandIdFromEmail(email);
  const ins = await c.from("brands").insert({
    user_id: userId,
    brand_id: brandId,
    brand_name: "ZZ Repair",
    website: null,
    industry: null,
    strategy_method: "skip",
    strategy_text: null,
    logo_url: null,
    colors: null,
    onboarding_completed: true,
  });
  ins.error ? bad("the account can create its own brand", ins.error.message) : ok("the account can create its own brand");

  // useBrand re-reads with this exact filter; a row it cannot see is no repair.
  const after = await c
    .from("brands").select("brand_id").eq("user_id", userId).eq("onboarding_completed", true).limit(1).maybeSingle();
  after.data?.brand_id === brandId
    ? ok("useBrand reads the repaired brand back")
    : bad("the repaired brand is not visible to useBrand", after.error?.message ?? "no row");

  /* ── And now it saves ───────────────────────────────────────────── */

  const path = `${brandId}/zz-${stamp}.png`;
  const up = await c.storage.from("brand-images").upload(path, png, { contentType: "image/png" });
  if (up.error) bad("image saves to the library", up.error.message);
  else { uploaded = path; ok("image saves to the library"); }

  const row = await c.from("brand_images").insert({
    brand_id: brandId,
    file_url: c.storage.from("brand-images").getPublicUrl(path).data.publicUrl,
    file_name: "zz-repair.png",
    file_size: png.length,
    category: "brand",
    format: "other",
    campaign_name: "",
    tags: [],
  });
  row.error ? bad("the library row is written", row.error.message) : ok("the library row is written");

  const mine = await c.from("brand_images").select("file_name").eq("brand_id", brandId);
  (mine.data ?? []).length === 1
    ? ok("and it is there when the library is reopened")
    : bad("the image did not come back", `${(mine.data ?? []).length} rows`);
} catch (e) {
  bad("check crashed", e instanceof Error ? e.message : String(e));
} finally {
  if (brandId) {
    await svc.from("brand_images").delete().eq("brand_id", brandId);
    await svc.from("brands").delete().eq("brand_id", brandId);
  }
  if (uploaded) await svc.storage.from("brand-images").remove([uploaded]);
  await svc.storage.from("brand-images").remove([`default/zz-${stamp}.png`]);
  if (userId) await svc.auth.admin.deleteUser(userId).catch(() => {});
}

console.log(fails ? `\n${fails} failed.` : "\nAll good.");
process.exit(fails ? 1 : 0);
