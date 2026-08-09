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
| `Button` | inherited | **`name` / `value` (T-040)**: a form with more than one outcome carries the chosen one on the button pressed. The primitive blocked a standard `<button>` capability, which forced callers to split one decision into several forms or bolt a hidden input onto each; ignored on the link branch, which submits nothing. accepts `className` — must lose the escape hatch (WEB-002 §4.5). **`variant="link"` (T-025)**: a text action for prose — no fill, no inline padding, so the label sits on the same start edge as the paragraphs around it, and hover underlines rather than painting a background. Added instead of changing `tertiary`, which carries a hover fill that is correct in the control rows where it is used everywhere else. Consumers: the planning and factories AI advisories. |
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
| `Icon` | hardened | `saqeel/icon/icon.tsx` (17 lines). Built by T-004, not T-001. Server component, sizes from `--sqx-icon-*`, colour always `currentColor`, `aria-hidden` by default, `label` promotes it to `role="img"`. `mirrored` applies `scale(var(--sqx-mirror))` for directional glyphs. No `className` escape hatch. |
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

## `components/saqeel/<name>/` — folder-per-component primitives (T-005)

| Component | Status | Lines | Notes |
| --- | --- | --- | --- |
| `icon-button` | hardened | 41 | Square, transparent by default — no border, no fill. `label` is **required in the type** and the component writes `aria-label` itself, so an unlabelled icon button cannot be built. Icon stays `--sqx-icon-md` at every size (WEB-009 §7). `forwardRef`. Badge pending `--sqx-badge-size`. |
| `kbd` | hardened | 9 | `text.code` on `--sqx-font-mono`, sunken, `--sqx-radius-inline`. `min-inline-size` pending `--sqx-kbd-min-w`. |
| `menu-surface` | hardened | 102 + 32 | **The single raised panel behind every menu** (WEB-009 §13). Owns the three dismissal behaviours no caller may reimplement: outside `pointerdown` close, `Escape` close with focus return to the trigger, optional focus trap. **Portalled and fixed (T-022):** the panel renders into `document.body` via `createPortal` and is positioned `fixed` from the trigger's viewport rect. This is structural, not cosmetic — `.sq-shell__main` is `overflow-y: auto`, and **an absolutely-positioned element cannot escape a clipping ancestor**, so no `z-index` or placement flip could have fixed the menu being cut off; `Card`'s hover `transform` was a second trap, since it would have become the containing block for a non-portalled fixed panel. `place()` writes `--sqx-menu-top`/`--sqx-menu-start`, flips above/below on the real gap each side, clamps to the viewport, and re-runs on capture-phase `scroll` so the panel tracks its trigger. `--sqx-menu-start` is measured from whichever edge `inset-inline-start` resolves to, so one declaration serves both directions, and `align="end"` hangs from the **left** in RTL (the edge is the alignment XOR the direction). **`trapFocus` now also moves focus into the panel** — a portalled panel sits at the end of the body, so Tab from the trigger would otherwise skip it entirely. Rows reserve the check gutter on unselected items so labels share one axis (§12) — **the gutter is at the row's end (T-021c)**, not its start, which was leaving dead space at the leading edge of every unselected row. A row's optional `count` renders as a **superscript `CountBadge` inside** the label rather than a full-size one beside it. `menu-row.tsx` sits beside it. |
| `count-badge` | hardened | 24 + 45 | Number chip on `--sqx-grey-a16` / `--sqx-radius-sm`, tones `neutral` / `accent` / `danger`. **`superscript` (T-021c)** renders `<sup>` and swaps to a smaller box (`--sqx-space-5`, `--sqx-radius-xs`, `--sqx-text-overline`) while reusing the *same* surface and tone declarations — so the two shapes cannot drift in light or dark. The variant owns its `margin-inline-start`: that is typographic spacing binding the badge to the preceding word, and a primitive accepts no `className` (WEB-002 §4.5) so a call site could not supply it. Consumers: `select`, `menu-row`, `factories-scope-bar`. |
| `trend-bars` | hardened | 45 + 33 | **The two-caller bar chart (T-035).** Existed once inside `factory-trends`; `/dashboard`'s enforcement trend is the second caller, so it was promoted under the Rule of Two rather than copied. **Callers pass a pre-scaled `percent`, never raw values** — what a bar is measured against is a truth question (a governed 0–100 risk scale for factories; the taller of two periods for enforcement, because no enforcement target is published) and it belongs to the caller. A primitive that picked its own scale would silently decide what a chart claims. The chart is an `<ol>` with an `aria-label`, every bar carrying a visually-hidden label, so the series reads without the graphic. Height is `calc(var(--sqx-trend-value) * 1%)` off a **bare-number** custom property, the same shape `SegmentedControl` uses for its index, with a `--sqx-space-2` floor so a very small value stays a bar rather than a hairline. Tone maps to the seven status roles. |
| `select` | hardened | 145 | No native `select`. `button role="combobox"` driving a `role="listbox"` surface with `aria-activedescendant`. Full APG: Space/Enter/↓ opens · arrows move · Home/End jump · letter type-ahead · Enter selects · Escape returns focus · Tab closes. **The selected option's count is a superscript `CountBadge` inside the trigger's value (T-021c)**, so the trigger reads as one value rather than a value plus a separate object. |
| `date-range-presets` | hardened | 28 | **The one preset vocabulary** (T-021d), beside the picker that consumes it. `pastDateRangePresets` (Today · Last 7 · Last 30 · Last 90 days · Last year), `upcomingDateRangePresets` (Next 7/30 days), `windowDateRangePresets` (both — for filters over a span that crosses today, like the visit window). Labels are passed in and live once in `common.scope`. Before this, the shell, `/planning` and Visit Management each defined their own set inline — seven, three and zero respectively. **Calendar periods are deliberately absent:** `DateRangePreset` only expresses "N days from today", so a "this month" label would promise behaviour the primitive cannot deliver. |
| `date-range-picker` | hardened | 157 + 75 | No `input type="date"`. Presets column plus a 42-cell `button` grid (`calendar-month.tsx`). `Intl.NumberFormat` renders Arabic-Indic digits; in-range week caps use logical corner radii so the range mirrors in RTL. |
| `text-input` | blocked | — | Needs nothing now — `--sqx-control-pad-icon` was added by T-005a. Ready to build. |
| `search-field` | blocked | — | Needs `--sqx-search-w`, `--sqx-kbd-min-w`. `menu-surface` now exists. |
| `switch` | blocked | — | Needs `--sqx-switch-track-w`, `-track-h`, `-thumb`. |
| `segmented-control` | blocked | — | Needs `--sqx-segmented-pad`. The `--sqx-rim-light` shape is resolved — it is now a per-theme shadow. |
| `avatar` | blocked | — | Needs `--sqx-avatar-sm/md/lg`, `--sqx-avatar-status`. |

