# FOUR_MODE_PARITY_MATRIX
Modes: EN-light · EN-dark · AR-light · AR-dark. A component/screen is complete only when all four are designed. Live proof: ui_kits/inspection/compare.html (register in all four modes).

## Components (all groups)
Every component consumes semantic tokens + logical properties only ⇒ parity is structural. Verified by cards + screens:
| Family | EN-L | EN-D | AR-L | AR-D | Evidence |
|---|---|---|---|---|---|
| Buttons/inputs/badges | ✓ | ✓ | ✓ | ✓ | cards; register(4 modes); actions card has AR row |
| Sidebar/TopBar/tabs/pagination | ✓ | ✓ | ✓ | ✓ | all screens × modes |
| DataGrid | ✓ | ✓ | ✓ | ✓ | register / -dark / -ar / -ar-dark |
| Panels/KPI/timeline | ✓ | ✓ | ✓ | ✓ | dashboard, dashboard-dark, detail-ar-dark |
| Map suite | ✓ | ✓ | ✓ | dark AR basemap = engine style | map-command / -dark / -ar |
| StatusSpine / Evidence / Rail | ✓ | ✓ | ✓ | ✓ | corrective, evidence-review, detail-ar-dark |
| Forms/checklist | ✓ | ✓* | ✓* | ✓* | form.html; *token-structural, screen in EN-light only |
| Palette/Menu/Combobox | ✓ | ✓* | ✓* | ✓* | token-structural |

## Explicit RTL validations (register-ar, detail-ar-dark, map-command-ar)
Text alignment ✓ · drawer direction ✓ (logical inset) · sidebar side ✓ · directional icons ✓ · breadcrumb ✓ · pagination ✓ · column order + sticky ID column ✓ · label position ✓ · validation below field ✓ · mixed AR/EN + LTR IDs ✓ · dates ✓ · Latin tabular numerals ✓ · truncation + title tooltips ✓ · menus mirror ✓ · map controls mirror, basemap doesn't ✓ · spine ✓ · timelines ✓ · charts (bars) ✓ · evidence metadata ✓.

*Rows marked ✓\* are guaranteed by token/logical-property structure but have no dedicated screen; add screens if a defect is ever suspected.*
