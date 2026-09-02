/**
 * The decision the RLS audit makes, on its own so it can be tested by calling
 * it rather than by matching the script's source.
 *
 * A check that goes green because it could not run is worse than no check, so
 * every path that is not "the database answered, and there are no offenders"
 * is a failure.
 */

export interface OpenPolicy {
  table_name: string;
  policy_name: string;
  cmd: string;
  qual: string | null;
  with_check: string | null;
}

export interface AuditInput {
  /** False when the request itself failed. */
  reachable: boolean;
  /** The body of a failed request, used only to explain the failure. */
  errorBody?: string;
  /** What the function returned, when it was reachable. */
  policies?: unknown;
}

export interface AuditResult {
  exitCode: 0 | 1 | 2;
  message: string;
}

export function auditResult(input: AuditInput): AuditResult {
  if (!input.reachable) {
    const body = input.errorBody ?? "";
    if (/Could not find the function/.test(body)) {
      return { exitCode: 1, message: "rls_open_policies() does not exist. Run supabase/close-rls-2.sql." };
    }
    return { exitCode: 1, message: `could not audit: ${body.slice(0, 160)}` };
  }

  // Anything that is not an array is not an answer. JSON.stringify(undefined)
  // returns undefined rather than a string, so it is coerced before slicing.
  if (!Array.isArray(input.policies)) {
    const shown = String(JSON.stringify(input.policies)).slice(0, 200);
    return { exitCode: 1, message: `unexpected response: ${shown}` };
  }

  const open = input.policies as OpenPolicy[];
  if (open.length === 0) {
    return { exitCode: 0, message: "no world-open policy in the public schema" };
  }

  const lines = open.map((p) => {
    const why = [p.qual === "true" ? "qual=true" : null, p.with_check === "true" ? "with_check=true" : null]
      .filter(Boolean).join(", ");
    return `  ${p.table_name}.${p.policy_name}  [${p.cmd}]  ${why}`;
  });
  return {
    exitCode: 1,
    message: `${open.length} world-open policy(ies) in the public schema:\n\n${lines.join("\n")}\n\n` +
      "Each of these makes its table world-readable to any signed-in user.",
  };
}
