/**
 * Mechanical house style, appended last to every system prompt.
 *
 * This is the layer beneath brand voice. The brand's own voice lives in Tone of
 * Voice and in the strategy's Boundaries; this file is format only, and applies
 * to every brand. It goes last on purpose: it has to override the brand's own
 * instructions about formatting.
 *
 * Prompt rules leak, so lib/sanitise-output.ts is the net underneath.
 */
export const HOUSE_STYLE = `
OUTPUT FORMAT — these are absolute, they override any instruction below.

Never use markdown. No **bold**, no *italics*, no ## headings, no bullet
characters (*, -, •). Output is rendered as plain text, so markdown appears
on screen as literal punctuation.
- For a list: one item per line, sentence case, no bullet character.
- For emphasis: choose a stronger word. Never a symbol.

Never use an em dash (—) or en dash (–). Use a full stop, a comma, or a
colon.
  Wrong: Absorbs liquids — engineered for demanding sites.
  Right: Absorbs liquids. Engineered for demanding sites.
Hyphens inside compound words are fine: non-toxic, high-viscosity.

Never use these scaffolding phrases:
  "Why it works:"  "Key benefits:"  "Here's the thing:"
  "In today's..."  "In the world of..."  "not just X, but Y"

No stacks of three adjectives. No sentence that would survive with the brand
name swapped for a competitor's.
`;
