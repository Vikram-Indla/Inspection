# SOURCE_DISCOVERY_LOG — CD-006
source_branch: setup/Inspection
source_commit: 1b530afe06a620b3b85173d10cec1f12074e2c18
dirty_worktree: true
source_evidence: supplied Codex source-truth memo plus inspected attached source files

files_inspected:
- apps/web/src/app/admin/regulations/page.tsx — reads regulations(code,title,issuing_authority,status) + nested regulation_clauses(clause_ref,title) + nested inspection_items(code).
- apps/web/src/app/admin/regulations/Controls.tsx — create regulation / addClause / publish controls.
- apps/web/src/app/admin/regulations/actions.ts — createRegulation(draft); addClause(regulation_id,clause_ref,title,optional legal_source); publishRegulation = DIRECT draft->published, NO mapped-clause validation.
- migrations 0001/0002 — regulations audited by generic trigger; regulation_clauses NOT; audit_events read excludes compliance_admin/form_admin.
contradiction_with_prior_pack: prior CD-006 implied validation gate, maker-checker, published lock, compare, and an audit timeline for the writer persona as working — all corrected to BLOCKED.
