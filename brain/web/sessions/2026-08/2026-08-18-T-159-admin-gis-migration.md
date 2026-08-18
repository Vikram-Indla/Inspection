# 2026-08-18 · T-159 — `/admin/gis` (GIS geofencing studio) rebuilt on SAQEEL

`task: T-159` · `status: done` · `duration: ~4h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014, WEB-015`

---

## Goal

The interactive GIS geofencing studio — a live KSA Mapbox map of 612 factory
pins, search + region/band filters, a linked map↔registry selection, a
selected-factory side panel with a geofence-radius editor, engine-default
readouts, a live legend, and a read-only engine-settings table. Owner's asks:
**responsiveness (both LTR/RTL), framed skeleton, permission gate, consistent
gaps, bilingual EN/AR from i18n files.**

## What was wrong

- `AdminShell` + `sq-stack`/`sq-row`/`sq-panel`/`sq-input`/`sq-select`/`sq-field`/
  `sq-lozenge`/`sq-table`/`sq-tablewrap`/`badge`/`t-caption`/`btn`/`id-code`/
  `alert`/`table` + inline `style={{ … }}` everywhere.
- **WEB-015 raw controls** — search `<input>`, 2 filter `<select>`, radius
  `<input type=number>`.
- Copy hardcoded, **English-only** (~45 `t(key,"English")`); action messages English.
- `GisStudio.tsx` was **279 lines** (over the 200 ceiling).
- Code comments (`// SCR-ADM-070 …`); a `useEffect` clearing selection.
- Flush `loading.tsx` (`Shell` + `EmptyState`, no page frame).
- Risk band rendered as a coloured `sq-lozenge`.
- No in-UI gate for the `gis_admin` write role — every admin saw the edit form
  and only discovered the block on save (RLS `factories_update`).

## What changed

| File | Action |
| --- | --- |
| `app/(app)/admin/gis/page.tsx` | rebuilt as a route file (107 → 9) |
| `app/(app)/admin/gis/loading.tsx` | **framed skeleton** (`GisSkeleton`) |
| `app/(app)/admin/gis/actions.ts` | returns **codes** (34 → 27); RLS authority + logic byte-for-byte |
| `features/admin-gis/{queries,types,strings}.ts` | created — settings + factories read, **`gis_admin` resolution** (`canEdit`), `resultMessage` localizer, `bandTone`/`bandLabel` |
| `components/sections/admin-gis/` | 8 files: `gis-screen` · `gis-studio` (client container) · `gis-toolbar` · `gis-map-panel` · `gis-registry` · `gis-settings` · `gis-skeleton` · `gis.module.css` |
| `i18n/locales/{en,ar}/admin-gis.json` | created — new namespace + `messages.ts` |
| Deleted | `gis/GisStudio.tsx` (279-line client, replaced by the split components) |

## Decisions

**The permission gate (owner's ask).** `loadGis()` resolves whether the caller
holds **`gis_admin`** (reads `user_roles`) and returns `canEdit`. When true, the
panel shows the radius editor; when false, it shows the coordinates read-only with
a **"View only — the gis_admin role is required to edit geofence radii."** notice.
RLS (`factories_update`) stays the real authority — the action still returns an
`rls` code if a write is attempted — but the block is now an honest in-UI state,
not a post-submit surprise. **Browser-verified:** the current admin (not a
gis_admin) sees the view-only notice and no edit form.

**Split under the ceiling.** The 279-line client became a `gis-studio` container
(all state + derivations) composing three presentational children: `gis-toolbar`
(`TextInput` search + two `SaqeelSelect` filters + count), `gis-map-panel` (the
`GeoMap` in a hairline `Card` + the selected-factory `Card`), `gis-registry` (the
linked `DataTable`). `GeoMap` (the Mapbox engine) is untouched — only its chrome
changed.

**Accessibility fix.** The old row-click selection wasn't keyboard-reachable; the
registry's factory-name cell is now a real focus **`Button`** (`getRowSelected`
still highlights the active row). The selection-clearing `useEffect` is gone —
`selected` derives from the located set, so a filter that hides the pick drops the
panel to empty without an effect (WEB-004).

