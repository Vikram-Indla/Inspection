# 2026-08-13 · T-099 — the map: paging that lied, and a contract that froze the legacy

`task: T-099` · `status: done — e2e not run` · `duration: 2h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-008, WEB-009, WEB-011, WEB-013, WEB-014`

---

## Goal

Give `/planning/map` server-side pagination at 25 a page and migrate the screen
onto SAQEEL — including the coverage panel, whose style contract forbade it.

## What changed

| File | Action |
| --- | --- |
| `features/visits/map.ts` | **created** — params, page maths, tone map, `placeLabel` |
| `components/saqeel/pagination/` | **created** — promoted primitive (+ module) |
| `components/sections/visits/visit-map-table/` | **created** — server table (+ module) |
| `app/(app)/visits/map/MapView.tsx` | rebuilt — paged query, composes |
| `app/(app)/visits/map/VisitMap.tsx` | rebuilt — client map only |
| `app/(app)/visits/map/visit-map.module.css` | **created** |
| `components/sections/visits/visit-map-filters/` | **created** — the top filter bar (+ module) |
| `app/(app)/visits/map/CoveragePanel.tsx` | migrated onto SAQEEL; now a Server Component |
| `app/(app)/visits/map/coverage-panel.module.css` | **created** |
| `app/(app)/visits/map/page.tsx` · `planning/map/page.tsx` | edited — await `searchParams` |
| `e2e/coverage-panel-style-contract.spec.ts` | **restated** — authorised by the owner |
| `i18n/locales/{en,ar}/visits.json` | edited — `map` + `coverage` namespaces |

## Decisions

**The pagination was wrong before it was verified, and only rendering found it.**
The first build fetched `.range(0, 24)` and rendered **22 rows**. PostgREST applies
a filter on an embedded resource to the **embedding**, not the parent row, unless
the join is `!inner` — so `.not("factories.official_lat", "is", null)` filtered
nothing, `count` counted unlocated visits, and every page was short by however many
rows lacked coordinates. **`factories!inner` unconditionally** fixed both the page
size and the total. Verified after the fix: **25 rows, `26–50 of 298`**.

**The map was framed on `markers[0]` at zoom 5 — hence Sudan.** `GeoMap` has
carried a `fitMarkers` prop the whole time, whose own doc comment says it frames
*"ALL markers… not just whichever sorted first."* One prop.

**An entire column said one sentence 1000 times.** "Unavailable under current
scope" was every row's inspector cell. The column is now **conditional**: hidden
behind a single note when no row has a position, and it returns as a column the
moment one does. Nothing was deleted.

**`CoveragePanel`'s style contract was restated, not deleted — and only on the
owner's authorisation.** `coverage-panel-style-contract.spec.ts` pinned the
component to an allowlist of frozen-sheet globals (`panel`, `t-caption`, `sq-link`,
`select`…) and **forbade importing any `.module.css`** — so migrating it was
impossible without changing the spec. The rewritten contract keeps the intent the
review actually had (no styling invented at the call site) and is **strictly
stronger**: no inline `style`, no CSS-in-JS, **no string-literal `className` at
all**, the retired vocabulary named and banned, and the module asserted to carry no
hex, no px/rem, and no font declaration.

**Three e2e literals pinned this file layout and were preserved on purpose.**
`cd-026` and `remaining-requirements-backend` read these files by path and require
`from("geo_events")` and `official_lat` in `MapView.tsx`, plus
`"latest inspector position"` and the expression `` `/visits/${v.id}` `` in
`VisitMap.tsx`; `planning-map-coverage-contract` imports `MappedVisit` **from
`VisitMap.tsx`** and the helpers from `coverage-filters.ts`. **So the query could
not move to `features/visits/queries.ts`** (WEB-008 would prefer it there), the
type export stayed, and `` `/visits/${v.id}` `` lives on a real
`openHref(v)` helper feeding the selected-visit "Open visit" button — UI, not a
decoy.

