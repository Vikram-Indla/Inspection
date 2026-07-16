# TASK-G11-REMEDIATION-001 — verification closure

Date: 2026-07-16
Branch: `feat/admin-control-plane`
Gate: G11 production-readiness remediation
Approval: `HUMAN_APPROVALS.yaml#G11-remediation-CD-005-011-CD-025-CD-028-CD-030-dashboard`

## Verdict

**ENGINEERING EXIT PASS.** The approved local remediation slice has zero known
P0/P1 application or test failures in the current automated inventory. The
current inventory is **276/276 PASS**: three authenticated-persona setup tests
plus 273 application tests. There are **0 failures, 0 skips and 0 exclusions**.

This is not a production-release approval. It does not close live-DDL,
provider, policy, sponsor-runtime-acceptance, branch-promotion or G12 release
boundaries recorded outside this slice.

## Authorized scope

- CD-005 through CD-011 Admin Control Plane reconciliation.
- CD-025 exact review/publish verification.
- CD-028 explicit Start Review continuity.
- CD-030 version-comparison navigation and accessibility.
- TASK-WEB-DASHBOARD-002 bounded source-backed dashboard reads.
- Cross-cutting authenticated read hardening required to make the complete
  regression reliable without weakening RLS.
- Exact tests, evidence and contract/session records.

No production deployment, live DDL, `main` modification/merge or destructive
cleanup was performed by this task.

## Baseline and final result

| Checkpoint | Passed | Failed | Skipped | Not run | Notes |
|---|---:|---:|---:|---:|---|
| Sponsor-approved remediation baseline | 252 | 20 | 1 | 2 | 275-test historical inventory |
| Current setup inventory | 3 | 0 | 0 | 0 | Planner, Inspector and Reviewer sessions refreshed through the real login flow |
| Current application inventory | 273 | 0 | 0 | 0 | 33 files, executed in 12 fresh-browser shards |
| Current total | **276** | **0** | **0** | **0** | `playwright test --list` confirms 276 tests in 34 files |

The current total differs from the historical 275-test baseline because the
test inventory changed during remediation. Closure is based on the enumerated
current inventory, not the stale historical number.

## Defects found and closed

1. **CD-005..011 test/runtime truth drift.** Fifteen Admin failures assumed
   stale blocked or empty states. The checks now match the approved R2 designs
   and current maker-checker, immutable-published, audit-trigger and RLS truth.
   Unavailable audit/validation/provider legs remain explicitly blocked; no
   data, policy or lifecycle was invented.
2. **CD-025 ambiguous accessible selector.** The Assignment Evidence assertion
   now targets the exact governed heading instead of matching duplicate text.
3. **CD-028 Start Review interruption.** Independent reads were parallelized,
   start uses a single nested aggregate plus latest/version/open-review guards,
   and the action redirects through `/reviews/:id/started` before returning to
   the workspace. This avoids the Next.js same-path redirect/refresh abort while
   preserving the canonical submitted-to-under-review transition.
4. **CD-030 changed-row navigation.** Comparison rows expose an explicit
   changed-state marker and the scope rail focuses the rendered changed answer.
5. **CD-030 false Arabic skip.** The workspace helper previously searched for
   an English link label after switching to Arabic and falsely reported that no
   review existed. It now selects by the governed `/reviews/:id` route contract;
   the Arabic/RTL runtime check passes and the suite has no skip.
6. **Dashboard O(total-history) read.** The audit timeline now deduplicates
   dashboard-relevant object IDs, reads them in bounded chunks, applies the date
   boundary at the source and keeps only the newest 12 events globally.
7. **Authenticated-read refresh pressure.** Runtime server reads and middleware
   use cryptographically verified JWT claims instead of repeatedly calling the
   remote user endpoint. The implementation preserves caller identity and RLS;
   no service credential or widened role was introduced. A source scan finds no
   remaining `auth.getUser()` call in `apps/web/src` or `middleware.ts`.
8. **Two brittle live-suite waits.** CD-005 now waits for either truthful
   terminal register state before branching. CD-022 uses a web-first URL
   assertion with a realistic live-backed timeout instead of waiting for an
   unrelated full page-load event.

## Verification evidence

### Focused and journey checks

- TypeScript typecheck: **PASS**.
- Production build: **PASS**; all application routes compiled, including
  `/reviews/[id]/started`.
- Golden planner/inspector/reviewer journey: **6/6 PASS** in its final focused
  run and **6/6 PASS** again inside regression shard 11.
- Consolidated focused remediation suite: 107 immediate passes, one honest
  data-dependent skip at that checkpoint and three Chromium context crashes;
  all three interrupted cases passed in fresh contexts. The later full
  inventory removed the remaining skip and is authoritative.
- Admin, review, dashboard, auth, offline, virtual, RTL/theme/responsive,
  authorization, immutable-version, idempotency and concurrency negatives all
  passed in the final shards.

### Complete application regression

Each shard started a fresh local production server and Chromium context to
avoid the previously observed long-context browser crash mode.

| Shard | Result |
|---:|---:|
| 1/12 | 31 passed |
| 2/12 | 28 passed |
| 3/12 | 16 passed |
| 4/12 | 18 passed |
| 5/12 | 24 passed |
| 6/12 | 28 passed |
| 7/12 | 18 passed |
| 8/12 | 24 passed |
| 9/12 | 25 passed |
| 10/12 | 18 passed |
| 11/12 | 21 passed |
| 12/12 | 22 passed |
| **Application total** | **273 passed, 0 failed, 0 skipped** |

Shard 1 was rerun after refreshing the three persona fixtures and passed
31/31 without the expired-session/429 warning noise. Shards 2, 6 and 9 were
rerun in full after their respective test defects were corrected. Therefore
every reported shard result above represents the final corrected state.

### Static and record checks

- `npm run typecheck`: **PASS**.
- `npm run build`: **PASS**.
- `git diff --check`: **PASS** before record closure; rerun after record edits.
- Runtime `auth.getUser()` source scan: **0 matches**.
- Audit reconciliation: **PASS** — 493 AC rows = 14 `verified_live`, 460
  `implemented`, 19 `partial`; eight governed wiring maps rectangular.
- The AC ledger was not upgraded by this slice because these fixes do not close
  the 19 independent provider/schema/policy/configuration boundaries.

## Blocked and unchanged boundaries

- No live DDL was applied. In particular, the CD-028 one-open-review partial
  unique index and the field-arrival evidence repair retain their separately
  recorded live-application/verification status.
- Admin audit-timeline reads, dependency validation and other unproven R2 legs
  remain explicit `HANDOFF_BLOCKED` states.
- CD-024 route/ownership, CD-031 authority/privacy/preflight, provider adapters,
  asset-rights/geographic confirmation and sponsor runtime acceptance remain
  outside this engineering closure.
- G11/G12 release certification, production deployment and clean baseline
  promotion remain separate tasks.

## Concurrency and Git attribution

The task began on `feat/admin-control-plane` at `c6187cb41a7b` with 135 dirty
status entries and concurrent Claude/user activity. During verification the
branch advanced externally to user-authored/pushed commit `330398781042`
(`commit every thing`), which was preserved. Codex did not create or push that
commit. No Codex commit, merge, push, deployment or `main` modification was
performed.

The complete Playwright run refreshed tracked runtime evidence screenshots as a
test side effect. They remain visible in the dirty worktree and must be
attributed deliberately before any later staging operation; no pre-existing or
concurrent change was reset or discarded.
