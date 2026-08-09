# 2026-08-08 · T-020 (detail page) slice 6 — layout, section-nav, comment sweep + advisory pill

`task: T-020 /factories/[id] transform (sliced, slice 6 of ~6)` · `status: mostly done` · `duration: ~1h`
`rules applied: WEB-000, WEB-002, WEB-009, WEB-012`

---

## Goal

Close the `/factories/[id]` transform: move the `cd-w3`/`cd-side3`/`cd-main3`
three-column shell and the `cd-secstrip` section nav onto SAQEEL components,
sweep the route file's legacy comments, and — per owner — make the
`ContextualAiPanel` "Human decision required" advisory use our reusable
`StatusPill` instead of the legacy `badge badge-info` chip.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `sections/factories/factory-dossier/factory-dossier.tsx` (+ `.module.css`) | created | 15 + 24 |
| `sections/factories/factory-section-nav/factory-section-nav.tsx` (+ `.module.css`) | created | 19 + 37 |
| `components/ContextualAiPanel.tsx` | modified | advisory `badge badge-info` → `StatusPill tone="info"` |
| `app/(app)/factories/[id]/loading.tsx` | rewritten | `cd-w3`/`cd-side3`/`sq-*` skeleton → `FactoryDossier` + `Card` + `SkeletonRegion`/`SkeletonText` |
| `app/(app)/factories/[id]/page.tsx` | modified | layout swapped to `FactoryDossier` + `FactorySectionNav`; **all 6 legacy comment blocks removed (WEB-000 now clean)** |

- **`FactoryDossier`** — the 2-column dossier shell: `aside` slot + `children`
  (main). Fractional columns (`minmax(0,1fr) minmax(0,2.4fr)` at `64rem`, single
  column below), sticky aside at wide, tokens only. Mirrors `factory-workspace`'s
  approach so no panel width is a px literal (the legacy `cd-w3` used
  `minmax(280px,320px)`).
- **`FactorySectionNav`** — the sticky in-page anchor strip; `sections`
  (`{id,label}[]`) → focusable `<a href="#id">` chips (touch-height
  `--sqx-control-h-md`, pill radius, tokened focus ring). Replaces
  `cd-secstrip`/`cd-secitem`. The section anchors still resolve because slices
  4–5 put the ids on each card's `CardHeader` title.
- **Advisory pill** now `StatusPill tone="info"` — consistent (and pinging) with
  every other pill, everywhere `ContextualAiPanel` is used (factory risk +
  wherever else it is mounted).
- **`loading.tsx`** now adopts the real `FactoryDossier` shape with DS skeletons,
  so the route (page + loading) is fully `cd-*`-free.

## Decisions / what is deliberately NOT done

- **Legacy CSS not deleted.** `cd-w3`/`cd-side3`/`cd-secstrip`/`sq-surface`/
  `sq-table`/`sq-lozenge`/`sq-f360__*`/`cd-tl*` live in the globally-imported
  `app/saqeel-runtime.css` (173 KB). They are **still referenced by the
  un-migrated `cr/[id]` CR-centred dossier** (the compat redirect target) and
  likely other legacy routes. Deleting them now would break those pages, and a
  repo-wide reference check can't be done reliably from this session's partial
  snapshot. **Deletion is deferred until `cr/[id]` and the remaining legacy
  routes are migrated** — then the orphaned block can be removed in one pass.
- **Route file not slimmed to ≤40 lines (WEB-005).** The route is now free of
  legacy markup and comments, but its body is still ~370 lines of data fetching
  + view-model building. Extracting the two `Promise.all` reads and the
  view-model mappers into `features/factories/` is the right move, but it is a
  large, type-sensitive refactor and **`tsc` cannot run here (SWC/Windows
  Application Control blocker)** — doing it blind is how regressions ship. Left
  as the final follow-up, to be done once `npm run typecheck` is available.
- `Controls.tsx` (client, in the `[id]` folder) is **not imported by `page.tsx`**
  and was left untouched; confirm whether it is dead before deleting.

## Verification

- [x] Static: two new components carry no comments/`let`/`any`/`svg`/CSS-literals;
  balanced; all layout tokens defined in `saqeel.css`; `FactoryDossier`/
  `FactorySectionNav`/`Card`/`SkeletonRegion`/`StatusPill` imports resolve;
  **page + loading now contain zero `cd-*`/`sq-surface`/`sq-table`/`sq-lozenge`/
  `sq-f360`/`sq-banner`/`sq-state`/`sq-kpi` and zero comments**; `SECTIONS`
  still consumed (by `FactorySectionNav`).
- [ ] `npm run typecheck` / browser / Arabic — not run (SWC/env blocker).
- [ ] Visual pass on the new 2-column grid + sticky nav across breakpoints.

## T-020 status

The `/factories/[id]` dossier is now **fully on SAQEEL** — identity, actions,
risk, map lens, observed-locations, risk history, case timeline, inspection
history, documents, representatives, products, materials, workforce, the shell
layout, the section nav and the loading state. Remaining T-020 tail:
**(1)** delete the orphaned legacy CSS after `cr/[id]` migrates;
**(2)** slim the route file into `features/factories/` once `tsc` is runnable.

## Proposed commits

```
feat(factories): dossier layout + section-nav saqeel components; drop cd-* from detail route
fix(ai): contextual advisory uses the reusable StatusPill
```

## Next

Recommend running `npm run typecheck` now (slices 3–6 are static-verified only),
then the route-slim + legacy-CSS-deletion tail. Otherwise `/factories/[id]` is done.
