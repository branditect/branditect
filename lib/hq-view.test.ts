import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  costRatio, filterAccounts, isTestAccount, needsAttention, sortAccounts, toCsv, toView, TIER_LABEL, STATUS_LABEL,
  type AccountRow,
} from "./hq-view.ts";
import { TIER_CAPS } from "./plans.ts";

const NOW = Date.parse("2026-09-25T12:00:00Z");

function row(p: Partial<AccountRow>): AccountRow {
  return {
    brand_id: "b", brand_name: "Brand", owner_email: "o@x.fi", signed_up_at: "2026-09-01T00:00:00Z",
    last_active_at: "2026-09-24T00:00:00Z", active_days: [], tier: "free", status: "active", mrr_cents: 0,
    trial_ends_at: null, storage_cap_bytes_override: null, credits_cap: null, credits_used: null,
    cost_cap_cents: null, cost_used_cents: null, period: null, storage_bytes: 0, storage_files: 0,
    questionnaire_status: null, documents: 0, presentations: 0, links: 0, brand_images: 0, has_guideline: false,
    cost_credits_30d: 0, cost_indexing_30d: 0, cost_failures_30d: 0, generations_30d: 0,
    generation_failures_30d: 0, indexed_30d: 0, events_7d: 0, failures_7d: 0, cost_month_cents: 0,
    ...p,
  };
}

describe("criterion 12 — credits used never exceed the cap in a rendered row", () => {
  it("an account at exactly its cap shows cap of cap, capped", () => {
    const v = toView(row({ credits_cap: 100, credits_used: 100 }), NOW);
    assert.equal(v.creditsUsed, 100);
    assert.equal(v.creditsPct, 100);
    assert.equal(v.creditsCapped, true);
  });
  it("seeded data past the cap still renders at the cap", () => {
    const v = toView(row({ credits_cap: 350, credits_used: 999, tier: "pro" }), NOW);
    assert.ok(v.creditsUsed <= v.creditsCap);
    assert.equal(v.creditsPct, 100);
  });
  it("no budget row yet reads the tier's cap", () => {
    const v = toView(row({ tier: "pro_plus" }), NOW);
    assert.equal(v.creditsCap, TIER_CAPS.pro_plus.creditsCap);
    assert.equal(v.creditsUsed, 0);
  });
});

describe("criterion 13 — cost vs revenue sorts worst first; free sorts separately", () => {
  const rows = [
    row({ brand_id: "ok", brand_name: "Ok", tier: "pro", mrr_cents: 2293, cost_credits_30d: 300 }),
    row({ brand_id: "bad", brand_name: "Bad", tier: "pro", mrr_cents: 2293, cost_indexing_30d: 1500, indexed_30d: 380 }),
    row({ brand_id: "free-heavy", brand_name: "Free heavy", cost_credits_30d: 200 }),
    row({ brand_id: "warn", brand_name: "Warn", tier: "pro_plus", mrr_cents: 3520, cost_credits_30d: 1500 }),
    row({ brand_id: "free-light", brand_name: "Free light", cost_credits_30d: 10 }),
  ].map((r) => toView(r, NOW));

  it("the default sort puts the worst paid ratio first and free accounts after every paid one", () => {
    const ids = sortAccounts(rows).map((v) => v.brandId);
    assert.deepEqual(ids, ["bad", "warn", "ok", "free-heavy", "free-light"]);
  });
  it("free accounts are never a percentage", () => {
    const free = rows.find((v) => v.brandId === "free-heavy")!;
    assert.equal(free.ratio.pct, null);
    assert.equal(free.ratio.label, "Free · no revenue");
  });
  it("the thresholds are 30 and 60", () => {
    const r = row({ tier: "pro", mrr_cents: 1000 });
    assert.equal(costRatio(r, 290).tone, "ok");
    assert.equal(costRatio(r, 300).tone, "warn");
    assert.equal(costRatio(r, 600).tone, "warn");
    assert.equal(costRatio(r, 610).tone, "bad");
  });
  it("a red ratio says why", () => {
    assert.equal(rows.find((v) => v.brandId === "bad")!.ratio.why, "indexed 380 documents");
    const failing = toView(row({ tier: "pro", mrr_cents: 1000, cost_failures_30d: 700, generations_30d: 100, generation_failures_30d: 31 }), NOW);
    assert.equal(failing.ratio.why, "31% of generations failed");
  });
});

