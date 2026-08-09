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
| `factories/factory-workspace` | server | 18 + 36 | The `/factories` three-column grid: `start` / children / `end`, each an aria-labelled region. Fractional columns (`1fr 2.6fr 1fr`) rather than the legacy `236px 1fr 286px`, so no panel width is a literal and Arabic cannot be clipped by a width measured in English. Collapses 3 → 2 → 1; below `100rem` the end panel drops under the middle column and the start panel spans both rows. **Candidate primitive** — promote only when a second screen wants the same shape (Rule of Two). |
| `factories/factories-portfolio` | **client** | 175 + 101 | **Rebuilt by T-024.** Summary card is now `PORTFOLIO` + the CR with four `StatCard`s — Factories, High Risk, **Open Violations** and **Active Penalties**, the last two computed on owner-agreed definitions (`violations` via `inspections → visits` with `invalidated_at is null`; `penalty_notices` status `issued`/`served`) and rendering "Not available" when their read fails, never `0`. Licence cards dropped **Compliance %** (no such column exists anywhere — the row could only ever say "Not available") and gained **licence expiry**, formatted through `formatDate(locale)`. Licence status, expiry state and risk band moved from fact rows into a **footer pill row** — text plus shape. The summary is **one card, not four** — an overline `PORTFOLIO — <CR>` over a 2 × 2 `<dl>`, with each pair `column-reverse` so the count reads above its label while the DOM keeps the only order a `<dl>` allows (`<dt>` before `<dd>`). Counts take a tone **only when non-zero** (`danger` for high risk and open violations, `warning` for penalties, `neutral` otherwise) — a zero high-risk count is good news and must not read as an alarm, and the label always carries the meaning so tone is redundancy, never the signal. **Seeded test rows never reach this panel:** `page.tsx` filters on both `isTestFixtureEstablishment` (name/code) and `isTestSourceFactory` (source-marked), and an emptied portfolio falls to the "no factories" state. The provenance pill survives on the header for manual/unverified establishments — real records worth warning about — but can no longer say "test". |
| `factories/factory-overview` | server (used in client tree) | 178 + 96 | The `/factories` middle column (T-020c pass 1): hero `Card` (identity, action `Button`s, licence `DefinitionList`), a provenance `Card` (`StatusPill` + body), a condition `Card` (risk as a **`StatusPill`**, not the legacy colour-only `data-risk`), a snapshot `Card`, and four native `<details>` sections styled by a colocated module (tokens only, custom `+`/`−` marker). No hooks/handlers/DOM writes — presentational, composed inside the client `RevampFactory360Portfolio`. Mapping (`conditionOf`, `provenanceDetail`) lives in `features/factories/portfolio.ts`. |
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
