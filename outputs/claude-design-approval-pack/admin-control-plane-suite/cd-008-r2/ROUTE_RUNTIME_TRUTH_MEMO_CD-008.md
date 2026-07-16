# ROUTE_RUNTIME_TRUTH_MEMO — CD-008 (SCR-ADM-030, /admin/packages direct)
- PROVEN: packages + package_versions(id,version_label,status,published_at,definition); package_version_impact(uuid) RPC (active counts pinned to prior published/locked versions, config/checker-limited); ImpactPanel shared-item fan-out + definition diff; createDraftVersion; approveAndPublish+validateDefinition; distinct approver + approved_by for published/locked; published immutability (no definition/label edit); package_versions audit trigger.
- RPC denied/error = unavailable, never zero.
- 'Superseded' = derived display (older published than latest published), NOT a stored status.
- BLOCKED/absent: effective dates, scheduled versions, supersede lifecycle; fingerprint sub-counts + package size/offline footprint until exact query named.
