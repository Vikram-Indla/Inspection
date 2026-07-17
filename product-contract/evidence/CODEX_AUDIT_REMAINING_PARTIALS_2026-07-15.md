# Codex remaining-partial disposition — 2026-07-15

This is the requirement-by-requirement disposition after the field-handoff
remediation and the 2026-07-16 live release proof. `partial` is retained where
the current repository cannot prove the missing leg without inventing policy,
a provider, a source field or a route. M04-045 is no longer in this table: its
live column, outbox replay, visit-before-inspection link and exact note readback
were verified under TASK-G11-G12-RELEASE-001.

| Requirement | Current disposition | Why it is not closed in this checkout |
|---|---|---|
| M02-039 | BLOCKED_UPSTREAM | Operations has region/city filtering and factory/visit pins; inspector-location pins require the visit-management map/telemetry integration and an accepted route/ownership decision. The current CD-026 map leg is explicitly HANDOFF_BLOCKED_MAP. |
| M04-012 | BLOCKED_SCHEMA | `geo_events` has only the governed `device_id`; no authoritative OS/app-version fields or version source exists in the contract/schema. Adding values would invent a device/version policy. |
| M04-017 | BLOCKED_PROVIDER | `eta_minutes` is explicitly sourced from a routing provider in the field dictionary; no provider or fallback policy is authorized. |
| M04-024 | BLOCKED_PROVIDER | ETA refresh and road-network travel time require the same unavailable routing provider; straight-line distance remains honestly labelled. |
| M04-043 | BLOCKED_POLICY | Outside-fence continuation requires an approved GPS override permission/reason policy; current behavior records outside and blocks, as required by ERR-GEO-002. |
| M07-003 | BLOCKED_SCHEMA | License status/stage/issue/expiry/holder fields are absent from the authoritative factory/document source used by this checkout. |
| M07-004 | BLOCKED_SCHEMA | CR status/legal-name/owner fields are absent from the authoritative source schema. |
| M07-005 | BLOCKED_PROVIDER_SCHEMA | Map/observed-location/GPS-override history requires a map/provider and persisted history fields not present in the current source contract. |
| M07-014 | BLOCKED_SCHEMA_POLICY | Only current risk score/version are authoritative; no score-history/driver/recalculation source or policy is available. |
| M07-015 | BLOCKED_SCHEMA_POLICY | Risk drivers/history and violation linkage are not present as authoritative fields or rules. |
| M07-017 | BLOCKED_SCHEMA | No event-source contract exists for sync, penalty or score-update events on Factory 360. |
| M07-019 | BLOCKED_RBAC_POLICY | Role-based tab/document/penalty visibility needs an accepted visibility matrix beyond the current RLS data boundary. |
| M09-001 | BLOCKED_SCHEMA_POLICY | Regulation effective-date/attachment/edit/deactivate lifecycle fields and transition policy are not present in the accepted admin contract. |
| M09-005 | BLOCKED_CONFIGURATION_SCOPE | Runtime accepts evidence types, but authoring additional presets needs an accepted configuration vocabulary and admin design scope. |
| M09-018 | BLOCKED_CONFIGURATION_SCOPE | Per-item required/optional/conditional authoring needs a package-definition contract beyond the current section-level flag. |
| M09-021 | BLOCKED_CONFIGURATION_SCOPE | Runtime conditional visibility exists; authoring condition rules requires an accepted admin authoring model. |
| M09-022 | BLOCKED_CONFIGURATION_SCOPE | Runtime `mandatory_when_visible` exists; authoring those conditions requires the same missing admin model. |
| M09-024 | BLOCKED_CONFIGURATION_SCOPE | Explicit scoring enable/disable needs a governed package scoring field and semantics; current null weight/preset behavior is the only accepted rule. |

These 18 rows are not silently reclassified as complete. They remain in
`evidence/AC_LEDGER.csv` as partial until their upstream authority exists and a
new independent audit can verify the resulting implementation.

M04-045 closure evidence: the live object-state probe found `evidence_note` and
the `arrival` evidence-link value already present, so no DDL was replayed. The
golden journey then queued arrival evidence through the actual offline outbox,
replayed it, and read back one visit-linked row with `inspection_id` null and
the exact note. This upgrades only AC-0158; it does not change any of the 18
provider/schema/policy/configuration rows above.
