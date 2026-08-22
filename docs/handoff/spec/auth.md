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

## Google OAuth — a decision, not a default

The reference includes a `Continue with Google` button because brand and marketing people mostly live in Google Workspace and it removes a password entirely.

**If you're not wiring it for launch, delete the button and the `or` divider.** A dead SSO button on a login screen is worse than no SSO — it's the first interaction a new user has, and it fails.

If you are wiring it: match on verified email, and if an email already has a password account, link rather than create a second one.

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

Split grid, `1fr / 1.08fr`. Left is white and holds the brand mark, the form, and a small footer. Right is the gradient panel with the tagline, one line of copy, and the six capability pills.

Below `900px` the panel moves **above** the form (`order:-1`) and shortens — a first-time visitor on a phone still needs the pitch, but it can't push the form off-screen.

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

### Pills

Six, each with its own icon, in this order:

```
Create a brand strategy          → Brand ▸ Strategy
Know your tone of voice          → Brand ▸ Tone of voice
Write posts, emails and ads      → Studio ▸ Write
Create your on-brand images      → Studio ▸ Create images
Understand your pricing and margins → Numbers
Ask anything about your brand    → AI Chat
```

Ordered as: what the visitor doesn't have yet, then what they'll open the app for weekly, then the two claims no competitor can make. Icons match the sidebar glyphs so the nav feels familiar on first login.

**Six is the ceiling.** Adding a seventh turns the set into the feature pile this whole redesign removed. If something new goes on, something comes off.

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
