/**
 * The spend ceiling, in code. spec: hq-accounts.md Part 1.
 *
 *   reserve  →  call the provider (at most twice)  →  settle
 *
 * Nothing calls a provider without a reservation. The reservation is taken by
 * budget_reserve() in the database (supabase/hq-billing.sql), atomically:
 * the refusal IS the UPDATE that found no room, so two concurrent requests
 * against the last credit cannot both pass. This file is the part that can
 * have bugs; the CHECK constraints on brand_budget are the part that cannot.
 *
 * Settling:
 *   - a PreflightError (thrown before the provider was called: missing key,
 *     invalid input, a refused upload) refunds the whole reservation;
 *   - a provider error keeps the cost on the budget — the money left — and
 *     gives the customer their credits back;
 *   - success trues the estimate down (or up, never past the cap) to the real
 *     cost read from the response.
 *
 * One retry, inside the same reservation, and only for errors that are worth
 * retrying (rate limit, overload, 5xx, connection). The Anthropic SDK retries
 * twice by default on its own; every metered client sets maxRetries: 0 so
 * this is the only retry there is (criterion 7).
 */

import { CENTS_PER_CREDIT, centsAsCredits } from "./usage-cost.ts";
import { planFor, type MeteredRoute } from "./metering-plan.ts";
import { toLocale, translate, type Locale } from "./i18n/index.ts";

/** Thrown by route code before any provider call. Refunds the reservation. */
export class PreflightError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "PreflightError";
    this.status = status;
  }
}

/** A provider answered with an HTTP error (for fetch-based routes). */
export class ProviderError extends Error {
  status: number;
  costCents: number;
  constructor(message: string, status: number, costCents = 0) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
    this.costCents = costCents;
  }
}

export type RefusalReason = "credits" | "cost" | "platform";

/** The budget said no. Nothing reached a provider. */
export class BudgetRefused extends Error {
  reason: RefusalReason;
  status: 402 | 503;
  constructor(reason: RefusalReason, status: 402 | 503, message: string) {
    super(message);
    this.name = "BudgetRefused";
    this.reason = reason;
    this.status = status;
  }
}

export interface Reservation {
  ok: boolean;
  reservation_id?: string | null;
  reason?: RefusalReason;
  remaining_cents?: number;
  remaining_credits?: number;
  soft_alert?: boolean;
  /** The budget functions are not installed yet. See reserve(). */
  unmetered?: boolean;
}

export interface Settlement {
  reservationId: string;
  reachedProvider: boolean;
  ok: boolean;
  actualCents: number | null;
  model: string | null;
  units: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  attempts: number;
  errorCode: string | null;
}

/** The two database calls, injectable so the rules can be tested. */
export interface BudgetStore {
  reserve(a: {
    brandId: string; userId: string | null; kind: string; route: string;
    estimateCents: number; credits: number;
  }): Promise<Reservation>;
  settle(s: Settlement): Promise<void>;
}

