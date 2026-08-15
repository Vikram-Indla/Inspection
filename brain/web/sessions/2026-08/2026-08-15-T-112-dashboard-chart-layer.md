# 2026-08-15 · T-112 — `/dashboard` gets a chart layer, and every Arabic bar chart stops overlapping itself

`task: T-112` · `status: partial — code complete, every static gate green and axe clean on both views in both themes; e2e, a native Arabic review and the first-load number are owed` · `duration: ~4h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-008, WEB-009, WEB-011, WEB-012, WEB-013, WEB-014`

---

## Goal

Give `/dashboard` the chart layer `/analytics` got in T-111 — but only where the
data honestly supports one — from an owner-selected widget set: **F1** measure
coverage, **C2** inspector table with inline bars, **A1** pipeline ranked bar,
**E3** activity sparkline.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/saqeel/charts/sparkline/sparkline.tsx` | created | — → 67 |
| `components/saqeel/charts/sparkline/sparkline.module.css` | created | — → 8 |
| `components/saqeel/charts/bar-cell/bar-cell.tsx` | created | — → 41 |
| `components/saqeel/charts/bar-cell/bar-cell.module.css` | created | — → 33 |
| `components/dashboard/measure-coverage/measure-coverage.tsx` | created | — → 65 |
| `components/dashboard/measure-coverage/measure-coverage.module.css` | created | — → 25 |
| `components/dashboard/pipeline-breakdown/pipeline-breakdown.tsx` | created | — → 64 |
| `components/dashboard/activity-trend/activity-trend.tsx` | created | — → 79 |
| `components/dashboard/activity-trend/activity-trend.module.css` | created | — → 27 |
| `components/dashboard/operational-charts/operational-charts.tsx` | created | — → 55 |
| `components/saqeel/charts/bar-series/bar-series.module.css` | fixed (RTL) | 30 → 34 |
| `components/saqeel/data-table/data-table.tsx` | extended (`headerHidden`) | 96 → 104 |
| `components/dashboard/operational-view/operational-view.tsx` | modified | 167 → 194 |
| `components/dashboard/strategic-view/strategic-view.tsx` | modified | 196 → 201 |
| `components/dashboard/dashboard-sections/dashboard-sections.tsx` | modified | 201 → 202 |
| `components/dashboard/requirement-register/requirement-register.tsx` | modified | 74 → 76 |
| `features/dashboard/strip.ts` | modified | 107 → 161 |
| `app/(app)/dashboard/dashboard-format.ts` | modified | 232 → 244 |
| `i18n/locales/en/dashboard.json` | modified | +31 keys |
| `i18n/locales/ar/dashboard.json` | modified | +31 keys |

## Decisions

**The coverage meter reports the register's own population, not the whole
dashboard.** `buildCoverage` is handed the same id list `buildMetricStrip` gets,
so the gauge is literally a summary of the table beneath it and the two can never
disagree. It therefore reads *2 of 4* (operational) and *2 of 6* (strategic), not
the ~13 blocked cards visible across the whole screen. A dashboard-wide coverage
figure is a **different card** and is parked, not smuggled into this one.

**A metric the projection does not know about is in neither numerator nor
denominator.** Counting an unregistered id as blocked would report a governance
failure where the truth is that the measure was never registered.

**No drill-through on the pipeline bars.** `BarSeries` supports `href`, but
`/planning` whitelists `tab` and `method` and has no governed planning-status
filter. Inventing one is WEB-008 §2's "never invent". The card links to
`/planning` whole, as its siblings do.

**Inspector load is a bar, never a utilisation gauge.** Daily capacity is
`Not configured` for every row, so there is no denominator. `15 of 20 · 75%`
would be a fabricated governed value.

**A daily trend refuses an unbounded scope.** `ActivityTrend` renders a sentence,
not a plot, when `fromDate`/`toDate` are null — the same refusal
`queryEnforcementTrend` already makes rather than inventing a window. The default
`/dashboard` scope *is* unbounded, so the sparkline only appears once a date
range is chosen. That is correct, and it means the widget is invisible on a cold
load.

**Days with no activity are plotted as zero, not skipped.** Dropping them would
compress the gaps and turn a quiet fortnight into a smooth line.

**`BarCell` takes the slot `BarSeries` defaults to.** It first used
`--sqx-chart-2` while `BarSeries` defaults to `series=1` → `--sqx-chart-4`, which
put two hues on one screen for the same "one series, length is the meaning" mark.
Aligned to `chart-4`.

**Number formatting was centralised rather than duplicated.** `formatCount` /
`formatPercent` were extracted out of `formatValue`, which already held the only
correct implementation, and every new call site plus the existing raw ones now go
through them. See Accessibility for what that fixed.

## Inventory taken before writing code

- **State and effects:** none added. Every widget is a Server Component; the
  three client islands are the existing `"use client"` chart primitives
  (`BarSeries`, `Gauge`, and the new `Sparkline`), which are client-only because
  Recharts is. No `useState`, no `useEffect`, no `let` in any new `.tsx`.
- **Literals mapped to tokens:** every value in the four new CSS modules is a
  `var(--sqx-*)`. **`--sqx-space-14` does not exist** — the scale stops at 13 —
  so the bar-cell track max width uses `--sqx-space-13` rather than adding a
  token (WEB-002 §2).
- **`<svg>`:** none authored. Charts come from Recharts inside
  `components/saqeel/charts/`; the two empty states use registry icons
  (`visits`, `radar`).
- **Raw database values:** `operational.pipeline` is keyed by raw
  `planning_status`. Resolved at the boundary through `makeEnumLabel(locale)` —
  `visits.enum` already carried all seven statuses in both locales, so no new
  keys were needed (WEB-008 §2 / WEB-000 §9).
- **Accessibility failures found in existing markup:** one, see below.

## Numbers

```
Route: /dashboard  (both views)
first-load JS   not measured — MEASUREMENT REQUEST (WEB-005 §8)
route CSS       not measured — MEASUREMENT REQUEST
LCP / INP / CLS not measured — MEASUREMENT REQUEST
client islands  2 → 3   (BarSeries, Gauge existed; Sparkline is new)
legacy CSS deleted: 0 lines — this task adds a layer, it does not migrate one
typography baseline: 1542, unchanged; gate reports 22 removed, as before
v5 gate: 77 findings before → 77 after, none in any file this task touched
```

**Rendered facts the screen was computing and discarding**

```
pipeline total 217 rendered as one number → 4 ranked statuses
   cancelled 117 · published 52 · draft 40 · returned 8
