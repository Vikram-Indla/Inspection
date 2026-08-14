# 2026-08-14 · T-106 — axe on the topbar, and the compact gap filled

`task: T-106` · `status: done` · `duration: ~1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-004, WEB-008, WEB-009, WEB-011`

---

## Goal

Run the axe pass owed by T-105, and fill the `compact` gap that T-105 raised so
the header scope stops disappearing between 880 and 1360px.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `saqeel/date-range-picker/date-range-picker.tsx` | `compact` prop | +12 |
| `saqeel/date-range-picker/date-range-picker.module.css` | icon-only trigger | +10 |
| `saqeel/select/select.tsx` | `icon` + `compact` props | +16 |
| `saqeel/select/select.module.css` | `.leading`, icon-only trigger | +19 |
| `app-shell/shell-rail/shell-nav-group.tsx` | variant-scoped subgroup ids | +12 |
| `app-shell/shell-rail/shell-rail.tsx` | passes `variant` at both call sites | +2 |
| `app-shell/shell-topbar/shell-scope-controls.tsx` | `useMediaQuery`, compact wiring | +18 |
| `app-shell/shell-topbar/shell-topbar.module.css` | scope breakpoint 1360 → 880 | ±1 |

## The axe pass

Run with `axe-core@4.12.1` (already a devDependency) served same-origin,
scoped to the `<header>` subtree, tags `wcag2a wcag2aa wcag21a wcag21aa
wcag22aa best-practice`.

**Before: 0 violations, 25 passes, 3 incomplete.** Incomplete is not "clean" —
each was resolved by hand:

| Incomplete | Verdict | Evidence |
| --- | --- | --- |
| `aria-valid-attr-value` | **Not a defect.** Lazy popup: axe cannot statically prove the `aria-controls` target exists. | Measured `idExistsWhenClosed: false`, `idExistsWhenOpen: true`. Correct behaviour for `aria-haspopup` + a panel that mounts on open. |
| `color-contrast` on the notification badge | **Passes.** Flagged only because the badge overlaps the bell, so axe could not sample the backdrop. | Computed **7.88:1** for `rgb(255,172,130)` on `rgb(58,36,35)` — clears AA (4.5) and AAA (7). |
| `duplicate-id-aria` | **Real, critical.** | **7 duplicated `sqx-nav-*` ids.** |

**The real one: the rail renders twice.** `ShellRail` takes
`variant="rail" | "drawer"` and the app mounts both — the desktop rail and the
mobile drawer — in the same document. `shell-nav-group.tsx` built subgroup ids
from group + entry alone, so **every `aria-labelledby` in the drawer resolved to
the rail's copy of the label**, and seven `role="group"` regions were named by an
element in a different landmark. Ids are now scoped by variant.

**After: 0 violations, 25 passes, 2 incomplete — both cleared above.**

```
duplicate nav ids   7 → 0    (14 ids total, all unique)
```

## The compact gap

T-105 hid the scope below **1360px** because a scope carrying an Arabic range is
357px and the search floor is 224px. That cost the scope on every laptop. The
gap it raised was a `compact` prop on both primitives; this task fills it.

**`compact` is a prop, never a media query inside the primitive.** A design-system
control must not know the caller's layout. The shell decides, through
`useSyncExternalStore` over `matchMedia` — **no `useEffect`** (WEB-004 §1: a media
query is external state, so it is subscribed to, not mirrored into state).

**The label moves into the accessible name; it is not deleted.** A toolbar that
runs out of room must lose text, never meaning:

- date trigger — `aria-label="نطاق التاريخ — من ١٦ يوليو ٢٠٢٦ إلى ١٤ أغسطس ٢٠٢٦"`
- region trigger — `aria-label="نطاق المنطقة — جميع المناطق"`
- a `PingDot` marks the date control as carrying a value, so "filtered" stays
  visible without the text

**`Select` gained `icon` because `compact` is illegible without it** — an
icon-only trigger showing a bare chevron names nothing. The chevron is hidden in
compact: an icon plus a chevron is two glyphs for one control.

## Numbers

```
                  T-105            T-106
1440  scope       368  labelled    394  labelled      (compact off)
1280  scope       hidden           94   icon-only     search 384 / input 334
 900  scope       hidden           94   icon-only     search 270 / input 220
 880  scope       hidden           hidden

compact trigger widths (rtl): date 46px, region 36px — both clear the
WCAG 2.2 AA target-size floor of 24×24 (height is --sqx-control-h-md, 38px).

scope visible from   1361px  →  881px      (480px of viewport reclaimed)
```

## No regression

- **23 files import `Select`**; `icon` and `compact` are both optional and
  default to off, so every existing trigger renders exactly as before.
- The 7 other `DateRangePicker` call sites pass neither `compact` nor
  `clearable`.
- No new token. `--sqx-space-2`/`-3` for the tightened compact padding.
- No external reference to the `sqx-nav-*` ids existed (grepped `src` and `e2e`),
  so scoping them by variant broke nothing.

## Verification

- [x] `npm run typecheck` — exit 0
- [x] `npm run gates` — typography none new; design-system 0 findings in every touched file
- [x] axe: 0 violations, 25 passes, 2 incomplete both resolved by measurement
- [x] Arabic (`dir=rtl`) at 1280 — both triggers compact, full Arabic in the accessible names
- [x] 1440 / 1280 / 900 LTR and RTL — zero overlap, zero document overflow

## Parked

- The action row is still 470px at 1440. Folding locale + theme into the user
  menu would let the compact scope survive below 880 too.
- `aria-valid-attr-value` will stay permanently incomplete for every
  `MenuSurface` trigger in the app. It is inherent to lazily-mounted popups —
  worth an axe rule exclusion with this record as the justification, rather than
  re-triaging it on every future run.

## Proposed commit

```
feat(saqeel): add compact triggers to select and date-range-picker
```

and

```
fix(shell): scope rail subgroup ids to their rail instance
```

## Next

The locale/theme fold into the user menu, if the owner wants the compact scope
below 880.
