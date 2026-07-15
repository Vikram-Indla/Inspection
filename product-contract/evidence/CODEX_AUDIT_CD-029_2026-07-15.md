# Independent Codex wiring audit — CD-029 / SCR-WEB-310

**Audit date:** 2026-07-15  
**Reviewer:** Codex, independent of the Claude Code implementation/review records  
**Branch / commit:** `setup/Inspection` / `2f24a7bbbb0bbb6554af0ee992688cf46ad71c5d`  
**Current worktree:** dirty; CD-029 source itself is present, while CD-028 queue-discoverability changes and two migrations are uncommitted parallel work.  
**Gate result:** **BLOCKED (handoff boundaries remain; four audit P1 defects remediated)**

This audit checks the 18 rows in `outputs/cd-029/WIRING_MAP_CD-029.csv` against the current source, migrations and runtime evidence. It does not authorize implementation or sponsor approval. The package itself explicitly says `implementation_authorized: false`; that remains respected.

## Evidence run

- `npm run typecheck` — PASS.
- `npm run build` — PASS; `/reviews/[id]` emitted successfully.
- `e2e/cd-028-review-queue.spec.ts` + `e2e/cd-029-review-workspace.spec.ts` + `e2e/cd-030-version-comparison.spec.ts` — **31 PASS, 1 SKIPPED** on an isolated production server (port 3002). CD-028 was 13/13, CD-029 was 10/10, and CD-030 was 14/14 executed with one data-dependent RTL skip.
- `e2e/golden-journey.spec.ts` — **4 PASS, 1 FAIL, 4 NOT RUN** on this exact state. The failure was upstream CD-022 publish timeout; P3/P4/P5 review steps did not run. This is not CD-029 approval evidence.
- `apps/web/e2e/cd-029-review-workspace.spec.ts` now covers server-side integrity source checks plus read-only trace/accessibility runtime checks. It does not mutate a live review.

## 18-leg audit

| Leg | Current finding | Verdict |
|---:|---|---|
| 1 | `/reviews/:id` reads through RLS and renders the workspace. The page now returns a distinct reviewer/ops authorization block before data reads. | PASS for authorized/unauthorized surface |
| 2 | Latest submission is selected by descending `version_number`; content is read-only. | PASS |
| 3 | Render no longer creates a review. `startReview` now verifies the version belongs to the inspection, is the latest submitted version, scopes the open-review check to both IDs, and requires the submitted-state transition to affect a row. | PASS for action guards; DB migration/runtime application remains deployment work |
| 4 | `FindingTraceChain` now links question → response → evidence → clause → violation → corrective action → decision using source/version labels; unavailable links are explicit and no graph/canvas is used. | PASS for delivered read path |
| 5 | Evidence metadata and hashes render; no provider-backed viewer is wired. | BLOCKED |
| 6 | Violation code/title/mapping version render, but no verified clause/source link chain is wired. | CONDITIONAL |
| 7 | Corrective actions render as a separate list; no runtime finding-to-action linkage is proven. | CONDITIONAL |
| 8 | Prior decision comments render after decision; open-review comment state is only represented by the decision form. | CONDITIONAL |
| 9 | Provider/media degradation is represented as unavailable in design truth, but no runtime media/degraded fixture or CD-029 suite proves it. | BLOCKED |
| 10 | Factory verification uses the shared read helper and preserves source/observed/status. Provider errors are logged server-side and mapped to neutral user-facing degraded copy. | PASS for error handling |
| 11 | Version comparison is route-neutral inside `/reviews/:id`, uses stored returned scope, and has passing CD-030 source/live checks. | PASS for comparison subset |
| 12 | Audit timeline reads append-only `audit_events`, newest-first, limited to 25. Database immutability trigger exists. | PASS for read path |
| 13 | Return requires reason and at least one section; the server now validates section keys against the loaded package definition. Invalid-state errors use `role=alert` and focus recovery. | PASS for delivered guards/accessibility |
| 14 | `decide` now allow-lists `approve`, `return`, and `reject`; unknown decisions are rejected before any write. | PASS for delivered guard |
| 15 | Review update → inspection transition → notification are sequential writes. Partial commit is possible and explicitly remains `HANDOFF_BLOCKED_ATOMIC`. | BLOCKED |
| 16 | Decided reviews are DB-locked by `trg_guard_review`; the action now re-reads the open review and requires affected-row checks for both review and inspection transitions. | PASS for delivered guards; notification atomicity remains blocked |
| 17 | No claim/reassign action or ownership path exists. | BLOCKED |
| 18 | Shell tokens and comparison keyboard structure exist. Dedicated Arabic/RTL, light/dark and 412px visible-workspace reflow coverage now passes; decision-panel invalid-state semantics have alert/focus recovery. | PASS for delivered accessibility/responsive subset; governed handoff boundaries remain separate |

## Remediation closure

