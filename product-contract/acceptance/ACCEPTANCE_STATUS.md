# Acceptance Status

G4 acceptance is pending installation verification.

Pass criteria:
1. One canonical repository is used by Git, Obsidian and Claude.
2. No duplicate Obsidian copy exists.
3. Root CLAUDE.md is loaded in a fresh and resumed session.
4. Current slice is injected at SessionStart.
5. Prohibited destructive actions are blocked by hook.
6. Session ledger is append-only and usable for fresh-session resumption.
7. Auto memory is confirmed advisory and cannot override the contract.
