# SAQEEL Inspection Design System — overview
- **Entry:** `styles.css` (imports tokens + component CSS). React primitives in `components/` (each with .d.ts + .prompt.md). Screens in `ui_kits/inspection/`.
- **Modes:** light default; dark = `[data-theme="dark"]`; RTL = `dir="rtl"`; density = `[data-density="compact"]`. All four mode combinations are first-class (see FOUR_MODE_PARITY_MATRIX.md).
- **Signatures (original to SAQEEL):** Geospatial Command Workspace, Inspection Status Spine, Evidence Stack, Operational Exception Rail, Field-to-Command Continuity — see INSPECTION_PATTERNS.md.
- **Groups:** actions, inputs, navigation, feedback, data, grid (DataGrid), inspection, map, signature.
- **Docs in this folder:** principles, tokens (md/json/css), typography, component catalog + API contract, RTL, dark mode, responsive, accessibility, map system, data grid, forms, patterns, QA + parity matrices, Claude Code handoff, retired predecessor migration template, known limitations.
