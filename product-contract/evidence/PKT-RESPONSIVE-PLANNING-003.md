# PKT-RESPONSIVE-PLANNING-003 evidence

Date: 2026-07-26

Task: `TASK-SAQEEL-RESPONSIVE-REVAMP-001`

Change control: `CC-SAQEEL-RESPONSIVE-REVAMP-001`

Branch: `revamp/planning`

Baseline: `c78882a74c2dc116c80d8320d764f0900a7655e9`

## Implemented boundary

- Made the approved `WA-DES-036` Planning landing canonical at `/planning` without an environment or query-string preview switch.
- Kept Planner access to Bulk, Single, and Immediate creation methods.
- Implemented the source-authorized Inspector boundary: `/planning` exposes only Immediate, with no package, draft, plan, or Planning-owned Visit reads.
- Kept Administrator denied and required direct capability authorization before `/planning/visits` and `/planning/visits/:id` delegate to governed data reads.
- Made `WA-DES-045` canonical on the Planning-owned Visits list/detail routes while retaining `/visits` compatibility behavior.
- Preserved user-scoped Supabase/RLS reads, independent planning and operational states, immutable planning history, guarded actions, and append-only audit presentation.
- Added bounded responsive layouts for the Planning method grid and Visit-detail action rail, including reduced-motion and narrow-width behavior.
- Kept `DEC-026` closed to invention: no AI Planning Summary was added or claimed.
- Changed no migration, RLS policy, RPC, shared shell, Field/PWA, administration, or production data contract.

## Acceptance results

| Contract | Result | Evidence |
|---|---:|---|
| Canonical route, authorization, lifecycle, and responsive source contracts | PASS | 8/8 focused Playwright source tests |
| Planner responsive continuum | PASS | EN/AR, light/dark at 320, 375, 390, 768, 1024, 1280, 1440, and 1920 CSS px; no root horizontal overflow |
| Inspector Immediate-only and Planning-owned Visits denial | PASS | Authenticated runtime contract |
| Administrator Planning and Planning-owned Visits denial | PASS | Authenticated runtime contract |
| Planner, Inspector, and Administrator Planning landing contracts | PASS | 3/3 `CD-020` runtime tests |
| Planning/Visits/detail/audit/RTL/accessibility protected journeys | PASS | 11/11 focused runtime tests, including the corrected stale icon assertion |
| Type safety | PASS | `npm run typecheck` |
| Production compilation | PASS | `npm run build`; 58 static pages generated and dynamic routes compiled |
| Diff hygiene | PASS | `git diff --check` |

## Commands

```text
npm run typecheck
npm run build
npx playwright test e2e/responsive-planning.spec.ts e2e/web-admin-m2-batch-001.spec.ts e2e/web-admin-m2-batch-002.spec.ts e2e/cd-020-planning-home.spec.ts --project=e2e --no-deps --grep="source|cutover and security" --reporter=line
PLAYWRIGHT_PORT=3018 PLAYWRIGHT_REUSE_SERVER=1 npx playwright test e2e/responsive-planning.spec.ts --project=e2e --no-deps --grep="runtime" --reporter=line
PLAYWRIGHT_PORT=3018 PLAYWRIGHT_REUSE_SERVER=1 npx playwright test e2e/cd-020-planning-home.spec.ts --project=e2e --no-deps --grep="planner \(business staff\)|inspector sees|admin class" --reporter=line
PLAYWRIGHT_PORT=3018 PLAYWRIGHT_REUSE_SERVER=1 npx playwright test e2e/web-admin-m2-batch-001.spec.ts e2e/web-admin-m2-batch-002.spec.ts --project=e2e --no-deps --grep-invert="source and security|source, cutover and security" --reporter=line
PLAYWRIGHT_PORT=3018 PLAYWRIGHT_REUSE_SERVER=1 npx playwright test e2e/web-admin-m2-batch-002.spec.ts --project=e2e --no-deps --grep="Planning landing enters" --reporter=line
git diff --check
```

## Environment limitation

Fresh authentication is available for Planner, Inspector, and Administrator. The development Supabase returned HTTP 400 for the `reviewer` test account, so that excluded storage state could not be refreshed. The tests did not bypass authentication, replace the integration, or claim the reviewer positive path. The legacy business-staff source contract remains protected, and the available authenticated positive and negative personas are green; the reviewer fixture must be restored before a full cross-persona G10 run.

No binary evidence was committed. Browser evidence output remains governed by `INSPECTION_DOCS_ROOT`.
