# 2026-08-17 · T-149 — the coverage widget stops being two charts that say the same thing twice

`task: T-149` · `status: done` · `duration: ~1.5h`
`rules applied: WEB-002, WEB-004, WEB-013, WEB-014`

---

## Goal

Follow-up to T-147. Recolouring the "Strategic requirement coverage" widget off
the AI accent removed the *loudness* but not the *shape* — it was still a
2-slice donut next to a full-width bar, and it read as cluttered. Rebuild the
`measure-coverage` widget so the little data it carries (live vs blocked, over a
small population) is shown once, clearly, in the Linear language.

## Diagnosis

Two independent flaws, one structural cause — the widget drew **two charts for
one fact**:

1. **The "Blocked by reason" bar was always 100 % wide.** `BarSeries` was fed
   `domainMax = Math.max(...counts, 1)` — the single blocked reason's own count.
   A lone bar whose value equals its domain max fills the track every time,
   regardless of the number. It carried zero comparative information and was the
   loudest object on the card — the "clutter".
2. **The donut was a 2-slice ratio** (live % against its own track) — a
   catalogued anti-pattern; a `Gauge` earns its ink on composition, not one ratio.
3. **The two were redundant.** `live + Σreasons = total`, so the donut's empty arc
   and the blocked bar are the same quantity (`total − live`) drawn twice.

## Fix

Replaced `Gauge` + `BarSeries` with a single **stacked segmented meter**: one
hairline-tall track split into `live | reason₁ | reason₂ …`, each segment's
`flex-grow` set to its count via a token-valued `--sqx-seg` custom property, so
the segments sum to the total and the proportions are exact. Below it, a text
**legend** — a swatch + label + count per segment. `percent` is rendered as a
`Metric`, not an arc.

- **Colour carries meaning correctly now:** `--sqx-status-success` = live,
  `--sqx-status-warning` = blocked. Two colours only, so it is CVD-safe, and
  **reason identity comes from the legend label, never hue** (WEB-002 §5 — status
  is text + shape). When there are three blocked reasons they stack in the same
  bar and are told apart by their labels, which is the comparison the old
  always-100 % bar could never show.
- **No `<svg>`, no chart library** in this widget — the meter is CSS segments.
- **Accessibility:** the `<figure role="img">` carries the summary aria-label
  (`{live} of {total} … have a live source`); the track is `aria-hidden`; the
  legend is real readable text. The all-live case keeps its `figcaption`
  reassurance.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `components/dashboard/measure-coverage/measure-coverage.tsx` | rebuilt — segmented meter | 72 → **84** |
| `…/measure-coverage.module.css` | rebuilt — token-only track + legend | 25 → **75** |
| `i18n/locales/{en,ar}/dashboard.json` | dropped `reasons` + `reasonsAria` from `charts.coverage` | −2 keys each |
| `components/dashboard/strategic-view/strategic-view.tsx` | dropped the `headingId` prop | −1 |
| `components/dashboard/operational-view/operational-view.tsx` | dropped the `headingId` prop | −1 |

## Decisions

**The strings contract shrank from 6 keys to 4.** `meterLabel` / `meterAria` /
`ratio` / `allLive` stay; `reasons` ("Blocked by reason") and `reasonsAria`
described the old separate bar chart and were removed from both locales — the
legend is self-describing (label + count), so no group heading is needed. The
`headingId` prop drove that heading and is gone, so both consumers lost one line;
their `coverage` / `strings` wiring is otherwise unchanged.

**`Gauge` and `BarSeries` were not retired.** Grep confirms both remain in use —
`Gauge` by `localization-coverage`, `analytics-blocked`, `analytics-rates`;
`BarSeries` by `pipeline-breakdown`, `operations-states`, two analytics widgets.
This task only stops `measure-coverage` from using them.

**`SERIES_ROLE.coverage` (the T-147 amber slot) is no longer read here.** The meter
uses semantic status tokens, not the categorical chart palette. `analytics-blocked`
still reads `SERIES_ROLE.coverage`, so the T-147 recolour still matters there; the
shared role and its comment are untouched.

**Scope held to the dashboard widget.** `analytics-blocked` renders its own blocked
gauge and is a separate component — not in this task. The user's screenshot was the
dashboard strategic/operational widget.

## Inventory taken before writing code

- **State/effects:** none — the widget is a pure projection of `MeasureCoverage`;
  no client state, no effects, server-rendered inside the dashboard views.
- **Data:** `MeasureCoverage = { live, total, percent, reasons[] }` from
  `features/dashboard/strip.ts`, `live + Σreasons = total`. Untouched.
- **Literals / `<svg>`:** none in the old file (it composed primitives); the new
  file adds none — colours are status tokens, sizes are space/radius tokens, the
  only inline style is the `--sqx-seg` token-valued custom property (the sanctioned
  `segmented-control` pattern).
- **Strings:** centralised in `dashboard.charts.coverage` (en+ar); both consumers
  pass the whole object, so the contract changed in one place, two locales.
- **Consumers:** `strategic-view`, `operational-view` — prop shape otherwise
  unchanged; no new token, no new saqeel primitive, so no change-request blocker.

## Numbers

```
Widget: dashboard measure-coverage (strategic + operational views)
component            72 → 84   (< 200)
module css           25 → 75   (token-only)
charts used          Gauge + BarSeries → 0 (CSS segmented meter)
redundant viz        2 → 1
always-100% bar      removed
strings contract     6 keys → 4  (reasons/reasonsAria dropped, both locales)
consumer edits       2 (one prop line each)
```

## Accessibility

- `<figure role="img">` with the `{live} of {total}` aria summary; decorative
  track `aria-hidden`; legend is real text (swatch is `aria-hidden`, never the
  sole carrier of meaning — label + count accompany it). RTL falls out of the
  flex track's `direction` handling; `dir="auto"` on each reason label.
- Manual checklist: keyboard n/a (no interactive elements) · Arabic/RTL —
  strings present, logical properties, flex track mirrors · dark ✓ (by tokens).
  **axe, light theme, 200 % zoom, and a live render still owed** — the widget
  renders only on the planner/ops dashboards.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED, none new (7450 held)
- [x] `npm run gates:typography` — PASSED, none new (1232 held)
- [x] `npm run check:design-system-v5` — **64** (unchanged); measure-coverage adds **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [ ] live render + axe + light theme + 200 % zoom — **owed** (planner/ops sign-in;
      this session is an inspector, and entering another persona's password is
      out of scope for the agent)

## Parked

- A faithful static mock of the new meter was shown to the owner for sign-off; a
  browser pass on the real planner/ops dashboard is owed.
- If a headline metric ever wants the brand acid-lime instead of status-success,
  that is still a palette change request (WEB-002 §2), not this widget.

## Blocked / open questions

None.

## Proposed commit

```
refactor(dashboard): rebuild coverage widget as one segmented meter
```

## Next

Back to the `/field` migration list — `settings` is the next unblocked slice.
