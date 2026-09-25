/** Run with: npm test */
import { test } from "node:test";
import assert from "node:assert/strict";
import { sha256Hex, isMissingHashColumn } from "./index-once.ts";

test("the same bytes hash the same, different bytes differently", () => {
  const a = new TextEncoder().encode("guideline");
  assert.equal(sha256Hex(a), sha256Hex(Buffer.from("guideline")));
  assert.notEqual(sha256Hex(a), sha256Hex(Buffer.from("guideline2")));
  assert.equal(sha256Hex(a).length, 64);
});

test("a set of images hashes by boundary as well as by content", () => {
  const ab = Buffer.from("ab"), c = Buffer.from("c"), a = Buffer.from("a"), bc = Buffer.from("bc");
  assert.notEqual(sha256Hex(ab, c), sha256Hex(a, bc));
});

test("a missing content_sha256 column is recognised, other errors are not", () => {
  assert.ok(isMissingHashColumn({ code: "42703", message: "column brand_documents.content_sha256 does not exist" }));
  assert.ok(isMissingHashColumn({ code: "PGRST204", message: "Could not find the 'content_sha256' column" }));
  assert.ok(!isMissingHashColumn({ code: "23505", message: "duplicate key" }));
  assert.ok(!isMissingHashColumn(null));
});
