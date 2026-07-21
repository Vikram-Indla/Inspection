# COMPONENT_STATE_MATRIX
Legend: ● required · ○ n/a. States: Def(ault) Hov(er) Foc(us-visible) Act(ive/pressed) Sel(ected) Dis(abled) Loa(ding) Err(or) Suc(cess) RO (read-only) Emp(ty) Par(tial).
| Component | Def | Hov | Foc | Act | Sel | Dis | Loa | Err | Suc | RO | Emp | Par |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Button/SplitButton | ● | ● | ● | ● | ○ | ● | ● | ○ | ○ | ○ | ○ | ○ |
| Input/TextArea/Select/DateRange | ● | ● | ● | ○ | ○ | ● | ○ | ● | ○ | ● | ○ | ○ |
| Checkbox/Radio/Switch/Segmented | ● | ● | ● | ● | ● | ● | ○ | ● | ○ | ● | ○ | ○ |
| Combobox/StatusSelector | ● | ● | ● | ○ | ● | ● | ○ | ● | ○ | ○ | ● | ○ |
| FileUpload | ● | ● | ● | ● | ○ | ● | ● | ● | ● | ○ | ● | ○ |
| Sidebar/TopBar/Tabs/Steps/Pagination/Breadcrumb | ● | ● | ● | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| CommandPalette/Menu/UserMenu | ● | ● | ● | ● | ● | ● | ○ | ○ | ○ | ○ | ● | ○ |
| FilterBar/ColumnManager | ● | ● | ● | ● | ● (set) | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Alert/Toast/Tooltip | ● | ○ | ● (dismiss) | ○ | ○ | ○ | ○ | ● | ● | ● (immutable) | ○ | ○ |
| Modal/Drawer | ● | ○ | ● (trap) | ○ | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ |
| Skeleton/Progress/EmptyState | ● | ○ | ○ | ○ | ○ | ○ | ● | ● | ● | ○ | ● | ● |
| SyncIndicator | ● (6 states) | ○ | ○ | ○ | ○ | ○ | ● | ● | ● | ○ | ○ | ○ |
| DiffView | ● | ● | ● | ● | ○ | ○ | ○ | ● | ● | ● | ● | ○ |
| StatusBadge/Tag/ExceptionMark | ● | ○/● | ●(removable) | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| KPICard/MetricStrip/DescriptionList | ● | ○ | ○ | ○ | ○ | ○ | ● (skeleton) | ● | ○ | ○ | ● | ● (—) |
| Avatar/UserChip/Timeline/Accordion | ● | ●(acc) | ●(acc) | ● | ○ | ● | ● | ○ | ○ | ○ | ● | ○ |
| DataGrid | ● | ● row | ● | ● | ● rows | ● | ● skeleton | ● | ○ | ○ | ● | ● (— + tooltip) |
| InspectionCard/FindingCard/EvidenceCard | ● | ● | ● | ● | ● | ○ | ● | ○ | ○ | ● | ○ | ● |
| ChecklistQuestion | ● | ● | ● | ● | ● answer | ● RO | ○ | ● | ○ | ● | ○ | ● |
| ReviewPanel | ● | ● | ● | ● | ○ | ● gated | ● busy | ● | ● decided | ● decided | ○ | ○ |
| ComplianceScore/SeverityIndicator/DueDate | ● | ○ | ○ | ○ | ○ | ○ | ● | ○ | ○ | ○ | ● (—) | ● |
| StatusSpine | ● | ○ | ○ | ○ | ● current | ○ | ○ | ● blocked/overdue | ● done | ○ | ○ | ● |
| EvidenceStack | ● | ● | ● | ● | ○ | ○ | ● | ● rejected | ● verified | ● | ● | ● |
| GeoWorkspace/MapMarker/MapPanel/MapToolbar | ● | ● | ● | ● | ● marker | ○ | ● | ● | ○ | ● restricted | ● | ○ |
