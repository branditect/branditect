# Finnish

Three separate problems get called "add Finnish", and they cost wildly different amounts. Doing them
in the order they are usually done wastes the most money on the least valuable one.

---

## The three

| | Size | Value to a Finnish customer |
|---|---|---|
| **What Studio writes** | Small, and half-done by accident | **High.** This is the product |
| The marketing site and onboarding | 3 pages plus 19 questions | **High.** This is where trust is won |
| The app's interface | ~1,100 strings | **Low.** Finnish B2B staff read English software daily |

The intuition is to translate the interface first because it is the most visible. It is the least
valuable of the three, and the most work.

---

## 1 · Output language: do this now, before anything else

**Nothing in the codebase sets a language for generated copy.** No route in `app/api` names one, and
`brands` has no column for it. Studio writes in whatever the model infers from the brand's own inputs.

A Finnish brand with a Finnish strategy probably gets Finnish output today. Probably. Uncontrolled,
unasserted, and liable to switch mid-draft or come back in English when a document happens to be in
English.

```sql
ALTER TABLE brands ADD COLUMN IF NOT EXISTS output_language    TEXT NOT NULL DEFAULT 'en';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS interface_language TEXT NOT NULL DEFAULT 'en';
```

**Two columns, not one, and this is the point of the whole spec.** They are different questions and
conflating them is the standard mistake. A Finnish founder who has used English software for fifteen
years may well want the interface in English out of habit and the copy in Finnish because that is
what her customers read. Someone else wants the reverse. Storing one value forces a wrong answer on
half of them, and splitting it later is a migration on live brands.

Every generation route then states the language explicitly rather than letting the model guess. That
is a one-line addition per route and it is the difference between a feature and an accident.

Asked once, in onboarding: *"What language should we write in?"* — separate from the interface
setting, which lives in Settings.

## 2 · The voice rubrics do not survive translation

`claude/brand-voice-archetypes.md` is written for English and several fields are meaningless outside
it. This is the expensive part and the one that fails quietly.

| Field | In Finnish |
|---|---|
| `contractions: always` | Finnish has no contractions. The field is undefined, not false |
| `sentence_words_avg: 12-16` | Finnish agglutinates. *"Tilauksesi lähti tänä aamuna"* is four words where English needs seven. Every band is roughly a third too high |
| `banned_words: [delve, tapestry, seamless…]` | Meaningless. Finnish has its own machine-written tells and no one has written that list |
| `em_dash: never` | **Survives.** Ajatusviiva is the same giveaway |
| `fragments`, `humour`, `hedging`, `claim_type` | Survive. They are about rhetoric, not grammar |

So roughly half the rubric transfers and half does not.

**Do not translate the rubrics field by field.** Per language, the archetypes need:

1. **Recalibrated length bands.** Measure real Finnish brand copy rather than dividing by a
   guessed constant. The Bloom and Innocent anchors have Finnish equivalents worth measuring.
2. **A Finnish banned-word list.** The English one exists because someone noticed the tells. Someone
   has to notice the Finnish ones. Candidates to test, not to assume: *ratkaisu, innovatiivinen,
   saumaton, hyödyntää, kokonaisvaltainen, ainutlaatuinen*.
3. **`contractions` replaced by a Finnish register marker.** The thing it was measuring — distance
   between writer and reader — shows up in Finnish as spoken-form versus written-form
   (*mä/sä* against *minä/sinä*), and in verb person. That is the equivalent field, not a translation
   of the English one.

### Suspend the fields that do not transfer, not the whole check

An earlier draft said to disable the rubric check entirely for non-English brands. That is too
blunt. Split it by field:

| Runs in Finnish | Suspended until Finnish rubrics exist |
|---|---|
| `fragments`, `humour`, `hedging`, `claim_type`, `exclamations`, `emoji`, `superlatives` | `sentence_words_avg`, `sentence_words_max`, `sentences_per_para` |
| `em_dash`, `en_dash`, `ellipsis`, `banned_constructions` | `contractions` |
| `person`, `cta_style`, `jargon_tolerance` | `banned_words` and the per-archetype `banned` lists |

