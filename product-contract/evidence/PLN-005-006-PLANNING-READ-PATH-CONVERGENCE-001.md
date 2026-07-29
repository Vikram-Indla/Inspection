# PLN-005 / PLN-006 — Planning read-path convergence

Date: 2026-07-29
Environment: disposable non-production Supabase (`127.0.0.1:59342`) and exact
branch runtime (`codex/observation-ai-closure`, port `3222`)
Disposition: supporting blocker repaired; observation rows remain open pending
the AI recommendation contract and its required live positive/negative proof.

## Defect

The Planning visit read model embeds `visit_packages` and `inspections`. Both
tables had row-level-security policies permitting the relevant Planner read,
but neither table exposed the base table privilege required for PostgREST to
reach those policies. The exact-build route failed closed first on
`visit_packages`, then on `inspections`, with `ERR-OPS-001`.

## Forward-only repair

Migration
`supabase/migrations/20260729041000_planning_read_path_access_grants.sql`:

- gives `authenticated` exactly `SELECT`, `INSERT`, and `UPDATE` on
  `visit_packages`, whose existing policies separately gate those operations;
- gives `authenticated` exactly `SELECT` on `inspections`, whose consolidated
  `inspections_read` policy includes the Planner role;
- removes anonymous and legacy structural/destructive table privileges;
- does not grant `DELETE` on either table;
- does not change an application row, identity, role assignment, or audit row.

## Database proof

`supabase/tests/0045_planning_read_path_access_grants.sql` passed in a
transaction and replayed the migration idempotently before rollback. It asserts:

- required authenticated privileges are present and no wider privileges exist;
- anonymous has no table privilege;
- RLS remains enabled;
- all three scoped `visit_packages` policies and `inspections_read` remain
  present;
- users, profiles, role assignments, package links, inspections, and audit
  history retain their pre-test counts.

Immediate applied-state manifest:

| Object | Result |
| --- | --- |
| `auth.users` | 4 |
| `profiles` | 4 |
| `user_roles` | 4 |
| `visit_packages` | 0 rows |
| `inspections` | 0 rows |
| `visit_packages` / authenticated | `INSERT, SELECT, UPDATE` |
| `visit_packages` / anon | none |
| `inspections` / authenticated | `SELECT` |
| `inspections` / anon | none |

A separately authored direct-proof draft (`BP-8`, payload
`{"proof":"direct"}`) and its two append-only audit events appeared in the
shared disposable stack after the migration proof. They were not removed,
reset, relabelled, or used as evidence for this repair.

## Exact-build browser proof

Signed-in persona: `obs-planner-3222@example.invalid` (Planner)
Route: `http://127.0.0.1:3222/planning`

The same authenticated session advanced through both former permission errors
and rendered the Planning workspace:

- authenticated SAQEEL shell and Planner identity;
- Planning heading and governed creation actions;
- AI provider-withheld state plus live record facts;
- bulk, single, and immediate quick actions;
- RLS-scoped filters and empty-visit state;
- no `Planning data unavailable` / `ERR-OPS-001` state.

This proves the repaired schema-to-role-to-live-read seam. It does **not** close
PLN-005 or PLN-006: the current implementation still lacks the governed AI
suggestion envelope, provider/prompt/version trace, and live positive and
negative recommendation evidence required by those observation rows.
