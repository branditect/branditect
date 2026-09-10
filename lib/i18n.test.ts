/** Run with: npm test — inbox entry 3 of branditect-ui/spec/inbox.md */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { en, type StringKey } from "./i18n/en.ts";
import { fi } from "./i18n/fi.ts";
import {
  translate, interpolate, toLocale, isLocale, placeholdersIn,
  LOCALES, DEFAULT_LOCALE, LOCALE_NAME,
} from "./i18n/index.ts";
import { findAllLiterals, isTechnical, isClassList, isPathData, isSourceFragment, looksLikeCopy } from "./i18n-scan.ts";
import { SCOPE, OUT_OF_SCOPE, IGNORE, EXTRACTED, OUTSTANDING } from "./i18n-scope.ts";
import { forLocale, sectionTitleFor, allForLocale } from "./onboarding-locale.ts";
import { QUESTIONS_FI } from "./onboarding-questions.fi.ts";
import { QUESTIONS, type Track } from "./onboarding-questions.ts";
import { validateLine, SUSPENDED_OUTSIDE_ENGLISH } from "./tone-rubric.ts";
import { NAV } from "./nav.ts";

const TRACKS: Track[] = ["physical", "digital", "service"];

// ─────────────────────────────────────────────────────── the two dictionaries ──

describe("en and fi are the same dictionary in two languages", () => {
  it("has the same keys in both, in both directions", () => {
    const e = Object.keys(en).sort(), f = Object.keys(fi).sort();
    assert.deepEqual(f, e);
  });

  it("is not empty, so the comparison above means something", () => {
    assert.ok(Object.keys(en).length > 400, `only ${Object.keys(en).length} keys`);
  });

  it("has no blank string on either side", () => {
    for (const k of Object.keys(en) as StringKey[]) {
      assert.ok(en[k].trim() !== "", `${k} is blank in en`);
      assert.ok(fi[k].trim() !== "", `${k} is blank in fi`);
    }
  });

  it("keeps every placeholder a sentence needs", () => {
    // A translator who drops {count} leaves a sentence with a hole in it, and
    // the hole is invisible until the number matters.
    for (const k of Object.keys(en) as StringKey[]) {
      assert.deepEqual(placeholdersIn(fi[k]).sort(), placeholdersIn(en[k]).sort(),
        `${k}: placeholders differ — en "${en[k]}" / fi "${fi[k]}"`);
    }
  });

  it("keeps the keys flat, so a gap cannot hide three levels down", () => {
    for (const k of Object.keys(en)) {
      assert.match(k, /^[a-zA-Z]+(\.[a-zA-Z0-9]+)+$/, `${k} is not a flat dotted key`);
    }
  });

  it("holds the terminology the design side settled on", () => {
    const settled: [StringKey, string][] = [
      ["nav.knowledge", "Tieto"], ["nav.numbers", "Laskurit"], ["nav.chat", "Chat"],
      ["nav.brand.visual", "Visuaalit"], ["nav.brand.tone", "Äänensävy"],
    ];
    for (const [k, want] of settled) assert.equal(fi[k], want, `${k} should be "${want}"`);
  });
});

describe("translate", () => {
  it("returns the language asked for", () => {
    assert.equal(translate("en", "nav.home"), "Home");
    assert.equal(translate("fi", "nav.home"), "Etusivu");
  });

  it("falls back to English for a language with no dictionary", () => {
    assert.equal(translate("de" as never, "nav.home"), "Home");
  });

  it("fills placeholders and leaves a missing one visible", () => {
    assert.equal(interpolate("{n} of {total}", { n: 3, total: 20 }), "3 of 20");
    assert.equal(interpolate("{n} of {total}", { n: 3 }), "3 of {total}",
      "a blank gap reads as a copy mistake; {total} reads as a bug and gets fixed");
  });

  it("treats anything unrecognised as English", () => {
    for (const v of [null, undefined, "", "sv", 7, {}]) assert.equal(toLocale(v), DEFAULT_LOCALE);
    assert.equal(toLocale("fi"), "fi");
    assert.ok(isLocale("fi") && !isLocale("fi-FI"));
  });

  it("names every locale it offers", () => {
    for (const l of LOCALES) assert.ok(LOCALE_NAME[l], `${l} has no name for the switch`);
  });
});

// ────────────────────────────────────────── onboarding: criteria 1, 2 and 3 ──

