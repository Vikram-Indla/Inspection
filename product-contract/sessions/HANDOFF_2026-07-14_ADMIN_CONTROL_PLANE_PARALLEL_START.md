# Parallel Session Handoff — Admin Control Plane Suite

- Session ID: `2026-07-14-admin-control-plane-parallel-start`
- Date/time: `2026-07-14T13:44:04+03:00`
- Gate: `G10/G11 controlled UI design — parallel design-only lane`
- Task ID: `TASK-DESIGN-ADMIN-SUITE-001`
- Branch observed: `main`
- Starting commit: `fc6d5f97c4aa02e9de31d048ff4a7493b52489bd`
- Ending commit: unchanged; no commit authorized or created
- Requirements: `MVP1-M09`, relevant `MVP1-FND-*`, `RBAC-*`, and every requirement mapped to CD-004..CD-019
- Acceptance IDs: `DSG-001..DSG-014`, `DSG-A11Y-001`, `DSG-CODE-001`; CD-018/CD-019 acceptance addenda required before their design chapter
- Screens: `SCR-ADM-001`, `SCR-ADM-010`, `SCR-ADM-011`, `SCR-ADM-020`, `SCR-ADM-030`, `SCR-ADM-031`, `SCR-ADM-040`, `SCR-ADM-041`, `SCR-ADM-050`, `SCR-ADM-051`, `SCR-ADM-060`, `SCR-ADM-070`, `SCR-ADM-080`, `SCR-ADM-090`, `ADM-LOCALIZATION`, `ADM-AUDIT`
- Engines: `ENG-01..ENG-12`, constrained per screen
- Database/API changes: none authorized
- Tests run: repository status/branch/commit inspection only
- Evidence captured: this handoff and `${INSPECTION_DOCS_ROOT}/05_UI_UX_AND_STORYBOARDS/outputs/claude-design-approval-pack/admin-control-plane-suite/PARALLEL_OWNERSHIP.yaml`
- Regression result: not applicable; design-only parallel lane
- Exact next task: create the Admin family foundation and the complete direct-to-Claude-Design prompt for Chapter 1 / CD-004 only

## Purpose

Start a separate conversation for CD-004..CD-019 without interrupting the active Web/CD-025+ programme and without lowering the premium design standard.

This is one coherent **Admin Control Plane Suite**, delivered through eight bounded design chapters. It is not one undifferentiated 16-screen generation.

## Sponsor direction carried into the new conversation

1. Premium and highest-quality UI/UX must not degrade.
2. Every chapter receives one mandatory independent review iteration, even when the first design appears acceptable.
3. A remaining P0/P1 after correction blocks approval.
4. Claude Design generates the visual design and a paste-ready Claude Code prompt.
5. Claude Code implementation occurs only after sponsor design approval, independent wiring audit and explicit implementation authorization.
6. The accepted shared shell is inherited, not redesigned.
7. No provider, policy, legal value, risk weight, SLA, role, route or backend behavior may be invented.

## Module structure

| Chapter | CDs | Design family | Reason for grouping |
|---|---|---|---|
| 1 | CD-004 | Admin foundation | Establishes the control-plane home, Admin density, health grammar and inherited shell boundary |
| 2 | CD-005–006 | Regulation governance | Library/detail pair over the same regulation route and lifecycle |
| 3 | CD-007–009 | Inspection definition | Items feed package versions and the package/form designer |
| 4 | CD-010–011 | Enforcement governance | Violation catalogue and penalty mapping share legal provenance and the current implementation surface |
| 5 | CD-012–013–016 | Workflow and operational rules | Workflow definitions, guards, notifications and SLA effects; CD-016 route/provider gaps remain explicit |
| 6 | CD-014 | Risk configuration | Specialized reproducibility, provenance and simulation interaction |
| 7 | CD-015 | GIS and geofence studio | Specialized spatial, provider, geometry and non-map-accessibility requirements |
| 8 | CD-017–019 | Platform governance | Effective access, localization governance and immutable audit; CD-018/019 need acceptance addenda |

Do not generate a later chapter until the preceding chapter has completed its mandatory review iteration and any P0/P1 correction.

## Mandatory design cycle per chapter

1. Repository and contract discovery.
2. Route, object, lifecycle and backend-truth memo.
3. Complete direct-to-Claude-Design prompt.
4. Claude Design R1 visual design and handoff package.
5. Mandatory Codex design review regardless of apparent quality.
6. One consolidated correction prompt covering P0/P1 and material premium-quality drift.
7. Claude Design R2.
8. Sponsor approval or block.
9. Independent wiring audit.
10. Only then may a separate implementation authorization activate the Claude Code prompt.

## Premium quality gate

Every individual CD must independently prove:

- decision superiority over the current screen;
- inspection/control-plane specificity rather than generic CRUD;
- family continuity with the frozen Saqeel shell and tokens;
- no more than one justified screen-specific signature pattern;
- three equal-fidelity hypotheses for complex primary decision zones;
- realistic populated and hard-case content;
- all contract-required states and negative paths;
- Arabic-first full-document RTL with realistic long strings and mixed-direction identifiers;
- dark/light semantic equivalence;
- desktop and relevant constrained-width behavior;
- keyboard, focus, screen-reader, non-color and reduced-motion behavior;
- runtime/provider/data truth;
- exact per-CD component map, state matrix, wiring map, acceptance checklist and Claude Code prompt.

Do not replace per-CD acceptance with one suite-level checklist.

## Known blockers and blind spots

### CD-016 / SCR-ADM-080

