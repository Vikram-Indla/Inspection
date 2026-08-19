# 2026-08-17 · T-144 — `/field/visits` + `/field/visits/calendar` migrated off the parallel design system

`task: T-144` · `status: done` · `duration: ~2.5h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-006, WEB-013, WEB-014`
`owner signed in as Inspector for this task`

---

## Goal

Migrate the `/field/visits` surface — the list view and its `/calendar`
subroute — onto SAQEEL primitives and the approved Linear language. The two
views share one data loader, one `FieldVisit` type, one stylesheet and a
view-switcher nav, so they migrate as one task.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `app/(app)/field/visits/page.tsx` | rebuilt as a route file | 60 → **11** |
| `app/(app)/field/visits/calendar/page.tsx` | rebuilt as a route file | 31 → **11** |
| `app/(app)/field/visits/loading.tsx` | rebuilt on `SkeletonRegion`, localised | 5 → 15 |
| `features/field-visits/queries.ts` | created — read + fixture filter | 34 |
| `features/field-visits/rows.ts` | created — `FieldVisit` type + narrowing | 84 |
| `features/field-visits/labels.ts` | created — enum/risk labels, CTA resolution | 38 |
| `components/sections/field-visits/visits-screen.tsx` | created — list composition | 51 |
| `…/calendar-screen.tsx` | created — calendar composition | 45 |
| `…/visits-header.tsx` | created — shared header (h1 + sync) | 31 |
| `…/visit-views-nav.tsx` | created — list/calendar/map switcher | 35 |
| `…/visits-list.tsx` | created (client) — segments/search/chips/cards | 162 |
| `…/visit-card.tsx` | created — one visit card | 70 |
| `…/calendar-board.tsx` | created (client) — day/week/month grid | 128 |
| `…/visits.module.css` | created — token-only | 225 |
| `i18n/locales/{en,ar}/field-visits.json` | created — new namespace | 65 each |
| `i18n/messages.ts` | registered `fieldVisits` | +4 |
| `VisitsClient.tsx` | **deleted** | 100 → 0 |
| `data.ts` | **deleted** | 46 → 0 |
| `visits.module.css` (old) | **deleted** | 29 → 0 |
| `calendar/FieldCalendarBoard.tsx` | **deleted** | 43 → 0 |

## Decisions

**A duplicate-`main` bug was found and fixed.** `AppShell` renders
`<main id="main-content">`, and every migrated field screen renders a `<div>`
inside it. But the old `VisitsClient` (and the old `loading.tsx`) each rendered
their *own* `<main>` — a second landmark nested in the shell's, which
`landmark-no-duplicate-main` flags. The rebuild renders a `<div>` like the other
five field slices; browser-verified `main` count is now 1 on both views.

**`assignment-task-model` was reused unchanged.** `isVisitPriority`,
`visitSegment`, `visitSegmentCounts` are governed helpers with a passing contract,
imported by `my-tasks` too. The list calls them exactly as before; only the UI
around them was rebuilt.

**`as unknown as Row[]` is gone, and `FieldVisit` moved to the feature layer.**
The old `data.ts` cast the Supabase result and defined `FieldVisit` inside
`VisitsClient`. `rows.ts` now owns the type and narrows from `unknown` in one
place; `queries.ts` is the single loader both routes call.

**The calendar's UTC date logic was preserved exactly.** `FieldCalendarBoard`
buckets and formats entirely in UTC (`Date.UTC`, `toISOString().slice(0,10)`,
`timeZone: "UTC"`). That is a deliberate governed choice — a visit's calendar day
must not shift under the viewer's timezone — so it was carried across verbatim
rather than "corrected" to Riyadh. The one `toISOString().slice` moved from the
old board to `calendar-board.tsx`, so the v5 count is unchanged (net zero).

**The `loading.tsx` label is localised now, not hardcoded.** The old fallback had
`aria-label="Loading assigned visits"` in English. Following the `RouteLoading`
pattern (an async server component that reads `getLocale`), the new one resolves
`getMessages(await getLocale()).fieldVisits.loading` — the field namespace owns
the string in both locales.

**Two `IconButton`s for the calendar prev/next.** `Button` has no icon-only mode,
but the calendar nav arrows are `onClick` handlers, so `IconButton` (a native
`<button>`) fits — `mirrored` so the chevrons flip in Arabic.

## Inventory taken before writing code

- **State/effects:** the list needs client state (segment/risk/query/sort/
  visible-count/geolocation) and the calendar needs view/anchor — all kept. Both
  pages are Server Components; the data load is server-side and RLS-scoped
  (`inspector_id` never in the browser — CR-100).
