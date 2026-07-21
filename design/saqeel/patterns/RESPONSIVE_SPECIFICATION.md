# RESPONSIVE_SPECIFICATION — SAQEEL Inspection
Primary targets: 1440×900 desktop · 1280×800 laptop · 1024×768 tablet landscape · 768×1024 tablet portrait.
- ≥1280: full sidebar (248px), multi-column dashboards (4-up KPIs), two-column detail pages.
- 1024–1279: sidebar auto-collapses to 60px (icons + tooltips); KPI grids 2-up; detail pages keep two columns.
- 768–1023 (tablet portrait): collapsed sidebar; single-column content; cards replace wide tables where rows are task-like (see tablet.html); apply `[data-density="field"]` on field-inspector surfaces (controls 40/44/52px, body 15px — every control a touch target); form section nav becomes a horizontal Steps or select above content.
- <768: not a primary target; shell falls back to drawer navigation.
- DataGrid: pinned ID column + horizontal scroll instead of column dropping; density compact recommended ≤1024.
- Map command: side queue panel becomes a bottom drawer below 1024.
- Never a desktop-only layout: every canonical screen must render at all four widths.
