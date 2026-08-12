# 2026-08-13 · T-100 — the workload screen measures the right thing, and the planning family finishes its Arabic

`task: T-100` · `status: partial — verified in Arabic; English render, axe and 11 Arabic strings owed` · `duration: 2h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-006 §4, WEB-008, WEB-009, WEB-011, WEB-013, WEB-014`

---

## Goal

Owner-reported: `/planning/workload` is boxes of zeros and should be rebuilt on
the design system without violating the typography contract; and the planning
family still renders English inside the Arabic view.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `features/visits/workload.ts` | **created** | 0 → 163 |
| `components/sections/visits/visit-workload/visit-workload.tsx` | **created** | 0 → 123 |
| `components/sections/visits/visit-workload/visit-workload.module.css` | **created** | 0 → 7 |
| `components/sections/visits/visit-workload/workload-skeleton.tsx` | **created** | 0 → 55 |
| `components/sections/visits/visit-workload/workload-skeleton.module.css` | **created** | 0 → 43 |
| `app/(app)/visits/workload/WorkloadView.tsx` | rebuilt | 141 → 56 |
| `app/(app)/visits/workload/loading.tsx` | rebuilt | 8 → 14 |
| `i18n/enum-label.ts` | edited | 16 → 30 |
| `i18n/locales/{en,ar}/visits.json` | edited | +23 keys each |
| `lib/ksa-regions.ts` | edited | +11 |
| `features/planning/view.ts` | edited | 1 line |
| `components/planning/planning-toolbar/filter-controls.tsx` | edited | −6 |
| `app/(app)/visits/map/MapView.tsx` | edited | +4 |
| `scripts/typography-baseline.json` | updated | 734 → 733 |

## Decisions

**The screen was spending six of ten columns on 5% of its data.** Measured
before touching anything: **2 of 42 active visits fell inside the six-week grid,
40 were in "Later", and 64 of 66 week cells were zero.** The one column carrying
95% of the load was an unlabelled catch-all.

**"Relative utilization" was not a utilization, and the design system already
said so.** `TrendBars`' TSDoc states that a series charted against its own
maximum *"exaggerates a flat run"* and that a governed measure should be passed
through unchanged. The screen charted against `maxCell`/`maxTotal`, so **100%
meant "has the most", not "is at capacity"** — and it moved when somebody else's
load changed. The footnote admitted it in 11.5px grey.

**Comparing an all-time total to a per-day cap would have been the same category
error in a new coat.** `daily_visit_cap` governs visits *per inspector per day*;
an inspector with 15 active visits spread over months is not "over" it. The
column is now **peak day vs the governed cap** — the two quantities are finally
the same kind of thing. The top inspector reads **3 of 10**, not 100%.

**Weekly bars are a distribution and are labelled as one.** They keep a shared
scale across rows so inspectors are comparable, and the column header says
"next six weeks", not utilization. **No weekly cap was invented** —
`dailyCap × 5` would have been a governed value pulled out of the air (rule 9).

**`TrendBars` also fixed the zero problem for free.** It renders a point at zero
as a dashed baseline *"because an absence must never read as a small quantity"*
— the exact anti-pattern of the 64 grey tracks. **64 of 77 bars now render
`data-zero`.**

**The capacity bar is `aria-hidden`, deliberately.** It duplicates the adjacent
text, so leaving it exposed made a screen reader say "3 of 10" three times. The
distribution bars stay exposed because there they are the *only* encoding.

**The banned cast is gone, not relocated.** `as unknown as Row[]` became a
narrowing boundary: `isRecord`/`embedded`/`text` type predicates, with the
Supabase to-one embed (typed as an array, returned as an object) resolved once
in `toAssignment`. Rule 5 satisfied without an assertion anywhere.

**`WorkloadView.tsx` kept its path and its one comment, knowingly.** `cd-026`
reads the file as source text and requires `console.error`, `loadErrorNeutral`,
`expire_lapsed_visits_scheduled` and no JSX `{error.message}`. **All five
assertions were re-verified by script against the rebuilt file**, and the
governance marker survives as a comment because deleting it for the
zero-comment rule would weaken an accepted behaviour — the same call T-097 made.

### The Arabic sweep

**Every remaining English string on the four routes was found by measuring, not
reading** — a DOM walk over `.sq-content` and the route pagehead, collecting
Latin-script text while `lang="ar"`.

| Route | Before | Cause |
| --- | --- | --- |
| `/planning` | `Follow-up`, `Periodic`, `Low` | `planning_lookups.label_ar` is seeded **NULL**; the code's `labelAr ?? labelEn` then renders English |
| `/planning/calendar` | none | closed by T-098 |
| `/planning/map` | `Riyadh`, `Riyadh · 2nd Industrial City` | region names rendered raw; `KSA_REGION_LABELS` existed and was not used |
| `/planning/workload` | title, context, 3 toggles, heading, 4 headers, footnote | `t("key", "English")` throughout, and `getDict()` returns `{}` (T-086) |

