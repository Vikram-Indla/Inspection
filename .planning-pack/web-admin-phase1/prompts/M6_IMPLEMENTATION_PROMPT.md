# M6 — Compliance Enforcement Committee and Risk

Task: `TASK-WEB-ADMIN-PHASE1-PLAN-001-M6`
Change control: `CC-WEB-ADMIN-PHASE1-001`

## Authority and scope

- Routes: `/enforcement;/committee;/admin/compliance-*/**;/admin/regulations/**;/admin/violations;/admin/risk/**;/admin/enforcement-recommendations;/admin/bulk-violations`
- Designs: SAQEEL Compliance Requests.dc.html;SAQEEL Enforcement.dc.html;SAQEEL Committee.dc.html;SAQEEL Risk.dc.html
- Requirements: CR-449..CR-478
- Depends on: F0

## Exact file ownership

- `apps/web/src/app/(app)/admin/bulk-violations/page.tsx`
- `apps/web/src/app/(app)/admin/compliance-approvals/page.tsx`
- `apps/web/src/app/(app)/admin/compliance-requests/[id]/page.tsx`
- `apps/web/src/app/(app)/admin/compliance-requests/new/page.tsx`
- `apps/web/src/app/(app)/admin/compliance-requests/page.tsx`
- `apps/web/src/app/(app)/admin/enforcement-recommendations/page.tsx`
- `apps/web/src/app/(app)/admin/regulations/[id]/page.tsx`
- `apps/web/src/app/(app)/admin/regulations/page.tsx`
- `apps/web/src/app/(app)/admin/risk/models/page.tsx`
- `apps/web/src/app/(app)/admin/risk/page.tsx`
- `apps/web/src/app/(app)/admin/violations/page.tsx`
- `apps/web/src/app/(app)/committee/page.tsx`
- `apps/web/src/app/(app)/enforcement/page.tsx`

## Implementation contract

Replicate the supplied design at its declared viewport using real route data and existing services. Preserve RLS/RBAC, canonical transitions, audit, immutable versions, maker-checker, and fail-closed providers. Implement loading, empty, error, degraded, unauthorized, stale/conflict and provider-unavailable states where applicable. Do not copy design mock values into production. Do not edit `/field/**` or the offline engines.

Before editing a route, consume its row in `CURRENT_TO_TARGET_MIGRATION.csv`. Direct replacement is allowed only after certification where the row says so. When behavior, permissions, policy, provider, backend parity, tests, or rollback confidence is uncertain, use a server-evaluated feature flag or guarded preview. Never delete the current implementation; retain it for rollback until stabilization and Product Owner removal approval.

## Verification and evidence

Run typecheck, production build, focused positive/negative and permission tests, EN/AR RTL, light/dark, responsive 1024/412/390/320 checks, accessibility and zero-unapproved-diff visual comparison. Store binary evidence externally and commit only textual manifests. Do not merge, push, deploy, enable a provider, apply remote DDL, or mutate shared data without separate approval.

Completion command template: `npm run typecheck && npm run build && npx playwright test <focused-m6-specs> && node scripts/validate_web_admin_phase1.mjs`
