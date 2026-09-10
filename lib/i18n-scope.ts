/**
 * What the extraction covers, and what it deliberately does not.
 *
 * Kept apart from the scanner so the scope is a list somebody can read rather
 * than something buried in a walk.
 */

/** Everything behind the login. */
export const SCOPE = [
  "app/(app)",
  "app/login",
  "app/signup",
  "app/onboarding",
  "app/start",
  "components",
];

/**
 * NOT in scope: app/(site), the marketing site, about 70 strings. English for
 * now by Saara's decision — it is public, so it needs real locale URLs for
 * search, which is a different mechanism from a cookie and a dictionary.
 */
export const OUT_OF_SCOPE = [
  "app/(site)",
  // Marketing components, rendered only by app/(site). They live under
  // components/ for import reasons and are not part of the app shell.
  "components/site",
];

/**
 * Per-file exceptions, each with its reason.
 *
 * An entry that no longer matches anything is a failure, not a tidy-up: a
 * stale ignore is how a real literal gets waved through later.
 */
export const IGNORE: Record<string, RegExp[]> = {};

/**
 * The extraction, as a manifest of what is done and what is not.
 *
 * WHY A MANIFEST RATHER THAN "the scanner must find nothing".
 *
 * The dictionary does not cover the interface. Measured on 2026-09-10 against
 * the real files: 1,674 user-facing literals in scope, of which 179 match an
 * `en` value verbatim and 1,495 have no key at all — and only 150 of the 500
 * keys have a value that appears in the code. Extracting the rest would mean
 * writing several hundred Finnish strings myself, which inbox entry 3 forbids
 * in as many words.
 *
 * So the check is two-sided instead of one-sided. Every file in EXTRACTED must
 * scan clean, and the set of files that still have literals must equal
 * OUTSTANDING exactly. A new English screen fails the suite because it is not
 * on the list; a file that gets extracted fails the suite until it moves from
 * one list to the other. Neither direction can drift quietly, and the count
 * below is the size of the job the design side is being asked to translate.
 */
export const EXTRACTED = [
  "components/sidebar.tsx",
  "components/account-menu.tsx",
  "components/language-switch.tsx",
  "app/(app)/settings/page.tsx",
];

/** [file, literals found] at the time of writing. 2107 strings across 63 files. */
export const OUTSTANDING: [string, number][] = [
  ["app/(app)/brand/channels/page.tsx", 83],
  ["app/(app)/brand/strategy/page.tsx", 141],
  ["app/(app)/brand/tone-of-voice/page.tsx", 77],
  ["app/(app)/brand/visual-identity/page.tsx", 66],
  ["app/(app)/chat/page.tsx", 3],
  ["app/(app)/error.tsx", 2],
  ["app/(app)/home/page.tsx", 17],
  ["app/(app)/knowledge/documents/page.tsx", 50],
  ["app/(app)/knowledge/images/page.tsx", 1],
  ["app/(app)/knowledge/links/page.tsx", 50],
  ["app/(app)/knowledge/presentations/page.tsx", 3],
  ["app/(app)/knowledge/products/import/page.tsx", 103],
  ["app/(app)/knowledge/products/page.tsx", 26],
  ["app/(app)/numbers/cost/page.tsx", 21],
  ["app/(app)/numbers/offers/page.tsx", 15],
  ["app/(app)/numbers/page.tsx", 93],
  ["app/(app)/numbers/pricing/page.tsx", 20],
  ["app/(app)/numbers/recurring/page.tsx", 19],
  ["app/(app)/numbers/running-costs/page.tsx", 23],
  ["app/(app)/settings/plan/page.tsx", 3],
  ["app/(app)/studio/brand-bases/page.tsx", 6],
  ["app/(app)/studio/brand-book/BrandBookClient.tsx", 291],
  ["app/(app)/studio/brand-guideline/BrandGuidelineClient.tsx", 95],
  ["app/(app)/studio/code/page.tsx", 69],
  ["app/(app)/studio/create-images/page.tsx", 112],
  ["app/(app)/studio/notes/page.tsx", 25],
  ["app/(app)/studio/write/page.tsx", 33],
  ["app/login/page.tsx", 1],
  ["app/onboarding/page.tsx", 141],
  ["app/signup/page.tsx", 3],
  ["app/start/page.tsx", 7],
  ["app/start/profile/[step]/page.tsx", 13],
  ["app/start/q/[n]/page.tsx", 10],
  ["app/start/resume/page.tsx", 8],
  ["components/activity-list.tsx", 6],
  ["components/andy-panel.tsx", 21],
  ["components/auth/auth-form.tsx", 15],
  ["components/auth/auth-layout.tsx", 13],
  ["components/auth/password-field.tsx", 2],
  ["components/auth/sso-buttons.tsx", 5],
  ["components/chat-rail.tsx", 11],
  ["components/documents/ask-panel.tsx", 19],
  ["components/file-library.tsx", 19],
  ["components/image-library.tsx", 38],
  ["components/logo.tsx", 1],
  ["components/numbers/calc-shell.tsx", 10],
  ["components/numbers/guardrails-panel.tsx", 14],
  ["components/onboarding-strip.tsx", 4],
  ["components/products/image-picker.tsx", 13],
  ["components/products/media-tab.tsx", 13],
  ["components/products/pricing-tab.tsx", 19],
  ["components/products/product-drawer.tsx", 46],
  ["components/products/product-picker.tsx", 12],
  ["components/products/remove-product.tsx", 3],
  ["components/products/specs-editor.tsx", 6],
  ["components/readiness-card.tsx", 13],
  ["components/start/rail.tsx", 4],
  ["components/start/shell.tsx", 6],
  ["components/strategy/icons.tsx", 16],
  ["components/strategy/strategy-document.tsx", 72],
  ["components/visual-identity/uploads.tsx", 49],
  ["components/welcome-modal.tsx", 21],
  ["components/whats-next-panel.tsx", 6],
];
