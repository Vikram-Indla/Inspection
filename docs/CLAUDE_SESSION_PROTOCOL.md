# Claude/Fable Session Protocol

## Start
Use `/inspection-session-start` or follow the resume protocol. Do not begin from a vague “continue”.

## Work
One approved current slice per session. Use stable IDs. Load only named context.

## End
Use `/inspection-session-handoff`. Update ledger, current state, queue, acceptance and evidence. Record the exact next prompt.

## Context compaction
Hooks write a checkpoint before compaction and log the compact summary after it. The root CLAUDE.md remains the persistent project instruction.

## Cloud sessions
Auto memory is machine-local and is not trusted for cross-environment continuity. The repository files and ledger are the cross-session memory.
