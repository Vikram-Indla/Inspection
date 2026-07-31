# Saqeel → Figma generation plan

**Source of truth:** `design/final-cut/saqeel-revamp.html` (approved) + tokens/components in
`apps/web/src/app/` (`tokens.css`, `saqeel-components.css`).
**Direction:** code/design → Figma (build a token-bound library + screens).
**Status:** discovery complete; execution **blocked** until the Figma *write* connector
(`use_figma` / `create_new_file`) is authorized. Only the read-only Dev Mode server is live today.

This plan is deliberately faithful-but-token-bound, not a pixel trace. Every Figma value binds to a
variable that mirrors the CSS token — the same rule the codebase enforces (no raw hex, no bespoke
radius/spacing). A literal pixel clone is out of scope and would violate the design-system contract.

---

## 1. Variable collections (build first)

Tokens live in `tokens.css` under `:root, :root[data-theme="light"]` (light) and
`:root[data-theme="dark"]` (dark). Colours are dual-valued → build as a **Colors** collection with
two modes: `Light` and `Dark`. Non-colour tokens are single-valued → one mode.

| Figma collection | Modes | Source tokens |
|---|---|---|
| **Colors / Surface** | Light, Dark | `--surface-canvas/primary/secondary/raised/sunken/overlay` |
| **Colors / Text** | Light, Dark | `--text-primary/secondary/muted/disabled/inverse/link/on-action` |
| **Colors / Action** | Light, Dark | `--action-primary(+hover/pressed)`, `--action-danger(+hover/pressed)`, `--text-on-action` |
| **Colors / Status** | Light, Dark | `--status-{compliant,completed,critical,major,warning,onhold,pending,info,draft,disabled}` each with base / `-soft` / `-text` |
| **Colors / Border** | Light, Dark | `--border-subtle/strong/input`, `--border-w` |
| **Colors / Nav** | Light, Dark | `--nav-bg(+hover/selected)`, `--nav-text(+active)`, `--nav-border`, `--nav-indicator` |
| **Colors / Accent** | Light, Dark | `--accent-soft(+hover)`, `--accent-text` |
| **Colors / Chart** | Light, Dark | `--chart-1..6`, `--chart-grid`, `--chart-label` |
| **Colors / Map + Evidence** | Light, Dark | `--map-panel/zone-fill/zone-stroke`, `--evidence-*`, `--focus-ring` |
| **Spacing** | (1) | `--space-0..12` (0,4,8,12,16,20,24,32,40,48) |
| **Radius** | (1) | `--radius-xs/sm/md/lg/full` (4/6/8/12/999) |
| **Sizing** | (1) | `--control-h-*`, `--row-h`, `--topbar-h` (52), `--sidebar-w` (248) / `-collapsed` (68), `--panel-w` (360), `--touch-target` (44), `--grid-desktop-max` (1440) |

Primitive ramps (`--emerald-*`, `--neutral-*`) become a hidden **Primitives** collection that the
semantic colour variables *alias*, matching the CSS layering.

## 2. Text styles

Build 12 Figma text styles from the `--type-*` tokens (font: IBM Plex Sans Arabic):
`t-display` (28/1.25/600) · `t-page-title` (22/1.45/600) · `t-section` (17/1.5/600) ·
`t-heading` (14/1.4/600) · `t-body-lg` (15) · `t-body` (14) · `t-compact` (14) ·
`t-label` (13/500) · `t-meta` (12) · `t-caption` (11.5) · `t-metric` (30/700, tabular) ·
`t-mono` (12.5, mono, tabular).

## 3. Effect styles

`--shadow-xs/sm/md/lg` + `--shadow-card` + `--shadow-card-hover` → 6 effect styles, per mode
(dark shadows use a ring + heavier drop). Focus ring = `--focus-ring-shadow`.

## 4. Component library (build after variables)

