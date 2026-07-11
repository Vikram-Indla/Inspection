# Memory Architecture

## Authority model
1. Git-backed product-contract files: authoritative.
2. Obsidian: human navigation over the same files.
3. CLAUDE.md and rules: persistent agent guidance.
4. Skills: task procedures loaded on demand.
5. Hooks: lifecycle enforcement and audit.
6. Auto memory: advisory local learnings only.
7. Chat history: non-authoritative.

## Why this prevents drift
- All sessions read the same current state and slice.
- Every task carries stable IDs.
- Every session ends with an append-only handoff.
- Compaction writes a checkpoint.
- Destructive or premature actions can be blocked.
- A fresh session can resume from disk.
