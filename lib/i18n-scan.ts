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

/**
 * HTML entities as a person reads them. The work list is translated from, so
 * `It&rsquo;s` has to arrive as `It’s` or the entity gets copied into the
 * Finnish.
 */
const ENTITIES: Record<string, string> = {
  "&rsquo;": "\u2019", "&lsquo;": "\u2018", "&rdquo;": "\u201d", "&ldquo;": "\u201c",
  "&nbsp;": " ", "&amp;": "&", "&apos;": "'", "&quot;": '"', "&hellip;": "\u2026",
};
export function decodeEntities(text: string): string {
  return text.replace(/&[a-z]+;/g, (e) => ENTITIES[e] ?? e);
}

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
  //
  // `{" "}` is not an expression, it is a space. JSX needs it to keep the gap
  // before an inline tag, so it sits at the end of a sentence that runs into
  // <b> or <a>, and the brace rule below threw the whole paragraph away. That
  // hid the landing hero lede, the longest paragraph on the site. Found by
  // reading the page against the gap list, inbox 7b.
  const text = stripped.replace(/\{\s*(["'])\s*\1\s*\}/g, (m) => " ".repeat(m.length));
  const re = />([^<>]+)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = decodeEntities(m[1]);
    // A ">" preceded by "=" is an arrow, not a closing tag, and what follows
    // it is a return type: `onSignOut: () => Promise<void>`.
    if (text[m.index - 1] === "=") continue;
    // A unit suffix between tags, `<span>/month</span>`, is copy even though
    // it is one lowercase token: Finnish writes it "/kk". Between tags it is
    // never a path, which is what the lowercase rule below exists to skip.
    if (/^\s*\/[a-z]{2,}\s*$/.test(raw)) {
      out.push({ line: lineAt(m.index), text: raw.trim(), where: "jsx" });
      continue;
    }
    // A sentence with a value in it: `You're {onboarding.answered} of
    // {questionTotal()} into your strategy.` The brace rule below threw these
    // away whole, so they reached no work list while rendering English on
    // Home. A brace group that is only a name, a property path or a call with
    // no arguments becomes a `{name}` placeholder; anything more is code.
    const SIMPLE = /\{\s*([A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*)*)(\(\))?\s*\}/g;
    if (/[{}]/.test(raw)) {
      const bare = raw.replace(SIMPLE, " ");
      if (!/[{}();=]/.test(bare) && /[A-Za-z]{2,}\W*\s+\W*[A-Za-z]{2,}/.test(bare) && !isTechnical(bare.trim())) {
        const withNames = raw.replace(SIMPLE, (_w, path: string) => `{${path.split(/\??\./).pop()}}`);
        out.push({ line: lineAt(m.index), text: withNames.trim().replace(/\s+/g, " "), where: "jsx" });
      }
      continue;
    }
    // Braces mean an expression — {t("x")} — and the punctuation below means
    // this is code between a generic and a comparison, not text in an element.
    if (/[();=]/.test(raw)) continue;
    if (!looksLikeCopy(raw)) continue;
    if (isTechnical(raw)) continue;
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
  // Not "starts with a digit": "124 of 6 required" is real sublabel copy and
  // CLAUDE.md names it as the shape sublabels must have. Only a string that is
  // NOTHING but a number is configuration.
  [/^[\d.,:%\s+x-]+$/, "a number"],
  [/^[a-z][a-z0-9_]*$/, "a lowercase identifier"],
  [/^(true|false|null|undefined)$/, "a literal value"],
  // Scanner catch named in batch A, 2026-09-14: not copy, and never keyed.
  // A font stack, `'DM Sans', sans-serif`, ends in a generic family.
  [/(^|,)\s*(sans-serif|serif|monospace|system-ui|cursive)\s*$/, "a font stack"],
  // A CSS transition, `background 0.15s` or `opacity .2s ease`.
  [/^[a-z-]+\s+[\d.]+m?s(\s+[a-z-]+)?(\s*,\s*[a-z-]+\s+[\d.]+m?s(\s+[a-z-]+)?)*$/, "a CSS transition"],
  // An ISO currency code is data for Intl, not a word a translator changes.
  [/^(EUR|USD|GBP|SEK|NOK|DKK)$/, "a currency code"],
  // `padding: "0 auto 34px"` in a style object: lengths and auto, nothing else.
  [/^(-?[\d.]+(px|rem|em|%|vh|vw)?|auto)(\s+(-?[\d.]+(px|rem|em|%|vh|vw)?|auto))+$/, "a CSS length list"],
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
  // Arbitrary values are part of a class: bg-[#FFF2EE], drop-shadow-[0_5px_10px_rgba(232,73,32,.3)],
  // border-outline-variant/15. The charset has to allow them or half the class
  // lists in this codebase read as copy.
  if (!tokens.every((w) => /^[A-Za-z0-9:[\]#()/,._%!-]+$/.test(w))) return false;
  const TAILWIND = /^(bg|text|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr|rounded|flex|grid|gap|w|h|min|max|border|shadow|drop|font|leading|tracking|opacity|z|top|left|right|bottom|absolute|relative|hover|focus|items|justify|overflow|space|inline|block|hidden|sr)[-:]/;
  // Two conditions, and the second is what stops a sentence being read as a
  // class list. "One check left: upload your brand guideline." passes the
  // charset and has a colon in it; what it does not have is most of its words
  // carrying a class separator.
  if (!tokens.some((w) => TAILWIND.test(w))) return false;
  const classy = tokens.filter((w) => /[-:[\/]/.test(w)).length;
  return classy * 2 >= tokens.length;
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

/**
 * Source code that reached the list by accident.
 *
 * Inbox entry 4a: 375 of the 1,276 entries in i18n-gap.md were raw JSX —
 * `); if (opt.value !==`, `: isActive ?`, whole runs of `className=`. That
 * file is a work list, and left as it was it invited 375 keys whose English is
 * a fragment of a JavaScript expression. A dictionary containing those is
 * worse than one with gaps, because the gaps at least look like gaps.
 *
 * THE CAUSE, which is worth naming because it is not obvious. The literal
 * scanner pairs quotes left to right. One apostrophe in ordinary JSX text —
 * "you don't have to ask anyone" — pairs with the next apostrophe further down
 * the file, and every quote after it is off by one. From then on the "strings"
 * it finds are the code BETWEEN two real strings.
 *
 * Both halves are fixed: an apostrophe only opens a string where a string can
 * actually start (after = ( , : [ or whitespace), and anything still carrying
 * the marks of source code is rejected here.
 */
export function isSourceFragment(text: string): boolean {
  // `{name}` is a placeholder, the shape the template pass reports a value in
  // and the shape a dictionary string carries one in. Not a brace of code.
  const t = text.trim().replace(/\{[A-Za-z_]\w*\}/g, "x");
  if (/[<>{}]/.test(t)) return true;                 // a tag, or a brace-stripped body
  if (/=>|===|!==|\?\?|&&|\|\|/.test(t)) return true;    // operators
  if (/\b(className|onClick|onChange|useState|const|return|import|export|function)\b/.test(t)) return true;
  if (/^[).;,:?[\]]/.test(t)) return true;            // starts mid-expression
  if (/[);]\s*$/.test(t)) return true;               // ends mid-expression
  return false;
}

export function isTechnical(text: string): string | null {
  const t = text.trim();
  for (const [rx, why] of TECHNICAL_SHAPES) if (rx.test(t)) return why;
  if (isPathData(t)) return "SVG path data";
  if (isClassList(t)) return "a class list";
  if (isSourceFragment(t)) return "source code, not copy";
  return null;
}

/**
 * Every string literal in a file that could be read by a person.
 *
 * Reports what the between-tags scan cannot see: labels passed as props,
 * strings inside ternaries, option lists, toast messages, and the arrays of
 * copy that several screens are built from.
 */
/**
 * A readable name for an interpolated value: the last identifier that is not
 * a method or a helper. `${plan.yearlyTotal}` is {yearlyTotal},
 * `${ltv.toFixed(1)}` is {ltv}, `${files.length}` is {files}. A translator
 * reads these, so `{1}` or `{toFixed}` would be worse than useless.
 */
const NOT_A_NAME = new Set(["toFixed", "toString", "toLocaleString", "join", "trim", "map", "length",
  "toUpperCase", "toLowerCase", "round", "floor", "ceil", "Math", "String", "Number", "slice"]);
function placeholderName(expr: string): string {
  const ids = (expr.match(/[A-Za-z_]\w*/g) ?? []).filter((w) => !NOT_A_NAME.has(w));
  return ids.length ? ids[ids.length - 1] : "value";
}

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
  // The apostrophe is the whole problem: in `don't` it is not a delimiter, and
  // treating it as one shifts every quote after it by one. So it only opens a
  // string where a string can start.
  const re = /(?:(")((?:\\.|[^"\\])*)"|(?:^|[=(,:[\s])(')((?:\\.|[^'\\])*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    // \' inside a single-quoted string is an apostrophe, not a backslash. Left
    // as it was, the work list carried "you\\'re" and a translator would have
    // copied the backslash into the Finnish.
    const text = (m[2] ?? m[4] ?? "").replace(/\\(['"`])/g, "$1");
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

  /**
   * Template literals. Neither pass above opens a backtick, so a sentence with
   * a value in it was invisible: "Incl. VAT, billed ${plan.yearlyTotal} yearly"
   * sat on the pricing page and on no list. Each `${…}` is reported as a named
   * placeholder, `{yearlyTotal}`, which is the shape the key has to take.
   */
  const tpl = /`((?:\\.|[^`\\])*)`/g;
  while ((m = tpl.exec(stripped)) !== null) {
    const body = m[1];
    const bare = body.replace(/\$\{[^}]*\}/g, " ").trim();
    // Copy is words with spaces between them. A class list, a path or a URL
    // with one interpolation in it is not.
    if (!/[A-Za-z]{2,}[.,:;!?]?\s+[A-Za-z]{2,}/.test(bare)) continue;
    if (isTechnical(bare) || /^[\s./:?#&=-]*$/.test(bare) || /https?:|\/\//.test(body)) continue;
    // A font stack with a family interpolated: `"${g}", system-ui, sans-serif`.
    if (/\b(sans-serif|serif|monospace|system-ui)\b/.test(bare)) continue;
    // A CSS value with a colour interpolated: `1px solid ${bd}`.
    if (/^[\d.]+(px|rem|em)\s+(solid|dashed|dotted|double)\s*$/.test(bare)) continue;
    const before = stripped.slice(Math.max(0, m.index - 40), m.index);
    if (NON_COPY_CONTEXT.test(before) || NON_COPY_CALL.test(before)) continue;
    const clean = body
      .replace(/\$\{([^}]*)\}/g, (_w, expr: string) => `{${placeholderName(expr)}}`)
      .replace(/\\u([0-9a-fA-F]{4})/g, (_w, hex: string) => String.fromCharCode(parseInt(hex, 16)))
      .trim().replace(/\s+/g, " ");
    const line = stripped.slice(0, m.index).split("\n").length;
    if (seen.has(line + "|" + clean)) continue;
    seen.add(line + "|" + clean);
    out.push({ line, text: clean, where: "template" });
  }
  return out.sort((a, b) => a.line - b.line);
}
