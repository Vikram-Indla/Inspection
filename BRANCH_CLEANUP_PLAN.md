# Branch Consolidation & Cleanup — Base Plan (2026-07-17)

Target root: **`setup/Inspection`** (CLAUDE.md declared main / origin HEAD). Local-only. Consolidate active, drop dead.

Safety net: every local branch head tagged `backup/20260717-cleanup/<branch>` before any change. Nothing is unrecoverable.

## Branch map (24 local branches → grouped)

### A. Active independent tips — MERGE into setup/Inspection
| Branch | ahead/setup | Carries |
|---|---|---|
| `main` | +109 | superset: cd006-011 x2, ipad/m04, pr27, remaining-closure, staging-ipad, migration-reconcile, docs, mvp2-m2-05 |
| `fix/mvp1-cycle2-production-hardening` (=`codex/login-atlas-motion-rtl`) | +92 | login-atlas + mvp1 hardening (NOT in main) |
| `baseline/consolidated-2026-07-15` | +12 | old consolidation baseline |
| `codex/g11-g12-integration` | +49 | G11/G12 integration |
| `codex/g11-g12-release-001` | +31 | G11/G12 release |
| `codex/governance/repository-workflow` (+ `-clean`) | +50 / +1 | governance workflow |
| `codex/ipad-mapbox-runtime-004` | +64 | ipad mapbox runtime |
| `feat/cd-006-regulation-detail-and-version` | +1 | cd-006 |
| `feat/cd-012-019-admin-frontend` | +23 | admin frontend |
| `feat/cd-025-plan-review-publish` | +1 | cd-025 |

### B. Dead — fully contained in an active tip → DELETE (commits arrive via merge)
`backup/pr30-pre-clean-rebase`, `chore/externalize-documentation`, `codex/cd006-011-backend-completion`, `codex/cd006-011-frontend`, `codex/ipad/m04-geofence-policy-promotion-002`, `codex/pr27-conflict-resolution`, `codex/remaining-requirements-closure`, `codex/staging-ipad-geofence-runtime-003`, `fix/migration-live-reconciliation`, `promote/docs-to-main`, `codex/mvp2-m2-05-audit-replay`, `codex/login-atlas-motion-rtl`

## Uncommitted worktree work — PRESERVE decision required
- `login-atlas` — modified login source + new brand PNGs
- `cd-006` — modified page.tsx, new RegulationDetail.tsx, new migration sql
- `staging-ipad-geofence` — modified decision_register.csv
- `g11-g12-integration`, `requirements-closure` — modified evidence PNGs (binary)
- `cd006-011-frontend` — untracked evidence PNG dirs

## Stashes
- `stash@{0}` audit-log noise → drop
- `stash@{1,2,3}` overlapping source edits on main → apply widest (`{3}`) or reconcile

## Execution order
1. Commit/preserve uncommitted worktree work onto each branch (per decision).
2. Checkout `setup/Inspection` in main repo.
3. Sequential merge of group A, resolving conflicts each step; commit.
4. Apply stash(es) onto setup, resolve, commit.
5. Remove all worktrees; prune.
6. Delete group A + B local branches (keep setup/Inspection).
7. Verify: typecheck/build; report result.

## Governance guards (CLAUDE.md)
- No push/remote change (local only).
- No weakening of accepted requirements, evidence, or contract records — merges take union, conflicts resolved to keep both sides' accepted content.
- Frozen `product-contract/` conflicts surfaced explicitly, not silently overwritten.
