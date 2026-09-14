/** Run with: npm test — branditect-ui/spec/settings.md, phase 1 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normaliseName, normaliseWebsite, normaliseBrandName, COMING_SOON, MAX_NAME } from "./settings.ts";
import { INDUSTRIES, isKnownIndustry } from "./industries.ts";
import { en } from "./i18n/en.ts";
import { fi } from "./i18n/fi.ts";

const read = (f: string) => readFileSync(f, "utf8");
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("what a save does with what was typed", () => {
  it("collapses the whitespace in a name", () => {
    // useUser takes the first word for the greeting, so a leading space made
    // the greeting "Good morning, " with nothing after it.
    assert.equal(normaliseName("  Saara   Keskimäki "), "Saara Keskimäki");
  });

  it("treats a blank name as nothing to save", () => {
    for (const v of ["", "   ", "\n", null, undefined, 42]) assert.equal(normaliseName(v), null);
  });

  it("caps a name rather than storing an essay", () => {
    assert.equal(normaliseName("x".repeat(500))?.length, MAX_NAME);
  });

  it("adds the scheme someone did not type", () => {
    assert.deepEqual(normaliseWebsite("sorbify.fi"), { ok: true, value: "https://sorbify.fi" });
    assert.deepEqual(normaliseWebsite("http://sorbify.fi"), { ok: true, value: "http://sorbify.fi" });
    assert.deepEqual(normaliseWebsite(" https://sorbify.fi/ "), { ok: true, value: "https://sorbify.fi" });
  });

  it("tells an empty field from a bad one", () => {
    // Both returning null would make clearing the website impossible.
    assert.deepEqual(normaliseWebsite(""), { ok: true, value: null });
    assert.deepEqual(normaliseWebsite("   "), { ok: true, value: null });
    assert.deepEqual(normaliseWebsite("sorbify"), { ok: false, reason: "invalid" });
    assert.deepEqual(normaliseWebsite("http://"), { ok: false, reason: "invalid" });
    assert.deepEqual(normaliseWebsite("sorbify."), { ok: false, reason: "invalid" });
  });

  it("keeps a brand name usable as the delete confirmation", () => {
    // The delete panel asks the user to type this back exactly.
    assert.equal(normaliseBrandName("  Sorbify  Oy "), "Sorbify Oy");
    assert.equal(normaliseBrandName("  "), null);
  });
});

describe("the industry list is the one onboarding uses", () => {
  it("matches app/onboarding/page.tsx exactly, in order", () => {
    // The spec says "same list as onboarding". That screen is not extracted
    // yet, so it keeps its own literals and this asserts they agree rather
    // than half-extracting it. When it is extracted it imports from here.
    const src = read("app/onboarding/page.tsx");
    const block = src.slice(src.indexOf("const INDUSTRIES = ["), src.indexOf("];", src.indexOf("const INDUSTRIES = [")));
    const labels = [...block.matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);
    assert.ok(labels.length > 5, "the onboarding list did not parse");
    assert.deepEqual(INDUSTRIES.map((i) => i.value), labels);
  });

  it("every industry has a translated label on both sides", () => {
    for (const i of INDUSTRIES) {
      assert.ok(en[i.labelKey]?.trim(), `${i.value} has no English label`);
      assert.ok(fi[i.labelKey]?.trim(), `${i.value} has no Finnish label`);
    }
  });

  it("recognises its own values and nothing else", () => {
    assert.ok(isKnownIndustry("Food & Beverage"));
    assert.ok(!isKnownIndustry("Agriculture"));
    assert.ok(!isKnownIndustry(null));
  });

  it("the stored value is the English label, not a slug", () => {
    // brands.industry holds what onboarding wrote. A slug would need a
    // backfill of live rows, and rule 1 allows no migration.
    assert.equal(INDUSTRIES[0].value, "Tech & SaaS");
  });
});

describe("criterion 4 · every write reports its result", () => {
  const PANELS = [
    "components/settings/you-panel.tsx",
    "components/settings/brand-panel.tsx",
    "components/settings/account-panel.tsx",
    "components/language-switch.tsx",
    "components/delete-account.tsx",
  ];

  it("no panel discards an { error }", () => {
    // "This has now caused two silent failures in this codebase — the
    // onboarding logo upload and the image library inserts — and a settings
    // page that says nothing when a save fails is the third."
    for (const f of PANELS) {
      const code = stripComments(read(f));
      assert.ok(!/\.then\(\(\{\s*error\s*\}\)\s*=>\s*\{\s*if\s*\(!error\)/.test(code),
        `${f} has the discarded-error shape the spec names`);
    }
  });

  it("every await of a supabase write binds its error", () => {
    for (const f of PANELS) {
      const code = stripComments(read(f));
      for (const m of code.matchAll(/^.*await\s+supabase[^\n]*$/gm)) {
        const line = m[0];
        if (!/\.(update|insert|upsert|delete|updateUser|signOut)\(/.test(line)) continue;
        assert.match(line, /\berror\b/, `${f}: an unchecked write — ${line.trim()}`);
      }
    }
  });

  it("the save button cannot be rendered without somewhere for the answer to go", () => {
    // Both come from SaveRow, so a panel cannot have one and not the other.
    const save = read("components/settings/save-state.tsx");
    assert.match(save, /settings\.saving/);
    assert.match(save, /settings\.saved/);
    assert.match(save, /role="alert"/);
    // A throw is a failure too, not an absence of one.
    assert.match(save, /catch \(e\)[\s\S]{0,200}message =/);
  });
});

describe("criterion 5 · the rows below the line are not controls", () => {
  const src = read("components/settings/coming-soon.tsx");

  it("has five of them, each with its own line", () => {
    assert.equal(COMING_SOON.length, 5);
    for (const row of COMING_SOON) {
      assert.ok(en[row.titleKey as keyof typeof en]?.trim(), `${row.key} has no title`);
      assert.ok(en[row.descKey as keyof typeof en]?.trim(), `${row.key} has no description`);
      assert.ok(fi[row.titleKey as keyof typeof fi]?.trim(), `${row.key} has no Finnish title`);
      assert.ok(fi[row.descKey as keyof typeof fi]?.trim(), `${row.key} has no Finnish description`);
    }
  });

  it("ships nothing clickable, focusable or linked", () => {
    const code = stripComments(src);
    for (const forbidden of [/onClick/, /href/, /tabIndex/, /<button/, /<a[\s>]/, /cursor-pointer/]) {
      assert.ok(!forbidden.test(code), `a coming-soon row has ${forbidden}`);
    }
  });

  it("the meter is decoration and says so", () => {
    // A bar with no number behind it must not be read out as data.
    assert.match(src, /row\.meter && \([\s\S]{0,120}aria-hidden="true"/);
    assert.equal(COMING_SOON.filter((r) => r.meter).length, 1);
  });

  it("is ordered by when it arrives, not by importance", () => {
    assert.deepEqual(COMING_SOON.map((r) => r.key),
      ["plan", "credits", "team", "notifications", "billing"]);
  });
});

describe("criterion 6 · email is read-only and says why", () => {
  const src = read("components/settings/you-panel.tsx");
  it("renders it readOnly", () => assert.match(src, /readOnly/));
  it("and explains, rather than showing a dead input", () => {
    assert.match(src, /settings\.emailFixed/);
    assert.match(en["settings.emailFixed"], /Write to us/);
  });
});

describe("criterion 7 · there is no delete control that does not delete", () => {
  it("nothing labelled delete is disabled by a constant", () => {
    // The spec's wording is "a test fails on a disabled control whose label
    // contains delete". Taken literally that flags the real button too: it
    // is disabled until the brand name is typed, which is a guard rather
    // than a placeholder. So the test is on the *reason* — a delete control
    // whose disabled state cannot change, or that has no handler, is the
    // placeholder the criterion is about.
    const src = stripComments(read("components/delete-account.tsx"));
    assert.ok(!/disabled=\{(true|false)\}/.test(src), "a hard-coded disabled state on the delete panel");
    assert.match(src, /onClick=\{remove\}/, "the delete button has no handler");
    assert.match(src, /authedJson\("\/api\/account\/delete"/, "it does not call the deletion route");
  });

  it("and no other screen offers a delete that goes nowhere", () => {
    for (const f of ["components/settings/account-panel.tsx", "app/(app)/settings/page.tsx"]) {
      const code = stripComments(read(f));
      assert.ok(!/settings\.soon[^"]*[Dd]elete/.test(code), `${f} lists deletion as coming`);
    }
  });
});

describe("criterion 8 · the page starts translated", () => {
  const FILES = [
    "app/(app)/settings/page.tsx",
    "components/settings/save-state.tsx",
    "components/settings/settings-hero.tsx",
    "components/settings/you-panel.tsx",
    "components/settings/brand-panel.tsx",
    "components/settings/language-panel.tsx",
    "components/settings/account-panel.tsx",
    "components/settings/coming-soon.tsx",
  ];

  it("every key it uses exists on both sides", () => {
    for (const f of FILES) {
      // The lookbehind and the required dot keep `.select("id")` out: the
      // first version read that as the key `id` and failed on it.
      for (const m of read(f).matchAll(/(?<![.\w])t\("([a-z][A-Za-z0-9]*\.[A-Za-z0-9.]+)"\)/g)) {
        const key = m[1] as keyof typeof en;
        assert.ok(en[key], `${f} uses ${m[1]}, which is not in en`);
        assert.ok(fi[key], `${f} uses ${m[1]}, which is not in fi`);
      }
    }
  });

  it("is a new screen, so it is on the extracted list rather than the outstanding one", () => {
    const scope = read("lib/i18n-scope.ts");
    const extracted = scope.slice(scope.indexOf("export const EXTRACTED"), scope.indexOf("export const OUTSTANDING"));
    for (const f of FILES) assert.ok(extracted.includes(f), `${f} is not listed as extracted`);
  });
});

describe("the four sections, in the order the spec gives them", () => {
  it("You, Brand, Language, Account, then the line", () => {
    const page = read("app/(app)/settings/page.tsx");
    const at = (s: string) => page.indexOf(s);
    assert.ok(at("<YouPanel") < at("<BrandPanel"));
    assert.ok(at("<BrandPanel") < at("<LanguagePanel"));
    assert.ok(at("<LanguagePanel") < at("<AccountPanel"));
    assert.ok(at("<AccountPanel") < at("<ComingSoon"));
  });

  it("language is two switches, not one", () => {
    // The single most common mistake here is assuming one switch does both.
    const src = read("components/settings/language-panel.tsx");
    assert.match(src, /field="interface"/);
    assert.match(src, /field="output"/);
    assert.match(src, /settings\.forYou/);
    assert.match(src, /settings\.forCustomers/);
  });

  it("and both write different columns through one component", () => {
    const src = stripComments(read("components/language-switch.tsx"));
    assert.match(src, /interface_language/);
    assert.match(src, /output_language/);
    // One update call, not two implementations of the same thing.
    assert.equal((src.match(/\.from\("brands"\)\.update\(/g) ?? []).length, 1);
  });
});

describe("criterion 1 · the menu reaches it, and Profile is not a second page", () => {
  const src = readFileSync("components/account-menu.tsx", "utf8");

  it("Settings and Profile both link to /settings, neither tagged Soon", () => {
    for (const key of ["accountMenu.settings", "accountMenu.profile"]) {
      const at = src.indexOf(`key: "${key}" as const`);
      assert.ok(at > 0, `${key} is not in the menu`);
      const entry = src.slice(at, src.indexOf("},", at));
      assert.match(entry, /href: "\/settings"/, `${key} does not link anywhere`);
      assert.ok(!/soon: true/.test(entry), `${key} is tagged Soon over a page that exists`);
    }
  });

  it("Help still says Soon, because it is", () => {
    // The point is not "remove the tags", it is "do not tag what is built".
    const at = src.indexOf('key: "accountMenu.help" as const');
    assert.match(src.slice(at, src.indexOf("},", at)), /soon: true/);
  });
});

describe("a write is only saved when a row comes back", () => {
  it("brand and language updates both ask for the row", () => {
    // An UPDATE that RLS filters out resolves { error: null } and changes
    // nothing, so supabase-js cannot tell "not allowed" from "done". Both
    // panels said "Saved" over a write that never happened until the forced
    // failure in scripts/settings-ui.mjs caught it.
    for (const f of ["components/settings/brand-panel.tsx", "components/language-switch.tsx"]) {
      const code = stripComments(readFileSync(f, "utf8"));
      const update = code.match(/\.update\([\s\S]*?\.eq\([^)]*\)[^;]*/);
      assert.ok(update, `${f} has no update to check`);
      assert.match(update[0], /\.select\(/, `${f} does not read back what it wrote`);
      assert.match(code, /length === 0/, `${f} does not treat zero rows as a failure`);
    }
  });
});

