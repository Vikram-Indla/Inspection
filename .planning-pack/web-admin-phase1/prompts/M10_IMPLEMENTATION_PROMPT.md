# M10 — Admin Integrations GIS Execution and Provider Health

Task: `TASK-WEB-ADMIN-PHASE1-PLAN-001-M10`
Change control: `CC-WEB-ADMIN-PHASE1-001`

## Authority and scope

- Routes: `/admin/integrations/**;/admin/gis/**;/admin/execution;/admin/operations;/admin/virtual`
- Designs: SAQEEL Admin Integrations.dc.html;SAQEEL Admin Integrations Data.dc.html;SAQEEL Admin Geofence.dc.html;SAQEEL Admin SENAI Data.dc.html;SAQEEL Admin Execution.dc.html;SAQEEL Admin Virtual Premium.dc.html;SAQEEL Control Panel.dc.html
- Requirements: CR-001..CR-478
- Depends on: F0;M8

## Exact file ownership

- `apps/web/src/app/(app)/admin/gis/page.tsx`
- `apps/web/src/app/(app)/admin/gis/spatial/page.tsx`
- `apps/web/src/app/(app)/admin/integrations/factory-data/page.tsx`
- `apps/web/src/app/(app)/admin/integrations/page.tsx`
- `apps/web/src/app/(app)/admin/operations/page.tsx`
- `apps/web/src/app/admin/execution/page.tsx`

## Implementation contract

Replicate the supplied design at its declared viewport using real route data and existing services. Preserve RLS/RBAC, canonical transitions, audit, immutable versions, maker-checker, and fail-closed providers. Implement loading, empty, error, degraded, unauthorized, stale/conflict and provider-unavailable states where applicable. Do not copy design mock values into production. Do not edit `/field/**` or the offline engines.

Before editing a route, consume its row in `CURRENT_TO_TARGET_MIGRATION.csv`. Direct replacement is allowed only after certification where the row says so. When behavior, permissions, policy, provider, backend parity, tests, or rollback confidence is uncertain, use a server-evaluated feature flag or guarded preview. Never delete the current implementation; retain it for rollback until stabilization and Product Owner removal approval.

## Verification and evidence

Run typecheck, production build, focused positive/negative and permission tests, EN/AR RTL, light/dark, responsive 1024/412/390/320 checks, accessibility and zero-unapproved-diff visual comparison. Store binary evidence externally and commit only textual manifests. Do not merge, push, deploy, enable a provider, apply remote DDL, or mutate shared data without separate approval.

Completion command template: `npm run typecheck && npm run build && npx playwright test <focused-m10-specs> && node scripts/validate_web_admin_phase1.mjs`
