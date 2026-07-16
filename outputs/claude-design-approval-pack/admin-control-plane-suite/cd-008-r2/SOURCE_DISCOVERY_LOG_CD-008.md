# SOURCE_DISCOVERY_LOG — CD-008
source_branch: setup/Inspection
source_commit: 1b530afe06a620b3b85173d10cec1f12074e2c18
dirty_worktree: true
source_evidence: supplied Codex source-truth memo plus inspected attached source files

files_inspected:
- packages/page.tsx — reads packages + package_versions(id,version_label,status,published_at,definition) + live item bank.
- ImpactPanel.tsx — getPinnedActiveImpact -> package_version_impact(uuid); shared-item fan-out; definition diff vs current published.
- PackagePreview.tsx — read-only inspector projection.
- PublishControls.tsx / actions.ts — createDraftVersion(clones latest, records created_by); approveAndPublish(validateDefinition: item existence/active, response-linked violations, penalty mappings, evidence rules, action-form refs).
- migrations 0001/0002/0006_package_maker_checker/0024_fix2_admin_package_impact — distinct approver + approved_by required for published/locked; definition/label edits blocked on published/locked; package_versions audit trigger.
contradiction_with_prior_pack: prior CD-008 flagged RPC/impact/publish/maker-checker as (proposed)/unknown — corrected to PROVEN.
