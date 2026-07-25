# Standing rule — every session must be VISIBLE

**Set by Vikram, 2026-07-25. Applies to the whole SAQEEL PWA implementation, not one turn.**

> "i need to see these sessions on the screen, remember this for this entire
> implementation all sessions should be visible sessions"

Invisible work is unverifiable work. If Vikram cannot see a session on screen, he
cannot tell a working agent from a hung one — which already happened twice today,
once with a stale Codex process idling at 0% CPU for 28 minutes, and once with a
prompt fragmented into ~15 messages that jammed a chat.

## Required surfaces

| Worker | Visible surface | How |
|---|---|---|
| **Codex** | a chat in the Codex desktop app, one per card | New chat → paste the card prompt → send |
| **Claude Code** | its own session/conversation, one per card | `spawn_task` chip → Vikram clicks → real session |

## Banned by default

- `codex exec` piped to a log file. It works, and it is invisible. Do not use it as
  the primary driver. `.saqeel/drive-card.sh` remains only for read-only
  investigations that produce a written finding, and even then say so out loud.
- Subagents spawned inside the orchestrator's own conversation for **build** work.
  Their output is invisible until they finish. Acceptable only for short read-only
  lookups.

## Hard constraint when typing into the Codex app

**Enter sends.** A prompt containing newlines is submitted line by line and shatters
into a dozen partial messages that the model then answers out of order. Compose every
Codex-app prompt as ONE single line — use ". " and " — " as separators, never `\n`.
This is not a style preference; it broke a session earlier today.

## One card = one session = one owner

Sessions are named for their card. Two sessions must never hold the same file. The
orchestrator declares the exclusive file set in every prompt and keeps the map.

`status/saqeel-status.json` is the one shared file. When more than two writers are
active, the orchestrator writes it on their behalf rather than letting four sessions
race on one JSON document (BS-3).

## Orchestrator's job

Claude Code (this session) orchestrates: picks cards, writes prompts, watches the
sessions, verifies output against the design and the data rules, commits, and updates
the spine. It should not be the one writing feature code while four builders run —
that is how file ownership gets violated.

Check what is live with `.saqeel/sessions.sh`.
