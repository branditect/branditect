# Brand voice archetypes: spec v1

> **Provenance.** Copied into the repo from `claude/brand-voice-archetypes.md` in the Branditect
> project on 2026-09-04, so that code and tests can read it. **The project copy is canonical.** If
> the two ever disagree, the project wins and this file is re-copied — do not edit this one in place.

For onboarding Q18 (voice picker) and Q19 (anti-voice), and the contract `branditect-copywriter`
obeys.

Six archetypes. User picks a **primary**, optionally a **secondary**. Stored as a rubric object,
never as a label string.

---

## 1. The six, with anchors

Three anchors each, spread across categories so a founder sees their own sector. Recognition flagged
so the UI can lead with locale-appropriate anchors.

### Confident & precise
> Few words. No hedging. Lets the thing speak for itself.

| Anchor | Category | EU | US |
|---|---|---|---|
| Rhode | Beauty | ◐ | ● |
| Mercedes-Benz | Auto | ● | ● |
| Aesop | Personal care | ● | ● |

### Warm & human
> Talks like a person who likes you. Contractions, plain words, no distance.

| Anchor | Category | EU | US |
|---|---|---|---|
| Glossier | Beauty | ● | ● |
| Innocent | Food & drink | ● | ○ |
| Bloom | Wellness & drinks | ○ | ● |

*Bloom sits at the high-energy end of this voice: encouraging and community-driven, not irreverent.
It hypes you up; it doesn't mock the category. That's what separates it from Bold & playful.*

### Bold & playful
> Names the category's convention, then breaks it. One joke per piece, not three.

| Anchor | Category | EU | US |
|---|---|---|---|
| Burger King | Food | ● | ● |
| Oatly | Food & drink | ● | ● |
| Duolingo | App | ● | ● |

### Calm & reassuring
> Plain, careful, zero hype. States the risk before the benefit.

| Anchor | Category | EU | US |
|---|---|---|---|
| CeraVe | Beauty | ● | ● |
| Volvo | Auto | ● | ● |
| Philips | Health & home | ● | ◐ |

### Visionary & inspiring
> Talks about what becomes possible, not what the product does.

| Anchor | Category | EU | US |
|---|---|---|---|
| Apple | Tech | ● | ● |
| Nike | Apparel | ● | ● |
| Tony's Chocolonely | Food | ● | ◐ |

### Expert & direct
> Evidence first. Every claim carries its proof in the same sentence.

| Anchor | Category | EU | US |
|---|---|---|---|
| Revolut | Fintech | ● | ◐ |
| Stripe | Payments & tech | ● | ● |
| Dyson | Home & hardware | ● | ● |

● strong · ◐ moderate · ○ weak

### The callout worth putting in the UI

Same category, three different voices. This is what makes the picker teach rather than just collect:

- **Beauty:** Rhode (confident) · Glossier (warm) · CeraVe (calm)
- **Drinks:** Oatly (bold) · Innocent (warm) · Bloom (warm, loud)
- **Auto:** Mercedes (confident) · Volvo (calm)
- **Fintech:** Revolut (expert) · Klarna (bold) · Vanguard (calm)

A beauty founder seeing three skincare brands in three different tiles understands instantly that
this is a real choice, not a vibe.

---

## 2. The rubrics

Every field is what Studio reads. Numbers are targets, not hard fails, except where marked `never`.

### House rules: every archetype inherits these

These are not stylistic preferences, they are the tells that make copy read as machine-written. No
archetype can override them, and a secondary can never unban them.

```yaml
id: house_rules
punctuation:
  em_dash: never          # the single loudest AI tell
  en_dash: never          # except inside numeric ranges (2010-2015)
  semicolon: sparingly    # max 1 per 200 words
  ellipsis: never in body copy
  aside_construction: banned
  # Replace an em dash with: a full stop, a comma, a colon, or parentheses.
  # If none of the four work, the sentence is doing two jobs. Split it.

banned_constructions:
  - "not just X, but Y"
  - "it's not X, it's Y"
  - "more than just"
  - three-item lists used as a rhythmic device rather than because there are three things
  - a sentence fragment appended for emphasis, where the archetype does not allow fragments
  - opening a paragraph with "Moreover", "Furthermore", "Additionally", "That said"
  - "In today's fast-paced world" and every variant

banned_words:
  [delve, tapestry, testament, landscape (figurative), realm, robust,
   elevate, unlock, harness, navigate (figurative), embark, seamless,
   crucial, pivotal, myriad, plethora, foster, leverage (verb),
   underscore, resonate, holistic, bespoke, curated, meticulous]

sentence_opening_variety: no more than 2 consecutive sentences opening with the same part of speech
```

Studio should reject a draft on `em_dash` and `banned_constructions` rather than warn. Those two are
what separate copy that sounds like a brand from copy that sounds like a language model wearing a
brand.

### 1. Confident & precise

