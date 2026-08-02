# PLN-012 — Four canonical roles closure

Date: 2026-07-29
Environment: fresh disposable non-production Supabase and exact-build runtime
`codex/observation-ai-closure` on `http://127.0.0.1:3222`
Disposition: **Completed**

## Environment continuity

The earlier disposable Docker containers and their local volume had been
removed externally before this resumed run. No repository action deleted or
reset them. A new disposable project identity was created and initialized from
the repository migration chain. The earlier local-only personas could not be
recovered; no production or shared environment was accessed or changed.

Four clearly named non-production personas were added to the fresh instance:
Admin, Planner, Inspector, and Supervisor. No existing account or assignment
was relabelled or overwritten.

## Stale claims corrected

The tracker previously said the compatibility migration had no verified commit
and no RLS/regression proof. Repository and runtime reconciliation found:

- the four-role compatibility migration was already present;
- Supervisor still inherited three catalogue-only Planning approval grants
  until commit `784854e2` removed them forward-only;
- fresh schemas had RLS policies but omitted the base SELECT privileges needed
  for canonical role routing and Planning reads;
- the review UI and review RPCs still recognized only legacy reviewer/ops
  roles, so canonical Supervisor could not perform the approved L2 function.

## Repairs

### Role and Planning read seam

`20260729043000_canonical_role_planning_read_access_grants.sql`:

- restores authenticated SELECT through existing RLS for `user_roles`, `roles`,
  and the Planning read/reference tables;
- removes anonymous and legacy structural/destructive privileges;
- grants no direct role mutation or business-table mutation.

### Supervisor L2 review seam

`20260729044000_supervisor_review_capability_convergence.sql`:

- adds `review.view` capability recognition to review/inspection read RLS;
- allows canonical `review.decide` in `start_review` and `decide_review`;
- preserves legacy reviewer/ops compatibility;
- does not grant Supervisor Planning approve/return/reject.

The review queue and detail route now use `review.view` and `review.decide`
capabilities while retaining legacy read compatibility.

## Database proof

Passing probes:

- `0044_supervisor_planning_approval_convergence.sql`
- `0047_four_canonical_roles_compatibility.sql`
- `0048_canonical_role_planning_read_access_grants.sql`
- `0049_supervisor_review_capability_convergence.sql`

They prove:

- exactly four assignable, active internal roles;
- zero assignable legacy roles and a preserved manual mapping ledger;
- exact-role checks do not widen one canonical role into another;
- new legacy-role grants fail with no residue;
- Admin configuration, Planner operations, Inspector execution, and Supervisor
  Planning-plus-L2 boundaries match the approved matrix;
- Supervisor reaches review RPC state validation, while Planner is rejected at
  review authorization;
- all probes roll back fixtures and preserve protected counts.

Applied manifest after browser proof:

| Object | Result |
| --- | ---: |
| Auth users | 4 |
| Profiles | 4 |
| User-role assignments | 4 |
| Audit events | 242 |
| Active assignable canonical roles | 4 |
| Assignable legacy roles | 0 |
| Supervisor Planning approval grants | 0 |
| Supervisor review capabilities | 5 |

## Exact-build browser proof

- **Admin**: `/admin/access` renders the governed role catalogue and the Admin
  account; `/planning` renders `Authorized role required`.
- **Planner**: `/planning` renders the RLS-scoped workspace, export, creation
  controls, filters, and honest empty state.
- **Inspector**: `/field` renders the assigned-work field home; `/planning`
  renders `Authorized role required`.
- **Supervisor**: `/planning` renders the operational Planning workspace;
  `/reviews` renders the Level 2 queue and honest empty state rather than an
  unauthorized block.

The empty review queue still reports that some optional linked facts are
unavailable on this zero-record disposable dataset. That does not weaken the
role decision proof: database capability and RPC authorization are separately
proven, and no review decision or application row was fabricated.

## Verification

- TypeScript typecheck: pass.
- SQL probes: pass.
- Exact-build authenticated browser: pass for all four personas.
- No account, role assignment, application data, or audit history was deleted,
  reset, deactivated, relabelled, or overwritten by the closure work.
