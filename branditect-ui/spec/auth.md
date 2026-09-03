# Auth — login, sign-up, and what happens next

Design: `reference/login.html`. Two states share one layout — sign in and create account.

---

## Routes

Use **two routes, not a client-side tab**. The tab control in the reference is a preview device; in the app each state gets its own URL so the browser back button works, links can be sent directly, and the marketing site can point at either.

```
/login                     Sign in
/signup                    Create account
/forgot-password           Request a reset link
/reset-password?token=…    Set a new password
/verify-email?token=…      Confirm the address
/logout                    POST only — never a GET link
```

Both `/login` and `/signup` render the same split layout; only the left panel's contents differ. Build one `<AuthLayout>` and two thin pages.

### Redirect rules

| Situation | Goes to |
|---|---|
| Signed in, hits `/login` or `/signup` | `/home` |
| Signed out, hits any app route | `/login?next=<path>` |
| After sign-in, `next` present and internal | that path |
| After sign-in, no `next`, questionnaire incomplete | `/onboarding` |
| After sign-in, no `next`, questionnaire complete | `/home` |
| After sign-up | `/onboarding` always |

**Validate `next` before redirecting.** Accept same-origin relative paths only. An unchecked `next` is an open redirect — `?next=https://evil.example` sends your users somewhere else wearing your login page.

---

## Fields

### Sign in

| Field | Type | Rules |
|---|---|---|
| Email | `email`, `autocomplete="username"` | Required. Trim, lowercase before submit. |
| Password | `password`, `autocomplete="current-password"` | Required. No length validation here — old accounts may predate current rules. |

### Create account

| Field | Type | Rules |
|---|---|---|
| Brand name | `text`, `autocomplete="organization"` | Required, 2–60 chars. Becomes the workspace name and seeds the questionnaire. |
| Work email | `email`, `autocomplete="username"` | Required, valid, not already registered. |
| Password | `password`, `autocomplete="new-password"` | Required, **minimum 10 characters**. Check against a breached-password list if you have one. Do not require symbols or mixed case — length beats composition rules, and composition rules push people toward `Password1!`. |

Brand name comes first deliberately: it's what the 20-question flow needs, and asking for it here means the questionnaire opens already knowing who it's for.

---

## Error and status copy

Brand voice applies here as much as anywhere. Say what went wrong and what to do — no apologies, no "Oops!".

| Situation | Message |
|---|---|
| Empty required field | `Enter your email` / `Enter your password` / `Enter your brand name` |
| Malformed email | `That doesn't look like an email address` |
| Wrong credentials | `That email and password don't match` |
| Unknown email at sign-in | **Same message as above.** Never `No account with that email` |
| Password too short | `At least 10 characters` |
| Email already registered | `That email already has an account.` + a link to `/login` |
| Rate limited | `Too many attempts. Try again in 15 minutes.` |
| Server error | `Something went wrong at our end. Try again.` |
| Reset link sent | `If that email has an account, a reset link is on its way.` |
| Reset link expired | `That link has expired. Request a new one.` |

Two of those are security decisions, not copy preferences:

**Wrong credentials and unknown email return the identical message.** Different messages let anyone enumerate which emails have accounts.

**The reset confirmation is deliberately non-committal** — `If that email has an account…` — for the same reason. Show it whether or not the address exists, and take the same amount of time to respond either way.

---

## Security floor

Non-negotiable, and easy to get wrong:

- **Rate limit** both by IP and by email. Sign-in, sign-up, and password reset. Roughly 5 attempts per 15 minutes per email.
- **Hash with Argon2id or bcrypt.** Never store or log a password, and never include one in an error report.
- **Sessions in `httpOnly`, `Secure`, `SameSite=Lax` cookies.** Not `localStorage` — anything that can run JS on your page can read `localStorage`.
- **Rotate the session ID on login** to close session-fixation.
- **CSRF token** on every state-changing form.
- **Verify the email** before the workspace can be shared or invites sent. Reading and building alone can happen unverified — don't block someone from trying the product.
- **`/logout` is POST.** A GET logout link gets fired by link prefetchers and image tags.
- Generic errors to the user, specific ones to the log.

