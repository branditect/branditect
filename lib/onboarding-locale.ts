/**
 * One lookup for onboarding content in whatever language the interface is in.
 *
 * Item 2 of inbox entry 3: "One function, used everywhere, so the fallback
 * cannot be forgotten at one call site."
 *
 * WHY THIS IS A THIRD FILE RATHER THAN A FUNCTION IN `onboarding-questions.ts`.
 * The entry says "beside forTrack", and it is not, deliberately. That file owns
 * the structure — numbers, sections, kinds, which four are the gate — and the
 * `.fi.ts` overlay owns nothing but words. If the English table imported the
 * Finnish one, adding a third language would mean editing the structure file,
 * which is the dependency that lets two tables start defining the same thing.
 * Neither table imports the other; this file imports both.
 *
 * THE FALLBACK IS PER FIELD, not per question. A question with a translated
 * prompt and an untranslated example shows the prompt in Finnish and the
 * example in English, rather than throwing the whole question back to English.
 * A question added to `QUESTIONS` and not yet to `QUESTIONS_FI` shows entirely
 * in English and does not throw, which is the correct failure — a Finnish
 * screen with an English line on it is visibly incomplete, where a crash or a
 * blank is neither.
 */
import {
  QUESTIONS, SECTIONS, forTrack,
  type Question, type QuestionKind, type SectionId, type Track,
} from "./onboarding-questions.ts";
import { QUESTIONS_FI, SECTIONS_FI } from "./onboarding-questions.fi.ts";
import { DEFAULT_LOCALE, type Locale } from "./i18n/index.ts";

/** One question, resolved for a track and a language. Every field is a string. */
export interface LocalisedQuestion {
  n: number;
  section: SectionId;
  kind: QuestionKind;
  required: boolean;
  q: string;
  help: string;
  ex: string;
  /** True when at least one field fell back to English. */
  partial: boolean;
}

const byNumber: Record<number, Question> = {};
for (const q of QUESTIONS) byNumber[q.n] = q;

/**
 * The Finnish overlay, as a plain lookup. Only `fi` has one; every other
 * locale, including a value the database invents, resolves to English by
 * having no entry here rather than by a special case at the call site.
 */
const OVERLAY: Partial<Record<Locale, typeof QUESTIONS_FI>> = { fi: QUESTIONS_FI };
const SECTION_OVERLAY: Partial<Record<Locale, Record<SectionId, string>>> = { fi: SECTIONS_FI };

export function forLocale(
  n: number,
  track: Track,
  locale: Locale = DEFAULT_LOCALE,
): LocalisedQuestion | null {
  const base = byNumber[n];
  if (!base) return null;

  const over = OVERLAY[locale]?.[n];

  const q = over?.q === undefined ? forTrack(base.q, track) : forTrack(over.q, track);
  const help = over?.help === undefined ? forTrack(base.help, track) : forTrack(over.help, track);
  const ex = over?.ex?.[track] ?? base.ex[track];

  return {
    n: base.n,
    section: base.section,
    kind: base.kind,
    required: base.required === true,
    q, help, ex,
    // Computed from what the overlay HAS, not from whether the two strings
    // happen to match: a Finnish line that reads the same as its English
    // source is translated, not missing.
    //
    // An English field that is empty is not something to translate. Q18 and
    // Q19 are the voice tiles and carry `ex: ""` on every track, so an
    // overlay that omits them is complete rather than partial. Counting them
    // as missing is what my first version did, and it reported the design
    // side's file as 2 of 20 short when it is not.
    partial: locale !== DEFAULT_LOCALE && (
      (over?.q === undefined && forTrack(base.q, track) !== "")
      || (over?.help === undefined && forTrack(base.help, track) !== "")
      || (over?.ex?.[track] === undefined && base.ex[track] !== "")
    ),
  };
}

/** The section heading, in the interface language. */
export function sectionTitleFor(id: SectionId, locale: Locale = DEFAULT_LOCALE): string {
  const translated = SECTION_OVERLAY[locale]?.[id];
  if (translated) return translated;
  return SECTIONS.find((s) => s.id === id)?.title ?? id;
}

/** Every question for a track, in order, in the interface language. */
export function allForLocale(track: Track, locale: Locale = DEFAULT_LOCALE): LocalisedQuestion[] {
  const out: LocalisedQuestion[] = [];
  for (const q of QUESTIONS) {
    const l = forLocale(q.n, track, locale);
    if (l) out.push(l);
  }
  return out;
}
