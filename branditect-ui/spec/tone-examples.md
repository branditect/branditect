# Tone of voice — show, don't ask

Reference: `reference/tone-examples.html`. Amends the tone-of-voice step in `spec/onboarding.md`.

---

## The change

Today the step asks the person to describe their tone of voice into a box. That is a blank page, and
blank pages are where onboarding stops.

**Show one message written twelve ways, and ask which ones sound right.** Recognition is easy where
description is hard: almost anyone can point at three lines that feel close in ten seconds, and
almost nobody can write a voice brief from nothing. The picks become the answer. The text box stays,
demoted to *"in your own words"* — a refinement rather than the whole task.

This is not a cosmetic addition. It changes the step from one people skip to one they finish.

---

## How many fit — twelve, all at once

**Twelve registers, three across, four rows.** No paging, no filter, no `show more`.

Twelve fits because each card is short: a register name, a comparator, and one sentence. And twelve
is about the point where the distinctions stop being distinctions — a thirteenth register would be
a shade of one already there, which makes the choice harder rather than richer.

Each card carries three things and no more:

| | |
|---|---|
| **The register** | The heading — `Playful`, `Candid`, `Premium`. This is what is being chosen |
| **The comparator** | `like Duolingo, Innocent`. Smallest type on the card, grey |
| **The line** | The same message, written in that register |

---

## The lines are ours, and that is the point

The original plan quoted real brands. Do not. Two reasons, and the second is the stronger one.

**First, it cannot be sourced honestly.** Confirming that a specific sentence appeared verbatim in a
specific company's own copy is not something secondary sources support — they paraphrase taglines
routinely. A plausible-looking quotation nobody published, printed under a real company's name, is a
fabrication, and it is the one failure on this screen that actually matters.

**Second, holding the message constant teaches better.** Twelve unrelated slogans means reading
twelve different things and inferring the difference between them. Twelve versions of one sentence
shows it. That is a real gain, not a consolation:

> **The message:** telling a customer their order has shipped.

| Register | Like | The line |
|---|---|---|
| Playful | Duolingo, Innocent | *"It's out the door and it's not looking back. Track it →"* |
| Warm | Headspace, Glossier | *"Good news — your order's on its way. Here's where it is."* |
| Plain-spoken | Slack, GitHub | *"Your order shipped today. Track it here."* |
| Bold | Virgin, Red Bull | *"Shipped. Go get it."* |
| Premium | Louis Vuitton, Aesop | *"Your order has left us. Follow its journey."* |
| Expert | IBM, Cisco | *"Dispatched today and tracked end to end. Follow it here."* |
| Purposeful | Patagonia, WWF | *"On its way, in packaging you can compost. Track it here."* |
| Witty | Netflix, Oatly | *"Your order has left the building. No encore."* |
| Rugged | Harley-Davidson, Carhartt | *"Packed, loaded and rolling. Track it."* |
| Homely | IKEA, Ben & Jerry's | *"It's on its way to you. Pop the kettle on."* |
| Encouraging | Peloton, Nike | *"It's on its way. You're going to love it."* |
| Candid | Buffer, Monzo | *"It shipped a day late — sorry about that. Here's the tracking."* |

**Naming a brand as a comparator is not quoting it.** "Like Duolingo" is ordinary comparison and
needs no source. The names stay because they are the recognisable anchor — that was the right
instinct in the original request — but they are the smallest thing on the card and nothing is put in
their mouth.

Choosing the shipping notification matters too: it is a message every one of these customers actually
sends, unlike a perfume tagline. The register is being demonstrated on their own work.

### A second message, optional

`Show me these as product descriptions` re-renders the same twelve registers against a different
message. One control, one extra array in the data file, and it settles the doubt a founder has when
a register reads well on a notification and they cannot picture it selling something. Build it only
after the rest works.

---

## Nothing here is per-brand

These are fixed examples, the same for every account. No generation, no personalisation, no cost.
The whole set is a static file, which is why this is cheap to build and cheap to keep.

---

## Acceptance criteria

1. Twelve cards render, all at once, with no paging or filter.
2. Every card shows a register, a comparator and exactly one line, and every line is a version of
   the same message.
3. Selecting cards is multi-select, and the selection persists across leaving and returning to the
   step — asserted with the existing questionnaire resume test.
4. The step can be completed with only picks, only text, or both. **None of the three is blocked** —
   asserted by three tests.
5. What is stored is the register, not the comparator brands — nothing downstream should read
   "Duolingo" as a tone value. Asserted by reading the saved row.
6. `lib/tone-examples.ts` holds twelve entries, each with a unique register, at least one
   comparator and exactly one line, and **no entry is presented as a quotation from the comparator**
   — asserted by a test over the data.
7. Skipping the step still works and still routes as it does today.
8. The rail keeps its guide-left, input-right shape and fits the viewport — the existing smoke
   assertion covers it.

---

## Build order

1. `lib/tone-examples.ts` with the twelve, plus the data test. Criterion 6.
2. The card grid. Criteria 1, 2.
3. Wiring to the answer, alongside the text box. Criteria 3, 4, 5, 7.
4. Optional: the second message. Not needed for any criterion.

---

## Not building

Per-brand generated examples, audio, a voice quiz that scores you onto an axis, letting the user add
their own comparator brands, or quoting any real company's copy. The point is a ten-second
recognition step, and every one of those turns it back into work — or into something that needs a
lawyer.