1. **Cross-inspection/version binding:** fixed in `apps/web/src/app/reviews/[id]/actions.ts`; the action verifies ownership, latest version, open-review scope, and affected-row transition.
2. **Decision enum and exact-section validation:** fixed in `actions.ts`; decisions and package section keys are allow-listed before writes, with stale/open-row guards.
3. **Decision error accessibility:** fixed in `DecisionPanel.tsx`; errors are focusable `role=alert` content and the reason label is programmatically associated.
4. **Trace-chain implementation:** fixed in `FindingTraceChain.tsx` and `page.tsx`; linked runtime rows are source/version-labelled and missing provider links remain explicitly unavailable.

The four P1 defects are therefore closed by source checks, typecheck/build, and the 10/10 CD-029 focused suite. The CD-030 authority test also required a load-state wait; that test harness correction is included in `apps/web/e2e/cd-030-version-comparison.spec.ts`.

## Dependency and authorization conclusion

CD-029 remains **BLOCKED overall**, but no longer because of the four P1 defects above. The mandatory delivered read/decision/trace contracts are wired and regression-tested. Overall production release is still blocked by the package’s `implementation_authorized: false` flag and by explicit handoff boundaries that cannot be invented safely: provider-backed media viewing, claim/reassign policy, atomic decision→inspection→notification semantics, and governed linked-source/provider behavior. Those are dependency/policy decisions, not silently replaceable mocks.

Allowed next action: obtain authorization and policy/provider decisions for the remaining handoff boundaries, apply the unique-open-review migration in the deployment environment, and re-run the golden journey after the upstream CD-022 timeout is resolved. No merge/push was performed.

## Responsive follow-up verification — same audit day

The added CD-029 leg-18 runtime check initially exposed a 48px document overflow at 412px in Arabic. The source was the intentionally closed RTL navigation drawer translated off-canvas, while the visible review workspace itself remained within the viewport. The shell now contains root horizontal overflow, the review workspace grid has an explicit narrow-screen one-column layout, and the runtime assertion measures visible workspace content rather than the closed drawer. Verification after the fix: `cd-029-review-workspace.spec.ts --grep "leg 18"` **4/4 PASS** (three auth setup cases plus the responsive leg); `cd-030-version-comparison.spec.ts --grep "leg 12/13|evidence/package/metadata|Arabic/RTL"` **5 PASS / 1 data-dependent skip**; `npm run typecheck` PASS; `npm run build` PASS. This closes the responsive evidence gap without changing the blocked provider, authorization, claim/reassign, linked-source, or atomicity boundaries.

## Follow-up hardening — 2026-07-15

The review actions now fail closed on every pre-write read used by `startReview()` and
`decide()`: inspection/version/latest/open-review/package reads log diagnostics server-side
and return neutral copy instead of treating a provider failure as a missing row. The
post-decision inspection and assignment reads also surface an explicit notification-status
failure rather than silently skipping the queue attempt. The workspace authorization path
likewise distinguishes auth/role-read degradation from a genuinely unauthorized role.
The Scope Rail now sorts stored decided returns by `decided_at` before selecting its latest
authority, so nested-relation order cannot make an older returned scope authoritative.
Typecheck and production build remain PASS; the new source-contract assertions are recorded
in `cd-029-review-workspace.spec.ts` and `cd-030-version-comparison.spec.ts`. A fresh isolated
rerun outside the sandbox restriction completed **26 passed / 1 data-dependent skip** across
the CD-029 and CD-030 suites (all CD-029 tests passed; the only skip was the existing
data-dependent Arabic/RTL workspace case). The review workspace, loading-boundary wait,
scope-order contract, focus navigation, and read-failure assertions all passed.
After the final violation-to-action precedence hardening, the targeted source-contract
regression reran **15/15 PASS** (three auth setup cases plus the CD-029 integrity checks and
CD-030 source-truth checks).

## Wiring-map integrity correction — 2026-07-15

The delivered `outputs/cd-029/WIRING_MAP_CD-029.csv` had three stale/misaligned
rows: leg 3 still named page-load review creation after that mutation was removed,
leg 5 contained an unquoted comma that shifted its CSV columns, and legs 13/14 had
an extra field that shifted their status columns. Those rows are now corrected to
the current explicit-start/read-only behavior, metadata-only media boundary, and
server validation/audit fields. The map now parses as **18 rows × 15 columns**;
the blocked media, atomicity, and claim/reassign statuses remain intentionally
blocked rather than being upgraded.

## Downstream golden-journey closure — 2026-07-15

The formerly open downstream evidence item was rerun on a fresh production server
with one worker: `e2e/golden-journey.spec.ts` completed **9/9 PASS**. The run
covered the negative publish guard, single-visit publish, inspector startup/check-in/
submit, reviewer exact-scope return, inspector correction/resubmit, and reviewer
approve/immutability path. The prior CD-022 publish-timeout failure did not
reproduce; CD029-CODEX-EV-003 is therefore captured. This does not change the
separate CD-029 handoff boundaries for provider media, claim/reassign policy, or
atomic decision side effects.
