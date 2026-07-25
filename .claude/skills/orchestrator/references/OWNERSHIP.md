# Ownership and routing

## The routing law

| Board channel | Cards | Who writes the code | Who orchestrates and verifies |
| --- | --- | --- | --- |
| `web` | 22 | **Claude Code** | Claude Code |
| `admin` | 10 | **Codex** | Claude Code |
| `pwa` | 25 | **A different developer — out of scope** | nobody here |

Set by the Product Owner on 2026-07-26: *"only claude code to work on Saqeel web
pages and codex to work on admin pages"*, and PWA assigned to a separate
developer.

The two reference cards `webref` and `pwaref` are documentation artefacts, not
shippable routes. They have no `code`/`wiring` lane. Never "implement" them.

### PWA is a hard stop

If the resolved card's channel is `pwa`:

1. Report the card's current board state and pending items.
2. State that PWA is owned by another developer.
3. Stop. Do not edit any file under `apps/web/src/app/(app)/field/**`, do not
   touch `designs/pwa/**`, and do not move a PWA lane number.

The one exception is read-only work the user explicitly asks for — reading the
board, reading a design, reporting status.

## Web cards → Claude Code

Work in the card's own worktree. Check `git worktree list` first: many cards
already have one (`~/Developer/Inspection-<card>-cc`, branch `saqeel/<card>`).
Resume the existing worktree rather than opening a rival branch.

If none exists:

```bash
git worktree add ~/Developer/Inspection-<card>-cc -b saqeel/<card> main
```

## Admin cards → Codex

You do not write admin code. You write the packet, Codex writes the code, you
review the diff and run the browser proof. Use `mcp__codex__codex` (the `codex`
CLI is also installed as a fallback).

### Packet template

Give Codex everything; it does not share your context.

```
You are delivering SAQEEL card `<card-id>` on the ADMIN channel.

REPO:   /Users/vikramindla/Developer/Inspection
WORKTREE: <path>   BRANCH: saqeel/<card>
SPINE:  status/saqeel-status.json
DESIGN: designs/admin/<designPage>   (canonical — build from this file, never
        from the live render, a screenshot, or memory)
BASELINE: product-contract/web-admin-phase1/REQUIREMENT_BASELINE.csv

### Your card (verbatim from the spine)
<paste the card JSON from brief.py>

### Requirement rows that own this surface
<paste the baseline rows from brief.py>

### What is pending
<the card's pending[] entries, per lane>

### Files you may touch
<allowed_paths — nothing else>

### Hard rules
- Design-system tokens only. No hex, no rgb()/hsl(), no Tailwind colour
  utilities, no colour constant maps. Let components own their colour.
- EN/LTR and AR/RTL both.
- Never invent a policy value, threshold, SLA, provider or legal rule. If a
  value is not governed, render "Not configured".
- Real wiring against Supabase. A permanent mock is not a completion.
- NEVER run `next build`/`npm run build` in apps/web while a dev server holds
  apps/web/.next — it corrupts the cache and hangs the server. Use
  `npm run typecheck`.
- Do not touch files owned by another card.
- Do not push to main. Do not merge anything.

### Done means
The route works in Google Chrome against real data under a signed-in account,
with no P0/P1 open. Report the diff and what you verified; I run the browser
gate.
```

### After Codex returns

You own the verdict. Do not accept the claim:

1. Read the actual diff (`git -C <worktree> diff`).
2. Grep the diff for bare colours, mocks, invented values, and touched files
   outside the fence.
3. Run the browser gate yourself (`PHASES.md` §Browser gate).
4. Verdict: `ACK` (evidenced), `RETURNED` (specific defects, re-issue the
   packet), or `BLOCKED` (needs a decision the contract does not carry).

Only an `ACK` moves a lane number.

## Path fencing

One card, one file set. Before writing, confirm no other live lease claims the
path — `product-contract/execution/CURRENT_SLICE.yaml` lists granted leases with
their `allowed_paths`. Two agents in the same file is the failure mode this
system exists to prevent.

## Escalation

Stop and ask the Product Owner when:

- A requirement, field, rule, permission, state, or audit event would have to be
  removed or weakened to ship.
- The design and the requirement baseline disagree.
- A governed value does not exist anywhere in the contract.
- The work needs a push or merge to `main`.