describe("onboarding in Finnish", () => {
  /** CRITERION 1: all 20 questions, helper lines and examples, on all three tracks. */
  for (const track of TRACKS) {
    it(`${track}: nothing falls back to English`, () => {
      const qs = allForLocale(track, "fi");
      assert.equal(qs.length, 20);
      const fellBack = qs.filter((q) => q.partial).map((q) => q.n);
      assert.deepEqual(fellBack, [],
        `questions ${fellBack.join(", ")} still show English on the ${track} track`);
    });

    it(`${track}: the Finnish text is actually different from the English`, () => {
      // The check above reads the overlay. This one reads the output, so an
      // overlay that had been filled with the English strings would fail.
      const fiQs = allForLocale(track, "fi"), enQs = allForLocale(track, "en");
      const same = fiQs.filter((q, i) => q.q === enQs[i].q).map((q) => q.n);
      assert.deepEqual(same, [], `questions ${same.join(", ")} read identically in both languages`);
    });
  }

  it("translates the section headings too", () => {
    assert.equal(sectionTitleFor("why", "fi"), "Miksi olette olemassa");
    assert.equal(sectionTitleFor("why", "en"), "Why you exist");
  });

  /** CRITERION 2: a missing key renders English and does not throw. */
  it("renders English for a question the overlay has not translated", () => {
    // Deleted for real, not reasoned about. Q1 is restored in the finally.
    const saved = QUESTIONS_FI[1];
    try {
      delete (QUESTIONS_FI as Record<number, unknown>)[1];
      const q = forLocale(1, "physical", "fi");
      assert.ok(q, "the question disappeared instead of falling back");
      assert.equal(q!.q, QUESTIONS.find((x) => x.n === 1)!.q as string);
      assert.equal(q!.partial, true, "a fallback must be visible as one");
    } finally {
      (QUESTIONS_FI as Record<number, unknown>)[1] = saved;
    }
    assert.notEqual(forLocale(1, "physical", "fi")!.q, QUESTIONS.find((x) => x.n === 1)!.q);
  });

  it("returns null for a question number that does not exist, rather than throwing", () => {
    assert.equal(forLocale(999, "physical", "fi"), null);
  });

  /** CRITERION 3: the overlay defines no structure. */
  it("the Finnish overlay carries words only", () => {
    for (const [n, entry] of Object.entries(QUESTIONS_FI)) {
      for (const banned of ["n", "section", "kind", "required"]) {
        assert.ok(!(banned in (entry as Record<string, unknown>)),
          `QUESTIONS_FI[${n}] carries "${banned}" — structure belongs to onboarding-questions.ts, ` +
          `and two tables defining it is how the one nobody reads goes wrong`);
      }
    }
  });

  it("the English table is still the one that decides which questions exist", () => {
    const extra = Object.keys(QUESTIONS_FI).map(Number).filter((n) => !QUESTIONS.some((q) => q.n === n));
    assert.deepEqual(extra, [], `the overlay invents questions ${extra.join(", ")}`);
  });
});

// ───────────────────────────────────────────────── the rubric: criterion 4 ──

describe("the voice rubric outside English", () => {
  /**
   * spec/finnish.md is explicit that suspending the WHOLE check is too blunt:
   * roughly half of it is rhetoric and punctuation and holds in any language.
   * So these test the split, not an off switch.
   */
  const tooLong =
    "This particular sentence has been written deliberately at very considerable length so that it runs well past the maximum word count that the confident archetype is prepared to tolerate.";

  it("does not fail a Finnish brand on a rule built for English word counts", () => {
    const v = validateLine(tooLong, "confident", "fi");
    assert.deepEqual(v.problems, [], `still complained: ${v.problems.join(" · ")}`);
  });

  it("fails the same line in English, so the test above is not vacuous", () => {
    assert.ok(!validateLine(tooLong, "confident", "en").ok);
  });

  it("reports every suspended field as suspended, never as passing", () => {
    const v = validateLine(tooLong, "confident", "fi");
    assert.ok(v.ok, "no problems were found");
    assert.equal(v.unchecked.length, Object.keys(SUSPENDED_OUTSIDE_ENGLISH).length);
    for (const field of Object.keys(SUSPENDED_OUTSIDE_ENGLISH)) {
      assert.ok(v.unchecked.some((u) => u.startsWith(`${field}:`)), `${field} is silently skipped`);
    }
    for (const u of v.unchecked) assert.ok(u.length > 40, `"${u}" gives no reason`);
  });

  it("still enforces the rules that survive translation", () => {
    // An em dash is the same giveaway in Finnish, and the spec says so.
    const dash = validateLine("Tilauksesi lähti tänä aamuna — ja se on perillä huomenna.", "confident", "fi");
    assert.ok(dash.problems.some((p) => /em or en dash/.test(p)), "the dash rule was suspended too");
  });

  it("checks everything in English, so nothing is suspended by accident", () => {
    assert.deepEqual(validateLine("Ships today.", "confident", "en").unchecked, []);
  });

  it("defaults to English when no locale is given", () => {
    assert.deepEqual(
      validateLine(tooLong, "confident").problems,
      validateLine(tooLong, "confident", "en").problems);
  });
});

