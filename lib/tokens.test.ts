/**
 * Run with: npm test
 *
 * A Tailwind colour class naming a token that does not exist renders NOTHING.
 * No build error, no console warning — the text is just the inherited colour
 * and the button has no background. `text-danger` was in three files against
 * a token that was never defined, and it took reading tailwind.config.ts to
 * notice.
 *
 * CLAUDE.md: the v6 block is the single source of truth and new hex values do
 * not get introduced outside it. This is the other half of that rule — the
 * classes have to name something that is actually in it.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";

function sourceFiles(roots: string[]): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e) && !/\.test\.ts$/.test(e)) out.push(p);
    }
  };
  roots.forEach(walk);
  return out;
}

/**
 * The colour names the config defines, read from the config rather than
 * listed here — a list would go stale the first time one is added.
 *
 * Parsed, not imported: tailwind.config.ts imports a type from "tailwindcss",
 * which the native TypeScript runner does not resolve.
 */
function definedColours(): Set<string> {
  const src = readFileSync("tailwind.config.ts", "utf8");
  const block = src.slice(src.indexOf("colors: {") + "colors: {".length, src.indexOf("backgroundImage:"));

  // Depth-aware, because the config puts several colours on one line —
  // `dark: "#1a1c1e", mid: "#44474e", subtle: "#e1bfb6",` — and a
  // line-anchored regex sees only the first. It reported `text-mid` as
  // undefined across six files, which is how this parser got written.
  const names = new Set<string>();
  let depth = 0;
  let parent = "";
  const KEY = /["']?([A-Za-z0-9][A-Za-z0-9-]*)["']?\s*:/y;
  for (let i = 0; i < block.length; i++) {
    const c = block[i];
    if (c === "{") { depth++; continue; }
    if (c === "}") { depth--; if (depth === 0) parent = ""; continue; }
    if (c === "/" && block[i + 1] === "/") { i = block.indexOf("\n", i); if (i === -1) break; continue; }
    if (depth > 1) continue;
    if (!/[A-Za-z0-9"']/.test(c)) continue;
    // Only at the start of a token, not mid-word.
    if (i > 0 && /[A-Za-z0-9_-]/.test(block[i - 1])) continue;
    KEY.lastIndex = i;
    const m = KEY.exec(block);
    if (!m) continue;
    const after = block.slice(KEY.lastIndex).match(/^\s*(\{)?/);
    if (depth === 0) {
      parent = m[1];
      names.add(parent);
    } else if (parent && m[1] !== "DEFAULT") {
      names.add(`${parent}-${m[1]}`);
    }
    if (!after?.[1]) i = KEY.lastIndex - 1;
  }
  return names;
}

/**
 * `text-` is also the font-size prefix, so `text-page-title` reads as the
 * colour `page` with an unknown suffix. These come from the config too.
 */
function definedFontSizes(): Set<string> {
  const src = readFileSync("tailwind.config.ts", "utf8");
  const at = src.indexOf("fontSize:");
  if (at === -1) return new Set();
  const block = src.slice(at, src.indexOf("\n      },", at));
  return new Set([...block.matchAll(/^\s{6,10}"?([a-z][a-z0-9-]*)"?:/gim)].map((m) => m[1]));
}

/** Tailwind's keywords, which take no scale. */
const KEYWORDS = new Set(["white", "black", "transparent", "current", "inherit"]);

/** Tailwind's own colour families, each with a 50..950 scale. */
const BUILT_IN_FAMILIES = [
  "slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber", "yellow",
  "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet",
  "purple", "fuchsia", "pink", "rose",
];

/** Tailwind's own font sizes. `extend` keeps the ones the config does not name. */
const BUILT_IN_SIZES = new Set([
  "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl",
]);

describe("every colour class names a colour that exists", () => {
  const colours = definedColours();
  const fontSizes = definedFontSizes();

  it("read the config at all", () => {
    // If the parse breaks, everything below passes vacuously.
    for (const known of ["ink", "accent", "muted", "page", "danger", "danger-wash", "tint-1"]) {
      assert.ok(colours.has(known), `the parse missed ${known}`);
    }
    assert.ok(colours.size > 40, `only ${colours.size} colours parsed`);
    for (const size of ["micro", "display", "h2", "h3", "label-sm"]) {
      assert.ok(fontSizes.has(size), `the font-size parse missed ${size}`);
    }
  });

  /**
   * A family the config redefines as a single colour loses its scale
   * entirely. `amber: "#b8791a"` in the v6 block is why `bg-amber-50`
   * renders nothing — and why this is computed rather than listed.
   */
  const usableFamily = (root: string) =>
    BUILT_IN_FAMILIES.includes(root) && !colours.has(root);

  it("no `text-` class names a size or colour that does not exist", () => {
    // `text-` is the busiest prefix in Tailwind: colour, font size,
    // alignment, wrapping, overflow. Anything that is none of those is
    // invisible. `text-page-title` and `text-section` were both on the
    // Settings page against a scale that has neither.
    const TEXT_UTILITIES = new Set([
      "left", "center", "right", "justify", "start", "end",
      "wrap", "nowrap", "balance", "pretty", "clip", "ellipsis",
      "opacity", "shadow",
    ]);
    const bad: string[] = [];
    for (const f of sourceFiles(["app", "components", "lib"])) {
      for (const m of readFileSync(f, "utf8").matchAll(/\btext-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)(?:\/\d+)?\b/g)) {
        const name = m[1];
        if (/^\[/.test(name)) continue;
        const root = name.split("-")[0];
        if (colours.has(name) || fontSizes.has(name)) continue;
        if (KEYWORDS.has(name) || BUILT_IN_SIZES.has(name)) continue;
        if (usableFamily(root) && /^\d+$/.test(name.slice(root.length + 1))) continue;
        if (TEXT_UTILITIES.has(root)) continue;
        bad.push(`${f}: ${m[0]}`);
      }
    }
    assert.deepEqual(bad, [], "text- classes that resolve to nothing");
  });

  it("no file uses an undefined one", () => {
    const bad: string[] = [];
    for (const f of sourceFiles(["app", "components", "lib"])) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/\b(?:text|bg|border|ring|fill|stroke|from|via|to|divide|outline|decoration|accent|caret|shadow)-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)(?:\/\d+)?\b/g)) {
        const name = m[1];
        // Arbitrary values, numeric scales and non-colour utilities.
        const root = name.split("-")[0];
        if (/^\[/.test(name) || /^\d/.test(name)) continue;
        if (KEYWORDS.has(name)) continue;
        if (colours.has(name) || fontSizes.has(name)) continue;
        if (usableFamily(root) && /^\d+$/.test(name.slice(root.length + 1))) continue;
        // text-sm, bg-grad-mark, border-t and the rest of Tailwind's own
        // vocabulary share the prefix. Only flag a name the config nearly
        // has — a root that is a real colour with an unknown suffix.
        if (colours.has(root) && !colours.has(name)) bad.push(`${f}: ${m[0]}`);
      }
    }
    assert.deepEqual(bad, [], "colour classes naming a token that does not exist render nothing");
  });
});

// ────────────────────────────────────────── inbox 7a: the violet is a token ──

describe("the violet is named, not copied by hand", () => {
  const tokens = readFileSync("branditect-ui/design/tokens.css", "utf8");
  const config = readFileSync("tailwind.config.ts", "utf8");

  it("is in tokens.css, beside the pale end of its own family", () => {
    // --lavender was already a token; the anchor and the light end were not,
    // which is how the same hex reached four files by hand.
    for (const decl of ["--violet:", "--violet-2:", "--violet-ink:"]) {
      assert.ok(tokens.includes(decl), `tokens.css has no ${decl}`);
    }
    assert.ok(tokens.indexOf("--lavender") < tokens.indexOf("--violet:"),
      "the violet block should sit with lavender, not somewhere else");
  });

  it("and in the config, in the same shape as lavender", () => {
    assert.match(config, /violet: \{ DEFAULT: "#6b53ac", 2: "#9b83d8", ink: "#4a3d73" \}/);
    assert.match(config, /"grad-violet"/);
    assert.match(config, /"grad-hero-settings"/);
  });

  it("the two files agree on every violet value", () => {
    // Two sources for one colour is the state this whole entry is about.
    for (const hex of ["#6b53ac", "#9b83d8", "#4a3d73"]) {
      assert.ok(tokens.includes(hex), `tokens.css is missing ${hex}`);
      assert.ok(config.includes(hex), `tailwind.config.ts is missing ${hex}`);
    }
  });

  it("drops the midpoint, which was a gradient stop and not a colour", () => {
    // "accent to violet interpolates it on its own."
    const code = (f: string) =>
      readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    for (const f of ["tailwind.config.ts", "branditect-ui/design/tokens.css",
                     "components/settings/settings-hero.tsx"]) {
      assert.ok(!code(f).includes("#8a5fb0"), `${f} still carries the midpoint`);
    }
    assert.match(config, /"grad-hero-settings": "linear-gradient\(118deg, #f0562a 0%, #6b53ac 100%\)"/);
  });

  it("the Settings page is on the tokens, not on lavender stand-ins", () => {
    const page = readFileSync("app/(app)/settings/page.tsx", "utf8");
    assert.match(page, /bg-grad-hero-settings|<SettingsHero/);
    assert.match(page, /bg-grad-violet/, "the Language tile is not on the violet gradient");
    assert.match(readFileSync("components/settings/settings-hero.tsx", "utf8"), /bg-grad-hero-settings/);
  });

  it("for-you and for-customers are two different hues, at the same weight", () => {
    // The argument the screen exists to make. Lavender against white was too
    // faint to read as a deliberate second voice, which is why 7a asked for
    // the anchor rather than the pale end.
    const src = readFileSync("components/settings/language-panel.tsx", "utf8");
    const forYou = src.slice(src.indexOf("settings.forYou") - 400, src.indexOf("settings.forYou"));
    const forThem = src.slice(src.indexOf("settings.forCustomers") - 400, src.indexOf("settings.forCustomers"));
    assert.match(forYou, /text-violet\b/);
    assert.match(forYou, /border-violet-2/);
    assert.match(forThem, /text-accent-dark/);
    assert.match(forThem, /border-accent-line/);
    assert.ok(!/text-lav-ink/.test(src), "still on the faint stand-in");
  });

  it("nothing in the app writes the violet as raw hex any more", () => {
    // CSS modules are out of scope — they carry their own variables and are
    // not Tailwind — but no .tsx should be pasting the hex now it has a name.
    const offenders: string[] = [];
    for (const f of sourceFiles(["app", "components"])) {
      if (!f.endsWith(".tsx")) continue;
      const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      if (/#6b53ac|#9b83d8/i.test(src)) offenders.push(f);
    }
    assert.deepEqual(offenders, [],
      "a .tsx is pasting the violet hex — use `violet` or `bg-grad-violet`");
  });
});
