# CLAUDE-M3-A1-OWNERSHIP-RECONCILIATION-005

Read-only. No branch, product code, test, PR, or Claude Design modified this session. All facts below from `gh` CLI (authenticated, confirmed working) and direct `git show`/`diff` against the exact commit SHAs — not guessed.

## 1. PR #60 — exact state, not insufficient evidence

`gh pr view 60` (real, authenticated call):

| Field | Value |
|---|---|
| Title | "feat(m3): reconcile Operations Center and Live" |
| State | **OPEN**, **DRAFT** |
| Base | `main` @ `9d8c414258a5e04244fdf9ce350e5f25f952dfc1` (the *current* main tip — not stale `setup/Inspection@3323a8ef`, correcting my own prior packet's base assumption) |
| Head | `codex/m3-operations-reconciliation` @ `c48f71cc46ce027927224109f7b070ca489f2b15` |
| Mergeable | `MERGEABLE`, `mergeStateStatus: CLEAN` |
| Changed | 23 files, +3334/−385 |
| Checks | None reported (no CI configured on this branch) |
| Reviews / review requests | None |
| Created / updated | 2026-07-24T21:01:42Z / 2026-07-24T22:31:20Z |

`c48f71cc` **is pushed** (GitHub has it as the PR head) — not merged, not superseded, not local-only.

## 2. Owner / lease evidence — real, sponsor-approved, in progress

`product-contract/execution/CURRENT_SLICE.yaml` on this branch (read via `git show`):
- `task_id: TASK-WEB-ADMIN-PHASE1-M3-OPERATIONS-001`, `status: APPROVED_IN_PROGRESS`
- `worktree: /Users/vikramindla/Developer/Inspection-codex-m3-operations`
- `approval.approved_by: "Vikram Indla / Product Owner"`, `approved_on: 2026-07-24`, `authorizes: "M3-local application files, focused tests, local/runtime evidence, commit, branch push and draft pull request. No canonical main merge..."`
- `routes: ["/operations", "/operations/live"]` — **`/field/**` is not in scope and is explicitly excluded** (`PACKAGE_MANIFEST.csv` M3 row's own `do_not_touch` list, unchanged).

This is a real, active, sponsor-approved lease — not an idle or abandoned branch.

## 3. Full 23-file change list relative to the true base (`main@9d8c4142`)

`gh pr view 60 --json files` (exact):
```
.codex-review/claude-revision-3-review.md
.codex-review/design-mapping-review.csv
.codex-review/m3-baseline-test-results.md
.codex-review/m3-implementation-readiness.md
.codex-review/pilot-delta-review.md
apps/web/e2e/web-admin-m3-operations.spec.ts
apps/web/e2e/web-admin-m3-route-safety.spec.ts
apps/web/src/app/(app)/operations/OperationsMapWorkspace.tsx
apps/web/src/app/(app)/operations/OperationsPreview.tsx
apps/web/src/app/(app)/operations/OperationsScopeFilter.tsx
apps/web/src/app/(app)/operations/live/LiveMapInner.tsx
apps/web/src/app/(app)/operations/live/LiveOps.tsx
apps/web/src/app/(app)/operations/live/live.module.css
apps/web/src/app/(app)/operations/live/loading.tsx
apps/web/src/app/(app)/operations/live/page.tsx
apps/web/src/app/(app)/operations/live/types.ts
apps/web/src/app/(app)/operations/loading.tsx
apps/web/src/app/(app)/operations/operations.module.css
apps/web/src/app/(app)/operations/page.tsx
product-contract/CURRENT_STATE.md
product-contract/evidence/TASK-WEB-ADMIN-PHASE1-M3-OPERATIONS-001.md
product-contract/execution/CURRENT_SLICE.yaml
product-contract/execution/WORK_QUEUE.yaml
```
**No file under `apps/web/src/app/(app)/field/` and no `supabase/migrations/*` file appears anywhere in this list** — confirms both that Part A2 is genuinely untouched here and that this PR performs no migration (consistent with "no migration in Part A").

## 4. A1 implementation vs. the accepted Revision 3 bug plan — checked point by point, not assumed

`.codex-review/claude-revision-3-review.md` (read via `git show`, dated 2026-07-24, "Reviewer: Codex") independently confirms my Revision 3 package: **"APPROVE FOR SPONSOR CONSENT"**, validates the five-card contract, both decision-blocked KPIs, no invented cadence/thresholds, no route/ETA default, and explicitly item 12: **"Recorded the existing mutating GET defect on `/operations`; the review did not change application code."** — i.e. the design-review pass flagged the bug (consistent with my earlier packets); this PR's *implementation* pass then fixed it.

Direct code check (`git show c48f71cc:...operations/page.tsx`):
- **No-mutation query**: confirmed 0 occurrences of `.rpc(` anywhere in the file (`grep -c` → 0). Old mutating call fully removed.
- **Timestamp placement**: `const now = Date.now(); const nowIso = ...` declared once, immediately after the route-guard block, **before** the `Promise.all` containing the override-requests query — exactly the ordering fix I specified, though implemented as one shared timestamp (cleaner than my two-timestamp proposal).
- **Filter**: `.eq("status", "pending").gt("expires_at", nowIso")` on the exact query — matches my A1 spec precisely.
- **Route guard**: DSG-CMD-020 implemented via `buildShellNavigation(routeRoleKeys)` + `operationsDestination.enabled === true` check, unauthorized frame rendered otherwise — matches `01_OPERATIONS_CENTER_CORRECTION_SPEC.md` §8.
- **Decision-time safety**: code comment verbatim — *"decide_geo_override remains the database-authoritative race guard"* — and confirmed by a **dedicated regression test** already in this PR (`web-admin-m3-route-safety.spec.ts`, read via `git show`): one test asserts the source string never contains the old RPC call, a second asserts `decide_geo_override` is still the only expiry-race authority, and a third makes **two real repeated GETs and asserts zero network requests to `expire_stale_geo_override_requests`** — this is real, executable evidence, not just a claim.

**A1 is correctly implemented and already tested against exactly the criteria this packet would have checked. No correction needed.**

## 5. Test/evidence gap — what remains, precisely

- `.codex-review/m3-baseline-test-results.md` (read via `git show`): baseline run hit the **already-known, unrelated** inspector-auth-fixture HTTP 400 defect (blocks 19 unrelated dependent test cases) — explicitly logged as "not counted as an M3 application result," consistent with prior sessions' notes on this same pre-existing fixture gap. Not a new blocker introduced by this PR.
- No CI checks configured on this branch (`gh pr checks` → none reported) — evidence currently rests on the local run logged in `.codex-review/`, not an automated gate.
- **Part A2 (field visit page) has zero test coverage anywhere** — genuinely open, not started by this or any other branch found this session.

## 6. Recommendation — one, not a menu

**Issue an A2-only dependent branch. Do not extend `codex/m3-operations-reconciliation`, and do not return A1 for correction.**

Reasoning:
- A1 is correct, tested, and owned by an active, sponsor-approved, `APPROVED_IN_PROGRESS` lease — there is nothing to correct.
- That branch's own scope contract (`CURRENT_SLICE.yaml`, `PACKAGE_MANIFEST.csv`) **excludes `/field/**` explicitly** — extending it with A2 would violate its own declared boundary, not just be unnecessary.
- A2 needs its own isolated lease exactly as `09_CLAUDE-M3-OVERRIDE-EXPIRY-IMPLEMENTATION-PREFLIGHT-004.md` already specified, narrowed to a single file (`field/[visitId]/page.tsx`) plus its test file — no `operations/page.tsx` change of any kind.

## 7. Exact non-overlapping file lease for A2

| File | Owner today | A2 lease conflict? |
|---|---|---|
| `apps/web/src/app/(app)/field/[visitId]/page.tsx` | Nobody (confirmed absent from PR #60's 23 files; confirmed absent from `codex/shared-brand-regression`'s stat diff, checked previously) | **None** |
| `apps/web/src/app/(app)/field/[visitId]/Startup.tsx` | Nobody, and no change needed per `06_...`'s trace | **None** |
| `apps/web/e2e/ipad-gps-policy.spec.ts` | Nobody currently modifying it (PR #60 adds two *new* spec files, doesn't touch this existing one) | **None** |

**Dependency SHA**: A2's branch should fork from `main@9d8c414258a5e04244fdf9ce350e5f25f952dfc1` (the same base PR #60 uses) — not from `c48f71cc` itself (no need to depend on an unmerged draft PR for an unrelated file), and not from stale `setup/Inspection@3323a8ef`.

**Integration order**: A1 (PR #60) and A2 (new, independent PR) can merge in **either order** — they touch disjoint files, and Part B (scheduled cron sweep, cadence `DECISION_REQUIRED` per `06_...`) remains blocked behind both, unrelated to sequencing between them.

## 8. Business impact

The Operations-side half of the sponsor's bug report (item 3, M3-SPONSOR-DIRECTION-20260725) is **already fixed, tested, and awaiting only PR #60's own review/merge — no new work required there.** The Field-side half (an inspector's own device silently mutating an override request's status on page load) **remains live and unfixed** — this is the actual remaining exposure the sponsor's bug report was about for any inspector-facing surface, and it has no owner or in-progress branch anywhere in the repository today.

## 9. Blockers

None new. PR #60 itself is un-reviewed/un-checked (no CI, no reviews yet) but that is Codex's own review queue, not a blocker to scoping A2 independently.

## 10. Disposition

No branch, product code, test, PR, or Claude Design modified. Ready for Codex to issue the A2-only lease per §7, independent of and non-conflicting with PR #60.
