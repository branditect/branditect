/**
 * Every paid route, what kind of spend it is, and what it charges in credits.
 * spec: hq-accounts.md Part 1; the credit prices are the ones the pricing page
 * already promises (lib/pricing-plans.ts CREDIT_COSTS): an image is 5 credits,
 * a set of copy drafts 2, a question to the brand brain 1, and reading and
 * indexing any file you upload is free.
 *
 * Routes the pricing page does not name — building the strategy, generating
 * the tone of voice, reading colours off a logo — are setup, and setup is
 * treated like indexing: no credits, but every cent still counts against the
 * cost ceiling. Charging someone to be onboarded discourages exactly the
 * behaviour that makes them stay, which is the spec's reason indexing is free.
 *
 * lib/api-spend.test.ts asserts that every route that calls a provider is in
 * this table and goes through meter(). A route missing here cannot spend.
 */

export type SpendKind = "image" | "copy" | "chat" | "index" | "analyse";

export interface RoutePlan {
  kind: SpendKind;
  credits: number;
}

export const ROUTE_PLAN = {
  // Make — spends credits.
  "copy-architect": { kind: "copy", credits: 2 },
  "social-strategy": { kind: "copy", credits: 2 },
  "brand-guideline/brand-text": { kind: "copy", credits: 2 },
  "brand-guideline/edit": { kind: "copy", credits: 2 },
  "brand/generate-from-reference": { kind: "image", credits: 5 },
  andy: { kind: "chat", credits: 1 },
  "brand-book/chat": { kind: "chat", credits: 1 },

  // Feed — indexing what was uploaded. Free to the customer.
  "vault/extract": { kind: "index", credits: 0 },
  "brand-guideline/index": { kind: "index", credits: 0 },
  "brand-guideline/extract": { kind: "index", credits: 0 },
  "brand-guideline/upload-asset": { kind: "index", credits: 0 },
  "brand-assets/upload": { kind: "index", credits: 0 },
  "catalog/parse": { kind: "index", credits: 0 },
  "strategy-extract": { kind: "index", credits: 0 },
  "extract-colors": { kind: "index", credits: 0 },
  "visual/guideline": { kind: "index", credits: 0 },

  // Define — setup and analysis. Free to the customer.
  "strategy-generate": { kind: "analyse", credits: 0 },
  "brand-strategy": { kind: "analyse", credits: 0 },
  "tone/generate": { kind: "analyse", credits: 0 },
  "brand/analyse-images": { kind: "analyse", credits: 0 },
  "brand/generate-prompt": { kind: "analyse", credits: 0 },
} as const satisfies Record<string, RoutePlan>;

export type MeteredRoute = keyof typeof ROUTE_PLAN;

export function planFor(route: MeteredRoute): RoutePlan {
  return ROUTE_PLAN[route];
}
