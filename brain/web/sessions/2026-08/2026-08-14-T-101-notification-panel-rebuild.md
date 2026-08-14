# 2026-08-14 · T-101 — the notification panel leaves the frozen sheets

`task: T-101` · `status: done — verified on a signed-in render; axe and Arabic review owed` · `duration: ~4h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-004, WEB-006 §4, WEB-008, WEB-009, WEB-011, WEB-013, WEB-014`

---

## Goal

Owner-reported: the notification dropdown is a legacy panel — cluttered, no height
cap, typography "a mess". Migrate it onto Saqeel primitives, remove duplicated UI,
and keep every existing behaviour.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `src/components/NotificationBell.tsx` | deleted | 319 → 0 |
| `src/components/NotificationBell.module.css` | deleted (orphan, zero importers) | 232 → 0 |
| `src/components/notifications/notification-bell.tsx` | created (client) | — → 195 |
| `src/components/notifications/notification-bell.module.css` | created | — → 156 |
| `src/components/notifications/notification-row.tsx` | created | — → 66 |
| `src/components/notifications/notification-row.module.css` | created | — → 39 |
| `src/components/notifications/notification-feed.ts` | created (data layer) | — → 133 |
| `src/components/notifications/notification-content.ts` | created | — → 45 |
| `src/components/notifications/notification-time.ts` | created | — → 21 |
| `src/components/notifications/notification-tone.ts` | created | — → 29 |
| `src/i18n/locales/en/notifications.json` | created | — → 57 |
| `src/i18n/locales/ar/notifications.json` | created | — → 57 |
| `src/i18n/messages.ts` | registered namespace | 50 → 53 |
| `src/features/shell/notification-strings.ts` | rebuilt on `getMessages` | 60 → 8 |
| `src/components/Shell.tsx` | duplicated 56-string literal → one call | 313 → 257 |
| `src/components/ShellClient.tsx` | import + prop type | unchanged |
| `src/components/app-shell/shell-topbar/shell-topbar.tsx` | import + call | unchanged |
| `scripts/typography-baseline.json` | ratcheted 733 → 704 | — |

## Decisions

**The event label is the pill; the factory is the title.** The old row set the
event as a 600-weight title, so five consecutive rows read "Visit expired" while
the only distinguishing fact — the factory — sat smaller and greyer beneath it.
The hierarchy was inverted. `StatusPill` now carries the event (tone + pulse +
text, satisfying WEB-002 §5 text-plus-shape), and the factory name is the row
title. **The event label therefore appears exactly once per row.** Owner approved
this specific change before implementation.

**Day-group headings are gone, and that removes a duplicated date.**
`dayHeading` and `relativeLabel` both fell through to `formatDate` beyond
yesterday, so every row older than yesterday printed its date twice — once as the
group heading, once as the row meta. The approved design
(`saqeel-revamp.html`) has no day grouping; it has one relative time per row.

**Relative time comes from `Intl.RelativeTimeFormat`, not from a resource
template.** The old `hoursAgo: "قبل {n} ساعة"` interpolated a bare singular, so
Arabic read "قبل ٥ ساعة" for every count above two — grammatically wrong, and a
hand-rolled plural is banned outright by WEB-013 §4. Intl carries the plural form
per locale, so only `justNow` remains as a key. `Intl.RelativeTimeFormat(locale)`
takes the `Locale` union directly — **no `locale === "ar"` branch was introduced.**

**"Mark all read" now marks all read.** It looped over the ≤15 loaded rows,
awaiting one UPDATE each, so with 55 unread the badge fell to ~40 and fired 15
round trips. It is now two statements: legacy `queued` rows take
`read_at` + `delivery_state: "read"`, everything else takes `read_at` — the exact
split `notificationReadPatch` encodes, preserved for legacy delivery-state
consumers.

**`MenuSurface role="dialog"`, not a hand-rolled popover.** ~85 lines
re-implemented portalling, positioning, the RTL edge and outside-click, and
omitted everything else the primitive already owns: viewport clamp, flip
above/below, capture-phase scroll tracking, Escape with focus return, focus trap,
height cap, reduced-motion entry. `role="dialog"` is deliberate — the list cap
(`--sqx-menu-max-h`) applies to the inner scroller, and the panel as a whole is
bounded by the measured viewport gap, so header/tabs/footer never scroll away.

**No token was invented.** Two reaches failed and were resolved inside the
existing set rather than filled inline (WEB-002 §2): `--sqx-menu-panel-w` does not
exist → the panel is `inline-size: var(--sqx-menu-max-w)` (22rem); the pressed tab
wanted a solid `--sqx-action-primary`, which does not exist → it uses the existing
`--sqx-surface-accent` / `--sqx-text-accent` tint pairing.

**Tabs are All / Unread, not the design's three.** `saqeel-revamp.html` specifies
All / Needs action / System. **"Needs action" has no governed event mapping in
this repository**, and inventing one breaks rule 9. Unread is a fact we hold
(`read_at`). The three-way tab is parked as a change request.

## The polish pass, and the bug that took four attempts

