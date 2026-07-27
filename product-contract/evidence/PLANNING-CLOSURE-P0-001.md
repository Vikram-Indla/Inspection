# Planning Closure P0 authority-sidecar evidence

Status: `AWAITING_PO_COUNCIL_REVIEW`

Change: `CC-PLANNING-CLOSURE-P0-001`

Corrections: `CORR-PLANNING-R01-R03-002`, `CORR-PLANNING-MIGRATION-FENCE-001`

Lease: `LEASE-PLANNING-CLOSURE-BA-001`

Base: `origin/main@8865c35001761fd9fc9b027284881fe597b25ebd`

## Write entry

- Worktree: `/private/tmp/saqeel-planning-authority`
- Branch: `codex/planning-closure-authority`
- Origin: `https://github.com/Vikram-Indla/Inspection.git`
- Entry HEAD: `8865c35001761fd9fc9b027284881fe597b25ebd`
- Entry result: all seven authorized targets were absent; no overlap.
- Scope: seven additive governance/evidence files only. No existing or frozen file was edited.

## Authority outcome

The packet maps `PLN-J01..PLN-J20` and `PLN-R01..PLN-R10` to explicit requirement and acceptance rows. `PLN-R05` and `PLN-R06` remain `BLOCKED_DECISION` and grant no executable authority.

`PLN-R01` is a proposed supersession of `apps/web/src/app/(app)/planning/draft-actions.ts:57-75`. That code currently updates each linked draft visit to `planning_status=cancelled` after the parent was already archived and records child provenance best-effort. The proposed rule instead requires one atomic, idempotent parent-plus-children archival transaction, additive provenance, truthful draft identity, immutable audit and durable outbox intent. `SCHEMA_GAP-R01-CHILD-ARCHIVE` remains open.

`PLN-R03` applies the inclusive 720-hour cutoff to planner cancellation and window-changing planner rescheduling only. Exactly `720:00:00.000` passes and `719:59:59.999` fails. Reassignment, initial schedule/publish and non-window correction are excluded. Server transaction time and the current locked stored `window_start` are authoritative.

`PLN-R07` requires exact-window-end expiration only for eligible, not-started rows and a dedicated least-privilege database scheduler path. Existing `supabase/migrations/20260721030100_planning_canonical_structures.sql:444-593` uses configurable offsets, excludes an inspector-immediate form, and inserts notifications as delivered; its presence does not prove the corrected expiry/outbox contract.

## Migration fence

The proposed migration remains `supabase/migrations/20260728010000_planning_closure_p0.sql`.

The requested probe path `supabase/tests/0040_planning_closure_p0.sql` is not available at the base because `supabase/tests/0040_analytics_read_models_non_pgtap.sql` already exists. The Planning probe identifier is therefore `UNRESOLVED_PENDING_BACKEND_COLLISION_AUDIT`. No migration or test file was created.

## Drive provenance

| Source | Drive ID | Modified UTC | Size | Provider version | SHA-256 |
|---|---|---:|---:|---|---|
| Planning.docx | `1giOLe4-waBis3zCUQvqSWIGC4b2Skep4` | 2026-07-20T10:21:11Z | 56,691 | not exposed | pending controlled download |
| Inspection Project.xlsx | `1Ei163mjV4_I9-pchlglwoWAAVdx5n9ge` | 2026-07-19T23:30:17Z | 98,945 | not exposed | pending controlled download |

Pending checksums are explicit release gates; no checksum was invented.

## Evidence index

| Artifact | Purpose |
|---|---|
| `product-contract/governance/CC-PLANNING-CLOSURE-P0-001.yaml` | Proposed change authority, provenance, rules, effectivity and migration fence |
| `product-contract/operationalization/coordination/batches/PLANNING-CLOSURE-P0-AUTHORITY-001.yaml` | Bounded packet, lease, implementation fences and decision gates |
| `product-contract/operationalization/PLANNING_CLOSURE_P0_TRACE.csv` | Explicit row-level CR/MVP1/AC/journey/rule mapping |
| `product-contract/operationalization/PLANNING_CLOSURE_SCREEN_PROCESS_ACCEPTANCE.csv` | Final screen and process acceptance map |
| `product-contract/operationalization/PLANNING_CLOSURE_DEVELOPMENT_DEPENDENCIES.csv` | Development dependency and handoff matrix |
| `product-contract/operationalization/PLANNING_CLOSURE_PRODUCTION_CHECKLIST.csv` | Council production acceptance checklist |
| `product-contract/evidence/PLANNING-CLOSURE-P0-001.md` | Entry, source findings, provenance and validation evidence |

## Claim boundary

These sidecars do not make the proposed supersessions effective and do not authorize code, database, migration, test, board, Drive, design, deployment or release writes. External integrations are described only as seeded, environment-gated, not configured or unavailable until verified live evidence exists. Provider delivery is not claimed from durable outbox intent.

## Unresolved fields

1. Council ruling for `PLN-R05` unregistered factory lifecycle and source authority.
2. Council ruling for `PLN-R06` Supervisor capability/RBAC/RLS mapping.
3. Controlled-download SHA-256 for both Drive sources.
4. Exact noncolliding Planning SQL probe path.
5. Current migration-history/object-state reconciliation and local transaction/rollback proof.
6. Scheduler platform capability, threat model and exact grant matrix.
7. Provider delivery receipt/failure/retry successor packet and release impact.
8. PO/Council effectivity record and separate implementation/release authorization.