// ──────────────────── inbox 7b: the toggle is on screen behind the login too ──

describe("the interface language is one click away, not two cards deep", () => {
  const sidebar = readFileSync("components/sidebar.tsx", "utf8");
  const sw = stripComments(readFileSync("components/language-switch.tsx", "utf8"));

  it("the sidebar renders the switch as a toggle", () => {
    // "I can see the Finnish toggle on the website but not when logged in."
    // The site's toggle is in its nav; the app has no top bar, so its nav is
    // the sidebar.
    assert.match(sidebar, /from "@\/components\/language-switch"/);
    assert.match(sidebar, /<LanguageSwitch variant="toggle" \/>/);
  });

  it("as a look of the same component, not a second writer", () => {
    // One update call still, asserted above; the toggle is a render branch.
    assert.match(sw, /variant === "toggle"/);
    assert.equal((sw.match(/\.from\("brands"\)\.update\(/g) ?? []).length, 1);
    assert.match(sw, /aria-label=\{t\("settings\.language"\)\}/);
    assert.match(sw, /LOCALE_NAME\[l\]/);
  });

  it("does nothing until the brand has loaded", () => {
    // A click before useBrand resolves took the no-brand branch: cookie
    // written, column not, and LocaleSync reverted it on the next load.
    assert.match(sw, /loading: brandLoading/);
    assert.match(sw, /if \(brandLoading\) return;/);
    assert.equal((sw.match(/disabled=\{pending \|\| brandLoading\}/g) ?? []).length, 2);
  });
});