**Barrel name collisions.** `components/saqeel/index.ts` still exports `Select`,
`Switch`, `SegmentedControl`, `Avatar` and `DateRangePicker` from the legacy
`inputs/` and `data/` trees. T-005a exported the new ones as `SaqeelSelect` and
`SaqeelDateRangePicker` rather than touching files outside its scope. Retire the
legacy exports and the prefixes come off.

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
| `shell-topbar/shell-scope-controls.tsx` | **client** | 85 | Date + region scope → `searchParams`. Preserved, not in the brief. **Fixed 2026-08-09 (T-021d):** it declared 16 required string keys and `shell-topbar` passed 8, and `locale` was never passed at all — five of seven presets rendered `undefined` labels and the range/calendar formatted with an undefined locale, so the topbar never showed Arabic-Indic digits. This was the long-standing `shell-topbar.tsx:81` typecheck error. Presets now come from `date-range-presets`, and the strings contract is the keys actually used plus a `presets` group. |
| `shell-topbar/shell-admin-palette.tsx` | **client** | 93 | ⌘K admin tool palette. Preserved, not in the brief. |
| `shell-mobile-nav/shell-mobile-nav.tsx` | **client** | 83 | Drawer; focus trap, Escape, scroll lock, focus return. Takes the rail as `children` through the boundary. |
| `shell-page-frame/shell-page-frame.tsx` | server | 44 | Title + description + breadcrumb + actions + content slot. **Supersedes the default `Shell` export**; adopting it in the 55 route files is future work. |

`features/shell/` holds the data layer: `queries.ts` (63), `mappers.ts` (132),
`types.ts` (54), `notification-strings.ts` (58). `features/factories/` holds
`portfolio.ts` (82) — the row type, the provenance rule and the row → panel
mapping.

---

## `components/sections/<screen>/` — screen sections

Domain components composed from Saqeel primitives. They know what a factory, a
visit or a KPI is, so by WEB-002 §4.1 they are not primitives. One folder per
component, module beside it, no `className` reaching in from outside.

`sections/dashboard/**` (13 components) and `sections/operations/**` (17) were
built by the dashboard and operations migrations; **neither has a session
record** — see `02-SESSION-LOG.md`.

| Component | Kind | Lines | Notes |
| --- | --- | --- | --- |
| `saqeel/status-pill` | server | 34 + 57 | **One size, no `size` prop.** Geometry is what `size="sm"` used to be: `--sqx-space-6` min height, `--sqx-space-2` inline padding, `--sqx-text-caption`. The `md` rung existed, six call sites defaulted into it, and the dashboard shipped two pill sizes side by side. A prop whose only correct value is one value is not a variant — it is a defect waiting to happen, so it is gone rather than defaulted. `ping` (default `true`) renders `PingDot`, which animates transform/opacity only and hides under `prefers-reduced-motion`. Tone stays the closed seven-role union. **Alignment (2026-08-08):** no `align-self` — the pill defers to its parent's `align-items`, so it centres in header/legend/inline rows; `vertical-align: middle` for inline runs; `inline-size: fit-content` alone prevents column-stretch. **Padding (2026-08-09, T-021c):** one symmetric `padding-inline: --sqx-space-3` for every pill. `[data-ping]` previously overrode **only** `padding-inline-start`, so every pinging pill carried twice the air at its leading edge and sat its last letter on the border; the ping variant now adjusts `gap` alone. One padding, no variant. |
| `dashboard/enforcement-trend` | server | 58 + 19 | **Replaced the "Trend unavailable" placeholder (T-035).** Counts `penalty_notices` issued in the scoped period against the **immediately preceding period of equal length** — not a fixed quarter, so the comparison follows whatever range the officer chose. The old card was right that no *violation* carries a governed official issue date; a penalty notice does. **An empty read is never a zero:** `penalty_notices` is invisible to most roles and RLS returns an empty set rather than an error, so `queryEnforcementTrend` returns `readable` and the card falls to a `restricted` `EmptyState` instead of charting zeros. A rise is `warning` and a fall `success` — not a verdict on enforcement, but on which movement wants reading; no baseline reads "No baseline in the previous period" rather than `+0%`. Keeps the "Open Enforcement Library" action the placeholder carried. |
| `dashboard/executive-brief` | **client** | 65 + 27 | **Replaced the "Provider output withheld" placeholder (T-035).** One `useActionState` over the existing `generateContextualInsight` server action on a new `executive_brief` surface — **generated on demand**, so no dashboard render spends a provider call. The hidden `context` field is convenience only: the action **re-reads every fact under the caller's RLS** (penalty notices, submitted inspections, factories) and takes from the client only the reporting period, validated as `^d{4}-d{2}-d{2}# 04 — Component Ledger

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
| `Button` | inherited | accepts `className` — must lose the escape hatch (WEB-002 §4.5). **`variant="link"` (T-025)**: a text action for prose — no fill, no inline padding, so the label sits on the same start edge as the paragraphs around it, and hover underlines rather than painting a background. Added instead of changing `tertiary`, which carries a hover fill that is correct in the control rows where it is used everywhere else. Consumers: the planning and factories AI advisories. |
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
| `Icon` | hardened | `saqeel/icon/icon.tsx` (17 lines). Built by T-004, not T-001. Server component, sizes from `--sqx-icon-*`, colour always `currentColor`, `aria-hidden` by default, `label` promotes it to `role="img"`. `mirrored` applies `scale(var(--sqx-mirror))` for directional glyphs. No `className` escape hatch. |
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

## `components/saqeel/<name>/` — folder-per-component primitives (T-005)

