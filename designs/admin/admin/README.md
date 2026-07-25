# SAQEEL Admin — Control Panel surface

**This folder is SAQEEL Admin, the configuration and governance surface.** 21 pages. Self-contained: its own `saqeel/` design-system copy, `support.js` and `export-wordmark-icons/`.

Three surfaces in this project, kept apart on disk:

| Surface | Location | Users |
|---|---|---|
| **SAQEEL Web** | project root | Console business users |
| **SAQEEL Admin** | `admin/` | Configuration, governance, reference data |
| **SAQEEL PWA** | `pwa/` | iPad field inspectors |

## Pages

Control Panel · Admin · Admin Detail · Admin Extended · Admin Execution · Admin Form Builder · Admin Workflow Builder · Admin Geofence · Admin Integrations · Admin Integrations Data · Admin SENAI Data · Admin Lookups (+ copy) · Admin Role Override · Admin Virtual Premium · Users Roles · Delegation · Risk · KPI Management · Dashboard Config · Item Execution

## Rules

1. All three surfaces share the **WA-SHELL-r5** rail and **WA-BRAND-r1** identity. A rail change is made in `tools/r5-rail.js` and re-swept into each folder — never hand-edited per page.
2. Each surface keeps its own `saqeel/` copy. They are siblings, not shared. A token that must change in all three is changed three times, deliberately.
3. Cross-surface links use `../` (admin → web) or `admin/` (web → admin). Admin-to-admin links stay bare.
4. Admin work never edits root or `pwa/` pages; web work never edits `admin/` or `pwa/`.
5. Repo counterpart is everything under `web/src/app/(app)/admin/*`. The status board's `admin` channel tracks these pages.

## Card operations rule

Every registry surface here must expose its full operations — create / add-row / add-endpoint / edit / retire — not just a read view. Audit any new admin screen against this before marking it design-complete.
