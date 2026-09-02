/**
 * Fails if any policy in the public schema is world-open.
 *
 * A PERMISSIVE policy with `qual = true` makes its table readable by every
 * signed-in user, and Postgres ORs permissive policies together, so one of
 * them defeats every correct policy sitting beside it. That is exactly how
 * supabase/close-rls.sql appeared to work and did not: it turned RLS on and
 * added scoped policies while nine `USING (true)` policies stayed in place.
 *
 * pg_policies is not reachable through PostgREST, so this calls the
 * rls_open_policies() function created by supabase/close-rls-2.sql. That
 * function is granted to service_role only and returns policy names, never
 * data from any table.
 *
 * The decision lives in lib/rls-audit.ts so it is tested by being called.
 *
 * Usage: npm run rls:audit
 */
import { readFileSync } from "node:fs";
import { auditResult } from "../lib/rls-audit.ts";

function envFromFiles() {
  const out = {};
  for (const f of [".env.local", ".env"]) {
    let raw;
    try { raw = readFileSync(new URL(`../${f}`, import.meta.url), "utf8"); } catch { continue; }
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !out[m[1]]) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

const env = { ...envFromFiles(), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("rls:audit needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}

let result;
try {
  const res = await fetch(`${url}/rest/v1/rpc/rls_open_policies`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: "{}",
  });
  result = res.ok
    ? auditResult({ reachable: true, policies: await res.json() })
    : auditResult({ reachable: false, errorBody: `${res.status} ${await res.text()}` });
} catch (err) {
  result = auditResult({ reachable: false, errorBody: String(err) });
}

console[result.exitCode === 0 ? "log" : "error"](
  `${result.exitCode === 0 ? "PASS" : "FAIL"}  ${result.message}`,
);
process.exit(result.exitCode);
