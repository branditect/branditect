# Brand strategy — `/brand/strategy`

Design: `reference/strategy.html`.

This page has two readers and must serve both:

1. **A person** — usually a new team member, reading it once to understand the brand.
2. **Branditect itself** — Studio ▸ Write, Create images and AI Chat all read these fields.

Almost every decision below follows from serving both. A field that reads well but can't be cited is half-built; a field the model can use but nobody can read is the same problem in reverse.

---

## Structure

```
Hero                    positioning line + brand pyramid + status
Summary                 the whole strategy as one paragraph
01  Brand core          who we are · what we do · why we exist · our promise
02  Positioning         we are / for / unlike / because  + Not for
03  Audience            segments, each with wants, frustrations, channels
04  Competitive landscape   price ladder + 2×2 map
05  What makes us different  three pillars, each with proof
06  Key messages        tagline + supporting messages tagged by funnel stage
07  Brand principles    how we behave
08  Boundaries          we never / we always + vocabulary
09  Strategic focus     brand goal + this year's priorities
    Where this goes next    Tone of voice · Visual identity · Products
    Where Branditect uses this
```

Nine numbered sections. **Do not add a tenth without removing one** — the same rule that governs the nav governs this page, for the same reason.

---

## The hero

Orange gradient (`--grad-hero`), `--shadow-hero`, same treatment as the Brand Readiness hero on Home. This is deliberate: it makes the two most important surfaces in the app read as siblings.

The headline is **not** "Your brand strategy" — the page title is small kicker text. The large line is the **difference statement**, pulled from section 02. That one sentence is what a new team member needs and what the AI cites most, so it goes where the eye lands first.

### Status chips

Three, in order: last updated, sections complete, tools fed.

`Feeding 4 tools` is not decoration. It is the only place the product tells the user that this page is machine-readable. People fill in a form properly when they know something reads it.

### The brand pyramid

Four tiers, widening downward: Essence → Personality → Benefits → Attributes. The top tier is solid white on the orange; the rest are translucent.

This was promised during onboarding and then never shown again anywhere in the app. It belongs here. The narrowing is not decorative — **the shape is the argument**: many attributes support a few benefits, which support one personality, which resolves to a single idea. If a brand can't narrow, it doesn't have a strategy yet.

Derive it from existing fields where possible: Essence from the difference statement, Attributes from the pillars' proof points. Don't ask the user to type it twice.

---

## The summary paragraph

A generated prose version of the whole strategy, in a lilac panel directly under the hero, before section 01.

**Why it exists:** nobody forwards a dashboard to a new hire. They forward a paragraph. And when the AI needs brand context in a prompt, this is the cheapest, densest thing to send — one paragraph instead of nine sections of JSON.

**Generate it, don't ask for it.** It is assembled from Brand core, Positioning, the promise, the pillars' proof and the principles. Regenerate whenever any of those change. Key phrases are bolded so it can be skimmed in five seconds.

Show a "regenerate" affordance but no free-text editing — an editable summary drifts from the fields it summarises, and then there are two truths.

---

## What's new, and why each earns its place

### `Not for` (in Positioning)

A positioning statement without an exclusion is a description, not a position. "For beauty-conscious consumers" excludes nobody. "Not for salons buying trade equipment, and not for bargain hunters" is what stops the positioning drifting the first time someone wants to chase a cheaper segment.

For the AI it does more: it turns an unbounded audience into a bounded one.

### Proof, on every pillar

Each of the three pillars carries a **Proof** row — a fact with a number in it, in the green wash.

"Professional performance" is an adjective. Every competitor claims it. `110,000 RPM · plasma ion · precision heat` is a fact, and only one brand can claim it.

**This is the single biggest lever on output quality.** Copy generated from adjectives sounds like every other brand in the category; copy generated from facts doesn't. If a pillar has no proof, that is a finding worth surfacing to the user, not an empty field to hide.

### Boundaries (section 08)

**The most valuable section on the page**, and the one most brand strategy documents omit.

Three parts:

- **We never** — four things that would be off-brand, each with the reason. Not "avoid negativity" but "never compete on price, because it contradicts honestly priced".
- **We always** — the positive counterpart, phrased as instructions, not values.
- **Vocabulary** — words we use, words we avoid. Avoided words render struck through.

The reason this matters more than it looks: generative models are far better at avoiding a **named** mistake than at inferring taste. "Don't use the word luxury" is enforceable. "Be tasteful" is not. This section is most of the difference between output that is on-brand and output that is merely competent.

