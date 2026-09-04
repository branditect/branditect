/**
 * The rules behind the product picker.
 *
 * Steps 1 and 2 of branditect-ui/spec/knowledge-images.md. Kept out of the
 * component because the test runner strips types but does not parse JSX, and
 * because criterion 8 turns on there being exactly one of these.
 *
 * The picker chooses PRODUCTS, not images — "Search products by name or SKU"
 * in the reference. That is the opposite direction from
 * components/products/image-picker.tsx, which chooses one image and returns a
 * URL for the product hero. The two are different components on purpose.
 */

export interface PickableProduct {
  id: string;
  name: string;
  sku?: string | null;
}

/** Selecting many images and tagging them all at once is the point. */
export interface TagRequest {
  imageIds: string[];
  productIds: string[];
}

/**
 * Search products by name or SKU, which is what the field says it does.
 *
 * Case- and punctuation-insensitive, because an SKU is typed as SRB-500 and
 * remembered as "srb 500". An empty query matches everything, so opening the
 * picker shows the catalogue rather than a blank list.
 */
export function productMatches(product: PickableProduct, query: string): boolean {
  const spaced = (v: string) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  // SRB-500 is typed as "SRB-500", "srb 500" and "srb500". Comparing only the
  // spaced form misses the third, which is the one people actually type when
  // they are reading the number off a box.
  const tight = (v: string) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const q = spaced(query);
  if (!q) return true;
  const qt = tight(query);
  return (
    spaced(product.name).includes(q) || tight(product.name).includes(qt) ||
    spaced(product.sku ?? "").includes(q) || tight(product.sku ?? "").includes(qt)
  );
}

/**
 * The rows a tag action would create.
 *
 * Every image against every product, minus what is already linked. Sending a
 * duplicate would violate the (product_id, image_id) primary key and fail the
 * whole batch, so tagging four images to a product that already has one of
 * them would silently do nothing at all.
 */
export function rowsToInsert(
  req: TagRequest,
  brandId: string,
  existing: { product_id: string; image_id: string }[] = [],
): { product_id: string; image_id: string; brand_id: string }[] {
  const already = new Set(existing.map((e) => `${e.product_id}::${e.image_id}`));
  const rows: { product_id: string; image_id: string; brand_id: string }[] = [];
  for (const productId of req.productIds) {
    for (const imageId of req.imageIds) {
      if (already.has(`${productId}::${imageId}`)) continue;
      rows.push({ product_id: productId, image_id: imageId, brand_id: brandId });
    }
  }
  return rows;
}

/** Criterion 4's counterpart on a tile: which products an image is on. */
export function productsForImage(
  imageId: string,
  links: { product_id: string; image_id: string }[],
  products: PickableProduct[],
): PickableProduct[] {
  const ids = new Set(links.filter((l) => l.image_id === imageId).map((l) => l.product_id));
  return products.filter((p) => ids.has(p.id));
}

/** An image with no row in product_images. Drives the `Untagged` count. */
export function isUntagged(imageId: string, links: { image_id: string }[]): boolean {
  return !links.some((l) => l.image_id === imageId);
}

/**
 * What the selection bar says. Written down because "1 selected" reading
 * "1 selecteds" is the kind of thing nobody notices until a customer does.
 */
export function selectionLabel(n: number): string {
  return `${n} selected`;
}

/**
 * The confirm button's label and whether it can be pressed. Tagging nothing to
 * something, or something to nothing, is a no-op that should not look
 * available.
 */
export function confirmState(imageCount: number, productCount: number): {
  disabled: boolean; label: string;
} {
  if (productCount === 0) return { disabled: true, label: "Pick a product" };
  const imgs = `${imageCount} image${imageCount === 1 ? "" : "s"}`;
  const prods = productCount === 1 ? "1 product" : `${productCount} products`;
  return { disabled: imageCount === 0, label: `Tag ${imgs} to ${prods}` };
}

/** Never the file. The chip's × removes the link only. */
export const UNTAG_CHIP_NOTE = "Removes the link, not the file.";


/**
 * The two filters on the Media screen, which between them answer the only
 * question the page gets asked twice: what have I not tagged yet.
 *
 * Criteria 4 and 5. Kept here rather than inline in the component so the count
 * on the toggle and the tiles it renders come from ONE rule — a count computed
 * separately from the list it describes is how a badge says 14 above twelve
 * tiles.
 */
export interface TagFilter {
  /** A product id, or null for "All products". */
  productId: string | null;
  /** Only images with no row in product_images. */
  untaggedOnly: boolean;
}

export function passesTagFilter(
  imageId: string,
  filter: TagFilter,
  links: { product_id: string; image_id: string }[],
): boolean {
  // Untagged wins when both are set: an image on a product is by definition
  // not untagged, so the combination is empty rather than contradictory.
  if (filter.untaggedOnly) return isUntagged(imageId, links);
  if (filter.productId) {
    return links.some((l) => l.image_id === imageId && l.product_id === filter.productId);
  }
  return true;
}

/**
 * The number on the `Untagged` toggle. Counted from the same images the grid
 * is about to render, after every other filter, so it cannot disagree with
 * what is on screen.
 */
export function untaggedCount(
  images: { id: string }[],
  links: { image_id: string }[],
): number {
  return images.filter((i) => isUntagged(i.id, links)).length;
}
