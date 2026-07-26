# Orchestrator resources

Every id here was verified live on 2026-07-26. If a lookup fails, re-discover it
rather than guessing — and update this file.

## Claude Design — the design authority

Project id: `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`
URL: https://claude.ai/design/p/5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61

| Path in project | Holds |
| --- | --- |
| *(root)* | `SAQEEL Status Board.dc.html` only. Design pages are **not** at the root. |
| `web/` | The web design pages + `support.js`. Note `SAQEEL Executive Overview.html` is plain `.html`, not `.dc.html`. |
| `admin/` | 21 admin `.dc.html` pages + `support.js` |
| `pwa/` | 43 PWA pages. Read-only while `config.json` sets `channelOwners.pwa` to `other-developer`. |
| `status/saqeel-status.json` | **The published board.** `SAQEEL Status Board.dc.html` renders this file and nothing else. Publishing = writing the repo copy here. |
| `status/*.csv` | Human exports (cards / pending / rollup). The board page does not read them. |
| `handoff/`, `screenshots/`, `_ds/`, `assets/`, `tools/` | Supporting material |

Status board page: `SAQEEL Status Board.dc.html` at the project root — a pure
renderer. Never hand-edit it to change a number.

Tools: `mcp__claude-design__list_files`, `read_file`, `write_files`,
`render_preview`, `put_conversation`, `list_comments`. Always pass the `etag`
you read back as `if_match` when writing — the user may be editing the same page.

Vendored mirror in this repo: `designs/web/export-saqeel-web/`,
`designs/admin/…`, `designs/pwa/…`. The mirror can be stale; the project wins.

## Google Drive — scope, requirements and seed data only

**Status never goes to Drive.** The board is published to Claude Design (above).
The stale `saqeel-status.json` sitting in Drive is not a target; ignore it.

Root SAQEEL folder: `1PE2ZqagP4N9BP3Pby2yYz8ynq1xSqx95`

| Item | File id | Notes |
| --- | --- | --- |
| `REQUIREMENT_BASELINE.csv` | `1WECk_H0k-4ezUEeCboQ_5kPZUdDuv26h` | Requirement baseline. Local copy: `product-contract/web-admin-phase1/REQUIREMENT_BASELINE.csv`. |
| `Seeders/` folder | `1-yI5BCwgKlEDI438koKi0GWCeAo0RvuK` | `CURRENT_LIVE_TEST_DATA_GUIDE.csv`, `MIM_Inspection_Supabase_Seeding_Discovery_Handoff.zip`, `Seeder Architecture.svg` |
| `Inspection Web/` folder | `1wmMUVDn-7g4B051YP_qCMOXJs_N92Q43` | Web scope docs + `saqeel web.html` |
| `saqeel web.html` | `1Bb5BA5AFQON74qH6Pnw5RpblTIULxCeM` | Canonical web shell reference |
| `inspection_secrets` sheet | `1xWqiPQ-h-jXCDDvOSJUIwiuvzUOFmw3eAhOl65sDkqg` | Service keys. Read when needed; never copy a secret into a repo file, a PR, or a status update. |
| `Inspection Mobile/` folder | `1fupsqTyt8OaXRwlyCAauEEZVpOywj3F_` | PWA / field scope documents. Read these if you take the PWA channel. |

Web scope documents in `Inspection Web/`: `Execution.docx`, `Planning.docx`,
`Compliance.docx`, `Factory 360.docx`, `Opearation Center.xlsx` *(sic)*,
`dashboard.xlsx`, `Inspection Project.xlsx`.

**Do not build from Drive design files.** Designs come from Claude Design only.
Drive supplies scope, requirements, and seed data.

Drive MCP prefix: `mcp__664b722d-07d2-412b-aa7e-280862ea9707__`. It offers
`search_files`, `read_file_content`, `download_file_content`, `create_file`,
`copy_file`, `get_file_metadata` — **there is no in-place update**.

## Supabase

Project ref: `iiozvqntawxfwbgffzqu` · region ap-northeast-2 (Seoul)
URL: `https://iiozvqntawxfwbgffzqu.supabase.co`
Keys live in the `inspection_secrets` sheet and in `apps/web/.env.local`.
CLI: `supabase` (installed). MCP prefix: `mcp__42209857-f1af-4838-a6f4-485689874bfb__`.

## Seeded personas

`apps/web/e2e/personas.ts` is the source of truth. As of 2026-07-26:

| Role | Email | Home route |
| --- | --- | --- |
| planner | `planner@mim.gov.sa` | `/planning` |
| inspector | `inspector@mim.gov.sa` | `/field` |
| reviewer | `reviewer@mim.gov.sa` | `/reviews` |
| admin | `admin@mim.gov.sa` | `/admin` |
| ops | `ops@mim.gov.sa` | `/dashboard` |

Passwords are in that file. G11 rotates them — read the file, never hardcode.
Shared test inspectors (`Inspector1..5`, login id doubles as password) are
created by `scripts/seed/seed_inspectors.py`.

To provision a fresh account, use the Supabase CLI or the Auth Admin API with
the service-role key. Never disable a guard, an RLS policy, or a role check to
get a screenshot.

## Repo contract files

| Path | Holds |
| --- | --- |
| `status/saqeel-status.json` | The 57-card board — working copy |
| `product-contract/operationalization/SAQEEL_OPERATING_SYSTEM.md` | Full operating system, authority over this skill |
| `product-contract/web-admin-phase1/REQUIREMENT_BASELINE.csv` | 478 requirements, joined by `target_routes` / `target_designs` |
| `product-contract/web-admin-phase1/DESIGN_ROUTE_MAP.csv` | design page → routes, personas, acceptance ids, viewports, RTL flag |
| `product-contract/web-admin-phase1/ACCEPTANCE_CRITERIA.csv` | acceptance rows |
| `product-contract/execution/CURRENT_SLICE.yaml` | live leases and the active task id |
| `apps/web/e2e/` | Playwright suite, personas, evidence-path helper |

## Tooling

`codex`, `supabase`, `gh` are installed. `rclone` / `gdrive` are not.
Chrome driving: `mcp__claude-in-chrome__*`. Codex: `mcp__codex__codex`.
