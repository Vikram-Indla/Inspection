# Change-Tracking Status — Dry-Run

## Native event mechanism
**Disproven, not just unconfirmed.** The full `mcp__claude-design__*` tool
family was enumerated (see `connection-proof.md`); no subscription, webhook,
or push-style tool exists. Every retrieval is a pull (`list_files`,
`read_file`). This is exhaustive evidence, not an assumption.

## Fallback mechanism (documented, not installed as a running service)
Read-only polling, matching the handoff pack's own fallback design:

1. Call `list_files(project_id, depth=-1)` on `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`.
2. For each top-level `*.dc.html` path, compare its `etag` against the last-recorded value in `state/<page-id>.json` (keyed by governed design ID where one exists, else by path).
3. Changed etag → new queue entry (`state: DESIGN_CHANGED`) → triggers delta generation (Step 6) → `AWAITING_CONSENT`. Never writes application code.
4. Unchanged etag → no-op, no duplicate queue entry (idempotency proven manually this session: re-listing the same project twice in this conversation returned identical etags for unrelated files, e.g. `SAQEEL PWA-Field Login.dc.html` etag `1784884213895548` was stable across the first and current pass).

## What was actually run this session
One **manual** scan cycle (not an installed watcher): `list_files` →
cross-referenced against the governed `DESIGN_ROUTE_MAP.csv` →
`design-to-code-map.csv` → one page (`WA-DES-038`) carried through to a full
delta + consent packet. This proves the mechanism end-to-end for one page;
it does not prove unattended repeated operation.

## Not built this session (explicitly out of scope)
- A running `launchd` (or any) scheduled process. No polling interval is
  active. Nothing executes without you invoking a scan manually (or a future
  session doing so).
- A semantic (structure-aware) normalizer/hash. `etag` is the only revision
  marker in use — it changes on *any* edit, including non-semantic ones
  (whitespace, comments, generated IDs), so it will over-detect compared to a
  true semantic hash. This is disclosed, not hidden: a real semantic
  normalizer is future work, not implemented here.
- Duplicate suppression logic as running code — demonstrated conceptually
  above (etag comparison), not implemented as an executable watcher script.

## Status: `DRY_RUN` / `MANUAL_ONLY`
No automatic process is running. Nothing will re-scan `SAQEEL Design System`
unless you or a future session explicitly triggers it.
