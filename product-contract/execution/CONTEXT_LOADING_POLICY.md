# Context Loading Policy

## Always loaded
- Root `CLAUDE.md`
- GATE_STATUS
- CURRENT_STATE
- CURRENT_SLICE
- OPEN_DECISIONS summary

## Loaded by task
- Only the process, screen, field, role, state, integration, design and acceptance files named in the current slice.

## Never rely on
- chat history alone;
- a previous session summary alone;
- Claude auto memory for scope or policy;
- Obsidian graph interpretation without source files;
- screenshots as a substitute for requirements.

## Context budget
Keep root instructions concise. Use path-scoped rules and skills for detailed procedures. Store large specifications in supporting files and load them only when the task requires them.
