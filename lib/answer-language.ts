/**
 * What language did the founder actually answer in?
 *
 * WHY NOT `output_language`. That column decides what her CUSTOMERS read — the
 * copy Studio produces (lib/output-language.ts says so, and means it). A brand
 * strategy is not customer copy: it is the founder's own document, built out of
 * her own sentences. Someone who fills twenty questions in Finnish and is
 * handed an English strategy has been answered by a machine that did not
 * listen, whatever a settings column says — and the column is 'en' by default,
 * so most brands never chose it at all.
 *
 * WHY A HEURISTIC AND NOT "the model can see the language". It can, and it
 * mostly gets it right, which is the problem: "mostly" comes back in English
 * the day one answer is a quoted English tagline. Deciding it here makes the
 * instruction explicit and the behaviour testable, which is the same reason
 * output-language.ts states its directive rather than leaving it to inference.
 *
 * Two languages, because the interface has two (lib/i18n). A third would mean
 * markers for a third; the shape does not change.
 */
import { DEFAULT_LOCALE, type Locale } from "./i18n/index.ts";

/*
  Finnish markers.

  Short function words, whole-word matched, plus the two letters English does
  not use. Chosen so that a Finnish sentence hits several and an English one
  hits none — "on" is the exception and is left out deliberately, because it is
  also an English preposition and would tilt every English answer.
*/
const FI_WORDS = /\b(ja|ei|että|mutta|kuin|ovat|joka|tämä|sekä|kun|myös|voi|niin|kaikki|oma|omat|jotta|koska|vain|nyt|sitten|hyvä|paljon|asiakkaat|palvelu|meidän|heidän|olemme|haluamme)\b/gi;
const FI_LETTERS = /[äöÄÖ]/g;

/*
  English markers.

  The same idea in reverse: without these, a short Finnish answer containing an
  English product name could be read as English purely because it hit no
  Finnish marker either.
*/
const EN_WORDS = /\b(the|and|is|are|of|to|for|with|that|this|our|we|they|you|from|have|has|will|about|because|when|what|which)\b/gi;

const count = (text: string, re: RegExp): number => (text.match(re) ?? []).length;

export interface LanguageGuess {
  language: Locale;
  /** True when the text gave no real signal either way. */
  uncertain: boolean;
}

/**
 * The language of a set of answers, with a note on how sure it is.
 *
 * Empty input, or input with no markers at all (numbers, a URL, a single
 * proper noun), is English-and-uncertain rather than a coin toss: English is
 * what every prompt in this codebase was written against, so it is the safe
 * side to fall to.
 */
export function guessLanguage(texts: (string | null | undefined)[]): LanguageGuess {
  const joined = texts.filter((t): t is string => typeof t === "string" && t.trim() !== "").join("\n");
  if (!joined.trim()) return { language: DEFAULT_LOCALE, uncertain: true };

  // Two ä's in one word should not outvote two Finnish words; the letters are
  // strong evidence but not proportionally stronger the more of them there are.
  const fi = count(joined, FI_WORDS) + Math.min(count(joined, FI_LETTERS), 12);
  const en = count(joined, EN_WORDS);

  if (fi === 0 && en === 0) return { language: DEFAULT_LOCALE, uncertain: true };
  // A clear win needs to be a win, not a single stray word.
  if (fi > en) return { language: "fi", uncertain: fi - en < 2 };
  return { language: "en", uncertain: en - fi < 2 };
}

/**
 * The instruction that makes the strategy come back in the founder's language.
 *
 * Goes in the per-request block, not the cached system prompt: it varies by
 * brand's answers rather than being stable brand state, and a value that
 * changes per request in a cached prefix costs a cache miss for everyone.
 *
 * Empty for English, for the reason output-language.ts gives: these prompts
 * were written and tuned in English, and telling them to write English is a
 * change with no upside.
 */
export function answerLanguageDirective(language: Locale): string {
  if (language === "en") return "";
  return `

LANGUAGE. The founder answered in Finnish, so write the strategy in Finnish
(suomi). Every value a person reads is Finnish. JSON keys and field names stay
exactly as specified, in English. Do not translate the founder's own words back
into English first — work in her language throughout.`;
}