/** One provider attempt, as the route reports it. */
export interface Attempt<T> {
  value: T;
  model: string;
  costCents: number;
  units?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface MeterOptions {
  route: MeteredRoute;
  brandId: string;
  userId: string | null;
  /** Upper bound, from estimateCents() in lib/usage-cost.ts. */
  estimateCents: number;
  locale?: Locale;
  /** Indexing words its refusal as "this document needs about N credits". */
  refusalKind?: "document";
}

const RETRYABLE = new Set([408, 409, 429, 500, 502, 503, 504, 529]);

/** Did this error come back from the provider (so it may have cost money)? */
export function reachedProvider(e: unknown): boolean {
  if (e instanceof PreflightError || e instanceof BudgetRefused) return false;
  return true; // an HTTP error, a timeout, a dropped connection: assume it cost
}

export function isRetryable(e: unknown): boolean {
  if (e instanceof PreflightError || e instanceof BudgetRefused) return false;
  const o = e as { status?: number; name?: string } | null;
  if (o && typeof o.status === "number") return RETRYABLE.has(o.status);
  // No status: the SDK's connection and timeout errors.
  return /connection|timeout|abort|fetch failed/i.test(String(o?.name ?? "") + " " + String((e as Error)?.message ?? ""));
}

function errorCode(e: unknown): string {
  const o = e as { status?: number; name?: string } | null;
  if (o && typeof o.status === "number") return `http_${o.status}`;
  return (o?.name || "error").slice(0, 40);
}

function refusal(r: Reservation, opts: MeterOptions): BudgetRefused {
  const locale = opts.locale ?? "en";
  if (r.reason === "platform") {
    return new BudgetRefused("platform", 503, translate(locale, "budget.platform"));
  }
  if (r.reason === "credits") {
    const plan = planFor(opts.route);
    return new BudgetRefused("credits", 402,
      translate(locale, "budget.credits", { need: plan.credits, left: Math.max(0, r.remaining_credits ?? 0) }));
  }
  if (opts.refusalKind === "document") {
    return new BudgetRefused("cost", 402, translate(locale, "budget.document", {
      need: centsAsCredits(opts.estimateCents),
      left: Math.max(0, Math.floor((r.remaining_cents ?? 0) / CENTS_PER_CREDIT)),
    }));
  }
  return new BudgetRefused("cost", 402, translate(locale, "budget.cost"));
}

/** A reservation that has been granted. run() spends it, exactly once. */
export interface Lease {
  run<T>(call: (attempt: number) => Promise<Attempt<T>>): Promise<T>;
}

/**
 * Reserve first, run later. Streaming routes need the two apart: the refusal
 * has to be known before the response starts (so it can be a 402), and the
 * settlement only after the stream has ended. Everything else uses meter().
 */
export async function reserveMeter(opts: MeterOptions, store?: BudgetStore): Promise<Lease> {
  const db = store ?? (await defaultStore());
  const plan = planFor(opts.route);

  const res = await db.reserve({
    brandId: opts.brandId,
    userId: opts.userId,
    kind: plan.kind,
    route: opts.route,
    estimateCents: opts.estimateCents,
    credits: plan.credits,
  });
  if (!res.ok) throw refusal(res, opts);
  if (res.soft_alert) {
    console.error(`[budget] platform soft alert crossed by ${opts.route} (${opts.brandId})`);
  }

  const settle = async (s: Omit<Settlement, "reservationId">) => {
    if (!res.reservation_id) return; // unmetered: see defaultStore()
    try {
      await db.settle({ reservationId: res.reservation_id, ...s });
    } catch (err) {
      // The call already happened. Failing the customer's request now helps
      // nobody; the open reservation stays charged at its estimate and
      // budget_expire_stale() closes it.
      console.error(`[budget] settle failed for ${opts.route}`, err);
    }
  };

  let used = false;
  return {
    async run<T>(call: (attempt: number) => Promise<Attempt<T>>): Promise<T> {
      if (used) throw new Error("metering: a reservation can be spent once");
      used = true;
      let failedCost = 0;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const a = await call(attempt);
          await settle({
            reachedProvider: true,
            ok: true,
            actualCents: a.costCents + failedCost,
            model: a.model,
            units: a.units ?? null,
            inputTokens: a.inputTokens ?? null,
            outputTokens: a.outputTokens ?? null,
            attempts: attempt,
            errorCode: null,
          });
          return a.value;
        } catch (e) {
          // A pre-flight failure refunds — unless an earlier attempt already
          // reached the provider, in which case money has left and it stays.
          if (!reachedProvider(e) && attempt === 1) {
            await settle({
              reachedProvider: false, ok: false, actualCents: 0, model: null, units: null,
              inputTokens: null, outputTokens: null, attempts: attempt, errorCode: errorCode(e),
            });
            throw e;
          }
          failedCost += e instanceof ProviderError ? e.costCents : 0;
          if (attempt < 2 && isRetryable(e)) continue;
          // Final failure. Keep the reservation: the attempt may have cost
          // money and we cannot see how much. The customer's credits go back.
          await settle({
            reachedProvider: true, ok: false,
            actualCents: Math.max(failedCost, opts.estimateCents),
            model: null, units: null, inputTokens: null, outputTokens: null,
            attempts: attempt, errorCode: errorCode(e),
          });
          throw e;
        }
      }
      /* c8 ignore next */
      throw new Error("unreachable");
    },
  };
}

