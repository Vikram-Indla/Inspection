# Source Authority

Use sources in this order. A lower source may clarify presentation but may not contradict a higher source.

1. Customer/auditor spreadsheet represented by `product-contract/domain/atomic_scope.csv` — 478 mandatory MVP1 rows.
2. Current product contract: process, screens, fields, RBAC, state transitions, errors, accepted decisions, acceptance ledger, and gate status.
3. Saqeel DEC-011: `product-contract/governance/DECISIONS_ACCEPTED_2026-07-12_SAQEEL.yaml`.
4. Current application source under `apps/web/src` and Supabase migrations.
5. `FABLE_UNDERSTANDING_TRACEABILITY.csv` and `FABLE_ACCEPTANCE_UNDERSTANDING.csv` — the existing 493-row requirement-to-screen and executable acceptance mapping.
6. Existing Astryx prototypes under `design/astryx/` as reusable design history, not current behavioral authority.
7. Twenty implementation storyboards in `MIM_Inspection_MVP1_Historical_Archives_v3` as visual/journey evidence.
8. External pattern research as non-authoritative inspiration only.

## Conflict resolutions

- `product-contract/GATE_STATUS.md` supersedes stale narrative gate references elsewhere.
- DEC-011 supersedes the earlier ministry-green visual theme.
- Current code proves what is implemented; it does not authorize weakening a product-contract rule.
- Catalogue routes describe logical screens. Code routes may consolidate them; Claude Design must preserve the logical screen states inside the consolidated experience.
- Provider-pending behavior must remain labelled. A visual simulation is not an integration.

## Prohibited invention

Do not invent provider names, GPS accuracy thresholds, geofence radii, risk weights, SLA values, retention periods, legal mappings, or new roles. Use configuration-driven placeholders or a named dependency where the source is unresolved.
