# 2026-08-09 · T-021e — Planning skeleton + segmented-control width

`task: T-021e` · `status: done (static verification only)` · `duration: ~40m`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-005, WEB-009, WEB-011`

---

## Goal

Two owner-reported issues: `/planning` still used the generic legacy loading
state, and its view toggle spanned the full content width while the identical
control on Visit Management did not.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/saqeel/segmented-control/segmented-control.module.css` | modified | 115 → 121 |
| `components/sections/planning/planning-skeleton/planning-skeleton.tsx` (+ module) | created | 67 + 75 |
| `app/(app)/planning/loading.tsx` | rebuilt | 8 → 13 |
| `i18n/locales/{en,ar}/planning.json` | extended — 1 key each | 262 keys, parity |

## The two fixes

### 1 · `SegmentedControl` spanned its container

The root is `display: inline-grid`, which reads as "size to content" — but that
is not what it means for a **flex or grid child**. Those parents blockify their
children and stretch them along the cross axis, so the same control sat inline
inside a toolbar (`operations-toolbar`, `dashboard-toolbar`, `visit-scope-bar`,
the topbar locale toggle) and spanned the full width the moment it was placed on
a page directly — which is exactly what `/planning` does.

`inline-size: fit-content` on `.root` makes the intent hold in every parent. It
is a one-line base fix so no call site has to remember to wrap the control in a
row, and `/planning` now matches Visit Management without touching either page.

All five consumers were checked: none wanted a full-bleed control, and none
changes shape, since a flex-row item was never being stretched horizontally
anyway.

**Rejected:** wrapping the nav in a `Toolbar` at the `/planning` call site. That
fixes one page and leaves the trap armed for the next one.

### 2 · `/planning` loading state

`loading.tsx` rendered the shared `RouteLoading` — a centred "Loading visit
planning…" `EmptyState` inside its own `<main class="sq-content">`, which is a
second `main` nested inside the app shell's. It mirrored nothing, so the whole
page re-laid-out on hydration.

`planning-skeleton` reproduces the real first-paint composition in order: the
view toggle → page heading and subtitle → the right-aligned action row
(export / refresh / visit management / create visit) → filter bar → the table
card with a shaded header band and eight seven-column rows → the count and
pagination footer. The create-method grid is deliberately **not** drawn: it is
collapsed on first paint (`CreateVisitSection` opens on click), so drawing it
would mirror a state the page does not load in.

Built from `Card` / `Stack` / `Skeleton` / `SkeletonRegion` only — no new
primitive, matching `dashboard-skeleton`, `factories-skeleton` and
`visits-skeleton`. Zero client JS.

`RouteLoading` is **not** retired: 10+ admin routes still use it.

**Corrected after owner review.** The first cut of the heading and action row
did not mirror the page — I had written the skeleton from the JSX tree without
reading the two legacy classes that lay it out:

| | First cut | What `/planning` actually does |
| --- | --- | --- |
| Heading | title and subtitle **stacked** in a column | `.sq-planning-heading` is `display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap` — they share **one row**, pushed apart, bottom-aligned |
| Action row | four pills floating **right**, no surface | `.grid-toolbar` is a **bar**: `background`, `padding`, `border-block-end`, actions running from the **start** edge |
| View toggle | `width="half"` (50 %) | the segmented control is now `fit-content`; four labels read closer to `narrow` (32 %) |

The lesson is in the record because it will recur: **a skeleton cannot be built
from the component tree alone.** Layout on a part-migrated screen still lives in
the frozen sheets, so mirroring means reading the CSS the page actually gets,
not the JSX that requests it.

The toolbar bones are `repeat(auto-fit, var(--sqx-space-13))` rather than a
percentage width. A percentage would scale the "buttons" with the viewport,
which is exactly what made the first cut read as four huge lozenges; `auto-fit`
also wraps them on a narrow screen without needing a second breakpoint literal.

## Inventory taken before writing code

- **Literals:** none, except `@media (max-width: 75rem)`, matched deliberately
  to `data-table.module.css:110` so the skeleton collapses at the same width as
  the real table. Media queries cannot read custom properties.
- **State/effects:** none. Skeleton and route are Server Components.
- **Accessibility:** `SkeletonRegion` provides `role="status"`, `aria-busy`,
  `aria-live` and a visually-hidden label; bones sit inside its `aria-hidden`
  wrapper. Replacing `RouteLoading` also removes the nested `<main>`.
- The route keeps `Shell current="/planning" title=""` — the same empty title
  the page itself passes, since `/planning` renders its own `h1`. Matching it
  avoids a heading appearing and disappearing across the load boundary.

## Numbers

```
Route: /planning
first-load JS   NOT MEASURED — production build is the human's (WEB-005 §8)
client islands  unchanged; the skeleton adds none
```

## Accessibility

- axe: **NOT RUN.**
- Manual checklist (WEB-003 §10): **not performed.** Both changes are visual.
  The segmented-control change affects five screens, so it wants a browser pass
  on each — `/planning`, `/dashboard`, `/operations`, the topbar locale toggle
  and the dashboard compliance explorer — in both directions, since the control
  carries an RTL-mirrored sliding pill.

## Verification

- [x] `npm run typecheck` — zero errors, whole repo.
- [x] `npm run check:design-system-v5` — zero findings in changed files.
- [x] i18n parity — `planning` 262 keys, `common` 39, both locales.
- [ ] `npm run lint` / `npm run gates` — still no such scripts (T-000).
- [ ] `npm run test:e2e` — not run.

## Retirement

Nothing marked. `RouteLoading` keeps 10+ admin consumers.

## Parked

- **Every remaining `RouteLoading` consumer is an un-mirrored loading state.**
  `/planning`, `/dashboard`, `/factories` and `/visits` now have skeletons that
  match their layout; the admin routes still flash a centred glyph and re-lay
  out on hydration. Each admin screen migration should take its own.
- **`inline-grid` is not "shrink to fit" for a flex/grid child.** The same trap
  is waiting on any other primitive that relies on an inline display type for
  sizing. Worth a sweep when the design system is next audited.
- **There is no button-width token.** A skeleton bone standing in for a control
  has to borrow `--sqx-space-13`, because every `Skeleton` width is a percentage
  of its container and percentages scale controls with the viewport. If more
  skeletons mirror action rows, a real control-width token is the fix.
- **Skeletons for part-migrated screens must be read from the CSS, not the
  JSX.** `/planning` still gets `.sq-planning-heading` and `.grid-toolbar` from
  the frozen legacy sheets; both lay out differently from how the component tree
  reads. Any remaining screen in this position (`/planning/bulk`, `/reviews`,
  `/field`) has the same hazard.

## Blocked / open questions

None.

## Proposed commit

```
fix(planning): mirror-layout skeleton and fit-content view toggle
```

## Next

**T-021b** — the bulk-action forms still hold native `<select>` and
`datetime-local` controls (no datetime primitive exists), and the four sibling
visit views are untouched legacy.