// ───────────────────────────────────────────── the scanner, and what it found ──

describe("the literal scanner knows copy from configuration", () => {
  it("recognises copy", () => {
    for (const s of ["Your plan", "Add a product", "Nothing here yet."]) {
      assert.ok(looksLikeCopy(s) && !isTechnical(s), `${s} should be copy`);
    }
  });

  it("ignores a class list, wherever it sits", () => {
    assert.ok(isClassList("rounded-card bg-white px-4 py-2 text-sm font-semibold"));
    assert.ok(!isClassList("Take what you need"));
  });

  it("ignores SVG path data and directives", () => {
    assert.ok(isPathData("M10 3H5a2 2 0 0 0-2 2v14"));
    assert.ok(isTechnical("use client"));
    assert.ok(isTechnical("POST"));
  });

  it("finds a literal that the between-tags scan cannot see", () => {
    // The first version of this scanner blanked every {…} before looking and
    // reported 207 strings where there are 1,674. This is the shape it missed.
    const src = `export default function X() { return <B label={busy ? "Saving…" : "Save changes"} />; }`;
    const found = findAllLiterals(src).map((l) => l.text);
    assert.ok(found.includes("Save changes"), `found ${JSON.stringify(found)}`);
  });

  it("does not read a comment or an import as copy", () => {
    const src = `import x from "@/components/thing";\n// Add a product here later\n/* Nothing here yet. */\n`;
    assert.deepEqual(findAllLiterals(src), []);
  });
});

function tsxUnder(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (OUT_OF_SCOPE.some((x) => p.startsWith(x))) continue;
    if (statSync(p).isDirectory()) out.push(...tsxUnder(p));
    else if (e.endsWith(".tsx")) out.push(p);
  }
  return out;
}

describe("the extraction, both sides of it", () => {
  const files = SCOPE.flatMap(tsxUnder);
  const literalsIn = (f: string) =>
    findAllLiterals(readFileSync(f, "utf8"))
      .filter((l) => !(IGNORE[f] ?? []).some((rx) => rx.test(l.text)));

  it("is looking at the app at all", () => {
    assert.ok(files.length > 60, `only ${files.length} files in scope`);
  });

  it("leaves the marketing site alone, deliberately", () => {
    assert.ok(!files.some((f) => f.startsWith("app/(site)") || f.startsWith("components/site")),
      "app/(site) is English by Saara's decision and must not be extracted");
  });

  for (const f of EXTRACTED) {
    it(`${f} has no English left in it`, () => {
      const found = literalsIn(f);
      assert.deepEqual(found.map((l) => `${l.line}: ${l.text}`), [],
        `${f} is listed as extracted and still holds literals`);
    });
  }

  it("the outstanding list is exactly the files that still hold English", () => {
    // Both directions. A new English screen is not on the list and fails; a
    // file that has been extracted is still on the list and fails. Neither can
    // drift quietly, which a one-sided check would allow.
    const actual = files.filter((f) => literalsIn(f).length > 0).sort();
    const listed = OUTSTANDING.map(([f]) => f).sort();
    const added = actual.filter((f) => listed.indexOf(f) === -1);
    const done = listed.filter((f) => actual.indexOf(f) === -1);
    assert.deepEqual(added, [],
      `new English in ${added.join(", ")} — extract it, or add it to OUTSTANDING with its count`);
    assert.deepEqual(done, [],
      `${done.join(", ")} no longer holds literals — move it from OUTSTANDING to EXTRACTED`);
  });

  it("no file is on both lists", () => {
    const both = EXTRACTED.filter((f) => OUTSTANDING.some(([o]) => o === f));
    assert.deepEqual(both, []);
  });

  it("says how big the remaining job is rather than rounding it away", () => {
    const total = OUTSTANDING.reduce((n, [, c]) => n + c, 0);
    assert.ok(total > 1000,
      `OUTSTANDING claims only ${total} literals left; if that is real, this assertion should be ` +
      `tightened rather than deleted`);
  });
});

// ───────────────────────────────────────────────────────── the nav, as keys ──

