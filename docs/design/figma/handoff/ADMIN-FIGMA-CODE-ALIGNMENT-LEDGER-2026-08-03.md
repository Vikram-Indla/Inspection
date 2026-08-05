# Admin Figma→Code Alignment Ledger — 2026-08-03

Handoff for Codex Admin Figma-to-Code Alignment. Companion machine-readable file:
`ADMIN-FIGMA-CODE-ALIGNMENT-LEDGER-2026-08-03.csv` (60 rows, one per governed SCR-ADM
route/state delta, 12 node-id columns each = 720 frame references, zero MISSING cells).

## Source

- Figma file: `ML2PNwfShlQM2k44MvSEw5`, page **Admin Shell** (node `111:2`).
- All node IDs below are directly queryable via `get_metadata` / `get_design_context`
  / `get_screenshot` against that file key. A stratified sample (old-range and
  new-range node IDs, 1280/720 widths, EN and AR, Light and Dark) was re-verified
  live in this session — all resolved with correct dimensions and content, zero
  clipping (`ad-state` width ≤ container width in every checked case).
- No Figma nodes were modified in this pass — read/verify only, per instruction.
- Playwright: not touched, remains paused.

## Column key (CSV)

| Column | Meaning |
|---|---|
| `scr_id` | Governed screen contract ID from `product-contract/screens/screen_route_catalogue.csv` lineage |
| `title` | Screen title as authored in Figma |
| `app_route` | Application route (matches Figma frame name's route segment) |
| `state` | State delta (`(default)` = no STATE suffix, i.e. the screen's primary/only state) |
| `code_surface` | Expected Next.js route file under `apps/web/src/app/(app)/...` (App Router, `[id]`/`[key]` dynamic segments preserved verbatim from the route) |
| `EN-Light-1280` … `AR-Dark-720` | Figma node ID for that exact language × theme × viewport cell. Language: EN/AR. Theme: Light/Dark. Viewport: 1280 (canonical desktop) / 1024 (compact, full rail) / 720 (drawer, rail removed). AR columns are RTL-mirrored (structural reorder, not a visual flip) and carry Arabic copy. |

## Coverage

- 60 route/state deltas × 12 cells = 720 frames, all present (verified via bulk scan, zero `MISSING`).
- 2 deltas share `scr_id` `SCR-ADM-080` (base route `/admin/notifications`) at different
  states (`(default)` = "empty", plus `delivery degraded`) — both rows present, disambiguated
  by the `state` column, not by `scr_id` alone. Same pattern applies to any other reused ID —
  join on `(scr_id, app_route, state)`, not `scr_id` alone.
- Code surface is a *derived expectation* from the route path, not verified against the
  actual `apps/web` tree in this pass — Codex should confirm the file exists / create it
  per its own App Router convention before treating `code_surface` as ground truth.

## Known non-parity item (not fixed, flagged for record)

The task that produced this design work also asked to fix active-state highlighting on
"62 shared RTL rail instances." That component (`773:363`, "App sidebar — RTL") belongs to
the separate Web console shell on the **Nav & Chrome** page, not to Admin's own `ad-rail`
chrome (Admin has independent chrome per `designs/admin/admin/README.md`). Admin's own
RTL active-state indicator (`is-active indicator` on the current `ad-hub`) was verified
correct in every sampled frame. No action taken against node `773:363` in this pass.

## Sample rows (see CSV for all 60)

| scr_id | app_route | state | EN-Light-1280 | AR-Dark-720 |
|---|---|---|---|---|
| SCR-ADM-001 | /admin | (default) | 187:396 | 786:1275 |
| SCR-ADM-010 | /admin/regulations | (default) | 188:563 | 787:112500 |
| SCR-ADM-080 | /admin/notifications | (default) | 188:2314 | 791:128462 |
| SCR-ADM-080 | /admin/notifications | delivery degraded | 433:52104 | 794:127053 |
| SCR-ADM-450 | /admin/devices/policies | review ready | 455:67920 | 799:137496 |