```yaml
id: confident_precise
claim_type: product_fact   # opens on the thing itself
sentence_words_avg: 8-12
sentence_words_max: 18
sentences_per_para: 1-2
fragments: allowed
contractions: sparingly
person: third (the product) + "you" for outcomes; avoid "we"-heavy
humour: 0
exclamations: never
emoji: never
superlatives: only when literally verifiable
hedging: banned
jargon_tolerance: 2   # technical terms only when they ARE the proof
cta_style: bare imperative, 1-3 words
cta_examples: ["Shop the set.", "Book a fitting.", "See the spec."]
banned: [amazing, game-changing, revolutionary, unlock, elevate, obsessed,
         literally, so good, we're excited to]
signature:
  - State the fact, then stop.
  - No sentence exists to explain the previous sentence.
  - Lowercase headers are acceptable; shouting is not.
```

### 2. Warm & human

```yaml
id: warm_human
sentence_words_avg: 12-16
sentence_words_max: 25
sentences_per_para: 2-3
fragments: occasional
contractions: always
person: "we" + "you"; first names fine
humour: 2   # light, never at anyone's expense
exclamations: max 1 per 150 words   # high-energy variant: 1 per 60
emoji: social only, max 2 per post
superlatives: sparing
hedging: allowed when honest ("we think", "probably", "still figuring out")
jargon_tolerance: 0   # explain everything
cta_style: invitation
cta_examples: ["Come say hi", "Grab yours", "Have a look"]
banned: [leverage, utilise, solutions, best-in-class, synergy, robust,
         stakeholder, going forward, at scale]
signature:
  - Write like you're texting a customer you actually like.
  - Admitting a limitation builds more trust than hiding it.
  - Contractions in every paragraph or it drifts formal.
```

### 3. Bold & playful

```yaml
id: bold_playful
sentence_words_avg: 6-14
sentence_words_max: 20
sentences_per_para: 1-2
fragments: encouraged
contractions: always
person: "we" + "you"; direct address, second-person dares
humour: 5
exclamations: max 2 per post
emoji: yes, ironic use encouraged
superlatives: yes, knowingly over the top
hedging: banned
jargon_tolerance: 0
cta_style: dare or shrug
cta_examples: ["Go on then", "Try it. Or don't.", "You know you want to"]
banned: [journey, curated, artisanal, thrilled to announce, we are pleased to,
         nestled, passionate about, delighted]
signature:
  - Name the category convention, then break it.
  - One joke per piece. Three jokes is a personality disorder.
  - The target is the category or yourself, never the customer.
guardrail: never punch down; no jokes about price, body, or competence of the reader
```

### 4. Calm & reassuring

```yaml
id: calm_reassuring
sentence_words_avg: 12-18
sentence_words_max: 22
sentences_per_para: 2-4
fragments: never
contractions: moderate
person: "we" + "you"
humour: 0
exclamations: never
emoji: never
superlatives: never
hedging: required where genuinely uncertain. Say what you don't know
jargon_tolerance: 1   # always defined on first use
cta_style: low-pressure, informative
cta_examples: ["See what's covered", "Talk to us first", "Read how it works"]
banned: [hurry, don't miss out, limited time, act now, miracle, cure,
         guaranteed (unless contractually true), transform, instantly]
signature:
  - State the risk or limitation before the benefit.
  - Numbers instead of adjectives, every time.
  - Never create urgency. Urgency reads as pressure, and pressure kills trust here.
```

### 5. Visionary & inspiring

```yaml
id: visionary_inspiring
claim_type: world_belief   # opens on how things should be, THEN the proof
sentence_words_avg: 7-12
sentence_words_max: 16
sentences_per_para: 1-3
fragments: heavy
contractions: yes
person: "we" + "you"; occasional collective ("anyone", "everyone")
humour: 1
exclamations: never   # weakens the register
emoji: never
superlatives: about the change, never about the product
hedging: banned
jargon_tolerance: 0
cta_style: 2-4 words, present tense
cta_examples: ["Start today.", "Make it yours.", "Join us."]
banned: [solution, offering, utilise, best-in-class, industry-leading,
         value-add, disrupt, next-generation]
signature:
  - One big claim, then one concrete proof. Never two claims in a row.
  - Verb-first sentences.
  - Talk about what becomes possible, not what the thing does.
risk_flag: |
  Easiest voice to fake, hardest to earn. If the brand has no proof under the
  claim, this reads as hollow within two sentences. Studio should warn when a
  visionary draft contains zero specifics.
```

### 6. Expert & direct

```yaml
id: expert_direct
sentence_words_avg: 14-20
sentence_words_max: 28
sentences_per_para: 3-5
fragments: never
contractions: moderate
person: "we" / "you" / the system as subject
humour: 1   # dry only
exclamations: never
emoji: never
superlatives: only with a number attached
hedging: banned. State confidence numerically instead
jargon_tolerance: 4   # use the real term, link the definition
cta_style: specific next action
cta_examples: ["Read the docs", "See the fee breakdown", "Compare the rates"]
banned: [seamless, effortless, magical, simply, just, easy, painless,
         powerful, intuitive]
signature:
  - Lead with the number.
  - Every claim carries its evidence in the same sentence.
  - If you can't cite it, cut it.
```

