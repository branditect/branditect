/** Run with: npm test */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CHANNELS, CADENCES, MAX_CHANNELS, isChannel, channelLabel, postsPerWeek,
  suggestPillars, suggestAudience, parsePlan, planIsUsable, weekStart, weekOnWeek, showHook,
} from "./social.ts";
import { EMPTY_STRATEGY } from "./strategy.ts";

const strategy = () => ({
  ...EMPTY_STRATEGY,
  core: { ...EMPTY_STRATEGY.core, promise: "No more slip claims." },
  positioning: {
    ...EMPTY_STRATEGY.positioning,
    difference: "Made for the two liquids that cause workshop accidents.",
    unlike: "Sawdust", because: "Tested against oil and coolant",
  },
  voice: { description: "Plain and direct.", doSay: [], dontSay: [] },
  pillars: [
    { title: "Tested", body: "Every claim has a test behind it.", proof: "1.2 litres per kilo", icon: "" },
  ],
  boundaries: { ...EMPTY_STRATEGY.boundaries, wordsUsed: ["tested", "absorbs", "workshop"] },
  audience: [
    { name: "Jari", role: "Garage owner", detail: "Two bays", isPrimary: true,
      wants: "A floor that is not slippery", frustratedBy: "Slip claims",
      caresAbout: [], channels: [{ label: "LinkedIn", stage: null }] },
    { name: "", role: "", isPrimary: false, wants: "", frustratedBy: "", caresAbout: [], channels: [] },
  ],
});

describe("the channel list", () => {
  it("has the platforms a founder actually names, including Reddit", () => {
    const ids = CHANNELS.map((c) => c.id);
    for (const id of ["instagram", "tiktok", "linkedin", "facebook", "pinterest", "reddit", "x"]) {
      assert.ok(ids.includes(id as (typeof ids)[number]), `${id} is missing`);
    }
  });

  it("caps the choice at two", () => {
    // A founder posting three times a week across five platforms reaches each
    // one every other week, which is the same as not being there.
    assert.equal(MAX_CHANNELS, 2);
  });

  it("knows what is and is not a channel", () => {
    assert.ok(isChannel("tiktok"));
    assert.ok(!isChannel("myspace"));
    assert.equal(channelLabel("x"), "X");
    // An unknown id renders as itself rather than blank: a stored value from
    // an older list is still information.
    assert.equal(channelLabel("threads"), "threads");
  });
});

describe("how often, turned into a number of posts", () => {
  it("gives every cadence a number the plan can use", () => {
    for (const c of CADENCES) assert.ok(c.perWeek >= 1 && c.perWeek <= 7, c.id);
  });

  it("is a careful three when nothing was chosen", () => {
    assert.equal(postsPerWeek(null), 3);
    assert.equal(postsPerWeek("nonsense"), 3);
    assert.equal(postsPerWeek("daily"), 7);
  });
});

describe("what the strategy already says", () => {
  it("suggests pillars from the strategy's own fields, inventing nothing", () => {
    const out = suggestPillars(strategy());
    assert.ok(out.length > 0);
    assert.equal(out[0].name, "Tested");
    assert.deepEqual(out[0].subjects, ["1.2 litres per kilo"]);
    // Everything suggested has to appear in the strategy somewhere.
    const source = JSON.stringify(strategy());
    for (const p of out) {
      const first = p.name.split(" · ")[0];
      assert.ok(source.includes(first), `${p.name} was invented`);
    }
  });

  it("suggests nothing at all when there is no strategy", () => {
    assert.deepEqual(suggestPillars(null), []);
    assert.deepEqual(suggestAudience(null), []);
  });

  it("does not repeat a pillar under two names", () => {
    const out = suggestPillars(strategy());
    assert.equal(new Set(out.map((p) => p.name.toLowerCase())).size, out.length);
  });

  it("turns the audience into mini profiles and skips the empty ones", () => {
    const out = suggestAudience(strategy());
    assert.equal(out.length, 1);
    assert.equal(out[0].name, "Jari");
    assert.equal(out[0].whereTheyAre, "LinkedIn");
  });

  it("leaves 'where they are' empty rather than guessing it", () => {
    const s = strategy();
    s.audience[0].channels = [];
    assert.equal(suggestAudience(s)[0].whereTheyAre, "");
  });
});

