# 2026-08-15 · T-113 — `/operations` was showing 4 visits and holding 49

`task: T-113` · `status: partial — one widget shipped, the rest declined with evidence; axe, e2e and a native Arabic review are owed` · `duration: ~1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-013, WEB-014`

---

## Goal

Give `/operations` the same treatment as `/analytics` (T-111) and `/dashboard`
(T-112): judge every item on the screen first, then build only what the data
honestly supports.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/operations/operations-states/operations-states.tsx` | created | — → 65 |
| `app/(app)/operations/RevampOperationsCenter.tsx` | modified (2 lines) | 171 → 173 |
| `i18n/locales/{en,ar}/operations.json` | +4 keys each | — |

## The review, item by item

| Item | Verdict | Reasoning |
| --- | --- | --- |
| Operational-state counts | **Chart** | 7 states computed, **2 rendered**. Built. |
| Active visits · On the way · Executing | Keep | Scalars with drill-through — the correct form. |
| Submitted today · Active alerts | **Never** | `configured: false` in code — honest absence. |
| Operations map | Keep | Already the right form for positions. |
| Exception board rows | Keep | The individual records are the payload, as with critical factories on `/dashboard`. |
| Regional summaries | Declined | Only render in the performance view, already carry their number, and pair `factories` with `active` — two denominators, one axis. Ranking by `active` alone would be honest but adds little over the existing list. |
| Exceptions by kind | Declined **for now** | A real candidate — `highlights` carries `kind` — but the board holds **one row** in this scope, so the chart would be a single bar. Parked rather than shipped empty. |

## Numbers

```
Route: /operations
Summary tiles report      Active visits 4 · On the way 0 · Executing 0
State distribution holds  New 24 · Submitted 15 · Prepared 10  =  49 in scope

So the screen was rendering 4 and discarding 49.
```

The `counts` object was already being passed into `RevampOperationsCenter` and
indexed twice (`counts.on_the_way`, `counts.executing`). The other five states
travelled the whole way to the component and were dropped.

## Decisions

**The card removes itself below two non-zero states.** One bar beside six zeros
says less than the tile that already shows the number, and an empty plot reads as
a broken one. `MIN_DISTINCT_STATES = 2`, and the card returns `null` under it —
the "gated, not deleted" rule this programme recorded in T-094.

**Raw `planning`/`operational_state` values are resolved at the boundary.**
`counts` is keyed by the database enum. `makeEnumLabel(locale)` resolves all
seven through `visits.enum`, which already carried them in both locales, so no
new enum keys were needed (WEB-008 §2, WEB-000 §9).

**One colour, ranked.** Seven states exceed the three validated chart slots, so
the states are ranked rather than categorised and no series colour is spent.

**No new i18n namespace.** `operations.json` exists in both locales; four keys
added to it. The surrounding file is dense `t(key, "English")` legacy — **not
touched**, per WEB-013 §5's "untouched files stay untouched".

## Accessibility

- Rendered and measured in **Arabic**: enum labels resolve (`جديدة · مُرسلة ·
  مُجهَّزة`), digits are Arabic-Indic (`٢٤ ١٥ ١٠ ٤٩`), and the RTL axis labels sit
  **clear of the bars** — the T-112 `direction: ltr` fix on `BarSeries` carries
  to this route automatically.
- `<main>` landmarks: **1**.
- **axe: 1 violation, and it is not this card.** `landmark-unique` (moderate) on
  `section[aria-labelledby="operations-map-panel"]`: two regions are both named
  *"المملكة العربية السعودية"*, a `<section>` and a `<div>`. Pre-existing, in the
  map layer. **Not fixed — see Blocked.**

## Verification

- [x] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — script does not exist
- [x] `npm run gates` — exits 1 at 77 v5 findings; unchanged, none in this file
- [ ] `npm run test:e2e` — not run

## Parked

- **Exceptions by kind** — `highlights` carries `kind`; build it when the board
  holds more than one row, or verify under a persona that sees more.
- **Inspector workload bars** on `/operations` — `buildWorkloadRows` returns
  `{assigned, active, completed, overdue}` per inspector, the same shape
  `BarCell` now serves on `/dashboard`. It renders in `workload-risk-section`,
  which this persona does not reach.
- **A time series is available here too** — `model.geoHistoryRows` carries
  `occurred_at`, so `Sparkline` would work without a new query.

## Blocked / open questions

- **The `landmark-unique` violation is in the map layer**, whose file is dense
  `t(key, "English")` legacy. Fixing the duplicate name properly means touching
  that copy, which is a migration this task was not scoped for and would have
  ballooned it. **Recorded rather than rushed** (WEB-008 §5).
- **Everything was measured under a Planner session.** `/operations` gates several
  sections by role — `sla-kpi`, `workload-risk`, `timeline-history`, `queues`,
  `monitoring` all exist and none rendered. The review above covers what a
  Planner sees; an Ops persona may change several verdicts.

## Proposed commit

```
feat(operations): chart the operational-state split behind the summary tiles
```

## Next

Re-run this review under an Operations persona, where five more sections render.
Tracker item T-115.