**Responsiveness + gaps.** One `--sqx-stack-section` rhythm; the map/panel is a
grid that **stacks below 60rem**, the toolbar wraps, and the map card is
`clamp(24rem, 60vh, 34rem)`. Risk bands are `StatusPill` (`bandTone`), the legend
is StatusPills with live counts, engine defaults a `DefinitionList`, the settings
table a `DataTable`. The version label moved to the frame `actions` slot as `Mono`.

**Error copy — codes → client map** (as with factory-data). `actions.ts` returns
`expired`/`no_factory`/`bad_radius`/`rls` + `NEUTRAL_WRITE_ERROR` (pass-through);
`resultMessage` localizes. The load error surfaces as governed i18n copy
(`error.body`) with `logProviderError` diagnostics — the provider message is never
rendered.

## No regression

Three specs re-pointed, guarantees preserved:

- **`mapbox-provider`**: the "admin map uses Mapbox `import("@/components/GeoMap")`,
  never Leaflet" assertion moved from `GisStudio.tsx` → `gis-map-panel.tsx` (where
  the dynamic import now lives).
- **`ipad-gps-policy`**: the `engine_settings` read assertion moved from
  `gis/page.tsx` → `features/admin-gis/queries.ts`.
- **`neutral-error-sweep`**: GIS split out of the admin-read loop — now asserts
  `queries.ts` logs `logProviderError` + renders no provider `.message`, and
  `gis-screen.tsx` uses the governed neutral copy `strings.error.body` (the
  NEUTRAL_LOAD_ERROR constant gave way to bilingual i18n copy — same guarantee,
  no provider leak).

`mvp3-enterprise-contract` (existsSync — page still exists), `mvp3-retrofit-regression`
(navigates, asserts `main h2` + nav-current), and `shell-navigation` (asserts the
shell-owned "GIS Studio" nav label) all pass unchanged.

## Verification

- [x] `npm run typecheck` — clean (whole tree)
- [x] `eslint` on all new/changed files — **0 problems**
- [x] `npm run gates:typography` — PASSED (**−62** vs baseline; left unrelocked)
- [x] `npm run gates:date-inputs` — PASSED (T-158's 2 removals now detected; none new)
- [x] `npm run check:design-system-v5` — **60** unchanged; gis adds **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] re-pointed spec assertions (`mapbox-provider`, `ipad-gps-policy`, `neutral-error-sweep`) — verified present
- [x] **axe** (admin persona, live, factory selected) — **0 violations**, 32 passes (fixed a selected-row muted-label contrast: `tone="muted"` → `"secondary"`)
- [x] **permission gate** — non-`gis_admin` admin sees the view-only notice, **no edit form**; selection via the registry name button populates the panel
- [x] **live** — title + version (Mono), banner, toolbar, Mapbox map, panel (risk `StatusPill`, coords, defaults `DefinitionList`, legend), registry + settings `DataTable`
- [x] **Arabic / RTL** at 375 px — `dir=rtl`, all copy from `ar` JSON, single `<main>`, map/panel/toolbar stack, **0** horizontal overflow
- [x] **200% zoom** — **0** horizontal overflow

## Follow-up polish (same task)

Two owner-requested tweaks after the first pass, all verified live:

1. **Filter dropdowns responsive grid.** The two toolbar filters (regions / risk
   bands) moved from wrapping flex items into a `.filters` grid —
   `grid-template-columns: 1fr 1fr` (each 50%, same row) collapsing to `1fr`
   (each 100%, own row) at `max-width: 30rem` (xs). Verified: 584px → 50/50 same
   row; 375px → stacked full-width.