describe("reading the plan the model wrote", () => {
  const good = JSON.stringify({
    summary: "Three posts, two pillars.",
    postsPerWeek: 3,
    channels: ["instagram"],
    mix: [{ pillar: "Tested", share: "2 of 3" }],
    week: [
      { day: "Monday", channel: "instagram", pillar: "Tested", subject: "The coolant test",
        hook: "Coolant is the one that catches people out.", copy: "Full post here." },
    ],
    avoid: ["Posting the same product shot twice"],
  });

  it("reads it out of a code fence", () => {
    const plan = parsePlan("```json\n" + good + "\n```");
    assert.equal(plan?.week.length, 1);
    assert.equal(plan?.week[0].hook, "Coolant is the one that catches people out.");
  });

  it("keeps the post even when a field is missing, rather than dropping it", () => {
    const plan = parsePlan('{"week":[{"copy":"Just the copy."}]}');
    assert.equal(plan?.week.length, 1);
    assert.equal(plan?.week[0].day, "");
    assert.equal(plan?.week[0].copy, "Just the copy.");
  });

  it("drops an entry that is neither a subject nor a post", () => {
    const plan = parsePlan('{"week":[{"day":"Monday"},{"copy":"Real one."}]}');
    assert.equal(plan?.week.length, 1);
  });

  it("counts the week when the model forgot to", () => {
    const plan = parsePlan('{"week":[{"copy":"a"},{"copy":"b"}]}');
    assert.equal(plan?.postsPerWeek, 2);
  });

  it("is null for prose, and an empty week is not a usable plan", () => {
    assert.equal(parsePlan("I could not write a plan."), null);
    assert.equal(parsePlan(null), null);
    assert.equal(planIsUsable(parsePlan('{"summary":"hello","week":[]}')), false);
    assert.equal(planIsUsable(parsePlan(good)), true);
  });
});

describe("the week a report belongs to", () => {
  // Built in local time on purpose: the week a founder is reporting is the
  // one their calendar shows, not the one UTC is having.
  it("is the Monday, whichever day you fill it in", () => {
    assert.equal(weekStart(new Date(2026, 8, 17, 12, 0)), "2026-09-14"); // Thursday
    assert.equal(weekStart(new Date(2026, 8, 14, 0, 30)), "2026-09-14"); // Monday
  });

  it("counts Sunday as the week that is ending, not the one starting", () => {
    assert.equal(weekStart(new Date(2026, 8, 20, 23, 0)), "2026-09-14");
  });
});

describe("week on week", () => {
  const week = (over: Partial<Record<string, number | null>>) => ({
    week_start: "2026-09-14", channel: "instagram",
    posts: null, followers: null, reach: null, engagements: null, ...over,
  }) as Parameters<typeof weekOnWeek>[0];

  it("is the difference, not a percentage", () => {
    const d = weekOnWeek(week({ followers: 120 }), week({ followers: 100 }));
    assert.equal(d.followers, 20);
  });

  it("is null when either week is blank, rather than a rise from nothing", () => {
    assert.equal(weekOnWeek(week({ reach: 400 }), week({})).reach, null);
    assert.equal(weekOnWeek(null, week({ reach: 400 })).reach, null);
  });

  it("says zero when nothing changed", () => {
    assert.equal(weekOnWeek(week({ posts: 3 }), week({ posts: 3 })).posts, 0);
  });
});

describe("the page produces a week rather than promising one", () => {
  // Comments are stripped: both files explain the stub they replaced, and a
  // history note is not a stub.
  const read = (f: string) =>
    readFileSync(new URL(`../${f}`, import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  it("no longer says the synthesis layer ships later", () => {
    // Five questions were asked, stored, and turned into nothing.
    const page = read("app/(app)/brand/channels/page.tsx");
    const route = read("app/api/social-strategy/route.ts");
    assert.ok(!/step 2|awaiting_synthesis|pending: true/i.test(page + route), "the stub is still there");
    assert.ok(route.includes("SOCIAL_PLAN_STABLE"), "nothing asks for a plan");
  });

  it("requires the brand strategy before the questions", () => {
    const page = read("app/(app)/brand/channels/page.tsx");
    assert.ok(page.includes("'gate'"), "a brand with no strategy can still answer five questions");
    assert.ok(page.includes('t(\'social.needStrategy\')'), "the page never says why it stopped");
  });

  it("says which file to run when the columns are missing", () => {
    // Migrations here are run by hand. "Could not find the 'pillars' column"
    // is not something to show a founder.
    for (const f of ["app/api/social-strategy/route.ts", "app/api/social-metrics/route.ts"]) {
      assert.ok(read(f).includes("supabase/social-media.sql"), `${f} does not name the migration`);
    }
  });
});

describe("the hook is not printed twice", () => {
  it("is hidden when the post already opens with it", () => {
    // The hook IS the first line of the post. A plan that fills both fields
    // rendered the same sentence twice, once labelled and once not.
    assert.equal(showHook("1.2 litres per kilo.", "1.2 litres per kilo. That is what it takes on."), false);
    assert.equal(showHook("  Two liquids cause most slips. ", "two liquids cause most slips. Here is why."), false);
  });

  it("is shown when the post starts somewhere else", () => {
    assert.equal(showHook("Two liquids cause most slips.", "Oil. Coolant. The two liquids."), true);
  });

  it("is never shown when there is no hook", () => {
    assert.equal(showHook("", "Anything at all."), false);
  });
});
