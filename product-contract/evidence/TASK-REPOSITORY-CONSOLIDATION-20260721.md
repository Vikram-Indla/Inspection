# Repository consolidation evidence — 2026-07-21

- Task: `TASK-REPOSITORY-CONSOLIDATION-20260721`
- Scope: repository administration only; no product requirement or acceptance row is upgraded by this task.
- Canonical source branch: `codex/repository-consolidation-20260721`
- Validated source commit: `b600e66` (before this evidence/handoff record).
- Integrated lines: canonical `setup/Inspection`, `main`, Factory 360 staging closure, Planning, Execution, Dashboard design/runtime, G11 navigation performance, Saqeel V5/design system, and the final Saqeel login theme.
- Conflict policy: preserve the later governed runtime for functional routes and the later approved Saqeel presentation for visual surfaces; retain both work-queue/approval histories; renumber colliding V5 decision IDs to `DEC-030..032`; never weaken fail-closed/provider/offline/immutable/audit contracts.
- Excluded from the canonical route: local environment files and credentials; the management-key/config endpoint experiment; generated dependencies/build output; modified binary evidence; an incomplete uncommitted Planning resolver rewrite; obsolete destructive rollback and superseded performance stashes.
- Recovery: full pre-cleanup refs/stashes and the incomplete Planning WIP are preserved outside Git in verified local bundles; untracked implementation packs are preserved in a verified local archive. No archive or credential is committed.
- Verification: `npm run typecheck` PASS; `npm run build` PASS; `npm run verify:dates` 17/17 PASS; `git diff --check` PASS; management-key source scan PASS.
- Known inherited check: `npm run check:design-system-v5` reports 89 pre-existing repository-wide guardrail findings. They are not reclassified or silently allowlisted by this repository-administration task.
- Product status: G11 performance acceptance and all existing provider, policy, sponsor, human-language, runtime and release blockers remain unchanged.
- Cleanup result: remote `main` and `setup/Inspection` converged; nine stale remote branches, twenty-four stale local branches, all linked worktrees, and six stashes were removed after final recovery capture.

## Direct-main re-audit

- Sponsor direction: use `main` directly as the sole Git source route; Planning and Execution are product tasks, not long-lived branch streams.
- Newly integrated histories: approved Web channel access (`3bc1acb0`), Planning resolver/handoffs (`b4389529`, `562bf1b5`), and Execution Phase 3A/3B (`04b55593`, `c8c52acd`).
- Merge commits: `48420a5b`, `1fec2cb0`, and `33c76eed`.
- Post-merge correction commit: `f532056b` aligns source-contract tests with the canonical `(app)` route group and current accepted tokens.
- Verification: typecheck PASS; production build PASS; Execution/shared-shell source contracts 43/43 PASS.
- Recovery: `/private/tmp/Inspection-pre-direct-main-integration-20260721.bundle` was created and verified before integration. External untracked Planning inputs were moved to `/private/tmp/Inspection-planning-authority-pack-untracked-20260721`; neither archive is committed.
- Acceptance boundary: Planning live/runtime acceptance and Execution sponsor/release acceptance remain unchanged and open where already recorded.
