/**
 * One message, written in each of the six archetypes' own voices.
 *
 * Step 1 of branditect-ui/spec/tone-examples.md, which amends onboarding Q18
 * step A only. The tiles used to carry a description of each voice, and a
 * description of a voice is the thing people cannot evaluate — which is why
 * the step gets skipped. Every tile now carries the same message written in
 * that archetype's rubric, so the difference is shown rather than inferred.
 *
 * THE SIX ARE UNCHANGED. An earlier draft of the spec proposed twelve new
 * registers; that was withdrawn, and rightly. The six are not labels, they are
 * rubrics Studio obeys, and Q19's anti-voice is derived from the four tiles
 * nobody picked. Twelve labels would have traded six enforceable rubrics for
 * none and broken Q19's mechanism. Nothing here adds a seventh.
 *
 * ANCHORS ARE NAMED, NEVER QUOTED. Saying a voice is like Glossier is ordinary
 * comparison and needs no source. Putting a sentence in Glossier's mouth needs
 * a source that secondary material cannot honestly provide, and a
 * plausible-looking quotation nobody published is a fabrication under a real
 * company's name. So `line` carries no quotation marks and never names an
 * anchor, and toneExampleProblems() below is the test of that, not a promise.
 *
 * The lines are validated against each archetype's rubric by lib/tone-rubric.ts.
 * Read that file's header first: the governing document the spec names is not
 * in this repository, so the validator enforces the house rules in full and
 * only those per-archetype properties the in-repo definitions actually state.
 * Where a line was rewritten from the spec's draft, the reason is on the entry.
 */

import { ARCHETYPES, type ArchetypeId } from "./onboarding-questions.ts";

/** The message every line below is a version of. Stated once above the grid. */
export const BASE_MESSAGE = "Telling a customer their order has shipped.";

export interface ToneExample {
  /** The archetype this demonstrates. Criterion 5 stores the rubric, not a label. */
  id: ArchetypeId;
  /** Anchor brands, named only. Smallest type on the card. */
  anchors: string[];
  /** BASE_MESSAGE in this archetype's voice. Ours. Never attributed. */
  line: string;
}

/**
 * Anchors come from ARCHETYPES.think, not from a second list here. The spec's
 * layout section writes "Rhode, Mercedes-Benz, Aesop" where the repo has
 * "Rhode, Mercedes, Aesop"; keeping both would be two sources that can
 * disagree, and this repo has already been bitten twice this week by exactly
 * that. The repo wins, and a test asserts the two stay in step.
 */
function anchorsFor(id: ArchetypeId): string[] {
  return ARCHETYPES[id].think.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Order is the archetype document's: service, digital, physical. TILE_ORDER in
 * lib/onboarding-questions.ts already varies this per track, and criterion 1
 * defers to it — this array is the data, not the running order.
 */
export const TONE_EXAMPLES: ToneExample[] = [
  {
    id: "confident",
    anchors: anchorsFor("confident"),
    line: "Your order left the workshop this morning and is now with the courier. It is scheduled to arrive on Thursday before noon.\n\nTrack it.",
  },
  {
    id: "warm",
    anchors: anchorsFor("warm"),
    line: "Good news, your order's on its way to you and should reach you on Thursday. It went out this morning, packed by the same people who make it.\n\nHave a look at where it's got to.",
  },
  {
    id: "bold",
    anchors: anchorsFor("bold"),
    line: "It's out the door and it's not looking back. Thursday it lands on your mat.\n\nGo on, watch the little van do its thing.",
  },
  {
    id: "calm",
    anchors: anchorsFor("calm"),
    line: "Your order was dispatched this morning and is now with the courier. Most deliveries arrive within three working days, though winter weather can add one. You can see where it is at any point, and we will tell you if anything changes.",
  },
  {
    id: "visionary",
    anchors: anchorsFor("visionary"),
    line: "A workshop floor should never be the reason somebody slips on their way to the bench. That's why this exists, and why it's on its way to you now.\n\nThursday. Watch it come.",
  },
  {
    id: "expert",
    anchors: anchorsFor("expert"),
    line: "Your order was dispatched at 14:20 today and is tracked at every handover between here and your door. Delivery is Thursday, on the evidence of the last 200 orders through this route, which arrived in a median of two days. Nothing in the current weather forecast for that route changes the date. Full tracking, including every scan, is on the order page.",
  },
];

/**
 * The cross-category callout the archetype doc specifies, and the thing that
 * makes the picker teach: three beauty brands sitting in three different tiles.
 */
export const CROSS_CATEGORY_CALLOUT = {
  anchors: ["Rhode", "Glossier", "CeraVe"],
  note: "Three beauty brands, three different tiles. The category is not the voice.",
};

export function toneExample(id: ArchetypeId): ToneExample | null {
  return TONE_EXAMPLES.find((e) => e.id === id) ?? null;
}

/** "like Rhode, Mercedes-Benz, Aesop" — comparison, not attribution. */
export function anchorLabel(example: ToneExample): string {
  return `like ${example.anchors.join(", ")}`;
}

export function isAnchorName(value: string): boolean {
  const v = value.trim().toLowerCase();
  return TONE_EXAMPLES.some((e) => e.anchors.some((a) => a.toLowerCase() === v));
}

/**
 * Criterion 4, as a function rather than a promise in a comment: every way an
 * entry would be presenting its line as something an anchor brand said.
 */
export function toneExampleProblems(e: ToneExample): string[] {
  const problems: string[] = [];

  // Straight and typographic quote marks both. The reference page wraps each
  // line in curly quotes directly beneath the anchor names, which is exactly
  // the impression this rules out — so no quoting is baked into the data, and
  // the card must not add it back.
  if (/(^|[\s(\-])["'‘“«]|["'’”»]([\s.,!?)\-]|$)/.test(e.line)) {
    problems.push("line is wrapped in quotation marks");
  }

  for (const name of e.anchors) {
    const n = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`—\\s*${n}\\b|\\bby ${n}\\b|\\b${n}\\s*(said|says|wrote)\\b|\\(${n}\\)`, "i").test(e.line)) {
      problems.push(`line attributes itself to ${name}`);
    }
    if (e.line.includes(name)) problems.push(`line names ${name}`);
  }

  if (!e.line.trim()) problems.push("line is empty");
  if (e.anchors.length === 0) problems.push("no anchor");
  if (!ARCHETYPES[e.id]) problems.push(`${e.id} is not one of the six archetypes`);
  return problems;
}
