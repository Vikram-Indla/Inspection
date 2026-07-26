# Ownership and routing

## Ownership is declared, not assumed

`.claude/skills/orchestrator/config.json` is the single declaration. Both
`brief.py` and `board.py` read it, so it is the only thing you change to hand a
channel over:

```json
{
  "channelOwners": {
    "web": "claude-code",
    "admin": "codex",
    "pwa": "other-developer"
  }
}
```

| Value | Meaning |
| --- | --- |
| `claude-code` | This CLI writes the code itself. |
| `codex` | This CLI writes the packet; Codex writes the code; this CLI verifies. |
| `other-developer` | Out of scope. Read-only, lanes frozen, no file edits. |

## The routing law, as configured today

| Board channel | Cards | Owner | Who verifies |
| --- | --- | --- | --- |
| `web` | 22 | **Claude Code** | Claude Code |
| `admin` | 10 | **Codex** | Claude Code |
| `pwa` | 25 | **A different developer — out of scope** | nobody here |

Set by the Product Owner on 2026-07-26: *"only claude code to work on Saqeel web
pages and codex to work on admin pages"*, and PWA assigned to a separate
developer.

The two reference cards `webref` and `pwaref` are documentation artefacts, not
shippable routes. They have no `code`/`wiring` lane. Never "implement" them.

### An out-of-scope channel is a hard stop

If the resolved card's channel is owned by `other-developer`:

1. Report the card's current board state and pending items.
2. State who owns it.
3. Stop. Do not edit its files, do not touch its designs, do not move its lanes.

`board.py set` refuses the write, so this is enforced and not merely documented.
The one exception is read-only work the user explicitly asks for — reading the
board, reading a design, reporting status.

## Taking a channel

Only the Product Owner decides this. Never flip a value in `config.json` because
the work looked available.

When they do hand you a channel — say PWA:

1. Set `channelOwners.pwa` to `claude-code` (or `codex`).
2. Confirm the handover is real: the other developer has stopped, their work is
   committed and pushed, and no live lease in
   `product-contract/execution/CURRENT_SLICE.yaml` still names them for a PWA
   card. Two owners on one channel is exactly the collision this prevents.
3. Re-read the PWA cards with `brief.py` — their `pending[]` was written by the
   previous owner and states what they know, not what you have verified.
4. Work it exactly like any other channel: same parity gate, same browser gate,
   same evidence law.
5. Set it back to `other-developer` when you hand it back.

### What is different about the PWA channel

It is a field application, not a narrow web page — the rules that bite are
different from web and admin:

- **Routes** live under `apps/web/src/app/(app)/field/**`. Designs are
  `designs/pwa/pwa/*.dc.html` (note the doubled directory), and in Claude Design
  they are under `pwa/`.
- **It is offline-first.** Drafts, outbox, sync and conflict resolution are
  first-class behaviour, not edge cases. Never silently overwrite an
  offline/server conflict.
- **Immutable submit.** A submitted version is frozen. A statement or completion
  view must never allow an edit.
- **The iPad is the target**, not a narrowed desktop. Touch targets, safe-area
  insets, the sticky header and the persistent tab bar are part of parity.
- **The login card is shared with the web console.** `FieldLoginClient` is
  composed into `/login` beside the atlas — a change to the field card changes
  the console sign-in too. Check both.
- **The browser gate still applies**, and it is still Google Chrome: run the
  field routes at iPad widths, in EN/LTR and AR/RTL, signed in as
  `inspector@mim.gov.sa`.

## Cards owned by Claude Code

Work in the card's own worktree. Check `git worktree list` first: a card may
already have one (`~/Developer/Inspection-<card>-cc`, branch `saqeel/<card>`).
Resume the existing worktree rather than opening a rival branch.

If none exists:

```bash
git worktree add ~/Developer/Inspection-<card>-cc -b saqeel/<card> main
```

Never work directly in `/Users/vikramindla/Developer/Inspection`. Other sessions
run there and commit the whole working tree on their own schedule; anything you
leave in that tree will end up in someone else's commit.

## Cards owned by Codex

You do not write admin code. You write the packet, Codex writes the code, you
review the diff and run the browser proof. Use `mcp__codex__codex` (the `codex`
CLI is also installed as a fallback).

### Packet template

Give Codex everything; it does not share your context.

```
You are delivering SAQEEL card `<card-id>` on the <CHANNEL> channel.

REPO:   /Users/vikramindla/Developer/Inspection
WORKTREE: <path>   BRANCH: saqeel/<card>
SPINE:  status/saqeel-status.json
DESIGN: designs/<channel>/<designPage>  (canonical — build from this file, never
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
- Before any admin design change, ask a neighboring repository-aware
  ChatGPT/Codex session for at least 20 concrete recommendations. Score them
  for user impact, permission safety, regression risk, accessibility and
  feasibility; send only the ranked top 10 and measurable acceptance criteria
  to Claude Design. Keep this process prose out of the Claude Design prompt.
- No design recommendation may remove or weaken an authorized destination,
  deep link, route guard, RBAC/RLS rule, workflow transition, immutable-version
  rule, audit/data-truth behavior, responsive state, accessibility behavior, or
  EN/AR RTL outcome.
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
