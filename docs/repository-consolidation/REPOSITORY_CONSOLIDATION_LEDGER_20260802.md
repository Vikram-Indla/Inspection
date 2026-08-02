# Repository Consolidation Evidence Ledger — 2026-08-02

Task: `TASK-REPOSITORY-CONSOLIDATION`
Canonical repository: `/Users/vikramindla/Developer/Inspection`
Origin: `https://github.com/Vikram-Indla/Inspection.git`
Starting local main: `702bbee1d779f744a20ac4c01ea1212e79157517`
Integration worktree: `/private/tmp/Inspection-main-consolidation`
Integration branch: `codex/local-main-consolidation`

No remote ref, production service, or production data was changed.

## Recovery chain

| Commit | Recovery scope |
|---|---|
| `b05805d2` | Canonical dirty tree: source, migrations, tests, design metadata, traceability, and tracked governance state |
| `5585fd1a` | Remaining screenshots, Figma evidence/assets, journey workbooks, rendered inspection records, and audit generators |
| `d22841f6` | Completed four-role Dashboard landing, role scoping, navigation/login, migration, and focused tests |
| `ab756055` | Completed Planner Tasks, bulk targeting, supervision i18n, and shared task actions |
| `19cb3ade` | Unique Inspector journey E2E contract changes |
| `d8683eea` | G11 visit-breakpoints packet, acceptance, evidence, decision row, E2E and SQL tests |
| `164237f9` | Reusable local Test Data package: workbook, inspection record, rollback manifest, generators, importer, SQL validation, RLS proof, and immutability migration |

These commits are recovery points even where a later merge resolution intentionally retained a newer governed version.

## Initial worktree inventory

| Worktree | Initial HEAD / branch | Dirty paths | Qualification |
|---|---|---:|---|
| canonical checkout | `ade23863`, `docs/saqeel-figma-design-system` | 245 | A–F; preserved by `b05805d2` and `5585fd1a` |
| `.codex/worktrees/3f83` | `ade23863`, detached | 147 | Byte-matched canonical recovery except later Admin-delegation copies and session noise |
| `.codex/worktrees/933e` | `702bbee1`, `codex/shared-dashboard-four-roles` | 11 | Unique A/B/C; preserved by `d22841f6` |
| `.codex/worktrees/9a05` | `ade23863`, detached | 219+ | Canonical duplicates plus unique B/D Test Data package; preserved by `164237f9` |
| `.codex/worktrees/a121` | `ade23863`, detached | 62 | Canonical duplicates plus Supervisor packet copy; no unique product delta after content comparison |
| `.codex/worktrees/d477` | `702bbee1`, detached | 0 | Clean, no unique commit |
| `.codex/worktrees/d532` | `ade23863`, detached | 151 | Canonical duplicates plus four unique C files; preserved by `19cb3ade` |
| `.codex/worktrees/f3db` | `702bbee1`, detached | 7 | Unique A Planner closure; preserved by `ab756055` |
| `.codex/worktrees/fca0` | `ade23863`, detached | 151 | Canonical duplicates; Admin delegation copies superseded by integrated canonical versions |
| `Inspection-saq-jm-breakpoints-001` | `ada62124`, `codex/saq-jm-breakpoints-001` | 10 | Unique C/D/F; preserved by `d8683eea` |
| `Inspection-worktrees/saq-jm-slice-1` | `ada62124`, `codex/saq-jm-slice-1` | 0 | Clean duplicate branch tip |
| `.worktrees/compliance-pwa-terminology` | `295ae3f3` | 0 | Already ancestor of starting main |
| `.worktrees/restore-shell-nav` | `2a0b59aa` | 0 | Already ancestor of starting main |
| `.worktrees/simple-english-terminology-redo` | `6bf64174` | 0 | Already ancestor of starting main |

## Initial local branch inventory and reachability

- Already contained by starting main: `codex/admin-config-journey-20260802`, `codex/saq-jm-breakpoints-001` (pre-recovery tip), `codex/saq-jm-slice-1`, `codex/shared-dashboard-four-roles` (pre-recovery tip), `feat/compliance-pwa-terminology-remediation`, `feat/simple-english-terminology-redo`, `fix/restore-canonical-shell-nav`.
- `codex/planner-inspector-directory-repair`: 22 commits ahead of its historical base; fully contained by `codex/requirements-alignment-closure`.
- `codex/requirements-alignment-closure`: 32 unique commits, merged by `b0cffae6`.
- `codex/observation-ai-closure`: 16 historical unique commits, including eight read/export/factory-proof deltas not in the requirements tip; merged by `1700b775`.
- `docs/saqeel-figma-design-system`: 44 unique design commits at kickoff, plus recovery commits `b05805d2` and `5585fd1a`; merged by `d42f022f` and `7149a6d6`.
- Starting `main`: `702bbee1`; no stash existed.

## A–G qualification

Counts are unique recovery paths across the seven recovery commits. Class G counts competing merge variants rather than unique paths, because those same paths also have an A–D primary classification.

