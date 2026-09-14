/**
 * What on the public site is still English on /fi. Inbox 7b.
 *
 * Shared by scripts/i18n-gap-site.mjs, which writes the list, and
 * lib/site-locale.test.ts, which will not let `FI_COPY_READY` go true while
 * the list has anything on it. One function, so the file a translator works
 * from and the check that gates indexing cannot disagree.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { findAllLiterals } from "./i18n-scan.ts";
import { SITE_SCOPE, SITE_SAME_IN_EVERY_LANGUAGE } from "./i18n-scope.ts";
import { en } from "./i18n/en.ts";

function walk(p: string): string[] {
  if (!statSync(p).isDirectory()) return [p];
  return readdirSync(p).flatMap((e) => walk(join(p, e)))
    .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
}

const norm = (s: string) => s.trim().replace(/\s+/g, " ");

export interface GapSection { f: string; rows: string[] }

/** Key families that exist for the site. A key in them that nothing reads is listed. */
const SITE_KEY = /^(site|plan|cmp|credit)\./;

export function siteGap(root = "."): { unkeyed: GapSection[]; unwired: GapSection[]; unread: string[] } {
  const known = new Set(Object.values(en).map(norm));
  const files = SITE_SCOPE.flatMap((s) => walk(join(root, s))).sort();
  const unkeyed: GapSection[] = [];
  const unwired: GapSection[] = [];
  const sources = files.map((f) => readFileSync(f, "utf8")).join("\n");
  // A key is read when its name appears quoted in a site file. Unread keys are
  // usually a string cut short by extraction, which cannot be rendered without
  // gluing English onto it, or a key superseded by a whole-sentence one.
  const unread = (Object.keys(en) as string[])
    .filter((k) => SITE_KEY.test(k) && !sources.includes(`"${k}"`));
  for (const f of files) {
    const seen = new Set<string>();
    const none: string[] = [];
    const hard: string[] = [];
    for (const l of findAllLiterals(readFileSync(f, "utf8"))) {
      const t = norm(l.text);
      if (seen.has(t) || SITE_SAME_IN_EVERY_LANGUAGE.has(t)) continue;
      seen.add(t);
      (known.has(t) ? hard : none).push(t);
    }
    const name = root === "." ? f : f.slice(root.length + 1);
    if (none.length) unkeyed.push({ f: name, rows: none });
    if (hard.length) unwired.push({ f: name, rows: hard });
  }
  return { unkeyed, unwired, unread };
}
