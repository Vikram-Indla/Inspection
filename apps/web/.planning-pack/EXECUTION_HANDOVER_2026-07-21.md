# SAQEEL Execution Module — Session Handover
**Date:** 2026-07-21 · **Task:** TASK-EXECUTION-MODULE-001 · **Agent:** Kimi
**Authority:** SAQEEL-EXE-CANONICAL-PLAN v1.0 (2026-07-21) + Kimi implementation pack (`apps/web/.planning-pack/kimi-pack/SAQEEL_EXECUTION_KIMI_PACK_2026-07-21/`)

---

## 1. Ground rules in effect (read first)

- **`main` is the sole source route** (sponsor direction, commit `4b5ca042` "direct-main source policy"). No more worktrees/long-lived branches. Commit directly on `main`. Do NOT push without sponsor awareness; never apply migrations to the remote DB without approval; never deploy.
- Routes live under `apps/web/src/app/(app)/...` (route group from the consolidation). Exception: `src/app/admin/execution/` legitimately sits outside `(app)`.
- **Additive reconciliation only.** Preserve: `/field`, `/field/[visitId]` Startup flow, `mim-field-v1` outbox, `mim-field-f360-v1` cache, `/reviews`, `/virtual/[id]`, `/visits/[id]`, Operations Center, Factory 360 shared loader, package snapshot engine, RLS, append-only audit, immutable submission versions, plain-language terminology guard. Preservation ledger: `product-contract/execution/EXECUTION_PRESERVATION_LEDGER.csv` (33 rows).
- Never invent policy values/provider contracts/thresholds/legal values. Unset = fail-closed or honestly "platform default".
- Decisions are recorded in `product-contract/execution/EXECUTION_DECISION_LOG.md` (D-001…D-016 so far — continue numbering).
- Governance registration: `product-contract/execution/CURRENT_SLICE.TASK-EXECUTION-MODULE-001.yaml` + WORK_QUEUE entry.

## 2. Repo state right now

- `main` @ `e6134309` (Phase 4B) — local == origin (0 unpushed commits at handover time).
- **Uncommitted working-tree changes exist — this is PARTIAL PHASE 5 work** (see §4). Files: `(app)/field/inspection/[id]/{runtime.ts,Workspace.tsx,page.tsx}`, `lib/offline.ts`, untracked `supabase/migrations/20260721150000_execution_item_lifecycle.sql`. Also another session's files: `(app)/planning/bulk/*`, `(app)/layout.tsx`, deleted `apps/web/middleware.ts` (moved), `.planning-pack/PLANNING_IMPLEMENTATION_NOTES.md`.
- Concurrent agent sessions ARE ACTIVE in this same checkout (planning module line). Stage/commit only your own files. Check `git status` before and after every work block.

## 3. Completed and verified (all on `main`)

