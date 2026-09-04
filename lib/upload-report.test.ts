/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  describeFailure, summariseUpload, anyLanded, type UploadFailure,
} from "./upload-report.ts";

/**
 * THE CONTROL. A failed insert must be reported.
 *
 * file-library.tsx discarded the result of its brand_images insert entirely.
 * supabase-js resolves { data, error } and never throws, so a rejected row
 * produced no exception, no message and no file — the upload looked like it
 * worked. That silence is why a stale migration file could pass for a live
 * bug: had the six-value constraint still been live, every upload in four of
 * the five tabs would have failed without saying so.
 */
describe("a failed insert is reported", () => {
  const rejected: UploadFailure = {
    fileName: "brand-film.mp4",
    kind: "row",
    detail: 'new row for relation "brand_images" violates check constraint "brand_images_category_check"',
  };

  it("produces a message rather than nothing", () => {
    const msg = summariseUpload([rejected], 1);
    assert.notEqual(msg, null, "a rejected row produced no message");
    assert.ok(msg && msg.length > 0);
  });

  it("names the file", () => {
    assert.ok(summariseUpload([rejected], 1)!.includes("brand-film.mp4"));
  });

  it("keeps the database's own words, including the constraint name", () => {
    assert.ok(summariseUpload([rejected], 1)!.includes("brand_images_category_check"),
      "the constraint name was thrown away, which is the difference between a report and a shrug");
  });

  it("says the bytes are stored but unreferenced, because retrying orphans them", () => {
    assert.ok(/uploaded but could not be saved/i.test(describeFailure(rejected)));
  });

  it("a batch where nothing landed does not silently refresh as if it had", () => {
    assert.equal(anyLanded([rejected], 1), false);
    assert.equal(anyLanded([rejected], 3), true);
  });
});

describe("the other two silences in the same function", () => {
  it("a storage failure is reported, not `continue`d", () => {
    const msg = summariseUpload(
      [{ fileName: "a.mp4", kind: "storage", detail: "Payload too large" }], 1);
    assert.ok(msg!.includes("a.mp4") && msg!.includes("Payload too large"));
  });

  it("an oversize file is reported, not filtered out in silence", () => {
    const msg = summariseUpload([{ fileName: "huge.mov", kind: "too-big" }], 1);
    assert.ok(msg!.includes("huge.mov") && /size limit/i.test(msg!));
  });
});

describe("the banner for a batch", () => {
  it("says nothing only when everything landed", () => {
    assert.equal(summariseUpload([], 3), null);
  });

  it("counts the failures against what was attempted", () => {
    const msg = summariseUpload([
      { fileName: "a.mp4", kind: "row", detail: "x" },
      { fileName: "b.mp4", kind: "row", detail: "x" },
    ], 5);
    assert.ok(msg!.startsWith("2 of 5 files did not upload."));
  });

  it("names one cause once rather than repeating it per file", () => {
    const msg = summariseUpload([
      { fileName: "a.mp4", kind: "too-big" },
      { fileName: "b.mp4", kind: "too-big" },
    ], 2);
    assert.equal((msg!.match(/size limit/g) ?? []).length, 1);
  });
});

/** The component has to actually do it. Reporting nobody can see is the same silence. */
describe("file-library reports what it used to swallow", () => {
  const src = readFileSync("components/file-library.tsx", "utf8");

  it("does not discard the insert result", () => {
    const insertIdx = src.indexOf('.from("brand_images").insert(');
    assert.ok(insertIdx > -1, "the insert is gone entirely");
    const before = src.slice(Math.max(0, insertIdx - 120), insertIdx);
    assert.ok(/const \{ error: insertError \} =/.test(before),
      "the insert result is discarded again");
  });

  it("checks that error", () => {
    assert.ok(/if \(insertError\)/.test(src), "the captured error is never checked");
  });

  it("the storage failure is captured rather than skipped in silence", () => {
    assert.ok(!/if \(error\) continue;/.test(src), "still a bare `continue`");
    assert.ok(/if \(storageError\)/.test(src));
  });

  it("renders what it captured", () => {
    assert.ok(/\{uploadError && \(/.test(src), "the message is captured but never shown");
    assert.ok(/role="alert"/.test(src), "the message is not announced");
  });

  it("only refetches when something actually landed", () => {
    assert.ok(/if \(anyLanded\([^)]*\)\) fetchFiles\(\)/.test(src),
      "it refetches unconditionally, so a total failure looks like a refresh");
  });
});