### The one boundary that needs watching

**Confident & precise and Visionary & inspiring collide on paper.** Both run short sentences, both
ban hedging, both lean on fragments. Tested against the same brief they came out nearly identical,
which is why `claim_type` exists:

- **Confident** opens on the product. *"The serum. 2% ceramide, twelve weeks of testing. Thursday."*
- **Visionary** opens on a belief about the world, then proves it. *"Skincare shouldn't need a decoder
  ring. One serum. Two ingredients that matter. Twelve weeks of proof."*

Plus: Confident avoids `we` almost entirely; Visionary needs it. If a generated draft in Visionary
opens on a product fact, it's mislabelled Confident and should be regenerated.

Every other pair separates on at least three parameters, verified against the same brief.

---

## 3. Blend rules: primary + secondary

Without a secondary, six archetypes means six voices across the entire customer base, and the two
most flattering tiles take most of the picks. The secondary is what makes a premium brand not read
as cold.

### What blends and what doesn't

**Structure stays 100% primary.** `sentence_words_*`, `sentences_per_para`, `fragments`, `person`,
`cta_style`. Blending sentence length produces mush. An 11-word average and a 17-word average
average out to something with no rhythm at all.

**Three dials move 30% toward the secondary:**

| Dial | Fields |
|---|---|
| Humour | `humour` |
| Warmth markers | `contractions`, `exclamations`, `emoji` |
| Certainty | `hedging`, `superlatives` |

Rounding: humour rounds to the nearest integer; `contractions` moves one step along
`never → sparingly → moderate → always`; `exclamations` and `emoji` take the *more restrictive* of
the two unless the secondary is Warm or Bold, in which case they take the blended value.

**Banned words only union, never subtract.** The secondary can add to the primary's banned list. It
can never unban a word. This is the rule that stops "Expert & direct + Warm & human" from producing
"seamless."

**`jargon_tolerance` takes the lower of the two.** Clarity is not a thing to compromise toward.

### Worked example

`primary: confident_precise` + `secondary: warm_human`

```yaml
sentence_words_avg: 8-12        # pure primary
sentence_words_max: 18          # pure primary
person: third + "you"           # pure primary
cta_style: bare imperative      # pure primary
humour: 1                       # 0 → 30% toward 2 → 0.6 → 1
contractions: moderate          # sparingly → one step toward always
exclamations: never             # secondary is Warm, but primary's never holds as more restrictive
emoji: never
hedging: banned                 # 30% of "allowed" doesn't cross the threshold
jargon_tolerance: 0             # lower of 2 and 0
banned: [primary list] + [leverage, utilise, solutions, best-in-class, synergy, robust, ...]
```

Result: Rhode's restraint with a pulse. Short declarative sentences, but contractions and the
occasional first-person aside.

### Pairs to grey out

| Pair | Why |
|---|---|
| Bold & playful ↔ Calm & reassuring | Humour 5 against humour 0. The blend produces neither. It reads as a serious brand making one awkward joke. |

### Pairs to allow with a warning

| Pair | Warning |
|---|---|
| Visionary ↔ Calm | "These pull against each other: big claims versus no hype. Works only if every claim has a number under it." |
| Bold ↔ Confident | "Rare but strong. Think a premium brand that's slightly amused by its own category." |

Everything else is fair game. **"No secondary" is a valid answer** and should be a visible option,
not a skip. Very small brands are often better off pure.

---

## 4. How this wires into onboarding

**Q18 becomes two steps:**

- **A.** Six tiles, one line each, ordered by track (service → calm, warm, expert first · digital →
  expert, visionary, warm · physical → confident, bold, warm). Nothing hidden, just ordered.
- **B.** The founder's own announcement, generated from Q6 (what it is), Q11 (who for) and Q13 (what
  changes), rendered in the chosen archetype plus its two nearest neighbours. Confirm or switch.
  Then the secondary tap.

Generic sample copy tests nothing. Because Q18 sits at position 18, the answers to 6, 11 and 13 are
already in hand. The choice is between three versions of *their* message, which is what makes the
answer worth storing.

**Q19 becomes a confirm, not a text field.** The four rejected tiles are already the anti-voice. Show
it back: *"So: never irreverent, never jokey, never hype. Right?"* One tap instead of a blank box,
and it's more accurate than what most founders would type.

## 5. Open

- Whether locale-based anchor ordering ships in v1 or the table is static (static is fine; the
  recognition flags mostly overlap).
- Whether `humour` and `jargon_tolerance` should be user-adjustable sliders in Brand › Voice after
  onboarding, or locked to the archetype until a full re-run.
- The high-energy variant of Warm & human (the Bloom end) is currently one exclamation-rate override.
  If it needs more than that, it's a seventh archetype rather than a variant.
