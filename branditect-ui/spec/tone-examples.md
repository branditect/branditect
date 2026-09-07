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

### Second draft, counted against the bands

The first draft was rejected on five of six, correctly. It was written for terseness and broke
`sentence_words_avg` on nearly every line: *"Shipped this morning. Track it."* averages 2.5 words
against a floor of 8. The lesson is that a dispatch note is naturally shorter than most of these
rubrics allow, so the sentences have to carry more than the message strictly needs.

Word counts below are per sentence, and paragraph breaks are shown, because `sentences_per_para` is
a separate constraint from the average.

**Confident & precise** — `avg 8-12 · max 18 · 1-2 per para · fragments ok · no hedging · CTA bare imperative 1-3 words · opens on the product`

> Your order left the workshop this morning and is now with the courier. It is scheduled to arrive
> on Thursday before noon.
>
> Track it.

`13 · 9 · 2` → average **8.0**, max 13. Paragraphs of 2 and 1.

**Warm & human** — `avg 12-16 · max 25 · 2-3 per para · contractions always · we + you · CTA invitation`

> Good news, your order's on its way to you and should reach you on Thursday. It went out this
> morning, packed by the same people who make it.
>
> Have a look at where it's got to.

`15 · 13 · 8` → average **12.0**, max 15.

**Bold & playful** — `avg 6-14 · max 20 · fragments encouraged · humour 5 · no hedging · CTA dare or shrug`

> It's out the door and it's not looking back. Thursday it lands on your mat.
>
> Go on, watch the little van do its thing.

`9 · 6 · 9` → average **8.0**, max 9. The first draft's joke used *"unless"*, which a hedging
detector would flag whatever it means.

**Calm & reassuring** — `avg 12-18 · max 22 · 2-4 per para · fragments never · hedging required · no urgency`

> Your order was dispatched this morning and is now with the courier. Most deliveries arrive within
> three working days, though winter weather can add one. You can see where it is at any point, and
> we will tell you if anything changes.

`12 · 13 · 17` → average **14.0**, max 17. One paragraph of three. No fragments.

**Visionary & inspiring** — `avg 7-12 · max 16 · fragments heavy · contractions yes · no hedging · CTA 2-4 words present tense · opens on a belief, then the proof`

> A workshop floor should never be the reason somebody slips on their way to the bench. That's why
> this exists, and why it's on its way to you now.
>
> Thursday. Watch it come.

`15 · 13 · 1 · 3` → average **8.0**, max 15.

**This is the line the whole `claim_type` distinction rests on.** Confident opens on the order.
Visionary opens on how a workshop ought to be and only then arrives at the product. At a dispatch
note's length the two would otherwise read identically, which is exactly the collision the archetype
document warns about, and length alone cannot separate them.

**Expert & direct** — `avg 14-20 · max 28 · 3-5 per para · fragments never · hedging banned, state confidence numerically · CTA specific next action`

> Your order was dispatched at 14:20 today and is tracked at every handover between here and your
> door. Delivery is Thursday, on the evidence of the last 200 orders through this route, which
> arrived in a median of two days. Nothing in the current weather forecast for that route changes
> the date. Full tracking, including every scan, is on the order page.

`18 · 22 · 12 · 10` → average **15.5**, max 22. One paragraph of four.

The first draft opened *"Dispatched 14:20 today, tracked end to end"*, which is a fragment, and
Expert bans fragments outright.

---

**These are still drafts. Re-run the validator; do not assume the counting above is right.** If a
line fails, rewrite the line, never the rubric.

### `sentences_per_para` applies to body paragraphs, not the CTA

Warm's closing paragraph is one sentence against a `2-3` band. It stays, and the rule is scoped
rather than the line rewritten. **The evidence is inside the archetype document itself:**

| Archetype | `sentences_per_para` | `cta_style` |
|---|---|---|
| Confident & precise | 1-2 | bare imperative, **1-3 words** |
| Calm & reassuring | **2-4** | low-pressure, informative |
| Expert & direct | **3-5** | specific next action |

If the band governed the CTA paragraph, Calm would need a two-to-four-sentence call to action and
Expert a three-to-five-sentence one. Both rubrics would then contradict their own `cta_style`. The
band is about body prose.

**This is an interpretation, not a relaxation, and the distinction matters** — scoping a rule
immediately after it catches something is exactly how checks quietly stop meaning anything. So it
gets the same treatment as the fragment detector: pinned in both directions, in the same commit.

- A **body** paragraph outside its band still fails. Add a case that proves it.
- A final paragraph consisting only of the CTA does not.
- A one-sentence paragraph in the **middle** of a note is a body paragraph and still fails.

Keep the failing cases even where they are inconvenient.

**This belongs in the canonical document eventually, not only here.** `claude/brand-voice-archetypes.md`
in the project is the source of truth, and the repo copy is not to be edited in place. Proposed
wording for section 2, for Saara to add there:

> `sentences_per_para` applies to body paragraphs. A closing paragraph containing only the CTA is
> exempt, since several archetypes specify a CTA shorter than their own paragraph band.

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
