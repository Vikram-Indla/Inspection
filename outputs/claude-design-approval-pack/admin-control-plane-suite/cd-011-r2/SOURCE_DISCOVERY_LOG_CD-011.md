# SOURCE_DISCOVERY_LOG — CD-011 (SCR-ADM-041)
source_branch: setup/Inspection
source_commit: 1b530afe06a620b3b85173d10cec1f12074e2c18
dirty_worktree: true
source_evidence: supplied Codex source-truth memo (CD006_CD011_CORRECTION_SOURCE_TRUTH_2026-07-15.md) plus inspected attached source files
observation_date: 2026-07-15

files_inspected:
- apps/web/src/app/admin/violations/page.tsx — reads violation rows + nested penalty mapping summary; penalty mode is a logical mode of this route (no /admin/penalties).
- apps/web/src/app/admin/violations/Controls.tsx — hosts create controls incl. penalty mapping create form.
- apps/web/src/app/admin/violations/actions.ts — createPenaltyMapping(violation, penalty_ref, legal_basis, mapping_version, range preset, repeat-rule preset); rejects duplicate via unique violation_code_id and missing legal_basis.
- supabase/migrations/0001_foundation.sql — penalty_mappings(id, UNIQUE violation_code_id, penalty_ref, penalty_range JSON, repeat_rule JSON, legal_basis, mapping_version). No effective-period columns, no status/lifecycle column.
- supabase/migrations/0002_rbac_audit.sql — base config RLS (SELECT authenticated; writes compliance_admin/form_admin); generic audit trigger covers regulations + package_versions ONLY (NOT penalty_mappings). audit_events read policy excludes compliance_admin/form_admin.

contradictions_with_memo: none. Every memo fact reproduced.
legs_kept_blocked: effective periods/overlap/gap, cardinality>1:1, submit/approve/publish lifecycle, penalty maker-checker, mapping-row immutability, mapping audit trigger, Admin-family route guard.
