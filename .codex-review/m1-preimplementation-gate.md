# M1 Dashboard — Pre-implementation Gate

## Contract identity

- Task: `TASK-WEB-ADMIN-PHASE1-PLAN-001-M1`
- Change control: `CC-WEB-ADMIN-PHASE1-001`
- Process: `G2-P12`
- Route: `/dashboard`
- Migration: `WA-MIG-037`
- Requirements preserved: `CR-001..CR-478`
- Designs: `WA-DES-025`, `WA-DES-046`
- Preservation: `WA-SP-010..028`
- Acceptance: `WA-M1-AC-001..006`
- Evidence: `WA-M1-EV-001..006`
- Shared-shell acceptance preserved:
  `WA-SHELL-AC-004..007`, `WA-SHELL-AC-016..018`

## Repository diagnosis

M1 is a merge-regression recovery, not a greenfield build:

- `b825bfc6` introduced the registry-backed KPI projection, `MetricStrip`, and
  the real `GeoMap`-backed `DecisionCanvas`;
- `80c729dc` later replaced the active page/view with an older composition;
- the stronger components remain in the repository but are not wired to the
  live route.

The previous implementation must not be restored wholesale. Its grouped KPI
RPC counts all completed answers instead of latest approved inspections and
would violate the approved compliance formula.

## P0 truth defects to correct

- Placeholder canvases claim Mapbox/live behavior without mounting a map.
- Failed sources can coexist with a green `Live` control state because
  `partialSources` is discarded.
- UTC-derived date text is labelled as Riyadh time.
- Compliance thresholds `75` and `85` are hard-coded without policy authority.
- `?view=analytics` silently aliases Strategic.
- Record-verification links point to missing anchors.
- Decision Canvas defaults to risk when every governed layer is unavailable.
- Critical/high-priority classifications are shown without proven policy
  version.
- Registry truth statuses exist but are bypassed by the active cards.

## Proposed bounded file lease

Required:

- `apps/web/src/app/(app)/dashboard/page.tsx`
- `apps/web/src/app/(app)/dashboard/DashboardView.tsx`
- `apps/web/src/app/(app)/dashboard/dashboard.module.css`
- `apps/web/src/app/(app)/dashboard/MetricStrip.tsx`
- `apps/web/src/app/(app)/dashboard/DecisionCanvas.tsx`
- `apps/web/src/app/(app)/dashboard/dashboard-format.ts`
- focused M1 tests under `apps/web/e2e/`

Optional only with evidence:

- `apps/web/src/app/(app)/dashboard/metrics.ts`
- `apps/web/src/app/(app)/dashboard/loading.tsx`

## Do not touch

- F0 shell/navigation/global styling.
- `/field/**`, PWA, iPad, offline engines.
- shared `GeoMap.tsx`.
- KPI registry/projection unless a formula defect is independently proven.
- APIs, SQL, RPCs, migrations, schema, RLS/RBAC, provider configuration.
- shared verification fixtures.
- `main`, `setup/Inspection`, stashes, deployment, or remote systems.

## Gates before product-code modification

- [x] Sponsor authorizes the M1 controlled cycle and business defaults.
- [x] Isolated branch created from F0 candidate `c8bdf6d1`.
- [x] Independent contract/test audit completed.
- [x] Independent repository/wiring audit completed.
- [x] Sponsor authorizes use of the currently observed Claude Design M1 file
      while immutable revision evidence is captured in parallel; missing
      revision metadata remains an evidence gap, not a product-code blocker.
- [x] Independent design and repository challenge completed; remaining
      revision evidence stays mandatory before final design GREEN.
- [x] Role conflict is recorded; implementation does not widen the current
      route/RLS role set under M1.
- [x] `DEC-028` remains unresolved and every affected metric must remain explicitly
      unavailable/not configured/decision required.
- [x] Expanded M1 file lease is recorded in
      `product-contract/execution/CURRENT_SLICE.yaml`.

## Required exit evidence

- every `WA-SP-010..028` outcome traced;
- live, partial, stale, empty, unavailable, not configured, decision required,
  unauthorized and provider-unavailable states;
- role-positive and role-negative route tests;
- RLS/geography non-leakage and zero-denominator negative tests;
- real map plus accessible provider-failure fallback;
- 1440, 1024, 412/390 and 320 EN/AR light/dark evidence;
- keyboard, focus and Axe checks;
- typecheck, production build, M1 suite, protected F0/adjacent regression,
  performance reconciliation and 478 validator;
- real Chrome proof, guarded preview, retained rollback route, no cutover
  without module acceptance.
