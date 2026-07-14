# CLAUDE_CODE_HANDOFF_CD-025 (R1)

Identity: CD-025 / SCR-WEB-150 / P03 Plan Review & Publish - never CD-021/022/023/024. CD-024 is the upstream configuration/assignment dependency; CD-025 is the final governed review and publish boundary and absorbs no configuration editing.

Design-only package. Do NOT implement until: (1) recorded sponsor design approval, (2) independent wiring audit, (3) governance resolution of route + lifecycle + CD-024->CD-025 handoff ownership. implementation_authorized: false.

## Read first
- "CD-025 Plan Review and Publish.dc.html" (5route + 5a-5n + S1-S28) + 9 PNGs in outputs/cd-025/
- IMPLEMENTATION_MANIFEST_CD-025.yaml · WIRING_MAP_CD-025.csv · COMPONENT_MAP_CD-025.csv · STATE_MATRIX_CD-025.csv · ACCEPTANCE_CHECKLIST_CD-025.md

## ROUTE_LIFECYCLE_AND_OWNERSHIP_DECISION (restated)
Contract: SCR-WEB-150 @ /planning/:id/review - unimplemented. /planning/plans/:id is post-publish read-only (protected). Bulk publishes directly from /planning/bulk/review over session-staged state; the plan/visits do not exist before the RPC. Single publishes from its wizard with a resumable, sequential write chain. No persisted Validated plan can supply the contract route today; the reconciliation row pointing CD-025 at /planning/plans/:id is stale. Position: route-neutral staged workspace; governance picks persisted-lifecycle vs ephemeral-staged model. Route/lifecycle/handoff legs HANDOFF_BLOCKED.

## Design thesis (selected: blocker-first pre-flight)
The page answers five questions in one scan: what plan, what's included, what's verified/stale/unknown/blocked, what publication creates/locks/queues, and where to correct without losing work. The Publish Consequence Ledger (the ONE new pattern) ties each consequence to counts derived from retained scope, its validation state and a correction link. No modal, no checkbox/typed-phrase theatre, no countdown, no optimistic Published.

## Hard truths encoded (verified 2026-07-14)
1. Bulk RPC (migration 0026, SECURITY INVOKER) is genuinely all-or-nothing for its writes; UI says so - for bulk only.
2. All bulk validation runs BEFORE the RPC and can go stale; the RPC rechecks nothing (duplicates, package status/effective date, visit type, overlaps, pool). Never claim concurrency safety; stale/concurrent states S17/S18.
3. Rotation ignores schedules - warning on every rotation row and in readiness; never "conflict-free".
4. Single publish is sequential (plan/visit/assignment/status/notification) with resumable retry (resume_visit_plan_id verified); never labelled atomic; partial-step failure is never success (S25); "nothing was created" is untrue for single and never said.
5. Notification rows are queued only - never notified/delivered/received/acknowledged (FND-004).
6. Reads do not return structured errors today - fail-closed per-source outcomes required (S13-S16); a failed check never renders as zero results or readiness.
7. No planning approver configuration exists - S19 stays an annotation; RBAC-007 direct publish is the designed state; package maker-checker is NOT copied into planning.
8. Scope integrity: removed factories named with codes + verified reason + recalculated counts; restore path not invented (blocked).
9. plans/[id] stays read-only; success redirects (bulk -> /visits, single -> /visits/:id) are the truthful destinations; completion panel is a moment, not a persisted page.
10. Publication audit copy limited to "recorded in the system's history" - dedicated business audit event unproven.

## Locked baselines
Frozen shell V1; RLS/RBAC; append-only audit; atomic bulk RPC; single resumable retry until separately replaced; exact package code+version; duplicate protection; manual/auto distinction; physical-only bulk mode; neutral errors; staged choices preserved after failure; dark/light; Arabic-first document RTL; magenta-violet tokens.

## A11y/RTL contract
Semantic headings/lists/dl/table - no ARIA grid. Skip link -> main -> h1 -> readiness -> scope -> objects -> ledger -> action. role=status polite (validating/publishing/scope counts); role=alert assertive once (blockers/stale/failure). Focus: summary receives focus on failed submit; links land on rows; return-from-edit lands on corrected section (S28); completion heading receives focus on success. Hidden context on repeated Change links. Disabled publish explains itself visibly + aria-describedby. Reduced motion: instant updates, continuity preserved. Glyph+text always. >=44-48px targets. Narrow order fixed (5n).

READY_FOR_DESIGN_REVIEW_R1
