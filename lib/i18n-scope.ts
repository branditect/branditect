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
  "lib/media-categories.ts"];

/*
  lib/studio-write.ts was on that list and is not any more.
  
  Its strings are what the model is asked to produce — "an email: a subject
  line, then the body, then a sign-off", "120 to 180 words" — and the file
  says so in its own field comments: `deliverable` is "What the model is
  asked to produce", and the interface reads `labelKey` instead. None of it
  renders.
  
  It belongs to a different mechanism. branditect-ui/spec/finnish.md splits
  output language from interface language into two columns precisely because
  they are different questions; prompt text follows `output_language`, not
  the dictionary. Keeping it here put 21 model instructions on a translator's
  work list, which is 21 wrong answers waiting to be given.
*/

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
export const SAME_IN_EVERY_LANGUAGE = new Set([
  "Branditect",     // the product name, in the logo and the start rail
  "BRANDITECT",     // the same name, set in caps in the chat rail
  "Canva",          // a product name, in the links picker
  "Google Slides",  // a product name, in the links picker
  "Google",         // the identity providers on the sign-in buttons
  "Microsoft",
  "Apple",
  "DM Sans",        // a typeface name; renaming it would name a different font
  "Ag",             // the two letters every type specimen shows
  "SND",            // the placeholder glyph standing in for a sound file
]);

/**
 * Per-file exceptions, each with its reason.
 *
 * An entry that no longer matches anything is a failure, not a tidy-up: a
 * stale ignore is how a real literal gets waved through later.
 */
export const IGNORE: Record<string, RegExp[]> = {
  // Labels handed to withTimeout(), which names the call in an AuthTimeout.
  // lib/auth-timeout.ts maps every thrown error to AUTH_COPY before it
  // reaches a screen — "Raw driver strings never reach the user" — so these
  // two words are diagnostics and are never read by anybody.
  "app/login/page.tsx": [/^Routing$/],
  "app/signup/page.tsx": [/^Brand setup$/],
};

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
  "app/(app)/brand/visual-identity/page.tsx",
  "app/login/page.tsx",
  "app/signup/page.tsx",
  "components/auth/sso-buttons.tsx",
  "components/chat-rail.tsx",
  "components/file-library.tsx",
  "components/logo.tsx",
  "components/onboarding-strip.tsx",
  "components/start/rail.tsx",
  "components/visual-identity/uploads.tsx",
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
  "app/(app)/brand/strategy/page.tsx",
  "app/(app)/chat/page.tsx",
  "app/(app)/knowledge/documents/page.tsx",
  "app/(app)/knowledge/images/page.tsx",
  "app/(app)/knowledge/presentations/page.tsx",
  "app/(app)/knowledge/products/page.tsx",
  "app/(app)/numbers/offers/page.tsx",
  "app/(app)/numbers/page.tsx",
  "app/(app)/numbers/recurring/page.tsx",
  "app/(app)/numbers/running-costs/page.tsx",
  "app/(app)/settings/plan/page.tsx",
  "app/(app)/studio/brand-book/BrandBookClient.tsx",
  "app/(app)/studio/create-images/page.tsx",
  "app/(app)/studio/notes/page.tsx",
  "app/(app)/studio/write/page.tsx",
  "app/start/page.tsx",
  "app/start/q/[n]/page.tsx",
  "app/start/resume/page.tsx",
  "components/activity-list.tsx",
  "components/andy-panel.tsx",
  "components/auth/auth-layout.tsx",
  "components/auth/password-field.tsx",
  "components/documents/ask-panel.tsx",
  "components/image-library.tsx",
  "components/numbers/calc-shell.tsx",
  "components/numbers/guardrails-panel.tsx",
  "components/products/image-picker.tsx",
  "components/products/media-tab.tsx",
  "components/products/pricing-tab.tsx",
  "components/products/product-picker.tsx",
  "components/products/remove-product.tsx",
  "components/products/specs-editor.tsx",
  "components/readiness-card.tsx",
  "components/start/shell.tsx",
  "components/strategy/strategy-document.tsx",
  "app/(app)/brand/tone-of-voice/page.tsx",
];

/** [file, distinct literals found] on 2026-09-16, after the complete Finnish pass. 98 strings across 19 files. */
export const OUTSTANDING: [string, number][] = [
  // Six goal values, stored in English and compared as stored.
  ["app/(app)/brand/channels/page.tsx", 6],
  ["app/(app)/knowledge/links/page.tsx", 1],
  ["app/(app)/knowledge/products/import/page.tsx", 4],
  ["app/(app)/numbers/cost/page.tsx", 8],
  ["app/(app)/studio/brand-bases/page.tsx", 4],
  ["app/(app)/studio/brand-guideline/BrandGuidelineClient.tsx", 13],
  ["app/onboarding/page.tsx", 4],
  ["components/products/product-drawer.tsx", 5],
];