---

## SSO — three buttons, three integrations

The reference shows **Google, Microsoft and Apple**, in that order, above an `or continue with email` divider. Each is separate OAuth work; Apple's has extra requirements (private relay addresses, and Apple mandates its button on iOS if other SSO is offered).

**None of the three are wired.** There is no `signInWithOAuth` call anywhere in the app — sign-in is Supabase email and password only.

Normally the rule is: ship only what you've wired, and delete the rest along with the divider. A dead SSO button is the worst possible first interaction — it's the very first thing a new user touches, and it fails.

**For the demo, they stay, visibly labelled as not-yet-working.** The reference implements this and it is what to build:

- Each button carries `class="demo"` and `aria-disabled="true"` — it is not `disabled`, because a disabled button takes no focus, fires no events, and cannot explain itself.
- A small uppercase `Demo` tag sits at the right edge of each button.
- The provider mark drops to 55% opacity and the label goes `--muted-2`, so the row reads as inactive before anyone clicks.
- Hover or keyboard focus shows a dark tooltip: **Demo version — sign in with email for now.**
- Clicking reveals the same sentence as a persistent tinted note below the group (`.ssonote`, `role="status"` `aria-live="polite"`), auto-hiding after 4 seconds, and moves focus to the email field.

Both the tooltip and the click note are needed. A tooltip alone is invisible on touch devices, and a screen reader gets nothing from a hover state — the `aria-live` note is what makes the click legible to everyone.

**When a provider is actually wired, remove `class="demo"` and its tag from that one button only.** The others keep the demo treatment until they're real.

Order matters: put the one your users actually have first. Brand and marketing people skew Google Workspace; a B2B enterprise skews Microsoft.

When wiring: match on **verified** email only, and if that email already has a password account, **link** it rather than creating a second account.

## Remember me

The checkbox is in the reference, checked by default. It is not decorative — it changes session lifetime, so it needs backend support (a longer-lived refresh token, and a clear maximum).

**If it isn't wired, take it out.** A checkbox that does nothing is worse than no checkbox, because the user believes it worked — and unlike the SSO buttons, there is no honest way to label it. "Demo" on a Google button reads as *this provider is coming*; "Demo" on Remember me reads as nothing at all, and the user still leaves believing they'll stay signed in.

---

## After sign-up: the first run

Sign-up leads straight into onboarding. Four full-screen gates, in order. **Not a modal over a dashboard** — the current app shows a checklist floating on top of a workspace the user hasn't earned yet, and it reopens on every page load.

1. **Answer 20 questions.** One at a time, progress visible, no sidebar behind it. This is the only thing on screen.
2. **Meet your strategy.** The generated document and the brand pyramid, full-screen, as the reward. Export and "this is wrong, redo it" both live here.
3. **Feed Knowledge.** One upload screen. Every file shows `Indexed ✓` as it lands — that visible state is what makes the brain feel real, and it already exists in the current Knowledge Vault.
4. **Make one thing.** Straight into Studio ▸ Write, pre-filled, one click to generate. The first output arrives before they've seen a dashboard.

Only then does `/home` open.

Steps 3 and 4 are skippable; steps 1 and 2 are not. Skipping must be an explicit link, not a close button — and whatever gets skipped shows up as a failing check in Brand Readiness, which is the whole point of that score.

---

## Components

### `<AuthLayout>`

**Two full-height halves, each centring its own content.** Neither is sticky or top-anchored — that's what made an earlier version read as floating.

```
grid-template-columns: minmax(430px, 42%) minmax(0, 1fr);
min-height: 100vh;
```

**Left** — the frosted card, `max-width: 404px`, vertically and horizontally centred in its half. 404 is deliberate: narrower feels cramped with three SSO buttons stacked, wider makes the inputs look like they're waiting for a paragraph. Stripe, Linear and Notion all sit in the 360–420 range.