| Component | Status | Lines | Notes |
| --- | --- | --- | --- |
| `icon-button` | hardened | 41 | Square, transparent by default — no border, no fill. `label` is **required in the type** and the component writes `aria-label` itself, so an unlabelled icon button cannot be built. Icon stays `--sqx-icon-md` at every size (WEB-009 §7). `forwardRef`. Badge pending `--sqx-badge-size`. |
| `kbd` | hardened | 9 | `text.code` on `--sqx-font-mono`, sunken, `--sqx-radius-inline`. `min-inline-size` pending `--sqx-kbd-min-w`. |
| `menu-surface` | hardened | 102 + 32 | **The single raised panel behind every menu** (WEB-009 §13). Owns the three dismissal behaviours no caller may reimplement: outside `pointerdown` close, `Escape` close with focus return to the trigger, optional focus trap. **Portalled and fixed (T-022):** the panel renders into `document.body` via `createPortal` and is positioned `fixed` from the trigger's viewport rect. This is structural, not cosmetic — `.sq-shell__main` is `overflow-y: auto`, and **an absolutely-positioned element cannot escape a clipping ancestor**, so no `z-index` or placement flip could have fixed the menu being cut off; `Card`'s hover `transform` was a second trap, since it would have become the containing block for a non-portalled fixed panel. `place()` writes `--sqx-menu-top`/`--sqx-menu-start`, flips above/below on the real gap each side, clamps to the viewport, and re-runs on capture-phase `scroll` so the panel tracks its trigger. `--sqx-menu-start` is measured from whichever edge `inset-inline-start` resolves to, so one declaration serves both directions, and `align="end"` hangs from the **left** in RTL (the edge is the alignment XOR the direction). **`trapFocus` now also moves focus into the panel** — a portalled panel sits at the end of the body, so Tab from the trigger would otherwise skip it entirely. Rows reserve the check gutter on unselected items so labels share one axis (§12) — **the gutter is at the row's end (T-021c)**, not its start, which was leaving dead space at the leading edge of every unselected row. A row's optional `count` renders as a **superscript `CountBadge` inside** the label rather than a full-size one beside it. `menu-row.tsx` sits beside it. |
| `count-badge` | hardened | 24 + 45 | Number chip on `--sqx-grey-a16` / `--sqx-radius-sm`, tones `neutral` / `accent` / `danger`. **`superscript` (T-021c)** renders `<sup>` and swaps to a smaller box (`--sqx-space-5`, `--sqx-radius-xs`, `--sqx-text-overline`) while reusing the *same* surface and tone declarations — so the two shapes cannot drift in light or dark. The variant owns its `margin-inline-start`: that is typographic spacing binding the badge to the preceding word, and a primitive accepts no `className` (WEB-002 §4.5) so a call site could not supply it. Consumers: `select`, `menu-row`, `factories-scope-bar`. |
| `trend-bars` | hardened | 45 + 33 | **The two-caller bar chart (T-035).** Existed once inside `factory-trends`; `/dashboard`'s enforcement trend is the second caller, so it was promoted under the Rule of Two rather than copied. **Callers pass a pre-scaled `percent`, never raw values** — what a bar is measured against is a truth question (a governed 0–100 risk scale for factories; the taller of two periods for enforcement, because no enforcement target is published) and it belongs to the caller. A primitive that picked its own scale would silently decide what a chart claims. The chart is an `<ol>` with an `aria-label`, every bar carrying a visually-hidden label, so the series reads without the graphic. Height is `calc(var(--sqx-trend-value) * 1%)` off a **bare-number** custom property, the same shape `SegmentedControl` uses for its index, with a `--sqx-space-2` floor so a very small value stays a bar rather than a hairline. Tone maps to the seven status roles. |
| `select` | hardened | 145 | No native `select`. `button role="combobox"` driving a `role="listbox"` surface with `aria-activedescendant`. Full APG: Space/Enter/↓ opens · arrows move · Home/End jump · letter type-ahead · Enter selects · Escape returns focus · Tab closes. **The selected option's count is a superscript `CountBadge` inside the trigger's value (T-021c)**, so the trigger reads as one value rather than a value plus a separate object. |
| `date-range-presets` | hardened | 28 | **The one preset vocabulary** (T-021d), beside the picker that consumes it. `pastDateRangePresets` (Today · Last 7 · Last 30 · Last 90 days · Last year), `upcomingDateRangePresets` (Next 7/30 days), `windowDateRangePresets` (both — for filters over a span that crosses today, like the visit window). Labels are passed in and live once in `common.scope`. Before this, the shell, `/planning` and Visit Management each defined their own set inline — seven, three and zero respectively. **Calendar periods are deliberately absent:** `DateRangePreset` only expresses "N days from today", so a "this month" label would promise behaviour the primitive cannot deliver. |
| `date-range-picker` | hardened | 157 + 75 | No `input type="date"`. Presets column plus a 42-cell `button` grid (`calendar-month.tsx`). `Intl.NumberFormat` renders Arabic-Indic digits; in-range week caps use logical corner radii so the range mirrors in RTL. |
| `text-input` | blocked | — | Needs nothing now — `--sqx-control-pad-icon` was added by T-005a. Ready to build. |
| `search-field` | blocked | — | Needs `--sqx-search-w`, `--sqx-kbd-min-w`. `menu-surface` now exists. |
| `switch` | blocked | — | Needs `--sqx-switch-track-w`, `-track-h`, `-thumb`. |
| `segmented-control` | blocked | — | Needs `--sqx-segmented-pad`. The `--sqx-rim-light` shape is resolved — it is now a per-theme shadow. |
| `avatar` | blocked | — | Needs `--sqx-avatar-sm/md/lg`, `--sqx-avatar-status`. |

**Barrel name collisions.** `components/saqeel/index.ts` still exports `Select`,
`Switch`, `SegmentedControl`, `Avatar` and `DateRangePicker` from the legacy
`inputs/` and `data/` trees. T-005a exported the new ones as `SaqeelSelect` and
`SaqeelDateRangePicker` rather than touching files outside its scope. Retire the
legacy exports and the prefixes come off.

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
| `shell-topbar/shell-scope-controls.tsx` | **client** | 85 | Date + region scope → `searchParams`. Preserved, not in the brief. **Fixed 2026-08-09 (T-021d):** it declared 16 required string keys and `shell-topbar` passed 8, and `locale` was never passed at all — five of seven presets rendered `undefined` labels and the range/calendar formatted with an undefined locale, so the topbar never showed Arabic-Indic digits. This was the long-standing `shell-topbar.tsx:81` typecheck error. Presets now come from `date-range-presets`, and the strings contract is the keys actually used plus a `presets` group. |
| `shell-topbar/shell-admin-palette.tsx` | **client** | 93 | ⌘K admin tool palette. Preserved, not in the brief. |
| `shell-mobile-nav/shell-mobile-nav.tsx` | **client** | 83 | Drawer; focus trap, Escape, scroll lock, focus return. Takes the rail as `children` through the boundary. |
| `shell-page-frame/shell-page-frame.tsx` | server | 44 | Title + description + breadcrumb + actions + content slot. **Supersedes the default `Shell` export**; adopting it in the 55 route files is future work. |

`features/shell/` holds the data layer: `queries.ts` (63), `mappers.ts` (132),
`types.ts` (54), `notification-strings.ts` (58). `features/factories/` holds
`portfolio.ts` (82) — the row type, the provenance rule and the row → panel
mapping.

---

## `components/sections/<screen>/` — screen sections

Domain components composed from Saqeel primitives. They know what a factory, a
visit or a KPI is, so by WEB-002 §4.1 they are not primitives. One folder per
component, module beside it, no `className` reaching in from outside.

`sections/dashboard/**` (13 components) and `sections/operations/**` (17) were
built by the dashboard and operations migrations; **neither has a session
record** — see `02-SESSION-LOG.md`.

| Component | Kind | Lines | Notes |
| --- | --- | --- | --- |
| `saqeel/status-pill` | server | 34 + 57 | **One size, no `size` prop.** Geometry is what `size="sm"` used to be: `--sqx-space-6` min height, `--sqx-space-2` inline padding, `--sqx-text-caption`. The `md` rung existed, six call sites defaulted into it, and the dashboard shipped two pill sizes side by side. A prop whose only correct value is one value is not a variant — it is a defect waiting to happen, so it is gone rather than defaulted. `ping` (default `true`) renders `PingDot`, which animates transform/opacity only and hides under `prefers-reduced-motion`. Tone stays the closed seven-role union. **Alignment (2026-08-08):** no `align-self` — the pill defers to its parent's `align-items`, so it centres in header/legend/inline rows; `vertical-align: middle` for inline runs; `inline-size: fit-content` alone prevents column-stretch. **Padding (2026-08-09, T-021c):** one symmetric `padding-inline: --sqx-space-3` for every pill. `[data-ping]` previously overrode **only** `padding-inline-start`, so every pinging pill carried twice the air at its leading edge and sat its last letter on the border; the ping variant now adjusts `gap` alone. One padding, no variant. |
 with `from <= to` — a filter is not a fact. `accent="ai"`, advisory pill, `variant="link"` generate button. **The prompt forbids causation:** these counts show that enforcement moved, never why, so `ai-gemini.ts` bars asserting a cause, a responsible party, a regulation or a policy, and the card says so to the reader. |
