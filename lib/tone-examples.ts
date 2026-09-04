/**
 * Twelve registers, one message, twelve ways.
 *
 * Step 1 of branditect-ui/spec/tone-examples.md, which amends the
 * tone-of-voice step in spec/onboarding.md. The step used to ask a person to
 * describe their voice into a box, which is a blank page, and blank pages are
 * where onboarding stops. Recognition is easy where description is hard: the
 * picks become the answer and the box is demoted to "in your own words".
 *
 * EVERY LINE HERE IS OURS. Nothing is quoted from any company, and nothing may
 * be presented as though it were. The comparators are comparisons — saying a
 * register is "like Duolingo" needs no source and puts nothing in anyone's
 * mouth — but a sentence of our own set in quotation marks directly under a
 * real company's name reads as that company's copy, which would be a
 * fabrication printed under their name. That is criterion 6, and it is the one
 * failure on this screen that actually matters. So:
 *
 *   - `line` holds a bare sentence with no quotation marks of any kind.
 *   - `comparators` are names only, never attached to a line.
 *   - The renderer must not attribute. See toneExampleProblems() below, which
 *     the data test runs over every entry.
 *
 * Holding the message constant is the teaching mechanism, not a consolation
 * for dropping real quotes. Twelve unrelated slogans would mean reading twelve
 * different things and inferring the difference; twelve versions of one
 * sentence shows it. The shipping notification was chosen because it is a
 * message every one of these customers actually sends, so the register is
 * demonstrated on their own work rather than on a perfume tagline.
 *
 * Fixed for every account. No generation, no personalisation, no cost — this
 * is a static file, which is why it is cheap to build and cheap to keep.
 *
 * NOTE for step 3, when this is wired to the answer: lib/onboarding-questions.ts
 * already carries six ARCHETYPES with their own `think` comparators, used by
 * question 18. These twelve are a different, finer vocabulary. They are not
 * merged here on purpose — reconciling them is a decision about what gets
 * stored on the brand, not a data-file detail.
 */

/** The message every register below is a version of. */
export const BASE_MESSAGE = "Telling a customer their order has shipped.";

export interface ToneExample {
  /** Stored on the brand. Criterion 5: this, never a comparator name. */
  id: string;
  /** The heading on the card, and what is being chosen. */
  register: string;
  /** Smallest type on the card. Names only — nothing is attributed to them. */
  comparators: string[];
  /** BASE_MESSAGE written in this register. Ours. Never quoted, never quotable. */
  line: string;
}

export const TONE_EXAMPLES: ToneExample[] = [
  { id: "playful", register: "Playful", comparators: ["Duolingo", "Innocent"],
    line: "It's out the door and it's not looking back. Track it →" },
  { id: "warm", register: "Warm", comparators: ["Headspace", "Glossier"],
    line: "Good news — your order's on its way. Here's where it is." },
  { id: "plain-spoken", register: "Plain-spoken", comparators: ["Slack", "GitHub"],
    line: "Your order shipped today. Track it here." },
  { id: "bold", register: "Bold", comparators: ["Virgin", "Red Bull"],
    line: "Shipped. Go get it." },
  { id: "premium", register: "Premium", comparators: ["Louis Vuitton", "Aesop"],
    line: "Your order has left us. Follow its journey." },
  { id: "expert", register: "Expert", comparators: ["IBM", "Cisco"],
    line: "Dispatched today and tracked end to end. Follow it here." },
  { id: "purposeful", register: "Purposeful", comparators: ["Patagonia", "WWF"],
    line: "On its way, in packaging you can compost. Track it here." },
  { id: "witty", register: "Witty", comparators: ["Netflix", "Oatly"],
    line: "Your order has left the building. No encore." },
  { id: "rugged", register: "Rugged", comparators: ["Harley-Davidson", "Carhartt"],
    line: "Packed, loaded and rolling. Track it." },
  { id: "homely", register: "Homely", comparators: ["IKEA", "Ben & Jerry's"],
    line: "It's on its way to you. Pop the kettle on." },
  { id: "encouraging", register: "Encouraging", comparators: ["Peloton", "Nike"],
    line: "It's on its way. You're going to love it." },
  { id: "candid", register: "Candid", comparators: ["Buffer", "Monzo"],
    line: "It shipped a day late — sorry about that. Here's the tracking." },
];

/**
 * The comparator line as the card shows it. "like" is doing real work: it
 * frames the names as comparison rather than as a source.
 */
export function comparatorLabel(example: ToneExample): string {
  return `like ${example.comparators.join(", ")}`;
}

export function toneExample(id: string): ToneExample | null {
  return TONE_EXAMPLES.find((e) => e.id === id) ?? null;
}

/** Criterion 5: only these ever reach the saved row. */
export const REGISTER_IDS: readonly string[] = TONE_EXAMPLES.map((e) => e.id);

export function isRegisterId(value: string): boolean {
  return REGISTER_IDS.includes(value);
}

/**
 * Names that must never be stored as a tone value. Downstream should read
 * "premium", not "Aesop".
 */
export function isComparatorName(value: string): boolean {
  const v = value.trim().toLowerCase();
  return TONE_EXAMPLES.some((e) => e.comparators.some((c) => c.toLowerCase() === v));
}

/**
 * Criterion 6, as a function rather than a promise in a comment.
 *
 * Returns every way an entry would be presenting itself as a quotation from
 * its comparator. Empty for all twelve is the only acceptable result, and the
 * data test asserts exactly that.
 */
export function toneExampleProblems(e: ToneExample): string[] {
  const problems: string[] = [];

  // Straight and typographic quote marks both. The reference page wraps each
  // line in “…” directly beneath the comparator names, which is precisely the
  // impression this rules out — so the quoting, if any, is the renderer's
  // decision to defend, and never baked into the data.
  if (/["'‘’“”«»]/.test(e.line)) {
    // An apostrophe inside a word is not a quotation mark. Only flag ones that
    // could open or close a quote.
    const asQuote = /(^|[\s(\-])["'‘“«]|["'’”»]([\s.,!?)\-]|$)/.test(e.line);
    if (asQuote) problems.push("line is wrapped in quotation marks");
  }

  // Attribution in any of the shapes people write it.
  for (const name of e.comparators) {
    const n = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`—\\s*${n}\\b|\\bby ${n}\\b|\\b${n}\\s*(said|says|wrote)\\b|\\(${n}\\)`, "i").test(e.line)) {
      problems.push(`line attributes itself to ${name}`);
    }
    if (e.line.includes(name)) problems.push(`line names ${name}`);
  }

  if (!e.line.trim()) problems.push("line is empty");
  if (e.comparators.length === 0) problems.push("no comparator");
  if (e.comparators.some((c) => !c.trim())) problems.push("blank comparator");
  return problems;
}
