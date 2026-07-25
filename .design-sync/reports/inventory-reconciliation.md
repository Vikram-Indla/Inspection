# Design Inventory Reconciliation — SAQEEL Design System

Project `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`. Source: `list_files(depth=-1)`,
1440 total file entries returned in one call (all `type:"file"`; this store
is flat — "folders" are inferred from `/` in the path, not a real directory
type).

## Counts, not assumed

| Count | Definition | Included in page inventory? |
|---|---|---|
| **98** | Top-level `*.dc.html` (97) + top-level non-`.dc.html` `SAQEEL Executive Overview.html` (1) — Claude Design's live, editable "page" unit, identity convention corrected 2026-07-24 | **Yes** — this is the inventory in `inventory/design-pages.json`/`.csv` (`jq length` → 98, CSV → 99 lines incl. header) |
| 81 | Nested `*.dc.html` under `export-claude-code-sync/`, `export-inspector-pack/`, `export-non-inspector/` | No — point-in-time export snapshots, not live pages; listed for transparency, not double-counted |
| ~243 | All `.html`-suffixed files (pages + exports + `guidelines/*.html` + `patterns/*.html` fragments + `ui_kits/web/index*.html`) | No — `guidelines/*` and `patterns/*` are component/pattern reference fragments, not top-level pages; `ui_kits/web/index*.html` are rendered demo shells |
| 0 | Inaccessible pages | N/A — no `list_files` or `read_file` call failed or returned a permission error this session |
| 0 | Confirmed-archived pages | N/A — no archive/status metadata is exposed by the MCP to distinguish "archived" from "active"; not claimed either way |
| 1 | Suspected accidental duplicate | `SAQEEL Admin Lookups copy.dc.html` alongside `SAQEEL Admin Lookups.dc.html` — flagged, not resolved |
| 1440 | All files in the project (pages + components + CSS + fonts + uploads + screenshots + exports + planning docs) | No — reference only |

## The 97-vs-98 discrepancy — RESOLVED 2026-07-24

**Root cause found:** the original 97-count filtered on `.dc.html` suffix
only. One live top-level page, `SAQEEL Executive Overview.html`, is a plain
`.html` file (no `.dc.html` counterpart) — it was present in the raw
`list_files(depth=-1)` output from the very first call this session, just
excluded by the extension filter. It is a real, current page (etag
`1784633455496212`, 19504 bytes), not renamed/merged/deleted.

**97 top-level `.dc.html` + 1 top-level `.html` (Executive Overview) = 98**,
exactly matching the screenshot. Two other top-level `.html` files
(`SAQEEL PWA-Inspector Architecture.html`, `SAQEEL PWA-Inspector Journey
Mindmap.html`) also exist but are static-export duplicates of pages already
counted via their `.dc.html` originals — they don't add to the unique count.

Independent cross-check: Codex's own inventory review made the identical
extension-filtering mistake and also reported Executive Overview as
`NO DESIGN MATCH`/absent — both lanes missed it the same way, now corrected.

## Page-type classification (by name pattern; content read only for pages explicitly mapped)

- **Web/Admin candidates** (`SAQEEL Web *`, `SAQEEL Admin *`, `SAQEEL iPad Dashboard`, `SAQEEL Operations *`, `SAQEEL Portal`, `SAQEEL Dashboard Config`, `SAQEEL Web-Index`, etc.) — the channel this scope-reset targets.
- **PWA/Field channel** (`SAQEEL PWA-Field *`, 33 pages) — read-only reference per this session's scope; not mapped or modified.
- **Web console login family** (`SAQEEL Login.dc.html`, `SAQEEL Auth States.dc.html`) — web-channel, in scope for mapping, not yet content-read this pass.
- **Design system / meta** (`SAQEEL Design System.dc.html`, `Canvas.dc.html`, `SAQEEL Figma Parity Grid.dc.html`) — non-screen artefacts, excluded from screen mapping.
- **Planning/architecture, non-screen** (`SAQEEL Planning*`, `*Inspector Architecture`, `*Journey Mindmap`, `*Golden Journey`) — presumptively design-only by name, not confirmed by content read.

Full 98-row inventory with etag/size: `inventory/design-pages.json`
(`jq length` → 98), `inventory/design-pages.csv` (99 lines incl. header →
98 data rows). Both files include `SAQEEL Executive Overview.html` as of
2026-07-24 — added after Codex re-review confirmed it was missing from the
machine-readable inventory despite this report's text describing it.
