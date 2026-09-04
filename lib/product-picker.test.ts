/** Run with: npm test — criteria from branditect-ui/spec/knowledge-images.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  productMatches, rowsToInsert, productsForImage, isUntagged,
  selectionLabel, confirmState, passesTagFilter, untaggedCount,
} from "./product-picker.ts";

const P = [
  { id: "p1", name: "SORBIFY OIL 500ml", sku: "SRB-500" },
  { id: "p2", name: "SORBIFY REFILL", sku: "SRB-RF" },
  { id: "p3", name: "Spill kit", sku: null },
];

describe("searching products by name or SKU", () => {
  it("matches a name", () => {
    assert.deepEqual(P.filter((p) => productMatches(p, "refill")).map((p) => p.id), ["p2"]);
  });
  it("matches an SKU however it is punctuated", () => {
    for (const q of ["SRB-500", "srb 500", "srb500"]) {
      assert.deepEqual(P.filter((p) => productMatches(p, q)).map((p) => p.id), ["p1"], q);
    }
  });
  it("an empty query shows the catalogue rather than a blank list", () => {
    assert.equal(P.filter((p) => productMatches(p, "   ")).length, 3);
  });
  it("survives a product with no SKU", () => {
    assert.ok(productMatches(P[2], "spill"));
    assert.ok(!productMatches(P[2], "SRB"));
  });
});

/** CRITERION 1: the write path that did not exist. */
describe("the rows a tag writes", () => {
  it("is every image against every product", () => {
    const rows = rowsToInsert({ imageIds: ["i1", "i2"], productIds: ["p1", "p2"] }, "b1");
    assert.equal(rows.length, 4);
    assert.ok(rows.every((r) => r.brand_id === "b1"));
  });

  it("skips pairs that already exist, so one duplicate cannot fail the batch", () => {
    const rows = rowsToInsert(
      { imageIds: ["i1", "i2"], productIds: ["p1"] }, "b1",
      [{ product_id: "p1", image_id: "i1" }],
    );
    assert.deepEqual(rows.map((r) => r.image_id), ["i2"]);
  });

  it("returns nothing when everything is already linked", () => {
    const rows = rowsToInsert(
      { imageIds: ["i1"], productIds: ["p1"] }, "b1",
      [{ product_id: "p1", image_id: "i1" }],
    );
    assert.equal(rows.length, 0);
  });
});

/** CRITERION 2: one image, three products, three chips. */
describe("what a tile shows", () => {
  const links = [
    { product_id: "p1", image_id: "i1" },
    { product_id: "p2", image_id: "i1" },
    { product_id: "p3", image_id: "i1" },
    { product_id: "p1", image_id: "i2" },
  ];

  it("names every product an image is on", () => {
    assert.deepEqual(productsForImage("i1", links, P).map((p) => p.name),
      ["SORBIFY OIL 500ml", "SORBIFY REFILL", "Spill kit"]);
  });

  it("an image on one product shows one", () => {
    assert.equal(productsForImage("i2", links, P).length, 1);
  });

  it("an image on none shows none, which is what offers the tag button", () => {
    assert.deepEqual(productsForImage("i9", links, P), []);
    assert.ok(isUntagged("i9", links));
    assert.ok(!isUntagged("i1", links));
  });
});

describe("the selection bar", () => {
  it("counts without inventing a plural", () => {
    assert.equal(selectionLabel(1), "1 selected");
    assert.equal(selectionLabel(3), "3 selected");
  });

  it("cannot confirm with no product picked", () => {
    assert.deepEqual(confirmState(3, 0), { disabled: true, label: "Pick a product" });
  });

  it("says what it is about to do", () => {
    assert.equal(confirmState(1, 1).label, "Tag 1 image to 1 product");
    assert.equal(confirmState(3, 2).label, "Tag 3 images to 2 products");
  });
});

/**
 * CRITERION 8, the reason this file exists. Three entry points, one component.
 * Building it three times is how three behaviours appear.
 */
describe("there is one product picker", () => {
  it("only one component implements it", () => {
    const files = readdirSync("components/products");
    const pickers = files.filter((f) => /product-picker.*\.tsx$/.test(f));
    assert.deepEqual(pickers, ["product-picker.tsx"], `found ${JSON.stringify(pickers)}`);
  });

  it("both the Images screen and the product card import that one", () => {
    for (const f of ["components/image-library.tsx", "components/products/media-tab.tsx"]) {
      assert.ok(readFileSync(f, "utf8").includes('from "@/components/products/product-picker"'),
        `${f} does not import the shared picker`);
    }
  });

  it("neither builds its own product list UI instead", () => {
    for (const f of ["components/image-library.tsx", "components/products/media-tab.tsx"]) {
      const src = readFileSync(f, "utf8");
      assert.ok(!/Search products by name or SKU/.test(src),
        `${f} has its own copy of the picker's search field`);
    }
  });
});

