# Seed Manifest / Registry Schema (design only — no migration written or applied)

This document specifies the proposed shape of the seed-run registry referenced in `SEEDER_IMPLEMENTATION_PLAN.md` §10 and §15. It is a DESIGN for a future migration, not a migration itself. Nothing here has been applied to any database.

## 1. `seed_runs` (proposed new table)

| Column | Type | Notes |
|---|---|---|
| `seed_batch_id` | `uuid` (primary key) | Deterministic root used to derive every domain ID's UUID prefix per `SEEDER_IMPLEMENTATION_PLAN.md` §2 |
| `label` | `text` | Human label, e.g. `"demo-2026-07-24"` |
| `volume_profile` | `text` check in (`demo`,`qa`,`performance`) | |
| `anchor_date` | `date` | The `SEED_ANCHOR_DATE` this run used |
| `git_commit_sha` | `text` | Commit of the seeder code that produced this run, for reproducibility |
| `started_at` | `timestamptz` | |
| `completed_at` | `timestamptz` nullable | Null while `status = 'in_progress'` |
| `status` | `text` check in (`in_progress`,`completed`,`partial`,`failed`) | |
| `last_completed_module` | `text` nullable | e.g. `"09-preparation-and-journeys"` — resume point on partial failure |
| `last_completed_scenario_id` | `text` nullable | Finer-grained resume point within a module |
| `created_by` | `text` | Operator/CI identity that invoked the run, never a service-role label |
| `notes` | `text` nullable | Free-text operator notes |

## 2. `seed_batch_members` (proposed new table — used only where a canonical table has no spare column for direct tagging)

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint identity` (primary key) | |
| `seed_batch_id` | `uuid` references `seed_runs(seed_batch_id)` | |
| `table_name` | `text` | e.g. `"visits"` |
| `row_id` | `uuid` | The deterministic ID of the tagged row |
| `module` | `text` | Which of the 15 modules wrote this row |
| `scenario_id` | `text` nullable | Correlates to the Section G scenario catalogue's `scenario ID` column (`SEED_SCENARIO_CATALOG.csv`, not part of this deliverable) |
| `created_at` | `timestamptz` | |

Preferred alternative, where feasible without weakening any accepted schema: add a nullable `seed_batch_id uuid` column directly on canonical tables that are seed-eligible (factories, visits, inspections, etc.), avoiding the join-table entirely for those tables. `seed_batch_members` remains the fallback for tables where adding a column is undesirable (e.g. immutable `submission_versions`, or tables shared with the real production write-path where an extra column would need broader sign-off).

## 3. Provenance fields on domain rows (per `ADAPTER_REPLACEMENT_PLAN.md` and the blueprint's recommended provenance list)

Where a seeded row represents "realistic synthetic" data standing in for an eventually-external-sourced fact (factories, licenses, production-line items, regulations), the blueprint recommends:

- `source_system`
- `source_record_id`
- `source_authority`
- `source_synced_at`
- `data_mode` (one of `LIVE_DATABASE`/`LIVE_EXTERNAL`/`PERSISTED_CONTRACT_STUB`/`BLOCKED_EXTERNAL`/`FRONTEND_MOCK` per the blueprint's endpoint realism contract)
- `is_synthetic`
- `seed_batch_id` (or the registry above)
- `external_contract_version`
- `sync_status`
- `last_sync_error`

**None of these columns currently exist on `factories`, `industrial_licenses`, or `plant_production_line_items`** per the schema evidence gathered in this pass (`0001_foundation.sql`'s `create table factories` and later migrations were not re-audited column-by-column in this H+I+J pass — this is a gap for Section A's `SCHEMA_CATALOG.csv` to confirm exactly). Until a migration adds them, this seeder plan CANNOT physically stamp per-row provenance beyond what `seed_batch_id`/`seed_batch_members` already gives it. This is flagged as an open decision, not resolved by inventing a migration here.

## 4. Manifest export (for evidence/audit, not for storage)

At the end of a seed run, `14-validation` writes a JSON manifest (not a new table — a plain file artifact, e.g. `product-contract/evidence/seed-runs/<seed_batch_id>.json`) summarizing:

```json
{
  "seed_batch_id": "…",
  "volume_profile": "demo|qa|performance",
  "anchor_date": "2026-07-24",
  "modules_completed": ["00-preflight", "…", "14-validation"],
  "row_counts_by_table": { "factories": 24, "visits": 96, "…": 0 },
  "scenario_ids_covered": ["SEED-SCN-001", "…"],
  "external_adapter_states_recorded": { "senaei": "not_configured", "industry_shared": "not_configured", "…": "…" },
  "validation_summary": { "referential_integrity": "pass", "…": "…" }
}
```

This manifest is the artifact a reviewer reads to confirm what a given batch actually produced without querying the database directly, and is what `SEED_CLEANUP_AND_ROLLBACK.md`'s cleanup tooling reads to enumerate affected tables before issuing deletes.
