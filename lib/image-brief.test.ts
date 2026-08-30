/** Run with: npm test — criteria from branditect-ui/spec/create-images.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildImagePrompt, buildParts, productIdentity, decideProductAccess,
  briefBlocker, briefReady, isValidWhere, isValidFormat,
  refsAfterKindChange, productIdFor, defaultKind, defaultWhere,
  WHERES, FORMATS, PRODUCT_FIELDS,
  type Brief,
} from "./image-brief.ts";

const BRIEF: Brief = {
  subject: "A bottle on a kitchen counter in morning light",
  where: "indoors",
  format: "4:5",
  productId: null,
};

/** Criterion 3. The old route pushed images[0] and dropped the rest. */
describe("every reference reaches the model", () => {
  it("sends three image parts for three references", () => {
    const parts = buildParts("prompt", ["AAA", "BBB", "CCC"]);
    const images = parts.filter((p) => "inline_data" in p);
    assert.equal(images.length, 3);
    assert.deepEqual(images.map((p) => (p as { inline_data: { data: string } }).inline_data.data), ["AAA", "BBB", "CCC"]);
  });

  it("puts the instruction first, then the images", () => {
    const parts = buildParts("prompt", ["AAA", "BBB"]);
    assert.deepEqual(Object.keys(parts[0]), ["text"]);
    assert.equal(parts.length, 3);
  });

  it("carries each image's own mime type", () => {
    const parts = buildParts("p", ["A", "B"], ["image/png", undefined]);
    const imgs = parts.filter((p) => "inline_data" in p) as { inline_data: { mime_type: string } }[];
    assert.equal(imgs[0].inline_data.mime_type, "image/png");
    assert.equal(imgs[1].inline_data.mime_type, "image/jpeg");
  });

  it("skips an empty slot rather than sending a blank part", () => {
    const parts = buildParts("p", ["A", "", "C"]);
    assert.equal(parts.filter((p) => "inline_data" in p).length, 2);
  });

  it("says how many references it was given", () => {
    const one = buildImagePrompt({ brief: BRIEF, product: null, referenceCount: 1 });
    const three = buildImagePrompt({ brief: BRIEF, product: null, referenceCount: 3 });
    assert.ok(/reference image\b/.test(one), one);
    assert.ok(/reference images \(3\)/.test(three), three);
  });
});

/** Criterion 4. The old Scene Mode was posted and never read. */
describe("where reaches the prompt", () => {
  const prompts = WHERES.map((w) => buildImagePrompt({ brief: { ...BRIEF, where: w }, product: null, referenceCount: 1 }));

  it("produces a different prompt for each of the three values", () => {
    assert.equal(new Set(prompts).size, 3, "two values produced the same prompt");
  });

  it("names the scene", () => {
    assert.ok(/studio setup/.test(prompts[0]), prompts[0]);
    assert.ok(/real interior/.test(prompts[1]), prompts[1]);
    assert.ok(/outdoors, in daylight/.test(prompts[2]), prompts[2]);
  });

  /** Where is a hint. "Outdoors" plus "on a silver background" is silver. */
  it("tells the model the description wins when they disagree", () => {
    for (const p of prompts) {
      assert.ok(/follow the description/i.test(p), p);
    }
  });

  it("rejects a value that is not one of the three", () => {
    assert.equal(isValidWhere("outdoors"), true);
    assert.equal(isValidWhere("Outdoor People"), false);
    assert.equal(isValidWhere(null), false);
    assert.equal(isValidFormat("4:5"), true);
    assert.equal(isValidFormat("Portrait 9:16"), false);
  });
});

/**
 * Criterion 5. The old route appended "They are wearing ${colour}" to every
 * request, so a bottle was described as wearing yellow fabric.
 */
describe("nothing is ever described as wearing anything", () => {
  const noClothes: Brief = { ...BRIEF, subject: "A bottle of absorbent granules on a workshop bench" };

  it("has no wardrobe line for a subject with no clothing", () => {
    for (const where of WHERES) {
      for (const format of FORMATS) {
        const p = buildImagePrompt({ brief: { ...noClothes, where, format }, product: null, referenceCount: 2 });
        assert.ok(!/wearing/i.test(p), `${where}/${format}: ${p}`);
      }
    }
  });

  it("has none with a product selected either", () => {
    const p = buildImagePrompt({
      brief: noClothes,
      product: { name: "SORBIFY OIL", description: "A hydrophobic absorbent.", category: "absorbents", tags: "granules" },
      referenceCount: 1,
    });
    assert.ok(!/wearing/i.test(p), p);
  });

  it("still carries the word when the user typed it themselves", () => {
    const p = buildImagePrompt({
      brief: { ...BRIEF, subject: "A girl running outside wearing a yellow dress" },
      product: null, referenceCount: 1,
    });
    assert.ok(/wearing a yellow dress/.test(p), p);
  });
});

/**
 * Criterion 6 — MERGE BLOCKER. Commercials are not image direction, and a
 * model that sees a floor price will happily write it onto a label.
 */
