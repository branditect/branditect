/**
 * Where someone lands after they authenticate.
 *
 * Rules from branditect-ui/spec/onboarding.md — the status ladder is the only
 * thing that decides this, so it lives in one pure function rather than being
 * re-derived in the login page, the signup page and anywhere else that later
 * needs it.
 */

import type { Status } from "./onboarding.ts";

export interface RouteInputs {
  /** `onboarding.status` for this brand, or null when the row does not exist. */
  status: Status | null;
  /**
   * True when `brand_strategies` already holds a row for this brand.
   *
   * Only consulted when there is no onboarding row at all. Someone who finished
   * the old 38-question flow has a strategy and no onboarding record, and
   * sending them to a welcome screen on every sign-in would be wrong.
   */
  hasStrategy: boolean;
}

export function startRouteFor({ status, hasStrategy }: RouteInputs): string {
  switch (status) {
    case "partial":
      return "/start/resume";
    case "gated_complete":
    case "complete":
      return "/home";
    case "not_started":
      return "/start";
    default:
      // No row. New account, or an account that predates onboarding.
      return hasStrategy ? "/home" : "/start";
  }
}
