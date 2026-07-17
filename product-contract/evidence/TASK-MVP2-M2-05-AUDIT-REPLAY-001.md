# TASK-MVP2-M2-05-AUDIT-REPLAY-001 evidence

Date: 2026-07-17
Branch: `codex/mvp2-m2-05-audit-replay`
Start: `bf35872ded6b81c650d13cba9f6112574f9d709c`
Remote database: unchanged; no DDL applied

## Delivered local source

- Forward-only migration `20260717150000_mvp2_m2_05_semantic_audit_replay.sql`:
  event registry, versioned ontology, semantic envelope, field provenance,
  evidence/package/report references, correlation/causation, actor roles/scope,
  ingestion/integrity/chain statuses, idempotency, immutable mappings, RLS,
  bounded keyset read, source-row/event-contract-authorized append and
  source-table emitters. Database execution remains unproven locally.
- `/admin/audit`: portfolio/case filter, Flight Recorder, event provenance
  dialog, point-in-time reconstruction, two-moment comparison, ontology-derived
  completeness, custody view, permission/partial/degraded/empty/error states and
  operational print-safe mode.
- Exact 36-row `EVENT_ONTOLOGY.csv` and `REQUIREMENT_WIRING_MAP.csv`.
- Focused contract and authenticated UI suites named `mvp2-m2-05-*`.

## Truth and negative paths

- Existing `audit_events` immutability is not modified.
- Semantic events and mappings reject UPDATE/DELETE.
- Direct semantic writes are revoked; RPC emission is role-gated and requires
  an actor/object/action/time/correlation-matching immutable source audit row
  plus an allowlisted source-object/action-to-event contract.
- Duplicate source/idempotency returns the existing event only for an equivalent
  payload; reuse with a different fact is rejected.
- Callers cannot assert verified integrity/intact chain status. Required payload
  fields, evidence-hash format and backward causation are validated.
- Generic trigger rows remain `GENERIC ONLY`.
- Evidence bytes/storage paths are not copied into semantic payloads.
- Signature acknowledgement is `unverified`, not EBDA/PKI.
- Missing provider/MVP3/policy events remain missing or contract-held.
- Unauthorized inspector UI is designed for zero disclosure.
- Raw provider/database errors are logged server-side and neutralized in UI.

## Verification

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npx playwright test --config=playwright.static.config.ts e2e/mvp2-m2-05-contract.spec.ts` | 9 passed / 0 failed |
| `npx playwright test --config=playwright.static.config.ts` | 12 passed / 0 failed |
| `git diff --check` | PASS |
| Ontology/wiring rectangularity | PASS; 37 lines each including header |
| Fresh database migration/RLS/negative execution | BLOCKED — no local Docker/Postgres daemon; remote DDL not authorized |
| Authenticated M2-05 browser suite | BLOCKED — safety gate rejected connection to shared verification backend without separate informed approval |
| Mapped/full MVP1 browser regression | BLOCKED by the same shared-backend boundary; not reported as pass |

## Independent implementation audit

The non-implementer audit initially withheld certification after finding four
P0 defects: semantic-type forgery, repeated-edit loss, global-last-event display
instead of reconstruction, and hard-coded/false completeness. Remediation added
the source contract allowlist, state-sensitive trigger idempotency, per-aggregate
folding/comparison with stale/causal conflict flags, a 36-row published SQL
ontology loaded at runtime, required-field/order/branch checks, and fail-closed
completeness when history is bounded. The final read-only verdict is **SOURCE
IMPLEMENTATION PASS — runtime certification pending**, with no remaining
implementation P0/P1. It does not replace missing database/browser proof.

## External holds

- DEC-006 and DEC2-009: retention, reveal, export, redaction, watermark, purge
  and legal-evidence status.
- EBDA/PKI provider and signature/refusal authoritative stores.
- MVP3 package compiler/trusted-device download sources.
- M2-02 workflow, M2-04 risk, committee, correction, objection, sync-completion,
  conflict-resolution, dashboard-read and rejected-override consumer emitters.

## Rollback

Before remote application, rollback is branch deletion. After a future approved
database application, rollback must disable consumer emission/read feature use;
immutable semantic facts must not be deleted. New tables/functions may only be
retired through separately reviewed forward change control.
