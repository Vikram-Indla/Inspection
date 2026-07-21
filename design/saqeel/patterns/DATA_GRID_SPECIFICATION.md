# DATA_GRID_SPECIFICATION — Inspection Data Grid
Canonical component: components/grid/DataGrid.jsx (see .d.ts for API).
- Anatomy: toolbar (search · FilterBar/saved views · ColumnManager · density seg · export) → bulk bar (appears on selection) → sticky-header table (pinned ID column, optional 4px RailCell) → footer (total + pagination).
- Sorting: click = single sort; shift-click = append (multi-column); aria-sort set.
- Selection: header checkbox (indeterminate for partial), row checkboxes, bulk actions in bulk bar, Clear.
- Row expansion: chevron column; expanded row spans full width on --surface-secondary.
- Inline actions: trailing ⋯ Menu; never hidden-on-hover only.
- Densities: comfortable 44px rows / compact 34px ([data-density="compact"]).
- Large datasets: virtualise by passing a windowed rows slice; grid renders what it receives; footer shows true total.
- States: loading (skeleton rows), empty (EmptyState with one action), error (Alert row), partial data (— placeholders + tooltip).
- Truncation: .cell-trunc + title tooltip; numeric cells .cell-num end-aligned tabular.
- Prohibited: card-styled rows, heavy cell borders, >2 font sizes per row, low-contrast headers, colour-only status.
- RTL: column order mirrors; pinned column stays inline-start; numerals stay LTR.