- Contract route `/admin/notifications` is not implemented.
- Current behavior is consolidated into `/admin` plus `NotificationBell` behavior.
- Provider adapters remain open.
- Design may proceed route-neutrally, but route ownership, activation, provider delivery and SLA policy remain `HANDOFF_BLOCKED` until proven.

### CD-018 / ADM-LOCALIZATION

- Supplemental screen rather than a governed catalogue row.
- Canonical persona/approval contract needs reconciliation.
- A dedicated acceptance addendum is required before visual generation.
- Do not invent automated translation quality or machine approval.

### CD-019 / ADM-AUDIT

- Supplemental screen rather than a governed catalogue row.
- Retention, export, masking and tamper-evidence presentation require explicit truth boundaries.
- A dedicated acceptance addendum is required before visual generation.
- The UI cannot itself prove backend immutability.

### Shared worktree

- Repository was on `main` with a dirty worktree at handoff creation.
- Observed unrelated changes included project-memory audit output, immediate-visit screenshots and `apps/web/.next-stale-backup/`.
- These belong to other work and must not be edited, staged, deleted, reset, cleaned or absorbed.

## Parallel ownership boundary

The Admin conversation may read the complete repository.

The Admin conversation may write only beneath:

`${INSPECTION_DOCS_ROOT}/05_UI_UX_AND_STORYBOARDS/outputs/claude-design-approval-pack/admin-control-plane-suite/`

Permitted outputs include:

- Admin master foundation brief;
- per-chapter Claude Design prompts;
- per-CD design reviews and correction prompts;
- acceptance addendum proposals for CD-018/CD-019;
- route-decision proposals for CD-016;
- Admin status and provenance records.

The Admin conversation must not edit:

- `apps/**`;
- `supabase/**`;
- shared shell implementation;
- `product-contract/CURRENT_STATE.md`;
- `product-contract/execution/CURRENT_SLICE.yaml`;
- `product-contract/execution/TASK_ROUTER.yaml`;
- `product-contract/execution/WORK_QUEUE.yaml`;
- `product-contract/sessions/SESSION_LEDGER.json`;
- global acceptance/evidence status;
- the shared 43-screen workbook/CSV;
- Web/CD-020..CD-031 prompts or outputs;
- any pre-existing dirty file.

If a global contract or matrix correction is needed, record it as a proposal inside the Admin output directory. The coordinating conversation applies it later after collision review.

## Git and implementation boundary

This handoff authorizes design documentation only.

Do not:

- implement application code;
- create or edit migrations;
- mutate Supabase;
- run deployment;
- commit, push, merge or modify `main`;
- discard or clean the worktree;
- switch branches in the shared checkout.

After sponsor approval, implementation must use a separate clean worktree/branch and a separate explicit authorization. It must not begin in this dirty shared checkout.

## Parallel safety assessment

- **High safety:** Admin design-only work, isolated output directory, no global-record edits.
- **Moderate risk:** both conversations update the global matrix, current state, work queue or shared shell documentation.
- **High risk / prohibited:** both conversations edit application, Supabase or tests in the same checkout.
- **Safe future implementation model:** clean dedicated worktree per approved Admin vertical slice, with independent wiring audit and controlled reconciliation.

Parallel work must stop immediately if the Admin task needs to edit a file owned by the active Web lane.

## Required first outputs from the Admin conversation

1. `ADMIN_MASTER_FOUNDATION_V1.md`
2. `ADMIN_QUALITY_GATE_V1.md`
3. `ADMIN_COMPONENT_INHERITANCE_LEDGER_V1.md`
4. `CHAPTER_01_CD-004_CLAUDE_DESIGN_PROMPT_R1.md`
5. `ADMIN_STATUS.yaml`

The CD-004 prompt must be pasted directly into Claude Design. Claude Design must return the design and a paste-ready Claude Code implementation prompt labelled not executable until sponsor approval.

## Exact ready-to-paste resume prompt

> Continue the Saqeel MVP1 Admin Control Plane design programme from `/Users/vikramindla/Documents/GitHub/Inspection`. Read `AGENTS.md`, then `product-contract/sessions/HANDOFF_2026-07-14_ADMIN_CONTROL_PLANE_PARALLEL_START.md`, then every file listed in its read order and the machine ownership contract at `${INSPECTION_DOCS_ROOT}/05_UI_UX_AND_STORYBOARDS/outputs/claude-design-approval-pack/admin-control-plane-suite/PARALLEL_OWNERSHIP.yaml`. This is a parallel DESIGN-ONLY lane for CD-004..CD-019. The active Web/CD-025+ lane continues elsewhere. Do not edit application code, Supabase, the frozen shared shell, global current-state/router/queue/ledger/acceptance files, the shared 43-screen workbook/CSV, Web prompts, or any existing dirty file. Write only under `${INSPECTION_DOCS_ROOT}/05_UI_UX_AND_STORYBOARDS/outputs/claude-design-approval-pack/admin-control-plane-suite/`. First produce `ADMIN_MASTER_FOUNDATION_V1.md`, `ADMIN_QUALITY_GATE_V1.md`, `ADMIN_COMPONENT_INHERITANCE_LEDGER_V1.md`, `CHAPTER_01_CD-004_CLAUDE_DESIGN_PROMPT_R1.md`, and `ADMIN_STATUS.yaml`. Treat CD-004 as the foundation and do not generate CD-005+ yet. Preserve the eight-chapter plan and the mandatory R1 review/correction/R2 cycle. Highest premium UI/UX, Arabic-first RTL, dark/light, responsive, accessibility, runtime truth and per-CD wiring evidence are non-negotiable. Do not commit, push, merge, deploy, modify main, switch branches or clean the shared worktree.

## Status at handoff

`READY_FOR_PARALLEL_ADMIN_DESIGN_ONLY`
