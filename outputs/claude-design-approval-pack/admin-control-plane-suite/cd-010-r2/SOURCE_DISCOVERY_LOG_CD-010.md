# SOURCE_DISCOVERY_LOG — CD-010
source_branch: setup/Inspection
source_commit: 1b530afe06a620b3b85173d10cec1f12074e2c18
dirty_worktree: true
source_evidence: supplied Codex source-truth memo plus inspected attached source files

files_inspected:
- violations/page.tsx — reads violation_codes(code,title,level,active_from,clause/regulation ref) + nested penalty mapping summary.
- violations/Controls.tsx / actions.ts — createViolationCode(code,title,level L1/L2/L3,clause,active_from).
- migrations 0001/0002 — violation_codes(id, UNIQUE code, title, level, optional clause_id, active_from, active_to); NO audit trigger on violation_codes; runtime 'violations' is a separate table.
contradiction_with_prior_pack: prior CD-010 implied a violation_codes audit trigger, category/applicability fields, a legal-basis field on the row, and usage counts — all corrected/removed.
