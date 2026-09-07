/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AUTH_COPY } from "./auth-errors.ts";
import {
  withTimeout, mapThrown, AuthTimeout, AUTH_TIMEOUT_MS, POST_AUTH_FALLBACK,
} from "./auth-timeout.ts";

/**
 * Comments are stripped before counting awaits. The first version of this
 * counted the word "await" inside the very comment explaining the fix, and
 * reported three awaits where the code has two.
 */
function code(src: string, from: string, to: string): string {
  return src.slice(src.indexOf(from), src.indexOf(to))
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n");
}

/**
 * The bug: app/login/page.tsx awaited signInWithPassword with no try/catch and
 * no timeout. A hang left `loading` true, rendered no error and navigated
 * nowhere — a spinner with no way to tell whether it had worked.
 */
describe("an auth call that never settles becomes something the page can say", () => {
  it("a promise that never resolves rejects with AuthTimeout", async () => {
    const never = new Promise(() => {});
    await assert.rejects(() => withTimeout(never, "Sign-in", 20), (e: Error) => {
      assert.equal(e.name, "AuthTimeout");
      assert.match(e.message, /Sign-in did not respond/);
      return true;
    });
  });

  it("a call that resolves in time is untouched", async () => {
    assert.equal(await withTimeout(Promise.resolve("ok"), "Sign-in", 50), "ok");
  });

  it("a call that rejects keeps its own error, not a timeout", async () => {
    const boom = new Error("network down");
    await assert.rejects(() => withTimeout(Promise.reject(boom), "Sign-in", 50),
      (e: Error) => e.message === "network down");
  });

  it("the timer is cleared on the happy path, so nothing is left pending", async () => {
    // process._getActiveHandles() does not surface timers in this Node, so an
    // earlier version of this test could not fail — deleting the clearTimeout
    // left it green. getActiveResourcesInfo() does.
    const pending = () => process.getActiveResourcesInfo().filter((r) => r === "Timeout").length;
    const before = pending();
    await withTimeout(Promise.resolve(1), "Sign-in", 60_000);
    assert.equal(pending(), before,
      "a 60s timer is still pending after the call resolved");
  });

  it("and cleared when the call rejects, not only when it succeeds", async () => {
    const pending = () => process.getActiveResourcesInfo().filter((r) => r === "Timeout").length;
    const before = pending();
    await withTimeout(Promise.reject(new Error("no")), "Sign-in", 60_000).catch(() => {});
    assert.equal(pending(), before, "a timer was left pending after a rejection");
  });

  it("the bound is a wait, not a void", () => {
    assert.ok(AUTH_TIMEOUT_MS >= 5000 && AUTH_TIMEOUT_MS <= 30000, `${AUTH_TIMEOUT_MS}ms`);
  });
});

describe("what the person is told", () => {
  it("a timeout says so, and does not leak a driver string", () => {
    assert.equal(mapThrown(new AuthTimeout("Sign-in")).message, AUTH_COPY.timedOut);
    assert.ok(!mapThrown(new AuthTimeout("Sign-in")).message.includes("ms"));
  });

  it("anything else thrown gets the server-error copy, never its own text", () => {
    assert.equal(mapThrown(new Error("TypeError: fetch failed")).message, AUTH_COPY.serverError);
    assert.equal(mapThrown("a string").message, AUTH_COPY.serverError);
    assert.equal(mapThrown(null).message, AUTH_COPY.serverError);
  });

  it("the copy is a sentence a person can act on", () => {
    assert.match(AUTH_COPY.timedOut, /try again/i);
  });
});

/** The pages have to actually use it. */
describe("the login page cannot hang silently", () => {
  const src = readFileSync("app/login/page.tsx", "utf8");

  it("sign-in is bounded", () => {
    assert.ok(/withTimeout\(\s*\n?\s*supabase\.auth\.signInWithPassword/.test(src),
      "signInWithPassword is awaited unbounded again");
  });

  it("and wrapped, so a throw is shown rather than swallowed", () => {
    assert.match(src, /catch \(e\) \{[\s\S]{0,120}setError\(mapThrown\(e\)\)/);
  });

  it("loading is cleared on that path, or the spinner never stops", () => {
    const cat = src.slice(src.indexOf("catch (e)"));
    assert.match(cat, /setLoading\(false\)/);
  });

  it("routing is bounded too, and falls back rather than stranding a signed-in user", () => {
    assert.ok(src.includes("withTimeout(routeAfterAuth()"), "routeAfterAuth is unbounded");
    assert.ok(src.includes("POST_AUTH_FALLBACK"), "there is no fallback destination");
    assert.equal(POST_AUTH_FALLBACK, "/start");
  });

  it("no await in the handler is left unbounded", () => {
    const fn = code(src, "async function handleSignIn", "return (");
    const awaits = fn.match(/await [a-zA-Z]/g) ?? [];
    const bounded = fn.match(/await withTimeout\(/g) ?? [];
    assert.equal(awaits.length, bounded.length,
      `${awaits.length} awaits, ${bounded.length} bounded`);
  });
});

describe("the signup page cannot hang silently either", () => {
  const src = readFileSync("app/signup/page.tsx", "utf8");

  it("sign-up is bounded and wrapped", () => {
    assert.ok(src.includes("withTimeout(supabase.auth.signUp("), "signUp is unbounded");
    assert.match(src, /catch \(e\) \{[\s\S]{0,140}setError\(mapThrown\(e\)\)/);
  });

  it("ensureBrand is bounded, and a failure does not strand a signed-in user", () => {
    assert.ok(src.includes("withTimeout(ensureBrand()"), "ensureBrand is unbounded");
  });

  it("no await in the handler is left unbounded", () => {
    const fn = code(src, "async function handleSignUp", "if (confirmSentTo)");
    const awaits = fn.match(/await [a-zA-Z]/g) ?? [];
    const bounded = fn.match(/await withTimeout\(/g) ?? [];
    assert.equal(awaits.length, bounded.length,
      `${awaits.length} awaits, ${bounded.length} bounded`);
  });
});
