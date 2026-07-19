# Inspection Premium UI/UX — Start Here from Any Account

## Portability rule

Every work-package prompt in this folder now contains its own complete absolute-path header. A different account on this same Mac may start from the individual `WP-XX` prompt without depending on earlier chat history or this file. Local CLI agents read the paths directly. Browser agents must receive uploads of the files identified by those paths and must report what they actually opened.

## Stable paths

- Canonical repository: `/Users/vikramindla/Developer/Inspection`
- Command-centre prompts: `/Users/vikramindla/Developer/Inspection/design/claude-design-mvp1/operationalization/command-center-20260719`
- Compiled programme plan: `/Users/vikramindla/Developer/Inspection/design/claude-design-mvp1/operationalization/premium-redesign-20260719`
- Source documents: `/Users/vikramindla/InspectionOps/MIM_Inspection_MVP1_Historical_Archives_v3/MIM_Inspection_MVP1_COMPLETE_DOCUMENTATION_DUMP_v2/01_SOURCE_BASELINE`
- Retired repository, never use: `/Users/vikramindla/Documents/GitHub/Inspection`

## Current sequence

Ready to start in parallel:

- `WP-01` Codex — screenshots, per-screen UI/UX findings and design-system requirements.
- `WP-03` ChatGPT — onboarding, video and Persona Academy research pack.
- `WP-04` Claude Chat — Minister/Leadership dashboard, map/list and AI research pack.

Waiting:

- `WP-02` Claude Design waits for WP-01 evidence.
- `WP-05` and `WP-06` wait for sponsor-approved `DESIGN_SYSTEM_LOCK.yaml`.
- `WP-07` waits for accepted onboarding and Minister designs.
- `WP-08` waits for the design-system lock.

## Universal resume prompt for a local Codex or Claude Code account

You are joining the Inspection Premium UI/UX Command Centre on the same laptop.

Do not rely on chat history. Read these local files before taking any action:

1. `/Users/vikramindla/Developer/Inspection/design/claude-design-mvp1/operationalization/command-center-20260719/00_START_HERE_NEW_ACCOUNT.md`
2. `/Users/vikramindla/Developer/Inspection/design/claude-design-mvp1/operationalization/command-center-20260719/00_WORK_PACKAGE_SEQUENCE.md`
3. `/Users/vikramindla/Developer/Inspection/design/claude-design-mvp1/operationalization/premium-redesign-20260719/MASTER_UIUX_OPERATIONALIZATION_PLAN.md`
4. The exact `WP-XX` prompt assigned to this session.
5. `/Users/vikramindla/Developer/Inspection/AGENTS.md` and its mandatory session-start read order.

The canonical repository is `/Users/vikramindla/Developer/Inspection`. Never use the retired Documents/GitHub checkout.

Do not edit the programme Excel ledger. The master-controller Codex session is the only ledger writer. Write only the immutable outputs required by your assigned work package.

Before beginning, report:

1. assigned work-package ID;
2. exact source files and repo authority read;
3. branch, commit and dirty state if using the repository;
4. dependencies and blockers;
5. outputs you will produce;
6. prohibited areas you will not change.

Then execute only the assigned work package and return its required handoff.

## Browser-account rule

ChatGPT, Claude Chat and Claude Design in a browser cannot read local paths merely because the prompt names them. Upload:

1. this start-here file;
2. the assigned WP prompt;
3. the four compiled programme-plan files;
4. the source BRD/workbooks/storyboard required by that WP;
5. current screenshots/evidence required by that WP.

Do not allow the browser agent to claim it read a file that was not uploaded or connected.