- **Copy:** a local `tr(key, en, ar)` helper inlined both languages at **~45**
  call sites across the two pages; all moved to a new `field-visits` namespace,
  Arabic lifted from the pairs. `calendar.more` became the interpolated
  `+{count} more`.
- **`<svg>` → icons:** the search magnifier → the `TextInput` search field; the
  card/CTA chevrons and the calendar nav arrows → `nextPage`/`previousPage`; the
  footnote info-circle → `info`.
- **Accessibility failures found:** the pages had **no `h1`** (FieldHeader title
  was a `<div>`); the view nav, segments and risk chips were bare `<button>`/`<a>`
  with legacy classes; every status was a `badge` span. Now `h1` (+ `h2` for the
  calendar period), and every status/risk is a labelled `StatusPill`.

## Numbers

```
Routes: /field/visits and /field/visits/calendar
route files           60 + 31 → 11 + 11
components ≤ 200      max component 162 (list); rows.ts 84 (feature, < 400)
client islands        2 → 2  (list, calendar board)
raw <svg> in app      several → 0
duplicate <main>      2 (VisitsClient + loading) → 1 (shell owns it)
headings              0 → 1 (list) / 1>2 (calendar)
rendered sizes        off-scale → 13·15
weight cap            700 → 590
hardcoded copy        ~45 tr() sites → 0
typography gate       13 owned violations → 0   (baseline 1284 → 1271)
eslint baseline       7599 → 7566
design-system-v5      71, unchanged (calendar UTC toISOString moved, net zero)
source lines deleted  218 (VisitsClient 100 + data 46 + stylesheet 29 + board 43)
```

## Accessibility

- **axe: 0 WCAG violations** across English/dark and Arabic/dark, on the list
  (populated + empty) and the calendar (month view). Best-practice rules
  (`heading-order`, `page-has-heading-one`, `landmark-no-duplicate-main`,
  `region`, `duplicate-id`, `listitem`) also 0.
- **Found and fixed:** the duplicate `<main>` (above) — the most consequential
  finding, since it was invisible to the WCAG tags and only `landmark-no-
  duplicate-main` catches it. Also the missing `h1` on both views.
- Manual checklist: keyboard ✓ · Arabic/RTL ✓ (tabs and states translate, factory
  names stay LTR via `dir="auto"`, calendar grid mirrors, Arabic-Indic day
  numbers) · dark ✓ · list segments and calendar day/week/month switching ✓.
  **Light theme, 200 % zoom and browser e2e still owed.**
- Status is text-plus-shape throughout (WEB-002 §5): risk, planning status and
  operational state are all labelled `StatusPill`s; the risk hairline on the card
  edge is decoration, never the sole signal.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED (relocked 7599 → 7566)
- [x] `npm run gates:typography` — PASSED (relocked 1284 → 1271)
- [x] `npm run check:design-system-v5` — 71, unchanged
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] axe on list + calendar, EN + AR
- [x] temporary axe file removed (404 confirmed), browser theme/locale restored
- [ ] light theme, 200 % zoom, browser e2e — still owed

**No spec re-pointing was needed** — a grep confirmed **no e2e reads the visits
source files** (`VisitsClient`, `data`, `FieldCalendarBoard`, the stylesheet, or
`field/visits/page.tsx`). The route paths are unchanged, so the shell/nav specs
that link to `/field/visits` still hold.

## Retirement

Deleted at zero imports: `VisitsClient.tsx` (100), `data.ts` (46), the old
`visits.module.css` (29), `calendar/FieldCalendarBoard.tsx` (43) — **218 lines**.
The `visits/` folder is now `page.tsx` + `loading.tsx` + `calendar/page.tsx`;
all logic lives in `features/field-visits/` and `components/sections/field-visits/`.

## Parked

- The cross-cutting items still stand: the `Button` mirror gap
  (T-052/T-140/T-141 — though the calendar nav now uses `IconButton mirrored`,
  which *does* flip), field-pill pluralisation (T-141), and the `role="tab"`-style
  nav-links pattern (T-142). The visits view-nav uses `aria-current="page"` links
  (not `role="tab"`), which is the cleaner choice for a navigation switcher.
- Light theme, 200 % zoom, browser e2e owed for these routes.

## Blocked / open questions

None.

## Proposed commit

```
feat(field): rebuild the visits list and calendar on saqeel primitives
```

## Next

The large execution screens remain: `[visitId]` startup (1,384 lines) and the
1,991-line `inspection/[id]/Workspace` — the two biggest files in `/field`. Also
the report/notification surfaces (`notifications`, `completed`, `reports`,
`settings`).
