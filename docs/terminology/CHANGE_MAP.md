# Change Map

Baseline: `origin/setup/Inspection` @ `d53e09f7ee4018bf2046e36d95fe45df355b11a2`
Implementation branch: `feat/plain-language-terminology-remediation` @ `3b7c057abb57ac6ce56139c6f69b4e52acea386c`
Worktree: `.worktrees/plain-language-terminology-remediation`

72 files changed relative to baseline, across 5 commits (Wave 0-4). File
count below is de-duplicated across waves (a file touched in two waves for
different reasons is listed once, per wave it was actually edited).

## Wave 0 — `afefdcb` (discovery, no code)
- `docs/terminology/PLAIN_LANGUAGE_INVENTORY.csv` (new)
- `docs/terminology/PLAIN_LANGUAGE_PROPOSAL.md` (new)

## Wave 1 — `15a4790` (Factory 360, web + iPad)
- `apps/web/src/app/factories/page.tsx`
- `apps/web/src/app/factories/FactoryList.tsx`
- `apps/web/src/app/factories/cr/[id]/page.tsx`
- `apps/web/src/app/factories/[id]/loading.tsx`
- `apps/web/src/app/field/factory-360/[id]/page.tsx`
- `apps/web/src/app/admin/integrations/factory-data/page.tsx`
- `design/retired-predecessor/d3/D3-03_single-planning-wizard.html`
- `design/retired-predecessor/d3/D3-07_factory-360.html`
- `design/retired-predecessor/d6/D6-01_operations-center.html`

## Wave 2 — `60c7b04` (core journeys)
- Planning: `planning/page.tsx`, `planning/plans/page.tsx`,
  `planning/plans/[id]/page.tsx`, `planning/bulk/page.tsx`,
  `planning/bulk/actions.ts`, `planning/bulk/review/page.tsx`,
  `planning/single/page.tsx`, `planning/single/actions.ts`,
  `planning/immediate/page.tsx`, `planning/immediate/actions.ts`
- Visits & Assignments: `visits/page.tsx`, `visits/[id]/page.tsx`
- Field Execution: `field/inspection/[id]/page.tsx`
- Submission & Immutable Cluster: `admin/packages/page.tsx`,
  `reports/inspection/[id]/page.tsx`, `visits/[id]/page.tsx` (shared with above)
- Review & Approval: `reviews/page.tsx`, `reviews/[id]/page.tsx`,
  `reviews/[id]/actions.ts`, `reviews/[id]/loading.tsx`
- Operations Center: `operations/page.tsx`

## Wave 3 — `faca972` (navigation & administration)
- `apps/web/src/lib/shell-navigation.ts` (sidebar nav source of truth)
- `apps/web/src/lib/i18n-keys.generated.ts` (Arabic-seeding manifest)
- `admin/regulations/page.tsx`, `admin/compliance-approvals/{page,error,loading}.tsx`,
  `admin/compliance-requests/[id]/page.tsx`, `admin/bulk-violations/page.tsx`
- `admin/risk/{page,actions}.ts`, `admin/workflows/{page,actions}.ts`,
  `admin/gis/{page,loading}.tsx`, `admin/integrations/page.tsx`
- `admin/localization/{page,loading}.tsx`
- `admin/operations/page.tsx`, `admin/audit/AuditReplayWorkspace.tsx`
- `admin/page.tsx`, `committee/{page,actions}.ts`
- `admin/items/page.tsx`, `admin/items/[id]/runtime-preview/page.tsx`
- 8 e2e specs updated to match renamed text: `cd-004-admin-control-plane-home.spec.ts`,
  `cd-005-006-regulations.spec.ts`, `compliance-approval-queue.spec.ts`,
  `compliance-library-evidence.spec.ts`, `compliance-library.spec.ts`,
  `compliance-shared-shell.spec.ts`, `mvp3-retrofit-regression.spec.ts`,
  `shell-navigation.spec.ts`

## Wave 4 — `3b7c057` (Arabic + residual English fixes)
- `supabase/migrations/20260721020000_plain_language_terminology_ar_strings.sql` (new, not applied remotely)
- Residual English fixes: `factories/page.tsx`, `factories/[id]/page.tsx`,
  `field/factory-360/[id]/page.tsx`, `lib/ai/contextual-actions.ts`,
  `portal/page.tsx`, `visits/calendar/page.tsx`, `visits/map/page.tsx`,
  `visits/page.tsx`, `admin/access/page.tsx`,
  `admin/compliance-requests/{page,loading,[id]/page}.tsx`,
  `admin/compliance-approvals/{page,loading}.tsx`, `dashboard/loading.tsx`

## Wave 5 — closure (uncommitted at time of writing, committed with this doc)
- `apps/web/e2e/terminology-regression.spec.ts` (new — regression guard)
- `apps/web/playwright.static.config.ts` (added new spec to testMatch)
- `apps/web/e2e/factory360-admin-control-plane.spec.ts` (fixed stale assertion)
- `docs/terminology/{APPROVED_TERMINOLOGY_GLOSSARY,CHANGE_MAP,ARABIC_TERMINOLOGY_REVIEW,VALIDATION_REPORT,RESIDUAL_TERMS,ROLLBACK}.md` (new)
