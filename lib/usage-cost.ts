/**
 * What one provider call costs US, in euro cents. spec: hq-accounts.md Part 1.
 *
 * This is the cost-to-serve side of the ledger. It is never shown to a
 * customer (they see credits); it is what brand_budget.cost_used_cents and
 * usage_events.cost_cents count, and what the spend ceiling is enforced on.
 *
 * Pure: no env reads at call time beyond the exchange rate, no network, so the
 * estimator and the reconciler can be tested against fixed numbers.
 */

/** Prices in USD per million tokens. Sources, checked 2026-09-25:
 *  - Anthropic: claude-sonnet-5 $2 in / $10 out; cache write 1.25x input,
 *    cache read 0.1x input. PDF and image blocks bill as input tokens.
 *  - Google: gemini-2.5-flash-image $0.30 in; one 1024px image = 1290 output
 *    tokens = $0.039, i.e. $30 per million output tokens.
 *  When a model changes, add it here; an unknown model is priced at the most
 *  expensive known rate rather than at zero (see priceFor). */
export const PRICES_USD_PER_MTOK: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }> = {
  "claude-sonnet-5": { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
  "gemini-2.5-flash-image": { input: 0.3, output: 30, cacheWrite: 0.3, cacheRead: 0.3 },
};

/** Tokens one generated image consumes (Gemini 2.5 Flash Image, ≤1024px). */
export const GEMINI_IMAGE_OUTPUT_TOKENS = 1290;

/** Rough token cost of inputs we cannot count before sending. Deliberately
 *  high: the reservation is "estimate high, true up down" (spec), and an
 *  estimate that comes in low is exactly the hole the ceiling exists to close. */
export const TOKENS_PER_IMAGE = 1800;
export const TOKENS_PER_PDF_PAGE = 3000;
export const CHARS_PER_TOKEN = 3;

/**
 * USD → EUR. Provider invoices are in dollars, the ledger is in euro cents.
 * Set USD_TO_EUR in the environment when the rate moves materially; a stale
 * rate shifts every figure by the same factor and never breaks the ceiling,
 * because estimate and actual use the same one.
 */
export function usdToEur(): number {
  const v = Number(process.env.USD_TO_EUR);
  return Number.isFinite(v) && v > 0 ? v : 0.92;
}

function priceFor(model: string) {
  const exact = PRICES_USD_PER_MTOK[model];
  if (exact) return exact;
  // Unknown model: never free. Price it at the dearest rate we know.
  const all = Object.values(PRICES_USD_PER_MTOK);
  return {
    input: Math.max(...all.map((p) => p.input)),
    output: Math.max(...all.map((p) => p.output)),
    cacheWrite: Math.max(...all.map((p) => p.cacheWrite)),
    cacheRead: Math.max(...all.map((p) => p.cacheRead)),
  };
}

function usdToCents(usd: number): number {
  return Math.round(usd * usdToEur() * 100 * 10_000) / 10_000; // 4 decimals, as the ledger stores
}

export interface TokenUsage {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  /** The write split by TTL, when the API reports it. */
  cache_creation?: { ephemeral_1h_input_tokens?: number | null; ephemeral_5m_input_tokens?: number | null } | null;
}

/** A 1-hour cache write costs 2x input, not the 1.25x of a 5-minute one.
 *  lib/prompt-cache.ts writes every cached block with ttl "1h". */
export const CACHE_WRITE_1H_MULTIPLIER = 2;

/** Real cost of an Anthropic call from `response.usage`. */
export function anthropicCostCents(model: string, usage: TokenUsage | null | undefined): number {
  if (!usage) return 0;
  const p = priceFor(model);
  const written = usage.cache_creation_input_tokens ?? 0;
  const written1h = Math.min(written, usage.cache_creation?.ephemeral_1h_input_tokens ?? 0);
  const usd =
    ((usage.input_tokens ?? 0) * p.input +
      (usage.output_tokens ?? 0) * p.output +
      (written - written1h) * p.cacheWrite +
      written1h * p.input * CACHE_WRITE_1H_MULTIPLIER +
      (usage.cache_read_input_tokens ?? 0) * p.cacheRead) /
    1_000_000;
  return usdToCents(usd);
}

export interface GeminiUsage {
  promptTokenCount?: number | null;
  candidatesTokenCount?: number | null;
}

/** Real cost of a Gemini call from `usageMetadata`. When the response carries
 *  no usage (it sometimes does not), price the images it returned instead. */
export function geminiCostCents(model: string, usage: GeminiUsage | null | undefined, imagesReturned = 1): number {
  const p = priceFor(model);
  const inTok = usage?.promptTokenCount ?? 0;
  const outTok = usage?.candidatesTokenCount ?? imagesReturned * GEMINI_IMAGE_OUTPUT_TOKENS;
  return usdToCents((inTok * p.input + outTok * p.output) / 1_000_000);
}

export interface EstimateInput {
  model: string;
  /** Characters of text sent: system prompt, messages, extracted text. */
  inputChars?: number;
  images?: number;
  pdfPages?: number;
  /** The call's max_tokens. The estimate assumes the model uses all of it. */
  maxOutputTokens: number;
}

/** Upper-bound cost of one call, before it is made. */
export function estimateCents(e: EstimateInput): number {
  const p = priceFor(e.model);
  // Text may be a cached system block, and a 1-hour cache write bills at 2x
  // input: price every text token as if it were one. Images and PDF pages sit
  // in messages, which are never cached, so they bill at plain input.
  const textTok = Math.ceil((e.inputChars ?? 0) / CHARS_PER_TOKEN);
  const mediaTok = (e.images ?? 0) * TOKENS_PER_IMAGE + (e.pdfPages ?? 0) * TOKENS_PER_PDF_PAGE;
  const textRate = Math.max(p.input * CACHE_WRITE_1H_MULTIPLIER, p.cacheWrite);
  const usd = (textTok * textRate + mediaTok * p.input + Math.max(0, e.maxOutputTokens) * p.output) / 1_000_000;
  // 10% headroom on top of the upper bound; rounded up to the cent.
  return Math.ceil(usdToCents(usd) * 1.1 * 100) / 100;
}

/**
 * Characters of text in a prompt, for estimateCents({ inputChars }). Takes a
 * `system` (string or block array) and `messages` as they will be sent, and
 * counts strings and the `text` / `content` of blocks, recursively. Base64
 * `source` payloads are not text: count those as images or pdfPages.
 */
export function promptChars(...parts: unknown[]): number {
  let n = 0;
  for (const part of parts) {
    if (typeof part === "string") n += part.length;
    else if (Array.isArray(part)) n += promptChars(...part);
    else if (part && typeof part === "object") {
      const o = part as { text?: unknown; content?: unknown };
      n += promptChars(o.text, o.content);
    }
  }
  return n;
}

/**
 * Pages in a PDF, without parsing it. Counts page objects ("/Type /Page",
 * not "/Pages"). Good enough to refuse a 64-page guideline before page one;
 * when it finds nothing it assumes one page per 50 KB, which errs high.
 */
export function pdfPageCount(bytes: Uint8Array | Buffer): number {
  const text = Buffer.from(bytes).toString("latin1");
  const n = (text.match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
  if (n > 0) return n;
  return Math.max(1, Math.ceil(bytes.length / 50_000));
}

/** One credit is €0.02 of cost basis (hq-accounts.md: 100 credits = €2.00).
 *  Used only to phrase a refusal in the unit the customer knows. */
export const CENTS_PER_CREDIT = 2;
export function centsAsCredits(cents: number): number {
  return Math.ceil(cents / CENTS_PER_CREDIT);
}
