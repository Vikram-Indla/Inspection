# TASK-FACTORY-360-STAGING-RUNTIME-CLOSURE-016 — Pre-flight & migration evidence

## Repo state
- Canonical branch `setup/Inspection` @ origin resolves to `d53e09f7ee4018bf2046e36d95fe45df355b11a2` — confirmed via `git rev-parse origin/setup/Inspection`.
- New branch `codex/factory360-staging-runtime-closure-016` created from that exact SHA in isolated worktree `.local-inputs/worktrees/factory360-staging-runtime-closure-016`.
- Cited SHAs verified present in history: web `a92dd9f4`, evidence `db528546`, cross-provider `ede6628f`, iPad `218131cf` (PR #35, merge `0a2cb4c1`), reconciliation `1f177158` (PR #36, merge `e0363bc0`).
- Slice `TASK-FACTORY-360-IPAD-API-CONTRACT-CONSUMPTION-015` archived to `product-contract/execution/slice-history/CURRENT_SLICE_FACTORY_360_IPAD_API_CONTRACT_CONSUMPTION_015_backup_2026-07-20.yaml`.

## Staging project confirmation
- Connected Supabase MCP connector (project id `42209857-...`) is bound to unrelated account `catalyst-prod` (INACTIVE) — not usable for this task.
- Correct project reached via Management API + keychain PAT `supabase-pat` (rotated 2026-07-20, prior token was globally 401 Unauthorized): `iiozvqntawxfwbgffzqu`, name "Vikram-Indla's Project", org `yojqfhflrdmkbtpofyxv`, status `ACTIVE_HEALTHY`, region `ap-northeast-2`. Not production.

## Migration reconciliation
- 107 migrations were present on staging before this session's action.
- `0011_factory360_gis_ksa_seed`, `0017_w3_factory_master_data`, `0020_fix_factory_verification`, `20260716120000_cd031_factory360_audit` — already applied (pre-existing).
- `20260720010000_factory360_v2_foundation.sql` — **NOT applied** at session start. Reviewed in full: 795 lines, additive/idempotent only (guarded `create table`/`create index` statements and `create or replace function`; the guarded policy/trigger recreate lines are the standard idempotent pattern, no unguarded removal DDL, no bulk-delete statements, no destructive rewrite). In accepted Factory 360 v2 scope (F360-ARCH-001 / F360 v2 foundation). Checksum (sha256) before apply:
  `d447f1f09370f475cfea71e5f82d38f1de205a9a886ac39d6027fb12f33865c5`
- Applied via Management API SQL-execution endpoint (`POST /v1/projects/iiozvqntawxfwbgffzqu/database/query`), the repo's established mechanism (see `product-contract/CURRENT_STATE.md` UPDATE 38/41 precedent) — 2026-07-20, HTTP 201.
- Post-apply verification (read-only): all 16 new tables exist — `commercial_registrations`, `industrial_licenses`, `plant_addresses`, `plant_production_line_items`, `factory_media_assets`, `factory_import_batches`, `factory_import_rows`, `factory_government_records`, `external_source_connections`, `inspection_factory_snapshots`, `permissions`, `role_permissions`, `senaei_sync_runs`, `senaei_sync_calls`, `senaei_reconciliation_records`, `senaei_raw_snapshots`. Row-level security confirmed enabled on all 16/16 (`pg_class.relrowsecurity = true`).
- Out-of-scope observation, not acted on: staging carries 3 migration versions (`20260719220000`, `20260719223000`, `20260719224000`) with no matching local file at this SHA — appears to be separate concurrent MVP2/3 work, not Factory 360 scope.

## Not reached this pass (sponsor direction 2026-07-20)
- J01-J05, J13-J15 (live web/browser journeys): staging app URL/deploy mechanism not supplied this pass — skipped, not `NOT_REACHABLE_WITH_REASON`-closed, open for a follow-up pass.
- J06-J12 (iPad/field + offline device journeys): no iPad simulator/device in this session's toolset — `NOT_REACHABLE_WITH_REASON`.
- Native-Arabic human review: separate human evidence gate, not attempted.
- Full RLS/grants matrix per-role, test personas, provider structural-contract classification (J13-J14), external-submission boundary (J15), and the full automated verification suite (typecheck/build/tests/security scans) — not run this pass.

## Status
Database reconciliation for the v2 foundation migration is closed for this pass; application-runtime and device journeys remain open for a follow-up pass once a staging URL/deploy mechanism is supplied.
