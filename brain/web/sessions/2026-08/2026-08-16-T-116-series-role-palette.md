# 2026-08-16 · T-116 — Every bar and every meter was painted in the warning colour

`task: T-116` · `status: partial — code complete, axe clean both themes, gates unchanged; e2e and a native Arabic review owed` · `duration: ~0.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009`

---

## Goal

Owner asked for colour variety across the charts — not everything amber or teal.

## The finding that changes the answer

`--sqx-chart-4` resolves to **`--sqx-warning-darker` / `--sqx-warning-light`**.
`BarSeries` defaults to `series = 1` and `Gauge` hardcoded `CHART_SERIES[1]`, so
**every bar and every meter in the application was rendering in the token
reserved for warnings.** Reusing a status colour as a series colour is a
catalogued anti-pattern; this was it, applied globally by default.

`CHART_SERIES[2]` is the **AI accent** (`--sqx-ai-*`) — worth knowing before it
is spent, though it already ships as a donut slice on `/analytics`, so using it
for ordinary data is consistent with what is live.

## Why this needed no token change request

A **single-series** chart does not use the palette for identity — length carries
the whole meaning. The CVD-separation rule governs series *within* a chart, so
varying colour *between* charts is unconstrained by it. The only requirement is
contrast against the surface, measured for all three slots, both themes, both
surfaces:

```
chart-1 brand    11.01 / 10.62 light    6.32 / 7.59 dark
chart-2 info      7.21 /  6.95 light   10.58 / 12.71 dark
chart-3 ai        6.80 /  6.56 light    5.70 /  6.85 dark
chart-4 warning   7.78 /  7.50 light   11.13 / 13.37 dark
```

Every slot clears the 3:1 floor for a graphical object with room to spare, so
this is a wayfinding decision, not a contrast one.

## What changed

| File | Action |
| --- | --- |
| `components/saqeel/charts/chart-palette.ts` | `SERIES_ROLE` added, with the measurements in its TSDoc |
| `components/saqeel/charts/gauge/gauge.tsx` | `series` prop added; was hardcoded to slot 1 |
| `components/saqeel/charts/bar-series/bar-series.tsx` | `track` prop added (Recharts `background`) |
| `components/sections/analytics/analytics-rates/analytics-rates.tsx` | `track` set — `domainMax` is the fixed 0–100 scale |
| `components/sections/analytics/analytics-breakdowns/analytics-breakdowns.module.css` | one column → responsive `auto-fit` pair |
| `components/saqeel/charts/bar-cell/bar-cell.module.css` | `chart-4` → `chart-2` |
| `pipeline-breakdown`, `operations-states` | `series={SERIES_ROLE.volume}` |
| `measure-coverage` (gauge + bars), `analytics-blocked` (gauge) | `series={SERIES_ROLE.coverage}` |

## The scheme

Colour by **what the chart measures**, so two cards about the same kind of thing
read as related and the screen is not monochrome:

| Family | Slot | Where |
| --- | --- | --- |
| `volume` — tallies | 0 · info teal | pipeline by status, operations states, active-by-state, today's states, workload bar cells, activity sparkline |
| `rate` — proportions | 1 · warning amber | `/analytics` rates band (established screen, left alone) |
| `coverage` — what the platform knows | 2 · AI violet | measure coverage meter + blocked reasons, `/analytics` metric coverage |

`Gauge` defaults to slot 1, so no existing caller changed appearance except the
two passed explicitly.

## Verification

Measured fills, both themes:

```
dark   volume rgb(126,228,246)   coverage rgb(167,139,250)   rate rgb(255,214,102)
light  volume rgb( 33, 92,102)   coverage rgb(109, 40,217)   rate rgb(122, 65,  0)
```

- [x] `npm run typecheck` — 0 errors
- [x] **axe 0 violations** — `/analytics` dark **and** light, post-change
- [x] `npm run gates` — 77 v5 findings, unchanged
- [ ] `npm run test:e2e` — not run

## The rates band looked half-empty, and rescaling would have been a lie

Owner reported dead space to the right of `/analytics` → Rates. **Measured
first**, because there are two very different causes and only one is a bug:

```
bar-series root   863px inside a 905px card   → not a layout problem
longest bar       34.5% ends at x=410
plot area         ends at x=904               → 494px of unfilled scale
```

The gap **is** the remaining 65% of a 0–100 rate scale. The obvious fix —
rescale to the largest value — would draw 34.5% as a full bar, which is exactly
what `BarSeries`'s own TSDoc refuses: *"a governed 0–100 measure is passed
through unchanged rather than charted against its own maximum, which would
exaggerate a flat run."*

`BarSeries` gained **`track`**, which paints the unfilled remainder behind each
bar via Recharts' `background`, using `CHART_TRACK` — the same token `Gauge`
already uses for the same idea. The band now fills the card and the leftover
reads as *scale*, not as *layout*. Set it on any chart whose `domainMax` is a
fixed scale rather than the data's own maximum; the prop's TSDoc says so, and
says why.

Rendered and checked in both themes: 5 tracks spanning **687px**, fill
`rgb(244,246,248)` light / `rgb(14,19,26)` dark, data bars unchanged at
`rgb(255,214,102)`. **axe 0 violations in both.**

## The two breakdown donuts were stacked, wasting the width they needed

`analytics-breakdowns.module.css` declared `grid-template-columns: 1fr` — one
column at every width — so two donuts sat one above the other with roughly half
the card empty beside each.

Now `repeat(auto-fit, minmax(min(20rem, 100%), 1fr))` with `align-items: center`
and an asymmetric `gap` (row `space-5`, column `space-7`).

**The `min()` is not decoration.** This document already records that
`minmax(20rem, 1fr)` is a **320px reflow failure** — the track floor is a hard
minimum, so the item overflows its own grid in any container narrower than it
(T-082). `min(20rem, 100%)` collapses instead. Measured:

```
960px   419.5 + 419.5   same row, 24px gap    card 271px tall
768px   323.5 + 323.5   same row              0 overflow
320px   238             stacked               0 overflow, 0 page overflow
```

`auto-fit` also means a **single** breakdown spans the full row rather than
sitting in a half-width track — no conditional class needed.

RTL verified by measurement rather than assumed: both items on one row with the
first at `left: 500` against the second at `56`, i.e. the grid flows along the
inline axis and mirrors on its own. **axe 0 violations** in RTL.

## Parked

- **`chart-4` is the warning token and still carries the `rate` family.** That is
  a deliberate hold, not an endorsement: `/analytics` is an established screen and
  moving its hero colour is an owner decision. If a fourth neutral slot is ever
  wanted, `chart-1` (brand) is unused by any chart and measures the **highest
  contrast of the four** in light mode.
- **`chart-5` and `chart-6` are `major` and `error`.** They must never become
  series colours.
- **The eight-slot palette still fails the categorical validator** (T-111). This
  task did not touch that; it only stopped spending one colour everywhere.

## Proposed commit

```
style(charts): colour single-series charts by what they measure
```

## Next

Owner ruling on whether `/analytics` rates should move off the warning token.
