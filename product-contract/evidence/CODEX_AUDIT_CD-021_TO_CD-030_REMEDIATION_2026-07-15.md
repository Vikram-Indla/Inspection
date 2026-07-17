# Independent Codex remediation rollup — CD-021 through CD-030

**Date:** 2026-07-15  
**Reviewer:** Codex (fresh continuation audit)  
**Branch:** `setup/Inspection` (shared worktree preserved)  
**Purpose:** reconcile prior independent audit findings with the current runtime after parallel remediation work.

## Verified closures

| Slice | Finding class | Current disposition | Evidence |
|---|---|---|---|
| CD-021 | Invalid criteria silently dropped; missing focus contribution; select-all unsafe; missing role guard; stale wiring-map claims and unapproved P02 relocation | **CLOSED / independently re-verified** | `screens/cd-021-bulk-v1/CODEX_AUDIT_CD-021_REMEDIATION_VERIFICATION.md`; `cd-021-bulk-targeting.spec.ts` **19 product cases + 3 auth setup cases in this run**; approval gate `CD-021-P02-relocation-approval` |
| CD-022 | Registry failure, duplicate warning, planner authorization | **CLOSED / independently re-verified** | `screens/single-v2/CODEX_AUDIT_CD-022_REMEDIATION_VERIFICATION.md`; fresh 17/17 evidence recorded there |
| CD-023 | Immediate-create guards, atomic/idempotent RPC, urgency contract, raw Startup errors, stale map claims | **CLOSED for DEC-012 wiring audit** | `screens/immediate-v2/CODEX_AUDIT_CD-023_ROUND4.md`; 18/18 live focused evidence and row-by-row PASS |
| CD-026 | Raw provider errors on list/calendar/workload; missing expiry-RPC observability | **CLOSED** | `screens/cd-026-visit-management-v1/CODEX_AUDIT_CD-026.md`; focused CD-026 suite **29 product/auth cases in this run**, including expiry-failure assertion |
| CD-028/CD-029/CD-030 | Review queue discoverability, decision integrity, trace chain, accessibility, stored-scope comparison | **Delivered scope verified; overall release remains conditional/blocked** | `CODEX_AUDIT_CD-029_2026-07-15.md`; combined CD-028/CD-029/CD-030 **31 pass / 1 skip** |

## Verification run in this continuation

- `npm run typecheck` — **PASS**.
- `npm run build` — **PASS**.
- `cd-021-bulk-targeting.spec.ts` + `cd-026-visit-management.spec.ts` — **32/32 PASS** (29 product cases + 3 auth setup cases).
- Prior stable-server run: CD-028/CD-029/CD-030 — **31 PASS / 1 data-dependent skip**; CD-029 focused suite **10/10 PASS**.

## Findings that are not safely implementable without change control

These remain explicit upstream or release boundaries, not hidden wiring defects:

- CD-024 canonical configure/virtual planning route and lifecycle ownership.
- CD-025 persisted canonical plan-review lifecycle beyond the staged bulk subset.
- CD-026 map provider, cross-route continuity, Branch Manager role mapping, saved views/export, server same-Plan enforcement and overlap recheck.
- CD-027 map provider, assignment-release policy, and atomic notification semantics.
- CD-028 live application of the drafted one-open-review partial unique index and claim/reassign policy.
- CD-029 provider-backed media viewer, claim/reassign, governed linked-source behavior, atomic decision → inspection → notification semantics, and package authorization (`implementation_authorized: false`).
- CD-030 unavailable media/package/metadata diff sources and stale freshness policy.

No provider, threshold, role, SLA, geofence, notification-delivery claim, or transaction contract was invented to make these rows green. No merge, push, deployment, or `main` modification was performed.

## Follow-up hardening — 2026-07-15

The current review workspace action paths were tightened after this rollup: provider/read
errors now fail closed instead of being interpreted as missing review/version/assignment
rows, notification lookup failures are explicit after a recorded decision, and the stored
returned-scope authority is selected by an explicit `decided_at` sort. Typecheck/build pass.
This is additive error handling and determinism; it does not close the separately governed
provider, claim/reassign, migration-application, atomicity, authorization, or sponsor-runtime
boundaries listed above.

The subsequent isolated CD-029/CD-030 rerun completed **26 passed / 1 data-dependent skip**;
all CD-029 cases passed and the only skip remained the data-dependent Arabic/RTL workspace
availability case.
