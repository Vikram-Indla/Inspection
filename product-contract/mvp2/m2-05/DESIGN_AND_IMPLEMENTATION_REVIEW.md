# MVP2-CD-031-M2-05 design and implementation reconciliation

Date: 2026-07-17
Task: `TASK-MVP2-M2-05-AUDIT-REPLAY-001`
Branch: `codex/mvp2-m2-05-audit-replay`
Starting commit: `bf35872ded6b81c650d13cba9f6112574f9d709c`

## Design disposition

The supplied R2 archive scored 73/100 because its matrix was condensed rather
than workbook-exact, its standalone ontology and wiring map were absent, its
semantic envelope was incomplete, and its baseline was stale. Sponsor explicitly
overrode the implementation stop on 2026-07-17 and directed completion.

The repository now supplies the missing code-authoritative artifacts:

- `EVENT_ONTOLOGY.csv` — 36 exact requirement/acceptance/evidence bindings;
- `REQUIREMENT_WIRING_MAP.csv` — one rectangular row per retained requirement;
- migration `20260717150000_mvp2_m2_05_semantic_audit_replay.sql` — versioned
  registry, ontology, semantic envelope, append RPC, idempotency, RLS,
  immutability, keyset read and proven-source emitters;
- `/admin/audit` Flight Recorder modes and hard states;
- `mvp2-m2-05-*` contract and UI suites.

This reconciliation does not rewrite or self-approve the external design ZIP.
It converts approved design intent into repository-controlled implementation
authority while preserving explicit policy/provider/MVP3 holds.

## Truth boundaries

- Generic `audit_events` rows remain visible as `GENERIC ONLY`; no false
  canonical promotion occurs.
- `audit_events` UPDATE/DELETE rejection remains unchanged.
- Semantic events and mappings add their own UPDATE/DELETE rejection.
- Acknowledgement is `unverified`; it is not EBDA/PKI.
- Evidence semantic payload contains references, linkage, GPS and hashes, never
  storage bytes or protected media content.
- Completeness is computed from the selected ontology, not a universal ratio.
- Export, reveal, retention, redaction, watermark, purge and legal status are
  held under DEC-006/DEC2-009.
- Missing MVP3/provider sources remain missing and do not block replay of facts
  that actually exist.
