# CLAUDE_CODE_HANDOFF — implementation brief
Consume this design system without reinterpreting visuals. All decisions are made; do not invent colours, type, spacing or component anatomy.
## Inputs
- tokens.json / tokens.css (this folder) — generate CSS custom properties + Tailwind theme from these.
- components/<group>/<Name>.{jsx,d.ts,prompt.md} — canonical anatomy + API; reimplement in the product stack keeping names, props and states.
- ui_kits/inspection/*.html — acceptance references (incl. compare.html four-mode matrix).
- Specs: RTL, dark-mode, responsive, accessibility, map, data-grid, form, patterns.
## Implementation order
1 Tokens → 2 Fonts (purge Barlow/Astryx) → 3 Shared primitives (Button, Field/Input, StatusBadge, panel) → 4 App shell (Sidebar/TopBar/layout) → 5 Navigation (PageHeader/Breadcrumb/Tabs/Steps) → 6 Forms → 7 DataGrid (register first) → 8 Map controls (engine untouched) → 9 Inspection + signature components → 10 Representative pages → 11 Remaining pages → 12 Astryx removal → 13 Final verification (VISUAL_QA_MATRIX × four modes).
## Functional guardrails (unchanged)
Business workflows, routes, data fields + meanings, permissions/roles, validation logic, map behaviour incl. zone-hover elevation, search/filter/submission/save behaviour, API contracts, DB structures, audit logic, notifications, approved animations.
## Definition of done per migrated view
Renders in all four modes · no Astryx imports · no raw hex/font declarations · focus ring present · status vocabulary canonical · passes the view's row in ASTRYX_MIGRATION_TEMPLATE.md.
