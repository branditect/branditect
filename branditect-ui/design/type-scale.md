# Type scale

Every text role on the Home screen, with the exact values used in `reference/dashboard.html`. Font is Plus Jakarta Sans throughout.

The scale is set to **Airbnb density**: 14px body, 12px meta, 22px section headings. Product UI does not use 40px text — that's a marketing-page size. Shrinking the page title is what gives the readiness card room to be the loudest thing on screen.

| Role | Size | Weight | Colour | Notes |
|---|---|---|---|---|
| Page title | 26px | 700 | `--ink` | `letter-spacing:-.7px` |
| Page subtitle | 14px | 400 | `--muted-2` | bold span inside uses `--ink-2` / 600 |
| Section heading (`Studio`) | 22px | 700 | `--ink` | `-.5px`; its trailing `small` is 13px/500 `--muted-2` |
| Card heading (`What's next`) | 16px | 700 | `--ink` | `-.2px` |
| Card head link (`View all`) | 12px | 600 | `--accent` | underlined, 2px offset |
| Nav item | 14px | 600 | `--ink-2`, active `--accent` | row 36px, icon 20px |
| Nav sub-item | 13px | 500 | `--muted` | |
| Studio card title | 16px | 700 | per card | `-.3px` |
| Studio card body | 12px | 500 | per card, ~84% opacity on dark | |
| List row title | 13px | 700 | `--ink` | `What's next` items |
| List row sublabel | 11px | 500 | `--muted` | carries real state, never filler |
| List row action | 12px | 700 | `--accent` | |
| List row done state | 12px | 700 | `--green` | with 13px check icon |
| Activity row title | 13px | 600 | `--ink` | |
| Activity timestamp | 12px | 400 | `--faint` | |
| Readiness kicker | 13px | 700 | `#fff` | |
| **Readiness score** | **46px** | 700 | `#fff` | `-2px`; one use only |
| Readiness pill | 13px | 700 | `#fff` | on `rgba(255,255,255,.22)` |
| Readiness copy | 12px | 600 | `rgba(255,255,255,.94)` | |
| Knowledge tile value | 18px | 700 | `#fff` | tabular-nums |
| Knowledge tile label | 10px | 500 | `rgba(255,255,255,.82)` | |
| Uppercase label (`TRAINED`) | 10px | 700 | `--ink-3` | `letter-spacing:1px` |
| Chat panel title | 18px | 700 | `--ink` | `-.4px` |
| Chat suggestion | 12px | 600 | `--ink-2`, first `--accent` | |
| Chat bubble | 12px | 400 | `#fff` | |
| Chat answer | 12px | 400 | `--ink-2`, bold spans `--ink`/700 | `line-height:1.6` |
| Plan value (`Pro`) | 19px | 700 | `--accent` | |
| User name | 13px | 700 | `--ink` | |

## Rules

**Body default is 500, not 400.** The brand runs slightly heavier than a stock UI. Weight 400 is reserved for meta text — timestamps, the page subtitle, chat message bodies. Getting this wrong is the most visible way to make it look off-brand, and it was the single biggest miss in an earlier build.

**Tabular numerals** (`font-variant-numeric: tabular-nums`) on anything that counts: knowledge tile values, the readiness score, the `3 / 4 · 75%` footer.

**Two heading levels must not collide.** Section headings sit at 22px specifically so card headings at 16px read as their children. If a card heading grows to 20px, nothing reads as the parent.
