# Leases (V5 §16)

A lease is a lock with an expiry. Acquire by writing `leases/<resource-slug>.yaml`;
the write must fail if the file already exists (atomic). Overlapping globs are a
conflict the Orchestrator resolves before either holder starts.

## Schema
```yaml
resource: src/modules/<x>/**
holder: <actor>
packet_id: PKT-XXXX
acquired_at: <ISO8601>
ttl_minutes: 90
renewals: 0
max_renewals: 2
breaker: claude-orchestrator
```

## Rules
- TTL expiry auto-releases; an expired holder must stop writing, re-verify HEAD, re-acquire.
- Only the Orchestrator force-breaks a lease, and records why.
- WIP cap: ≤ 3 concurrent write leases total, ≤ 1 per module (§16).
- The Orchestrator (`orch-w1`/`orch-r1`) holds NO write lease on product code (§34.1).
- One session = one worktree. A write lease is scoped to the holder's own worktree,
  never the shared origin checkout.

## Current state at cutover (2026-07-25)
No V5 leases held. Legacy `coordination/locks/` and `coordination/claims/` were empty
(.gitkeep only) at cutover, so §0.1.2 re-registration had nothing to carry over.
No write lease may be granted until GATE-SAMPLING-RATE is resolved (§0.1.1 freeze).

NOTE: the shared origin checkout was observed running concurrent Codex/Claude iPad
worktrees (codex/ipad-phase1-audit-build, feat/ipad-630-*, codex/scr-ipad-6*). Those
are NOT under V5 lease governance until the sponsor signs the adoption CC.
