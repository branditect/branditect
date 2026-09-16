/** Run with: npm test — the notes editor grows, and an answer can be kept. */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { noteTitleFrom } from "./notes.ts";
import { en } from "./i18n/en.ts";
import { fi } from "./i18n/fi.ts";

const read = (f: string) => readFileSync(f, "utf8");
/** Comments first: both files explain the bug they fix, and a check that
 *  matches its own explanation is a check that stops working. */
const code = (f: string) => read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("a note is as tall as what you wrote", () => {
  // "The notes app is broken, when I write a note I can only see a tiny part
  // of it." The blocks were rows={3} with overflow:hidden, so everything past
  // the third line was painted outside the box, with no scrollbar to say so.
  it("the editor uses the growing textarea, not a fixed one", () => {
    const page = read("app/(app)/studio/notes/page.tsx");
    assert.match(page, /import AutoTextarea from "@\/components\/studio\/auto-textarea"/);
    assert.match(page, /<AutoTextarea/);
    assert.ok(!/<textarea/.test(page), "a block is a plain textarea again, which clips");
  });

  it("which measures the text rather than declaring a height", () => {
    const src = code("components/studio/auto-textarea.tsx");
    // "auto" first, or scrollHeight never reports less than the height already
    // set and a shortened note keeps its old height for ever.
    assert.match(src, /style\.height = "auto"/);
    assert.match(src, /scrollHeight/);
    assert.ok(src.indexOf('style.height = "auto"') < src.indexOf("scrollHeight"));
  });
});

describe("an answer from AI Chat can be copied or kept", () => {
  const rail = read("components/chat-rail.tsx");

  it("every answer offers both", () => {
    assert.match(rail, /navigator\.clipboard\.writeText/);
    assert.match(rail, /t\("chatRail\.copyAnswer"\)/);
    assert.match(rail, /saveAnswerAsNote/);
    assert.match(rail, /t\("chatRail\.saveAsNote"\)/);
  });

  it("and says what happened, in both languages", () => {
    for (const k of ["chatRail.copyAnswer", "chatRail.saveAsNote", "chatRail.savedToNotes",
                     "chatRail.saveFailed", "chatRail.noteFromChat"] as const) {
      assert.ok(en[k]?.trim(), `${k} has no English`);
      assert.ok(fi[k]?.trim(), `${k} has no Finnish`);
      assert.notEqual(en[k], fi[k], `${k} is the same in both`);
    }
  });

  it("keeps it as a real note, not in this browser", () => {
    // The old save wrote localStorage under `andy_saved`, so what it kept was
    // not in Studio ▸ Notes and did not survive a different machine.
    const src = code("lib/note-from-chat.ts");
    assert.match(src, /authedJson\("\/api\/notes", "POST"/);
    assert.match(src, /authedJson\("\/api\/notes", "PATCH"/);
    assert.match(src, /source: "chat"/);
    assert.ok(!/localStorage/.test(src));
  });

  it("titles it with the question, cut on a word", () => {
    assert.equal(noteTitleFrom("What should I post about this week?", "x"),
      "What should I post about this week?");
    assert.equal(noteTitleFrom("   ", "From AI Chat"), "From AI Chat");
    assert.equal(noteTitleFrom(null, "From AI Chat"), "From AI Chat");
    const long = "Kirjoita minulle julkaisu tuotteesta jonka kate on tarkistettu ja jonka kuvat ovat valmiina";
    const cut = noteTitleFrom(long, "x");
    assert.ok(cut.length <= 61, cut);
    assert.ok(cut.endsWith("…"));
    assert.ok(long.startsWith(cut.slice(0, -1)), cut);
    assert.ok(!cut.slice(0, -1).endsWith(" "), cut);
  });

  it("the chat's own fallbacks are keyed too", () => {
    const hook = read("lib/useBrandChat.ts");
    assert.match(hook, /t\("chat\.replyFailed"\)/);
    assert.match(hook, /t\("chat\.connectionIssue"\)/);
    assert.ok(!/"Something went wrong\.\"|Connection issue/.test(hook));
  });

  it("a new note is not born called Untitled in Finnish", () => {
    const route = read("app/api/notes/route.ts");
    assert.match(route, /title: ""/);
    assert.ok(!/title: "Untitled"/.test(route));
    assert.equal(fi["notes.untitled"], "Nimetön");
  });
});

describe("Andy says who he is before the first question", () => {
  const rail = readFileSync("components/chat-rail.tsx", "utf8");

  it("the rail carries his name and his introduction", () => {
    assert.match(rail, /t\("andy\.name"\)/);
    for (const k of ["chatRail.andyIntro1", "chatRail.andyIntro2", "chatRail.andyIntro3", "chatRail.andyIntro4"]) {
      assert.ok(rail.includes(`"${k}"`), `the rail does not render ${k}`);
    }
  });

  it("the introduction says all four things it is for", () => {
    const all = ["chatRail.andyIntro1", "chatRail.andyIntro2", "chatRail.andyIntro3", "chatRail.andyIntro4"]
      .map((k) => en[k as keyof typeof en]).join(" ");
    assert.match(all, /Andy/, "he does not introduce himself by name");
    assert.match(all, /Studio/, "long-form writing is not sent to Studio");
    assert.match(all, /\{count\} files indexed/, "it does not say what it reads from");
    assert.match(all, /notes/i, "it does not say an answer can be kept");
  });

  it("and it is out of the way once the conversation starts", () => {
    assert.match(rail, /\{!started && \(\s*<div className="mt-\[9px\]/);
  });

  it("in Finnish too, with the placeholder intact", () => {
    for (const k of ["chatRail.andyIntro1", "chatRail.andyIntro2", "chatRail.andyIntro3", "chatRail.andyIntro4"] as const) {
      assert.ok(fi[k]?.trim(), `${k} has no Finnish`);
      assert.notEqual(en[k], fi[k]);
      assert.equal(/\{count\}/.test(en[k]), /\{count\}/.test(fi[k]), `${k} placeholders differ`);
    }
    assert.match(fi["chatRail.andyIntro1"], /Andy/);
  });
});
