# 2026-08-07 · T-005a — Kill the native dropdown and date picker

`task: T-005a` · `status: done` · `duration: 3h`
`rules applied: WEB-002 §2 (suspended for the pre-approved list), WEB-003, WEB-008, WEB-009`

---

## Goal

Replace `<select>`, `<input type="date">` and the `<details>` panel in the topbar
scope controls with tokenised primitives built on one shared popover surface, and
re-saturate the dark ink and green ramps.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `components/saqeel/menu-surface/menu-surface.tsx` | created | 102 |
| `components/saqeel/menu-surface/menu-row.tsx` | created | 32 |
| `components/saqeel/menu-surface/menu-surface.module.css` | created | 110 |
| `components/saqeel/select/select.tsx` | created | 143 |
| `components/saqeel/select/select.module.css` | created | 60 |
| `components/saqeel/date-range-picker/date-range-picker.tsx` | created | 157 |
| `components/saqeel/date-range-picker/calendar-month.tsx` | created | 75 |
| `components/saqeel/date-range-picker/date-range-picker.module.css` | created | 184 |
| `components/app-shell/shell-topbar/shell-scope-controls.tsx` | rebuilt | 80 → 96 |
| `components/app-shell/shell-topbar/shell-topbar.module.css` | modified | 502 → 417 |
| `components/app-shell/shell-topbar/shell-topbar.tsx` | modified | +8 strings |
| `components/saqeel/icon/icon-registry.ts` | modified | +3 glyphs |
| `components/saqeel/index.ts` | modified | +5 exports |
| `app/saqeel.css` | modified | 17 token values, 5 tokens added |

## Definition of done — the two greps

```
$ grep -rn '<select\|<option\|type="date"\|<details' apps/web/src/components/app-shell/shell-topbar
exit=1   ZERO matches

$ grep -rnE '#[0-9A-Fa-f]{3,8}|rgba?\(|[0-9]px|[0-9]rem|[0-9]em' \
    components/saqeel/menu-surface components/saqeel/select components/saqeel/date-range-picker
exit=1   ZERO literals
```

**The first grep as the prompt wrote it — across all of `app-shell` — returns one
line**, and it is not the bug:

```
components/app-shell/shell-rail/shell-nav-group.tsx:63:    <details
```

That is the rail's nav-group disclosure from T-004: a native accordion with its
own `<summary>`, deliberately zero-JS. The prompt's own scope says "do not touch
the rail", and outside-click is meaningless for an inline accordion — the failure
it describes ("the panel will not close unless you click the summary again") is a
property of a *popover* built on `<details>`, which is what the date panel was and
what the rail's disclosure is not. Left in place. Narrow the DoD grep to
`shell-topbar` or exclude `shell-nav-group.tsx`.

One literal did have to go: the menu enter animation is specified as
`translateY(-4px)`, and `-4px` is not a token. `--sqx-space-2` is exactly
`0.25rem`, so it is `translateY(calc(var(--sqx-space-2) * -1))`.

## Tokens

Added from the pre-approved list — WEB-002 §2 was suspended for these only:

```css
--sqx-control-pad-icon: 2.25rem;
--sqx-menu-pad: 0.375rem;
--sqx-menu-row-h: 2rem;
--sqx-menu-max-h: 20rem;
--sqx-day-cell: 2.25rem;
--sqx-rim-light   light: inset 0 1px 0 rgb(255 255 255 / 0.85)
                  dark:  inset 0 1px 0 rgb(255 255 255 / 0.045)
```

`--sqx-mirror` already existed. No token outside the list was added.

**`--sqx-rim-light` changed shape, and that had a consequence.** It was a
*colour* consumed by `--sqx-elevation-1…4` as `inset 0 1px 0 var(--sqx-rim-light)`.
It is now the whole shadow, so all four elevation tokens were rewritten to
compose `var(--sqx-rim-light)` directly. Without that edit every dark elevation
would have produced `inset 0 1px 0 inset 0 1px 0 rgb(…)` — invalid, and all four
shadows would have dropped silently. No token was renamed; the old colour form no
longer exists.

## The ramps — every claimed ratio verified

Applied exactly as specified, then measured. **All 20 claims are correct**, none
adjusted:

```
on the new dark surface #01140B      claimed   measured
  ink-600  #40775E                     3.63      3.63
  ink-550  #538D72                     4.90      4.90
  ink-400  #7BA793                     7.04      7.04
  ink-300  #A6C9B9                    10.56     10.56
  ink-100  #E2F3EB                    16.50     16.50
green-800 #004C29 with white          10.2      10.17
green-750 #006134 with white           7.6       7.61
accents on #01140B  green-400 10.13 · green-300 14.67 · success 11.59
                    warning 12.06 · danger 5.85 · info 12.34 · live 15.71 · ai 6.55
```

**`--sqx-surface-canvas` now resolves to `#000A05`** — confirmed by walking the
token chain, not by reading the declaration:

```
dark  --sqx-surface-canvas   -> --sqx-ink-1000   -> #000A05
dark  --sqx-surface-default  -> --sqx-ink-950    -> #01140B
dark  --sqx-surface-subtle   -> --sqx-ink-900    -> #021D10
dark  --sqx-surface-raised   -> --sqx-ink-850    -> #052918
dark  --sqx-surface-chrome   -> --sqx-green-950  -> #001A0E
```

### The chrome gradient — restated, deliberately not wired

`--sqx-gradient-chrome` was added with the specified dark stops
(`#06321E → #021D10 → #01140B`) and **nothing consumes it**. Two turns before
this task the owner said: *"I believe it's a bad idea to have a gradient as a
sidebar and header background. The sidebar, Header, and body should have flat
colors."* The rail, topbar and drawer are flat `--sqx-surface-chrome`.