Feed all three parts into every generation prompt as explicit constraints.

### Channels, in Audience

Where the audience decides, tagged by funnel stage: Discovery, Consideration, Decision, Retention.

Discovery copy leads with the result. Decision copy leads with the proof. Same strategy, different order — and without this, generated copy has one register for every context.

The supporting messages in section 06 carry the **same four tags**, so a message can be matched to a stage. That pairing is the point; don't ship one without the other.

### Segments

Audience is a **list**, not a single persona. Pills across the top, one active at a time, plus `+ Add segment`.

A brand with one persona is usually a brand that hasn't asked. But the primary must stay unambiguous — when the AI needs one audience, it takes the primary, so exactly one segment carries that flag.

### The competitor ladder

Rows sorted by price, **with your own brand in the list**, plus the 2×2 map underneath.

Three logo cards beside a map made the reader do the comparison themselves. A ladder with your own price sitting inside it makes the gap the point — and gives the AI a real number to reference when it writes about value.

The map keeps its two axes and stays as it was; it earns its space as the one visual that shows white space rather than describing it.

---

## Section headings

```
[01]  Brand core   The four answers everything else is built on        Edit
```

Number in a tinted square, heading at `--fs-h2`, then a **one-line "why"** in `--fs-xs` muted, then Edit pushed right.

The why-line is doing real work. "Boundaries" means nothing; "The section that stops the AI writing the wrong thing" tells the user why to bother filling it in. Write one for every section and keep it under eight words where possible.

---

## Editing

Edit is **per section**, never one global "Edit strategy" mode that turns 40 fields into inputs at once. The hero's Edit button opens the first incomplete section.

Inline edit affordances (the small pencils) appear on hover on desktop and are always visible on touch. They are `<button type="button">`, never a bare `<button>` inside a form.

---

## Empty and partial states

A section with no content shows a prompt, not a blank card: what the field is for, one example, and a button to generate a draft from the questionnaire.

The completeness chip in the hero counts filled sections. **Do not tie this to Brand Readiness** — readiness has four checks, defined in `spec/readiness.ts`, and the questionnaire is one of them. Two scores that look alike and count different things is exactly the confusion this redesign removed. Word it as `9 of 9 sections complete`, never as a percentage.

---

## Export

Export produces the whole page as PDF, including the pyramid and the summary paragraph — this is the artefact people actually send.

Print styles: white background instead of the orange hero (nobody wants a full-bleed orange page from their printer), sections unbroken across page boundaries, the summary paragraph on page one.

---

## Data

```ts
interface BrandStrategy {
  updatedAt: Date;
  core: { whoWeAre: string; whatWeDo: string; whyWeExist: string; promise: string };
  positioning: {
    weAre: string; forWhom: string; unlike: string; because: string;
    difference: string;          // the hero headline
    notFor: string;
  };
  pyramid: { essence: string; personality: string[]; benefits: string; attributes: string[] };
  audience: Segment[];           // exactly one isPrimary
  competitors: Competitor[];     // includes own brand, isUs: true
  pillars: Pillar[];             // 3, each with proof
  messages: { tagline: string; supporting: Message[] };
  principles: { title: string; body: string }[];
  boundaries: {
    never: { rule: string; reason: string }[];
    always: string[];
    wordsUsed: string[];
    wordsAvoided: string[];
    neverCompromise: string[];
  };
  focus: { goal: string; priorities: { label: string; when: string }[] };
}

type Stage = 'discovery' | 'consideration' | 'decision' | 'retention';

interface Segment {
  name: string; age?: number; role: string; detail?: string;
  isPrimary: boolean;
  wants: string; frustratedBy: string; caresAbout: string[];
  channels: { label: string; stage: Stage }[];
}

interface Pillar { title: string; body: string; proof: string; icon: IconName }
interface Message { text: string; stage: Stage }
interface Competitor { name: string; description: string; price: string; isUs?: boolean;
                       map: { x: number; y: number } }   // 0–100, accessible→ and professional↑
```

`summary` is **not** a stored field. Generate it on read from the above. Storing it guarantees it goes stale.

---

## What this page must not become

A form. It is a **document** that happens to be editable, and it should read as one — prose in the fields, full sentences, no truncation with ellipses. If a value doesn't fit its card, the value is too long and the user should be told so while typing, not clipped afterwards.