| Phase | Commit(s) | Content | Verification at commit |
|---|---|---|---|
| 0 Governance/discovery | `2a47ed9`+ (merged) | Slice, work queue, preservation ledger; full repo map | — |
| 1 Shared contracts | `d6a0568` | Migration `20260721090000`: `inspections.lifecycle_status` (+sync trigger), `operational_state`+=`under_review`, `visits.execution_date`, `capabilities`/`role_capabilities` + `has_capability` RPC, `engine_settings.execution` (daily cap 10, mode gates, one-penalty), `inspector_daily_capacity` RPC. Libs `lib/execution/{state-machine,capabilities,daily-cap}` | typecheck 0, build PASS, static 157/4/0 |
| 2A Admin execution plane | `6655658` | `/admin/execution` (6 capability-gated governed sections: capacity/journey, mode eligibility, cancellation reasons, geofence rules, evidence policy, offline policy) + audit | static 165/4/0 |
| 2B Access grants | `94c3341` | Migration `20260721110000`: `user_capability_grants`, `admin_grant/revoke_role`, `admin_grant/revoke_capability` RPCs (self-escalation + sole-security_admin guards); `/admin/access` panel replacing both NotYetBoundary seams | static 173/4/0 |
| 3A Pre-execution backend | `04b55593` | Migration `20260721120000`: `visit_preparations`, `visit_package_snapshots` (immutable+checksum), `save_visit_preparation`/`confirm_visit_ready`/`reopen_visit_preparation`/`inspector_window_capacity` RPCs, `EXE-CAPACITY-WINDOW-FULL` hook in publish_single_visit/publish_bulk_plan; `lib/execution/readiness.ts` | static 182/4/0 |
| 3B Pre-execution UI | `c8c52acd` | `PreExecution.tsx` 6-section panel (date+capacity, mode confirm, package resolution, form config, notify_factory, save/confirm/reopen); readiness gate in Startup (visible reason, never hidden); `set_operational_state` EXE-READY-REQUIRED guard (migration `20260721130000`); planning capacity blocker mapping; workload page daily-cap display | static 190/4/0 |
| 4A Journey backend | `c12e5f5e` | Migration `20260721140000`: `start_journey` (atomic/idempotent/window+overdue policy/package integrity/device capture), `cancellation_requests` + `request_active_cancellation`/`decide_active_cancellation` (ops.approve_active_cancel, terminal, preserves data, frees schedule), `visit_location_corrections` (append-only) + `correct_visit_location`, `confirm_arrival` (accuracy+radius, outside=non-mutating notice); `lib/execution/journey.ts` | static 197/4/10* |
| 4B Journey UI | `e6134309` | Startup/Workspace/Operations wiring with byte-preserved LEGACY FALLBACK (probe-gated); Operations `CancellationQueue`; original-vs-corrected location display | static 207/4/10* |

\* The 10 failures are PRE-EXISTING upstream consolidation debt in specs owned by other lines: compliance-approval-queue, compliance-library, design-foundation-contract, factory360-admin-control-plane, performance-pass4 ×2, platform-design-system ×2, terminology-regression ×2. **Do not "fix" them inside this task; never add new failures.** Also inherited: `npm run check:design-system-v5` reports 89 pre-existing guardrail findings.

**Merged to main by sponsor:** `33c76eed` (execution phases) + `f532056b` (contract path alignment after `(app)` consolidation).

## 4. IN FLIGHT — Phase 5 (Execution workspace), ~80% implemented, UNCOMMITTED, UNVERIFIED

An agent implemented most of Phase 5 in the working tree but died (provider connection error) before spec/decision-log/verification/commit. **Resume exactly here:**

Already in tree (uncommitted): `inspection_item_states`-era migration `20260721150000_execution_item_lifecycle.sql` (untracked — REVIEW it), `runtime.ts` (+82 lines: `ItemState`, `ADDED_SECTION_KEY="__added"`, `effectiveSections()` — §15 effective scope: snapshot minus active deselections plus additions), `lib/offline.ts` (+52: new outbox op handlers — verify `item_state` + `violation_invalidate`), `Workspace.tsx` + `page.tsx` (modified — verify deselect dialog/restore/add-item/invalidated-violation display/penalty-singularity branch).

Still to do (from the Phase 5 brief):
1. Review the uncommitted work against the plan: §15 (added/deselected lifecycle, mandatory reason, restore pre-submit, audit, denominator exclusion), §18 (candidate invalidation on Compliant flip — invalidate NEVER delete; action-form re-evaluation mechanism must be recorded as D-018; penalty singularity fail-closed), §20 (compliance = compliant answered scored / total answered scored ×100; progress on active scope).
2. Write `apps/web/e2e/execution-workspace-contract.spec.ts` (fs-read pattern like the other execution-*-contract specs) and register it in `playwright.static.config.ts` testMatch (keep all existing entries).
3. Append D-017/D-018/D-019 to the decision log.
4. Verify: `cd apps/web && npm run typecheck` (0), `npm run build` (PASS), `npx playwright test --config playwright.static.config.ts` (207 + new passed, same 10 known failures, 0 new).
5. Commit ONLY the Phase 5 files: "feat(execution): Phase 5 workspace item lifecycle, canonical compliance, violation candidates". Watch for the other session's dirty files — stage by path.

