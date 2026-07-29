# PLN-007 — Planning quick-action route proof

Date: 2026-07-29
Environment: disposable non-production Supabase and exact-build runtime
`codex/observation-ai-closure` on `http://127.0.0.1:3222`
Disposition: **In progress**; all route entries work, but the Product Owner's
Immediate shortcut policy decision remains open.

## Repaired blocker

Bulk Planning derives prior recorded facts through `violations` and embedded
`reviews`. Both tables had active read RLS but lacked the table privileges
needed to reach those policies. The route failed closed as `ERR-OPS-001`.

`20260729042000_planning_bulk_history_access_grants.sql` gives
`authenticated` SELECT only on both tables, removes anonymous and legacy
structural/destructive privileges, and leaves row visibility to the existing
RLS policies.

`0046_planning_bulk_history_access_grants.sql` passed transactionally and on
replay. It proves:

- authenticated has SELECT only;
- anonymous has no table access;
- RLS and the named read policies remain enabled;
- accounts, profiles, role assignments, violations, reviews, and audit history
  keep their pre-test counts.

## Exact-build browser proof

Persona: `obs-planner-3222@example.invalid` (Planner)

### Bulk planning

`/planning/bulk` rendered:

- AND/OR criteria builder;
- explicit no-match-all guard;
- governed and unavailable targeting dimensions;
- RLS-scoped eligibility ledger and distributions;
- zero selected factories and disabled Review action.

### Single planning

`/planning/single` rendered:

- canonical CR / Industrial License / plant / name search;
- disabled Save draft and Schedule visit controls before factory selection.

### Immediate planning

`/planning/immediate` rendered:

- explicit authorization, reason, identity, location, checklist, inspector,
  window, audit, and notification guards;
- registered-factory path;
- disabled unregistered/temporary path with truthful unavailable copy;
- disabled dispatch until mandatory guards and confirmation are satisfied.

## No-mutation manifest

Before and after all three GET/navigation paths:

| Object | Count |
| --- | ---: |
| `visit_plans` | 2 |
| `visits` | 0 |
| `violations` | 0 |
| `reviews` | 0 |
| `audit_events` | 247 |

No plan, visit, violation, review, or audit event was created by route entry.
All existing accounts and the two separately authored direct-proof plans were
preserved.

## Remaining decision

The technical route verification requested by PLN-007 passes. The observation
must not be marked Completed until the Product Owner decides whether Immediate
belongs in the Planning landing quick actions. If retained, the registered-only
and guard-driven behavior above is the current truthful contract; if removed,
that is a screen/markup change requiring the mandatory approved-design
inspection before implementation.
