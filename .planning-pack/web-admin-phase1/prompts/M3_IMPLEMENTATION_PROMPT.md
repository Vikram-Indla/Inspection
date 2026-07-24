# M3 — Operations Center

Task: `TASK-WEB-ADMIN-PHASE1-PLAN-001-M3`
Change control: `CC-WEB-ADMIN-PHASE1-001`

## Authority and scope

- Routes: `/operations/**;/api/routing/eta`
- Designs: SAQEEL Operations Center.dc.html;SAQEEL Operations Live.dc.html
- Requirements: CR-430..CR-448
- Depends on: F0

## Exact file ownership

- `apps/web/src/app/(app)/operations/exceptions/page.tsx`
- `apps/web/src/app/(app)/operations/live/page.tsx`
- `apps/web/src/app/(app)/operations/page.tsx`
- `apps/web/src/app/api/routing/eta/route.ts`

## Implementation contract

Replicate the supplied design at its declared viewport using real route data and existing services. Preserve RLS/RBAC, canonical transitions, audit, immutable versions, maker-checker, and fail-closed providers. Implement loading, empty, error, degraded, unauthorized, stale/conflict and provider-unavailable states where applicable. Do not copy design mock values into production. Do not edit `/field/**` or the offline engines.

Before editing a route, consume its row in `CURRENT_TO_TARGET_MIGRATION.csv`. Direct replacement is allowed only after certification where the row says so. When behavior, permissions, policy, provider, backend parity, tests, or rollback confidence is uncertain, use a server-evaluated feature flag or guarded preview. Never delete the current implementation; retain it for rollback until stabilization and Product Owner removal approval.

## Verification and evidence

Run typecheck, production build, focused positive/negative and permission tests, EN/AR RTL, light/dark, responsive 1024/412/390/320 checks, accessibility and zero-unapproved-diff visual comparison. Store binary evidence externally and commit only textual manifests. Do not merge, push, deploy, enable a provider, apply remote DDL, or mutate shared data without separate approval.

Completion command template: `npm run typecheck && npm run build && npx playwright test <focused-m3-specs> && node scripts/validate_web_admin_phase1.mjs`
