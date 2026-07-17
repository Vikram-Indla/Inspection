# Staging ↔ Source Migration Reconciliation — 2026-07-18

Target: Supabase staging `iiozvqntawxfwbgffzqu`. Goal: bring staging to the exact
source migration level so the full MVP1 + MVP2 live suite can certify.

## Method (safe, object-level — no blind re-apply, no seed duplication)
1. Parsed all **93** source migrations for created objects (tables, functions, types)
   and column adds; diffed against staging's live `information_schema` / `pg_proc` /
   `pg_type`. (scratchpad `reconcile.py` / `coldrift.py`.)
2. Applied ONLY the migrations owning genuinely-missing objects.
3. Initialised `supabase_migrations.schema_migrations` and backfilled all 93 versions
   as the reconciled baseline (enables future `supabase db push`).

## Findings + actions
- **Missing whole migrations** (pre-existing staging drift, applied):
  - `20260716161604_add_geo_override_evidence_link.sql`
  - `20260716161605_ipad_geo_override_approval_workflow.sql`
    (`geo_override_requests` table + `expire_stale_geo_override_requests` fn were absent
    though same-day `notification_rules` was present — drift was spotty, not a clean cutoff.)
- **Missing create-table column** (applied earlier as migration 20260717230000):
  - `submission_versions.acknowledgement` (source 0001).
- **Real function regression** (fixed as migration 20260717240000, R-003):
  - `emit_mvp2_m2_05_semantic_event` referenced table-specific columns in IF-chain
    conditions → 42703 on tables lacking them → aborted MVP1 writes (publish, evidence).
    Restructured to gate on tg_table_name/tg_op only.

## Final state — ZERO schema drift
Post-reconciliation object diff: **0 missing tables, 0 functions, 0 types, 0 columns.**
(20 "column" hits from the naive parser were all false positives — SQL comments,
generated-column `stored` keyword, enum values — verified against source + staging.)
Direct insert probes (submission_versions, evidence/arrival) now pass the trigger with
no 42703. `schema_migrations` tracks all 93 versions.

## Live regression after reconciliation — FULLY GREEN
- **Golden journey: 10/10 pass.** MVP1 broader regression (persona-tours, dashboard,
  shell, negative-auth, offline-drill): **29/29**.
- The arrival-evidence step (initially suspected offline-sync timing) was a SECOND real
  trigger regression (R-005): visit-anchored evidence (inspection_id NULL) made the emit
  branch derive a NULL case_ref → 23502 → evidence insert aborted (storage upload
  succeeded, table row never landed). Fixed by migration 20260717250000 (use visit_id when
  inspection_id NULL + NOT-NULL safety net). Golden journey then went 10/10.
- All MVP2 suites, MVP1 auth/shell/dashboard/persona/offline, and RLS both-ways green.

## Residual risk (noted, not blocking)
Function-BODY drift (a function present but with an older body than source) is not caught
by existence diff. No widespread failure indicates it; a deep body-level diff is a
possible future hardening step.
