# SOURCE_DISCOVERY_LOG — CD-009
source_branch: setup/Inspection
source_commit: 1b530afe06a620b3b85173d10cec1f12074e2c18
dirty_worktree: true
source_evidence: supplied Codex source-truth memo plus inspected attached source files

files_inspected:
- DraftEditor.tsx — edit section title, section mandatory flag, add/remove item code, add section, save draft definition (draft status only). NO reorder control. Array order consumed by preview/runtime.
- PackagePreview.tsx — read-only projection (responses, evidence, conditional source text, guidance, clause, violation link, action-form shape). NOT a simulator.
- PublishControls.tsx/actions.ts/ImpactPanel.tsx — publish/validation/impact per CD-008.
contradiction_with_prior_pack: prior CD-009 presented simulation engine, circular-condition detector, reorder, condition/scoring/evidence/action-form authoring as active — corrected to disabled HANDOFF_BLOCKED targets.