describe("the navigation renders from keys", () => {
  it("gives every item and child a key that exists", () => {
    for (const item of NAV) {
      assert.ok(en[item.key], `${item.label} has no dictionary key`);
      for (const child of item.children ?? []) {
        assert.ok(en[child.key], `${item.label} ▸ ${child.label} has no dictionary key`);
      }
    }
  });

  it("keeps the English label as the item's identity, not as what is rendered", () => {
    // The sidebar keys its open/closed state on `label`. A translated label
    // would make the open menu depend on the interface language.
    const brand = NAV.find((i) => i.label === "Brand");
    assert.ok(brand, "the nav test's own handle on an item is gone");
    assert.equal(en[brand!.key], "Brand");
    assert.equal(fi[brand!.key], "Brändi");
  });
});

// ────────────────────────────── inbox 4a: the work list is a work list ──

describe("source code cannot reach the work list", () => {
  /**
   * The gap file is what the design side translates from. 409 of its 1,276
   * entries were fragments of JavaScript. A dictionary built from those is
   * worse than one with gaps, because a gap at least looks like a gap.
   */
  it("rejects the shapes that got in", () => {
    const fragments = [
      "); if (opt.value !==",
      ": isActive ?",
      "> <div className=",
      "&& ( <div className=",
      "<hr class=\"my-6 border-t border-light\" />",
      "); setScreen(",
      "const [open, setOpen] = useState",
    ];
    for (const f of fragments) {
      assert.ok(isSourceFragment(f), `${JSON.stringify(f)} should be rejected as source`);
      assert.ok(isTechnical(f), `${JSON.stringify(f)} still reaches the list`);
    }
  });

  it("keeps real copy, including the punctuation copy actually has", () => {
    const copy = [
      "Take what you need — you don't have to ask anyone.",
      "One check left: upload your brand guideline.",
      "124 of 6 required",
      "What's the deepest discount I can run?",
      "Profitability, pricing structure and offers.",
    ];
    for (const c of copy) {
      assert.ok(!isSourceFragment(c), `${JSON.stringify(c)} was rejected as source`);
      assert.equal(isTechnical(c), null, `${JSON.stringify(c)} was rejected as technical`);
    }
  });

  it("rejects a class list with arbitrary values in it", () => {
    // bg-[#FFF2EE] and drop-shadow-[0_5px_10px_rgba(...)] are classes. The
    // first charset here allowed neither and they read as copy.
    assert.ok(isClassList("bg-[#FFF2EE] border-[#ec5c36] text-[#ec5c36] font-semibold"));
    assert.ok(isClassList("bg-white border-outline-variant/15 text-dark hover:border-[#ec5c36]/40"));
    assert.ok(!isClassList("Take what you need"));
  });

  /**
   * THE ROOT CAUSE, and it is worth a test of its own because it is invisible.
   * One apostrophe in ordinary JSX text pairs with the next apostrophe further
   * down the file, and every quote after it is off by one — so the "strings"
   * the scanner finds are the code BETWEEN two real strings.
   */
  it("an apostrophe in JSX text does not shift every quote after it", () => {
    const src = [
      'export default function P() {',
      '  return (',
      '    <div>',
      "      <p>you don't have to ask anyone</p>",
      '      <B label="Add a product" />',
      '    </div>',
      '  );',
      '}',
    ].join("\n");
    const found = findAllLiterals(src).map((l) => l.text);
    assert.ok(found.includes("Add a product"),
      `the string after the apostrophe was lost: ${JSON.stringify(found)}`);
    assert.ok(found.some((t) => t.includes("don't")), `the JSX text itself was lost: ${JSON.stringify(found)}`);
    for (const t of found) assert.ok(!isSourceFragment(t), `source leaked: ${JSON.stringify(t)}`);
  });

  it("unescapes a quote rather than handing a translator a backslash", () => {
    const src = `const a = 'Strategy is platform-shaped. No scripts if you\\'re not on TikTok.';`;
    const found = findAllLiterals(src).map((l) => l.text);
    assert.ok(found.some((t) => t.includes("you're")), JSON.stringify(found));
    assert.ok(!found.some((t) => t.includes("\\'")), JSON.stringify(found));
  });

  it("the generated work list carries no source fragment", () => {
    // The file itself, not the function. This is the assertion that would have
    // caught it: 409 entries in the committed list matched this.
    const gap = readFileSync("branditect-ui/spec/i18n-gap.md", "utf8");
    const entries = gap.split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2));
    assert.ok(entries.length > 300, `only ${entries.length} entries — regenerate with npm run i18n:gap`);
    const leaked = entries.filter((e) => isSourceFragment(e) || isClassList(e));
    assert.deepEqual(leaked.slice(0, 8), [],
      `${leaked.length} source fragment(s) in the work list; regenerate it`);
  });
});