| `regulations/catalogue/regulations-screen` | server | 105 + 18 | **The `/compliance` catalogue (T-036), reached from `/admin/regulations` too — the middleware rewrites the latter, and every href is rebased on `__shellRoute` so the alias stays on the alias.** Composes the authority rail and the catalogue card over one parallel read pair. Search and lifecycle filters live in `searchParams`, so the whole screen is a Server Component — the 314-line `RegulationRegister` island it replaced held `useState` for both, filtering an array the server had already loaded. A library read that fails renders a **degraded card with a retry**, not an empty catalogue: an unreadable library is not an empty one. |
| `regulations/catalogue/regulation-authority-nav` | server | 52 + 55 | Groups the library by `issuing_authority` (T-036). The legacy screen folded null authorities into a literal `"Other"` — indistinguishable from an authority actually named Other. There is no authority registry to join against, so the groups and counts come from the recorded text — and the card says so in a caption rather than implying a reconciled register. **Regulations with no recorded authority get their own group**, italicised and muted, instead of vanishing from a navigator that claims to cover the library. A real `<nav aria-labelledby>` of links with `aria-current`; the mock's equivalent hardcodes counts that do not match its own row list. |
| `regulations/catalogue/regulation-catalogue` | server | 102 + 47 | The register on `DataTable` (T-036), replacing a bespoke `.table` whose View link pointed at `/admin/regulations/{id}` — a path the page's own routing comment says is never implemented. Adds clause, **inspection-item and violation** footprint columns. **Every footprint is `number | "unknown"`:** a `verified_unknown` clause payload, or a failed `violation_codes` read, prints "Unknown" — never `0`. Verified zero reads "None". A publishable-blocking row (active with no clauses) carries that sentence under its code rather than a bare warning glyph. The selected row is `aria-current` via `getRowSelected` **and** a "Selected" label — selection is never colour alone. |
| `regulations/catalogue/regulation-filter-bar` | server | 64 + 71 | Search as a GET form, lifecycle as **links** (T-036). The chips it replaced were `<button aria-pressed>` mutating a client array; as links they are shareable, navigable and undone by Back. Status chips are **derived from the data**, not a fixed list: the view emits `draft` and `locked` alongside the three lifecycle states, and a chip for a state nothing is in is noise. Counts ride as superscript `CountBadge`s. Authority and lifecycle survive a search as hidden inputs, so one filter never silently clears another. |
| `regulations/catalogue/regulation-governance-notice` | server | 81 + 6 | Writers get the request-controlled path with both actions; everyone else gets why they cannot write (T-036). **`unverified` is deliberately not folded into read-only** — the role read failed, so the card states that rather than describing a role it never resolved. |
| `enforcement/library/enforcement-screen` | server | 138 + 4 | **The enforcement library (T-041)**, reached from `/admin/violations` without `?mode=`. Zero client islands; filters, the date range and the open record are all `searchParams`. An unreadable `inspection_penalties` is distinguished from an empty one, so a role-hidden penalty never renders as "none recorded". |
| `enforcement/library/enforcement-table` | server | 152 + 12 | Nine columns of recorded enforcement (T-041). **Two schema defects fixed here:** the Inspection column printed `id.slice(0, 8)` when `inspections.inspection_no` — the official `INS-YYYY-NNNNNN` — was recorded all along, and the single Status column showed the *inspection's* workflow state on a *violation* row. Now **Record** (inspection state or Invalidated) and **Action** (the linked action form's open/closed, the vendor mock's Open/Closed), with "No action form" where none exists rather than an invented closed state. Penalty shows type, the amount from `mapping_snapshot` when one is recorded, and **issued vs informational** — a governed distinction the legacy printed as a raw lowercase word. |
| `enforcement/library/enforcement-record` | server | 125 + 9 | The single record (T-041). Replaces a drawer that was **not a dialog**: `aria-modal="true"` on an `<aside>` with no focus trap and no focus management, and a **content-free `<a>`** as the scrim — a link announcing nothing. It is now an ordinary card in the page flow with an explicit Close, so nothing claims a behaviour it does not have. Keeps the evidence-hash custody line and blocking-field completeness, which the vendor mock has no equivalent for. |
| `enforcement/library/enforcement-filter-bar` | server | 85 + 38 | Search, status, date range, region and export as one GET form (T-041). Selects carry real `<label>`s through `Field` rather than `aria-label` alone. The export href drops the open record — a spreadsheet of one row because a drawer was open is not what the button offers. |
| `enforcement/catalogue/catalogue-screen` | server | 118 + 7 | The violation/penalty catalogue admin (T-041), reached at `/admin/violations?mode=`. **The mode is now always explicit**: the legacy tab bar pointed its catalogue tab at bare `/admin/violations`, which the middleware rewrites to the enforcement library, so the screen could not navigate back to itself. Read-only by contract — `canConfigure` was hard-coded `false`, so the entire 275-line write layer was unreachable and is deleted; a governance card states where configuration actually happens. |
| `enforcement/catalogue/violation-code-card` | server | 127 + 10 | One catalogue code (T-041): legal trace, category, corrective action and grace, plus trigger trace and version history as disclosures. **Lifecycle is derived from `active_from`/`active_to` and says so** beside the result — and now against the **Riyadh** day. The legacy compared against `toISOString().slice(0, 10)`, the UTC day, which rolls over three hours early, so between 21:00 and midnight local a code could read as active a day before it was. |
| `enforcement/catalogue/penalty-mapping-card` | server | 97 + 6 | The one-to-one penalty mapping (T-041): reference, legal basis, type, amount, grace, due-within, effective window and mapping version. An unmapped violation states that a mapping is required rather than showing an empty record. |
| `approvals/queue/approval-queue-screen` | server | 200 + 15 | **The compliance approval queue (T-040).** Three columns: request rail, review sequence, package rail. Request selection, step and the status filter are all `searchParams`. **`?view=` is honoured here for the first time** — the admin home has always linked to `/admin/compliance-approvals?view=pending`, the middleware carried the parameter through the rewrite, and nothing read it, so the filter silently did nothing. |
| `approvals/queue/approval-request-rail` | server | 89 + 31 | The queue itself (T-040). A `<nav>` of links with `aria-current`, each carrying the package composition as chips and a decided/total count. **Maker-checker is mirrored in the list, not only enforced on the action** — the reviewer's own requests are filtered out, because listing them to refuse every control is worse than not listing them. Requester names come through a `namesReadable` flag: `profiles` excludes plain `admin` while this queue admits it, so an unreadable name says so rather than rendering blank. |
| `approvals/queue/approval-step-nav` | server | 37 + 24 | Overview → Regulation → Items → Violations → Penalties → Summary (T-040), each step showing its own decided/total. The legacy rail was an `<ol>` of dots with `is-current` as a class and **no way to click a step**; these are links carrying `aria-current="step"`. |
| `approvals/review/approval-field-diff` | server | 64 + 32 | Recorded against proposed, per field (T-040). A changed row carries a **text "Changed" flag** beside the highlight, so the difference is never colour alone. Structured jsonb values render as formatted JSON in a `<pre>`; the legacy squeezed `JSON.stringify(value)` onto one line inside a `<dd>`, which is unreadable for a nested object. |
| `approvals/review/approval-object-card` | server | 134 + 22 | One component of a request (T-040): the diff, its in-package dependencies, and **recorded dependents** — what the library already holds beneath the targeted entity. That is deliberately *not* an impact analysis: no impact-receipt table exists and nothing computes downstream reach, so the panel says so and the mock's "412 factories affected" is not copied. A `create` component shows no panel rather than a row of zeros. |
| `approvals/review/approval-decision-form` | **client** | 70 + 18 | Approve or reject a single object (T-040). **Return is absent, not disabled** — `decide_compliance_request_component` raises `CCR_DECISION_INVALID` for any other value, and a permanently-disabled button reads as a temporary outage rather than a rule; a line states that Return is a package decision. **Warns how many pending dependents a rejection will auto-reject**, because the database applies that cascade immediately and does not ask again. |
| `approvals/review/approval-summary` | server | 69 + 12 | The package decision summary (T-040). Missing-comment count is derived; **validation receipts and dependency conflicts are listed as "Not recorded"** rather than omitted — the mock hardcodes six green ticks and a conflict counter that nothing in this schema produces. |
| `approvals/package/approval-package-decision` | **client** | 126 + 18 | Publish / return / reject the package (T-040). Publication is gated on every object carrying a terminal decision; the database rechecks that gate, so the disabled state is a courtesy and the reason is stated rather than left implicit. Return and reject each require a reason, which the database also enforces. |
| `approvals/package/approval-progress` | server | 52 + 7 | Per-group decided/rejected/pending plus the overall count (T-040). |
| `approvals/package/approval-timeline` | server | 30 + 1 | The request history on the `Timeline` primitive (T-040). Built by `features/approvals/timeline.ts` from **four** sources — revisions, decisions, publications — so submission and return finally appear; the legacy log started at the first decision and could not show when a request was submitted or resubmitted. |
| `regulations/workspace/regulation-workspace` | server | 160 + 3 | **The six-tab regulation record (T-038).** Tabs are `searchParams`, not client state — linkable, Back-navigable, and the whole workspace stays a Server Component; the legacy `LibraryTabs` island is deleted rather than restyled. `tab` is omitted from the URL when it is `overview`, and reset whenever a filter changes, the same rule that drops `libraryId`. Each tab payload arrives as `WorkspaceTable<T>` = `{kind:"rows"} | {kind:"unavailable"}`, so **there is no shape in which a failed read reaches a table as an empty array** — the legacy carried parallel `xUnavailable` booleans beside the arrays, one refactor away from drifting. |
| `regulations/workspace/regulation-overview` | server | 67 + 17 | Recorded facts plus the footprint (T-038). States in one line the three fields the vendor mock shows and this schema does not store — description, inspection type, last-modified — so the reader knows whether the record is incomplete or the screen is. Legal source is listed from the **clauses**, because `legal_source` is a clause column, not a regulation one, and the note says so. |
| `regulations/workspace/regulation-items` | server | 108 + 31 | Inspection items with the columns the library view cannot carry (T-038): `response_model.responses` as the accepted responses, `evidence_rule` rendered as one requirement sentence, `active` as a pill, and **`response_model.mapping.<response>.violation` as the violation the item raises** — the item's own link, not clause adjacency. `.action_form` names the form beside it. Read from `inspection_items` directly; the view embeds only id/code/title. |
| `regulations/workspace/regulation-violations` | server | 93 + 31 | `violation_codes` in full (T-038): level, category, applicability, corrective action, grace days, config status. "Raised by" is computed from each item's response mapping, and a footnote states that violations attach to a **clause**, not an item — otherwise the column and the schema appear to disagree. |
| `regulations/workspace/regulation-penalties` | server | 90 + 31 | `penalty_mappings` in full (T-038): type, amount, grace, due-within, legal basis, status. **Amount is not money until it is recorded** — `Intl.NumberFormat` when present, "No amount set" when null, with a footnote that an empty amount is not zero. One violation carries at most one mapping, stated rather than assumed. |
| `regulations/workspace/regulation-versions` | server | 75 + 33 | Published versions from `compliance_entity_versions` (T-038). When that table is empty but the library view carries a `version_number`, the current version is synthesised from the view — a row the database does assert. **The mock's superseded row is fabricated** (current version minus 0.1) and is not copied. |
| `regulations/workspace/regulation-audit` | server | 38 + 6 | The audit RPC on the `Timeline` primitive (T-038). Stamps go through `formatDateTime(locale)`; the legacy printed a raw `toISOString()`. The footnote separates "nothing was logged" from "nothing happened before logging began". |
| `regulations/record/regulation-record` | server | 175 + 43 | The `/admin/regulations?id=` governed record (T-037): identity, source attachments, clauses with their mapped items, and the lifecycle control for writers. **An attachment whose signed URL could not be minted still lists, without a link** — dropping it would make a custody record lie. Unmapped clauses surface as a publication-blocking count in the section description rather than a warning glyph per row. |
| `regulations/record/regulation-lifecycle` | **client** | 93 + 44 | The one write on either screen (T-037). `useActionState` over the existing server actions, rebuilt on `Field` + `Button` + `StatusPill` with a tokened textarea and a real label. A **draft renders nothing** rather than a disabled control: a draft was never activated, so deactivation is not a transition that applies to it. |
| `factories/factory-workspace` | server | 18 + 36 | The `/factories` three-column grid: `start` / children / `end`, each an aria-labelled region. Fractional columns (`1fr 2.6fr 1fr`) rather than the legacy `236px 1fr 286px`, so no panel width is a literal and Arabic cannot be clipped by a width measured in English. Collapses 3 → 2 → 1; below `100rem` the end panel drops under the middle column and the start panel spans both rows. **Candidate primitive** — promote only when a second screen wants the same shape (Rule of Two). |
| `factories/factories-portfolio` | **client** | 175 + 101 | **Rebuilt by T-024.** Summary card is now `PORTFOLIO` + the CR with four `StatCard`s — Factories, High Risk, **Open Violations** and **Active Penalties**, the last two computed on owner-agreed definitions (`violations` via `inspections → visits` with `invalidated_at is null`; `penalty_notices` status `issued`/`served`) and rendering "Not available" when their read fails, never `0`. Licence cards dropped **Compliance %** (no such column exists anywhere — the row could only ever say "Not available") and gained **licence expiry**, formatted through `formatDate(locale)`. Licence status, expiry state and risk band moved from fact rows into a **footer pill row** — text plus shape. The summary is **one card, not four** — an overline `PORTFOLIO — <CR>` over a 2 × 2 `<dl>`, with each pair `column-reverse` so the count reads above its label while the DOM keeps the only order a `<dl>` allows (`<dt>` before `<dd>`). Counts take a tone **only when non-zero** (`danger` for high risk and open violations, `warning` for penalties, `neutral` otherwise) — a zero high-risk count is good news and must not read as an alarm, and the label always carries the meaning so tone is redundancy, never the signal. **Seeded test rows never reach this panel:** `page.tsx` filters on both `isTestFixtureEstablishment` (name/code) and `isTestSourceFactory` (source-marked), and an emptied portfolio falls to the "no factories" state. The provenance pill survives on the header for manual/unverified establishments — real records worth warning about — but can no longer say "test". |
| `factories/factory-trends` | server (used in client tree) | 71 + 79 | The `/factories` trends block (T-028), rendered inside the compliance card below penalties. **Risk trend is real** — up to six recorded `factory_risk_snapshots`, oldest first, with the delta against the previous calculation; one snapshot reads "First recorded calculation" rather than a fabricated delta. **Compliance trend states its absence** — no compliance score exists for a factory, and here the absence *is* the answer, so it keeps a titled block. **The chart is data, not decoration:** an `<ol>` whose every bar carries a visually-hidden label with its score and date, so the series reads without the graphic. Height is `calc(var(--sqx-trend-value) * 1%)` where the custom property is a **bare number** — the same shape `SegmentedControl` uses for its index, so a component supplies data and never a length (WEB-000 §7). Charted on the governed 0–100 scale, **not** normalised to the series max, which would make a flat low-risk history look dramatic. |
| `factories/factory-profile` | server (used in client tree) | 56 + 94 | The first `/factories` disclosure (T-029), reusing `factory-sections`' chrome so it is visually identical to the four beneath it. Identity / Location / Contacts as `DefinitionList`s — Activity, Region, City and the primary active `factory_representatives` contact are real; **Sector reads "Not available"** because no such column exists. **Media is counted, never previewed:** `factory_media_assets.storage_path` needs a signed retrieval surface this screen does not have, and an `<img>` with no working source is a broken image rather than a placeholder (WEB-003). The card reports the recorded counts, states that previews come from the factory profile where access is checked per asset, and links there. **Layout:** the four groups sit in a `repeat(auto-fit, minmax(--sqx-grid-min-sm, 1fr))` grid with a full-width `Button block` beneath. The copied chrome's `align-items: flex-start` had to be dropped — it shrink-wraps children to their content width, which collapsed every `DefinitionList` grid to one column; keep that in mind for anything else reusing `factory-sections`' styles. |
| `factories/factory-sections` | server (used in client tree) | 37 + 78 | The four `/factories` disclosure sections (T-028), extracted from `factory-overview` so they could be ordered **after** the compliance card — impossible while they lived inside the overview. Native `<details>`, custom `+`/`−` marker, each linking into the dossier. |
| `factories/factory-compliance` | server (used in client tree) | 143 + 21 | The `/factories` compliance block (T-027): three canonical `DataTable`s — inspection reports (governed `visits.visit_reference`, with `inspections.status` and `reviews.decision` as **separate** columns because they are different axes), violations (`violation_codes` title/code/level), and penalties (notice number, status, issue date). **Two reference columns are deliberately absent:** a violation open/closed pill (no such state exists — `invalidated_at` means *retracted*, not *resolved*; a caption says so) and a penalty amount (`penalty_notices` has no amount column). **Penalties render a `restricted` state, not an empty one, when RLS hides them** — an empty result under RLS is not an absence of facts, and "No penalty notice has been issued" would be a false statement about the record. |
| `factories/factory-snapshot` | server (used in client tree) | 46 + 88 | The `/factories` middle-column snapshot (T-026): an overall-condition panel beside a metric grid. The band **tints only the panel's inline-start border** — a filled critical block behind the reason list made the text the least readable thing in the card. Reasons are **derived from records** (open-violation count, days since last inspection or "never inspected", licence expired/expiring), never hard-coded like the reference's; when nothing raises the condition it says so rather than padding the list. Six metrics, all real: risk score, latest inspection, open violations, active penalties, employees, products. **Compliance rate and machines are absent by design** — neither exists in the schema, so a slot for them could only ever read "Not available". Metric tone is redundancy; the label always names the figure. |
| `factories/factory-overview` | server (used in client tree) | 104 + 82 | **Rebuilt by T-026** down from 159 lines: the hero (name, sub-line, opened-from eyebrow, actions, and the reference's 4-up fact row — plant number, licence type, stage, status), a `snapshot` slot, and the four disclosure sections. Three cards were **removed as duplicated or dead**: the standalone provenance card (the end panel owns provenance), the condition card (risk score/band now lead the snapshot; its other two facts were permanent "Not available"), and the snapshot-facts card (code/CR/region/city already appear in the hero sub-line). Create Inspection / View on Map appear **once**. |
| `factories/factory-identity` | server | 42 + 11 | The `/factories/[id]` dossier identity block (detail slice 2): a `Card` (eyebrow heading + `<bdi>` factory-code title) with a `DefinitionList` of the seven source-owned identity facts + a context line, and a second `Card` with the source as a `StatusPill` (tone by provenance) + synced timestamp. Presentational; facts/tone built in the page. |
| `factories/factory-actions` | server | 24 + 17 | The `/factories/[id]` header action bar (detail slice 2): two secondary `Button`s (plan one visit / start inspection plan) in a colocated flex row + the supervision note. Create-permission gating stays in the page. |
| `factories/factory-risk` | server | 41 + 16 | The `/factories/[id]` risk/condition side-rail card (detail slice 3): a `Card` whose header carries the risk band as a **`StatusPill`** (tone passed in — high/medium/low → danger/warning/success, neutral "No risk score" fallback), the score as a `CardValue kind="number"`, the version + last-recalculated pair as a `DefinitionList`, a reproducibility caption, and the driver breakdown as a tokened list (or an explicit "no driver snapshot" caption). Replaces the colour-only `cd-riskscore cd-risk-*` — score is now text **and** shape (WEB-009). Presentational; score/band/facts/driver lines built in the page (drivers narrowed type-safe, no `any`). |
| `factories/factory-location` | server | 25 + 28 | The `/factories/[id]` map-lens side-rail card (detail slice 3): a `Card` with the official coordinates (`<bdi>` + GIS-owner note), the geofence line, and its `children` (the slice-1 `FactorySpatialMap`) rendered only when `hasCoords`; otherwise a tokened placeholder shows the "coordinates unavailable" note. Replaces `cd-maplens`/`cd-coords`/`cd-mapph`. Presentational, no DOM writes; the map engine is untouched. |
| `factories/factory-location-log` | server | 47 + 0 | The `/factories/[id]` observed-locations table (detail slice 4): a `Card` + `DataTable` of arrival/check-in/override events — when (row-header `CellTime`), kind as a `StatusPill` (override → danger, else info), observed coords (`<bdi>` numeric), mismatch/reason, visit (`CellLink`). Rows pre-shaped in the page; empty falls to the `DataTable` empty state. No module (DataTable/Card own the styling). |
| `factories/factory-risk-history` | server | 66 + 21 | The `/factories/[id]` risk-history block (detail slice 4): a `Card` + `DataTable` of scoring snapshots, with the legacy `ContextualAiPanel` injected via an `ai: ReactNode` slot (stays in the page) and a related-violations sub-block (danger `StatusPill`s or a role-aware caption via `relatedEmptyNote`). Module carries only the sub-heading + pill-row layout. Presentational. |
| `factories/factory-case-timeline` | server | 109 + 26 | The `/factories/[id]` Spatial Case Timeline (detail slice 4): two SAQEEL `Timeline`s — the visit narrative (each visit's inspection/findings/actions/reviews as the event `detail`, findings & reviews as `StatusPill`s, visit/report as tokened links) and the recorded case-event log (source sync, risk snapshots, penalties, evidence). Empty visits → `EmptyState`. The legacy custom spine glyphs are intentionally dropped for the DS timeline; kind is carried by title/meta. |
| `factories/factory-inspection-history` | server | 79 + 0 | The `/factories/[id]` inspection-history table (detail slice 4): a `Card` + 9-column `DataTable`. Planning/operational render as `neutral` `StatusPill`s, inspection as `info`; versions as muted text + a report `CellLink`; violations/actions/reviews are gated by a `sensitive` prop that renders the `restricted` caption for roles without sensitive-history access. `MISSING = "—"` module const for empty cells. No CSS module. |
| `factories/factory-documents` | server | 59 + 10 | The `/factories/[id]` documents registry (detail slice 5): a `Card` + `DataTable` (type + validity as `StatusPill`s — none→neutral / expired→danger / valid→success; title is the row header) with a tokened "preview unavailable" notice under the table. `error` prop → `tone="danger"` `EmptyState`; no-rows via the `DataTable` empty state. |
| `factories/factory-representatives` | server | 55 + 0 | The `/factories/[id]` representatives table (detail slice 5): a `Card` + `DataTable` (name row-header, role, phone, email, and a flags cell with a `primary` `StatusPill` + an active/inactive pill). `error`→danger `EmptyState`. No module. |
| `factories/factory-products` | server | 50 + 0 | The `/factories/[id]` products table (detail slice 5): a `Card` + `DataTable` (name row-header, HS code, unit, annual capacity, a `primary` flag pill). `error`→danger `EmptyState`. No module. |
| `factories/factory-materials` | server | 44 + 0 | The `/factories/[id]` materials table (detail slice 5): a `Card` + `DataTable` (name row-header, source as a `StatusPill` — local→success / imported→info, HS code). `error`→danger `EmptyState`. No module. |
| `factories/factory-workforce` | server | 48 + 12 | The `/factories/[id]` workforce & indicators block (detail slice 5): a `Card` + `CardGrid` of three `StatCard`s (employees total / Saudi with a Saudization `sub` / capital), the production-capacity note, and the always-on source-owned caption. Empty state via `EmptyState`. Not a table — figures are source-owned and display-only. |
| `factories/factory-dossier` | server | 15 + 24 | The `/factories/[id]` dossier shell (detail slice 6): a 2-column grid with an `aside` slot + `children` (main). Fractional columns (`minmax(0,1fr) minmax(0,2.4fr)` at `64rem`, single column below), sticky aside at wide — tokens only, no px width (replaces the legacy `cd-w3`/`cd-side3`/`cd-main3` which used `minmax(280px,320px)`). Presentational; `data-screen-id` passthrough. |
| `factories/factory-section-nav` | server | 19 + 37 | The `/factories/[id]` in-page section nav (detail slice 6): `sections` (`{id,label}[]`) → a sticky, wrapping strip of focusable `<a href="#id">` chips (touch-height `--sqx-control-h-md`, pill radius, `--sqx-surface-header` bg, tokened `:focus-visible` ring). Replaces `cd-secstrip`/`cd-secitem`; anchors resolve to the `CardHeader` title ids set in slices 4–5. |
| `factories/factory-ai-advisory` | **client** | 67 + 44 | The `/factories` end-panel AI card (T-025). A thin `useActionState` wrapper over the **existing** `generateContextualInsight` action on its `factory_risk_explanation` surface — whose prompt is already constrained to explaining the recorded score, band, model version and stored drivers, and forbidden from recalculating risk or recommending an enforcement, licensing or inspection action. Presentation only: `accent="ai"`, the advisory pill, the standing note that the provider supplies no calibrated confidence, and **"Predicted risk — not available"** with its reason, because no forecasting model exists. Fail-closed without a key. |
| `factories/factory-risk-outlook` | server (used in client tree) | 71 + 37 | The `/factories` end-panel risk card (T-025): three labelled sections in the reference's grouping — `PREDICTED RISK` (**always "Not available"** — no forecasting model exists, and this is the most tempting figure on the screen to fabricate), `WHY THIS RISK` (score, band pill, the **recorded** driver lines or an explicit "no breakdown recorded" state, model version, latest change from the two most recent snapshots), and `NEXT BEST ACTION`. **The action is navigation, not advice** — the mock writes a specific instruction we have no finding to support, so ours points at the factory profile, which is true whatever the record holds. Absorbs what were separate `FactoryRisk` and latest-change cards so nothing is stated twice. |
| `factories/factory-trust` | server (used in client tree) | 40 + 38 | The `/factories` end-panel trust card (T-025): `LAST SYNCHRONISATION` from `source_synced_at`, and `DATA SOURCES` as **two real states** — Senaei synced/not synced, risk engine calculated/not calculated. The reference shows three unconditional green ticks; a tick that is always green tells the reader nothing. |
| `factories/factory-context` | server (used in client tree) | 58 + 11 | **Rebuilt by T-025** into the end-panel composer. Order: **`advisory` first**, then the selected-context card, `outlook`, `trust`, and the provenance card. The AI card leads the panel because it is the thing a reader comes to this column for; the governed cards beneath it are what they check the advisory against. Purely presentational — every interactive part arrives as a slot, so the client boundary stays at the leaf. |
| `visits/visit-management-screen` | server | 149 + 0 | The whole Visit Management composition (T-021a): scope bar → AI slot → status tiles → filter bar → board, on `Stack`. Reads `useT()` and `getMessages()` itself so the two route files stay at 36 lines. Shapes rows via `features/visits/rows.ts` and options/chips via `features/visits/filters.ts`. `aiPanel` and `planningHref` are the two explicit props that replace the old `targetMode` boolean fork between `/visits` and `/planning/visits`. |
| `visits/visit-scope-bar` | server | 33 + 6 | The Visit Management top stripe: `Toolbar as="header"` holding `VisitViewNavigation` (`SegmentedControl`) plus the optional `/planning` cross-link, with the RLS scope count as `trailing`. Module carries only the caption type + tabular numerals. |
| `visits/visit-status-tiles` | server | 31 + 0 | The five status counts as a `role="group"` of `CardGrid` + `StatCard` **links** — the KPI tiles are now URL state, not client filter state. `StatCard`'s `href` already stretches over the whole card via `.link::after`. A null count renders "Counts unavailable" — never a fabricated 0 when `countsAvailable` is false. |
| `visits/visit-filter-bar` | **client** | 142 + 85 | Visit Management's filters as a real `<form method="get">`: search + status + `DateRangePicker` in the primary row, sort/type/mode/region/city in a disclosure panel, active filters as removable chips. Deliberately mirrors `planning-filter-bar`'s structure and module values so the two screens read as one system (modules are never shared across directories — WEB-002 §6). Submitting is a document navigation; the server re-reads `searchParams`. |
| `visits/visit-board` | **client** | 76 + 147 | The Visit Management board island: owns the only two pieces of genuine client state left (`selected`, `activeId`) and composes spine → bulk actions → table → footer. Replaces the 706-line `VisitsBoard`. The module is shared by its three children in the same directory. |
| `visits/visit-table` | **client** | 97 + 0 | The visit list on the canonical `DataTable` (`density="compact"`), using the two new additive props: `headerControl` for the select-all checkbox and `getRowSelected` for the `data-selected` row surface. Planning status is a `StatusPill`; the row reference is a preview `<button>` (drives the spine) beside an `externalLink` `Icon` link to the detail record. |
| `visits/visit-spine` | server (used in client tree) | 46 + 0 | The selected-visit continuity panel: a `Card` whose header carries the allowed-action `StatusPill` and whose body is a two-column `DefinitionList` of the seven identity/state facts plus an "Open full detail" `Button`. Presentational — no hooks, no DOM writes. |
| `visits/visit-bulk-actions` | **client** | 180 + — | The four bulk verbs (reschedule / reassign / cancel / edit) as four labelled form groups inside one `Card`, with the eligibility preview as a `<ul>` and the cross-plan block as a persistent warning `EmptyState` — replacing a `title=` tooltip on a disabled button. Owns the idempotency-key effect and the post-submit focus move. **Still holds the screen's only native `datetime-local` and two native `<select>`s — there is no datetime primitive** (raised, not worked around). |
| `visits/visit-outcome-ledger` | **client** | 91 + — | The per-item bulk outcome ledger on `Card` + `DataTable` + `StatusPill`, with the closure receipt as a `DefinitionList`. Outcome tone map: `applied`→success, `applied_no_notification` and every `blocked_*`→warning, `error`→danger — a mixed result is never a green banner. `role="alert"` when anything is blocked or unnotified, `role="status"` when everything applied. |
| `saqeel/card` — `accent="ai"` | hardened | — | Card gained `accent?: "ai"` (T-022): a **stroke only**, on `--sqx-accent-ai` (declared in both themes), with the title in the same colour. The fill stays neutral on purpose — tinting the surface would make advisory content read as a *status*. Use it to mark generated content so a reader can tell it from recorded content before reading a word; do **not** put it on a deterministic panel that merely sits next to AI. **`:hover` must restate the accent** — `.root:hover` repaints `border-color` at equal specificity and later in source, so without `.root[data-accent="ai"]:hover` the accent vanished exactly when the card was being pointed at; hover holds the stroke and darkens the surface with `--sqx-surface-accent`. |
| `planning/planning-assistant` | server | 17 + 38 | The `/planning` AI band (T-022): a three-column grid (`1fr / 1.4fr / 0.9fr`) taking `insights`, `recommendations` and `quickActions` as slots. Collapses 3 → 2 (quick actions spanning) → 1. Pure layout — it knows nothing about AI. Columns are `display: grid` with the row `stretch`, so all three panels end at the row baseline and no dead space opens under the shorter ones — done in the section, because a primitive accepts no class from outside (WEB-002 §4.5). |
| `planning/planning-insights` | server | 40 + 32 | The AI Insights column: a deterministic headline plus four fact rows counted from real data (high-risk factories, returned, draft, expired), with an `advisory` slot for the provider text. **Facts are facts** — computed, not generated — so the panel is useful with the AI provider absent. A count that failed to read renders "Unavailable", never `0`. |
| `planning/planning-ai-advisory` | **client** | 50 + 38 | The only client island added by T-022. A thin `useActionState` wrapper over the **existing** `generateContextualInsight` server action (`planning_summary` surface) — new presentation on SAQEEL primitives, **zero new AI logic**. Carries the "Advisory only · human decides" `StatusPill`, the evidence line, and an explicit statement that the provider supplies no calibrated confidence. Fail-closed: without a key the action's neutral message renders in a `role="alert"` and nothing is generated or stored. |
| `planning/planning-recommendations` | server | 62 + 57 | Top four factories by **recorded `factories.risk_score`**, each with a risk-band `StatusPill`, the score labelled *Risk score* (**never "confidence"** — the provider supplies none), a derived reason (no visit / draft / returned / high risk), and Plan → `/planning/single?factory=…` + Review → `/factories/…`. Empty state when no factory in scope carries a high band. |
| `planning/planning-create-menu` | **client** | 90 + — | The "Create a visit" quick action (T-022): a `MenuSurface` (`role="menu"`) over the **same three governed methods** the page's `CreateVisitSection` offers — bulk / single / immediate, same titles, descriptions and routes — so the two cannot drift. Lives **inside** `planning-quick-actions/` to share its module (WEB-002 §6 forbids importing a module across directories; same reason `menu-row.tsx` sits beside `menu-surface.tsx`). Inherits `MenuSurface`'s outside-pointer close, Escape-with-focus-return and viewport-aware placement. Options use registry icons, not `CreateVisitSection`'s emoji glyphs; a blocked method renders as a disabled `menuitem` with its reason, never a dead link. |
| `planning/planning-quick-actions` | server | 49 + 109 | **Not an AI panel** — no `accent="ai"`, and a `workflow` icon rather than the sparkle, because it is deterministic navigation with counted links and nothing about it is generated. Marking it as AI would defeat the accent's purpose. Five `<Link>` rows plus the create menu, each with a leading registry icon on an `--sqx-control-h-lg` target. **`count` is `number \| "unavailable"` and optional** — absent means the action has no count, `"unavailable"` means a read genuinely failed. They were one `null` at first, which made two available actions render "Unavailable"; a state that means two things eventually renders the wrong one. Every href goes where its label promises: returned/draft/awaiting-supervisor filter the list, "Plan recommended" and "Build a bulk plan" enter `/planning/bulk`, "Create a visit" enters `/planning/single`. **"Generate Weekly Plan" links into the human bulk flow** rather than having AI create visits, which the AI docket forbids. |
| `planning/planning-stat-cards` | server | 31 + 0 | The eight-bucket row on `CardGrid` + `StatCard`, as a labelled `role="group"`. Five buckets link to their list tab; **"Needs Planning" and "Expiring Windows" render "Not configured"** because neither has a governed definition (no such `planning_status`; no SLA threshold). The layout matches the mock without faking either figure. |
| `planning/planning-skeleton` | server | 125 + 129 | The `/planning` loading state (T-021e), replacing the shared `RouteLoading` — a centred glyph in its own nested `<main>` that mirrored nothing. Reproduces the real first-paint order: view toggle → heading + subtitle → right-aligned action row → filter bar → table card with a shaded header band and 8 × 7-column rows → count/pagination footer. The create-method grid is **deliberately absent**: `CreateVisitSection` is collapsed until clicked, so drawing it would mirror a state the page never loads in. Keeps `Shell title=""` to match the page, so no heading appears and vanishes across the load boundary. Zero client JS. **Mirrors the CSS, not the JSX:** `/planning` still gets `.sq-planning-heading` (one row, `space-between`, bottom-aligned) and `.grid-toolbar` (bordered bar, actions from the start edge) from the frozen legacy sheets, and both lay out differently from how the component tree reads. Toolbar bones use `repeat(auto-fit, var(--sqx-space-13))` rather than a `Skeleton` percentage width — percentages scale a control-sized bone with the viewport, and `auto-fit` wraps on narrow screens without a second breakpoint. |
| `visits/visits-skeleton` | server | 86 + 69 | The Visit Management loading state (T-021c), replacing a centred "Loading visits" `EmptyState` that mirrored nothing. Reproduces the real composition section for section — scope bar → five status tiles on `CardGrid` → filter bar → selected-visit card → the table card with a shaded header band and eight rows → count/load-more footer — on `Card`/`CardGrid`/`Stack`/`Skeleton`/`SkeletonRegion` only. Zero client JS. Its stacking breakpoint is `75rem`, matched **deliberately** to `data-table.module.css` so the skeleton and the real table collapse together; media queries cannot read custom properties, so that one raw value is unavoidable. |
| `visits/visit-ai-summary` | server | 26 + 0 | `WidgetBoundary` + the legacy `ContextualAiPanel` wired to the new `planning.visit.ai` i18n group. Rendered on `/visits` only; `/planning/visits` passes `null`. |
| `factories/factories-scope-bar` | **client** | 44 + 25 | The `/factories` top stripe. `Field` + `SaqeelSelect` + `Button` + `CountBadge` on a real `<form method="get">`; the pending scope rides a hidden `scope` input, so submitting is a document navigation and the server re-reads `searchParams`. One `useState` (pending scope), no effect. Deliberately **not** built on `Toolbar` — `Toolbar` centres its items and this row must align on `flex-end` because `Field` is two lines tall, the same reason `operations-scope-filter` owns a module. Select trigger and `Button size="md"` both resolve `--sqx-control-h-md`, so WEB-009 §1 holds by construction. |

---

## Adding a row

A new primitive requires the six steps in `rules/WEB-002-design-system.md` §9.
No row, no merge.
