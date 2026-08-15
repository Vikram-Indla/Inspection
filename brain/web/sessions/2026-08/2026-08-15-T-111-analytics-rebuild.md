# 2026-08-15 · T-111 — `/analytics` gets a chart layer, and loses the data it was throwing away

`task: T-111` · `status: partial — code complete, every static gate green; axe, e2e, native Arabic review and the bundle number are owed` · `duration: ~6h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-005 §8, WEB-008, WEB-009, WEB-011, WEB-013, WEB-014`

---

## Goal

Migrate `/analytics` off the frozen sheets, replace 26 uniform KPI cards with charts,
and build a reusable chart layer that other screens can adopt.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/analytics/page.tsx` | rebuilt | 120 → 50 |
| `app/(app)/analytics/loading.tsx` | rebuilt on a matching skeleton | 11 → 13 |
| `app/(app)/analytics/error.tsx` | rebuilt off `StateSurface` | 5 → 40 |
| `components/saqeel/charts/chart-palette.ts` | created | 0 → 29 |
| `components/saqeel/charts/bar-series` | created | 0 → 119 |
| `components/saqeel/charts/donut` | created | 0 → 70 |
| `components/saqeel/charts/gauge` | created | 0 → 57 |
| `components/saqeel/primitives/use-media-query.ts` | **extracted from the shell** | 0 → 30 |
| `components/app-shell/shell-topbar/shell-scope-controls.tsx` | edited — local hook deleted, imports the extracted one | −12 |
| `components/saqeel/date-range-picker` | edited — gained `id` | +7 |
| `components/sections/analytics/*` | created — 7 sections | 0 → 613 |
| `features/analytics/{view,strings,groups,bottlenecks}.ts` | created | 0 → 192 |
| `i18n/locales/{en,ar}/analytics.json` | created | 0 → 163 keys each |
| `i18n/messages.ts` | edited — namespace registered | +5 |

## Decisions

**Recharts, on the owner's instruction, after I recommended against it.** My case was
that every form the data supports — meter, ranked bar, part-to-whole — is a track and
a fill that CSS already draws, and a library adds ~7.5 MB unpacked for shapes
`trend-bars` renders in twenty lines. The owner chose the library; it is Recharts
3.10.1, the only major option declaring React 19 in its peers.

**The tokens carried theming with zero JavaScript, and that was verified before
building on it.** Recharts writes `fill="var(--sqx-chart-2)"` straight into the SVG and
the browser resolves it per theme:

```
declared            light            dark
var(--sqx-chart-2)  rgb(33,92,102)   rgb(126,228,246)
```

**`--sqx-chart-1…8` fails the categorical validator in both themes.** Slots 4↔5↔6 sit
at **ΔE 3.0 deutan / 5.1 normal** — indistinguishable to every reader, colour-blind or
not. Only slots **2, 4, 3** clear every check (light 16.0 normal / 12.4 protan; dark
20.8 / 18.1), so `CHART_SERIES` is **three slots, not eight**, with the evidence in its
TSDoc. Widening it is a token change request (WEB-002 §2), never a code edit.

**Line charts are impossible without a backend change, and were not faked.**
`analytics_metric_snapshot` returns one row per metric for one period. `p_group_by`
looked like a free second dimension and is not — lines 518–520 show it only *filters
which rows return*. A funnel of 58 visits → 9 published was also rejected: those are
not stages of one cohort, and composing them asserts a conversion the RPC never made.

**A 2-slice donut is an anti-pattern, so ratios are gauges.** The owner asked for
donuts; the dataviz catalog bans "a 2-slice pie" and "a donut for comparing close
values" outright. A single ratio against its own track is a meter — bent into a circle
for the hero rates, straight for the ranked comparison.

**Counts are grouped small multiples, each scaled to its own group's maximum.** Eleven
counts do not share a unit: 54 factories against 58 visits on one axis is the
dual-axis error wearing a different hat. Three bands — visits, coverage, evidence and
enforcement — make the bar lengths mean something again.

**Bar labels are SVG `<a>` elements.** Recharts renders bars inside SVG, and there is
no way to make a `<Bar>` a focusable link. A custom axis tick emitting `<a href>`
keeps every drill target keyboard-reachable — confirmed live: focus lands, name reads
"Visit volume 58", 3px ring. Without it the owner's restored drill-through would have
been mouse-only.

## Inventory taken before writing code

- **State**: none. The screen is server-rendered; the only client leaves are the three
  chart primitives and the filter form, each justified by an external dependency
  (Recharts' DOM measurement, `matchMedia`, the range picker's draft state).
- **Effects**: zero written. `useMediaQuery` is `useSyncExternalStore`; `error.tsx`
  reads `documentElement.lang` the same way rather than through `useEffect`.
- **Literals**: the whole page was hardcoded English, including on the Arabic route.
- **`<svg>`**: none hand-written. Recharts emits its own; rule 8 governs icons.
- **Accessibility failures found**: two `<main>` landmarks (`page.tsx:26` nested inside
  `AppShell`'s), 26 identical drill links, and ten "Unavailable" cards at the same
  visual weight as real data.

## Numbers

```
Route: /analytics
leaf text nodes        207 → 96
KPI cards               26 → 4 meters · 2 donuts · 3 bar bands
"View governed records" ×26 → 0   (the metric itself is the link)
<main> landmarks         2 → 1
legacy classes          14 → 0
charts                   0 → 11
route file             120 → 50
i18n keys                0 → 163 × 2 locales
Latin words on the Arabic page   90 → 0
v5 gate (repo)         105 → 103 · route-owned 1 → 0
```

**first-load JS, route CSS, LCP, INP, CLS: not measured.** Recharts is code-split to
this route because the charts are `"use client"` leaves, but the real delta needs a
production compile — **handed back as a measurement request** (WEB-005 §8).

## Accessibility

- **axe: not run.** Owed.
- **Manual checklist (WEB-003 §10): not performed.** Owed.
- **Verified by measurement:**
  - Nested `<main>` removed — 2 → 1 landmark.
  - Every chart carries `role="img"` with a data-bearing `aria-label`, or is a list of
    links with individual names.
  - Bar-axis links take keyboard focus with a visible ring.
  - Filter controls are labelled — the accessibility tree reads `combobox "Region"`,
    `"Inspection type"`, `"Status"`, `button "Period"`, `"Comparison period"`.
  - Zero-valued bars render a 2px de-emphasis stub, so absence never reads as a small
    quantity.
- **Fixed mid-task, found by the accessibility tree:** `title={metric.definition}` on a
  drill link **became its accessible name** — `link "Visits at planning status expired
  ÷ visits in the period…"`. An explicit `aria-label` restored `"Expired-visit rate
  34.5%"` while `title` kept the definition as a tooltip.

## Verification

- [x] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — the script still does not exist
- [x] `npm run gates` — typecheck + typography PASS; v5 fails on 103 pre-existing
      findings, **none owned by this route**
- [ ] `npm run test:e2e` — not run
- [x] Rendered and measured at 375 / 768 / 1280 in both locales
- [ ] Definition of Done (WEB-006 §5) — **not fully ticked**

**Rule sweep over all new code:** `any` 0 · `let` 0 · hand-written `<svg>` 0 · px or hex
in feature CSS 0 · typography in feature CSS 0 · hardcoded copy 0 · comments outside
the design-system zone 0. One `locale === "ar" ? "ar" : "en"` survives in
`analytics-filters.tsx:26` — a BCP-47 tag for `Intl`, not copy, mirroring
`lib/dates.ts:21`.

**Locale purity, scripted:** 163 keys, both locales, no Arabic in `en`, no Latin prose
in `ar`, identical key sets.

## Retirement

Nothing deleted. `StateSurface` loses one consumer (`analytics/error.tsx`) and stays
live elsewhere. `metric-registry.ts` keeps its keys, formatters and lineage traces; only
the **copy** moved to the namespace.

## Parked

- **The 8-slot chart palette is unusable as a categorical scale.** Only 3 of 8 slots are
  safe. Fixing it is a token change request with measured contrast per WEB-002 §2.
- **Violet now does double duty** — slot 3 is both the third donut category and the
  counts bars. Only resolvable by widening the palette.
- **`AN-AC-010` is on two metrics** — `compliance_result_distribution` and
  `factory_approved_outcome_recency`. These are governed lineage keys; a duplicate is
  either deliberate or a registry defect. Untouched either way.
- **`ping-dot` overflows its container by 4px at 375px.** Pre-existing, app-wide.
- **Still no `LocaleProvider`.** `error.tsx`'s server snapshot is `en`, so a
  server-rendered error shows one English frame in Arabic. ~25 boundaries share this.
- **`Export` is listed as blocked but no longer appears as a disabled control**, which
  is arguably better but is a behaviour change worth a ruling.

## Blocked / open questions

**The 52 Arabic metric strings need a native reviewer.** I wrote them. Terminology is
consistent with the existing `ar` files, but these are governed definitions on a
ministry platform — particularly the formula sentences carrying `÷` and the exclusion
clauses. **This is the single largest risk in the task.**

## Proposed commit

Already committed across eleven subjects, `ae1f64d8` … `6579e75c`. The last uncommitted
file is `analytics-error.module.css`:

```
refactor(analytics): rebuild the error boundary on saqeel primitives
```

## Next

Run axe and the manual checklist with a seeded planner, then hand back the production
build for the first-load number. That closes T-111 from `partial` to `done`.
