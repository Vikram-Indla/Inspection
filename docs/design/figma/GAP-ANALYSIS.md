# SAQEEL Figma — coverage gap

Generated from `status/saqeel-status.json` (revision SB-r28, updated 2026-07-26T13:35:00+03:00) against `BASELINE-2026-07-31.json`.

PWA (25 cards) is **out of scope** by Product Owner ruling 2026-07-31 and is excluded throughout.


## Headline

- In-scope board cards (web + admin): **32**
- Satisfied by an existing Figma screen: **8**
- Satisfied as components rather than a screen: **1** (`shell-f0`)
- Reference-only, nothing to build: **1** (`webref`)
- **Pending Figma work: 22 cards**

- Figma frames that satisfy no board card: /execution, /analytics
- Figma frames that are RBAC-refusal states, not admin UI: 6 (`/admin/access`, `/admin/localization`, `/admin/risk`, `/admin/packages`, `/admin/notifications`, `/admin/integrations`)

> Real admin coverage in Figma is **zero screens**. The six `/admin/*` frames were built faithfully to `design/final-cut/saqeel-revamp.html`, which renders the refusal state for its persona — but `designs/admin/` (21 `.dc.html`, now the admin canon) describes a complete admin product behind its own `ad-*` shell that does not exist in Figma at all.


## Web — 12 cards pending Figma

| Card | Name | design% | code% | Priority | Design source (.dc.html) |
|---|---|---|---|---|---|
| `visits` | M2 Visits | 70 | 100 | Medium | SAQEEL Visits.dc.html (WA-DES-045) |
| `cases` | Cases | 75 | 100 | Medium | SAQEEL Cases.dc.html |
| `portal` | Portal (external) | 70 | 100 | Medium | SAQEEL Portal.dc.html |
| `profile` | Profile | 100 | 100 | Medium | SAQEEL Profile.dc.html |
| `virtual` | Virtual visits (console side) | 88 | 100 | Medium | SAQEEL Virtual.dc.html |
| `exec` | Executive Overview | 93 | 96 | Medium | SAQEEL Executive Overview.html |
| `m6-committee` | Committee handoff | 65 | 95 | Medium | SAQEEL Committee.dc.html |
| `reports` | Reports & packages | 60 | 85 | High | SAQEEL Inspection Report.dc.html · Report Inventory · Report Deltas · Report Package Foundation |
| `ai` | AI Studio & advisory | 55 | 70 | Medium | SAQEEL AI Studio.dc.html · SAQEEL Evidence OCR.dc.html |
| `tasks` | Tasks | 80 | 65 | Low | SAQEEL Tasks.dc.html |
| `feedback` | Feedback module | 90 | 65 | Low | SAQEEL Feedback.dc.html |
| `brand` | Brand identity WA-BRAND-r1 | 100 | 0 | Low | SAQEEL Brand Identity Proof.dc.html |

## Admin — 10 cards pending Figma

| Card | Name | design% | code% | Priority | Design source (.dc.html) |
|---|---|---|---|---|---|
| `admin-core` | Control Panel core (21 sections) | 60 | 95 | High | SAQEEL Control Panel.dc.html · SAQEEL Admin.dc.html · Admin Extended · Admin Detail |
| `admin-risk` | Risk settings | 65 | 95 | Medium | SAQEEL Risk.dc.html |
| `admin-kpi` | KPI management & dashboard config | 60 | 90 | High | SAQEEL KPI Management.dc.html · SAQEEL Dashboard Config.dc.html |
| `admin-builders` | Form & workflow builders | 55 | 90 | High | SAQEEL Admin Form Builder.dc.html · Admin Workflow Builder · Item Execution |
| `admin-exec` | Execution settings | 60 | 90 | High | SAQEEL Admin Execution.dc.html |
| `admin-data` | SENAI data, integrations, lookups | 55 | 90 | High | SAQEEL Admin SENAI Data.dc.html · Admin Integrations · Admin Integrations Data · Admin Lookups |
| `admin-devices` | Trusted devices & biometric | 70 | 90 | Medium | SAQEEL Users Roles.dc.html (devices section) |
| `admin-geo` | Geofence & GIS | 55 | 90 | High | SAQEEL Admin Geofence.dc.html |
| `admin-platform` | Platform ops, audit, notifications | 80 | 90 | Medium | SAQEEL Admin Extended.dc.html · SAQEEL Risk.dc.html (audit section) |
| `admin-access` | Users, roles, delegation | 55 | 85 | High | SAQEEL Users Roles.dc.html · SAQEEL Admin Role Override.dc.html · SAQEEL Delegation.dc.html |

## Why `High` priority

`code% >= 85` with `design% < 65` means the route is **already shipped in the repo with no design of record**. Those are the cards where Figma is furthest behind reality, and where a design-system-first correction has the most leverage.


## Structural work (not screen work)

These block making Figma the authority rather than a mirror, and are tracked separately:

1. **`ad-*` admin shell** — 68 classes in `designs/admin/admin/saqeel/admin-shell.css` (ad-shell, ad-rail, ad-pal command palette, ad-hubcard, ad-subnav, ad-state--denied). None exist in Figma. Prerequisite for every admin card.
2. **Real Table primitive** — `thead`/`tr` hard-code 4 columns at fixed widths; 365 cells were converted to instances but the row is not composable. Needs a column-count property.
3. **Admin token delta** — `--text-muted` differs in both modes (light `#5f666c`, dark `#99a0a8`) and `--transition-fast/base/slow` exist only in admin. 2 mode values + 3 new variables.
4. **AR regeneration** — the 32 AR frames are detached; 543 nodes still pinned at 60px and 36 overflow. One pass, after structural work settles.
