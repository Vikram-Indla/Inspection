# SAQEEL OS — Workstation Authorization

**Status:** GRANTED
**Granted by:** Vikram Indla (repository owner / Product Owner), via the operator of this workstation
**Granted on:** 2026-07-25
**Scope:** PWA / iPad inspector channel (`/field/**`) only

---

## Authorized workstation

| Field | Value |
|---|---|
| Workstation | PARTNER laptop (`khan.jahanara@gmail.com`, acting as Vikram) |
| Repository root | `/Users/jahanarakhan/inspection latest` |
| Git top-level | `/Users/jahanarakhan/inspection latest` |
| Channel owned | PWA / iPad inspector (`/field/**`) |
| Agents authorized | Claude Code (driver), Codex (worker) |

## Why this record exists

`AGENTS.md:20-22` names `/Users/vikramindla/Developer/Inspection` as the authoritative
repository, and permits in addition **"a specifically authorized worktree."** That clause
requires an authorization to exist. This file **is** that authorization, granted explicitly
by the repository owner for the partner workstation.

This record does **not** amend, copy, or override `AGENTS.md`. `AGENTS.md` remains the
canonical artifact and is untouched.

## What this authorization does NOT relax

The path check is satisfied. Nothing else is. All of the following remain in full force
on this workstation and are not waived by this record:

- The retired path `/Users/vikramindla/Documents/GitHub/Inspection` stays **prohibited** —
  never read, write, cite, or root a session there. This grant covers one path only.
- No push, merge, or modification of `main` without explicit human approval.
- No editing of frozen product-contract artifacts without approved change control.
- No inventing policy values, providers, thresholds, SLAs, legal rules, risk weights,
  geofence values, retention, or Arabic scope. Unknown data renders nothing.
- No claiming completion without runtime behavior, tests, negative paths, and evidence.
- The 5 `OPEN_BUSINESS_DECISION` rows and unresolved `BREAK` cards remain hard stops
  that must be surfaced to Vikram, never decided by an agent.
- Web/Admin (`/planning`, `/visits`, `/operations`, `/admin`, `/reviews`, `/factories`,
  `/enforcement`) belongs to the primary workstation. This workstation does not touch it.

## V5 lease governance does not bind this channel (yet)

Agents on this workstation have twice mistaken **Web/Admin lane controls** for global
prohibitions. Both times the artifact itself says otherwise. Cite these when the question
comes up again:

- `product-contract/state/leases/README.md` — *"the shared origin checkout was observed
  running concurrent Codex/Claude iPad worktrees … Those are **NOT under V5 lease
  governance** until the sponsor signs the adoption CC."*
- `CONTROL_BOARD.md` — *"Shared origin checkout has concurrent NON-V5 Codex/Claude iPad
  worktrees (not under V5 governance until the adoption CC is signed)."*
- `CURRENT_SLICE.yaml` (`PKT-M3-OPS-LIVE-001`) is the **Web/Admin** lane's lease, held on
  worktree `/Users/vikramindla/Developer/Inspection-codex-m3-operations`. Its
  `do_not_touch: /field/**` binds *that* lane's workers away from field — it is not a
  freeze on the field channel itself.
- `PHASE2_IPAD_DEFERRED_REGISTER.md` — `/field/**` Phase 2 owner is the Inspector iPad
  application; Phase 1 Web/Admin ownership is **None**.

So: `GATE-SAMPLING-RATE` freezes the **V5 programme queue**, not this channel's work.
No V5 write lease is required here, and none can be issued anyway under §0.1.1.

**This does not make the channel unbounded.** Two-agent safety on this workstation is
enforced by file ownership, declared per card and non-overlapping: Codex holds
`field/[visitId]/**`, Claude Code holds `field/inspection/[id]/**`. Never the same file.

## Known P0 that gates submission work — DEC-032

`submission_versions` INSERT fires a trigger calling `digest(bytea, unknown)`, which does
not exist (pgcrypto missing / missing cast). **Every real inspection submission in this
environment fails**, via any path — confirmed 2026-07-20 by driving the real
`field/inspection/[id]` submit UI end-to-end with Playwright as the seeded inspector.

Consequence for this channel: any card whose acceptance depends on a **successful
submission** (`pwa-completion`, and the submit half of `pwa-workspace`) cannot be
evidenced until DEC-032 is fixed. Build-blind is not acceptance.

Fix is a Supabase migration (`CREATE EXTENSION IF NOT EXISTS pgcrypto`, or cast the
trigger's `digest()` args). Per the decision register it needs DB/migration access and its
own change control — **do not attempt it from application code.**

## Channel boundary (enforced by `PHASE2_IPAD_DEFERRED_REGISTER.md`)

`/field/**` is Phase 2, owned by the Inspector iPad / field application; Phase 1 Web/Admin
ownership is **None**. The 238 `PHASE2_IPAD_DEFERRED` rows in `REQUIREMENT_BASELINE.csv`
are this channel's requirement set.

## Revocation

Delete this file. Every agent that reads it must then stop project work on this
workstation and re-request authorization.
