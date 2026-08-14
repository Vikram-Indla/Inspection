# 2026-08-14 · T-105 — the header stopped starving its search, and the date scope became clearable

`task: T-105` · `status: done — measured at seven widths in both directions` · `duration: ~2h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-004, WEB-008, WEB-009, WEB-011, WEB-013`

---

## Goal

Owner-reported: the header is cluttered, the search is "almost a small box you
can't see anything typed in", it is "not responsive at all", and the date range
is stuck on a value that Reset will not clear.

## What changed

| File | Action | Note |
| --- | --- | --- |
| `saqeel/date-range-picker/date-range-picker.tsx` | added opt-in `clearable` | committed inside `a115bc9a` |
| `app-shell/shell-topbar/shell-topbar.tsx` | deleted `defaultDateRange()` / `isoDay()` | committed inside `a115bc9a` |
| `app-shell/shell-topbar/shell-scope-controls.tsx` | unset display + `clearable` | committed inside `a115bc9a` |
| `i18n/locales/{en,ar}/common.json` | `scope.anyDate` | committed inside `a115bc9a` |
| `app-shell/shell-topbar/shell-topbar.module.css` | search floor, scope yields, measured breakpoints, focus-expand | this task |

**Bookkeeping note:** the first four landed in the concurrent typography commit
`a115bc9a` rather than one of their own — the tree was committed wholesale while
this work was in flight. They are in HEAD and verified there; history was not
rewritten to separate them.

## The measurements that drove it

Every number is from the owner's signed-in session, not a mock.

**Before:**

```
vw     search   input    scope    verdict
1440   298      248      368      usable
1280   138       88      368      cramped
1100    26        4      368      collapsed
 961    26        4      368      collapsed
 768    26        4      368 in a 204px parent → OVERLAPPING
 640   full     usable   hidden   best of all widths
 430   HIDDEN     —      hidden   no search at all
```

**After** (range applied — the widest scope state — both directions):

```
vw     dir   search  input   scope    overlap  doc overflow
1440   ltr   298     248     368      0        0
1440   rtl   310     260     357      0        0
1361   rtl   231     181     357      0        0
1100   ltr   374     324     hidden   0        0
 961   rtl   384     334     hidden   0        0
 768   rtl   244     194     hidden   0        0
 640   rtl   272     222     hidden   0        0
 430   ltr    44 →  384 on focus      0        0
 430   rtl    44 →  384 on focus      0        0
```

## Decisions

**The search now has a floor and the scope yields, not the reverse.** `.scope`
sized to its content and `.search` was the only flexible sibling, so search
absorbed every shortfall — 4px of usable input across the whole 900–1300 band.
`.search` takes `min-inline-size: var(--sqx-grid-min-sm)` and `.scope` takes
`flex: none`.

**The breakpoint is measured against the scope's WIDEST state.** This is the
part that matters. An unset scope is 220px; a scope carrying an Arabic range —
`من ١٦ يوليو ٢٠٢٦ إلى ١٤ أغسطس ٢٠٢٦` — is **357px**, and 726px of the bar is
fixed overhead. 357 + the 224px floor + the gap needs 593px of `.controls`,
which arrives at ~1350px. **A first attempt set the breakpoint at 1160 against
the unset state; it measured clean until a date was picked, then spilled again.**
That is precisely how the original overlap shipped. The breakpoint is 1360.

**Search is never removed; it collapses and expands on focus.** It was the one
control deleted below 480px while locale, theme and AI all survived. There is
genuinely no room for a field beside five actions at 430px (measured: 62px box,
12px input), so below 560px it becomes a touch-target-sized icon that expands
over the bar. `:focus-within` carries it, so **tap-to-open costs no client
state**; the input covers the collapsed box so the tap lands on it and stays
focusable while transparent.

**`clearable` is opt-in, and that is the whole point.** `reset()` cleared only
`draftFrom`/`draftTo` and never called `onChange`, while `apply` is
`disabled={!draftFrom || !draftTo}` — so a cleared range **could not be
committed by any sequence of clicks**. Reset was a dead end by construction.
Making it commit for everyone would have changed the contract for seven other
call sites, so the picker takes `clearable` and only the shell passes it.

**The header no longer asserts a filter that is not applied.** `defaultDateRange()`
seeded last-30-days for display only; the URL held no `from`/`to`. The chip now
reads `anyDate` until someone picks something.

## Inventory

- **7 other `DateRangePicker` call sites** — planning bulk/immediate/single,
  visits board/filter-bar/map-filters, reschedule-form. **None passes
  `clearable`**, so `reset()` takes the identical old path. The only behavioural
  branch is `if (clearable)`.
- No new token. `--sqx-grid-min-sm` (14rem) is the floor and `--sqx-grid-min-lg`
  (24rem) was already the cap; `--sqx-touch-target` is the collapsed size.
- `.identity` in the user menu already collapsed at 640 — left as found.

## Accessibility

- The collapsed search keeps its `aria-label` and stays keyboard-focusable;
  Tab reaches it and focus expands it, so the control is not keyboard-only-hidden.
- Collapsed size is `--sqx-touch-target` (2.75rem), at the WCAG 2.2 target floor.
- axe not run — owed.

## Verification

- [x] `npm run typecheck` — exit 0
- [x] `npm run gates` — typography reports removed/none-new; design-system 0 findings in `shell-topbar`
- [x] Seven widths × both directions, with the range applied and unset
- [x] Clear round-trip: load → `(none)`/`Any date` → Last 7 days →
      `?from=2026-08-08&to=2026-08-14` → **Reset** → `(none)`/`Any date`,
      panel closed, focus returned
- [x] Arabic: `dir="rtl"`, `lang="ar"`, `نطاق التاريخ` / `أي تاريخ`
- [ ] axe — owed
- [ ] Per-route sweep of the 1360 breakpoint — owed

## Parked

- **Icon-only scope chips would buy back 1160–1360px**, where the scope is now
  hidden. It needs a `compact` prop on **both** `date-range-picker` and `select`
  — raised, not filled inline (WEB-002 §2). Until then, a 1280 laptop has no
  header date/region scope; page-level filters still apply.
- The five action slots still take 470px (~33% at 1440). The owner ruled to keep
  all five in the bar; folding locale + theme into the user menu would reclaim
  ~120px and lower the 1360 breakpoint materially.
- `defaultDateRange()` removal assumes every consumer treats an absent
  `from`/`to` as "no scope". That was already the live URL state, so no reader
  changed — but no route-by-route audit was done.

## Proposed commit

```
fix(shell): give topbar search a floor and let the scope yield
```

## Next

axe on the topbar, then the `compact` scope-chip change request.
