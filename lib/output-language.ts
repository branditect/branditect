/**
 * What language Studio writes in.
 *
 * Inbox entry 4b, and section 1 of branditect-ui/spec/finnish.md.
 *
 * THIS IS THE HALF THAT MATTERS. `interface_language` decides what the founder
 * reads; `output_language` decides what her CUSTOMERS read — the copy Studio
 * produces, which is the thing she is paying for. Until this file existed the
 * column had a default and nothing anywhere set it or read it, so a Finnish
 * brand got a Finnish interface and English copy: exactly backwards.
 *
 * TWO COLUMNS, NOT ONE, and the reason is not symmetry. A founder who has read
 * English software for fifteen years may well want the interface in English and
 * the copy in Finnish, because Finnish is what her customers read. Someone else
 * wants the reverse.
 *
 * STATED, NOT INFERRED. Before this, every generation route let the model guess
 * the language from the brand's own inputs. A Finnish brand with a Finnish
 * strategy probably got Finnish — probably, uncontrolled, and liable to come
 * back in English the day a document in the vault happens to be English. One
 * line in the system prompt is the difference between a feature and an
 * accident.
 *
 * The directive goes in the CACHED block, not beside the request. It is brand
 * state and byte-stable per brand, so it costs nothing; putting it in the
 * per-request block would be correct too but pointlessly.
 */
import { toLocale, type Locale } from "./i18n/index.ts";

export const LANGUAGE_NAME: Record<Locale, string> = { en: "English", fi: "Finnish (suomi)" };

/**
 * The line that goes into the system prompt.
 *
 * Empty for English. That is deliberate: English is what every one of these
 * prompts was written and tuned against, and adding "write in English" to a
 * prompt that already produces English is a change with no upside and a
 * cache-prefix cost for every existing brand.
 */
export function languageDirective(language: Locale): string {
  if (language === "en") return "";
  return `

OUTPUT LANGUAGE. This overrides any language you infer from the sources below.
Write every word of the output in ${LANGUAGE_NAME[language]}. The brand's own
material may be in English; that is the material, not the instruction. Field
names and JSON keys stay exactly as specified in English. Only the values a
person reads are translated.`;
}

/**
 * The shape this needs from a supabase client, so a route can pass its own.
 *
 * Deliberately loose. supabase-js's builder is generic over the schema and
 * typing this precisely made tsc give up with "type instantiation is
 * excessively deep"; the alternative was two routes each doing their own read,
 * which is the drift this file exists to prevent. The result is narrowed
 * below rather than trusted.
 */
export interface BrandReader {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): PromiseLike<{ data: unknown }>;
      };
    };
  };
}

/**
 * Read the brand's output language.
 *
 * Defaults to English on every failure path, and the column not existing is
 * one of them: supabase/brand-language.sql is written and not run, so today
 * this always returns "en" and every route behaves exactly as it did. It does
 * not throw and it does not log — a brand's language is not worth failing a
 * generation over.
 */
export async function outputLanguageFor(
  client: BrandReader,
  brandId: string | null | undefined,
): Promise<Locale> {
  if (!brandId || brandId === "default") return "en";
  try {
    const { data } = await client.from("brands").select("output_language").eq("brand_id", brandId).maybeSingle();
    const row = data as { output_language?: unknown } | null;
    return toLocale(row?.output_language);
  } catch {
    return "en";
  }
}
