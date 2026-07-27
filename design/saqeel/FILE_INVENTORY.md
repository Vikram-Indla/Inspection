# FILE_INVENTORY — SAQEEL Inspection Design System v1.0

Root files: styles.css (package entry stylesheet), components.css (component CSS layer), readme.md (system guide), DESIGN_SYSTEM_MANIFEST.json.

## /foundations (11 files)
Design principles, brand, colour, type, spacing, radius/elevation, motion, iconography, accessibility, content rules
- ACCESSIBILITY_SPECIFICATION.md
- BRAND_AND_IDENTITY.md
- COLOUR_SYSTEM.md
- CONTENT_AND_LABEL_RULES.md
- DESIGN_PRINCIPLES.md
- DESIGN_SYSTEM_OVERVIEW.md
- ICONOGRAPHY_SPECIFICATION.md
- MOTION_SPECIFICATION.md
- RADIUS_BORDER_ELEVATION.md
- SPACING_AND_LAYOUT.md
- TYPOGRAPHY_SPEC.md

## /tokens (14 files)
Implementation tokens — tokens.css (compiled), tokens.json (full), 12 concern-split JSONs
- tokens.border.json
- tokens.chart.json
- tokens.css
- tokens.dark.json
- tokens.density.json
- tokens.elevation.json
- tokens.json
- tokens.light.json
- tokens.map.json
- tokens.motion.json
- tokens.radius.json
- tokens.spacing.json
- tokens.status.json
- tokens.typography.json

## /tokens-css (4 files)
Source token sheets (fonts/colors/typography/layout) — edit these, recompile tokens.css

## /components (5 files)
Component catalog, API contract, state matrix, usage + misuse guides
- COMPONENT_API_CONTRACT.md
- COMPONENT_CATALOG.md
- COMPONENT_MISUSE_GUIDE.md
- COMPONENT_STATE_MATRIX.md
- COMPONENT_USAGE_GUIDE.md

## /patterns (12 files)
Shell, data grid, forms, map, evidence, offline/sync, status/severity, continuity, responsive, RTL, dark mode
- APPLICATION_SHELL.md
- DARK_MODE_SPECIFICATION.md
- DATA_GRID_SPECIFICATION.md
- EVIDENCE_SYSTEM.md
- FIELD_TO_COMMAND_CONTINUITY.md
- FORM_SYSTEM_SPECIFICATION.md
- INSPECTION_PATTERNS.md
- MAP_SYSTEM_SPECIFICATION.md
- OFFLINE_AND_SYNC.md
- RESPONSIVE_SPECIFICATION.md
- RTL_SPECIFICATION.md
- STATUS_AND_SEVERITY.md

## /ipad (11 files)
iPad-specific principles, shell, components, forms, map, evidence, offline, RTL, responsive matrix, touch a11y, QA
- IPAD_APPLICATION_SHELL.md
- IPAD_COMPONENT_CATALOG.md
- IPAD_DESIGN_PRINCIPLES.md
- IPAD_EVIDENCE_SYSTEM.md
- IPAD_FORM_SYSTEM.md
- IPAD_MAP_SYSTEM.md
- IPAD_OFFLINE_AND_SYNC.md
- IPAD_RESPONSIVE_MATRIX.md
- IPAD_RTL_SPECIFICATION.md
- IPAD_TOUCH_AND_ACCESSIBILITY.md
- IPAD_VISUAL_QA_MATRIX.md


## /screens/html (18 files)
Canonical representative screens (render with the packaged styles.css)

## /screens/png (14 files)
High-resolution reference exports — <screen>_<lang>_<theme>_<viewport>.png
- dashboard_en_dark_1440x900.png
- dashboard_en_light_1440x900.png
- detail-findings_en_light_1440x1050.png
- detail_ar_dark_1440x1050.png
- evidence-review_en_light_1440x950.png
- form_en_light_1440x1050.png
- map-command_ar_light_1440x900.png
- map-command_en_dark_1440x900.png
- map-command_en_light_1440x900.png
- register_ar_dark_1440x900.png
- register_ar_light_1440x900.png
- register_en_light_1440x900.png
- review_en_light_1440x1000.png
- tablet-field-offline_en_light_834x1000.png

## /handoff (9 files)
Claude Code handoff, implementation sequence, parity + QA matrices, decision log, migration map, readiness report
- ACCESSIBILITY_QA_MATRIX.md
- RETIRED PREDECESSOR_MIGRATION_TEMPLATE.md
- CLAUDE_CODE_HANDOFF.md
- DESIGN_DECISION_LOG.md
- FOUR_MODE_PARITY_MATRIX.md
- IMPLEMENTATION_SEQUENCE.md
- KNOWN_LIMITATIONS.md
- RESPONSIVE_QA_MATRIX.md
- VISUAL_QA_MATRIX.md

## /assets (0 files)
Approved assets (currently: none — see ASSETS_README.md)

## /component-source (0 files)
Implementation REFERENCE source (React JSX + .d.ts contracts + usage prompts + state cards), organised by family. Reference, not production code: re-implement in the product stack keeping names/props/states.
