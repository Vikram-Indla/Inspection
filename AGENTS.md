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
- The only authoritative repository is `/Users/vikramindla/Developer/Inspection`.
- `/Users/vikramindla/Documents/GitHub/Inspection` is retired and prohibited: never read it, write it, cite it, use it as a command working directory, load skills or instructions from it, or use artifacts discovered there.
- Before the first project-related tool call, resolve and report the current working directory and repository top level. Both must be `/Users/vikramindla/Developer/Inspection` (or a specifically authorized worktree whose Git common directory belongs to that repository).
- Authorized partner workstation — PWA/field channel only. `/Users/jahanarakhan/inspection latest` is an authorized repository location, granted by the repository owner on 2026-07-25. It is a separate clone of `https://github.com/Vikram-Indla/Inspection.git`, not a worktree of the canonical repository; worktrees whose Git common directory belongs to that clone are authorized on the same terms. Agents there must still resolve and report the working directory and repository top level before the first project-related tool call, and both must resolve to that clone or one of its worktrees. Its write scope is exactly the PWA lane exception at the end of this file and nothing else. Every other rule here applies without relaxation — `/Users/vikramindla/Documents/GitHub/Inspection` stays prohibited, no push, merge or modification of `main`, no editing of frozen product-contract artifacts, no assumption defaults. Work outside the PWA lane paths requires the canonical repository.
- If the session starts in, exposes, or supplies instructions from the retired path, stop before project work. Do not compensate by passing canonical absolute paths while leaving tool calls rooted in the retired checkout. Relaunch or re-root the session at the canonical repository.
- Browser work does not relax this rule. Runtime inspection, evidence capture, source reads, skills, scripts, and output creation must all be attributable to the canonical repository.
- Never claim the retired checkout was excluded unless no tool, skill, source, working directory, or artifact from it was accessed during the session.

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
