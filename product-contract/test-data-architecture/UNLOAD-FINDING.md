# Unload cannot empty this platform — proved, not assumed

Established by running the loader and the unloader against a real PostgreSQL 16
database with 248 of the repository's 274 migrations applied (165 tables), on
2026-08-22. Every statement below is an observed result, not a schema reading.

## The finding

**Once a visit reaches submission, its entire upstream graph becomes permanent.**

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

## What it means for training

- **A training database cannot be reset by deletion.** Resetting means recreating
  the database and re-running migrations, then loading a fresh batch.
- **Unload is still useful, on a narrower promise:** it removes everything from a
  cohort that never reached submission — drafts, published visits, assignments,
  journeys, geo events, executing inspections. That covers planning and operations
  rehearsal, which is most of what a training session repeats.
- **Plan the cohort around this.** If a session needs repeated resets, generate a
  cohort whose journeys stop before submission, and load the submitted tail once.

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
