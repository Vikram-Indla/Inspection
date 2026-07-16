# Repository workflow

## Decision

This repository has **one** canonical integration branch. Interfaces do not
receive permanent main branches. iPad, web and admin work is isolated in
short-lived task branches and reunited through reviewed pull requests.

The current canonical/default branch is `setup/Inspection`. It remains the
only target for normal pull requests until an explicit branch-reconciliation
change is approved. Do **not** target or promote `main`: it currently diverges
from `setup/Inspection` and neither branch is an ancestor of the other.

## Branch names

Create branches from the current `setup/Inspection` head. Use the task ID and
a short outcome-oriented suffix.

| Work | Codex branch | Human branch |
|---|---|---|
| iPad field application | `codex/ipad/TASK-IPAD-<id>-<summary>` | `feat/ipad/TASK-IPAD-<id>-<summary>` |
| Web workspace | `codex/web/TASK-WEB-<id>-<summary>` | `feat/web/TASK-WEB-<id>-<summary>` |
| Admin control plane | `codex/admin/TASK-ADM-<id>-<summary>` | `feat/admin/TASK-ADM-<id>-<summary>` |
| Shared contracts, auth, workflow, API or data | `codex/shared/TASK-<id>-<summary>` | `feat/shared/TASK-<id>-<summary>` |
| Repository governance | `codex/governance/<summary>` | `docs/<summary>` |
| Urgent correction | `hotfix/<surface>/TASK-<id>-<summary>` | `hotfix/<surface>/TASK-<id>-<summary>` |

`release/<version>` branches are temporary stabilization branches only. They
are never a permanent iPad, web or admin mainline.

## Surface boundaries

| Surface | Primary paths | Required review focus |
|---|---|---|
| iPad | `apps/web/src/app/field/**`, `apps/web/src/lib/field-*.ts`, M04 field tests | offline behavior, GPS, arrival, device provenance, field workflow |
| Admin | `apps/web/src/app/admin/**`, `apps/web/src/app/operations/**`, CD-004–011 tests | roles, maker-checker, audit, engine controls |
| Web | planner, visit, review, dashboard, factory and virtual routes | workflow, permissions, responsive/RTL behavior |
| Shared | `supabase/**`, authentication, middleware, shared libraries, contracts and migrations | every affected surface and full regression |

If a change touches more than one row, use a `shared` branch and mark the pull
request as cross-surface. A database migration, role/permission change,
canonical transition, audit rule, shared library or API change is always
cross-surface even if the first visible screen is only one interface.

## Pull-request workflow

1. Create the task branch from `setup/Inspection` in its own worktree.
2. Keep the change to one coherent task. Do not mix generated screenshots,
   local dependencies, secrets or unrelated cleanup into the pull request.
3. Complete the pull-request template, including task ID, surface and evidence.
4. Run the relevant surface tests. Run the complete regression for shared
   contracts, migrations, roles, workflows or APIs.
5. Open a pull request into `setup/Inspection`. Resolve review conversations
   and use a squash merge unless release provenance requires otherwise.
6. Delete the task branch after merge. Keep release branches only for the
   approved release window.

## Database and shared-contract rule

Database migrations must be forward-only, idempotent and independently
verifiable. Do not couple a migration to three separate interface branches:
place it on one `shared` branch, merge it once, and have interface branches
rebase onto the resulting canonical contract.

## Required GitHub repository settings

Apply these settings to `setup/Inspection` in GitHub after this policy is
merged. They cannot be represented fully in a Git commit.

- Require pull requests before merging; require one approval and Code Owner
  review.
- Require the `Pull request contract / web-typecheck` status check.
- Dismiss stale approvals, require conversation resolution, and block force
  pushes and branch deletion.
- Restrict direct pushes to the release maintainer only; all ordinary work
  goes through a pull request.
- Keep `setup/Inspection` as the default branch until the recorded
  main-branch divergence is reconciled in a dedicated, reviewed change.

The `CODEOWNERS` file intentionally starts with the repository owner as the
single reviewer. Replace those entries with approved GitHub teams when the
maintenance team is formally assigned.
