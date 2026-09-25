/**
 * The guideline index, reconnected to Visual identity on 2026-09-25 after the
 * 2026-08-29 rebuild dropped its only caller. These pin the cost controls.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("app/api/brand-guideline/index/route.ts", "utf8");
const page = readFileSync("app/(app)/brand/visual-identity/page.tsx", "utf8");
const visual = readFileSync("app/api/visual/guideline/route.ts", "utf8");

describe("the guideline is indexed again, cheaply", () => {
  it("Visual identity asks for it whenever the guideline changes", () => {
    assert.match(page, /authedJson\("\/api\/brand-guideline\/index", "POST", \{ brandId, source: "visual" \}\)/);
    assert.match(page, /\}, \[brandId, guidelineUrl\]\);/);
  });
  it("the path comes from brand_visual, not the request", () => {
    assert.match(route, /body\.source === "visual"[\s\S]*?\.from\("brand_visual"\)\.select\("guideline_url"\)/);
  });
  it("an already-indexed file returns before any download", () => {
    const early = route.indexOf("alreadyIndexed: true");
    assert.ok(early > 0 && early < route.indexOf(".download(storagePath)"));
  });
  it("a PDF with a text layer is sent as text, before the file path", () => {
    assert.ok(route.indexOf("extractPdfText(") < route.indexOf('media_type: "application/pdf"'));
  });
  it("output is capped at 8000 tokens and the digest at about 2,000 words", () => {
    assert.match(route, /const MAX_TOKENS = 8000;/);
    assert.match(route, /at most about 2,000 words/);
  });
  it("removing the guideline removes its index", () => {
    assert.match(visual, /\.from\("brand_guideline"\)\.delete\(\)\.eq\("brand_id", brandId\)\.eq\("storage_path", path\)/);
  });
});
