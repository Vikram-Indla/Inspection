# PKT-RESPONSIVE-EXECUTION-FIELD-004 evidence

Date: 2026-07-26

Task: `TASK-SAQEEL-RESPONSIVE-REVAMP-001`

Change control: `CC-SAQEEL-RESPONSIVE-REVAMP-001`

Branch: `revamp/execution-field-migration`

Baseline: `4e270d773f83e05aa0350ac34d5d277c74bf2c4f`

## Implemented boundary

- Converged `/field/**` on the canonical authenticated `AppShell`; the Field layout retains verified-user and Inspector-role checks before rendering route content.
- Removed active duplicate Field drawer, burger and bottom-navigation ownership while retaining touch density, route-level Field headers, session recovery and execution content.
- Made Field participate in the persisted application light/dark theme contract. Both Field Settings and Field Account now use the canonical `ThemeToggle`.
- Preserved the existing source-backed physical-execution composition because the workbook supplies no replacement immutable design authority.
- Kept offline database namespaces, drafts, outbox replay, conflicts, package checksum/version integrity, immutable submission history and evidence/audit contracts unchanged.
- Preserved the shared physical/virtual execution engines and made the Virtual list bilingual, responsive and accessibility-clean in the unified shell.
- Changed no Supabase migration, RLS policy, RPC, provider, service worker, manifest, push/install delivery, workflow transition or production data contract.
- Created no inspection submission; `DEC-032` remains an enforced stop line.

## Acceptance results

| Contract | Result | Evidence |
|---|---:|---|
| Canonical shell ownership and no active duplicate Field chrome | PASS | Focused source contracts plus runtime assertion of exactly one `#saqeel-primary-nav` |
| Inspector authorization | PASS | Inspector positive runtime; Field layout resolves verified user and Inspector role before `FieldSessionBoundary` |
| Planner and Administrator Field denial | PASS | Authenticated negative runtime; both redirect to unified login with `reason=unauthorized` before Field content |
| Physical execution responsive continuum | PASS | 320, 375, 390, 768, 1024, 1280, 1440 and 1920 CSS px; EN/AR, LTR/RTL and light/dark matrix; root overflow ≤1 px |
| Virtual execution responsive/accessibility contract | PASS | 320, 768 and 1920 responsive states plus Arabic 390px Axe scan with zero violations |
| Theme contract | PASS | Field is no longer dark-locked; Settings and Account expose the real persisted theme control |
| Offline shell | PASS | Service worker reaches active/controlling state; a controlled Field shell reloads successfully with the network cut |
| Offline identity and replay safety | PASS | Two authenticated browser contexts keep disjoint IndexedDB outboxes; replay aborts on user switch; captured bearer remains pinned |
| Package integrity, conflicts and immutable history | PASS | Protected source/runtime contracts; no execution-engine implementation was weakened |
| Execution engine protected regression | PASS | 85/85 `execution-*.spec.ts` contracts |
| Consolidated focused regression | PASS | 129/129 Playwright tests on the clean production build |
| Type safety | PASS | `npm run typecheck` |
| Production compilation | PASS | `npm run build`; 58 static pages generated and all dynamic routes compiled |
| Diff hygiene | PASS | `git diff --check` |

## Verification commands

```text
npm run typecheck
npm run build
PLAYWRIGHT_PORT=3019 PLAYWRIGHT_REUSE_SERVER=1 npx playwright test e2e/execution-*.spec.ts e2e/field-auth-session-contract.spec.ts e2e/field-dashboard-presentation.spec.ts e2e/field-establishment-incidents.spec.ts e2e/field-notifications-contract.spec.ts e2e/field-offline-isolation.spec.ts e2e/field-settings-contract.spec.ts e2e/field-offline-runtime.spec.ts e2e/field-dashboard-smoke.spec.ts e2e/responsive-execution-field.spec.ts --project=e2e --no-deps --reporter=line
git diff --check
```

## Test-contract reconciliation

Several inherited Field tests asserted the retired standalone Field shell, dark-only theme, `/login/field` redirects, removed component ownership, or an obsolete notification/dashboard projection. Those assertions were updated to the current governed architecture without weakening Inspector authorization, recipient scoping, offline isolation, replay guards, package integrity, trust-state presentation or immutable-history checks.

The service-worker runtime test now waits for `navigator.serviceWorker.ready` and controller ownership before cutting the network. This measures the existing controlled update lifecycle instead of racing initial installation; the service-worker implementation itself was not changed.

## Disclosed development-fixture caveat

Before the final bounded suite was established, one exploratory broad legacy Field run included notification tests whose fixtures can append Inspector-scoped development notification audit rows. No production environment or inspection submission was involved, and no cleanup mutation was attempted because those rows have no recipient-delete policy and serve as read-history evidence. The final recorded 129-test acceptance run excluded all shared-data fixture creation and was non-mutating.

No binary evidence was committed. Browser artifacts remain governed by `INSPECTION_DOCS_ROOT`.
