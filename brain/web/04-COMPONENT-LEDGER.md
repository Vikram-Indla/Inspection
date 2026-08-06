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
| `Icon` | hardened | `saqeel/icon/icon.tsx` (17 lines). Built by T-004, not T-001. Server component, sizes from `--sqx-icon-*`, colour always `currentColor`, `aria-hidden` by default, `label` promotes it to `role="img"`. `mirrored` applies `scaleX(var(--sqx-mirror))` for directional glyphs. No `className` escape hatch. |
| `icon-registry.ts` | hardened | `saqeel/icon/icon-registry.ts` (72 lines). 34 semantic names → `lucide-react`. **The only file in the repository permitted to import `lucide-react`.** 18 names carry the `ShellIcon` union from `lib/shell-navigation.ts` so the rail maps straight through; 16 more cover topbar and control chrome. |
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

## `components/app-shell/` — the application shell (T-004)

Not design-system primitives: these know what a nav group, a persona and a
region scope are, so they live outside `components/saqeel/` by the WEB-000 §6
layer map. They ship **no CSS** — every visual is a `.sqx-shell*` class in
`app/saqeel.css`.

| Component | Kind | Lines | Notes |
| --- | --- | --- | --- |
| `app-shell.tsx` | server | 39 | Composes rail + topbar + `<main id="main-content">`. Redirects to `/login` when there is no session. |
| `shell-brand/shell-brand.tsx` | server | 14 | Mark + bilingual wordmark. Reuses `SaqeelBrandMark`. |
| `shell-rail/shell-rail.tsx` | server | 44 | The whole sidebar. `variant="rail" \| "drawer"` — one component, two aria-labelled landmarks. |
| `shell-rail/shell-nav-group.tsx` | server | 58 | Native `<details>`/`<summary>` disclosure. Zero JS. |
| `shell-rail/shell-nav-item.tsx` | server | 47 | `<Link>` + server-computed `aria-current`, or a disabled `role="link"` with its reason. |
| `shell-rail/shell-rail-toggle.tsx` | **client** | 49 | Collapse/expand; writes `data-shell-rail` on `<html>` so CSS does the rest. |
| `shell-topbar/shell-topbar.tsx` | server | 113 | Composes every control and owns all topbar i18n. |
| `shell-topbar/shell-search.tsx` | **client** | 122 | Global search combobox; nav matches + `/api/shell/search`. |
| `shell-topbar/shell-user-menu.tsx` | **client** | 88 | Account dropdown; Escape + outside-pointer close, focus returns to trigger. |
| `shell-topbar/shell-theme-toggle.tsx` | **client** | 75 | Three-way cycle system → light → dark. |
| `shell-topbar/shell-locale-toggle.tsx` | **client** | 48 | EN/ع. Preserved from `ShellClient`, not in the T-004 brief. |
| `shell-topbar/shell-scope-controls.tsx` | **client** | 80 | Date + region scope → `searchParams`. Preserved, not in the brief. |
| `shell-topbar/shell-admin-palette.tsx` | **client** | 93 | ⌘K admin tool palette. Preserved, not in the brief. |
| `shell-mobile-nav/shell-mobile-nav.tsx` | **client** | 83 | Drawer; focus trap, Escape, scroll lock, focus return. Takes the rail as `children` through the boundary. |
| `shell-page-frame/shell-page-frame.tsx` | server | 44 | Title + description + breadcrumb + actions + content slot. **Supersedes the default `Shell` export**; adopting it in the 55 route files is future work. |

`features/shell/` holds the data layer: `queries.ts` (63), `mappers.ts` (132),
`types.ts` (54), `notification-strings.ts` (58).

---

## Adding a row

A new primitive requires the six steps in `rules/WEB-002-design-system.md` §9.
No row, no merge.
