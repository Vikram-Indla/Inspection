# Load and unload — what works, and the constraint behind it

Established by running the loader and the unloader against a real PostgreSQL 16
database with 248 of the repository's 274 migrations applied (165 tables), on
2026-08-22. Every statement below is an observed result, not a schema reading.

## Summary

Two commands, and the difference between them matters.

| | `unload --confirm` | `reset --confirm` |
|---|---|---|
| Respects immutability triggers | yes | no — suspends them |
| Needs superuser | no | **yes** |
| Removes a submitted journey | no | yes |
| Use for | clearing pre-submission rehearsal data on any environment | returning a training database to its baseline |

Both delete only ids this batch derived. Neither touches `audit_events`, and
neither touches a row that was in the database beforehand.

**Proved end to end:** load → verify → reset → load again returns the identical
figure (82.9% compliance, 1,715 of 2,070) on both loads, on a real database.

## The constraint

**Once a visit reaches submission, its entire upstream graph becomes permanent
under normal operation.**

`submission_versions` refuses `DELETE` through `block_submission_version_mutation`,
exactly as `audit_events` does. Because `submission_versions.inspection_id`
references `inspections` with `NO ACTION`, the inspection cannot be deleted
either — and from there the refusal cascades all the way up:

```
submission_versions   IMMUTABLE — trigger refuses DELETE
  └─ inspections      held by FK from submission_versions
      └─ visits       held by FK from inspections
          └─ visit_plans, factories
              └─ commercial_registrations, industrial_licenses
                  └─ profiles  (also held by package_versions.created_by)
```

Measured on a 300-visit cohort: **130 visits carry a submission**, so 130 visits,
148 inspections, 5,371 checklist answers, all 73 factories and all 45 users
survive a full unload attempt. Only assignments (204), geo events (308) and
reviews (130) were actually removable.

Three further tables refuse deletion of their own accord, discovered the same way:

| Table | Trigger | Message |
|---|---|---|
| `dashboard_config_versions` | `dash_block_version_mutation` | `DASH_CONFIG_APPEND_ONLY` |
| `violation_codes` | `guard_governed_violation_code` | `IMMUTABLE: governed violation cannot be deleted` |
| `regulations` | `guard_published_regulation` | `IMMUTABLE: governed regulation SBC-201 cannot be deleted` |

## Why this is correct behaviour

A submitted inspection is a legal record. An inspector signed it, a supervisor
decided on it, and a factory can be penalised because of it. A platform that let
that be deleted would not be defensible. **The constraint is the product working,
not a bug to route around.**

## How reset gets past it

Postgres has a first-class mechanism for exactly this:
`set local session_replication_role = replica` suspends triggers for the session.
`reset` wraps the whole batch deletion in one transaction under that setting, so
either every row goes or none does.

**The privilege is the guard.** It requires superuser, which nobody holds on an
environment where this would be dangerous. `reset` additionally refuses a database
whose name looks like production and refuses `NODE_ENV=production`. On anything
without superuser it declines and points at `unload` instead.

This does not weaken the immutability rule. A submitted inspection stays
undeletable through every normal path — the application, the API, any RLS-scoped
session. Resetting a training database is an administrative act performed by a
database owner, and it is the same act as dropping and recreating the database,
without the ten minutes of re-running 274 migrations.

Measured: **7,610 rows removed in one transaction**, leaving 0 visits, 0
inspections, 0 answers, 0 submissions, 0 profiles — and the 24 pre-existing
factories exactly as they were.

## What it means for training

- A session can be reset and re-run in seconds, repeatedly, with identical results.
- `audit_events` is kept on purpose. The trail of what a training run did stays
  readable afterwards, which is useful for reviewing the session.
- Nothing that was in the database before the batch is ever touched.

## Correction to the earlier design

`TEST-DATA-ARCHITECTURE.md` §6 claimed unload "deletes L4-removable → L3 → L2 → L1
strictly in reverse dependency order, by explicit row ID" and that `--all` would
leave "only L0 reference data, real content, and the audit trail". **That is wrong**
and is superseded by this document. The claim was written from the schema and the
prior discovery pack; it did not survive contact with the database.

## Other guards the load had to satisfy

Each of these stopped the loader on its first real run and none was visible in the
CSV files:

| Guard | What it required |
|---|---|
| `operational_state` enum | No `assigned` value exists — an assigned visit is `new` with an `assignments` row |
| `review_status` enum | `pending_review`, not `pending` |
| `guard_bulk_visit_registered_source` | A bulk visit's factory needs an `industrial_licenses` row linked to a `commercial_registrations` row |
| `guard_assignment_window_overlap` | One inspector cannot hold two overlapping assignments — the cohort must be schedulable |
| `guard_approved_requires_submission` (DEF-WF-006) | An inspection cannot be approved before its submission exists |
| `guard_submission_action_forms_and_config` | A submission needs a `visit_package_snapshots` row whose checksum is sha256 of its definition |
| `guard_publish_requires_approver` (RBAC-002) | Publishing a package version needs an approver different from its creator |
| `regulations_one_open_governed` | Only one published row per regulation code — `SBC-801` already exists and must not be duplicated |

## Reproducing this

```
initdb / start postgres
psql -f supabase/migrations/*.sql            # 248 of 274 apply cleanly
python3 scripts/test-data/load.py load
python3 scripts/test-data/load.py verify
python3 scripts/test-data/load.py unload --dry-run
python3 scripts/test-data/load.py unload --confirm
```
