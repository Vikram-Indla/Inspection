# SAQEEL Control Board (V5 §30.3)

> Generated from state files + git. This is the single file supervision reads.
> Snapshot: 2026-07-25 · base HEAD `3eebbf86` · branch `saqeel/os-v5-cutover`
> · worktree `~/.saqeel-os-cutover` (isolated)
> **Programme queue is FROZEN at the cutover (GATE-SAMPLING-RATE, §0.1.8).**

## Lanes

| Lane | Actor | State | Packet | Last artifact | Lease | Blocked on |
|---|---|---|---|---|---|---|
| `orch-w1` | Claude Orchestrator (op: khan.jahanara@gmail.com) | RUNNING | PKT-CUTOVER-V5-001 | this cutover | none (§34.1) | GATE-SAMPLING-RATE |
| `orch-r1` | Claude Orchestrator | IDLE | — | — | none | — |
| `cd-w1` / `cd-r1` | Claude Design | NOT PROVISIONED | — | — | — | GATE-WORKFORCE-SESSIONS + design MCP OAuth |
| `ba-w1` / `ba-r1` | Claude Build A | NOT PROVISIONED | — | — | — | GATE-WORKFORCE-SESSIONS |
| `bb-w1` / `bb-r1` | Claude Build B | NOT PROVISIONED | — | — | — | GATE-WORKFORCE-SESSIONS |
| `ver-w1` / `ver-r1` | Claude Verifier | NOT PROVISIONED | — | — | — | GATE-WORKFORCE-SESSIONS |
| — | ChatGPT (advisory) | NOT PROVISIONED | — | — | — | — |

## Write leases (cap 3, ≤1/module)
None held under V5. `coordination/locks/` + `coordination/claims/` were empty at cutover.
Shared origin checkout has concurrent NON-V5 Codex/Claude iPad worktrees (not under V5
governance until the adoption CC is signed).

## Requirement figures (V5 §4) — split by independence (§35.6)
Not recomputed this cutover. Prior programme evidence stands under legacy authority;
per §0.1.5 rows with stale evidence drop to `built` and re-enter the gate. A full
478-row re-verification is a required post-signature cutover task, not done here.

| Figure | Value |
|---|---|
| 1 · built / 478 | carried (see SAQEEL_REQUIREMENT_SCORECARD) |
| 2 · verified / 478 (`external` \| `blind-internal` \| `sponsor-sampled`) | **re-classing pending** |
| 3 · accepted / 478 | carried, subject to §0.1.5 re-verify |

## Open blocking decisions
- **GATE-SAMPLING-RATE** (sponsor) — blocks entire queue. No default (§0.1.8).
- **GATE-INDEPENDENCE-ACCEPTANCE** (sponsor) — blind-internal is weaker than external.
- **GATE-WORKFORCE-SESSIONS** (operator+sponsor) — need ≥5 separate sessions.
- **DEC-032** (P0) — submission digest() trigger; blocks all real submissions.

## Next action
Sponsor resolves GATE-SAMPLING-RATE and signs CC-SAQEEL-OS-V5-ADOPTION-001.
Until then the Orchestrator holds; no build packet issues.