describe("a product's commercials never reach the prompt", () => {
  const SENTINELS = {
    price_rrp: "ZZPRICE_RRP",
    price_wholesale: "ZZPRICE_WHOLESALE",
    price_cogs: "ZZPRICE_COGS",
    price_monthly: "ZZPRICE_MONTHLY",
    price_retail: "ZZPRICE_RETAIL",
    landed_cost: "ZZLANDED_COST",
    floor_price: "ZZFLOOR_PRICE",
    max_discount_pct: "ZZMAX_DISCOUNT",
    min_margin_pct: "ZZMIN_MARGIN",
    tax_rate_pct: "ZZTAX_RATE",
    currency: "ZZCURRENCY",
    sku: "ZZSKU",
    price_model: "ZZPRICE_MODEL",
    capacity_per_month: "ZZCAPACITY",
    stock_units: "ZZSTOCK",
  };

  const row = {
    id: "p1", brand_id: "brand-a",
    name: "SORBIFY OIL",
    description: "A hydrophobic absorbent for oil based liquids.",
    category: "absorbents",
    tags: "white granules, matte tub",
    ...SENTINELS,
  };

  const identity = productIdentity(row)!;
  const prompt = buildImagePrompt({ brief: { ...BRIEF, productId: "p1" }, product: identity, referenceCount: 2 });

  it("keeps only the four named fields", () => {
    assert.deepEqual(Object.keys(identity).sort(), [...PRODUCT_FIELDS].sort());
  });

  it("puts the name and the description in the prompt", () => {
    assert.ok(prompt.includes("SORBIFY OIL"), prompt);
    assert.ok(prompt.includes("A hydrophobic absorbent for oil based liquids."), prompt);
    assert.ok(prompt.includes("absorbents"), prompt);
    assert.ok(prompt.includes("white granules, matte tub"), prompt);
  });

  it("leaks no price, cost, margin, floor price or discount", () => {
    for (const [field, sentinel] of Object.entries(SENTINELS)) {
      assert.ok(!prompt.includes(sentinel), `${field} reached the prompt: ${prompt}`);
      assert.ok(!JSON.stringify(identity).includes(sentinel), `${field} survived productIdentity`);
    }
  });

  it("resolves 'this product' to the selected record", () => {
    assert.ok(/means "SORBIFY OIL"/.test(prompt), prompt);
  });

  it("returns null for a row with no name, rather than a half identity", () => {
    assert.equal(productIdentity({ description: "x" }), null);
    assert.equal(productIdentity({ name: "   " }), null);
    assert.equal(productIdentity(null), null);
  });

  it("drops empty strings rather than writing 'Category: '", () => {
    const bare = productIdentity({ name: "Thing", description: "", category: null, tags: "  " })!;
    assert.deepEqual(bare, { name: "Thing", description: null, category: null, tags: null });
    const p = buildImagePrompt({ brief: BRIEF, product: bare, referenceCount: 1 });
    assert.ok(!/Category:/.test(p), p);
    assert.ok(!/Material or colour:/.test(p), p);
  });

  it("says nothing about a product when none is selected", () => {
    const p = buildImagePrompt({ brief: BRIEF, product: null, referenceCount: 1 });
    assert.ok(!/The product is/.test(p), p);
    assert.ok(!/this product/i.test(p), p);
  });
});

/** Criterion 7 — MERGE BLOCKER. */
describe("a product from another brand is rejected", () => {
  it("refuses when the product's brand is not the caller's", () => {
    const r = decideProductAccess("brand-a", "brand-b");
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.status, 403);
  });

  it("allows the caller's own product", () => {
    const r = decideProductAccess("brand-a", "brand-a");
    assert.equal(r.ok, true);
  });

  it("refuses when the caller has no brand at all", () => {
    assert.equal(decideProductAccess(null, "brand-a").ok, false);
    assert.equal(decideProductAccess("", "brand-a").ok, false);
  });

  /** A missing product and someone else's product get the same refusal — a
      distinguishable 404 would confirm which ids are real. */
  it("gives 403, never 404", () => {
    const missing = decideProductAccess("brand-a", null);
    const foreign = decideProductAccess("brand-a", "brand-b");
    assert.equal(foreign.ok === false && foreign.status, 403);
    assert.ok(missing.ok === true || missing.status === 403);
  });
});

/** Criterion 8's copy, stated rather than left silent. */
describe("the button says what is missing", () => {
  it("asks for a reference first", () => {
    assert.equal(briefBlocker(0, ""), "Add a reference to start");
    assert.equal(briefBlocker(0, "a bottle"), "Add a reference to start");
  });

  it("then asks for a subject", () => {
    assert.equal(briefBlocker(2, "   "), "Say what you want to see");
  });

  it("clears once both are there", () => {
    assert.equal(briefBlocker(1, "a bottle"), null);
  });

  it("counts references in the ready line", () => {
    assert.equal(briefReady(1), "1 reference read · about 15 seconds");
    assert.equal(briefReady(2), "2 references read · about 15 seconds");
  });
});