**Right** — pitch, five feature cards, and the floating product panels, centred as one group so the composition holds at any window height instead of the panels drifting below the fold.

The form is the only thing in its half. A login page has one job; anything competing with the password field is a distraction. Everything persuasive lives on the right, where someone who just wants to get in can ignore it.

**Background** is a warm gradient with an orange organic shape top-left and soft radial blooms — all CSS, no images.

**Responsive:**

| Breakpoint | Behaviour |
|---|---|
| `max-height: 840px` | column padding tightens, panels scale to 88% |
| `max-width: 1360px` | panels scale to 84% |
| `max-width: 1180px` | panels hide; feature cards reflow to a grid |
| `max-width: 900px` | single column, and **the order flips** — pitch first, form second |

That last one is deliberate. A first-time visitor needs the pitch; a returning user scrolls past it in half a second. A wall of marketing above the form is only a problem if the form is hard to reach, and one thumb-flick is not hard.

### The showcase panels

Brand Health, Products, Studio and AI Chat on the right are **real markup, not screenshots** — the chart is inline SVG, the Studio cards use the app's own gradient tokens. They stay sharp at any zoom and get updated when the product changes rather than re-exported.

Only the **product thumbnails** are placeholders: grey tiles with a picture glyph, at `.thumb`.

**The 87% Brand Health figure is marketing furniture.** Keep it hard-coded. Never wire it to a real account — a login page must not display anyone's data before they've authenticated.

### `<AuthForm>`

```ts
interface AuthFormProps {
  mode: 'signin' | 'signup';
  next?: string;
  onSubmit: (values: AuthValues) => Promise<void>;
  error?: string;
  pending?: boolean;
}
```

Controls are `46px` tall with `12px` radius. Focus is `border: var(--accent)` plus `box-shadow: 0 0 0 3px var(--tint-1)` — the ring is the tint token, so it stays on-brand rather than the browser default blue.

The submit button uses `--grad-mark` and shows a pending state. Disable it while in flight; do not disable it before the form is valid, which hides the reason nothing is happening.

### `<PasswordField>`

Text input plus a reveal toggle. The toggle swaps `type` between `password` and `text` and updates `aria-label` between `Show password` / `Hide password`. It is a `<button type="button">` — inside a form, a bare `<button>` submits.

### Feature cards

Five, stacked, each a title and one line:

```
Write on brand      On brand, on strategy, on the facts.
Create images       New visuals based on your products and style.
Do the numbers      Profitability, pricing and offers that make sense.
Brand assets        Logos, colors, guidelines and everything in one place.
More studio tools   Explore all the tools to build and grow your brand.
```

They mirror the Studio cards inside the app, so what someone sees before logging in is what they find after.

**Five is the ceiling.** A sixth turns the set into the feature pile this whole redesign removed. If something goes on, something comes off.

### The pitch

> They have a marketing team. **You have Branditect.**

"Branditect" in accent orange. This line names the competitor without naming a competitor — the rival isn't another app, it's the marketing hire the customer can't afford. It belongs here and nowhere else in the product; it was previously living in an in-app welcome modal that reopened over every page.

---

## Accessibility

- Every input has a real `<label for>`. Placeholders are examples, never labels.
- Errors are tied to their field with `aria-describedby` and announced via `aria-live="polite"`.
- Focus is visible on every control — `outline: 2px solid var(--accent)`.
- The gradient panel is decorative content, not a landmark; the form is inside `<main>`.
- Tab order runs: brand mark → mode links → fields → submit → SSO → footer.
- Contrast: white on `--accent` passes AA. The pills sit on the gradient at 14px/600, which also passes; don't drop them below 13px.

---

## Known approximations in `reference/login.html`

- The tab control is a preview device. Ship two routes.
- The Google mark is inline SVG in brand colours; use Google's official asset and follow their branding rules.
- `onsubmit="return false"` and `autocomplete="off"` are there so the mockup doesn't autofill. **Remove both** — real forms need real autocomplete tokens (`username`, `current-password`, `new-password`), and password managers are a security feature, not a nuisance.
