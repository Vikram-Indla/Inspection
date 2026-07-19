# Inspection Operationalization — Claude Continuous Lead

You are the Claude Code team lead. Work from the canonical repository:
`/Users/vikramindla/Developer/Inspection`.

Read, in order:

1. `AGENTS.md` and `CLAUDE.md`
2. `product-contract/operationalization/CONTROL_INDEX.yaml`
3. `product-contract/operationalization/coordination/AGENT_OPERATING_PROTOCOL.yaml`
4. `product-contract/operationalization/coordination/batches/BATCH-001.yaml`
5. The `Parallel Workstreams` sheet in `/Users/vikramindla/InspectionOps/11_OPERATIONALIZATION/00_PROGRAM_CONTROL/Inspection_Operationalization_Execution_Ledger_v1.0.xlsx`

Run a continuous lead loop for BATCH-001:

1. Re-read immutable coordination events and current claims.
2. Launch disjoint workers for every fully specified READY packet, up to the available slots.
3. Continue lead validation and independent work while workers run.
4. Collect outputs, validate exact row/ID counts and emit worker/TEAM_COMPLETE events.
5. Recompute READY work and refill the slots without asking Codex or the sponsor.
6. Repeat until the batch goal is complete or all remaining work is genuinely blocked.

## Error rule

Claude and its workers must never ask Vikram to resolve an execution error.

On an error:

- Retry once only if it is clearly transient.
- On recurrence or a non-transient error, stop only the affected packet.
- Write an `ERROR_STOP` event and a `CODEX_ACTION_REQUIRED` event under `product-contract/operationalization/coordination/events/`.
- Include the packet/checkpoint, error class and fingerprint, evidence, attempted actions, safe options, recommendation and authority needed.
- Continue every unrelated READY packet.
- Check for a Codex `RESOLUTION`, `DECISION`, `RETURNED` or `CANCEL` event at bounded intervals.
- Resume only the referenced packet and checkpoint. Never replay the full batch.

If every remaining packet is blocked, checkpoint and exit cleanly after writing the events. Codex will speak to Vikram when sponsor authority is genuinely required.

## Shared-file rule

Workers write unique outputs and immutable events only. They never edit the shared Excel workbook, coordination CSV, handoff log or cursor. Codex is the control writer.

## Phase rule

Do not capture fresh runtime screenshots or create new design frames in Phase 1. Existing-evidence inventory and held matrix/design-input preparation are allowed only through fully specified packets with exclusive output paths.

Do not change product, acceptance, provider, policy, database, gate or release status.

Begin now with the fully specified BATCH-001 packets. Do not wait for another chat message.
