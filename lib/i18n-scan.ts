/**
 * Find user-facing English still hard-coded in a component.
 *
 * Criterion 1 of the extraction half of inbox entry 3. The rule it enforces:
 * no user-facing literal remains in the app shell, only `t()` calls.
 *
 * WHAT THIS IS AND IS NOT. It is a text scanner, not a parser. A real JSX
 * parse would be more accurate and would mean a build dependency for one
 * check; the shapes below cover what a component actually contains, and the
 * ignore list carries the rest with a reason each. Where it is wrong it is
 * wrong loudly — a false positive fails the suite and gets looked at, which is
 * the right direction for a check to fail in.
 *
 * The scanner and the test share this file so they cannot disagree about what
 * counts. scripts/i18n-scan.mjs prints; lib/i18n-coverage.test.ts asserts.
 */

export interface Literal {
  /** 1-indexed line in the source file. */
  line: number;
  /** What was found, trimmed. */
  text: string;
  /** "jsx" for element text, or the attribute name. */
  where: string;
}

/** Attributes a person reads. `alt` included: a screen reader is a person. */
export const TRANSLATABLE_ATTRIBUTES = ["placeholder", "aria-label", "title", "alt"];

/** Strip comments and import lines so their prose is not mistaken for copy. */
export function stripNonCopy(src: string): string {
  return src
    // Block comments, kept line-for-line so line numbers survive.
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, p1) => p1 + " ".repeat(Math.max(0, m.length - p1.length)))
    .replace(/^\s*import[\s\S]*?from\s+["'][^"']+["'];?[^\n]*$/gm, (m) => m.replace(/[^\n]/g, " "));
}

/**
 * True when a run of text is something a person reads rather than a class
 * name, a key, a number or a symbol.
 */
export function looksLikeCopy(text: string): boolean {
  const t = text.trim();
  if (t.length < 2) return false;
  // Needs at least one run of two letters. "→", "·", "3", "1.2" are not copy.
  if (!/[A-Za-z]{2}/.test(t)) return false;
  // A lone token with no space and no capital is usually a class or a value.
  if (!/\s/.test(t) && !/^[A-Z]/.test(t)) return false;
  return true;
}

/**
 * Every literal in one file.
 *
 * Two passes. The first blanks out every `{...}` expression, because that is
 * where `t("key")` and every other code path lives — what remains between the
 * tags is literal text by definition. The second reads the attributes, which
 * are literal only when they are quoted rather than braced.
 */
export function findLiterals(src: string): Literal[] {
  const stripped = stripNonCopy(src);
  const out: Literal[] = [];

  const lineAt = (index: number) => stripped.slice(0, index).split("\n").length;

  // ── attributes ──────────────────────────────────────────────────────────
  for (const attr of TRANSLATABLE_ATTRIBUTES) {
    const re = new RegExp(`\\b${attr}\\s*=\\s*"([^"]*)"`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(stripped)) !== null) {
      if (looksLikeCopy(m[1])) out.push({ line: lineAt(m.index), text: m[1].trim(), where: attr });
    }
  }

  // ── element text ────────────────────────────────────────────────────────
  //
  // Anything between a ">" and the next "<" that carries no brace.
  //
  // An earlier version blanked every {…} expression first, innermost outwards,
  // so that only literal text was left. That deleted the component body — a
  // function body IS a braced expression — and a one-line component vanished
  // whole. A negative control found it: putting "Pro plan" back between the
  // tags of an extracted file left the suite green. Rejecting captures that
  // contain a brace does the same job without eating the file, because
  // {t("x")} between tags contains braces and bare copy does not.
  const re = />([^<>]+)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    const raw = m[1];
    // A ">" preceded by "=" is an arrow, not a closing tag, and what follows
    // it is a return type: `onSignOut: () => Promise<void>`.
    if (stripped[m.index - 1] === "=") continue;
    // Braces mean an expression — {t("x")} — and the punctuation below means
    // this is code between a generic and a comparison, not text in an element.
    if (/[{}();=]/.test(raw)) continue;
    if (!looksLikeCopy(raw)) continue;
    out.push({ line: lineAt(m.index), text: raw.trim().replace(/\s+/g, " "), where: "jsx" });
  }

  return out.sort((a, b) => a.line - b.line);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * The wider scan: literals anywhere in the file, not only between tags.
 *
 * The first scanner above blanks every `{...}` expression before looking, which
 * is right for finding text between tags and wrong for everything else — and
 * "everything else" turned out to be most of the interface. Measured on
 * 2026-09-10: the between-tags scan found 207 strings; this one finds 1,609.
 * A check that reported 207 as "all of it" would have been the lying kind.
 *
 * So this one looks at every string literal and filters by what CANNOT be
 * copy, rather than by where it sits. The filters are shapes, each with a
 * reason, and they are deliberately conservative: a technical string wrongly
 * reported is a minute of reading, a real string wrongly skipped is an English
 * word on a Finnish screen that nobody sees again.
 * ────────────────────────────────────────────────────────────────────────── */

