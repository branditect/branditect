# Settings — phase 1

Reference: `reference/settings.html`.

One page. Everything on it is real today or is one `updateUser` call away — nothing here
needs a migration, and nothing here is a promise.

---

## First, the bug that made this necessary

`components/account-menu.tsx` marks **Profile, Settings and Help all `soon: true`**. So
`/settings` exists, has the language switch in it, and cannot be reached by clicking
anything. Three "Soon" chips out of four items also makes the whole menu read as dead.

`accountMenu.settings` becomes a real link to `/settings`. That is the fix.

## Profile and Settings are one page, not two

The menu implies two destinations. For a single-seat product they hold the same three
fields, and a separate Profile page is a second place to look for the same thing.

**Profile becomes a link to `/settings` as well**, or it goes. It is not a second screen.

---

## What is on it

Four sections, in this order. Everything above the line is live; everything below is named
and visibly not yet.

### 1 · You

| Field | Where it lives | Editable |
|---|---|---|
| Email | Supabase auth | **No.** Read-only, with a line saying to contact support to change it |
| Name | `user_metadata.full_name` | **Yes** |

**The name field is nearly free and worth having.** `lib/useUser.ts:53` already *reads*
`user_metadata.full_name` — nothing has ever written it, so it is always empty and the app
falls back to the email. One `supabase.auth.updateUser({ data: { full_name } })` makes the
greeting on Home say a person's name instead of their email address. No migration, no table.

**Email stays read-only in phase 1.** Changing it means a verification round trip to both the
old and new address, and a half-built version that swaps the address without confirming it is
an account-takeover path. Say it plainly rather than showing a disabled input with no
explanation: *"Email is fixed for now. Write to us and we will change it."*

### 2 · Brand

| Field | Where it lives | Editable |
|---|---|---|
| Brand name | `brands.brand_name` | Yes |
| Website | `brands.website` | Yes |
| Industry | `brands.industry` | Yes, same list as onboarding |

These three are asked in onboarding and then never editable again, which is the actual
complaint hiding behind "minimum settings": someone types their brand name in the first
minute, gets it slightly wrong, and has no way back to it.

### 3 · Language

Already built. Two settings, not one, and the page must keep saying why:

- **Interface language** — what you read.
- **Output language** — what Studio writes, which is what *your customers* read.

Both columns exist on `brands` as of 10 Sep. A founder who has read English software for
fifteen years may well want the interface in English and the copy in Finnish.

### 4 · Account

Sign out, which exists. **Delete account lands here** when queue item 4 ships — and until it
does, this section says the email route and the 30-day answer that `/privacy` promises. Do
not show a disabled Delete button: a delete control that does nothing is the one disabled
control people actually try to press.

---

## Below the line: what is coming, named

A greyed row that says only "Soon" is indistinguishable from a broken one. Each of these
says what it will do, in one line, and is visibly not interactive — no hover, no cursor, no
focus ring.

| | One line |
|---|---|
| **Plan** | Your subscription and what it includes |
| **Credit use** | How much of this month's allowance you have used |
| **Team** | Invite people and share one brand |
| **Notifications** | What we email you about |
| **Billing** | Invoices and payment method |

Five is the right number. More reads as a roadmap nobody asked for; fewer makes the page look
finished when it is not.

**Order them by when they actually arrive**, not by importance. A list where the top item
ships next is a list people stop checking; a list in random order is one they ask about.

---

## Acceptance criteria

1. `accountMenu.settings` is a link to `/settings` and carries no "Soon" chip. Asserted by a
   test, because this is exactly the line that gets re-flagged when someone adds the next
   unfinished item.
2. Name saves to `user_metadata.full_name` and the Home greeting uses it on the next load —
   asserted by setting a name and re-reading the greeting, not by checking the input.
3. Brand name, website and industry save to `brands` and survive a reload.
4. **Every write reports its result.** No `.then(({ error }) => { if (!error) … })`. This has
   now caused two silent failures in this codebase — the onboarding logo upload and the image
   library inserts — and a settings page that says nothing when a save fails is the third.
   Asserted by forcing a failure and expecting a visible message.
5. The five greyed rows are not focusable, not clickable, and each carries its one-line
   description. Asserted by a test that fails if a row has an `onClick` or an `href`.
6. Email is read-only and says why.
7. There is no Delete button until it deletes. A test fails on a disabled control whose label
   contains "delete".
8. Every string on the page comes from `lib/i18n` — this is a new screen, so it starts
   translated rather than joining the 744.

---

## Not in phase 1

Changing your email, changing your password from inside the app (the reset-by-email flow
already exists and is the safer path), profile photos, two-factor, session management,
connected accounts, data export. Each is real work and none of them is what someone means
when they click their own name in the corner.
