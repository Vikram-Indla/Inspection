# Migration reconciliation — 5 August 2026

Record of every migration touched on this date and its verified state in both
source control and the live project. Written because a claim in commit
`109c10e3` is wrong, and a wrong statement about database state is exactly the
kind of thing that misleads someone months later.

## Correction to commit 109c10e3

That commit's message states:

> Two of the four are NOT yet applied to the live project — the
> incident_reports_supervisor_read and visits_review_scope_read policies are
> absent from staging.

**That is incorrect. Both were already applied.**

The error was mine. I checked for policies named after the migration *files*.
Neither migration creates a policy by that name:

| File | What it actually does | Policy name in the database |
|---|---|---|
| `20260803220000_incident_reports_supervisor_read.sql` | `alter policy` on an existing policy | `incident_reports_read` |
| `20260803220000_visits_review_scope_read.sql` | `create policy` under a different name | `visits_read_review_scope` |

So the search was for names that never existed, and absence was read as "not
applied". Verified afterwards against the live project:

- `incident_reports_read` exists and its predicate includes the supervisor arm.
- `visits_read_review_scope` exists on `public.visits`.

Both changes were live before the files reached `main`.

**Do not re-apply these.** The second would fail with "policy already exists".

## What actually happened

The drift ran live-ahead-of-source, not the reverse. These four changes existed
in the database while their files sat only on unmerged branches. Landing the
files **closed** that gap rather than opening one.

That is the same failure mode as the six migrations restored earlier the same
day, in the same direction: the database carrying changes with no record in
version control, so nobody could explain why an object existed.

## Verified state — all migrations touched on 5 August 2026

| Migration | Source | Live | Reconciled |
|---|---|---|---|
| `insp_715_716_supervision_availability_audit_read` | restored to main | applied | yes |
| `insp_713_external_portal_canonical_roles` | restored to main | applied | yes |
| `planning_closure_region_alias_reconciliation` | restored to main | applied | yes |
| `insp_721_regional_assignments_reassignment_roster` | restored to main | applied | yes |
| `insp_721_assignments_rls_recursion_repair` | restored to main | applied | yes |
| `insp_721_assignment_scope_policy_execute_grant` | restored to main | applied | yes |
| `ccr_writer_admit_admin` | merged `67f172bb` | applied | yes |
| `incident_reports_supervisor_read` | landed `109c10e3` | already applied | yes |
| `analytics_canonical_role_convergence` | landed `109c10e3` | target present | yes |
| `planning_region_alias_eastern_province` | landed `109c10e3` | not independently verified | unconfirmed |
| `visits_review_scope_read` | landed `109c10e3` | already applied | yes |

One row is honestly unconfirmed: the Eastern Province region alias could not be
checked because there is no `regions` table to query against. It is recorded as
unconfirmed rather than assumed either way.

## The lesson worth keeping

Verify a migration by the **objects it creates or alters**, never by its
filename. This project has no `schema_migrations` table, so probe-by-object is
the only reliable method — and the probe must target the real object name, read
out of the migration body, not inferred from the file.

## Known issue, not corrected here

All four migrations landed in `109c10e3` carry the identical timestamp prefix
`20260803220000`. Filenames differ so nothing collides, but their ordering
relative to one another is undefined. Harmless for four independent additive
grants; a genuine hazard the first time two same-timestamp migrations are not
independent. Symptom of parallel sessions not coordinating timestamps.