describe("criterion 14 — meaning without colour", () => {
  it("every tier and status has a word", () => {
    for (const t of Object.keys(TIER_CAPS)) assert.ok(TIER_LABEL[t as keyof typeof TIER_LABEL]);
    for (const s of ["active", "trialing", "past_due", "cancelled"]) assert.ok(STATUS_LABEL[s as keyof typeof STATUS_LABEL]);
  });

  it("the table's text, with every colour class removed, still states tier, status and ratio", () => {
    const src = readFileSync("app/(hq)/hq/page.tsx", "utf8") + readFileSync("app/(hq)/hq/ui.tsx", "utf8");
    // The tier chip renders the label beside its dot.
    assert.match(src, /\{TIER_LABEL\[tier\]\}/);
    // The ratio renders its label (a percentage or "Free · no revenue") and a glyph.
    assert.match(src, /\{v\.ratio\.label\}/);
    assert.match(src, /v\.ratio\.tone === "ok" \? "✓" : "!"/);
    // A non-active status renders a word.
    assert.match(src, /v\.statusLabel/);
    // Every dot that is only colour is hidden from assistive tech or paired with words.
    assert.match(src, /sr-only">\{a\.tone === "bad" \? "Problem:" : "Warning:"\}/);
    assert.match(src, /sr-only">\s*credits \{euros/);
  });

  it("the CSV, which has no colour at all, carries tier, status and ratio as words", () => {
    const csv = toCsv([toView(row({ tier: "pro", status: "trialing", mrr_cents: 1000, cost_credits_30d: 700 }), NOW)]);
    assert.match(csv, /,Pro,Trialing,/);
    assert.match(csv, /,70%$/);
  });
});

describe("filters and attention", () => {
  const views = [
    row({ brand_id: "a", brand_name: "Nordkit", owner_email: "jonas@nordkit.se", tier: "pro" }),
    row({ brand_id: "b", brand_name: "Lyra", owner_email: "lyra@x.fi", status: "trialing", trial_ends_at: "2026-09-27T00:00:00Z" }),
  ].map((r) => toView(r, NOW));

  it("searches brand and email, filters tier and status", () => {
    assert.deepEqual(filterAccounts(views, "nordkit", "all", "any").map((v) => v.brandId), ["a"]);
    assert.deepEqual(filterAccounts(views, "lyra@", "all", "any").map((v) => v.brandId), ["b"]);
    assert.deepEqual(filterAccounts(views, "", "pro", "any").map((v) => v.brandId), ["a"]);
    assert.deepEqual(filterAccounts(views, "", "all", "trialing").map((v) => v.brandId), ["b"]);
  });

  it("flags cost above revenue, a trial ending within three days, and stuck signups", () => {
    const rows = [
      row({ brand_id: "x", brand_name: "Loss", tier: "pro", mrr_cents: 1000, cost_month_cents: 1400 }),
      row({ brand_id: "t", brand_name: "Trial", status: "trialing", trial_ends_at: "2026-09-27T00:00:00Z" }),
      row({ brand_id: "s", brand_name: "Stuck", signed_up_at: "2026-09-01T00:00:00Z", questionnaire_status: "partial" }),
    ];
    const text = needsAttention(rows.map((r) => toView(r, NOW)), rows, NOW).map((a) => a.text).join("\n");
    assert.match(text, /Loss cost €14\.00 this month on a €10\.00 account/);
    assert.match(text, /Trial trial ends in 2 days/);
    assert.match(text, /signups? older than 7 days never cleared the questionnaire gate/);
  });
});

describe("test accounts", () => {
  it("harness accounts and plus-addressed test sign-ups are tests; customers are not", () => {
    assert.equal(isTestAccount({ brand_id: "zz-doc-mtlhlj17", owner_email: "zz-doc-1@branditect-test.invalid" }), true);
    assert.equal(isTestAccount({ brand_id: "zz-bg-x", owner_email: null }), true);
    assert.equal(isTestAccount({ brand_id: "any", owner_email: "a@b.invalid" }), true);
    assert.equal(isTestAccount({ brand_id: "saara-s-salama-testi1-bgzr", owner_email: "saara.s.salama+testi1@gmail.com" }), true);
    assert.equal(isTestAccount({ brand_id: "sorbify-13t9", owner_email: "saara@cgl.agency" }), false);
    assert.equal(isTestAccount({ brand_id: "nitroco-bsqy", owner_email: "hello@nitroco.shop" }), false);
  });
});