**The lookup fallback now goes through the translation, not through English.**
`makeLookupLabel(locale)(key, governed)` returns the governed label when the row
has one for this locale and the shared `visits.enum` translation when it does
not. **The database is untouched** — seeding `label_ar` later still wins.

**`regionLabel` was duplicated in two files and used in neither of the places
that needed it.** Extracted to `lib/ksa-regions.ts` beside the table it reads;
`filter-controls` now imports it instead of re-deriving it, and `MapView`
localises `region` once where the rows are built, which reaches the map pins,
the coverage panel and the table together.

**Localising the region broke `placeLabel`'s dedupe, and that was mine.** The
guard `region === city` compared raw values; with the region localised,
`الرياض` no longer matched `Riyadh` and the label rendered **"الرياض · Riyadh"**.
Fixed by deduplicating on the source values before localising. **Caught by
re-measuring after the change, not by review.**

## Numbers

```
Route: /planning/workload   (measured live, seeded Planner, Arabic)

visits inside the six-week grid    2 of 42     week cells at zero  64 of 66
columns                           10 → 6       every one carrying information

rendered type          before                          after
  14px/400  ×75  body ✓                          12px/600 ×114  label ✓
  14px/700  ×22  OFF-SCALE (no 700 at body)      14px/600  ×23  bodyStrong ✓
  11.5px/400 ×12 OFF-SCALE (t-caption)           14px/400  ×11  body ✓
  11.5px/500 ×10 OFF-SCALE (t-caption)           28px/700   ×4  metric ✓
  14px/600   ×2  bodyStrong ✓                    30px/700   ×1  display ✓
  15px/600   ×1  OFF-SCALE (bare <h4>)           20px/600   ×1  heading ✓
off-scale elements    45 → 0        display per route: exactly 1
inline-styled         169 → 78, and all 78 are token-valued custom properties
                                   (--sqx-trend-value ×77, --sqx-segment-* ×2)
legacy classes        sq-table · sq-td-num · numeric · row · t-caption · panel → 0
banned casts          1 → 0         <main> landmarks on loading  2 → 1
typography baseline   734 → 733     (one CSS violation removed and locked in)

Arabic sweep, Latin text remaining in page content (excluding data)
  /planning           3 → 0      /planning/calendar   0 → 0
  /planning/map       3 → 1      /planning/workload  10 → 0
visits.json keys per locale  253 → 276   (parity 276 = 276)
```

## Accessibility

- **axe: not run.** The pane is displayed only intermittently. **Owed.**
- Manual checklist (WEB-003 §10): **Arabic/RTL passed** on all four routes.
  keyboard · screen reader · 200% zoom · 320px · dark · reduced motion ·
  greyscale — **owed**.
- **Fixed:** the busiest cell signalled by colour and weight alone; it is now a
  `StatusPill` carrying the words *over the limit*. Every bar has a
  visually-hidden label. `<main>` count on the loading state is **1**.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates` — no finding on these routes
- [x] `npm run gates:typography` — **733, one removed, baseline updated**
- [x] `cd-026` path-pinned contract — all five assertions re-verified by script
- [ ] `npm run test:e2e` — needs a production build; **owed**
- [ ] Definition of Done (WEB-006 §5) — not fully ticked; see Blocked

## Retirement

`RouteLoading` is off `/visits/workload`. **~24 segments still import it** — the
parked app-wide retirement from T-096 is one route smaller.

## Parked

- **`planning_lookups.label_ar` is NULL for every `visit_type` and `priority`
  row.** The JSON fallback now covers the seven keys the planning routes render,
  but the database is still the right home. Seeding it is a data task.
- **City names have no translation source.** `الرياض · 2nd Industrial City`
  is the one Latin string left on `/planning/map`; `factories.city` is free
  English text and there is no cities table to read from. Needs a ruling.
- **`MapView.tsx:75` still carries `as unknown as VisitRow[]`** — the same
  banned cast this task removed from workload, in another session's file.
- **WEB-014 §5.2's "reference implementation" is `saqeel/data/MetricStrip.tsx`,
  which itself violates the contract** — inline `fontSize: 20`,
  `fontWeight: 600`, legacy `--status-*` tokens. `StatCard` was used instead.
  The rule should be re-pointed or the component migrated.

## Blocked / open questions

- **11 Arabic strings need a native review** — the `workload` namespace
  (`عبء العمل النشط حسب المفتش`, `خارج النافذة`, `أكثر يوم مقابل الحد`,
  `داخل النافذة`, `تجاوز الحد`, and the note) plus the four priority values
  (`منخفضة`, `متوسطة`, `عالية`, `عاجلة`).
- **The English render was not captured** — the session locale is `ar` and
  `/en/…` does not flip the cookie-driven locale.

## Proposed commit

```
refactor(visits): rebuild inspector workload on the governed daily cap
```

## Next

Capture the English render, run axe on the four planning routes, and take the
city-name translation ruling.
