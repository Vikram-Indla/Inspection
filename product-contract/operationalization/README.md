# Operationalization Control System

This directory is the lightweight machine-readable control layer for the
approved Inspection Operationalization Programme. It is a sidecar to the
active product slice: it must not replace `execution/CURRENT_SLICE.yaml`,
change product behavior, or restate product completion without evidence.

Read in this order:

1. `CONTROL_INDEX.yaml`
2. `coordination/AGENT_OPERATING_PROTOCOL.yaml`
3. `coordination/batches/BATCH-001.yaml` when it is the active batch
4. `EXECUTION_LEDGER.yaml`
5. `SESSION_CURSOR.yaml`
6. `RECONCILIATION_SNAPSHOT_2026-07-18.yaml`
7. `DECISION_CHANGE_LEDGER.yaml`
8. `ARTIFACT_MANIFEST.yaml`

Rules:

- Status is derived from `EXECUTION_LEDGER.yaml`; do not create a manually
  authoritative `STATUS.md`.
- Every new claim must cite a product-contract or external-artifact source.
- `implemented` is not runtime-verified, sponsor-accepted, or audit-ready.
- Record a discrepancy; never silently normalize conflicting controls.
- Workers and subagents write only their exclusive outputs and immutable
  coordination events. They do not edit the shared Excel workbook,
  coordination CSV, handoff log or session cursor.
- The designated control writer regenerates those human-readable mirrors only
  at declared sync checkpoints after validating child outputs and event state.
- Human-readable master documents and binary evidence stay at the approved
  external documentation root. This directory stores only lightweight control
  indexes and resumable execution state.
