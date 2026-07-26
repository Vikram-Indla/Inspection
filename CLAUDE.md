# MIM Inspection Platform - Project Authority

## Mission
Build the MVP1 Inspection Platform exactly from the versioned product contract. Do not rediscover, reinterpret, weaken, or expand scope without documented change control.

## Source of truth
Read these files in order at every session start:
1. `product-contract/00_START_HERE.md`
2. `product-contract/CURRENT_STATE.md`
3. `product-contract/GATE_STATUS.md`
4. `product-contract/execution/CURRENT_SLICE.yaml`
5. `product-contract/execution/TASK_ROUTER.yaml`
6. `product-contract/governance/OPEN_DECISIONS.yaml`
7. The task-specific files listed in the current slice.

## Hard rules
- Broad implementation is blocked until G8 is PASS.
- The 478 source requirements remain mandatory MVP1.
- A Phase 2 AI note defers only that AI sub-capability, never its parent requirement.
- Never invent policy values, providers, thresholds, SLAs, legal rules, risk weights, geofence values, retention, or Arabic scope.
- Never mark a page or component complete without runtime behavior, data, audit, negative paths, tests, and evidence.
- Never mutate workflow status directly; use canonical transitions and guards.
- Never edit an immutable submitted version.
- Never silently overwrite offline/server conflicts.
- Never replace an unavailable integration with a permanent mock and claim completion.
- Never remove or weaken an accepted requirement, field, rule, permission, state, audit event, offline behavior, or usability outcome.
- Do not push, merge, or modify `main` without explicit human approval.
- Do not edit frozen product-contract artifacts without an approved change-control task.
- `main` is the single canonical branch — GitHub's configured default branch (`origin/HEAD` points at it) and the branch every pull request targets. Product Owner ruling, 2026-07-26.
- There is no second trunk. `setup/Inspection` and `saqeel/operations` were both treated as the trunk at different points on 2026-07-25/26; both are retired. `setup/Inspection` has been deleted (its history was fully contained in `main`), and `saqeel/operations` must not be used as an integration target.
- Work happens on a short-lived branch per card, and lands via a pull request into `main`. Do not push, merge, or modify `main` without explicit human approval.
- Branch names are not authority. Two different boards both called `SB-r9`, and two different heads both called `main`, caused real reconciliation work on 2026-07-26. Verify with `git merge-base --is-ancestor` and `git cherry` (patch-id), never with a name, a date or a revision string.
- Before deleting any branch or worktree, prove the work is not lost: `git cherry origin/main <branch>` must show no `+` lines. A `+` means that content exists nowhere else and deleting it destroys it. Never force-push `main`.
- Why this is written down: on 2026-07-26 history split five times in one evening because sessions merged in parallel against different trunks while `origin/HEAD` pointed somewhere else again. One named trunk plus the default branch agreeing with it is what prevents it.

## Work protocol
Before work:
- State the task ID, process IDs, requirement IDs, acceptance IDs, screens, engines, dependencies, open decisions, and do-not-touch areas.
- Confirm the current Git branch and working tree.
- Stop if the current task conflicts with the product contract.

During work:
- Implement the smallest coherent vertical slice.
- Keep IDs in code, tests, evidence, and session records.
- Record every approved assumption in the decision register.

Before completion:
- Run required tests and negative paths.
- Capture the evidence named in the current slice.
- Update `CURRENT_STATE.md`, `SESSION_LEDGER.json`, `WORK_QUEUE.yaml`, and acceptance/evidence records.
- Do not declare completion while any required P0/P1 criterion is failed or unevidenced.

## Memory policy
- Git-backed files are authoritative.
- Obsidian is a human interface over the same repository, not a separate copy.
- Claude auto memory is advisory only and may never override the product contract.
- `CLAUDE.local.md` is personal and must not contain shared scope decisions.

## Documentation storage
- Human-readable master documents and binary evidence are stored under `INSPECTION_DOCS_ROOT`; Vikram's approved local root is `/Users/vikramindla/Desktop/Inspection Documentation`.
- Read `docs/README.md` and `docs/DOCUMENTATION_STORAGE_POLICY.md` before adding documentation or evidence.
- Do not recommit external BRDs, workbooks, PDFs, storyboards, screenshots, videos, archives, or packaged handoff exports.
- Keep the live product contract, Claude continuity controls, machine-readable acceptance/wiring maps, and code-ready design authority in Git.

## Design policy
- Figma golden screens and tokens become authoritative only after G6 approval.
- Mobbin is for pattern research and provenance, never direct copying.
- The iPad is a field application, not a reduced web portal.
- Admin engines are control planes, not simple CRUD screens.
- For MVP1 UX work, begin at `design/claude-design-mvp1/00_START_HERE.md` and follow its authority, journey prompts, special-component contracts, and design acceptance matrices.
- Claude Design produces code-ready design outputs only; application edits begin only after the relevant design acceptance rows receive human signoff.

## Gate position
G0-G9 PASS (G1 conditional; G8 sponsor-authorized 2026-07-11; G9 build completion 2026-07-12). G10 verification is in progress with the Playwright headless suite as the exit criterion. G11 hardening and G12 release are open. Broad implementation is authorized. `product-contract/GATE_STATUS.md` is the authoritative gate record.
