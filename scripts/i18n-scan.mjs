/**
 * Print every hard-coded user-facing string still left in the app shell.
 *
 * The worklist for the extraction half of inbox entry 3, and the same code the
 * test asserts on — lib/i18n-scan.ts — so the two cannot disagree.
 *
 * Usage: npm run i18n:scan            all files, counts only
 *        npm run i18n:scan -- --full  every literal, with line numbers
 *        npm run i18n:scan -- path/to/file.tsx
 */
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findAllLiterals } from "../lib/i18n-scan.ts";
import { SCOPE, IGNORE } from "../lib/i18n-scope.ts";

const args = process.argv.slice(2);
const full = args.includes("--full");
const only = args.filter((a) => !a.startsWith("--"));

function walk(dir) {
  const out = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const files = only.length ? only : SCOPE.flatMap(walk);
let total = 0;
const rows = [];

for (const f of files.sort()) {
  const src = readFileSync(f, "utf8");
  const ignore = IGNORE[f] ?? [];
  const found = findAllLiterals(src).filter((l) => !ignore.some((rx) => rx.test(l.text)));
  if (!found.length) continue;
  total += found.length;
  rows.push({ f, found });
}

for (const { f, found } of rows.sort((a, b) => b.found.length - a.found.length)) {
  console.log(`${String(found.length).padStart(4)}  ${f}`);
  if (full) for (const l of found) console.log(`        ${String(l.line).padStart(4)} ${l.where.padEnd(10)} ${l.text.slice(0, 90)}`);
}
console.log(`\n${total} literals in ${rows.length} files`);
