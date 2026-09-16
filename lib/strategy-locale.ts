/**
 * One lookup for strategy-questionnaire content in the interface language.
 *
 * The same shape as `onboarding-locale.ts`, and a third file for the same
 * reason given there: `strategy-questions.ts` owns the structure and the
 * storage keys, `strategy-questions.fi.ts` owns nothing but words, and neither
 * imports the other.
 *
 * THE STORAGE KEY NEVER MOVES. `questionKey` is built from the English section
 * and question, and this module deliberately does not touch it. A person who
 * answers in Finnish and a person who answers in English write to the same row
 * under the same key, and switching the interface language mid-questionnaire
 * shows the same answers rather than an empty form.
 *
 * THE FALLBACK IS PER FIELD. A question with a translated prompt and an
 * untranslated placeholder shows the prompt in Finnish and the placeholder in
 * English, rather than throwing the whole question back to English. A question
 * added to `QUESTIONS` and not yet here shows entirely in English and does not
 * throw, which is the right failure: a visibly incomplete Finnish screen, not
 * a crash and not a blank.
 */
import { QUESTIONS, type QuestionDef } from "./strategy-questions.ts";
import { QUESTIONS_FI, SECTIONS_FI } from "./strategy-questions.fi.ts";
import { DEFAULT_LOCALE, type Locale } from "./i18n/index.ts";

/** One question, resolved for a language. Every field is a string. */
export interface LocalisedStrategyQuestion {
  /** Position in QUESTIONS. The overlay is keyed by `id`, not by this. */
  index: number;
  /** The permanent storage key. */
  id: string;
  /** English, always: this is what `questionKey` is built from. */
  section: string;
  /** The section heading as shown. */
  sectionLabel: string;
  question: string;
  placeholder: string;
  /** True when at least one field fell back to English. */
  partial: boolean;
}

const OVERLAY: Partial<Record<Locale, typeof QUESTIONS_FI>> = { fi: QUESTIONS_FI };
const SECTION_OVERLAY: Partial<Record<Locale, Record<string, string>>> = { fi: SECTIONS_FI };

/** The section heading, in the interface language. Falls back to the English. */
export function sectionLabelFor(section: string, locale: Locale = DEFAULT_LOCALE): string {
  return SECTION_OVERLAY[locale]?.[section] ?? section;
}

export function strategyForLocale(
  index: number,
  locale: Locale = DEFAULT_LOCALE,
): LocalisedStrategyQuestion | null {
  const base: QuestionDef | undefined = QUESTIONS[index];
  if (!base) return null;

  const over = OVERLAY[locale]?.[base.id];

  return {
    index,
    id: base.id,
    section: base.section,
    sectionLabel: sectionLabelFor(base.section, locale),
    question: over?.question ?? base.question,
    placeholder: over?.placeholder ?? base.placeholder,
    // Computed from what the overlay HAS, not from whether the strings match:
    // a Finnish line that reads the same as its English source is translated,
    // not missing.
    partial: locale !== DEFAULT_LOCALE
      && (over?.question === undefined || over?.placeholder === undefined),
  };
}

/** Every question, in order, in the interface language. */
export function allStrategyForLocale(locale: Locale = DEFAULT_LOCALE): LocalisedStrategyQuestion[] {
  return QUESTIONS.map((_, i) => strategyForLocale(i, locale)!).filter(Boolean);
}
