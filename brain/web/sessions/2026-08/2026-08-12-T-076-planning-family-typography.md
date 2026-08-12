# 2026-08-12 · T-076 — planning family typography (visible pass)

`task: T-076` · `status: partial — visible defects fixed on all three routes; primitive migration outstanding` · `duration: 1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014`

---

## Goal

Owner asked for all three planning routes. This pass fixed every **rendered**
defect; the CSS-to-primitive migration is not finished.

## What changed

| File | Action |
| --- | --- |
| `planning/planning-visit-table/*.module.css` | `.head` `overline` → `label` |
| `planning/planning-assistant/*.module.css` | `.heading` `overline` → `heading` (owner ruling) |
| `planning/planning-visit-table/visit-drawer.module.css` | `.groupTitle` `overline` → `subheading` |
| `planning-bulk/review-{assignment-split,consequence-ledger,outcome}` | KPI labels `overline` → `label` |
| `planning/bulk/EligibilityLedger.tsx` | legacy `.kpi-label`/`.kpi-value` globals → `Text`/`Metric` |
| `planning-single` × 4 components | 7 `eyebrow` → `description`, 4 needing a merge |
| 27 `.module.css` across the family | 37 retired-role refs → canonical |
| `scripts/typography-baseline.json` | 937 → 893 |

## Decisions

**The most-repeated defect in this programme appeared twice more.**
`planning-visit-table` hand-rolls its own `<table>` with `<th className="head">`
on `overline` (11px) — it does **not** use the shared `DataTable`, whose
identical defect was fixed in T-059. Three `planning-bulk` components did the
same for KPI tile labels. That makes **five and six** instances of
overline-where-`label`-belongs.

**A hand-rolled copy inherits the original's bugs and none of its fixes** —
the same conclusion T-071 reached about the live map. `planning-visit-table`
should be `DataTable`; that is structural and out of this task's scope, but it
is why the defect existed at all.

**The `81.5` defect class appeared again on `/planning/bulk`.** Two KPI numbers
on one screen at **32px and 28px**. The 32px came from `.kpi-value`, a **legacy
global in the frozen `saqeel-components.css`** (10.5px label / 32px value),
still shared with several admin screens. Per CLAUDE.md the frozen sheet stays;
the migrated screen stops using it. `EligibilityLedger` now composes
`Text`/`Metric`, so both numbers render at 28px and the label at 12px.

**Four of the seven eyebrow swaps collided with an existing `description`.** The
eyebrow held a step label ("Selected profile", "Step 2", "CR identity") and the
description held source/freshness provenance — both are supporting context, so
they were **merged with the ` · ` separator the descriptions already used**. No
new i18n keys, no copy invented. The naive swap produced duplicate JSX
attributes and was caught by typecheck.

**A line-based swap replaced a failing regex.** The attribute-pair regex matched
nothing across all 7 sites; rewriting it to operate on adjacent lines worked
first time. **When a structural regex silently matches zero, stop tuning it and
change approach** — a silent zero-match is the same failure mode as T-058's gate
rule that matched 0 of 24.

## Inventory taken before writing code

- `git log` checked; other agent's work is on `visits/`, no overlap.
- All three routes' static debt enumerated: **172 violations**.
- **The parked dead-tree finding re-verified**: all 7 components in
  `components/sections/planning/*` still have **zero importers** — 30 of the 172
  are dead. Fourth dead tree after `DashboardView`, `FactoryList` and
  `operations.module.css`.
- `/planning` and `/planning/bulk` rendered and measured **before** any edit.

## Numbers

```
                          before   after
/planning sizes              6        5     (30 · 28 · 20 · 14 · 12)
/planning off-scale          0        0
/planning/bulk sizes         8        6     (30 · 28 · 20 · 16 · 14 · 12)
/planning/bulk off-scale     1 (32px) 0
11px nodes (both routes)    15        0
planning violations        172      128     (30 of which are dead code)
repo violations            937      893
```

Baseline diff audited: **all 44 removals are planning-scope**, none absorbed
from the concurrent `visits/` work.

## Accessibility

- **axe:** not run. **Owed.**
- Manual (WEB-003 §10):
  - screen reader — heading levels unchanged; `EligibilityLedger`'s
    `aria-live="polite"` preserved by wrapping `Metric` rather than replacing
    the live region
  - table column headers keep `scope="col"`; only the font role changed
  - smallest text rose 10.5–11px → 12px across the family
  - **320px, Arabic/RTL — not verified. Owed.**
- No colour or tone change.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates:typography` — PASSED, 893 known, **44 removed**
- [x] **`/planning` rendered signed-in, before and after** — 6 → 5 sizes, 11px
      eliminated, AI heading now 20px, 0 off-scale, one typeface
- [x] **`/planning/bulk` rendered signed-in, before and after** — 8 → 6 sizes,
      32px eliminated, both KPI numbers at 28px, 0 off-scale
- [x] **`/dashboard` regression check completed** (owed since T-072) — 5 sizes,
      0 off-scale; the new 16px is the `EmptyState` title from T-075 behaving as
      intended
- [x] Baseline diff audited — 44/44 planning-scope
- [ ] **`/planning/single` after-state NOT re-rendered.** It rendered earlier in
      the session (4 sizes, 0 off-scale) but the pane would not complete it
      afterwards; SSR is healthy and the session was confirmed alive. **The 7
      eyebrow swaps and 4 description merges are unverified in a browser.**
- [ ] axe, 320px, Arabic/RTL — **owed**

## Retirement

**Fourth dead tree confirmed:** `components/sections/planning/*` — all 7
components, **30 violations**, zero importers. Joins `DashboardView`,
`FactoryList` and `operations.module.css`/`operations-details.tsx`. Four orphan
trees now want one deletion task.

## Parked

- **The primitive migration is outstanding — ~98 live violations.** Almost all
  are one pattern: `font-size: var(--sqx-text-<role>-size)` plus a weight,
  hand-assembling a role from parts instead of composing `Text`/`Metric`. No
  visual defect; purely architectural.
- **`planning-visit-table` should be `DataTable`.** Rebuilding it on the
  primitive would have prevented this task's headline defect.
- `/planning/single`'s browser verification.

## Blockers

None.
