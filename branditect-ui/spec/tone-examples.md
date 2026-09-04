# Tone of voice — demonstrate the six, don't describe them

Reference: `reference/tone-examples.html` — read it for the **layout**, not the vocabulary.

**This spec previously proposed twelve new registers. That was wrong and is withdrawn.** See the
decision below.

Governing document: `claude/brand-voice-archetypes.md` in the project. This amends onboarding Q18
step A only.

---

## The decision: the six stay, exactly as they are

The six archetypes are not labels. Each is a rubric Studio obeys — `sentence_words_avg`,
`sentences_per_para`, `fragments`, `contractions`, `person`, `humour`, `hedging`,
`jargon_tolerance`, `cta_style`, a banned-word list, and `claim_type`, which exists because
Confident & precise and Visionary & inspiring collided on paper and needed a field to separate them.
On top of that sit blend rules for a secondary, house rules that ban the em dash and the other
machine tells, and Q19, whose anti-voice is derived from the four tiles nobody picked.

Twelve registers with an example sentence each have none of that.

| Option | Why not |
|---|---|
| **Twelve replace the six** | Trades six enforceable rubrics for twelve labels. Studio stops being able to check anything, and Q19 loses the four-unpicked-tiles mechanism it is built on |
| **Twelve display, mapped to six on save** | Shows a distinction the system cannot honour. Someone picks `Witty` and `Candid`, both collapse into Bold & playful, and the screen has promised a precision that does not exist. Same family as a count that lies |

**Neither.** Six tiles, six rubrics, unchanged. Q19 untouched.

---

## What does change: the tiles demonstrate rather than describe

Q18 step A is six tiles with *"one line each"* — a description of the voice. A description of a voice
is the thing people cannot evaluate; that is the whole reason the step gets skipped.

**Give every tile the same message, written in that archetype's own rubric.** Holding the message
constant is what makes six voices comparable: six unrelated sample lines means reading six different
things and inferring the difference, where six versions of one sentence shows it.

> **The message:** telling a customer their order has shipped.

A dispatch note, deliberately — every one of these customers sends one, and none of them sends a
perfume tagline. The voice is demonstrated on their own work.

### Draft lines, to be validated before use

| Archetype | Line |
|---|---|
| **Confident & precise** | *"Shipped this morning. Track it."* |
| **Warm & human** | *"Good news. It's on its way to you, and you can see where it's got to here."* |
| **Bold & playful** | *"It's out the door and it's not looking back. Go on, watch it travel."* |
| **Calm & reassuring** | *"Your order was dispatched today. Most arrive within three working days, though weather can add one."* |
| **Visionary & inspiring** | *"On its way. One less thing between you and the work."* |
| **Expert & direct** | *"Dispatched 14:20 today, tracked end to end. Delivery estimate Thursday, based on the last 200 orders."* |

**These are drafts and must be checked against their own rubrics before they ship** — sentence-length
band, fragments, contractions, person, humour, CTA style, banned words, and the house rules. An
example line that violates the rubric it is illustrating teaches the wrong thing to every founder who
reads it, and it is the one defect on this screen that compounds.

That check is mechanical, so make it a test rather than a review: see criterion 3.

### Keep the anchors already specified

`claude/brand-voice-archetypes.md` gives three anchor brands per archetype with recognition flags,
and the cross-category callout — *Rhode · Glossier · CeraVe, three beauty brands in three different
tiles*. That callout is the thing that makes the picker teach, and it should be on the screen.

Anchors are **named, never quoted**. Saying a voice is like Glossier is ordinary comparison and needs
no source. Putting a sentence in Glossier's mouth needs a source that secondary material cannot
honestly provide, and a plausible-looking quotation nobody published is a fabrication under a real
company's name.

### Step B is unchanged and is still better than this

Section 4 of the archetype doc has step B generate the founder's **own** announcement from Q6, Q11
and Q13 in three archetypes. That is stronger than any fixed example, because it is their content.
Nothing here replaces it. Fixed lines on step A make the first choice possible; step B confirms it
with their own words.

---

## Layout

From `reference/tone-examples.html`, with six cards instead of twelve: **three across, two rows**,
all visible, no paging and no filter. Rail keeps the guide-left, input-right shape.

Each card carries four things:

| | |
|---|---|
| **The archetype** | The heading. What is being chosen |
| **Its one-line definition** | From the archetype doc, e.g. *"Few words. No hedging. Lets the thing speak for itself."* |
| **The anchors** | `like Rhode, Mercedes-Benz, Aesop` — small, grey, named only |
| **The line** | The same message in that voice. The evidence |

The message being demonstrated is stated once above the grid, not repeated on every card.

---

## Acceptance criteria

1. Six tiles render, all at once, no paging or filter, ordered by track as the archetype doc
   specifies (service · digital · physical).
2. Every tile shows the archetype, its definition, its anchors and one line, and **every line is a
   version of the same message.**
3. **Each tile's line satisfies its own archetype's rubric** — sentence-length band, fragments,
   contractions, person, humour, CTA style, banned words, and the house rules including
   `em_dash: never`. Asserted by running the same validator Studio uses over
   `lib/tone-examples.ts`. If no such validator exists yet, this criterion is where it gets built.
4. No line is attributed to an anchor brand, and no anchor brand appears inside quotation marks —
   asserted by a test over the data.
5. What is stored is the archetype rubric object, not a label string and not an anchor brand name —
   as `claude/brand-voice-archetypes.md` requires. Asserted by reading the saved row.
6. Q19's anti-voice still derives from the unpicked tiles and still shows four.
7. Selection persists across leaving and returning to the step.
8. The step completes with a primary alone, with a primary and secondary, and **"no secondary" is a
   visible option rather than a skip.**
9. Skipping the step still works and still routes as it does today.
10. The rail keeps its shape and fits the viewport — the existing smoke assertion covers it.

Criterion 3 is the one that matters. Everything else is layout.

---

## Build order

1. The six lines in `lib/tone-examples.ts`, and the rubric validator over them. Criteria 3, 4.
   **If a line fails its rubric, rewrite the line, never the rubric.**
2. The tile grid. Criteria 1, 2.
3. Wiring, alongside the existing store. Criteria 5, 6, 7, 8, 9.

---

## Not building

A seventh archetype. Three of the withdrawn twelve — Candid, Rugged, Homely — have no home in the
six, and that is a deliberate limit: the archetype doc treats a seventh as a product decision with
its own rubric, blend rules and a re-think of Q19, not as a tile. If founders keep reaching for a
voice the six cannot hold, that is evidence worth collecting, and then it is its own piece of work.

Also not building: per-brand generated examples on step A (that is step B), audio, a scoring quiz,
user-added anchors, or any quotation of a real company's copy.
