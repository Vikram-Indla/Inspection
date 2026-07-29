# ACT-004 Supervisor Planning approval convergence

Status: `AUTHORIZED_NONPRODUCTION_APPLIED_AND_VERIFIED`

## Delivered

Forward-only migration
`20260729040000_supervisor_planning_approval_convergence.sql` removes only the
Supervisor grants for:

- `planning.approve`
- `planning.return`
- `planning.reject`

It preserves the permission catalogue, all accounts and role assignments,
history, operational Planning permissions, and approved L2
`review.approve`, `review.reject`, and `review.return_scope` capabilities.

## Evidence

- Transactional local probe:
  `0044_supervisor_planning_approval_convergence.sql`
- Result: PASS.
- First execution removed exactly three fixture grants.
- Replay removed zero rows and passed, proving idempotency.
- Catalogue, accounts, profiles, user roles and L2 capabilities were unchanged.
- The transaction rolled back; no local or live database state persisted.
- `git diff --check`: PASS.

### Authorized non-production application — 2026-07-29

- Target: disposable local Supabase stack
  `inspection-action-proof-v4` (`127.0.0.1:59342`).
- Forward migration application: PASS (`DELETE 0`, invariant block PASS).
  The target already contained zero forbidden Supervisor Planning grants.
- Transactional replay probe on the same target: PASS.
  It installed three transaction-only fixture grants, removed exactly three on
  first execution, removed zero on replay, and rolled back.
- Before/after protected counts:
  - `auth.users`: 2 → 2
  - `profiles`: 2 → 2
  - `user_roles`: 2 → 2
  - forbidden Supervisor Planning grants: 0 → 0
  - Planning approval/return/reject permission catalogue rows: 3 → 3
  - Supervisor L2 review capabilities: 3 → 3
- No account, profile, role assignment, permission catalogue row, fixture,
  history row or audit record was deleted, reset, relabelled or overwritten.

## Owner and next proof

Owner: Security / Role Migration.

Next proof: prove the three Planning decisions are denied while Supervisor
operational Planning and L2 inspection review remain allowed. Capture
authenticated Supervisor/Planner browser and RPC negatives plus audit evidence.

## Closure condition

ACT-004 closes only after authorized non-production and live migration
provenance, all four persona route/RPC/RLS regression tests, and confirmation
that no Planning approval lifecycle has subsequently been approved.
