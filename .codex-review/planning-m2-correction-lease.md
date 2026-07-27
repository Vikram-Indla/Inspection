# Planning M2 correction lease

## Decision

`BLOCK M2 ACCEPTANCE — SHARED SHELL RECONCILIATION REQUIRED`

The corrected Claude Design revision `1784901048581707` is accepted as the
design-side baseline for `WA-DES-036`. Application acceptance is blocked because
canonical HEAD `3323a8ef` combines the PR12 root layout (retired predecessor retired and not
loaded) with PR54 sources that again use unloaded `.legacy-*`, `var(--legacy-*)`, and
undefined `.wa-*` selectors.

## Ownership

- Claude Code owns Claude Design content, revision tracking, and design-side
  mapping/delta records.
- Codex owns application correction, build, runtime verification, and evidence.
- ChatGPT is a read-only discovery and sponsor-checklist partner.
- Only Codex may modify the leased application files below.

## Lease A — prerequisite shared-shell reconciliation

This lease is not activated by the current M2 approval. It requires explicit
sponsor authorization because it crosses shared shell and Field-owned files.

Outcome:

- Reconcile the PR12 native-SAQEEL shell/component source against the pre-PR54
  parent `8adfd3e9`.
- Preserve later functional changes.
- Restore the protected zero-trace contract: no loaded `.legacy-*` selectors or
  `--legacy-*` aliases.
- Do not import `retired-predecessor.css`, add compatibility shims, change product behavior,
  or modify backend/API/data contracts.

## Lease B — bounded Planning M2 correction

Activate only after Lease A passes its protected regression.

Files:

1. `apps/web/src/app/(app)/planning/PlanningPreview.tsx`
2. `apps/web/src/app/(app)/planning/PlanningPreview.module.css` (new)
3. `apps/web/src/app/(app)/planning/page.tsx`
4. `apps/web/src/app/(app)/visits/page.tsx`
5. `apps/web/src/app/(app)/visits/[id]/page.tsx`
6. `apps/web/src/app/(app)/visits/[id]/VisitDetailPreview.module.css` (new)
7. `apps/web/src/app/(app)/visits/[id]/DualStateRibbon.tsx`
8. `apps/web/e2e/web-admin-m2-batch-002.spec.ts`

Required outcomes:

- Replace bounded retired predecessor usages with loaded SAQEEL components and semantic
  tokens.
- Use co-located CSS modules for Planning-card and Visit-detail preview layout;
  do not restore global `wa-*` rules.
- Preserve `WA-DES-036`, `WA-DES-045`, preview gates, canonical `/visits/**`,
  real services, RLS/RBAC, audit/version reads, lifecycle behavior, and rollback.
- Remove directional decoration from links while retaining the time-window
  relationship arrow.
- Use locale-aware draft timestamps.
- Test stable behavior/test IDs rather than private implementation class names.

## Verification

- Typecheck and production build.
- Foundation native-SAQEEL zero-trace contract.
- M2 batch 001 (6 tests) and M2 batch 002 (9 tests).
- Planner and admin personas, explicit-query fail-closed behavior, RLS scope,
  audit/version, and adjacent Planning/Visits regressions.
- EN/LTR and AR/RTL; light/dark; 1440×900, 1024×768, 412/390, and 320.
- Keyboard, axe, sticky desktop action region, narrow static reflow, and
  direction-neutral link labels.
- Fresh browser evidence against design revision `1784901048581707`.

## Do not touch

Field/iPad behavior, APIs, backend, database, migrations, providers, shared
data, route cutover, existing stashes, `main`, and `setup/Inspection`.