cancellation count 117 already visible in the planner strip — it is the
   largest single segment of the pipeline, which the screen never showed
inspector load spread 15 : 1 across 8 rows, previously two numbers 8 rows apart
```

## Accessibility

- **axe violations: 0. Incomplete: 0.** Measured on `main` for
  `?view=strategic` and `?view=operational`, light **and** dark, LTR and RTL.
- **One pre-existing violation found and fixed.** `empty-table-header` (minor) —
  `RequirementRegister`'s control column shipped `header: ""`, leaving an
  unnamed column for screen-reader users. Fixed by **extending the primitive**
  (WEB-014 §11.4) rather than working around it: `DataColumn` gained
  `headerHidden`, which renders the header inside `sqx-visually-hidden`. The
  header string is a new key in both locales (`dashboard.metric.basis`).
- **Charts never rely on colour.** Every bar is named and counted in text; the
  gauge prints numerator over denominator; the sparkline is a decorative plot
  whose figure carries the total and the peak day in prose, so a reader who never
  sees the line loses nothing.
- **The bar-cell bar is `aria-hidden`** — the number beside it is already the
  data, and announcing both reads the same fact twice.
- Manual checklist: keyboard ✅ (no new interactive surface — bars are inert, all
  controls unchanged) · Arabic/RTL ✅ · dark ✅ · light ✅ · reduced motion ✅
  (`isAnimationActive={false}` on every chart) · 200% zoom, 320 px, screen
  reader, greyscale — **not run**.

### Every Arabic bar chart in the application was overlapping its own labels

Found by rendering, not by reading. In RTL the SVG inherits `direction: rtl`,
which inverts what `text-anchor: end` means, so category labels extended
*rightwards* from the axis and ran under the bars:

```
before   label 168 → 203     bar starts 176      OVERLAP
after    label 103 → 168     bar starts 176      7px gap
```

Same defect on the value labels (`١١٧` at 669-682 against a bar ending at 677).
Fixed centrally in `bar-series.module.css` with `direction: ltr;
unicode-bidi: isolate` on `.tick` and `.value`.

**This was pre-existing and live on `/analytics` since T-111** — verified there
before touching anything, and re-verified fixed afterwards. LTR measured
unchanged. It is the fourth instance of this document's own rule: *a shared
primitive's debt is every route's debt.*

### The new widgets rendered Latin digits on the Arabic page

`٠` elsewhere, `50%` and `2 of 4` in mine. Fixed by routing every number through
`formatCount`/`formatPercent`. Fixing only the new widgets would have left the
screen half-and-half, so the existing raw sites on the same screen went too:

```
percent           ٪50            → ٪٥٠          (formatValue, all dashboards)
metric sub-line   7 من 85        → ٧ من ٨٥      (metricDisplay, all dashboards)
operational KPIs  9, 10, 0, 1    → ٩, ١٠, ٠, ١
strategic KPIs    9 · 33%        → ٩ · ٪٣٣
```

**These are visible changes beyond the four widgets and are deliberate.** After:
zero Latin-digit nodes remain in `main` on the Arabic dashboard except seed
inspector *names* (`Synthetic inspector1`), which are data.

### Typography (WEB-014 §9)

1. Violations removed: **0 added, 0 removed** — baseline 1542, unchanged. No new
   CSS module carries a font declaration.
2. Every sentence renders at `body`. No exceptions.
3. Exactly one `display` per route — unchanged; nothing new emits one.
4. All card titles are `heading` via `CardHeader`. The one new group heading is
   `Heading level={3} visual="subheading"` — "a named group inside a card"
   (§2), nested correctly under its card's `h2`; outline verified H2 → H3 with
   no skipped levels.
5. No new size, gap or padding. `--sqx-space-14` was wanted and does not exist;
   `--sqx-space-13` was used instead rather than adding a token.
6. No retired-role reference.

**Font sizes on the Arabic dashboard, measured after: `12 · 14 · 16 · 20 · 28`**
— five, all on the nine-role scale, one typeface (`plexArabic`). The set cannot
have grown: every new string is rendered by `Text` / `Heading` / `Metric`, whose
sizes were all already present on the page.

## Verification

- [x] `npm run typecheck` — **0 errors**. This also proves `en`/`ar` key-tree
      parity, since `Messages` is derived from the English file.
- [ ] `npm run lint` — **the script does not exist** (still absent, as T-102 and
      T-107 recorded).
- [x] `npm run gates` — **exits 1**, on `check:design-system-v5` at **77
      findings**. That number was 77 before this task began and **none of the 77
      names a file this task touched**. The chain was already red for everyone.
- [ ] `npm run test:e2e` — not run.
- [ ] Definition of Done — not fully ticked; see status.

## Retirement

Nothing marked, nothing deleted. This task adds a layer; it migrates no screen
off the frozen sheets.

## Parked

- **A dashboard-wide coverage card.** The meter built here covers only the
  requirement register's population (4 and 6). The screen shows roughly **13**
  blocked cards in total, and the honest headline figure for the whole dashboard
  is a separate widget.
- **`Risk-to-attention mismatch` renders `Unavailable` while `metrics.ts`
  computes it.** `strategic.riskAttention` has factory count, visit count and a
  ratio per band. That is a wiring gap, not a data gap, and it is the cheapest
  real chart left on the screen.
- **`/en/planning` returns Internal Server Error** on the running dev server.
  Pre-existing and unrelated — no planning file is modified and planning imports
  nothing this task touched — but it is broken right now.
- **`--sqx-chart-1…8` fails two validator checks T-111's TSDoc does not
  mention.** The separation figures it quotes are correct and pass; the **chroma
  floor** fails (`#215C66` light, `#7EE4F6` dark read near-grey as large fills)
  and in dark mode all three sit **above the lightness band** for fills. Nothing
  here is blocked by it — every widget shipped is single-colour or exactly three
  categories — but the TSDoc's "clears every check in both themes" overstates it.
- **`direction: ltr` on chart text is right for pure-Arabic labels** and could
  misorder a label that mixes scripts at its boundary. No such label exists
  today. A locale-aware `text-anchor` would need a `[dir="rtl"]` rule, which
  WEB-002 §6 forbids.
- **The activity sparkline is invisible on a cold load**, because the default
  dashboard scope is unbounded. Either the dashboard gets a default period or the
  card gets a control; both are design decisions, not code ones.

## Blocked / open questions

- **This was all rendered under a Planner session.** Several measures are
  role-scoped rather than missing — the enforcement card says so outright — so
  the coverage denominators and the blocked-reason ranking will differ under
  Leadership or Compliance Admin. Re-run before treating the figures as the
  screen's truth.
- **The Arabic is mine, not a native reviewer's** (WEB-011 §2). 31 new keys.

## Proposed commit

```
feat(dashboard): add coverage, pipeline, workload and activity charts
```

## Next

Re-run the two views under a Leadership persona and re-read the coverage figures;
then diagnose why `riskAttention` renders `Unavailable`. Tracker item T-113.