/**
 * The bug this spec opens with: product_images was shipped, read and rendered,
 * and nothing ever wrote to it, so Media could not fill.
 */
describe("something writes to product_images", () => {
  const route = readFileSync("app/api/products/attachments/route.ts", "utf8");

  it("the route has a POST", () => {
    assert.ok(/export async function POST/.test(route));
  });

  it("which inserts into product_images", () => {
    const post = route.slice(route.indexOf("export async function POST"));
    assert.ok(/from\("product_images"\)[\s\S]{0,40}\.insert\(/.test(post),
      "POST does not insert into product_images");
  });

  it("and identifies the caller rather than trusting a brand_id in the body", () => {
    const post = route.slice(route.indexOf("export async function POST"));
    assert.ok(post.includes("resolveBrand"), "no resolveBrand call");
    assert.ok(!/body\.brandId|body\.brand_id/.test(post), "reads a brand id off the body");
  });

  it("checks both sides own the brand before writing", () => {
    const post = route.slice(route.indexOf("export async function POST"));
    assert.ok(post.includes('from("catalog_products")'), "products are not checked");
    assert.ok(post.includes('from("brand_images")'), "images are not checked");
  });
});

/**
 * CRITERION 4: the Untagged filter shows exactly the images with no row in
 * product_images, and its count matches the number of tiles rendered.
 * CRITERION 5: filtering by a product shows exactly that product's images.
 */
describe("the two filters", () => {
  const imgs = [{ id: "i1" }, { id: "i2" }, { id: "i3" }, { id: "i4" }];
  const links = [
    { product_id: "p1", image_id: "i1" },
    { product_id: "p2", image_id: "i1" },
    { product_id: "p1", image_id: "i2" },
  ];
  const show = (f: { productId: string | null; untaggedOnly: boolean }) =>
    imgs.filter((i) => passesTagFilter(i.id, f, links)).map((i) => i.id);

  it("5 · a product shows exactly its own images", () => {
    assert.deepEqual(show({ productId: "p1", untaggedOnly: false }), ["i1", "i2"]);
    assert.deepEqual(show({ productId: "p2", untaggedOnly: false }), ["i1"]);
  });

  it("5 · a product with none shows none, not everything", () => {
    assert.deepEqual(show({ productId: "p9", untaggedOnly: false }), []);
  });

  it("4 · Untagged shows exactly the images with no row", () => {
    assert.deepEqual(show({ productId: null, untaggedOnly: true }), ["i3", "i4"]);
  });

  it("4 · and its count matches what is rendered", () => {
    const rendered = show({ productId: null, untaggedOnly: true });
    assert.equal(untaggedCount(imgs, links), rendered.length,
      "the badge and the grid disagree");
  });

  it("4 · the count is taken from the filtered set, not from every image", () => {
    // Two images survive an upstream filter; only one of them is untagged.
    const narrowed = [{ id: "i2" }, { id: "i3" }];
    assert.equal(untaggedCount(narrowed, links), 1);
    assert.notEqual(untaggedCount(narrowed, links), untaggedCount(imgs, links));
  });

  it("neither filter set shows everything", () => {
    assert.deepEqual(show({ productId: null, untaggedOnly: false }), ["i1", "i2", "i3", "i4"]);
  });

  it("Untagged wins over a product, so the pair is empty rather than contradictory", () => {
    assert.deepEqual(show({ productId: "p1", untaggedOnly: true }), ["i3", "i4"]);
  });
});

describe("the filters are wired to those rules", () => {
  const src = readFileSync("components/image-library.tsx", "utf8");

  it("the grid uses passesTagFilter rather than its own copy", () => {
    assert.ok(src.includes("passesTagFilter("), "the component filters by hand");
  });

  it("the badge and the grid are counted from the same set", () => {
    assert.ok(/untaggedCount\(beforeTagFilters, links\)/.test(src),
      "the count is computed over a different set from the one rendered");
  });

  it("both controls exist and are labelled", () => {
    assert.ok(/aria-label="Filter by product"/.test(src));
    assert.ok(/aria-pressed=\{untaggedOnly\}/.test(src));
  });
});
