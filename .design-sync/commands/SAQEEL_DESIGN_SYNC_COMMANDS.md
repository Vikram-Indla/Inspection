# SAQEEL Design-Sync Commands — Specification (not yet installed)

These are specified here as documentation, **not installed as live
`.claude/commands` slash commands**. Installing real slash commands is a
repo-affecting change to Claude Code's command surface; per the same caution
applied to `/consent` earlier this session (see
`reports/claude-capability-audit.md`), that write needs your explicit
go-ahead separately from this discovery pass. Existing search confirmed no
name collision — no `/saqeel-design-*`, `/consent`, `/design-login`, or
`/design-sync` command exists anywhere in this Claude Code install today.

## `/saqeel-design-connect`
Runs Steps 1's checks (auth, MCP availability, project access, stable ID)
and writes/refreshes `reports/connection-proof.md`. Read-only.

## `/saqeel-design-inventory`
Runs Step 2: lists all pages via `list_files(depth=-1)`, writes
`inventory/design-pages.json`/`.csv` + `reports/inventory-reconciliation.md`.
Read-only.

## `/saqeel-design-map`
Runs Step 3: cross-references live inventory against
`product-contract/web-admin-phase1/DESIGN_ROUTE_MAP.csv` (read-only
reference, never edited) plus any accumulated `.design-sync` state, writes
`mapping/design-to-code-map.csv`/`.json` + `reports/unmapped-designs.md`.
Read-only.

## `/saqeel-design-status`
Reads `state/*.json` + `queue/design-change-queue.json`, prints a summary:
counts by `consent_status`/`implementation_status`/`verification_status`,
last scan time, queue depth. Read-only.

## `/saqeel-design-scan` (the central command)
1. Verify connection (re-run Step 1 checks, fail loudly if `BLOCKED`).
2. Re-list pages, compare each tracked page's `etag` against `state/<id>.json`.
3. For every changed etag: generate a delta (`deltas/<id>/<rev>/delta.md`), enqueue (`queue/design-change-queue.json`, state `AWAITING_CONSENT`), do **not** touch `accepted_revision` in state.
4. Never writes application code, never advances `accepted_revision`, never auto-approves.
5. Idempotent: an unchanged etag produces no new queue entry (see `reports/change-tracking-status.md` for the manual proof this session).

## `/saqeel-design-diff <page-id>`
Reads the latest queued delta for `<page-id>` and prints/renders it
(`deltas/<page-id>/<rev>/delta.md`). Read-only.

## `/saqeel-design-consent <page-id>`
Reads/creates `consent/<page-id>/<rev>/consent-packet.md`, presents it, and
records your decision (approve/reject/decide-later) back into that file's
`## Decision` section plus updates `state/<page-id>.json`'s
`consent_status`. This is the project-local stand-in for the missing
`/consent` skill — it does not implement anything, only records the
decision.

## `/saqeel-design-pause` / `/saqeel-design-resume`
No-ops today, since no watcher process is running (see
`reports/change-tracking-status.md`, status `DRY_RUN`/`MANUAL_ONLY`) — these
would only matter once an actual scheduled watcher exists. Specified for
forward compatibility, not because anything is currently running to pause.

## What none of these do
None of the above ever edit `apps/web/**`, never write to the Claude Design
project, never advance an `accepted_revision` without a recorded consent
decision, and never touch `product-contract/**` governed files. Application
implementation is a separate, explicitly-consented step not covered by any
command in this list.
