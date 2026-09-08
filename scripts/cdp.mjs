/**
 * Minimal CDP driver. Real input events only.
 *
 * In the repo rather than a scratchpad because the scratchpad has been cleared
 * mid-session twice, and once took a working harness with it — which then
 * looked like an application bug for most of a day.
 *
 * Synthetic dispatchEvent does not drive React state; Input.insertText after
 * focus() does. See CLAUDE.md, "Testing against real data".
 */
import { spawn } from "node:child_process";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export async function launch({ port = 9444, profile = "/tmp/cdp-default", tz = null } = {}) {
  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${port}`, "--headless=new", "--no-first-run",
    `--user-data-dir=${profile}`, "--window-size=1440,900", "about:blank",
  ], { stdio: "ignore", env: tz ? { ...process.env, TZ: tz } : process.env });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let list;
  for (let i = 0; i < 60; i++) {
    try { list = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; }
    catch { await sleep(250); }
  }
  const ws = new WebSocket(list.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  const errors = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id).res(m.result ?? m.error); pending.delete(m.id); }
    if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params?.type))
      errors.push((m.params.args ?? []).map((a) => a.value ?? a.description ?? "").join(" "));
    if (m.method === "Runtime.exceptionThrown")
      errors.push(m.params?.exceptionDetails?.exception?.description ?? "exception");
  };
  const raw = (method, params = {}, sessionId) => new Promise((res) => {
    const msg = { id: ++id, method, params }; if (sessionId) msg.sessionId = sessionId;
    pending.set(msg.id, { res }); ws.send(JSON.stringify(msg));
  });

  const { targetId } = await raw("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await raw("Target.attachToTarget", { targetId, flatten: true });
  const S = (m, p) => raw(m, p, sessionId);
  await S("Page.enable"); await S("Runtime.enable");

  return {
    errors,
    send: S,
    sleep,
    async go(url, wait = 3500) { await S("Page.navigate", { url }); await sleep(wait); },
    async url() { return this.eval("location.pathname"); },
    async eval(expr) {
      const r = await S("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "eval threw");
      return r.result.value;
    },
    /**
     * Wait for React to attach. A page that has not hydrated renders from
     * server HTML and has no handlers: forms do nothing, clicks do nothing,
     * and useBrand never resolves — which reads exactly like a hung auth call
     * or a broken page. It is usually .next being rewritten by `npm run build`
     * while `npm run dev` is up.
     *
     * Fail here, loudly, rather than let a harness spend a day on it.
     */
    async waitForHydration(selector = "form, main", ms = 15000) {
      const started = Date.now();
      while (Date.now() - started < ms) {
        const attached = await this.eval(`(() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return false;
          return Object.keys(el).some((k) => k.startsWith("__react"));
        })()`);
        if (attached) return true;
        await sleep(300);
      }
      throw new Error(
        "the page never hydrated — React attached no handlers. Stop the dev " +
        "server, rm -rf .next, and restart it; `npm run build` while dev is up " +
        "rewrites the chunks underneath it. See CLAUDE.md.");
    },

    async type(selector, text) {
      await this.eval(`document.querySelector(${JSON.stringify(selector)}).focus()`);
      await S("Input.insertText", { text });
      await sleep(200);
    },
    async setViewport(width, height) {
      await S("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    },
    close() { try { ws.close(); } catch {} chrome.kill(); },
  };
}
