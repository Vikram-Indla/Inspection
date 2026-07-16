# ROUTE_RUNTIME_TRUTH_MEMO — CD-011
- Contract route: /admin/penalties (NOT implemented). Current route: /admin/violations (penalty logical mode). Do not imply the contract route exists.
- Schema (proven): penalty_mappings(id, UNIQUE violation_code_id, penalty_ref, penalty_range JSON preset, repeat_rule JSON preset, legal_basis, mapping_version). Unique key ⇒ one mapping per violation.
- Action (proven): createPenaltyMapping requires violation + penalty_ref + legal_basis + mapping_version + range preset (schedule_approved|none) + repeat-rule preset (escalate_one_level|none). Presets are config tokens, not monetary/legal values.
- Negative paths (proven): unmapped violation; duplicate one-to-one rejection (unique constraint); missing legal basis before create; missing/invalid preset.
- RLS: SELECT any authenticated; writes compliance_admin/form_admin; no Admin-family route guard proven.
- Audit: NO audit trigger on penalty_mappings. No usable audit timeline for compliance/form admin.
- FLD-PEN-001: mapping_version is an immutable REFERENCE for inspection results; the mapping row itself is NOT immutable.
- HANDOFF_BLOCKED (contract targets, not runtime): effective periods, overlap/gap engine, cardinality>1:1, submit/approve/publish lifecycle, maker-checker, mapping immutability, mapping audit trigger.