2. **Registry factory-value alignment + humanised bands.** In the stacked
   `DataTable`, the factory-name `Button` stretched its grid cell (`width: 517`,
   `text-align: center`) so the name sat centred while every other value was
   left-aligned. Wrapping it in a `.nameCell` span with `justify-self: start`
   shrinks it to content width (verified `nameLeft === regionLeft`). And the raw
   lowercase risk bands (`low`/`medium`/`high`/`unbanded`) are now humanised
   through the reusable **`sentenceCase`** (a no-op in Arabic, so i18n-safe),
   applied inside `bandLabel` — so the registry, the panel pill, the legend, and
   the band filter all read `Low` / `Medium` / `High` / `Unbanded`. typography
   PASSED, test:static **408/33**.
3. **Registry horizontal-scroll on small screens.** The stacked `DataTable`
   overflowed and the `bleed` negative margin clipped the first characters. Two
   parts: `bleed={false}` on the GIS tables kills the negative-margin clip, and a
   `.tableFit` wrapper blockifies the `<table>`/`<thead>`/`<tbody>` in stacked
   mode (`@media max-width: 75rem`) so the full-width grid rows govern instead of
   the `display:table` max-content sizing. The last piece was the name **`Button`**
   (`white-space: nowrap`, `justify-content: center`, no `className` prop): a
   scoped `.nameCell button` override sets `inline-size: 100%; justify-content:
   flex-start; white-space: normal` so long names wrap inside the column and stay
   left-aligned. Verified at 375px: registry `scrollOverflow: 0`, page overflow 0,
   `nameLeft === regionLeft`.
4. **"Factories by region" chart — a genuine fit, not enforced.** The map shows
   *where* factories are but nothing quantifies *how many per region*; the legend
   only covers bands. A server-aggregated **`BarSeries`** (`components/saqeel/
   charts/bar-series`) ranks the top 8 regions by factory count
   (`gis-region-chart.tsx`), placed inside the studio between the map/panel and
   the registry (not after the 612-row table, where it would be buried). Labels
   pass through `humaniseEnum`; the chart is RTL-aware (`rtl={locale === "ar"}` —
   bars grow leftward, labels right), `role="img"` + aria-label. Full-fleet
   overview (stable, distinct from the filter-driven legend). axe **0**,
   Arabic/RTL + both viewports **0 overflow**, v5 **60** (adds 0), test:static
   **408/33**.
5. **Registry pagination.** All 612 rows rendered at once (612 stacked cards on
   mobile). The full set stays loaded client-side because the **map markers need
   it**, but the registry now renders one page at a time: `gis-studio` holds a
   `page` state, slices `filtered` to `PAGE_SIZE = 25`, and resets to page 0 on any
   filter change (a `filterTo` wrapper), with `safePage` clamping when the result
   set shrinks — no syncing effect. The DS **`Pagination`** (`components/saqeel/
   pagination`, client `onPageChange` mode) renders `‹ Previous · {a}–{b} of {n} ·
   Next ›` below the table, shown only when `total > pageSize`. Verified: DOM row
   count **25** (was 612), `1–25 of 612`, Next → `51–75 of 612`, filter by Riyadh
   → resets to `1–25 of 499`. axe **0**, typography PASSED, test:static **408/33**.

## Parked

- `/admin/gis/spatial` (T-160) — the feature-flagged spatial-canvas subroute
  (`FEATURE_SPATIAL_CANVAS`, Mapbox held → `NotYetBoundary`), with `CreateLayer`
  (raw inputs). Its own task.
- Enter-to-zoom on the search box — the DS `TextInput` has no `onKeyDown`
  passthrough; selection stays via pins + the registry name buttons. Restore when
  `TextInput` grows key handling.

## Proposed commit

```
feat(admin): rebuild gis geofencing studio on saqeel with gis_admin edit gate
```

## Next

`/admin/gis/spatial` (T-160), or another admin surface.
