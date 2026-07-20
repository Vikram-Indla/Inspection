# COMPONENT_CATALOG — SAQEEL Inspection

Every component: source `components/<group>/<Name>.jsx`, props contract `<Name>.d.ts`, usage `<Name>.prompt.md`. All are RTL-safe (logical properties), theme-agnostic (semantic tokens) and keyboard-accessible. Shared rules: hover/pressed from action ramp; :focus-visible ring; disabled 45% opacity; loading preserves layout.

## actions/
- **Button** — variants primary(1 per view)/secondary/tertiary/ghost/danger; sm/md/lg; loading/disabled/iconOnly/block.
- **ButtonGroup**, **SplitButton** (primary + overflow chevron).

## inputs/
- **Field** (label/required/help/error wrapper; error = role=alert + aria-describedby at implementation).
- **Input** (text/number/password/search/date/time/tel; `mono` = Plex Mono + forced LTR), **TextArea**, **Select**, **Checkbox** (indeterminate), **RadioGroup**, **Switch**, **SegmentedControl**, **FileUpload**.
- Combobox/multi-select/autocomplete/date-range: compose Input + popover listbox (ARIA combobox pattern) — visual spec = Input + surface-raised menu, accent-soft active option.
- Signature/location/coordinate inputs: Input mono + map-assisted picker (MapPanel); capture canvas styled as FileUpload plate.

## navigation/
- **Sidebar** (groups, counts, collapse→icons+tooltips), **TopBar** (start/search/end slots), **PageHeader** (breadcrumb/title/meta/actions/tabs), **Breadcrumb**, **Tabs** (+vertical), **Pagination**, **Steps**.
- Command palette / global search: Modal at surface-raised + Input search + DataGrid-style result rows.
- Language & theme selectors: SegmentedControl (EN/AR) + ghost icon button (theme) in TopBar end slot.

## feedback/
- **Alert** (critical/warning/info/success; persistent), **Toast** (transient, accent edge), **Modal** (Esc + backdrop close; focus trap at impl.), **Drawer** (inline-end; RTL flips), **EmptyState** (covers empty/no-results/error/permission/offline via copy+icon), **Skeleton**, **Progress**.
- Tooltip/Popover: .tooltip class (graphite, 260px max); popover = surface-raised + shadow-md.

## data/
- **StatusBadge** (10 fixed semantics), **Tag** (categories/filters; removable), **KPICard**, **MetricStrip**, **DescriptionList**, **Avatar**/**UserChip**, **Timeline**, **Accordion**.

## grid/ — Inspection Data Grid (flagship)
**DataGrid**: sticky header, pinned ID column, multi-sort (shift-click), search/filter/saved-view/column/export toolbar slots, selection + bulk bar, row expansion, inline actions, comfortable/compact densities, footer pagination + total, loading (skeleton rows)/empty/error, truncation + title tooltips, virtualisation via windowed rows. Misuse: card-styled rows, hidden actions, >2 font sizes per row, low-contrast headers.

## inspection/
- **InspectionCard** (summary/assignment/queue variants), **FindingCard** (finding/violation/corrective; 3px severity edge — the ONLY left-border accent), **SeverityIndicator** (bars + label, colour-independent), **ComplianceScore** (fixed tone bands ≥90/≥70), **DueDate** (auto tone), **ChecklistQuestion** (compliant/violation/N-A + note + evidence; repeatable sections = Accordion), **EvidenceCard** (honest photography, meta = time · coords), **ReviewPanel** (approve/reject/escalate; reject gated on reason; terminal state), **AuditTrail**.

## map/
- **MapMarker** (facility/vehicle/inspector/zone × status tones; white keyline; selected = focus ring), **MapCluster**, **MapPanel** (+ MapLegend, MapLayerControl), **MapToolbar** (+ MapZoom). Basemap untinted in both themes; dark mode uses a dark basemap style, not an overlay.

## Accessibility requirements (all)
WCAG 2.2 AA: focus-visible ring everywhere; dialogs trap + restore focus; status = colour + text; th scope=col + aria-sort; errors via aria-describedby + role=alert; touch ≥44px on field surfaces; reduced-motion honoured; Arabic screen-reader labels alongside layout RTL.

## Added in v1.0 (formerly composition patterns — now canonical)
- **inputs/Combobox** — autocomplete, searchable select, multi-select chips; full keyboard model.
- **inputs/DateRangePicker** — cross-constrained paired date inputs.
- **inputs/StatusSelector** — dropdown of canonical StatusBadges.
- **feedback/Tooltip**, **feedback/Menu** (overflow/context menu + popover classes).
- **navigation/CommandPalette** (Ctrl/Cmd-K global search + commands), **UserMenu**, **FilterBar** (+ FilterRule advanced builder, saved views), **ColumnManager**.
## signature/ — SAQEEL signature patterns
- **StatusSpine** — inspection lifecycle spine (13 canonical stages; states done/current/pending/blocked/overdue/reopened; vertical/horizontal; compact/comfortable).
- **EvidenceStack** — evidence + provenance object (media, time, coords, inspector, linked finding, verification, audit line; list/grid/compact/detailed).
- **ExceptionRail** — ExceptionMark (shape+colour+label per state) + RailCell (4px table severity edge).
- **GeoWorkspace** — the composed Geospatial Command Workspace (basemap slot, toolbar, layers+legend, context panel, drawer, zoom; ready/loading/empty/restricted).