Everything in the left column is about rhetoric and punctuation, and holds in any language.
Everything in the right depends on English morphology or English vocabulary.

**A suspended field reports as suspended, never as passing.** The check panel says which rules it
could not apply and why. A check that silently passes vacuously is worse than no check, because it
is believed.

## 3 · The marketing site — deferred, deliberately

Not now. It is public and needs real locale URLs for search, which is a different mechanism from the
rest of this, and it can be added later without disturbing anything below.

Noted for whenever it comes back: the VAT copy is already Finland-specific at 25.5%, so the Finnish
version is arguably the more natural one.

## 4 · Onboarding

The 19 questions in `lib/onboarding-questions.ts`, one file, 498 lines. High value: this is the first
hour, it is where someone decides whether the tool understands their business, and it is the one
place where reading in a second language is genuinely taxing because the questions are abstract.

## 5 · The interface

~1,100 user-facing strings across `app/` and `components/`, no i18n library, no locale handling.

Mechanical, but two things stop it being trivial:

- **The copy is opinionated.** `CLAUDE.md` requires the diagnosis rather than the compliment, and
  sublabels that carry real state. A flat translation of opinionated copy reads cheap, which is worse
  than English for a brand tool.
- **It is behind login**, so it needs no locale routes — a user preference and a dictionary. That is
  a much smaller change than the marketing site, and no route churn.

Extract strings to a dictionary in one pass before translating anything. Translating in place means
doing the extraction later anyway, with twice the diff.

---

---

## The decision

**A language switch inside the app. Finnish means Finnish everywhere: interface, onboarding and
generated copy.** The marketing site stays English for now.

### Where the switch lives

- **On the login page**, so the app comes up in the right language before anyone is inside it.
- **In Settings**, as two separate controls — interface and output — per section 1.

Default from the browser's `Accept-Language` on first visit, and **only as a default.** Once someone
has chosen, the choice wins forever. Detection that overrides a stated preference is the most
irritating bug in this whole area.

### Two things this needs that translation alone does not

**A layout pass.** Finnish is long. *Visual identity* becomes *Visuaalinen identiteetti*, roughly
twice the width, and the sidebar, the pill buttons and the type chips were all sized against English.
Every one needs checking at the narrowest supported width. This is the difference between a
translated app and a broken one, and no translator catches it.

**A decision on which nouns translate.** `CLAUDE.md` requires nav labels to be plain nouns that mean
one thing each. Some translate cleanly and some do not:

| English | Finnish | |
|---|---|---|
| Brand | Brändi | translates |
| Numbers | Luvut | translates |
| Knowledge | Tieto / Tietopankki | needs a decision |
| Studio | Studio | keep |
| Home | Etusivu | translates |
| AI Chat | Tekoälychat / AI-chat | needs a decision |

A half-translated nav reads as unfinished unless the untranslated words are obviously product names.
**Studio is a product name and stays. Everything else translates or the mix looks accidental.**
Saara decides `Knowledge` and `AI Chat`.

---

## Order

1. **`output_language` and `interface_language` columns, and every generation route stating the
   language.** Half a day. Turns the current accident into a feature.
2. **Field-level suspension of the rubric checks, reported as suspended.** Stops a silent lie.
3. **Extract the ~1,100 interface strings to a dictionary.** No translation yet. This is the step
   that must not be skipped: translating in place means doing the extraction later anyway, with twice
   the diff.
4. **The switch**, on login and in Settings, with `Accept-Language` as a default only.
5. **Finnish dictionary and the onboarding questions**, then the layout pass at the narrowest width.
6. **Finnish rubrics** — measured against real Finnish copy, not translated. Last, and it can wait
   until there are Finnish brands to measure.

Steps 1 and 2 are worth doing whatever else happens, because they are true today: the app is already
producing Finnish for Finnish brands and already checking it against English rules.

---

## Not building

Machine translation of the interface without a human pass, per-locale pricing, right-to-left support,
a language switcher on every page, or translating the brand's own content. What a founder writes
about their own brand is theirs and stays in the language they wrote it.
