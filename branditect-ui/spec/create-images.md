# Studio ▸ Create images — rebuild spec

Reference: `reference/create-images.html`. Open it. Click the example chips, the Where cards,
and both cards under "What are you making?".

**Content area only.** Renders inside `app/(app)/layout.tsx` — the left sidebar and the AI Chat
rail stay. The 1240px wrap is the space between them.

---

## What is wrong with the page today

`app/(app)/studio/create-images/page.tsx` (534 lines) is **rebuilt, not refactored**. Three of its
controls do not do what they appear to, and that is not a styling problem.

| Control | What it looks like | What actually happens |
|---|---|---|
| **Scene Mode** — Studio / Outdoor People / Environment | Three buttons that set the scene | `mode` is posted and **never read by the route**. Changes nothing. |
| **Colour / Wardrobe** | A colour or material for the image | The route writes `They are wearing ${colour}`. Hardcoded to clothing — a product gets described as *wearing* yellow fabric. |
| **Reference images, 1–3** | "1–3 images, Gemini will match the style" | The route sends `images[0]` and drops the rest. The comment in the code says so. |

Also: `dna: null` is posted on every request — an intended brand-context path never wired up.
`app/api/brand/analyse-images/route.ts` exists and is not called from here.

**Naming.** `CLAUDE.md` bans "Architect" as a label. The page is titled **Image Architect**, the
button reads **Generate Architect Vision**, and the breadcrumb says **← Brand Library** — Library
is reserved for saved Studio outputs. All three go. The page is **Create images**, the button is
**Make the image**, and no vendor is named in the UI.

---

## The shape

Two panes: a sticky brief at 412px on the left, a results canvas on the right. Same shape as
Studio ▸ Write, and it exists so the reference and the result are on screen together — the old
single-column form made you scroll past your reference to reach the button.

---

## The brief

### 1 · What are you making? — an explicit either/or

Two cards, one always selected:

| | |
|---|---|
| **A product picture** | Something from your catalogue → reveals the product dropdown |
| **Something else** | People, places, moods → no product, straight on to references |

**This is a real choice, not an optional row.** Most images people make are not product shots, and
an optional "pick a product if you like" strip either gets scrolled past or implies the tool is
only for catalogues. Asking outright costs one tap and makes the rest of the panel honest.

Default to **Something else** when the brand has no products. Otherwise default to
**A product picture** — a brand with a catalogue is usually photographing it.

#### The dropdown

A plain `<select>` of the brand's products, `name` plus variant. Products come from the same
source as `/brand/products`. A product with no images can still be picked; the identity is useful
on its own.

**Picking a product is not the same as adding a reference**, and this is the part that makes the
whole tool work. The user writes *"this product on a silver background"*. With no product
selected, "this product" resolves to nothing and the model invents a bottle.

Selecting one:

1. Adds its images as references, marked `from product` with an accent ring, still removable.
2. Passes identity into the prompt: `name`, `description`, `category`, and any material or colour
   in `tags`. **Never** price, cost, margin, floor price or discount — none of that belongs in an
   image prompt.
3. Resolves "this product", "it" and "the bottle" in the description to that record.

Under it, one line: *"2 product photos added as reference below. The label, shape and colour are
kept exact, and 'this product' in your description means this one."*

#### Switching to Something else

**Removes the product's photos from the references.** Leaving them behind is how you generate a
bottle nobody asked for. References the user added themselves stay.

### 2 · Pick your reference pictures — required

Up to three, from Knowledge ▸ Images, from a product, or uploaded.

**All of them must be sent.** The route currently takes `images[0]`. Send every reference in the
`parts` array. If there is a real reason only one can be used, the UI must stop offering three.

Under the tiles, one read-only sentence in plain words:

> Your pictures are **warm and softly lit**, with **calm, muted colour** and a little grain. New
> images will be made to match.

An earlier draft made this editable chips — `low saturation`, `shallow depth`. That asks a founder
to audit a photographer's vocabulary before they are allowed to make a picture. The system still
reads all of it; it just stops making that the user's problem. **Read-only, plain English, no
jargon.** Generated from the analysis, not hardcoded — if there are no references yet, the line is
absent rather than invented.

### 3 · Where is it? — Studio · Indoors · Outdoors

The one thing a reference picture cannot tell us on its own. A bottle-on-linen shot does not say
whether the new image is a studio setup or a kitchen counter.

**Unlike the old Scene Mode, this must reach the prompt.** A control that does nothing is worse
than no control, because it teaches people the tool does not listen.

Default `Studio` when a product is selected, `Outdoors` otherwise.