| Class | Count | Disposition | Representative paths |
|---|---:|---|---|
| A — product code/business value | 89 | Integrated | `apps/web/src/app/(app)/dashboard/page.tsx`, `apps/web/src/app/(app)/planning/bulk/page.tsx`, `apps/web/src/app/(app)/admin/delegation/actions.ts` |
| B — migration/seed/data tooling | 37 | Integrated | `supabase/migrations/20260802090000_shared_dashboard_four_roles.sql`, `supabase/migrations/20260802010024_local_submission_versions_immutability.sql`, `scripts/test-data/local_test_data_seed.sql` |
| C — automated tests | 14 | Integrated | `apps/web/e2e/shared-dashboard-four-roles.spec.ts`, `apps/web/e2e/saq-jm-visit-breakpoints.spec.ts`, `supabase/tests/saq_jm_visit_breakpoints_slice1.sql` |
| D — Figma/design/traceability evidence | 107 | Integrated | `docs/design/figma/traceability/*`, `apps/web/demo-screens/*`, `outputs/019fbd0c-*/SAQEEL_Local_Test_Data_Package.xlsx` |
| E — generated audit/session noise | 6 tracked groups plus dependency caches | Excluded from final main delta; recovery remains in `b05805d2` or on disk until cleanup | `.project-memory/audit/*.jsonl`, `product-contract/sessions/{COMPACTION_CHECKPOINT,LAST_SESSION}.md`, nested `node_modules` |
| F — obsolete/superseded governance | 29 preserved deletion/control variants | Excluded from final main behavior; recovery remains in `b05805d2`/`d8683eea` | deletion of `product-contract/execution/*`; historical `CURRENT_SLICE.yaml` and `ACTIVE_CHANGE_APPROVAL.yaml` pointers |
| G — duplicate/conflicting implementation | 27 merge variants | Excluded with reviewed replacement below | older direct-schedule Planner flow, older Review/DEC-032 boundary, duplicate detached-worktree copies |

## Intentional exclusions and replacement evidence

1. `.project-memory/audit/{compactions,instructions_loaded,session_end,tool_events}.jsonl` and `product-contract/sessions/{COMPACTION_CHECKPOINT,LAST_SESSION}.md` — class E. Restored from starting `main` by `559d80fa`; exact dirty copies remain in recovery commit `b05805d2`.
2. All nested `node_modules` and `.next` caches — class E. Reproducible dependencies/build output; no product source. They were never staged.
3. The preserved deletion of 29 `product-contract/execution` control/history files — class F. Replaced by the intact starting-main execution contract during merge `d42f022f`; the deleted state remains recoverable in `b05805d2`.
4. Historical Breakpoints `CURRENT_SLICE.yaml` and `ACTIVE_CHANGE_APPROVAL.yaml` pointers — class F. Packet, acceptance, evidence, decision row and tests were integrated; active pointers were restored to the pre-merge current controls by `e145776b`.
5. Older direct-scheduling Planner conflict variants in Dashboard/Planning pages, Wizard, actions, and three recovered-live migrations — class G. Replaced by the newer governed submit-for-supervision workflow and recovered-live SQL during `b0cffae6`; old versions remain reachable through `codex/requirements-alignment-closure` and the merge commit.
6. Older Review/DEC-032, supervisor-approval evidence/migration/test variants from `codex/observation-ai-closure` — class G. Replaced by current atomic Review behavior and the applied DEC-032 fix during `1700b775`.
7. Older Dashboard role gates (`admin`/`supervisor` only and non-Dashboard role homes) — class G. Replaced by Product Owner-authorized four-role `/dashboard` landing in `d22841f6`/`533d8489`.
8. Detached-worktree broad dirty copies in `3f83`, `a121`, `d532`, `fca0`, and `9a05` — class G/E. Content comparison proved the A–D files byte-match `b05805d2`/`5585fd1a` or later integrated commits; only the explicitly listed unique Inspector/Test Data deltas were separately recovered.

## Conflict resolutions

- Admin Items/Packages retained precise `compliance_admin`/`form_admin` write-boundary wording while accepting newer surrounding journey behavior.
- Admin Templates accepted centralized configuration revalidation.
- Operations, Exceptions, Review detail, Calendar, Map and Workload accepted newer complete journey components and degraded states.
- Dashboard accepted the four-role persona resolver and `/dashboard` landing for all canonical roles.
- Planning retained Supervisor assignment/release instead of the superseded direct-schedule/auto-assignment path.
- Review retained the current atomic decision path and DEC-032 resubmission boundary.
- Breakpoints packet/test/evidence was integrated, while historical active-control pointers were not promoted.

## Verification record

- Dashboard source branch: non-incremental TypeScript PASS; production build 62/62 PASS; focused tests 21/21 PASS; diff check PASS.
- Test Data package: 20/20 passwords and role claims; 5 linked cohorts; 5/5 coordinates; zero FK orphans; Inspector/Planner/Supervisor RLS proofs; 12/12 workbook reconciliation; zero formula errors; idempotent second import; immutability update/delete guard; rendered workbook inspection PASS.
- Consolidated branch: non-incremental TypeScript PASS after all source merges and before the final Test Data/evidence-only merges. Final TypeScript/build/focused checks are recorded in the closing commit/report.
