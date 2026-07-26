# TASK-IPAD-COMPLETED-HISTORY-001 Evidence

- Date: 2026-07-25
- Branch: `codex/ipad-completed-history-002`
- Source commit: `38e18e81`
- Process/screen: `G2-P09`, `SCR-IPAD-660`
- Requirements: `MVP1-M04-210..223`, especially `M04-214`, `M04-215`,
  `M04-221`, and `M04-222`
- Field contract: `FLD-SUB-001`

## Implemented

- Inspector-assignment-scoped completed history at `/field/completed`.
- Locked receipt/detail at `/field/completed/:id`, requiring an immutable
  `submission_versions` row.
- Version-derived completion reference and canonical submitted/acknowledgement
  timestamps.
- Read-only findings and evidence summary sourced from the submitted snapshot.
- User-scoped IndexedDB history cache used only as a display fallback.
- Home quick-action discovery path.

## Negative and preservation controls

- Unauthorized, missing, and versionless records fail closed.
- Detail does not read mutable checklist response/evidence tables and contains
  no form, server action, or mutation control.
- Cache records never enter the outbox and remain bound to a verified user ID.
- Existing RLS, immutable version, audit, workflow, and offline conflict
  contracts are unchanged.
- No DDL, shared data, provider, deployment, merge, or `main` mutation.

## Verification

- `npm run typecheck`: PASS (also repeated by the production build).
- `npx playwright test -c playwright.static.config.ts e2e/field-completed-history-contract.spec.ts`:
  PASS, 4/4.
- `npm run build`: PASS; `/field/completed` and
  `/field/completed/[id]` generated as dynamic routes.
- `git diff --check`: PASS.

## Remaining evidence

- Authenticated browser validation with an inspector who owns a real immutable
  submission.
- Offline/reload validation on an iPad-class browser and physical-device
  accessibility review.
- No release or production acceptance is claimed by source verification.
