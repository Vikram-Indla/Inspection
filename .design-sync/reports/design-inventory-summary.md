# Design Inventory Summary — SAQEEL Design System

> **CORRECTION 2026-07-24 (Codex re-review):** the 97-vs-98 discrepancy
> below is RESOLVED, not open — see `reports/inventory-reconciliation.md`.
> Final count is **98** (97 `.dc.html` + 1 `.html`, `SAQEEL Executive
> Overview.html`). The "mapping depth this pass" section below (single
> Field Login pilot) is also superseded — 46 pages are now at `high`
> mapping confidence, 7 at `medium`, 1 `low`, 44 correctly out-of-scope/
> non-screen. See `mapping/design-to-code-map.csv` for current state.

Project: `SAQEEL Design System`, id `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`.
Full raw listing: `list_files(depth=-1)` → 1440 total entries (all `type:file`;
Claude Design projects are flat file stores, not folder trees with a
directory type — "directories" in the listing are inferred from `/` in
paths only).

## Page-count reconciliation

| Count | What it is |
|---|---|
| 98 | Shown in supplied screenshot's page picker |
| **97** | Top-level `*.dc.html` files (no `/` in path) — the closest structural equivalent to "pages" in this project |
| 81 | Additional nested `*.dc.html` under `export-claude-code-sync/`, `export-inspector-pack/`, `export-non-inspector/` — point-in-time **export snapshots**, not live editable pages, correctly excluded from the page count |
| 1440 | All files (pages + components + CSS + fonts + uploads + screenshots + exports + v2/planning docs) |

**Reconciliation: 97 vs 98, off by one, unresolved but non-blocking.** Most
plausible cause: the in-app page picker counts one additional entry (e.g. a
canvas/root view) that this MCP's flat file listing doesn't distinguish as a
separate "page" from `Canvas.dc.html`, or the project was edited by one page
between screenshot capture and this session (file etags/mtimes span
2026-07-18 through 2026-07-21, i.e. actively edited in the days before this
session). Full inventory (97 pages, name/etag/size) written to
`inventory/design-pages.json` and `.csv`.

## Classification (page-name heuristics only — no semantic content read except the pilot page)

- **PWA/Field channel** (`SAQEEL PWA-Field *.dc.html`, 33 pages): the iPad/PWA inspector app surface. Includes the pilot, `SAQEEL PWA-Field Login.dc.html`.
- **Admin** (`SAQEEL Admin *.dc.html`, 14 pages): control-plane screens.
- **Web** (`SAQEEL Web Dashboard`, `SAQEEL Web-Index`, `SAQEEL iPad Dashboard`, etc.): web console surfaces.
- **Web console login family**: `SAQEEL Login.dc.html`, `SAQEEL Auth States.dc.html` — distinct from the pilot, out of scope, governed by the already-closed `TASK-DESIGN-SAQEEL-LOGIN-REVAMP-001`.
- **Design system / meta**: `SAQEEL Design System.dc.html`, `Canvas.dc.html`, `SAQEEL Figma Parity Grid.dc.html`.
- **Planning/architecture** (non-production, likely `intentionally design-only`): `SAQEEL Planning.dc.html`, `SAQEEL Planning Identity.dc.html`, `SAQEEL PWA-Inspector Architecture.dc.html`, `SAQEEL PWA-Inspector Journey Mindmap.dc.html`, `SAQEEL PWA-Inspector Golden Journey.dc.html`.
- One near-duplicate flagged: `SAQEEL Admin Lookups copy.dc.html` alongside `SAQEEL Admin Lookups.dc.html` — likely a stray duplicate, not two distinct requirements. Needs sponsor confirmation before either mapping or archival.

## Mapping depth this pass

Only the pilot page (`SAQEEL PWA-Field Login`) received full content-level
read, semantic analysis, and code mapping (see
`reports/field-login-current-state.md` and `consent/field-login/`). The
other 96 pages are inventoried at metadata level only (name, size, etag) —
full per-page mapping across all 97 is Phase 4-6 work at a scale (97
content reads + 97 code-mapping passes) beyond this session's approved
research scope. `reports/unmapped-and-ambiguous-pages.md` records this
explicitly as a coverage gap, not a silent gap.