Grouped by family; each becomes a Figma component set with variants and every fill/space/radius
**bound to a variable**. Status is always **badge + text label**, never colour-only (CLAUDE.md #6).

- **Button** — `.btn` × {primary, secondary, tertiary, ghost, danger, icon} × {sm, md, lg} + block/field/touch; `.btn-group`.
- **Badge** — `.badge` × 10 status variants + `outline`. Text label required.
- **Alert** — `.alert` × {critical, info, success, warning, immutable} + title slot.
- **Panel/Card** — `.panel` > `panel-header`/`panel-title` + `panel-body` + `panel-row`.
- **KPI** — `.kpi` (label/value/delta/info) + `.kpi-grid`; `.metric-strip`.
- **Table** — `.table` + `table-wrap`, `grid-toolbar`, `grid-footer`, `th-sort`, `cell-num`, `cell-trunc`, `col-pin`, `rail-*`; row states `is-selected/overdue/blocked`.
- **Nav / chrome** — `.sidebar` (brand/group, collapsed variant), `.nav-item`/`nav-label`/`nav-count`, `.topbar`, `.breadcrumb`.
- **Form** — `.field` (+error/help), `.input` (+affix/mono), `.select`, `.combo` (+chip/control/list), `.check`, `.radio`, `.switch`, `.seg`/`seg-opt`, `.fileupload`, `.palette`.
- **Tabs** — `.tabs`/`tab`/`tab-count`.
- **Overlay** — `.dialog` (backdrop/title/body/actions), `.drawer` (header/body), `.popover`, `.menu` (item/label/sep), `.tooltip`, `.toast`.
- **Filter / bulk** — `.filter-bar`, `.filter-chip` (+is-set), `.bulk-bar`.
- **Progress / flow** — `.progress`, `.steps`/`step`/`step-dot`/`step-line`, `.timeline`/`tl-*`, `.spine`/`spine-*`.
- **Chip / identity** — `.tag`/`tag-remove`, `.user-chip`, `.org`, `.avatar` (+sm/lg).
- **State** — `.saqeel-state` × {error, conflict, stale, provider-unavailable, degraded, not-yet, loading}; `.skeleton`; `.empty`. These render **absent/unavailable data** (CLAUDE.md #10).
- **Pagination / misc** — `.pagination`/`page-btn`, `.kbd`, `.divider`, `.swatch`, `.accordion`.

## 5. Screens to assemble (fixed routes — CLAUDE.md #9)

Each as a desktop frame (1440 max width), composed from library components + tokens:

`/dashboard` · `/operations` (+ `/operations/live` map) · `/factory-360` · `/planning`
(+ single / bulk / immediate creation flows) · `/execution` · `/reviews` · `/compliance` ·
`/compliance/approvals` · `/enforcement-library` · `/analytics` · Admin:
`/admin/access` · `/admin/localization` · `/admin/risk` · `/admin/packages` ·
`/admin/notifications` · `/admin/integrations`.

Tabs/filters are query state, not separate frames (unless a distinct layout).

## 6. RTL + Arabic

- Layouts use auto-layout so mirroring is direction-agnostic; provide an **RTL** frame variant rather than flipping values (mirrors CLAUDE.md #7 "logical properties only").
- Arabic strings come from the repo i18n layer (~725 approved), applied as a content set — never typed into components (CLAUDE.md #8).

## 7. Execution order (once write connector is live)

1. Primitives collection → semantic colour variables (Light/Dark) → spacing/radius/sizing.
2. Text styles → effect styles.
3. Base components (button, badge, input, alert) with variants + bindings.
4. Composite components (panel, KPI, table, nav, overlays).
5. Assemble screens route-by-route, newest/most-referenced first (Dashboard, Planning, Compliance).
6. RTL variant pass + Arabic content set.
7. Verification: screenshot each frame, diff structure against the HTML render, confirm zero raw
   hex / unbound values, confirm every status carries a text label.

## 8. What is blocking

`figma-generate-design` needs `use_figma` + `create_new_file`. Currently only the read-only Dev
Mode server (`get_design_context`, `get_screenshot`, `get_metadata`, `get_variable_defs`,
`get_code_connect_map`, `add_code_connect_map`, `create_design_system_rules`) is exposed. Authorize
the Figma **plugin** write connector (OAuth) and keep the Figma **desktop app** open with the MCP
server enabled; then steps 1–7 run.
