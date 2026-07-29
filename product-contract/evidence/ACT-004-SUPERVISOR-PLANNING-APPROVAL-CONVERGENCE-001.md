# ACT-004 Supervisor Planning approval convergence

Status: `LOCAL_REPAIR_VERIFIED_NOT_APPLIED`

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

## Owner and next proof

Owner: Security / Role Migration.

Next proof: apply the forward migration only to an authorized non-production
database, then prove the three Planning decisions are denied while Supervisor
operational Planning and L2 inspection review remain allowed. Capture before
and after permission manifests and negative-path audit evidence.

## Closure condition

ACT-004 closes only after authorized non-production and live migration
provenance, all four persona route/RPC/RLS regression tests, and confirmation
that no Planning approval lifecycle has subsequently been approved.
