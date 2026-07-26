# PKT-RESPONSIVE-DASHBOARD-OPERATIONS-002 evidence

Date: 2026-07-26

Task: `TASK-SAQEEL-RESPONSIVE-REVAMP-001`

Change control: `CC-SAQEEL-RESPONSIVE-REVAMP-001`

Branch: `revamp/dashboard-operations`

Baseline: `c78882a74c2dc116c80d8320d764f0900a7655e9`

## Implemented boundary

- Preserved the Dashboard Operations/Leadership authorization boundary.
- Restored Inspector read access to `/operations` and `/operations/live` after field-shell convergence by deriving access from the canonical business-role contract.
- Kept capability-only Administrator profiles denied before operational reads.
- Preserved user-scoped Supabase reads and RLS; no migration, RLS, RPC, data, or production DDL changed.
- Preserved configured-profile geography narrowing and corrected the unassigned-profile path so it retains only the records already granted by RLS rather than incorrectly emptying that grant.
- Added an upper timestamp bound to live position reads and retained server validation against future or implausible telemetry.
- Kept Dashboard KPI governance, provider-unavailable behavior, partial-source disclosure, Arabic/RTL, reduced motion, and responsive overflow contracts explicit.

## Acceptance results

| Contract | Result | Evidence |
|---|---:|---|
| Dashboard and Operations protected source contracts | PASS | 20/20 Playwright source-contract tests |
| Responsive migration contracts | PASS | 3/3 static Playwright tests |
| Planner/Inspector Operations access and admin-only denial | PASS | 5/5 targeted authenticated runtime tests |
| Inspector width continuum | PASS | EN/AR, light/dark at 320, 375, 390, 768, 1024, 1280, 1440, and 1920 CSS px; no root horizontal overflow |
| Dashboard denied personas and unauthenticated route | PASS | Planner, Inspector, Administrator, and unauthenticated checks: 4/4 |
| Type safety | PASS | `npm run typecheck` |
| Production compilation | PASS | `npm run build`; 58 static pages generated and dynamic routes compiled |
| Diff hygiene | PASS | `git diff --check` |

## Commands

```text
npm run typecheck
npm run build
npx playwright test e2e/responsive-dashboard-operations.spec.ts --config=playwright.static.config.ts --reporter=line
PLAYWRIGHT_PORT=3017 PLAYWRIGHT_REUSE_SERVER=1 npx playwright test e2e/web-admin-m1-dashboard.spec.ts e2e/web-admin-m3-operations.spec.ts --project=e2e --no-deps --grep="source truth and negative contracts|composition contract" --reporter=line
PLAYWRIGHT_PORT=3017 PLAYWRIGHT_REUSE_SERVER=1 npx playwright test e2e/web-admin-m3-operations.spec.ts --project=e2e --no-deps --grep="planner direct-route access|Inspector retains read access|admin-only persona|planner Operations Live access|Inspector Operations reflows" --reporter=line
PLAYWRIGHT_PORT=3017 PLAYWRIGHT_REUSE_SERVER=1 npx playwright test e2e/web-admin-m1-dashboard.spec.ts --project=e2e --no-deps --grep="planner cannot open|admin cannot open|inspector cannot open|unauthenticated Dashboard" --reporter=line
```

## Environment limitation

Fresh authentication succeeded for Planner, Inspector, and Administrator. The development Supabase returned HTTP 400 for the `ops` and `reviewer` test accounts, so their excluded storage states could not be refreshed. The tests did not bypass authentication, replace the integration, or claim a positive Operations-persona runtime result. The protected Dashboard contract and the available positive/negative runtime personas remain green; the unavailable account fixtures must be restored before a full cross-persona G10 run.

No binary evidence was committed. Browser evidence output remains governed by `INSPECTION_DOCS_ROOT`.
