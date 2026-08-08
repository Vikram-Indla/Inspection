# 2026-08-08 · T-020 (detail page) slice 5 — registry sections + UI consistency pass

`task: T-020 /factories/[id] transform (sliced, slice 5 of ~6)` · `status: done` · `duration: ~1.5h`
`rules applied: WEB-002, WEB-009, WEB-012`

---

## Goal

Two things in one pass, on owner request:

1. **UI consistency** across the migrated factories surface — pill labels that
   started lower-case, raw snake/colon source codes rendered as pills, and pills
   that top-aligned instead of centring next to their siblings.
2. **Slice 5** — migrate the five remaining `/factories/[id]` registry sections
   (documents, representatives, products, materials, workforce) off
   `sq-table`/`sq-banner`/`sq-state`/`sq-kpi` onto SAQEEL primitives.

## What changed — consistency pass

| File | Change |
| --- | --- |
| `components/saqeel/status-pill/status-pill.module.css` | Dropped `align-self: flex-start` (it overrode the parent's `align-items: center`, so pills top-aligned in every row/header) and added `vertical-align: middle` for inline use. `inline-size: fit-content` already prevents column-stretch, so nothing stretches. **Global primitive change** — affects dashboard/operations pills too (the intended consistency). |
| `app/(app)/factories/[id]/page.tsx` | `enumLabel` now runs its result through the shared `titleCase` (imported from `features/factories/portfolio`), so every enum-derived pill/label is Title Case instead of raw lower-case snake. Provenance no longer prints the raw `f.source` code: test sources (`saqeel_test_data` or any source containing `"test"`, e.g. `demo_seed:local-test-data-v1`) map to the test pill (warning), `senaei` → registered (success), everything else → the "unavailable" label (danger). Map-legend fallbacks capitalised. |
| `features/factories/portfolio.ts` | `provenanceOf` now treats any source containing `"test"` as test data, so the list matches the detail page (no raw seed code on either). |
| `app/(app)/factories/[id]/FactorySpatialMap.tsx` | Map-marker popup label runs the event kind through `titleCase`. |

The literal ask — "the first letter should always be capital" — is met by routing
enum labels through `titleCase` and capitalising the remaining hand-written pill
fallbacks (`Active`/`Inactive`/`Primary`/`Local`/`Imported`/`No expiry`/
`Expired`/`Valid`). Arabic is unaffected (`titleCase`'s `\b\w` never matches
Arabic letters). **Line-height / spacing / weight consistency is now token-driven
across all section components, but a full visual audit still needs a browser
render — not possible here (SWC/env blocker).**

## What changed — slice 5

| File | Action | Lines |
| --- | --- | --- |
| `sections/factories/factory-documents/factory-documents.tsx` (+ `.module.css`) | created | 59 + 10 |
| `sections/factories/factory-representatives/factory-representatives.tsx` | created | 55 |
| `sections/factories/factory-products/factory-products.tsx` | created | 50 |
| `sections/factories/factory-materials/factory-materials.tsx` | created | 44 |
| `sections/factories/factory-workforce/factory-workforce.tsx` (+ `.module.css`) | created | 48 + 12 |
| `app/(app)/factories/[id]/page.tsx` | modified | 5 sections swapped; slice-5 view models; `VALIDITY_BADGE`→`DOC_STATUS` (tone/label); 4 `*Empty` consts + 3 legacy comments removed |

- Four table sections → `Card` + `DataTable`: documents (type/status as
  `StatusPill`s, validity tone none→neutral / expired→danger / valid→success, a
  tokened "preview unavailable" notice under the table), representatives
  (primary + active/inactive pills), products (primary pill), materials (local
  → success / imported → info pill). Row-name columns are table row-headers.
- Workforce → `Card` + `CardGrid` of three `StatCard`s (total / Saudi + a
  Saudization `sub` / capital) + the capacity note + the always-on source-owned
  caption.
- **Error and empty states unified.** Each section takes an `error: string | null`
  prop; on error it renders a `tone="danger"` `EmptyState`, otherwise the
  `DataTable`'s own empty state covers no-rows. This replaces the bespoke
  `sq-banner--critical` + `sq-state` markup with one consistent pattern.
- Section anchors (`#documents`/`#representatives`/`#products`/`#materials`/
  `#workforce`) preserved via each card's `CardHeader` `titleId`. Role gating
  (`canSeeDocuments`/`canSeeContacts`) stays in the page.

## Verification

- [x] Static: six new files carry no comments/`let`/`any`/`svg`/CSS-literals;
  balanced; module tokens all defined in `saqeel.css`; `DataTable`/`EmptyState`/
  `StatCard`/`CardGrid`/`Stack`/`StatusPill` imports + exports resolve from disk;
  no `sq-table`/`sq-lozenge`/`sq-banner`/`sq-state`/`sq-kpi`/`<section id=…>`/
  `VALIDITY_BADGE`/`*Empty` left in the page; every slice-5 view-model const is
  consumed; icons used (`library`/`account`/`factory`) exist in the registry.
- [ ] `npm run typecheck` / browser / Arabic — not run (SWC/env blocker).
- [ ] Visual audit of the global `StatusPill` alignment change across dashboard
  and operations — needs a render; flagged for owner.

## Parked / remaining

Slice 6 (final): `cd-w3`/`cd-main3`/`cd-side3` layout → grid primitive;
`cd-secstrip` section nav; route-file slim (move reads → `features/factories/`,
the file is now almost entirely view-model building); delete the orphaned
`cd-*`/`sq-f360__*` CSS; sweep the remaining legacy header comments. After slice
6 the whole `/factories/[id]` dossier is on SAQEEL and the route file is thin.

## Proposed commits

```
fix(saqeel): centre status pills and enforce capitalised, non-raw pill labels
refactor(factories): migrate detail-page registry sections to saqeel data-table
```

## Next

Slice 6 — layout/grid primitive, section-nav, route-file slim, dead-CSS deletion.
