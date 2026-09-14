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
 * Modules under lib/ whose strings render on screen. The component scan walks
 * .tsx only, so the Home greeting ("Good morning"), every Brand Readiness
 * label and sentence, and the auth errors were rendering English without ever
 * reaching the work list. Listed in their own section of i18n-gap.md; they are
 * not in the EXTRACTED/OUTSTANDING manifest, which is about components.
 *
 * Several readiness sentences are assembled ("One check left — {action} your
 * {verb}", "Zero", "One", "Two" as words): they need whole-sentence keys, not
 * a key per fragment. Found 2026-09-14 while wiring Home.
 */
export const LIB_COPY = ["lib/greeting.ts", "lib/readiness.ts", "lib/auth-errors.ts", "lib/numbers.ts",
  "lib/media-categories.ts", "lib/studio-write.ts"];

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
 * The marketing site, scanned on its own: `npm run i18n:gap:site` writes
 * branditect-ui/spec/i18n-gap-site.md, and `FI_COPY_READY` cannot go true
 * while it finds anything (lib/site-locale.test.ts).
 *
 * lib/pricing-plans.ts is in it because the plan cards and the comparison
 * table are built from it: its copy is on the page even though it is not a
 * component.
 */
export const SITE_SCOPE = ["app/(site)", "components/site", "lib/pricing-plans.ts"];

/**
 * Strings on the site that are the same in every language, each with why.
 * Kept short on purpose: anything a translator might want to change belongs
 * on the list, not here.
 */
export const SITE_SAME_IN_EVERY_LANGUAGE = new Set([
  "Branditect",          // the product name, in the nav and on the OG card
  "© 2026 Branditect",   // the name and a year
]);

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
  "components/delete-account.tsx",
  "components/settings/save-state.tsx",
  "components/settings/settings-hero.tsx",
  "components/settings/you-panel.tsx",
  "components/settings/brand-panel.tsx",
  "components/settings/language-panel.tsx",
  "components/settings/account-panel.tsx",
  "components/settings/coming-soon.tsx",
  "app/(app)/home/page.tsx",
  "components/whats-next-panel.tsx",
  "app/(app)/error.tsx",
  "app/(app)/numbers/pricing/page.tsx",
  "app/start/profile/[step]/page.tsx",
  "components/auth/auth-form.tsx",
  "components/welcome-modal.tsx",
];

/** [file, distinct literals found] on 2026-09-14, after batch A. 571 strings across 54 files. */
export const OUTSTANDING: [string, number][] = [
  ["app/(app)/brand/channels/page.tsx", 22],
  ["app/(app)/brand/strategy/page.tsx", 11],
  ["app/(app)/brand/tone-of-voice/page.tsx", 37],
  ["app/(app)/brand/visual-identity/page.tsx", 13],
  ["app/(app)/chat/page.tsx", 2],
  ["app/(app)/knowledge/documents/page.tsx", 17],
  ["app/(app)/knowledge/images/page.tsx", 2],
  ["app/(app)/knowledge/links/page.tsx", 11],
  ["app/(app)/knowledge/presentations/page.tsx", 2],
  ["app/(app)/knowledge/products/import/page.tsx", 39],
  ["app/(app)/knowledge/products/page.tsx", 7],
  ["app/(app)/numbers/cost/page.tsx", 9],
  ["app/(app)/numbers/offers/page.tsx", 1],
  ["app/(app)/numbers/page.tsx", 2],
  ["app/(app)/numbers/recurring/page.tsx", 1],
  ["app/(app)/numbers/running-costs/page.tsx", 3],
  ["app/(app)/settings/plan/page.tsx", 2],
  ["app/(app)/studio/brand-bases/page.tsx", 12],
  ["app/(app)/studio/brand-book/BrandBookClient.tsx", 17],
  ["app/(app)/studio/brand-guideline/BrandGuidelineClient.tsx", 88],
  ["app/(app)/studio/create-images/page.tsx", 47],
  ["app/(app)/studio/notes/page.tsx", 1],
  ["app/(app)/studio/write/page.tsx", 29],
  ["app/login/page.tsx", 1],
  ["app/onboarding/page.tsx", 6],
  ["app/signup/page.tsx", 1],
  ["app/start/page.tsx", 5],
  ["app/start/q/[n]/page.tsx", 6],
  ["app/start/resume/page.tsx", 6],
  ["components/activity-list.tsx", 5],
  ["components/andy-panel.tsx", 7],
  ["components/auth/auth-layout.tsx", 5],
  ["components/auth/password-field.tsx", 2],
  ["components/auth/sso-buttons.tsx", 5],
  ["components/chat-rail.tsx", 4],
  ["components/documents/ask-panel.tsx", 9],
  ["components/file-library.tsx", 4],
  ["components/image-library.tsx", 7],
  ["components/logo.tsx", 1],
  ["components/numbers/calc-shell.tsx", 2],
  ["components/numbers/guardrails-panel.tsx", 1],
  ["components/onboarding-strip.tsx", 3],
  ["components/products/image-picker.tsx", 10],
  ["components/products/media-tab.tsx", 10],
  ["components/products/pricing-tab.tsx", 7],
  ["components/products/product-drawer.tsx", 19],
  ["components/products/product-picker.tsx", 5],
  ["components/products/remove-product.tsx", 1],
  ["components/products/specs-editor.tsx", 5],
  ["components/readiness-card.tsx", 3],
  ["components/start/rail.tsx", 2],
  ["components/start/shell.tsx", 2],
  ["components/strategy/strategy-document.tsx", 45],
  ["components/visual-identity/uploads.tsx", 7],
];
