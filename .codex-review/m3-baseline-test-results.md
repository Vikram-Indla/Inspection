# M3 Operations pre-implementation test baseline

Date: 2026-07-24

Branch: `codex/m3-operations-reconciliation`

Baseline application SHA: `9d8c414258a5e04244fdf9ce350e5f25f952dfc1`

No application code was changed for this run.

## Environment setup

- Installed the locked `apps/web` dependencies with `npm ci`.
- Reused the canonical local `.env.local` through a worktree-local ignored symlink.
- No Supabase seed, schema, API, policy, workflow, or product-record mutation was performed by Codex.

## Full selected run

Command:

```text
npx playwright test \
  e2e/mapbox-provider.spec.ts \
  e2e/dashboard-kpi-seed.spec.ts \
  e2e/execution-journey-ui-contract.spec.ts \
  e2e/ipad-gps-policy.spec.ts \
  --reporter=line
```

Result:

- 4 authentication setup cases passed.
- Inspector authentication returned HTTP 400 and timed out waiting for `/field`.
- 19 dependent cases did not run.
- This is the already-known Inspector test-fixture/infrastructure defect; it is not counted as an M3 application result.

## Dependency-bypassed diagnostic run

The same four specs were then run with the authentication setup dependency bypassed to obtain an application baseline:

```text
npx playwright test \
  e2e/mapbox-provider.spec.ts \
  e2e/dashboard-kpi-seed.spec.ts \
  e2e/execution-journey-ui-contract.spec.ts \
  e2e/ipad-gps-policy.spec.ts \
  --project=e2e \
  --no-deps \
  --reporter=line
```

Result: **17 passed, 2 failed**.

### Relevant M3 failure

`dashboard-kpi-seed.spec.ts` expected `KPI Verify — Executing overdue`
inside the Operations `SLA watch` panel, but the record was not rendered.

Disposition: **M3 baseline defect / data-to-view reconciliation required**.
Do not claim the Operations KPI/SLA panel complete until the displayed records
reconcile to the same RLS-scoped source set.

### Protected regression failure outside the M3 lease

`execution-journey-ui-contract.spec.ts` found the banned implementation phrase
`RLS-scoped` in `apps/web/src/app/(app)/field/[visitId]/page.tsx`.

Disposition: **pre-existing protected Field regression**. M3 must not edit
`/field/**`; route this to the Field owner and retain the failure as a cutover
blocker until corrected or explicitly governed.

## Passing coverage

The diagnostic run passed:

- live Operations consumption of seeded factories and active visits;
- Operations cancellation decision wiring;
- Mapbox as the authenticated application map renderer;
- Mapbox Directions server boundary without a committed token;
- GPS/geofence defaults and fail-closed telemetry rules;
- Operations approval separation for outside-geofence requests;
- remaining execution journey UI contract cases in the selected set.

## Readiness effect

M3 remains **NO-GO** for implementation for the design/contract reasons recorded
in `m3-implementation-readiness.md`. The additional Operations SLA-watch failure
must be included in the later guarded-preview acceptance suite. The Field wording
failure is outside the M3 edit lease but remains a protected regression blocker
for canonical cutover.
