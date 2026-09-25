import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cookieKey, isOperator, operatorIds, signHqCookie, verifyHqCookie } from "./hq-access.ts";

const OP = "11111111-2222-3333-4444-555555555555";
const OTHER = "99999999-8888-7777-6666-555555555555";
const ENV = `${OP}, not-a-uuid ,`;
const KEY = cookieKey("service-secret");
const NOW = 1_800_000_000;

describe("the operator allowlist", () => {
  it("reads uuids only, ignores junk", () => {
    assert.deepEqual(Array.from(operatorIds(ENV)), [OP]);
    assert.equal(isOperator(OP, ENV), true);
    assert.equal(isOperator(OTHER, ENV), false);
    assert.equal(isOperator(null, ENV), false);
  });
  it("an empty allowlist lets nobody in", () => {
    assert.equal(isOperator(OP, ""), false);
    assert.equal(isOperator(OP, undefined as unknown as string), process.env.HQ_OPERATOR_IDS?.includes(OP) ?? false);
  });
});

describe("the bd_hq cookie", () => {
  it("round-trips for an operator", () => {
    const c = signHqCookie(OP, NOW + 60, KEY);
    assert.equal(verifyHqCookie(c, KEY, NOW, ENV), OP);
  });
  it("is refused when expired", () => {
    assert.equal(verifyHqCookie(signHqCookie(OP, NOW - 1, KEY), KEY, NOW, ENV), null);
  });
  it("is refused when tampered — another user id, same signature", () => {
    const [, exp, mac] = signHqCookie(OP, NOW + 60, KEY).split(".");
    assert.equal(verifyHqCookie(`${OTHER}.${exp}.${mac}`, KEY, NOW, `${OP},${OTHER}`), null);
  });
  it("is refused when signed with another key", () => {
    assert.equal(verifyHqCookie(signHqCookie(OP, NOW + 60, cookieKey("other")), KEY, NOW, ENV), null);
  });
  it("is refused once the user leaves the allowlist, even if genuine", () => {
    assert.equal(verifyHqCookie(signHqCookie(OP, NOW + 60, KEY), KEY, NOW, OTHER), null);
  });
  it("is refused when malformed", () => {
    for (const bad of ["", "a.b", "a.b.c.d", `${OP}.${NOW + 60}.!!!`]) {
      assert.equal(verifyHqCookie(bad, KEY, NOW, ENV), null, bad);
    }
  });
});