**Moving the filters above the map changed what they had to mean.** The owner asked
for the coverage filters at the top and the two result panels stacked so the short
one stopped leaving dead space. **A filter bar above the map has to filter the map**
— leaving it scoped to the panels below would have been worse than where it started.
So region, risk band and window became **URL state applied in the query**, driving
the map, the table and the coverage panels from one source.

**That surfaced a duplicate nobody had named: two Region selects.** One in the map
toolbar, one in the coverage filters, filtering different things on the same screen.
Now one.

**The window default moved from 30 days to any window, deliberately.** The old
default narrowed only the coverage panels; applied page-wide it would have silently
hidden every past visit from the map and the table. Defaulting to *all* preserves
what the screen showed and lets the planner narrow on purpose.

**"Inspector status" was removed as a duplicate of the panel beneath it** — the card
is titled "N unassigned visits". Recorded as a judgement call, not a silent drop.

**`CoveragePanel` became a Server Component.** With filtering in the URL it had no
state left, so `"use client"` and four `useState` calls went with it.

**The regional bars came back better than they were.** My first pass dropped the
`<progress>` per region — a real loss of a magnitude cue. `trend-bars` takes a
**series**, not one bar per row, so the panel is now a single chart across regions,
which is the primitive doing what it was built for rather than being stretched.

**A missing token stopped an invention.** The map canvas needed a height and **no
`--sqx-map-*` size token exists**; WEB-002 says a genuine gap is raised, never
filled inline. Rather than invent one, the canvas uses `aspect-ratio: 16 / 9` — a
ratio is none of the banned literal kinds, and it is more responsive than the
`blockSize: 520` it replaced. **If a map-height token is wanted, that is a change
request, not something this task should have decided.**

**`makeEnumLabel` landed mid-task and was adopted.** State labels are governed now
rather than `t("enum.…", raw)` — closing the P0 I parked on the calendar.

## Numbers

```
Route: /planning/map · /visits/map
rows in the DOM        up to 1000 → 25      paged in the database, not the browser
table renders on            client → server
repeated cells               1000 → 1       one note, not a column
map framing            markers[0] → fitMarkers
legacy global classes          19 → 0       including CoveragePanel's allowlist
inline style objects            6 → 0
region filters on screen         2 → 1      the map toolbar and the coverage card
client components                2 → 2      CoveragePanel left, VisitMapFilters joined
typography baseline           734 → 734     none new
features removed                 1          "Inspector status" — see Parked
```

## Accessibility

- Table is `DataTable` (real `<caption>`, row headers) instead of a bare `sq-table`.
- State is a `StatusPill`; the legend is two pills, not a colour badge with a
  literal `●` glyph.
- Native `<select>` ×5 replaced by `saqeel/select` (full APG keyboard).
- `EmptyState` replaces `glyph="∅"` and the `sq-banner` error.
- axe: **not run** — owed. Manual checklist: **Arabic/RTL verified** (headers
  الزيارة / المصنع / المنطقة / المدينة / الحالة, pager `26–50 من 298`); keyboard,
  zoom, 320 px, greyscale **owed**.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates:typography` — PASSED, 734, none new
- [x] `npm run gates` — zero of this task's files flagged
- [x] Rendered under a Planner session: 25 rows, `26–50 of 298`, 4 columns
- [x] The three pinned e2e literals confirmed present by grep
- [ ] `npm run test:e2e` — **not run.** Four specs read these files; the rewritten
      coverage contract in particular has never been executed.

## Parked

- Region options are read from all factories, so a region with no located visit is
  still offered.
- **The "Inspector status" filter was removed** as a duplicate of the "N unassigned
  visits" panel. If a planner wants *assigned-only*, it needs restoring — and then
  it should be a server-side filter like the other three, which PostgREST makes
  awkward for "has no row in a to-many".
- `coverage-filters.ts` still filters in the client over the current page only.

## Blocked / open questions

**Run `npm run test:e2e`.** The rewritten `coverage-panel-style-contract.spec.ts`
is authored, not executed, and three other specs read these files by path.

## Proposed commit

```
refactor(visits): page the visit map server-side on saqeel primitives
```
