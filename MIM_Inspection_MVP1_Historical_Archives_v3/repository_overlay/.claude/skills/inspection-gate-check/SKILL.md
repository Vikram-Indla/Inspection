---
name: Inspection Gate Check
description: Verify a project gate against its pass criteria and evidence.
allowed-tools: Read Grep Glob Bash
---
# Procedure
- Identify the gate and pass criteria.
- Inspect all named evidence.
- Return exactly PASS, CONDITIONAL PASS, FAIL or BLOCKED.
- List missing evidence and the next allowed action.
- Never self-approve a business decision.
