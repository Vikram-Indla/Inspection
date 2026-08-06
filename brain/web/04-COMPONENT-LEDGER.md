# 04 — Component Ledger

The catalogue of the SAQEEL design system. **Check this before building
anything.** A component that exists is never rebuilt; a component that is
missing is built once, here, and used everywhere.

Root: `apps/web/src/components/saqeel/` · Barrel: `components/saqeel/index.ts`
Contract every entry must satisfy: `rules/WEB-002-design-system.md` §4.

Status values:

- `hardened` — meets the WEB-002 §4 primitive contract, CSS Module, axe-clean,
  dark + RTL verified, ledger row complete
- `inherited` — exists and is in use, not yet audited against the contract
- `to-build` — needed by the tracker, does not exist yet
- `domain` — knows about the business; belongs in `components/<domain>/`, not here

---

## actions/

| Component | Status | Notes |
| --- | --- | --- |
| `Button` | inherited | accepts `className` — must lose the escape hatch (WEB-002 §4.5) |
| `IconButton` | to-build | currently a `Button` variant; needs its own labelling contract |
| `ButtonGroup` | inherited | |
| `SplitButton` | inherited | |

## inputs/

| Component | Status | Notes |
| --- | --- | --- |
| `Field` | inherited | owns label/description/error wiring — audit against WEB-003 §5 |
| `Input`, `TextArea` | inherited | |
| `Select` | inherited | |
| `Combobox` | inherited | audit APG keyboard contract |
| `Choice` (Checkbox, Radio) | inherited | |
| `Switch` | to-build | extract from `Choice`; full toggle contract |
| `SegmentedControl` | inherited | audit arrow-key navigation |
| `FileUpload` | inherited | |
| `DateRangePicker` | inherited | |
| `StatusSelector` | inherited | |

## surface/ — the layout and container vocabulary

| Component | Status | Notes |
| --- | --- | --- |
| `Card` | to-build | the most-requested missing primitive |
| `Panel` | to-build | |
| `Section` | to-build | |
| `SectionHeader` | to-build | title + description + actions slot |
| `Divider` | to-build | |
| `Stack` | to-build | vertical rhythm — the only source of vertical spacing |
| `Cluster` | to-build | horizontal grouping with wrap |
| `Grid` | to-build | token-driven columns |

Once these exist, **no component sets its own outer margin** (WEB-002 §4.6).

## data/

| Component | Status | Notes |
| --- | --- | --- |
| `StatusBadge` → rename `StatusPill` | inherited | ten canonical roles; keep text-plus-shape |
| `Tag` | inherited | |
| `Avatar`, `UserChip` | inherited | |
| `KPICard` → `KpiTile` | inherited | rebuild on `Card` |
| `MetricStrip` | inherited | |
| `DescriptionList`, `DetailRow`, `DetailList` | inherited | |
| `Timeline` | inherited | |
| `Accordion` | inherited | two implementations exist — see retirement ledger |
| `DataGrid` | inherited | 10 KB; audit table semantics and keyboard grid contract |

## feedback/

| Component | Status | Notes |
| --- | --- | --- |
| `Alert`, `Toast`, `Modal`, `Drawer`, `Tooltip`, `Menu` | inherited | audit focus trap and Escape on all overlays |
| `EmptyState` | inherited | |
| `Skeleton`, `Progress` | inherited | skeletons must match final geometry |
| `StateSurface` | inherited | 8 KB; the canonical "Not configured / Unavailable / Insufficient evidence" surface |
| `MapTruthState`, `SyncIndicator`, `DiffView` | inherited | |

## navigation/

| Component | Status | Notes |
| --- | --- | --- |
| `Sidebar`, `TopBar`, `PageHeader` | inherited | rebuilt server-first in T-010 |
| `Breadcrumb`, `Tabs`, `Steps`, `Pagination` | inherited | tabs must be `searchParams`-driven |
| `UserMenu`, `CommandPalette` | inherited | client islands |
| `FilterBar`, `FilterRule`, `ColumnManager` | inherited | |

## media/ — new

| Component | Status | Notes |
| --- | --- | --- |
| `Icon` | to-build | T-001; the only component that may render a glyph |
| `icon-registry.ts` | to-build | T-001; semantic name → `lucide-react` component |
| `Thumbnail` | to-build | `next/image` wrapper enforcing the alt-text law |
| `Figure` | to-build | image + caption + accessible description |

## map/ · inspection/ · signature/

`MapMarker`, `MapCluster`, `MapPanel`, `MapLegend`, `MapLayerControl`,
`MapToolbar`, `MapZoom`, `GeoWorkspace`, `ChecklistQuestion`, `CheckInOverride`,
`ComplianceScore`, `DueDate`, `EvidenceCard`, `FindingCard`, `InspectionCard`,
`ReviewPanel`, `SeverityIndicator`, `AuditTrail`, `EvidenceStack`,
`ExceptionRail`, `StatusSpine` — all `inherited`.

**These are domain components living in the design system.** `InspectionCard`
knows what an inspection is; by WEB-002 §4.1 it is not a primitive. They move to
`components/inspection/`, `components/map/`, and `components/evidence/` as their
screens are migrated, composed from `surface/` and `data/` primitives.

---

## Outside the system — to be absorbed or retired

`components/` root currently holds 30 loose files (`Accordion`, `Modal`,
`Skeleton`, `Spinner`, `Tabs`, `Toast`, `EmptyState`, `Pagination`, …) that
duplicate Saqeel primitives, plus `components/field/` (22 files) and
`components/charts/` (3). Each is either absorbed into the system or marked in
`05-RETIREMENT-LEDGER.md`. Nothing new is added to `components/` root — that
directory is closed.

---

## Adding a row

A new primitive requires the six steps in `rules/WEB-002-design-system.md` §9.
No row, no merge.