Restating the token honours this prompt's instruction; leaving it unconsumed
honours the newer design decision. Wiring it back is a one-line change in three
modules — say so and it is done. Text on the lightest stop was measured anyway:
primary 12.31:1, muted 5.25:1, both as claimed.

**One number worth watching:** flat chrome `#001A0E` against canvas `#000A05` is
only **1.10:1**. The rail and topbar dividers on `--sqx-border-strong` (3.48:1 on
chrome) are what draw that edge. They are load-bearing.

## Decisions

**1. MenuSurface owns all three dismissal behaviours, and nothing else may.**
`pointerdown` on `document` closing when the target is outside both panel and
trigger; `Escape` closing and returning focus to the trigger; optional focus trap.
The `<details>` date panel had none of these, which is the live bug the prompt
describes. Select and DateRangePicker pass a `triggerRef` and get all three free.
Neither builds its own popover (WEB-009 §13).

**2. `Select` is a `<button role="combobox">` driving a `role="listbox"` surface**
with `aria-activedescendant` tracking a `role="option"` row — never a native
`<select>`. Full APG: Space/Enter/↓ opens, ↑↓ move, Home/End jump, single-letter
type-ahead wrapping, Enter selects, Escape closes and returns focus, Tab closes
and moves on. The selected row's check gutter is reserved on unselected rows
(`visibility: hidden`, not `display: none`) so every label starts on one axis
(WEB-009 §12).

**3. The calendar is 42 `<button>` cells with `Intl` doing the work.**
`Intl.NumberFormat(locale)` renders Arabic-Indic digits, `Intl.DateTimeFormat`
gives each cell a full accessible date label and the weekday/month headers. In-range
days use square corners with only the week's two ends rounded, via
`border-start-start-radius`/`border-end-end-radius` — logical, so the range caps
mirror in RTL with no `dir` rule.

**4. Two files per component where the component exceeded its budget.**
`menu-row.tsx` and `calendar-month.tsx` are separate files beside their parents;
`date-range-picker.tsx` is 157 lines and would have been ~230 inline. WEB-002 §3
allows the folder, WEB-008 caps the file at 200.

**5. `SaqeelSelect` / `SaqeelDateRangePicker` in the barrel.**
`components/saqeel/index.ts` already exports `Select` and `DateRangePicker` from
the legacy `inputs/` tree. Prefixed rather than renaming a legacy export, which
would have touched files outside this task's scope. Renaming belongs with the
legacy retirement.

## Verification

- [x] `npm run typecheck` — zero errors
- [x] Grep 1 (topbar): zero `<select>`, `<option>`, `type="date"`, `<details>`
- [x] Grep 2: zero literals in all three primitives
- [x] Zero gradients in the three primitives
- [x] No primitive builds its own popover — one `position: absolute` in the family,
      in `menu-surface.module.css`
- [x] Every claimed contrast ratio re-measured and correct
- [x] `--sqx-surface-canvas` → `#000A05`, verified through the token chain
- [ ] `npm run lint` · `npm run gates` — scripts do not exist (T-000)

### Not verified — and it is the whole runtime half

**Every browser check in the prompt is unperformed.** Windows Application Control
blocks `@next/swc-win32-x64-msvc`, so `next dev` starts and serves nothing. This
is unchanged since T-002 and was reported in T-002, T-004 and T-005.

Specifically **not** confirmed, and not claimed:

- dark panel in dark theme · outside-click closing either control
- `Escape` closing and returning focus
- keyboard-only region select writing `?region=Riyadh`
- keyboard-only date select writing `?from=`/`?to=`
- **the three measured control heights** — all three triggers are
  `min-block-size: var(--sqx-control-h-md)` = `2.375rem` = 38px at a 16px root,
  but that is read off the CSS, not measured in a browser
- Arabic panel edge alignment and Arabic-Indic digits
- axe-core on `/dashboard`
- **the dark dashboard screenshot the prompt asks for**

The prompt says a blocker may not be the finish. It is not: both greps pass and
all nine files are built. The environment blocker is stated because ticking those
boxes unrun would be a false report (WEB-008 §3).

## Numbers

```
files created            8
source lines added       863
client islands added     3 (menu-surface, select, date-range-picker)
                         — all leaf-level, all consumed by one existing island
shell island count       9 → 9 (scope-controls was already an island)
topbar module            502 → 417 lines (-85, native-control CSS deleted)
saqeel.css               801 → 806 lines (+5 tokens, 17 values changed)
```

### Measurement request — for the human

```
Measure — routes: /dashboard, /admin/access
  npm run build   → First Load JS per route, and the shared chunk delta
  In the browser  → computed pixel height of the search field, the date trigger
                    and the region trigger; all three must equal 38px
                  → screenshot of the dark dashboard for the record
```

## Parked

- `--sqx-gradient-chrome` restated but unconsumed; flat chrome stands.
- DoD grep 1 needs narrowing to `shell-topbar`, or the rail's legitimate
  `<details>` will fail it forever.
- `Select` multi-select and the `+N` chip: not built, not needed by the scope
  controls, still owed by T-005.
- Legacy `Select` / `DateRangePicker` barrel exports still shadow the new names.

## Blocked / open questions

- The app does not run on this workstation. Four tasks have now closed with the
  runtime half of their verification unperformed.

## Proposed commit

```
feat(saqeel): replace native select and date input with primitives
```

## Next

T-005's remaining primitives — `text-input`, `search-field`, `switch`,
`segmented-control`, `avatar` — now that `menu-surface` exists and unblocks the
floating ones.