/**
 * Run one metered provider call. `call(attempt)` makes exactly one provider
 * request and returns what it cost; meter() decides whether there is a second.
 * A streaming call that has already sent bytes to the client must throw a
 * non-retryable error (e.g. a ProviderError with status 400) — a retry cannot
 * un-send what the person has already read.
 */
export async function meter<T>(
  opts: MeterOptions,
  call: (attempt: number) => Promise<Attempt<T>>,
  store?: BudgetStore,
): Promise<T> {
  const lease = await reserveMeter(opts, store);
  return lease.run(call);
}

/** A route's JSON answer to a refusal. Status 402 for the account's own
 *  budget, 503 when the platform ceiling is hit. */
export function refusalBody(e: BudgetRefused): { error: string; code: string } {
  return { error: e.message, code: `budget_${e.reason}` };
}

/** The locale the person is using, from the bd_locale cookie on the request. */
export function requestLocale(req: Request): Locale {
  const m = (req.headers.get("cookie") ?? "").match(/(?:^|;\s*)bd_locale=([^;]+)/);
  return toLocale(m?.[1]);
}

// ── The real store ──────────────────────────────────────────────────────────

let warnedUnmetered = false;

/** Postgres/PostgREST's "that function does not exist". */
function isMissingFunction(err: { code?: string; message?: string } | null): boolean {
  return !!err && (err.code === "PGRST202" || err.code === "42883" || /could not find the function/i.test(err.message ?? ""));
}

async function defaultStore(): Promise<BudgetStore> {
  const { serviceClient } = await import("./api-auth.ts");
  const sb = serviceClient();
  return {
    async reserve(a) {
      const { data, error } = await sb.rpc("budget_reserve", {
        p_brand: a.brandId, p_user: a.userId, p_kind: a.kind, p_route: a.route,
        p_estimate_cents: a.estimateCents, p_credits: a.credits,
      });
      if (error) {
        /*
          The ONE fail-open: supabase/hq-billing.sql has not been run yet.
          Shipping the code before the migration must not take every paid
          route down; the ceiling starts holding the moment the SQL is
          applied, with no redeploy. Any other error fails closed.
        */
        if (isMissingFunction(error)) {
          if (!warnedUnmetered) {
            console.error("[budget] budget_reserve() is not installed — calls are UNMETERED until supabase/hq-billing.sql is applied");
            warnedUnmetered = true;
          }
          return { ok: true, reservation_id: null, unmetered: true };
        }
        throw new Error(`budget_reserve failed: ${error.message}`);
      }
      return data as Reservation;
    },
    async settle(s) {
      const { error } = await sb.rpc("budget_settle", {
        p_reservation: s.reservationId,
        p_reached_provider: s.reachedProvider,
        p_ok: s.ok,
        p_actual_cents: s.actualCents,
        p_model: s.model,
        p_units: s.units,
        p_input_tokens: s.inputTokens,
        p_output_tokens: s.outputTokens,
        p_attempts: s.attempts,
        p_error_code: s.errorCode,
      });
      if (error) throw new Error(`budget_settle failed: ${error.message}`);
    },
  };
}

/**
 * The budget a call by this user is charged to, for routes authenticated by
 * requireUser (which deliberately work before a brand row exists).
 *
 * Their brand when they have one. A brand-new account can reach these routes
 * — tone and strategy generation run during onboarding — before its brand row
 * is written (lib/useBrand.ts repairs that on read). Refusing them would break
 * sign-up; letting them through unmetered would break the ceiling. So the call
 * is charged to a budget keyed by the user, "user:<id>", which gets Free caps
 * like any account. It never shows as a brand in HQ, and it is small.
 */
export async function brandOfUser(userId: string): Promise<string> {
  const { serviceClient } = await import("./api-auth.ts");
  const { data } = await serviceClient()
    .from("brands").select("brand_id").eq("user_id", userId).limit(1).maybeSingle();
  return (data as { brand_id?: string } | null)?.brand_id ?? `user:${userId}`;
}
