# Claude Design / Codex Wiring Ownership Boundary

Effective date: 2026-07-24  
Sponsor direction: Vikram Indla  
Status: ACTIVE — no application implementation lease is currently active

## Claude Code ownership

Claude Code exclusively owns all design-side work:

- Claude Design connectivity and authentication;
- complete design inventory and stable page identity/revision records;
- design content reads, semantic hashes, semantic deltas, and change tracking;
- design-to-code candidate mapping;
- corrected design consent packets;
- sponsor-approved changes inside Claude Design;
- design-side state, evidence, and handoff artifacts in Claude Code's own worktree.

Claude Code must not modify:

- application product code;
- APIs or backend;
- Codex's worktree or `.codex-review` files;
- stashes;
- `main`;
- `setup/Inspection`.

Claude Code does not activate or receive the application implementation lease.

## Codex ownership

Before an implementation lease, Codex owns only:

- independent validation of Claude Code's corrected mapping and deltas;
- route, component, service, API, permission, test, and negative-path tracing;
- reviewer recommendations and evidence under `.codex-review`.

Codex must not:

- build a competing Claude Design connection, inventory, revision tracker, or watcher;
- edit Claude Design;
- write into Claude Code's worktree;
- modify application code without a separate sponsor-approved lease.

After a specific sponsor-approved lease names the exact action and files, Codex may own:

- bounded application wiring;
- associated automated tests and negative paths;
- application runtime evidence;
- implementation handoff back to Claude Code for design comparison.

## Collision rule

No file may be jointly owned. If a leased application file overlaps active Claude Code work, both CLIs stop work on that file until the sponsor records a reassignment.

## Current position

- Claude Code has completed a corrected design-side mapping pass and acknowledged this boundary in the active Design to Code session.
- Codex remains read-only toward application code while it independently re-reviews those corrected artifacts.
- No application implementation lease is active.
