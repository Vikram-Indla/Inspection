# 2026-08-17 · T-147 — the coverage chart stops borrowing the AI accent

`task: T-147` · `status: done` · `duration: ~20m`
`rules applied: WEB-002`

---

## Goal

The "Strategic requirement coverage" widget (dashboard) and the analytics
blocked-measure gauge rendered their arc and bars in a bright saturated purple
that looked off-brand and inverted the widget's hierarchy. Fix the colour.

## Diagnosis

Both widgets pass `SERIES_ROLE.coverage` to `Gauge`/`BarSeries`. That role
resolved to `CHART_SERIES[2]` → `--sqx-chart-3` → **`--sqx-ai-main` (`#8B5CF6`)** —
the AI accent, which **WEB-002 reserves for AI features**. Coverage/blocked data
is not AI, so the widget was wearing a colour it is not entitled to, and the neon
purple was the loudest thing on the near-black canvas, pulling the eye to the
"Blocked by reason" bars ahead of the headline coverage gauge.

## Fix

`SERIES_ROLE.coverage: 2 → 1`. Coverage is a **proportion** (43% of measures have
a live source), so it takes the `rate` slot (`--sqx-chart-4` → `--sqx-warning-*`,
a restrained warm amber) rather than the AI accent. One line in the shared
`chart-palette.ts`, plus the comment updated to record why the AI accent is not a
data-series colour.

**Why this is safe:**
- `SERIES_ROLE.rate` (amber) was **used by no chart anywhere in the app**, so
  there is no collision.
- The only view where coverage co-occurs with another single-series chart is the
  operational dashboard (`pipeline-breakdown`, `volume` → cyan). Amber vs cyan is
  two of the palette's own CVD-validated trio, so colour-blind separation holds.
- Amber clears the palette's measured ≥ 5.7:1 graphical-object contrast floor in
  both themes.
- It fixes **both** consumers consistently — the dashboard `measure-coverage`
  and `analytics-blocked` — because both read the shared role.
- The categorical `CHART_SERIES` array is untouched, so multi-series charts keep
  the full cyan/amber/purple CVD trio.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates:typography` / `lint` — PASSED, no new violations
- [x] `npm run test:static` — 408 passed / 33 failed — exact baseline; **no spec
      asserts the coverage series colour, the `chart-3` token, or the AI colour**
- [ ] Visual confirmation — **owed.** The strategic coverage widget renders only
      for a planner/admin, and the inspector `/analytics` view shows no coverage
      chart, so this session could not render either surface. The change is a
      swap between two validated palette tokens; a planner/admin sign-in should
      confirm the amber.

## Parked

- If the brand acid-lime is wanted instead of amber (a bolder, more on-brand
  accent for a headline health metric), that needs the chart system to expose a
  lime slot — `CHART_SERIES` deliberately excludes brand-lime to keep it as the
  UI accent — which is a palette change request (WEB-002 §2), not this fix.

## Proposed commit

```
fix(charts): recolour coverage off the AI accent to the rate series
```