/** Attribute and call positions whose value is never read by a person. */
const NON_COPY_CONTEXT =
  /\b(className|class|href|src|id|key|type|name|htmlFor|role|style|variant|icon|rel|target|method|encType|autoComplete|inputMode|accept|as|slot|form|ref|locale|data-[\w-]+)\s*=\s*$/;

const NON_COPY_CALL = /\.(from|select|eq|order|match|includes|startsWith|endsWith|getItem|setItem|removeItem)\($|console\.\w+\($|require\($|import\($|new RegExp\($/;

/** Shapes that are configuration, protocol or data, never interface copy. */
export const TECHNICAL_SHAPES: [RegExp, string][] = [
  [/^use (client|server|strict)$/, "a directive prologue"],
  [/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/, "an HTTP verb"],
  [/^[a-z-]+\/[a-z0-9.+-]+$/i, "a MIME type or a path"],
  [/^[A-Za-z-]+-[A-Za-z-]+$/, "a header name or a kebab token"],
  [/^[a-z_]+(,\s*[a-z_]+)+$/, "a column list"],
  [/^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$/, "a dotted identifier"],
  [/^\d/, "starts with a digit"],
  [/^[a-z][a-z0-9_]*$/, "a lowercase identifier"],
  [/^(true|false|null|undefined)$/, "a literal value"],
];

/**
 * A Tailwind class list. These reach here because they live inside a ternary
 * — `className={active ? "bg-tint-1 text-accent" : "text-ink-2"}` — so the
 * attribute name is nowhere near the string and the context check cannot see
 * it. Recognised by shape instead: every token is a CSS-class-shaped word and
 * at least one carries a Tailwind separator.
 */
export function isClassList(text: string): boolean {
  const tokens = text.trim().split(/\s+/);
  if (!tokens.every((w) => /^[a-z0-9:[\]/._!-]+$/.test(w))) return false;
  const TAILWIND = /^(bg|text|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr|rounded|flex|grid|gap|w|h|min|max|border|shadow|drop|font|leading|tracking|opacity|z|top|left|right|bottom|absolute|relative|hover|focus|items|justify|overflow|space|inline|block|hidden|sr)[-:]/;
  return tokens.some((w) => /:/.test(w) || TAILWIND.test(w));
}

/** SVG path data: a command letter followed by coordinates. */
export function isPathData(text: string): boolean {
  return /^[MmLlHhVvCcSsQqTtAaZz][\s\d.,-]/.test(text.trim());
}

/**
 * DOM key names, which read like copy — "Home", "End", "Enter" — and are not.
 * Only treated as technical when the string is being compared, never when it
 * is being rendered.
 */
const KEY_NAMES = new Set([
  "Escape", "Enter", "Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "Home", "End", "PageUp", "PageDown", "Backspace", "Delete", "Space",
]);
const COMPARISON = /[=!]==?\s*$|case\s+$/;

export function isTechnical(text: string): string | null {
  const t = text.trim();
  for (const [rx, why] of TECHNICAL_SHAPES) if (rx.test(t)) return why;
  if (isPathData(t)) return "SVG path data";
  if (isClassList(t)) return "a class list";
  return null;
}

/**
 * Every string literal in a file that could be read by a person.
 *
 * Reports what the between-tags scan cannot see: labels passed as props,
 * strings inside ternaries, option lists, toast messages, and the arrays of
 * copy that several screens are built from.
 */
export function findAllLiterals(src: string): Literal[] {
  const stripped = stripNonCopy(src);

  /**
   * Start from the between-tags scan, not instead of it.
   *
   * A negative control caught this: replacing `{t("sidebar.pro")}` with a bare
   * `Pro plan` between the tags left the suite green, because bare JSX text is
   * not a quoted string and this function only looked at quoted strings. The
   * two detectors see different things and neither is a superset of the other,
   * so the answer is both.
   */
  const out: Literal[] = findLiterals(src).filter((l) => !isTechnical(l.text));
  const seen = new Set(out.map((l) => l.line + "|" + l.text));
  const re = /(["'])((?:\\.|(?!\1)[^\\])*)\1/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    const text = m[2];
    if (!looksLikeCopy(text)) continue;
    if (isTechnical(text)) continue;
    const before = stripped.slice(Math.max(0, m.index - 40), m.index);
    if (NON_COPY_CONTEXT.test(before) || NON_COPY_CALL.test(before)) continue;
    if (KEY_NAMES.has(text.trim()) && COMPARISON.test(before)) continue;
    const line = stripped.slice(0, m.index).split("\n").length;
    const clean = text.trim().replace(/\s+/g, " ");
    if (seen.has(line + "|" + clean)) continue;
    seen.add(line + "|" + clean);
    out.push({ line, text: clean, where: "literal" });
  }
  return out.sort((a, b) => a.line - b.line);
}
