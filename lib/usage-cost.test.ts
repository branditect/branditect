import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import {
  anthropicCostCents,
  estimateCents,
  geminiCostCents,
  pdfPageCount,
  promptChars,
  PRICES_USD_PER_MTOK,
} from "./usage-cost.ts";

process.env.USD_TO_EUR = "1"; // round numbers in the assertions below

test("Sonnet 5 is priced at $2 in / $10 out per million", () => {
  assert.equal(anthropicCostCents("claude-sonnet-5", { input_tokens: 1_000_000, output_tokens: 0 }), 200);
  assert.equal(anthropicCostCents("claude-sonnet-5", { input_tokens: 0, output_tokens: 1_000_000 }), 1000);
});

test("cache reads are a tenth of input, cache writes 1.25x", () => {
  assert.equal(anthropicCostCents("claude-sonnet-5", { cache_read_input_tokens: 1_000_000 }), 20);
  assert.equal(anthropicCostCents("claude-sonnet-5", { cache_creation_input_tokens: 1_000_000 }), 250);
});

test("one Gemini image is $0.039", () => {
  assert.equal(geminiCostCents("gemini-2.5-flash-image", null, 1), 3.87);
  assert.equal(geminiCostCents("gemini-2.5-flash-image", { promptTokenCount: 0, candidatesTokenCount: 1290 }), 3.87);
});

test("an unknown model is never free", () => {
  assert.ok(anthropicCostCents("claude-future-9", { input_tokens: 1000, output_tokens: 1000 }) > 0);
});

test("the estimate is an upper bound on the real cost of the same call", () => {
  const est = estimateCents({ model: "claude-sonnet-5", inputChars: 30_000, maxOutputTokens: 4000 });
  const real = anthropicCostCents("claude-sonnet-5", { input_tokens: 10_000, output_tokens: 4000 });
  assert.ok(est >= real, `${est} < ${real}`);
});

test("a 64-page PDF is estimated by page", () => {
  const pages = Array.from({ length: 64 }, (_, i) => `${i} 0 obj << /Type /Page /Parent 1 0 R >>`).join("\n");
  const pdf = Buffer.from(`%PDF-1.7\n1 0 obj << /Type /Pages /Count 64 >>\n${pages}`);
  assert.equal(pdfPageCount(pdf), 64);
});

test("every model the routes use has a price", () => {
  for (const m of ["claude-sonnet-5", "gemini-2.5-flash-image"]) assert.ok(PRICES_USD_PER_MTOK[m], m);
});

test("a 1-hour cache write is 2x input", () => {
  assert.equal(
    anthropicCostCents("claude-sonnet-5", {
      cache_creation_input_tokens: 1_000_000,
      cache_creation: { ephemeral_1h_input_tokens: 1_000_000, ephemeral_5m_input_tokens: 0 },
    }),
    400,
  );
});

test("the estimate still covers a call whose whole prompt is a 1-hour cache write", () => {
  const est = estimateCents({ model: "claude-sonnet-5", inputChars: 30_000, maxOutputTokens: 100 });
  const real = anthropicCostCents("claude-sonnet-5", {
    cache_creation_input_tokens: 10_000,
    cache_creation: { ephemeral_1h_input_tokens: 10_000, ephemeral_5m_input_tokens: 0 },
    output_tokens: 100,
  });
  assert.ok(est >= real, `${est} < ${real}`);
});

test("promptChars counts system and message text, not base64 payloads", () => {
  const system = [{ type: "text", text: "abcd" }];
  const messages = [
    { role: "user", content: [{ type: "image", source: { type: "base64", data: "x".repeat(1000) } }, { type: "text", text: "12345" }] },
    { role: "assistant", content: "xyz" },
  ];
  assert.equal(promptChars(system, messages), 12);
});

test("Haiku is priced at its own rate, not at the dearest known one", () => {
  const usage = { input_tokens: 1_000_000, output_tokens: 0 };
  assert.ok(anthropicCostCents("claude-haiku-4-5-20251001", usage) < anthropicCostCents("claude-sonnet-5", usage));
  const route = readFileSync("app/api/brand-guideline/upload-asset/route.ts", "utf8");
  assert.match(route, /const MODEL = 'claude-haiku-4-5-20251001'/);
});
