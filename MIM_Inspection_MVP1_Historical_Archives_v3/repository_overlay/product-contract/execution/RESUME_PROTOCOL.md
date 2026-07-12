# Resume Protocol

A new session must not begin with “continue”.

## Required start prompt
1. Read `CLAUDE.md`.
2. Read `product-contract/00_START_HERE.md`.
3. Read `CURRENT_STATE.md`, `GATE_STATUS.md`, `CURRENT_SLICE.yaml`, and `TASK_ROUTER.yaml`.
4. Read the task-specific context listed by the current slice.
5. Inspect Git branch, status, and last five commits.
6. State back:
   - task ID and gate;
   - requirements and acceptance IDs;
   - screens and engines;
   - dependencies and open decisions;
   - do-not-touch areas;
   - evidence required;
   - exact next actions.
7. Wait for approval when the slice says human approval is required.

## Required end-of-session handoff
Record branch, commit, files changed, tests, evidence, unresolved issues, decisions, next task, and a ready-to-paste resume prompt in `SESSION_LEDGER.json`.