describe("the assembly order the spec names", () => {
  it("is style, product, scene, subject, extra", () => {
    const p = buildImagePrompt({
      brief: { ...BRIEF, subject: "SUBJECT_HERE", extra: "EXTRA_HERE" },
      product: { name: "PRODUCT_HERE", description: null, category: null, tags: null },
      referenceCount: 1,
    });
    const order = ["matches the visual style", "PRODUCT_HERE", "Scene:", "SUBJECT_HERE", "EXTRA_HERE"];
    let at = -1;
    for (const token of order) {
      const i = p.indexOf(token);
      assert.ok(i > at, `${token} is out of order in: ${p}`);
      at = i;
    }
  });

  it("omits the extra line when it is empty", () => {
    const p = buildImagePrompt({ brief: { ...BRIEF, extra: "   " }, product: null, referenceCount: 1 });
    assert.ok(/Show: A bottle on a kitchen counter in morning light Where the scene/.test(p), p);
  });

  it("puts the aspect ratio in every prompt", () => {
    for (const format of FORMATS) {
      const p = buildImagePrompt({ brief: { ...BRIEF, format }, product: null, referenceCount: 1 });
      assert.ok(p.includes(`Aspect ratio ${format}.`), p);
    }
  });
});

/**
 * The route's own contribution to criterion 6: the projection. A `select("*")`
 * here would put a future catalog_products column one careless template
 * literal away from a prompt, and the columns beside these are floor prices
 * and margins. A grep test, because the failure it guards is a query quietly
 * widening during a refactor.
 */
describe("the route reads only the four fields", () => {
  const source = readFileSync(
    new URL("../app/api/brand/generate-from-reference/route.ts", import.meta.url), "utf8",
  );

  it("never selects * from catalog_products", () => {
    // The name may appear in a comment explaining why it is wrong; what must
    // not exist is the call.
    assert.ok(!/\.select\("\*"\)/.test(source), "the route calls select(*)");
  });

  it("projects PRODUCT_FIELDS rather than listing columns by hand", () => {
    assert.ok(/PRODUCT_FIELDS\.join/.test(source), "the select should be built from PRODUCT_FIELDS");
  });

  it("names no commercial column anywhere in the file", () => {
    for (const banned of ["price_rrp", "price_wholesale", "price_cogs", "price_retail", "landed_cost",
                          "floor_price", "max_discount_pct", "min_margin_pct", "tax_rate_pct"]) {
      assert.ok(!source.includes(banned), `${banned} appears in the route`);
    }
  });

  it("has no wardrobe line left in it", () => {
    assert.ok(!/wearing/i.test(source), "the route still mentions wearing");
  });

  it("checks product ownership before reading it", () => {
    assert.ok(/decideProductAccess/.test(source), "the route does not gate on ownership");
  });
});

/** Criterion 1b. */
describe("switching to Something else", () => {
  const refs = [
    { id: "product:p1", source: "product" as const },
    { id: "knowledge:k1", source: "knowledge" as const },
    { id: "upload:u1", source: "upload" as const },
  ];

  it("removes the product's photos", () => {
    assert.deepEqual(refsAfterKindChange(refs, "other").map((r) => r.id), ["knowledge:k1", "upload:u1"]);
  });

  it("keeps references the user added themselves", () => {
    const kept = refsAfterKindChange(refs, "other");
    assert.ok(kept.every((r) => r.source !== "product"));
    assert.equal(kept.length, 2);
  });

  it("leaves them alone when staying on A product picture", () => {
    assert.deepEqual(refsAfterKindChange(refs, "product"), refs);
  });

  it("sends productId null", () => {
    assert.equal(productIdFor("other", "p1"), null);
    assert.equal(productIdFor("product", "p1"), "p1");
    assert.equal(productIdFor("product", ""), null);
    assert.equal(productIdFor("product", null), null);
  });

  it("defaults to Something else only when the brand has no products", () => {
    assert.equal(defaultKind(0), "other");
    assert.equal(defaultKind(4), "product");
  });

  it("defaults Where to studio for a product and outdoors otherwise", () => {
    assert.equal(defaultWhere("product"), "studio");
    assert.equal(defaultWhere("other"), "outdoors");
  });
});

/** Criterion 2. CLAUDE.md bans "Architect" as a label, and Library is reserved
 *  for saved Studio outputs. */
describe("the page names nothing it should not", () => {
  const page = readFileSync(new URL("../app/(app)/studio/create-images/page.tsx", import.meta.url), "utf8");

  it("says Architect nowhere", () => {
    assert.ok(!/architect/i.test(page), "the page still says Architect");
  });

  it("does not call anything Brand Library", () => {
    assert.ok(!/Brand Library/.test(page));
  });

  it("names no vendor in the UI", () => {
    for (const vendor of ["Gemini", "OpenAI", "DALL", "Midjourney", "Stability"]) {
      assert.ok(!page.includes(vendor), `${vendor} is named on the page`);
    }
  });

  it("calls the button Make the image", () => {
    assert.ok(page.includes("Make the image"), "the button copy is missing");
    assert.ok(!/Generate Architect Vision/.test(page));
  });
});
