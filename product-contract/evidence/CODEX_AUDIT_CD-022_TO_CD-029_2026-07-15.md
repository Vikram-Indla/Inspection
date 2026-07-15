# Independent Codex wiring audit — CD-022 through CD-029

**Audit date:** 2026-07-15  
**Reviewer:** Codex (independent of the Claude Code implementation/review records)  
**Branch / commit:** `setup/Inspection` / `2f24a7bbbb0bbb6554afee0ee992688cf46ad71c5d`  
**Scope:** runtime wiring, route ownership, data/RLS paths, canonical transitions, audit/notification behavior, negative states, and regression evidence for CD-022–CD-029.  
**Authority:** product-contract source of truth, current route/code, current migrations, and the protected focused Playwright suite. This record does not authorize implementation, merge, push, or contract changes.

## Evidence executed

- `npm run typecheck` — PASS.
- `npm run build` — PASS (warnings only for multiple lockfiles).
- Focused Playwright suite — **67 passed** (64 CD cases + 3 auth setup cases):
  - CD-022: 10 cases
  - CD-023: 15 cases
  - CD-025: 8 cases
  - CD-026: 9 cases
  - CD-027: 13 cases
  - CD-028: 9 cases
- The focused CD-029 runtime/source suite now exists; its remediation and remaining handoff boundaries are recorded in `CODEX_AUDIT_CD-029_2026-07-15.md`.
- Worktree was already dirty before this audit. Existing user/parallel-agent changes were preserved.

## Verdicts

| Screen | Contract route / surface | Independent verdict | What is wired | Blocking or conditional facts |
|---|---|---|---|---|
| CD-022 | `SCR-WEB-120` / `/planning/single` | **PASS** for delivered scope | Identity exact/similar-name search, duplicate guard, package/location/inspector gates, RLS checks, resumable publish, canonical `publish_single_visit` RPC, audit/notification paths, and negative/RTL/narrow states are exercised. | The design manifest still contains stale pending-certification metadata; that does not override the live source/test result. Provider delivery is not claimed beyond queue insertion. |
| CD-023 | `SCR-WEB-130` / `/planning/immediate` | **PASS** for delivered scope | Immediate-path identity, urgency, mandatory location/manual identity, duplicate and overlap guards, review confirmation, idempotency/concurrency handling, audit, neutral errors, and responsive/RTL states are exercised. | Acceptance/sponsor closure remains a governance item; this audit only verifies current wiring. External provider delivery remains queue semantics. |
| CD-024 | `SCR-WEB-140` / `/planning/:id/configure` | **BLOCKED** | No canonical configure route is mounted. The current bulk review surface exposes staged configuration/readiness only. | The required configure route, virtual/temporary mode, attempted-conflict audit, provider delivery and stale-token handling remain handoff-blocked. Do not train this as an end-to-end delivered scenario. |
| CD-025 | `SCR-WEB-150` / `/planning/:id/review` | **CONDITIONAL PASS** for staged bulk-review subset | `/planning/bulk/review` renders a blocker-first staged review, consequence ledger, assignment truth, empty-selection and responsive/RTL states; focused tests pass. | The contract route is not mounted; selection is session-scoped, no persisted pre-review plan lifecycle is proven, and the canonical single-plan review/publish lifecycle is not closed. Treat as a staged bulk-review preview, not a production-complete publish scenario. |
| CD-026 | `SCR-WEB-200` / `/visits`, calendar, workload | **CONDITIONAL PASS** for Track 1 | RLS-scoped visit list, expiry handling, list/calendar/workload views, bulk action server actions with per-item outcomes, neutral errors, and explicit same-Plan eligibility UI are wired; focused tests pass. | Map, cross-route continuity, saved views/export, Branch Manager role mapping, server same-Plan enforcement, and post-move overlap recheck are explicitly unavailable or handoff-blocked. |
| CD-027 | `SCR-WEB-210` / `/visits/:id` | **CONDITIONAL PASS** for implemented tracks | Read-only detail, dual state ribbon, signed attachment URLs, upload cleanup, neutral error map, guarded state actions, reassignment notification, audit cap, and negative paths are wired; focused tests pass. | Map, assignment release path, and atomic multi-write transition remain blocked. The prior sponsor waiver is not evidence of an independent audit; this record supplies that independent review. |
| CD-028 | `SCR-WEB-300` / `/reviews` | **CONDITIONAL PASS** for queue scope | Scan-first queue, explicit reviewer-intentful `startReview`, RLS-joined readiness facts, degraded/unreadable/unassigned states, and no decision controls in the queue are wired; focused tests pass. | Claim/reassign is unavailable. Decision atomicity belongs to CD-029 and is not closed here. Queue acceptance must remain conditional until those dependencies are resolved or formally changed. |
| CD-029 | `SCR-WEB-310` / `/reviews/:id` | **BLOCKED overall; P1 remediation verified** | The current decision workspace reads immutable submission/package/evidence/violation/action/review/audit data, binds start-review versions, allow-lists decisions/sections, renders the source/version-labelled Finding Trace Chain, and has accessible error recovery. The focused CD-029 suite is 10/10. | `IMPLEMENTATION_MANIFEST_CD-029.yaml` explicitly sets `implementation_authorized: false`. Media viewer, claim/reassign, linked-source failure contract, and atomic decision → inspection transition → notification remain explicit handoff boundaries. |

## Wiring observations by dependency chain

1. **Planning to execution:** CD-022 and CD-023 have real publish/create paths. CD-024 is not the configure step for those paths, and CD-025’s current bulk surface is a staged review handoff rather than the contract `/planning/:id/review` lifecycle.
2. **Execution to operations:** CD-026 and CD-027 share the visit data and audit model, but the server-side same-Plan and post-move overlap guarantees are not wired. The UI correctly exposes those as unavailable instead of implying safety.
3. **Operations to review:** CD-028’s explicit start action removes the former navigation mutation. CD-029 still owns the decision side effects, and those writes are not transactional; this is the main unresolved downstream dependency.
4. **Notifications:** current code proves queue insertion/error handling only. It does not prove external provider delivery or receipt, consistent with the contract’s provider handoff status.

## Training-ready first cut

Safe to train as end-to-end delivered scenarios now:

- **Single registered-factory visit planning:** identity confidence → duplicate/eligibility gates → publish with resumable retry (CD-022).
- **Immediate/urgent visit creation:** urgency and mandatory location/manual identity → review confirmation → guarded creation (CD-023).

Train with explicit “available subset / not yet available” labels:

- Bulk plan staged review/readiness (CD-025).
- Visit operations list/calendar/workload and guarded detail actions (CD-026/CD-027).
- Scan-first Level 2 review queue and explicit start-review action (CD-028).

Do not present as delivered end-to-end:

- Configure/virtual planning (CD-024).
- Canonical persisted plan review/publish lifecycle (CD-025 beyond the staged subset).
- Level 2 decision workspace as a production-safe atomic workflow (CD-029) remains blocked pending policy/provider authorization.

## Required next actions before a full green baseline

- Obtain and record the approved route/lifecycle decision for CD-024/CD-025.
- Close or formally change-control CD-026 map, continuity, role, export, same-Plan and overlap legs.
- Close or change-control CD-027 map, assignment-release and atomic transition legs.
- Obtain authorization for CD-029 media, claim/reassign, linked-source failure handling, and transactional decision side effects; do not invent providers or policy.
- Preserve the 10/10 CD-029 suite and rerun the cross-slice golden journey after the upstream CD-022 publish timeout is resolved.
