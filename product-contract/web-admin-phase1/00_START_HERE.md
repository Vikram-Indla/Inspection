# Web/Admin Phase 1 Authority

This directory is the lightweight, machine-readable authority for
`TASK-WEB-ADMIN-PHASE1-PLAN-001` under `CC-WEB-ADMIN-PHASE1-001`.

The planning baseline is pinned to repository commit
`6fc27d3f654a79d2aa6ef659b0879b35b9eb5b6d`. It covers all customer rows
`CR-001..CR-478`, 71 current Web/Admin page routes, three API routes assessed
for ownership, and 46 supplied design files representing 45 unique payloads.

Read in this order:

1. `WEB_ADMIN_SHELL_AUTHORITY.md`
2. `WEB_ADMIN_SHELL_SOURCE_MANIFEST.csv`
3. `WEB_ADMIN_SHELL_ROUTE_MANIFEST.json`
4. `WEB_ADMIN_SHELL_PRESERVATION_MATRIX.csv`
5. `WEB_ADMIN_CURRENT_TO_TARGET_ROUTE_MAP.csv`
6. `WEB_ADMIN_DESIGN_CONFLICT_DECISIONS.md`
7. `WEB_ADMIN_SHELL_ACCEPTANCE.csv`
8. `BASELINE_SUMMARY.json`
9. `SOURCE_MANIFEST.csv`
10. `DESIGN_SOURCE_MANIFEST.csv`
11. `AUTHORITY_PACKAGE_MANIFEST.csv`
12. `REQUIREMENT_BASELINE.csv`
13. `ROUTE_INVENTORY.csv`
14. `DESIGN_ROUTE_MAP.csv`
15. `CURRENT_TO_TARGET_MIGRATION.csv`
16. `PACKAGE_MANIFEST.csv`
17. `ACCEPTANCE_CRITERIA.csv`
18. `PHASE2_IPAD_DEFERRED_REGISTER.md`
19. `OPEN_DECISIONS_AND_BLOCKERS.yaml`
20. `.planning-pack/web-admin-phase1/WEB_ADMIN_PHASE1_HANDOFF.md`

Only these dispositions are valid: `PHASE1_WEB`, `PHASE1_ADMIN`,
`PHASE1_SHARED_BACKEND`, `PHASE2_IPAD_DEFERRED`,
`EXTERNAL_CONTRACT_BLOCKED`, and `OPEN_BUSINESS_DECISION`.

An iPad-primary source row remains `PHASE2_IPAD_DEFERRED` even when it implies
a shared backend obligation. Any such obligation must be created later as its
own linked Phase 1 contract record; it must not replace or duplicate the
customer row.

This authority prepares implementation but does not authorize it. F0 may begin
only after Product Owner approval of the change control and planning baseline.
F0 must then be certified before M1–M11 begin. Remote DDL, deployment, shared
data mutation, provider enablement, merge to `main`, and push each require
separate explicit approval.

Direct replacement is the default only where the migration row establishes
behavioral and rollback confidence. Any uncertainty in behavior, permissions,
policy, providers, backend parity, test coverage, or rollback requires a
server-evaluated flag or guarded preview. Current implementations are retained
until stabilization and Product Owner removal approval.

External workbooks, HTML design exports, ZIPs, Office files, screenshots,
videos, traces, and rendered pages are not stored here. Their hashes and
approved external-storage pointers are in `SOURCE_MANIFEST.csv`.

## 2026-07-23 shell-authority amendment

The Product Owner approved `Saqeel Web(3).html` as binding Phase 1 Web/Admin
shell and dashboard design authority. Its raw rendered source remains external;
`WEB_ADMIN_SHELL_SOURCE_MANIFEST.csv` records the supplied path, size, checksum,
scope, and acceptance date. Application implementation is paused until the
canonical amendment receives explicit Product Owner approval. The 478-row
requirement baseline and its dispositions are unchanged.