**When Where and the description disagree, the description wins.** Someone who taps `Outdoors` and
writes *"on a silver background"* gets the silver background. Where is a hint, not a rule — put it
in the prompt as scene context, never as an override.

### 4 · What do you want to see? — required

One textarea. Placeholder: *"One sentence is enough."* Helper: *"Say it plainly, the way you would
to a photographer."*

Four tappable examples, which fill the box and stay editable:

```
This product on a silver background
A girl running outside wearing a yellow dress
A man on a construction site looking up at the sky
The bottle on a kitchen counter in morning light
```

When a product is selected, the first example uses its real name.

### 5 · Shape

Four aspect buttons drawn at their actual proportions — `1:1`, `4:5`, `9:16`, `16:9`. A drawn
rectangle is read faster than the words.

Then one collapsed field: *"Anything else — props, angle, space for text"*.

### The button

`Make the image`. Disabled until there is at least one reference and a description, and the line
beneath says which is missing: `Add a reference to start` · `Say what you want to see` ·
`2 references read · about 15 seconds`. **Never a silent dead button.**

---

## The canvas

Results are a two-column grid, newest first, with a `Session` / `Saved` toggle.

Each card carries the image, an aspect badge, a **provenance row** — the reference thumbnail and
the look used — and three actions: **Save**, **Get**, **Again**.

- **Save** writes to Knowledge ▸ Images with the brief, the product id and the reference ids
  stored alongside. Generated images then become reference material for the next round, which is
  how a brand's look compounds instead of drifting.
- **Again** re-runs the same brief untouched. The old page held one result in `genResult` and
  overwrote it; keeping the session list is what lets someone compare two attempts.
- The header says **"Nothing is kept unless you save it"**, because a grid that empties on reload
  without warning reads as data loss.

**Streaming state**: render the card frame and a shimmer immediately, with the status line
*"Matching the light and grade from your references…"* — never a bare spinner. A wait that
explains what it is buying you is a different experience from one that does not.

**Failure**: the card shows the reason and a Retry, and the brief is untouched. Never lose the
brief on a failure.

---

## The route

`app/api/brand/generate-from-reference/route.ts` is rewritten, not patched.

```ts
interface Brief {
  subject: string;                       // required
  where: "studio" | "indoors" | "outdoors";
  format: "1:1" | "4:5" | "9:16" | "16:9";
  productId: string | null;
  extra?: string;
}
```

Prompt assembly, in order: the style instruction, the product identity when set, the scene, the
subject, the extra. **Delete the `They are wearing` line entirely** — there is no wardrobe field
any more, and if someone wants a yellow dress they write it in the subject.

Send **every** reference image, not `images[0]`.

Ownership: the route must confirm the product belongs to the caller's brand before reading it.
Take the ownership helper landed at `0832b5b` rather than trusting a `productId` from the client.

---

## Acceptance criteria

1. The sidebar and AI Chat rail render on `/studio/create-images`.
1b. Choosing **Something else** clears the product, removes its photos from the references, and
    sends `productId: null` — asserted by test.
2. No string containing "Architect" appears on the page — asserted by test.
3. Every selected reference reaches the model — asserted by a route test with three images
   asserting three image parts.
4. `where` changes the generated prompt — asserted by snapshotting the prompt for all three values.
5. No prompt ever contains "wearing" unless the user typed it — asserted against a fixture whose
   subject has no clothing.
6. Selecting a product puts its name and description in the prompt and **no price, cost, margin,
   floor price or discount** — asserted by seeding those fields with sentinels and grepping the
   prompt. **MERGE BLOCKER.**
7. A `productId` belonging to another brand is rejected. **MERGE BLOCKER.**
8. The button is disabled with a stated reason until a reference and a subject exist.
9. Save writes to Knowledge ▸ Images and the image survives a reload.
10. Two generations in one session both remain on screen.
11. A failed generation leaves the brief intact.

---

## Build order

1. Route rewrite: the new `Brief`, all references sent, `where` used, `wearing` gone, product
   identity with the ownership check. Criteria 3–7.
2. The page: two panes, steps 0–4, the honest disabled button. Criteria 1, 2, 8.
3. Canvas: session list, provenance, Save to Knowledge. Criteria 9–11.
4. The plain-English style line, generated from `analyse-images` rather than hardcoded.

Step 1 ships before step 2. The controls have to work before they are made prettier — the current
page's problem is not how it looks.

---

## Not building

Inpainting or masking, background removal, upscaling, batch generation across products, a prompt
history browser, model selection, seed control, or any per-image editing beyond regenerating.
