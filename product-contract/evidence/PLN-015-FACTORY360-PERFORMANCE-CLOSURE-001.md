# PLN-015 — Factory 360 loading performance closure

Date: 2026-07-29
Environment: disposable non-production Supabase and exact-build runtime
Branch: `codex/observation-ai-closure`
Route: `http://127.0.0.1:3222/factories`
Disposition: **Completed**

## Observation reconciled

The tracker recorded a roughly 9–10 second Factory 360 wait and a loading
skeleton that visually crowded the navigation rail.

The loading-layout defect was repaired in `4d243d4c`:

- the CR-centred dossier loading boundary now mirrors the three-column dossier
  workspace;
- loading content remains inside the route body instead of presenting as an
  undifferentiated full-page block;
- the state announces `Loading Factory 360 profile` and the exact records being
  retrieved.

No new CSS or page repair was introduced in this closure run. The current route
performance does not reproduce the 9–10 second symptom.

The closure run also corrected one stale `cd-031-factory-360.spec.ts` source
assertion that still expected the retired `numeric` class even though the
implemented dossier and current design system use `sq-numeric`. This changes
test truth only; it does not alter page markup or styling.

## Existing performance authority

`docs/performance/baseline-methodology.md` records the original `/factories`
baseline:

- cold median 2,742 ms, p95 6,178 ms;
- warm median 2,751 ms, p95 2,981 ms.

The later production-build artifact
`docs/performance/results/final-live-indexed.json` contains five cold samples
from 1,367–1,458 ms and ten warm samples from 1,365–1,835 ms, all without a
recorded navigation failure.

DEC-010 remains the source for platform performance targets. This observation
does not invent a Factory 360-specific SLA or reinterpret the dashboard target
as a new page-level policy.

## Exact-build browser proof

Persona: `pln012-planner@example.invalid` (Planner)

The route rendered the authorized Factory 360 portfolio, the selected
`Jubail Fertilizer Co. (SAFCO IV)` context, provenance, risk summary, factory
snapshot, and dossier links.

Four consecutive exact-build route renders reached the visible
`Factory portfolio` form in:

| Run | Browser-visible render | Server `GET /factories` |
|---:|---:|---:|
| 1 | 792 ms | 425 ms |
| 2 | 508 ms | 173 ms |
| 3 | 183 ms | 141 ms |
| 4 | 587 ms | 218 ms |

The earlier cold development compile took 798 ms and its first server render
took 1,707 ms. Even that compile-inclusive result did not reproduce the
reported 9–10 seconds.

## Database and role proof

Under the same authenticated Planner identity:

- `has_permission('view_factory_360') = true`;
- `has_permission('create_inspection') = true`;
- the RLS-visible portfolio contained 24 factories;
- the base Factory 360 portfolio query returned all 24 authorized rows;
- PostgreSQL execution time for that RLS-governed query was 0.055 ms.

The page uses the authenticated Supabase client and
`resolveFactory360Permissions`; no service-role read or browser fixture bypass
was used for the live route.

## Regression proof

- `npm run typecheck` — passed.
- `cd-031-factory-360.spec.ts`, seven source-truth contracts — passed after the
  stale class assertion was aligned to the implemented design-system class.
- The remaining live-dossier tests in that suite require the repository's
  external `playwright/.auth/planner.json`, which is intentionally absent from
  Git. They were not claimed as passing. Equivalent route authentication,
  rendering, permission, and timing behavior was executed directly in the
  exact-build browser with the disposable Planner persona above.

## Closure

PLN-015 is complete:

1. the crowding loading state has an implemented repair (`4d243d4c`);
2. repository performance artifacts show the route materially improved from
   the original baseline;
3. current exact-build browser and server measurements do not reproduce the
   9–10 second report;
4. the underlying RLS query and permission path are live and measured;
5. no data, account, fixture, or audit history was deleted, reset, deactivated,
   relabelled, or overwritten.

Future regression monitoring should continue through the existing performance
harness and DEC-010 governance rather than adding a tracker-specific threshold.
