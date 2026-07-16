# Codex remaining-partial disposition — 2026-07-15

## 2026-07-16 superseding reconciliation

The independent M09 requirement-level audit in
`CODEX_AUDIT_M09_WRITE_FLOW_2026-07-16.md` closed the six stale M09 partials
(M09-001, M09-005, M09-018, M09-021, M09-022 and M09-024) as implemented after
local and authenticated live write/negative/audit proof. They are removed from
the active table below. TASK-IPAD-M04-DEVICE-ETA-OVERRIDE-001 then closed
M04-012 as implemented with durable browser/device/application provenance.
Its three externally bounded rows now have complete, visibly labelled test-mode
flows but remain partial for production. **Eleven partial rows remain.** The original dated M09
assessment is superseded; it is not silently treated as proof for the closure.

This is the requirement-by-requirement disposition after the field-handoff
remediation and the 2026-07-16 live release proof. `partial` is retained where
the current repository cannot prove the missing leg without inventing policy,
a provider, a source field or a route. M04-045 is no longer in this table: its
live column, outbox replay, visit-before-inspection link and exact note readback
were verified under TASK-G11-G12-RELEASE-001.

| Requirement | Current disposition | Why it is not closed in this checkout |
|---|---|---|
| M02-039 | BLOCKED_UPSTREAM | Operations has region/city filtering and factory/visit pins; inspector-location pins require the visit-management map/telemetry integration and an accepted route/ownership decision. The current CD-026 map leg is explicitly HANDOFF_BLOCKED_MAP. |
| M04-017 | BLOCKED_PROVIDER | Initial ETA persistence and execution-window warning pass with a visibly labelled deterministic test adapter; production remains fail-closed because DEC-008 has not selected/licensed a routing provider. |
| M04-024 | BLOCKED_PROVIDER | Periodic route refresh, offline stale last-value and recovery pass with the test adapter; production road-network travel time/refresh still require the unavailable provider. |
| M04-043 | BLOCKED_POLICY_INTEGRATION | Dialog/cancel/mandatory reason/actual-coordinate persistence pass with simulated Operations approval; production remains blocked until the real governed approval mechanism and policy are supplied. |
| M07-003 | BLOCKED_SCHEMA | License status/stage/issue/expiry/holder fields are absent from the authoritative factory/document source used by this checkout. |
| M07-004 | BLOCKED_SCHEMA | CR status/legal-name/owner fields are absent from the authoritative source schema. |
| M07-005 | BLOCKED_PROVIDER_SCHEMA | Map/observed-location/GPS-override history requires a map/provider and persisted history fields not present in the current source contract. |
| M07-014 | BLOCKED_SCHEMA_POLICY | Only current risk score/version are authoritative; no score-history/driver/recalculation source or policy is available. |
| M07-015 | BLOCKED_SCHEMA_POLICY | Risk drivers/history and violation linkage are not present as authoritative fields or rules. |
| M07-017 | BLOCKED_SCHEMA | No event-source contract exists for sync, penalty or score-update events on Factory 360. |
| M07-019 | BLOCKED_RBAC_POLICY | Role-based tab/document/penalty visibility needs an accepted visibility matrix beyond the current RLS data boundary. |
These 11 rows are not silently reclassified as complete. They remain in
`evidence/AC_LEDGER.csv` as partial until their upstream authority exists and a
new independent audit can verify the resulting implementation.

M04-045 closure evidence: the live object-state probe found `evidence_note` and
the `arrival` evidence-link value already present, so no DDL was replayed. The
golden journey then queued arrival evidence through the actual offline outbox,
replayed it, and read back one visit-linked row with `inspection_id` null and
the exact note. This upgrades only AC-0158; it does not change any of the twelve
provider/schema/policy/RBAC rows above. M04-012 is implemented—not
`verified_live`—because sponsor runtime acceptance is still distinct from the
live functional proof captured in the slice evidence.
