/**
 * Typing an amount, in a country that writes 0,2.
 *
 * "One can add 0,2 or zero point something — now it only works for full euros."
 * Three separate faults produced that:
 *
 *   1. The product drawer rendered every money field from the PARSED number
 *      rather than from what was typed. "0," parses to 0, which re-rendered as
 *      "0", so the separator was deleted under the cursor and the next digit
 *      landed against the zero: 0,2 became 2.
 *   2. The custom pricing lines did the same, one Number() per keystroke.
 *   3. The add-product form used parseFloat, which reads "0,2" as 0 — a comma
 *      did not fail, it silently lost everything after it.
 *
 * So parsing and display are separated here: `cleanMoneyText` is what a field
 * shows while it is being typed, and `parseMoney` is what the maths and the
 * database get.
 */

/** Both separators, a minus, and nothing else. Never reformats as you type. */
export function cleanMoneyText(input: string): string {
  const kept = input.replace(/[^\d.,-]/g, "");
  // One leading minus, one separator: "1.2.3" and "--5" are not amounts, and
  // silently dropping the extra is kinder than refusing the keystroke.
  const negative = kept.startsWith("-");
  const digitsAndSeparators = kept.replace(/-/g, "");
  const firstSeparator = digitsAndSeparators.search(/[.,]/);
  const cleaned = firstSeparator === -1
    ? digitsAndSeparators
    : digitsAndSeparators.slice(0, firstSeparator + 1) +
      digitsAndSeparators.slice(firstSeparator + 1).replace(/[.,]/g, "");
  return (negative ? "-" : "") + cleaned;
}

/**
 * What the maths gets. Blank is null — "not recorded" — never 0: a product
 * with no cost recorded is not a product that costs nothing.
 */
export function parseMoney(input: string | number | null | undefined): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (input == null) return null;
  // Thin and non-breaking spaces arrive from pasted spreadsheets.
  const text = String(input).replace(/[\s  ]/g, "").replace(",", ".");
  if (text === "" || text === "-" || text === "." || text === "-.") return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

/** What a stored number looks like in a field the person is about to edit. */
export function moneyText(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "" : String(value);
}
