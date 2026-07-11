---
name: Inspection Build Slice
description: Execute one approved implementation slice after G8 using requirement, screen, engine and acceptance IDs.
allowed-tools: Read Grep Glob Bash Edit Write
---
# Preconditions
- G8 is PASS.
- Current slice is approved and lists all required context.
# Procedure
Discover current code, map IDs, implement the smallest coherent slice, test positive and negative paths, capture evidence, rerun regression, update ledger.
