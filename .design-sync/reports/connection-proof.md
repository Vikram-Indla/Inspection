# Claude Design Connection Proof — SAQEEL Design System

> **CORRECTION 2026-07-24 (Codex re-review):** the "97 top-level `.dc.html`
> files" figure below is superseded. Final resolved count is **98** = 97
> `.dc.html` + 1 top-level `.html` (`SAQEEL Executive Overview.html`). See
> `reports/inventory-reconciliation.md` for the full resolution and
> `inventory/design-pages.json`/`.csv` for the corrected 98-row machine
> inventory. Nothing else in this connection-proof report is affected.

## Verdict: **CONNECTED**

Machine-readable retrieval proven for all four required elements: project
identity, page identity, page content, and a reproducible revision marker.
Not proven: native change events (confirmed absent, not just unconfirmed).

## Evidence

| Check | Result | Evidence |
|---|---|---|
| Claude Design authentication status | Authenticated, implicit in this Claude Code session | `mcp__claude-design__list_projects` returned 21 projects without any auth prompt |
| Claude Design MCP availability | Available | Tool family `mcp__claude-design__*` (list_projects, get_project, list_files, read_file, list_comments, get_conversation, write_files, copy_files, delete_files, create_project, render_preview, ack_comments, put_conversation, create_support_js, member/sharing tools) — read tools exercised, write tools not exercised (out of scope) |
| `/design-login` skill | **Does not exist** | No match in project `.claude/`, user `~/.claude/`, or full skill listing this session |
| `/design-sync` skill | **Does not exist** | Same search, same result |
| Project access to `SAQEEL Design System` | Proven | `get_project("5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61")` → `{"name":"SAQEEL Design System","sharing":{"scope":"org","view_mode":"team"},"url":"https://claude.ai/design/p/5e8154ad-..."}` |
| Stable project identifier | Proven | `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61` (also confirmed as the correct project among two name-alike decoys — see below) |
| Accessible page count | Proven, with caveat | 97 top-level `.dc.html` files retrieved via `list_files(depth=-1)`; see `inventory-reconciliation.md` for the 97-vs-98 discrepancy |
| Page names | Proven | Full list in `inventory/design-pages.json`/`.csv` |
| Stable page identifiers where exposed | Partial | No node/component-level ID is exposed by the MCP; the file **path** (e.g. `SAQEEL PWA-Field Login.dc.html`) is the only page-level identifier, and it is stable as long as the page isn't renamed |
| Revision identifiers or timestamps where exposed | Proven, as a proxy | Every `list_files`/`read_file` call returns an opaque numeric `etag` per file that changes on edit (confirmed: `SAQEEL PWA-Field Login.dc.html` etag `1784884213895548` is the newest among 4 login-adjacent files, consistent with "most recently edited") — usable as a revision marker, not a true semantic-content hash |
| Whether prior revisions can be retrieved | **Not proven / likely unsupported** | No history/revision-list endpoint exists in the tool family; only current-state reads |
| Whether a native change event is available | **Disproven** | No subscription/webhook/push tool exists among `mcp__claude-design__*` — confirmed absent by exhaustive enumeration of the tool family, not by a failed attempt |

## Decoy projects (do not confuse with the target)

Two other projects share similar names and must not be used:
- `Saqeel` (`b3b548d2-923f-4dbd-a4bf-de8433417cad`) — only 3 `.dc.html` files (Design System, Web Dashboard, iPad Dashboard), no Field Login, no page-picker-style inventory.
- `Saqeel Design System` (`49c57df3-d852-46aa-bdec-a34e5ef70941`) — a component-library project (React components, tokens, patterns), not a page-inventory project.

Only `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61` ("SAQEEL Design System") matches the screenshot evidence (98-page picker, Field Login page) and is the target for this workflow.

## Limitations

- Reads are capped at 256 KiB per file (`read_file`); the largest page found (`SAQEEL Design System.dc.html`, 115 KB) is within this cap, so no page has been truncated so far.
- No semantic (structure-aware) hash exists yet — `etag` is a raw revision marker, not proof that two etags differ only in meaningful ways. Semantic diffing (Step 6) requires reading and structurally comparing content, not just etag comparison.
- Comment/conversation tools (`list_comments`, `get_conversation`) were not exercised this pass — no evidence yet on whether sponsor feedback loops through those channels.
