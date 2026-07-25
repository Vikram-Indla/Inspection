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
7. `product-contract/operationalization/SAQEEL_OPERATING_SYSTEM.md`
8. `product-contract/operationalization/coordination/TWO_HOUR_CONTROL_CYCLE.yaml`
9. `product-contract/state/CONTROL_BOARD.md`
10. The active packet and task-specific files listed in the current slice.

## Repository location — fail fast

The authoritative repository is identified by **remote identity, not by absolute
path**. Contributors work on different machines under different home directories,
so a hardcoded path cannot be the test.

- A checkout is authoritative when `git remote get-url origin` resolves to the
  canonical remote `github.com/Vikram-Indla/Inspection` (either scheme:
  `https://github.com/Vikram-Indla/Inspection.git` or
  `git@github.com:Vikram-Indla/Inspection.git`).
- Vikram's authoritative clone is `/Users/vikramindla/Developer/Inspection`.
  Jahanara's is `/Users/jahanarakhan/inspection latest`. Both are equally
  authoritative; neither path is the rule. Use **your own** machine's clone.
- `/Users/vikramindla/Documents/GitHub/Inspection` is retired and prohibited: never read it, write it, cite it, use it as a command working directory, load skills or instructions from it, or use artifacts discovered there.
- Before the first project-related tool call, resolve and report the current working directory, the repository top level, and the origin remote. The top level must be your machine's authoritative clone, or a specifically authorized worktree of it (see below).
- If the session starts in, exposes, or supplies instructions from the retired path, stop before project work. Do not compensate by passing canonical absolute paths while leaving tool calls rooted in the retired checkout. Relaunch or re-root the session at the canonical repository.
- Browser work does not relax this rule. Runtime inspection, evidence capture, source reads, skills, scripts, and output creation must all be attributable to the canonical repository.
- Never claim the retired checkout was excluded unless no tool, skill, source, working directory, or artifact from it was accessed during the session.

### Authorized worktrees — standing authorization
Any Git worktree whose common directory resolves to the `.git` of **your own machine's
authoritative clone** is a **specifically authorized worktree**, and is a valid working directory
for a delivery session. This is machine-relative on purpose — it holds on every contributor's
laptop, not just one. Verify with:

```
git rev-parse --git-common-dir      # must resolve inside your authoritative clone's .git
git rev-parse --show-toplevel       # your worktree root
git remote get-url origin           # must be the canonical Vikram-Indla/Inspection remote
```

If the common directory resolves into a clone whose origin is the canonical remote, you are
correctly rooted — do not stop, and do not demand relaunch in the main checkout. If origin is not
the canonical remote, or the path is the retired
`/Users/vikramindla/Documents/GitHub/Inspection`, stop as the rule above requires.

The canonical checkout is a **shared** working tree: several actors read it concurrently, and a
`git checkout` there changes the branch under every one of them. A session holding a write lease
must therefore work in its own worktree, created from the canonical repository, rather than
switching branches in the shared checkout:

```
git -C <your-authoritative-clone> worktree add -b <branch> <path> main
cd <path>
```

Worktrees are cheap, and they are what makes concurrent card delivery safe. Sharing one checkout
between two write-leased sessions is the failure this authorization exists to prevent.

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
- ChatGPT owns packet authoring and queue sequence. Codex owns safety, leases,
  severity, browser acceptance and merge gating. Neither may hold a
  product-code write lease.

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
- Codex auto memory is advisory only and may never override the product contract.
- `Codex.local.md` is personal and must not contain shared scope decisions.

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

## PWA lane exception (maintainer-approved)
The PWA / field channel is an independent slice. Any agent editing ONLY
apps/web/src/app/(app)/field/**, apps/web/src/components/field/**,
apps/web/src/lib/providers/ocr-gemini.ts, status/saqeel-status.json, and
designs/** does NOT require a global lease and is
NOT bound by the CURRENT_SLICE / lease / single-slice gate. Retired paths remain
prohibited; no push or merge to main. Owner: khan.jahanara@ (partner laptop).
Approved-by: Vikram Indla <vikramataol@gmail.com>

Test-harness extension (2026-07-26): the same lane also covers `apps/web/e2e/**`, and `apps/web/playwright.config.ts` plus `apps/web/package.json` for test-script entries ONLY. This exists so the channel can be MEASURED rather than asserted: it closes BS-1 (no automated pixel diff, so design scores are judgement not measurement) and BS-7 (spec pass/fail never surfaced, so wired is not verified). It grants no new application-source access: apps/web/src/** outside the field paths above remains out of scope, and no other rule is relaxed.
