/**
 * The net under the prompt rules.
 *
 * A system prompt is a request, not a guarantee, so every prose response is run
 * through this before it reaches the UI or the database. Chat and Studio render
 * plain text, so a stray ** arrives on screen as literal asterisks.
 *
 * Prose only. Code and structured JSON must not pass through here: `**`, `-`
 * and `*` are legitimate syntax there, and stripping them corrupts the payload.
 */

/** Words that read as a continuation rather than the start of a new sentence. */
const CONNECTORS = new Set([
  "and", "or", "but", "so", "yet", "not", "by", "for", "with", "without",
  "at", "in", "on", "to", "from", "of", "as", "than", "then", "which",
  "that", "who", "where", "when", "while", "because", "though", "although",
  "plus", "including", "especially", "even", "just", "only", "again",
]);

/**
 * An em dash between two clauses becomes a full stop; one introducing a
 * fragment becomes a comma. "Absorbs liquids — engineered for demanding sites"
 * is two clauses. "The best option — by far" is a fragment.
 */
function dashRule(after: string): { sep: string; capitalise: boolean } {
  const words = after.trim().split(/\s+/).filter(Boolean);
  const first = (words[0] ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (words.length < 3 || CONNECTORS.has(first)) return { sep: ", ", capitalise: false };
  return { sep: ". ", capitalise: true };
}

export function sanitiseOutput(input: string): string {
  if (!input) return input;
  let out = input;

  // Bold and italics, keeping the inner text. Bold first, or ** would be read
  // as two italic markers.
  out = out.replace(/\*\*\*([\s\S]+?)\*\*\*/g, "$1");
  out = out.replace(/\*\*([\s\S]+?)\*\*/g, "$1");
  out = out.replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*(?!\*)/g, "$1$2");
  out = out.replace(/__([\s\S]+?)__/g, "$1");

  // Heading markers, keeping the heading text.
  out = out.replace(/^[ \t]*#{1,6}[ \t]+/gm, "");

  // Bullet characters at the start of a line. A hyphen with no following space
  // is left alone, so "-5" and "non-toxic" survive.
  out = out.replace(/^[ \t]*[-*•·][ \t]+/gm, "");

  // Em and en dashes, spaced or not. The ASCII hyphen is never touched, which
  // is what keeps hyphenated compounds intact.
  out = out.replace(/[ \t]*[—–][ \t]*(\S+)/g, (match, nextWord: string, offset: number, whole: string) => {
    const after = whole.slice(offset + match.length - nextWord.length);
    const { sep, capitalise } = dashRule(after);
    const word = capitalise ? nextWord.charAt(0).toUpperCase() + nextWord.slice(1) : nextWord;
    return sep + word;
  });

  // Double punctuation left behind by the replacements above.
  out = out.replace(/([.,;:!?])[ \t]*\.(\s)/g, "$1$2");
  out = out.replace(/\.[ \t]*\./g, ".");
  out = out.replace(/,[ \t]*,/g, ",");
  out = out.replace(/[ \t]+([.,;:!?])/g, "$1");

  // Trailing whitespace and runs of blank lines.
  out = out.replace(/[ \t]+$/gm, "");
  out = out.replace(/\n{3,}/g, "\n\n");

  return out.trim();
}

/**
 * Walks a parsed JSON payload and sanitises its string values in place.
 *
 * For routes whose model output is an object of generated copy. Applied to the
 * parsed object rather than the raw text, so JSON structure is never at risk —
 * and never applied to code or to structured values such as hex colours, which
 * is why callers opt in per route rather than this running everywhere.
 */
export function sanitiseDeep<T>(value: T): T {
  if (typeof value === "string") return sanitiseOutput(value) as unknown as T;
  if (Array.isArray(value)) return value.map(sanitiseDeep) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = sanitiseDeep(v);
    return out as unknown as T;
  }
  return value;
}