## 5. Remaining phases (briefs ready to reuse)

- **Phase 6 — Submission + Review** (§21/§22): atomic immutable submission transaction review (submission_versions race fix — client computes max+1; make server-authoritative or tolerate 23505 cleanly); return-scope unlock enforcement server-side (currently client-only); resubmission version N+1 with returned-sections-only diff guard; Open Review sets operational_state='under_review' (enum value exists, unwired); resubmission returns it to 'submitted'; reviewer work item + SLA escalation states; version comparison exists (VersionCompare).
- **Phase 7 — Virtual/Immediate/cross-module** (§23/§24/§29): virtual gate wired to preparation readiness (beginRemote must require confirmed ready); immediate visits enter the same engine; Operations/Factory 360/Dashboard consume canonical lifecycle + operational states (pending-vs-approved compliance already correct in F360; dashboard compliance mixes submitted — reconcile to pending-labelled); per-source failure isolation check.
- **Phase 8 — Certification** (pack `05_KIMI/CERTIFICATION/`): Chrome on 127.0.0.1:3000, personas, RLS negatives, offline/device-restart, Arabic/RTL, responsive, typecheck/build/full regression; fix-repeat; delta secret scan; push. NOTE: full browser journeys need the new migrations applied to the test Supabase — requires sponsor approval for remote DDL (slice do_not_touch).

## 6. Operating pitfalls encountered (don't get bitten twice)

1. **Concurrent sessions share the checkout.** Another line (planning) commits concurrently; a worktree+branch of this task was deleted mid-work once (recovered from dangling commit). Commit early, stage by path, verify `git status` after.
2. **Subagent limits:** 60-min timeout per agent (resume with the agent id to continue — Phase 3B/4B each needed one resume); occasional provider 403 quota and connection errors — retry or resume.
3. **`git status` full untracked scan can hang** on huge trees — use `git status -uno`.
4. **`e2e/ipad-gps-policy.spec.ts` pins the engine_settings gis/otp/field query byte-for-byte** — never extend that select; use a separate tolerant read.
5. **Frozen shell contracts** (compliance-shared-shell, inspector-shell-uplift) pin the primary admin nav at 7 items — new admin entries go to advancedAdmin.
6. **audit_events.object_id is uuid** — non-uuid keys go in before/after state with object_id null (D-004 precedent).
7. **pgcrypto lives in the `extensions` schema** — functions using digest need `set search_path = public, extensions` (20260718150000 precedent).
8. Static suite is the certification gate until migrations are applied remotely: keep it green-minus-known-10 after every change.
9. node_modules: if deps drift, `npm install` in apps/web (lockfile is authoritative; never hand-edit).
10. Baseline counts to compare against: static **207 passed / 4 skipped / 10 failed (known)** as of Phase 4B.

## 7. Key architecture decisions so far (details in EXECUTION_DECISION_LOG.md)

- D-001 daily-cap counting semantics (published, coalesce(execution_date, window_start), submitted-or-later frees capacity, default 10).
- D-002 stored `prepared` ≡ canonical "Ready for Execution" (no destructive rewrite; enum extended with `under_review` only).
- D-003 capabilities via seed tables + `has_capability` RPC; legacy roles untouched.
- D-007 form_config optionality fail-closed (absent metadata = no removals).
- D-008 Ready creates the inspections row with `started_at` NULL; reopen pre-journey/no-work only.
- D-010 journey start requires confirmed readiness server-side (EXE-READY-REQUIRED).
- D-012..D-014 atomic journey RPC; active cancellation request+decide; 5-fact location model with append-only corrections.
- D-015/016 probe-gated RPC consumption with legacy fallback; cancellation non-blocking until decided.

## 8. Resume command for the next session

> "Resume TASK-EXECUTION-MODULE-001 per `apps/web/.planning-pack/EXECUTION_HANDOVER_2026-07-21.md`: finish Phase 5 per §4 (review uncommitted work, add contract spec + decisions, verify, commit), then Phases 6→8 per §5. main is the only route; additive-only; static baseline 207/4/10-known."
