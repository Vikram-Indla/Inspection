# COMPONENT_USAGE_GUIDE
Canonical per-component usage lives in component-source/<group>/<Name>.prompt.md (purpose + example + variants) with the API in <Name>.d.ts. Cross-cutting rules:
- One primary Button per view; secondary is the workhorse; danger only on destructive confirms.
- Every input sits in a Field (label/help/error) — never bare.
- Status: StatusBadge for lifecycle, ExceptionMark for severity/exception, SyncIndicator for connectivity — never mix roles.
- Lifecycle progression: StatusSpine (never a badge row). Tables: DataGrid only. Filters: FilterBar grammar. Evidence: EvidenceStack/EvidenceCard only.
- Layers: Tooltip (hint) < Menu/Popover < Drawer (context) < Modal (blocking) — pick the lightest that works.
- Density: set data-density at the surface root (comfortable default, compact for dense desktop registers, field for iPad inspector surfaces); never mix within one region.
