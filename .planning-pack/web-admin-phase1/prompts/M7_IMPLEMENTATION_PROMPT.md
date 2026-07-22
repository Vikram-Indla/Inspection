# M7 — Reports OCR AI and Incidents

Task: `TASK-WEB-ADMIN-PHASE1-PLAN-001-M7`
Change control: `CC-WEB-ADMIN-PHASE1-001`

## Authority and scope

- Routes: `/reports/**;/evidence-ocr;/ai/suggestions;/incident-reports`
- Designs: SAQEEL Inspection Report.dc.html;SAQEEL Evidence OCR.dc.html;SAQEEL AI Studio.dc.html;SAQEEL Incident Reports.dc.html
- Requirements: CR-001..CR-478
- Depends on: F0

## Exact file ownership

- `apps/web/src/app/(app)/ai/suggestions/page.tsx`
- `apps/web/src/app/(app)/evidence-ocr/page.tsx`
- `apps/web/src/app/(app)/incident-reports/page.tsx`
- `apps/web/src/app/reports/inspection/[id]/page.tsx`

## Implementation contract

Replicate the supplied design at its declared viewport using real route data and existing services. Preserve RLS/RBAC, canonical transitions, audit, immutable versions, maker-checker, and fail-closed providers. Implement loading, empty, error, degraded, unauthorized, stale/conflict and provider-unavailable states where applicable. Do not copy design mock values into production. Do not edit `/field/**` or the offline engines.

Before editing a route, consume its row in `CURRENT_TO_TARGET_MIGRATION.csv`. Direct replacement is allowed only after certification where the row says so. When behavior, permissions, policy, provider, backend parity, tests, or rollback confidence is uncertain, use a server-evaluated feature flag or guarded preview. Never delete the current implementation; retain it for rollback until stabilization and Product Owner removal approval.

## Verification and evidence

Run typecheck, production build, focused positive/negative and permission tests, EN/AR RTL, light/dark, responsive 1024/412/390/320 checks, accessibility and zero-unapproved-diff visual comparison. Store binary evidence externally and commit only textual manifests. Do not merge, push, deploy, enable a provider, apply remote DDL, or mutate shared data without separate approval.

Completion command template: `npm run typecheck && npm run build && npx playwright test <focused-m7-specs> && node scripts/validate_web_admin_phase1.mjs`
