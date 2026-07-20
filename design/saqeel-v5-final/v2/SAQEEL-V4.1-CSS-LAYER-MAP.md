# V4.1 CSS layer map
Entry: styles.css (import order = cascade order, unchanged from monolith)
1 tokens/fonts.css → @font-face (IBM Plex Sans Arabic, Space Grotesk*, JetBrains Mono) *frozen-contract exception
2 tokens/tokens.css → all raw values, themes, density vars
3 styles/foundations.css → resets, base type, .ax-surface/.ax-panel
4 styles/components-core.css → buttons, inputs, choices, segmented, tabs, pagination, accordion, typecards(deprecated)
5 styles/components-status.css → lozenge, badge, version, avatar
6 styles/components-overlays.css → tooltip, menu, banner, toast, modal, drawer
7 styles/components-feedback.css → skeleton, state, freshness, widget, sync
8 styles/components-navigation.css → shell, pagehead, breadcrumb, commandbar, filterchip, kpi, field taskbar + responsive shell rules
9 styles/components-data.css → table, bulkbar
10 styles/components-process.css → stepper, authoritybar, timeline, validation, conflict, diff
11 styles/components-domain.css → map, pins, visitcard, evidence, rule, flow
12 styles/utilities.css → stack/row/grid/sr-only/reduced-motion
13 styles/legacy-features.css → lv-*, cd-*, ax-ribbon, ax-trace… COMPATIBILITY ONLY, excluded from the core contract, candidates for app-side relocation
14 tokens/v2-components.css → V2 layer: chips, statusrail, mstrip, tonal field, recordrow, fieldset, density, texture, link, scroll-margin
15 styles/print.css → canonical A4 print layer
Deleted: tokens/astryx.css (fully migrated, no orphan imports).