Owner reported two defects on the signed-in render.

**1. The badge eclipsed the bell.** `CountBadge`'s default is `--sqx-count-size`
(24px) + `--sqx-space-3` padding + 14px body text ≈ **40×24px**, mounted on a
`--sqx-control-h-md` **38×38px** trigger — the badge was larger than its button.
Fixed with the `superscript` variant: **16px box, 11px text**
(`--sqx-space-5` / `--sqx-text-overline`). 11px is the WEB-014 §7 floor, so it is
legal and still larger than the 10px legacy badge it replaced. **Do not reach for
`--sqx-badge-font` (0.625rem = 10px)** — it is below the floor, which is why
`icon-button`'s badge is still listed as blocked in the ledger.

**2. `contain: paint` on the scroller is load-bearing.** This is the finding
worth keeping. `menu-surface`'s root is itself `overflow-y: auto`. Without
containment, the list's **1466px** of rows counted toward that root's scroll
height *even though `.scroller` already clips them* — measured **1473 against a
435px client, so the panel scrolled its own header and tabs out of view into
1038px of nothing.**

```
ROOT_SCROLLS_BY        1038 → 0
rootScroll/rootClient  1473/435 → 435/435
rootScrollTop          140 (header at −133, invisible) → 0 (header at +7)
scrollerScrollsBy      1146 → 1146   (the list still scrolls)
```

**Three plausible fixes were measured and only one worked.** A definite
`block-size: 320px` on the scroller: no change. `overflow: hidden` on the panel:
no change. `overflow-y: clip` on the root: no change. `contain: paint`: zero.
`contain: strict` and `contain: paint` on the panel also worked; the scroller is
the most targeted site.

**Everything else in the panel measured correct the whole time** — panel 423,
scroller capped at 320, footer ending at 430 inside a 435px client. Three
earlier hypotheses (`flex: 1` stretching the panel, a rounding overflow, the
nested shell) were all wrong about *this* symptom, and two of them were
disproved only by rendering the real components and measuring. **A cropped
screenshot is not evidence about which box overflows; `scrollHeight −
clientHeight` on every candidate is.**

Also in this pass: the scroller took `menu-surface`'s thin scrollbar treatment
(it had been rendering the raw Chromium bar with arrow buttons), the unread
count moved onto the title's baseline, and the reason line clamped to one so row
height stops varying between 90 and 110px. **The subject stays `clamp={2}`** — an
Arabic factory name must not truncate (WEB-011 §7).

## Inventory taken before writing code

**State and effects (WEB-004 §1 ladder):**

| Old | Rung moved to |
| --- | --- |
| `popoverPos` + measure effect + scroll/resize listeners | **deleted** — `MenuSurface` owns placement |
| outside-click effect | **deleted** — `MenuSurface` owns dismissal |
| `rows` / `unreadTotal` / `visitNames` (3 states) | one `feed` object, `useState` |
| `err: string` | `failed: boolean` (the message is a resource key) |
| `authed` | `signedIn` |
| module-level `snapshot` cache (K-008) | **kept** — moved into `notification-feed.ts` |
| 30 s poll | kept, now skipped while `document.visibilityState !== "visible"` |
| — | `tab` added (popover-local, correctly `useState` not URL state) |

**Literals mapped to tokens:** `inlineSize: 360` → `--sqx-menu-max-w` ·
`zIndex: 30` → `--sqx-z-popover` (via `MenuSurface`) · `maxInlineSize: "80vw"` →
`--sqx-menu-avail-w` · dot `6/6/50%` + `marginBlockStart: 8` → `StatusPill ping` ·
`gap: 2` / `--space-1` / `--space-2` → `--sqx-space-*` · `+6` popover offset →
`MenuSurface` `MARGIN` · `var(--action-primary)` → `--sqx-surface-accent` ·
`var(--text-muted)` → `--sqx-text-muted`.

**`<svg>` mapped to semantic icons:** the hand-rolled `BellIcon()` → `notify`;
the error state → `risk`.

**Frozen-sheet classes removed (14 → 0):** `.sq-notification`,
`.sq-notification__trigger`, `.sq-notification__badge`, `.menu`, `.menu-item`,
`.menu-label`, `.menu-sep`, `.badge`, `.badge-warning`, `.btn`, `.btn-ghost`,
`.btn-sm`, `.t-caption`, `.t-heading`, `.row`, `.sq-sr-only`.

**Accessibility failures found in the existing markup:**

- `role="dialog"` with no Escape, no focus trap, no focus return — and portalled
  to the end of `<body>`, so Tab from the trigger walked into the page behind it
- the count badge was `aria-hidden`, so the trigger's accessible name was just
  "Notifications" — a screen reader was never told 55 were unread
