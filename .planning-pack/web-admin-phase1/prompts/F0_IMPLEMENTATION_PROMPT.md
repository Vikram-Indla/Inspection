# F0 — Shared SAQEEL foundation

Task: `TASK-WEB-ADMIN-PHASE1-PLAN-001-F0`
Change control: `CC-WEB-ADMIN-PHASE1-001`

## Authority and scope

- Routes: `Shared shell;components;tokens;i18n/RTL;reference renderer;visual harness`
- Designs: SAQEEL Design System.dc.html;SAQEEL States System.dc.html
- Requirements: CR-001..CR-478
- Depends on: none; foundation package

## Exact file ownership

- `apps/web/src/app/api/shell/search/route.ts`
- `apps/web/src/components/saqeel/**`
- `apps/web/src/components/Shell.tsx`
- `apps/web/src/components/ShellClient.tsx`
- `apps/web/src/lib/shell-navigation.ts`
- `apps/web/src/lib/i18n.ts`
- `apps/web/src/app/astryx.css`

## Implementation contract

Replicate the supplied design at its declared viewport using real route data and existing services. Preserve RLS/RBAC, canonical transitions, audit, immutable versions, maker-checker, and fail-closed providers. Implement loading, empty, error, degraded, unauthorized, stale/conflict and provider-unavailable states where applicable. Do not copy design mock values into production. Do not edit `/field/**` or the offline engines.

Before editing a route, consume its row in `CURRENT_TO_TARGET_MIGRATION.csv`. Direct replacement is allowed only after certification where the row says so. When behavior, permissions, policy, provider, backend parity, tests, or rollback confidence is uncertain, use a server-evaluated feature flag or guarded preview. Never delete the current implementation; retain it for rollback until stabilization and Product Owner removal approval.

## Verification and evidence

Run typecheck, production build, focused positive/negative and permission tests, EN/AR RTL, light/dark, responsive 1024/412/390/320 checks, accessibility and zero-unapproved-diff visual comparison. Store binary evidence externally and commit only textual manifests. Do not merge, push, deploy, enable a provider, apply remote DDL, or mutate shared data without separate approval.

Completion command template: `npm run typecheck && npm run build && npx playwright test <focused-f0-specs> && node scripts/validate_web_admin_phase1.mjs`
