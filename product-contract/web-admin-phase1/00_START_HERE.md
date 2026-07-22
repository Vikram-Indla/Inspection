# Web/Admin Phase 1 Authority

This directory is the lightweight, machine-readable authority for
`TASK-WEB-ADMIN-PHASE1-PLAN-001` under `CC-WEB-ADMIN-PHASE1-001`.

The planning baseline is pinned to repository commit
`6fc27d3f654a79d2aa6ef659b0879b35b9eb5b6d`. It covers all customer rows
`CR-001..CR-478`, 71 current Web/Admin page routes, three API routes assessed
for ownership, and 46 supplied design files representing 45 unique payloads.

Read in this order:

1. `BASELINE_SUMMARY.json`
2. `SOURCE_MANIFEST.csv`
3. `DESIGN_SOURCE_MANIFEST.csv`
4. `AUTHORITY_PACKAGE_MANIFEST.csv`
5. `REQUIREMENT_BASELINE.csv`
6. `ROUTE_INVENTORY.csv`
7. `DESIGN_ROUTE_MAP.csv`
8. `CURRENT_TO_TARGET_MIGRATION.csv`
9. `PACKAGE_MANIFEST.csv`
10. `ACCEPTANCE_CRITERIA.csv`
11. `PHASE2_IPAD_DEFERRED_REGISTER.md`
12. `OPEN_DECISIONS_AND_BLOCKERS.yaml`
13. `.planning-pack/web-admin-phase1/WEB_ADMIN_PHASE1_HANDOFF.md`

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