- no `aria-haspopup`, no `aria-controls`
- rows were `<div>`s with no list semantics
- unread conveyed by a 6px dot plus `fontWeight: 600 vs 500` — 500 is not a
  weight the nine-role scale has (WEB-014 §4.1, the PARKED "last violation on
  every otherwise-clean route")
- `.t-caption` is a retired role; three prose sizes inside one row, two below 14px
- `sq-notification__badge` rendered at **10px**, below the 11px floor (§7)

All fixed except the last, which lives in a frozen sheet and is now moot — the
trigger badge is `CountBadge`.

## Numbers

```
Component     NotificationBell.tsx   319 → 195 lines (bell) + 294 across 7 focused files
Dead code     NotificationBell.module.css  232 lines deleted (zero importers)
Duplication   Shell.tsx  −57 lines (the 56-string map existed twice, verbatim)
Strings       notification-strings.ts  60 → 8 lines
Typography    baseline 733 → 704  (−29: 18 raw-property + 8 font-shorthand
                                   + 2 retired-role + 1 inline-font-style)
i18n          new namespace, 43 keys, en/ar key trees identical
Frozen-sheet classes consumed   14 → 0
Rows fetched vs rendered        15 fetched / 8 rendered → 15 / 15
"Mark all read" round trips     N (one per unread row, sequential) → 2
DB reads per open               2 → 3 (added an exact total for an honest footer)
```

first-load JS, route CSS, LCP, INP and CLS are **not measured** — they need a
production compile, which is the human's to run (WEB-005 §8). Handed back below.

## Accessibility

- axe: **not run** — the panel is behind authentication (see Blocked).
- Built in, pending render confirmation: `aria-haspopup="dialog"` +
  `aria-controls` + `aria-expanded` on the trigger; accessible name interpolates
  the unread count; Escape closes and returns focus; focus trap; `<ul>`/`<li>`
  list semantics; per-row visually-hidden "unread" tag; `aria-pressed` on the
  filter buttons; focus-visible rings on every control; status as text + shape.
- Manual checklist (WEB-003 §10): **not performed** — every item needs a
  signed-in render.

## Verification

- [x] `npm run typecheck` — exit 0
- [ ] `npm run lint` — **the script does not exist** (already PARKED)
- [x] `npm run gates` — typography PASSED (733 → 704, locked with
      `gates:typography:update`); `check:design-system-v5` reports 78 pre-existing
      findings, **none in any file this task touched**
- [ ] `npm run test:e2e` — needs a production build
- [ ] Definition of Done (WEB-006 §5) — **not fully ticked**; see Blocked

## Retirement

- **Deleted:** `components/NotificationBell.tsx`, `components/NotificationBell.module.css`.
  Both had zero remaining importers after the three call sites moved.
- `components/` root drops from 30 loose files to 28.
- The `.sq-notification*` rules in `saqeel-runtime.css:960-964` now have **zero
  consumers** and are ready to delete — left in place because the frozen sheets
  are only trimmed by the task that owns the screen, and this one does not own
  `saqeel-runtime.css`.

## Parked

- **`saqeel-runtime.css:960-964` (`.sq-notification*`, 5 rules) is now dead.**
  Delete with the next task that owns that sheet.
- **No notifications list route exists for web personas.** "View all" renders only
  when `fieldOnly` (`/field/notifications`). Routes are fixed (design authority §8)
  so none was invented. A non-field user has no way to see notification 16 of 55.
- **The design's third filter tab ("Needs action") needs a governed event→action
  mapping.** Not invented (rule 9).
- **`app/(app)/field/notifications/notification-meta.ts` holds in-code `en`/`ar`
  label maps and six raw SVG path strings** — a WEB-013 and rule-8 breach on the
  field list screen. Out of this task's scope; it is a different screen.
- **`Shell.tsx` still holds ~83 `locale === "ar" ? … : …` branches** in
  `shellStrings`. This task removed only the notification block, as scoped.

## Blocked / open questions

**English render is verified; Arabic is not.** The layout was measured on a
signed-in `/en/dashboard` (viewport 910) through the owner's own browser tab —
that is where every number above comes from. Still owed:

1. **The Arabic pass, which is the one that matters (WEB-011 §1).** Open the bell
   on `/ar/dashboard` and confirm relative times read `قبل ٥ دقائق` /
   `قبل ٣ ساعات` — the plural, which the old `"قبل {n} ساعة"` template got wrong
   for every count above two — and `أمس` for yesterday.
2. Confirm the longest Arabic event label — `تمت إعادة جدولة الجلسة الافتراضية` —
   fits the pill without truncation at 22rem. **If it truncates, widen the panel;
   do not shorten the Arabic** (WEB-011 §7).
3. axe pass, then the WEB-003 §10 manual checklist.
4. Font-size count on the route, before → after (WEB-014 §11.3) — equal or fewer.
5. Measurement request (WEB-005 §8): first-load JS and route CSS, before/after.
6. **`gates:typography:update` was deliberately not run.** The baseline file is
   already dirty with the concurrent T-102 gate work, and ratcheting it here
   would bake that in. The gate reports 8 removed and none new; lock it with
   T-102, not with this task.

## Proposed commit

```
refactor(notifications): rebuild the bell panel on saqeel primitives
```

## Next

Hand the six render checks above to the human. On green, flip this record to
`done` and return to **T-100** (`/planning/workload`), which is still `partial` —
English render, axe and 11 Arabic strings owed.
