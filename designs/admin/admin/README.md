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


## WA-ADMIN-r1 — Control Panel chrome (2026-07-26)

The admin channel no longer wears the console's r5 chrome. Its chrome is owned by
three files and swept onto all 21 pages:

- `../tools/admin-shell.js` — the generator (destination table + role contract,
  rail, one command header, utility bar). Edit here and re-sweep; never hand-edit
  a page's chrome.
- `saqeel/admin-shell.css` — how that chrome looks (`.ad-*`). Logical
  properties only, so RTL is free.
- `admin-shell.js` — behaviour: drawer, icon-only collapse (persisted),
  Advanced disclosure (persisted), and **runtime role enforcement**.

### Rules the chrome enforces

1. **Role-authorized destinations only.** Every item carries `data-roles`; the
   rail carries `data-held-roles`. Unauthorized destinations are **removed**
   from the DOM at build time *and* re-asserted at render time. There is no
   locked, disabled or greyed nav item anywhere — a menu entry a user cannot use
   leaks the platform's shape.
2. **Admin scope only.** No Overview / Operations / Compliance groups, no
   Dashboard, Operations Center, Factory 360, Planning, Execution, Review,
   Compliance or AI entry. Configuration cannot navigate sideways.
3. **One document scroll.** The rail is sticky with `block-size: auto` and no
   overflow; `main` has no height cage. The only nested scroll is the drawer
   itself, below 1024px.
4. **No global search, no inert scope.** The factory/visit search and the
   permanently-disabled date/region controls are gone from admin top bars.
5. **One compact command header.** Title (+ Arabic gloss), context, actions. No
   breadcrumb row, no page-level avatar.

### Roles

From `web/src/lib/shell-navigation.ts`: `compliance_admin`, `form_admin`,
`workflow_admin`, `security_admin`, `gis_admin`, `risk_owner`, plus the
business role `ops` which two enforcement destinations accept. Change the swept
role set in one place (the sweep's `ROLES`) and re-emit.
