# 03 — Redesign Tracker

The work board for `apps/web`. **One task at a time.** Take the top unblocked
item in NOW. Do not start a second task until the current one clears the full
Definition of Done in `rules/WEB-006-definition-of-done.md`.

Statuses: `todo` · `in-progress` · `blocked` · `done`

---

## NOW

### T-021a · Visit Management — server-driven list, filters and board
`status: done (static verification only)` · `rules: WEB-000…004, WEB-008, WEB-009, WEB-011, WEB-012` · `est: 5h`
`record:` [2026-08-09-T-021a-visit-management-server-filters](sessions/2026-08/2026-08-09-T-021a-visit-management-server-filters.md)

The screen behind `/planning` → **Visit management** (`/planning/visits` and its
`/visits` twin). The 706-line `VisitsBoard` island is superseded by six
components under `components/sections/visits/**`, none over 182 lines; the route
went 272 → 36. Filters moved from client `useState` to `searchParams` **by
reusing `queryPlanningVisits`**, with an additive `requireReference: false` so
Visit Management keeps reference-less visits while `/planning` is unchanged.
259 i18n keys at exact `en`/`ar` parity.

`VisitsBoard.tsx` is marked `@retiring` with **zero importers** — it cannot be
deleted until the e2e gate clears.

**Owed before this can be called fully done:** e2e (`cd-026-visit-management`
and `ai-user-journey` assert against the old DOM and will fail), axe, Arabic
review by a native speaker, and the bundle measurement request.

---

### T-024 · `/factories` — replace mock content, slice by slice
`status: in-progress (start panel done)` · `rules: WEB-000, WEB-002, WEB-003, WEB-008, WEB-011` · `est: 1.5h per slice`
`record (start panel):` [2026-08-09-T-024-factories-portfolio-panel](sessions/2026-08/2026-08-09-T-024-factories-portfolio-panel.md)

Owner is replacing the vendor mock's content one panel at a time. **Start panel
done:** real open-violation and active-penalty counts (owner-agreed
definitions), licence expiry with an `Expired`/`Expiring soon` pill at 30 days,
Compliance % removed (no column exists), and the repeated provenance pill
reduced to one conditional warning on the portfolio header.

**End panel done (T-025):** "why this risk" reuses `FactoryRisk` over the
recorded driver breakdown, "latest change" comes from the two most recent risk
snapshots, the AI advisory reuses the existing `factory_risk_explanation`
surface, data sources show two honest states rather than three unconditional
ticks, and **predicted risk renders "Not available"** because no forecasting
model exists.
`record:` [2026-08-09-T-025-factories-end-panel-ai](sessions/2026-08/2026-08-09-T-025-factories-end-panel-ai.md)

**Remaining slices:** the **middle column**, and `/factories/cr/[id]`, which is
untouched legacy.

---

### T-023 · Slim `app/(app)/planning/page.tsx`
`status: todo` · `rules: WEB-001 §2, WEB-000 §2` · `est: 3h`

**555 lines against a 40-line cap** — the largest route-file violation on the
migrated surface, and T-022 made it worse by ~75. Same remedy that worked for
Visit Management: a `planning-workspace` screen component owning composition and
string mapping, route reduced to access + query + render. Also clears the
route's remaining `//` and `{/* */}` comments.

---

### T-022 · Planning assistant — insights, recommendations, quick actions, stats
`status: done (static verification only)` · `rules: WEB-000…004, WEB-008, WEB-009, WEB-011` · `est: 2.5h`
`record:` [2026-08-09-T-022-planning-assistant-panels](sessions/2026-08/2026-08-09-T-022-planning-assistant-panels.md)

The vendor mock's AI band and stat row, on SAQEEL components over the platform's
**existing** governed AI foundation — `ai_suggestions`/`ai_events`, the
fail-closed Gemini adapter, and the RLS-re-reading server action.
**No edge functions were needed or written.**

Four mock values were not governed data and were not copied: the two confidence
percentages (the provider supplies none), the per-visit AI score, "Needs
Planning" and "Expiring Windows". Recommendations rank by recorded
`factories.risk_score`; the two undefined buckets render *Not configured*.

---

### T-021e · Planning skeleton + segmented-control width
`status: done (static verification only)` · `rules: WEB-000, WEB-002, WEB-003, WEB-009, WEB-011` · `est: 40m`
`record:` [2026-08-09-T-021e-planning-skeleton-and-segment-width](sessions/2026-08/2026-08-09-T-021e-planning-skeleton-and-segment-width.md)

- **`SegmentedControl` gained `inline-size: fit-content`.** `inline-grid` is not
  "shrink to fit" for a flex/grid child — those parents blockify and stretch it,
  which is why the same control was inline in every toolbar but full-width on
  `/planning`. Fixed once at the base rather than wrapped at one call site.
- **`planning-skeleton`** replaces `RouteLoading` on `/planning`, mirroring the
  real first-paint order. The collapsed create-method grid is deliberately not
  drawn. `RouteLoading` stays — 10+ admin routes still use it.

Touches five screens; wants an LTR **and** RTL pass (mirrored sliding pill).

---

### T-021d · Shared date presets, visit-status pill, ping geometry
`status: done (static verification only)` · `rules: WEB-000, WEB-002, WEB-008, WEB-009, WEB-011` · `est: 1h`
`record:` [2026-08-09-T-021d-shared-date-presets-status-pill-ping](sessions/2026-08/2026-08-09-T-021d-shared-date-presets-status-pill-ping.md)

- **One preset set** in `saqeel/date-range-picker/date-range-presets.ts`, labels
  in `common.scope`. Shell, `/planning` and Visit Management all consume it.
- **The shell's own picker was broken** — 8 of 16 required strings, no `locale`.
  That was the `shell-topbar.tsx:81` "pre-existing" error; it hid two defects.
  **The repo now typechecks clean for the first time on this branch.**
- **Visit status** is a pinging `StatusPill`, not bare text.
- **`PingDot`** is circular by construction (`aspect-ratio`) and centred
  (`vertical-align`, explicit `transform-origin`).

---

### T-021c · Primitive refinements + Visit Management skeleton
`status: done (static verification only)` · `rules: WEB-000, WEB-002, WEB-003, WEB-009, WEB-011` · `est: 1.5h`
`record:` [2026-08-09-T-021c-primitive-refinements-and-visits-skeleton](sessions/2026-08/2026-08-09-T-021c-primitive-refinements-and-visits-skeleton.md)

Three base-primitive defects fixed at source, one skeleton built:

- **`DataTable`** — `grow` gave one column 100 % of the slack (dead gap + a
  wrapped neighbour). Rule deleted, **rung deleted**, 20 call sites updated.
- **`Select` / `MenuRow`** — the count rides inside the label as a **superscript
  `CountBadge`** (a variant of the primitive, keeping its surface and corner in
  both themes), not a full-size badge beside it; the selected-check moved to the
  row's end.
- **`StatusPill`** — symmetric `padding-inline`; `[data-ping]` no longer
  overrides only the start edge.
- **`visits-skeleton`** — mirrors the real layout; both loading routes rebuilt.

All four are visual and need a browser pass in light/dark and RTL.

---

### T-021b · Visit Management — remaining surfaces
`status: todo` · `rules: WEB-002 §2, WEB-003` · `est: 4h` · `blocked-by: T-021a e2e`

The bulk-action forms still hold native `<select>` and `datetime-local`
controls — **there is no datetime primitive**, which is the one genuine gap
blocking a fully native-control-free screen. The four sibling views
(`calendar`, `map`, `workload`, `[id]`) are untouched legacy and still hold the
`sq-table` / `sq-lozenge` rules that keep the legacy sheets alive.

---

### T-020a · `/factories` — top stripe
`status: done` · `rules: WEB-002, WEB-003, WEB-008, WEB-009, WEB-011` · `est: 1h`
`record:` [2026-08-08-T-020a-factories-scope-bar](sessions/2026-08/2026-08-08-T-020a-factories-scope-bar.md)

First slice of T-020. The portfolio chooser is now
`components/sections/factories/factories-scope-bar` — `Field` + `SaqeelSelect` +
`Button` + `CountBadge` on a GET form, new `factories` i18n namespace in `en` and
`ar`. The owner chose to keep the two-step interaction (select, then
`View factory`) rather than route on change as `operations-scope-filter` does.

Static verification only. Nothing on the row became deletable.

---

### T-030 · `StatusPill` — one size
`status: done` · `rules: WEB-002 §4.5 §7, WEB-009 §1` · `est: 30m`
`record:` [2026-08-08-T-030-status-pill-one-size](sessions/2026-08/2026-08-08-T-030-status-pill-one-size.md)

Owner-reported: two pill sizes shipping side by side on the dashboard. Cause was
`size?: "sm" | "md"` **defaulting to `md`** — 19 of 25 call sites passed `sm`,
six did not. The prop is deleted rather than re-defaulted, so the rung cannot
come back. 15 files rewritten; verified from disk at 28 call sites, zero `size=`.

One site was missed on the first pass — `app/(app)/operations/page.tsx:1216`, the
only `StatusPill` outside `components/sections/**`. **Grep the route files too.**

**This is the pattern to repeat as the app migrates:** when a primitive offers a
rung nobody should use, delete the rung. A prop with one correct value is a
future inconsistency, not a variant.

---

### T-020b · `/factories` — workspace grid and start panel
`status: done` · `rules: WEB-000…003, WEB-008, WEB-009, WEB-011` · `est: 2h`
`record:` [2026-08-08-T-020b-factory-workspace-and-portfolio](sessions/2026-08/2026-08-08-T-020b-factory-workspace-and-portfolio.md)

The screen is now a real grid: `factory-workspace` (18 + 36 lines) owns
start / middle / end on fractional columns, collapsing 3 → 2 → 1. The start
panel is `factories-portfolio` (144 + 94) on `Card`, `StatCard`, `StatusPill`
and `Icon`; mapping moved to `features/factories/portfolio.ts`.

Fixed on the way through: `<dl>` inside `<button>`, a `[dir="rtl"]` box-shadow
flip, colour-only selection, and a missing heading level. Also made
`e2e/factory360-provenance-contract.spec.ts` pass — it was already red.

Middle and end columns are still legacy. Static verification only.

---

### T-020c · `/factories` — middle column and end panel
`status: in-progress (sliced)` · `rules: WEB-000 §2, WEB-001 §2, WEB-002, WEB-011, WEB-012` · `est: 4h`
`record (pass 1):` [2026-08-08-T-020c-p1-factory-middle-column](sessions/2026-08/2026-08-08-T-020c-p1-factory-middle-column.md)
`record (pass 2):` [2026-08-08-T-020c-p2-factory-end-panel](sessions/2026-08/2026-08-08-T-020c-p2-factory-end-panel.md)

**Pass 1 done:** the middle column (`sq-f360__hero`, provenance banner,
`__condition`, `__snapshot`, four `__section` accordions) is now
`components/sections/factories/factory-overview` on Saqeel primitives; ~25 labels
moved to the `factories` i18n namespace in `en` + `ar`; risk is a `StatusPill`,
not colour-only. Static verification only.

**Pass 2 done:** the `__context` **end panel** is now
`components/sections/factories/factory-context` (Selected context / source status
/ Contextual AI cards); the `sq-f360__context` bridge and the `provenanceBadge`
map are gone; new `ai` i18n group (en + ar). All `StatusPill`s on the screen now
ping (owner request). Static verification only.

**Still remaining for full T-020c:** the route-file slim
(`app/(app)/factories/page.tsx` reads → `features/factories/queries.ts`, clearing
its legacy `//` comments and the `let`), and the orphaned-CSS deletion below.
Also open: whether pill-ping becomes a global rule (owner decision — affects
dense operations/risk tables).

Deletes on completion: `saqeel-runtime.css` 786–804 — the eighteen
`.sq-f360__summary` / `.sq-f360__license` rules orphaned by T-020b — plus
whatever the middle column releases.

Route file `app/(app)/factories/page.tsx` is 121 lines of data logic and four
comments; WEB-001 §2 caps it at 40 and moves the reads into
`features/factories/queries.ts`.

---

### T-000 · Guardrails: gate scripts, lint, verify pipeline
`status: todo` · `rules: WEB-000, WEB-006` · `est: 3h`

Nothing else starts until the rules are machine-enforced, because a rule that is
only in a document is a suggestion.

- `apps/web/scripts/gates/` — one script per gate in WEB-006 §3
- ESLint flat config: `@next/eslint-plugin-next`, `eslint-plugin-jsx-a11y`
  (all rules error), `@typescript-eslint` strict, `no-restricted-syntax` for
  `let` in `.tsx`, `no-console`
- `npm run gates`, `npm run verify`
- Wire both into `.github/workflows/`
- Baseline report: current violation count per gate, recorded in the session
  neuron, so progress is measurable

Acceptance: `npm run gates` runs, reports, and fails on a deliberately planted
violation of each rule.

---

### T-001 · Icon layer: lucide-react, registry, `Icon` primitive
`status: todo` · `rules: WEB-002 §5` · `est: 2h` · `blocked-by: T-000`

- Add `lucide-react`
- `components/saqeel/media/icon-registry.ts` — semantic name → Lucide component
- `components/saqeel/media/Icon.tsx` + `Icon.module.css` (token-driven sizes,
  `currentColor`, `aria-hidden` by default, `label` for standalone use)
- Map every glyph currently in `app/icons.tsx` to a semantic registry name
- Mark `app/icons.tsx` with the `@retiring` banner; add its ledger row
- Enable `gate:no-svg` and `gate:icon-registry`

Acceptance: `<Icon name="riskCritical" />` renders; zero new `<svg>` possible.

---

### T-002 · SAQEEL design system — one stylesheet
`status: done` · `rules: WEB-000, WEB-002, WEB-003, WEB-005, WEB-007` · `est: 5h`
`record:` [2026-08-07-T-002-design-system](sessions/2026-08/2026-08-07-T-002-design-system.md)

**Redefined by the owner on 2026-08-07.** The original T-002 ("core primitives",
CSS Modules, React components) was replaced before it started. The design system
is now **one stylesheet**, not a component library plus per-component modules.

Delivered: `apps/web/src/app/saqeel.css` — 2,050 lines, one file, three cascade
layers (`sqx.tokens`, `sqx.base`, `sqx.components`). 339 custom
properties, 59 classes, 3 keyframes. Prefix is `--sqx-` / `.sqx-` — `--sq-` and
`.sq-` belong to the legacy sheets, and `sqx` collides with nothing. Variants are data
attributes, not modifier classes. Imported once from `app/layout.tsx`.
`tokens.css` untouched. WEB-002 §6 replaced; WEB-001 §9 gained the direction
exception.

The React primitives that consume these classes are **not** part of T-002 and are
now T-004.

---

### T-003 · Install and self-host Readex Pro
`status: todo` · `rules: WEB-005 §5` · `est: 2h`

`saqeel.css` declares `--sqx-font-sans: "Readex Pro", "IBM Plex Sans Arabic",
system-ui, sans-serif` but ships no font files, so the fallback currently carries
the app. This task self-hosts the family.

- `next/font/local`, variable 160–700, one file per script (Latin, Arabic)
- Only the weights the twelve type roles use: 400, 500, 600, 700
- `display: swap`, preloaded, subset where the character set allows
- Record the byte cost per weight and drop any weight that cannot justify itself

Acceptance: no external font request, no FOIT, first-load JS unchanged, byte cost
recorded.

---

### T-004 · App shell — header, sidebar, content frame
`status: done` · `rules: WEB-000…005, WEB-007` · `est: 6h`
`record:` [2026-08-07-T-004-app-shell](sessions/2026-08/2026-08-07-T-004-app-shell.md)

**Redefined by the owner on 2026-08-07** — the board's T-004 was "React
primitives over `saqeel.css`"; that work is now **T-006**.

Delivered: `components/app-shell/**` (15 files, 897 lines), `features/shell/**`
(4 files, 307 lines), `components/saqeel/icon/**` (2 files, 89 lines), plus 638
lines of `.sqx-shell*` CSS in `app/saqeel.css`. `(app)/layout.tsx` is 6 lines.
`ShellClient.tsx` (46 KB) is off every `(app)` route. Icon layer is
`lucide-react` behind one registry — zero hand-authored `<svg>` in the shell.

**Not verified in a browser.** The SWC blocker below meant none of the brief's
13 runtime checks could run. Static verification only.

---

### T-005a · Kill the native dropdown and date picker
`status: done` · `rules: WEB-002 §2 (suspended), WEB-008, WEB-009` · `est: 3h`
`record:` [2026-08-07-T-005a-native-controls](sessions/2026-08/2026-08-07-T-005a-native-controls.md)

`menu-surface`, `select` and `date-range-picker` built; the topbar scope controls
rebuilt on them. Both Definition-of-Done greps pass. The ink and green ramps were
re-saturated at hue 152 — `--sqx-surface-canvas` is now `#000A05` and all 20
claimed contrast ratios were re-measured and confirmed.

`--sqx-rim-light` changed from a colour to a shadow, which required rewriting
`--sqx-elevation-1…4`; without it every dark elevation would have silently
dropped. `--sqx-gradient-chrome` was restated as instructed but is **not
consumed** — the chrome stays flat per the owner's earlier decision.

---

### T-005 · Header controls — the reusable control family
`status: blocked` · `rules: WEB-002 §2, WEB-008, WEB-009` · `est: 8h`
`record:` [2026-08-07-T-005-header-controls](sessions/2026-08/2026-08-07-T-005-header-controls.md)

**Blocked on 13 missing tokens.** WEB-002 §2 and WEB-008 §2 forbid adding a token
inline; a gap is reported and stopped on. Two of the ten components need no new
token and are delivered: `icon-button`, `kbd`. The other eight are blocked, and
`menu-surface` blocks five of them on its own.

Delivered: `components/saqeel/icon-button/**`, `components/saqeel/kbd/**`,
barrel exports, and the topbar's hand-built icon buttons replaced.

**Unblocking is one change request**: add the 13 tokens in the record's gap block
to `saqeel.css`, then T-005 completes in one pass.

---

### T-006 · React primitives over `saqeel.css`
`status: todo` · `rules: WEB-002, WEB-003` · `est: 5h`

The typed component layer that applies the classes T-002 built. Components ship
**no CSS** — they map props onto `.sqx-*` classes and data attributes.

- `surface/` — `Card`, `Panel`, `Section`, `SectionHeader`, `Divider`
- `surface/` layout — `Stack`, `Cluster`, `Grid` (the only sources of spacing)
- `data/StatusPill` — the ten canonical roles, text plus shape
- `inputs/Switch` (Toggle) — full APG keyboard and labelling contract
- `actions/Button`, `actions/IconButton` — rebuilt to the primitive contract
- `data/KpiTile`, `feedback/EmptyState`, `feedback/Skeleton` — rebuilt

Acceptance: each primitive under 200 lines, zero colocated CSS, axe-clean,
correct in dark and RTL, ledger rows written.

---

### T-007 · Adopt `ShellPageFrame` across the 55 route files
`status: todo` · `rules: WEB-001 §2, WEB-005` · `est: 6h` · `blocked-by: T-004`

T-004 built `shell-page-frame` but was forbidden from touching pages, so the
default `Shell` export from `components/Shell.tsx` is still imported by 55 files
under `app/(app)/**`. Each one swaps `<Shell title>` for `<ShellPageFrame>`.
Only when all 55 are migrated — plus T-008 — can `Shell.tsx` be deleted.

---

### T-008 · Migrate the two out-of-group admin layouts
`status: todo` · `rules: WEB-001 §7` · `est: 2h` · `blocked-by: T-004`

`app/admin/execution/layout.tsx` and `app/admin/dashboard-config/layout.tsx` sit
**outside** the `(app)` route group and still import the named `AppShell` from
`components/Shell.tsx`, so `ShellClient.tsx` (46 KB) still ships on those two
routes. Point them at `components/app-shell/app-shell` and `ShellClient` reaches
zero imports.

---

### T-005 · Reference route — the showcase
`status: todo` · `rules: WEB-002 §9` · `est: 2h` · `blocked-by: T-004`

A single internal route rendering every primitive in every variant, in light,
dark, English and Arabic. This is what gets opened in the manager meeting and it
is also the fastest way to spot a broken variant.

Acceptance: one page, every primitive, every state, zero axe violations.

---

## NEXT

### T-010 · Application shell
`status: todo` · `rules: WEB-001, WEB-004, WEB-005` · `est: 6h`

`ShellClient.tsx` is 45 KB of client JavaScript loaded on every route — the
single largest tax in the app.

- Rebuild `Sidebar`, `TopBar`, `PageHeader`, `Breadcrumb` as server components
- Isolate genuinely interactive pieces (menu, theme toggle, notification bell,
  command palette) as small client islands
- Navigation config becomes typed data, not JSX
- Skip link, landmarks, focus-on-route-change
- Mark `Shell.tsx`, `ShellClient.tsx`, `ShellNavIcon.tsx` for retirement

Acceptance: shared chunk drops measurably; shell fully keyboard operable; every
route inherits the improvement.

---

### T-011 · `/dashboard`
`status: todo` · `est: 5h` · `blocked-by: T-010`

`DashboardView.tsx` is 45 KB. KPI tiles, charts, and activity become server
components; charts get accessible data tables; `<Suspense>` per widget.

---

### T-012 · `/operations`
`status: todo` · `est: 6h` · `blocked-by: T-010`

`page.tsx` is 79 KB of route file — the clearest violation of WEB-001 §2 in the
repository. Becomes a ≤ 40-line page composing a server-rendered board, with
filters and tabs moved to `searchParams`.

---

## LATER

| Task | Target | Why |
| --- | --- | --- |
| T-020 | `/factories` list + `/factories/[id]` + `/factories/cr/[id]` | 45–49 KB each |
| T-021 | `/planning` + `/planning/bulk` + `/planning/single` | 41 KB + 53 KB `ReviewClient` + 34 KB `Wizard` |
| T-022 | `/reviews/[id]`, `/visits`, `/visits/[id]` | 40–46 KB each |
| T-023 | `/field` home, `/field/my-tasks`, `/field/[visitId]` | `Startup.tsx` 85 KB; strictest perf budget |
| T-024 | `/field/inspection/[id]` | `Workspace.tsx` **136 KB** — the largest single file; split last, after every primitive exists |
| T-025 | `/admin/*` | packages 46 KB, regulations 36 KB, violations 34 KB, access 27 KB |
| T-026 | `/compliance`, `/execution`, `/analytics`, `/enforcement-library` | |
| T-030 | Dynamic-import `mapbox-gl`, `leaflet`, `three`, `twilio-video` | remove from shared chunk |
| T-031 | Font weight audit — drop unused Arabic weights | ~45 KB each |
| T-032 | Legacy CSS sweep — delete orphaned rules from `saqeel-runtime.css` (170 KB) and `saqeel-components.css` (50 KB) | runs continuously, closed out here |
| T-033 | Cache posture pass — declare and tag every query | WEB-001 §5 |
| T-034 | Delete every file that has cleared its retirement gate | WEB-006 §4 |

---

## PARKED

Ideas discovered mid-task go here and are left alone until their proper turn.
Pull one in only if it is genuinely part of doing the active task well.

- **`inline-grid` / `inline-flex` is not "shrink to fit" for a flex or grid
  child** — the parent blockifies and stretches it. `SegmentedControl` carried
  that bug invisibly until a page placed it outside a toolbar (T-021e). Any
  other primitive relying on an inline display type for its width has the same
  trap armed; worth a sweep at the next design-system audit.
- **`FactoryRisk` now has two consumers** (`/factories/[id]` and the end panel),
  so by the Rule of Two it has earned promotion out of `sections/factories/` —
  but its copy is still Factory-360-specific and would need generalising first.
- **The mock's "Top Risks" list has no source.** Overdue checklist items, repeat
  violations within 12 months and inspection-cycle breaches each need a governed
  definition and a query. The recorded driver breakdown is the honest stand-in
  shipped by T-025.
- **There is no risk forecasting model.** `/factories`' end panel states
  "Predicted risk — not available" rather than projecting one. Any future
  forecast is a modelling decision, not a UI one.
- **`e2e/factory360-provenance-contract.spec.ts` asserts against raw source
  text** and was already flagged fragile. T-024 and T-025 changed both side
  panels substantially; it very likely needs updating.
- **Seeded test data is excluded on `/factories` only.** T-024 added
  `isTestSourceFactory` (source-marked test rows) beside the existing
  `isTestFixtureEstablishment` (name/code fixtures) — **two independent signals,
  and only the first was being applied**. Every other screen reading `factories`
  (`/operations`, `/planning`, the dossier routes, the AI briefing) still carries
  a partial filter or none. **Before any customer demo**, fold both into one
  shared predicate applied at the query layer, so a caller cannot apply half of
  it.
- **`invalidated_at is null` is a proxy for "open violation", not a definition.**
  `violations` has no resolution or closure state, so T-024's count means *not
  retracted*. If the table gains one, the count must move to it.
- **"Active penalty" is inferred, not a status.** `penalty_notices` has
  `issued/served/settled/withdrawn`; T-024 treats the first two as active. If the
  lifecycle grows a state, revisit.
- **`LICENCE_EXPIRY_SOON_DAYS = 30` is a display rule only.** It must not leak
  into planning or enforcement logic without being ruled a governed SLA.
- **Per-factory Compliance % has no source at all** — not a UI gap. A score would
  have to be defined and computed before the slot can return.
- **43 `emoji-as-icon` findings remain**, all on un-migrated planning sub-routes
  (`bulk`, `immediate`, `plans`, `supervision`, `single`) and other legacy
  screens. `CreateVisitSection` was cleared in T-022.
- **`MenuSurface` is now portalled and fixed — every menu in the app changed.**
  `select`, `date-picker`, `date-range-picker`, `shell-user-menu` and the
  planning create menu all inherit it. **Only the create menu was looked at; the
  other four need a browser pass in both directions**, especially
  `date-range-picker` (two-month `role="dialog"`) and `shell-user-menu`
  (`align="end"` near the viewport edge).
- **An absolutely-positioned overlay cannot escape a clipping ancestor.**
  `.sq-shell__main` is `overflow-y: auto`, so every popover inside the shell must
  portal out. Worth remembering before reaching for `z-index` on the next one.
- **`trapFocus` now moves focus into the panel**, so `date-picker` and
  `date-range-picker` gain initial focus on their first control. Correct for a
  trapped dialog, but a behaviour change to two shipped controls.
- **CSS anchor positioning would delete `MenuSurface.place()` entirely** and with
  it the WEB-012 DOM-write conflict. Not yet safe across the browsers this
  platform targets; revisit.
- **A `role="menu"` needs arrow-key navigation to meet APG.** The planning create
  menu traps focus and closes on Escape, but its items are reached with Tab.
- **A hover rule at equal specificity silently beats a variant.** `.root:hover`
  repainted `border-color` and killed `Card`'s AI accent because both selectors
  score `(0,2,0)` and `:hover` came later. Any future `Card` variant that sets a
  border must restate it under `:hover`, or the variant disappears exactly when
  the user points at it.
- **A nullable count must not mean two things.** `PlanningQuickAction.count` used
  `null` for both "this action has no count" and "the count failed to read", so
  two available actions rendered "Unavailable" (T-022). Any future optional
  figure needs the two states separated at the type.
- **"Needs Planning" and "Expiring Windows" need governed definitions.** A
  factory with no visit in the inspection year, and a day threshold before window
  end. Both render *Not configured* on `/planning` until a value is ruled.
- **"Assign unassigned visits" needs an `unassigned` planning filter.**
  `PlanningListFilters` has `inspectorId`, not "has no assignment"; a PostgREST
  "not exists" over an embedded resource could not be verified without a
  database. The quick action stays out until the filter exists.
- **The planning AI advisory is generated on demand, not on load.** A Gemini call
  per page render would be slow and costly. If the product wants it
  pre-generated, that is a scheduled job writing `ai_suggestions` and the panel
  reading the latest row — not a provider call in the render path.
- **Recommendations rank by `factories.risk_score` alone**, so a factory already
  covered by a published upcoming visit can still appear. Excluding those needs a
  "has an open visit in window" predicate worth building properly.
- **A skeleton for a part-migrated screen must be read from the CSS, not the
  JSX.** `/planning` still gets `.sq-planning-heading` (one row, `space-between`)
  and `.grid-toolbar` (a bordered bar, actions from the start edge) from the
  frozen sheets — both lay out differently from how the component tree reads,
  and T-021e's first cut mirrored the tree and got both wrong. `/planning/bulk`,
  `/reviews` and `/field` are in the same position.
- **There is no button-width token.** A skeleton bone standing in for a control
  has to borrow a spacing token, because every `Skeleton` width is a percentage
  of its container and percentages scale controls with the viewport. If more
  skeletons mirror action rows, a real control-width token is the fix.
- **Every remaining `RouteLoading` consumer is an un-mirrored loading state.**
  `/dashboard`, `/factories`, `/visits` and `/planning` now have skeletons that
  match their layout; 10+ admin routes still flash a centred glyph inside a
  nested `<main>` and re-lay-out on hydration. One per admin migration.
- **Calendar-period date presets do not exist.** `DateRangePreset` only
  expresses "N days from today", so "this month / quarter / year" cannot be
  built from it — the shell's old labels claiming otherwise were removed rather
  than kept as a lie (T-021d). Reintroducing them needs month-boundary maths in
  the primitive **and** a ruling on Gregorian vs Hijri periods, which a Saudi
  ministry platform must not assume (WEB-011).
- **Two pinging pills per visit row.** Planning status and visit status both
  ping; at 100 rows that is 200 infinite animations. Compositor-only and
  reduced-motion-safe, but if the board reads as busy the answer is a rule about
  *which* pill pings — not demoting one back to plain text.
- **A type error in a shared component is a live defect, not background noise.**
  `ShellScopeControls` carried a 16-key strings contract no call site satisfied;
  it was reported as "pre-existing" across two sessions and was hiding both
  `undefined` preset labels and a missing `locale` in the topbar (T-021d).
- **WEB-000 §2 bans `/* */` but does not scope the ban to a language**, and the
  design-system CSS (`saqeel.css`, `data-table.module.css`,
  `menu-surface.module.css`) is full of rationale comments written under these
  rules. T-021c followed that convention when commenting three primitive fixes.
  **Needs an owner ruling:** exempt design-system CSS rationale explicitly, or
  strip the comments repo-wide. A rule that the codebase visibly disobeys is
  worse than either answer.
- **`DataTable` column widths are now entirely content-driven** after T-021c
  deleted `grow`. If a screen genuinely needs a fixed proportion, that is a new
  explicit rung (a numeric weight) — not a revival of `grow`.
- **`CountBadge` now has two shapes** (inline and `superscript`). A third wants a
  named `size`/`placement` scale, not another boolean.
- **The superscript badge sits inside `MenuRow`'s `.label`**, which ellipsises.
  A label long enough to truncate will clip its own count. Only short status
  labels carry counts today; a long-label select with counts would have to move
  the badge back out to a `flex: none` sibling.
- **The reassignment roster is fetched for every visible row at page load**, not
  for the selection the user actually makes. Up to ten RPC round-trips per load,
  and because `list_available_reassignment_inspectors` is all-or-nothing per
  100-visit chunk, one out-of-scope visit anywhere on the page denies the whole
  roster. Fetching per selection (a server action on selection change) would be
  both cheaper and more precise. T-021a made the denial honest; it did not make
  it unnecessary.
- **RLS read scope is wider than `planning_closure_factory_in_scope`.** A visit
  can be readable on the board but outside reassign scope. Any future bulk verb
  gated by a closure-scope RPC will hit the same asymmetry — surface it as a
  state, never as an empty control.
- **There is no datetime primitive.** `DatePicker` is date-only, and T-005a's
  "no native date input" rule has no answer for a date **and time** window. Visit
  Management's bulk-reschedule form is the only place left holding a native
  `datetime-local`. Needed before that screen can be called control-clean.
- **`--sqx-control-accent` does not exist**, so native checkboxes cannot be
  tinted to brand without inventing a token. Left on the UA default. A real
  `checkbox`/`switch` primitive removes the need.
- **`rowSelect()` in `lib/planning/visit-list.ts` never selects `factory_id`**,
  yet `readVisibleRows` filters fixtures on `row.factory_id` — that filter has
  always been a no-op. Both `/planning` and Visit Management compensate with a
  name-based post-filter. Fixing it silently removes rows from `/planning`, so it
  needs its own task and a visual regression pass.
- **The factory-name sort was dropped from Visit Management.** The shared sort
  whitelist has no embedded-column sort, and PostgREST parent-ordering on a
  to-one embed could not be verified without a database. Either add it to
  `visit-list.ts` with a real DB to test against, or accept Planning's sort
  vocabulary everywhere.
- **`SegmentedControl` renders no ARIA role when its items are links** (it is a
  `radiogroup` only when it holds buttons). `ai-user-journey.spec.ts` asserts a
  `role="group"` around the visit view switcher. Either the spec updates, or the
  primitive gains a `group` role for the navigating variant — a design-system
  decision, not a screen one.
- **`DataTable` has no sortable-header contract.** Sorting is a `Select` in the
  filter panel. The moment a second screen wants column-header sorting, that is
  a primitive change.

- **`highRisk` has no non-colour way to signal "attention required".** The
  legacy `[data-tone="critical"] strong { color: … }` tint was dropped by T-020b
  as colour-alone signalling. Either a governed label exists for it, or the
  figure stays plain. Product question.
- **Licence selection is a toggle-button list, not an APG radiogroup.** Arrow
  keys do not move between licences; Tab does. Pre-existing behaviour, preserved.
- **`FactoryWorkspace` is a candidate primitive.** Promote it out of
  `sections/factories/` the moment a second screen wants the same three-pane
  shape — not before (Rule of Two, WEB-002 §9).
- **`e2e/factory360-provenance-contract.spec.ts` asserts against raw source
  text.** It survived T-020b's refactor as much by luck as by design; any future
  move of the provenance ternary breaks it. It should assert behaviour.
- **`Field` + `SaqeelSelect` produce an orphan `<label>`.** `Field` renders a
  visible `<label>` with no `for`, because `SaqeelSelect` exposes no id. The
  accessible name is still correct — the select self-labels via `aria-label` —
  but `jsx-a11y/label-has-associated-control` will flag every use once T-000
  lands. Fixing it inside `SaqeelSelect` fixes `operations-scope-filter` and
  `factories-scope-bar` together.
- **`gate:one-stylesheet`** — fail CI on any new `.module.css` under
  `apps/web/src`, on any `--sqx-*` or `.sqx-*` declaration outside
  `saqeel.css`, and on any `dir()` / `[dir]` rule outside the two direction rules
  in `saqeel.css`. Belongs with T-000.
- **`gate:one-prefix`** — the legacy sheets own 804 `.sq-*` class hits and seven
  live `--sq-nav-*` / `--sq-map-*` custom properties. Once T-032 clears them, a
  gate should stop `--sq-` coming back so a future rename to the shorter prefix
  stays possible.
- **`@layer` the legacy sheets.** `saqeel-runtime.css`, `saqeel-components.css`
  and `v2-components.css` are unlayered, so they outrank everything in
  `saqeel.css` regardless of order. Wrapping them in a `legacy` layer declared
  *before* `saqeel.*` would invert that and let migrated screens win without
  specificity games. Cheap, high leverage, but it changes cascade behaviour app
  wide — it needs its own task and its own visual regression pass.
- **Base-layer reset scope.** `sqx.base` resets margins on `h5 h6 figure
  blockquote dl dd ol ul` and sets `img/svg/video { display: block }` globally.
  Legacy screens zero those per class rather than globally, so the reset is new
  behaviour for any element the legacy sheets miss. Verified against the built
  app; if a screen is ever found to depend on a UA default, the fix is that
  screen, not the reset.
- **Chart series 7 and 8** are `--sqx-neon-steel-deep` / `--sqx-neon-sky`,
  primitives added to satisfy the eight-series chart scale. They are the only
  primitives in `saqeel.css` not named in the T-002 brief.
- **`--sqx-ease-linear`** exists solely so seamless looping gradients do not
  have to write the `linear` keyword inline. Delete it if a future motion pass
  removes the looping gradients.
- **`ThemeScript` cannot see `prefers-color-scheme`.** WEB-002/T-004 asked for
  resolution order stored → `prefers-color-scheme` → dark, but `ThemeScript.tsx`
  was outside T-004's editable file list. The toggle works around it by writing
  a resolved value to the `saqeel-theme` key that `ThemeScript` already reads, so
  first paint never flashes. A proper fix edits `ThemeScript` to read the media
  query itself, and must keep `ThemeChannelSync` and the toggle in agreement —
  all three encode the same fallback today.
- **Three preserved topbar controls have no home in the shell brief.** Locale
  toggle, date/region scope and the ⌘K admin palette exist in `ShellClient` and
  would have been deleted by building only the files T-004 listed. They were
  rebuilt as islands under `shell-topbar/`. If the product wants them gone, that
  is a product decision and its own task — not a side effect of a refactor.
- **Shell island count is 8, not the brief's 5.** See the T-004 record. Getting
  to 5 means deleting the three controls above.
- **`e2e/ui-compliance-runtime.spec.ts` pins `main#main-content`.** T-004's brief
  asked for `<main id="main">`; the id was kept as `main-content` so three
  existing assertions stay green. Renaming it is a cross-cutting change that
  needs the e2e file in scope.
- **`a { color: var(--text-link) }` in `saqeel-components.css:15` is unlayered
  and beats every cascade layer.** It repainted every anchor in the new shell
  legacy-blue. `.sqx-shell*` had to be moved **out** of `@layer sqx.components`
  to compete on specificity. This is the first time the "legacy outranks
  `saqeel.css`" property caused a defect rather than preventing one, and it will
  recur on every migrated screen that renders a link. Two clean fixes, both
  already parked: delete that one declaration from the frozen sheet, or wrap the
  legacy sheets in a `legacy` layer declared before `sqx.*`. Either lets the
  shell move back inside the layer. **Until then, check any new `.sqx-*` rule
  that sets `color` on an anchor.**
- **`--sqx-surface-accent` is invisible on `--sqx-gradient-chrome`.** In dark it
  is `#0A2416` and the chrome's top stop is `#0A2A18` — 1.02:1. T-004's first
  cut used it for the active nav fill and the indicator effectively did not
  exist. Anything placed on the chrome gradient must have its separation
  measured against **all three** stops, not against `--sqx-surface-default`.
  Fixed by `--sqx-nav-active-bg` / `--sqx-nav-group-bg`; the same trap is waiting
  for any future chrome element.
- **`.sq-pagehead` is `position: sticky` inside the scrolling `main`.** The new
  shell had to reproduce that scroll model exactly (`.sqx-shell__main` owns
  `overflow-y`, topbar is a flex sibling above it, not sticky) or every one of
  the 55 pages still using the legacy `Shell` frame would have had two elements
  stuck to the viewport top. Keep this in mind for T-007.

---

## BLOCKED

- ~~**`app/(app)/dashboard` imports a folder that no longer exists.**~~
  **RESOLVED / was already fixed (verified 2026-08-08).** `page.tsx` and
  `loading.tsx` now import `@/components/sections/dashboard/dashboard-sections/…`
  and `…/dashboard-skeleton/…` — the correct paths. A static import resolver
  over the migrated surface (dashboard, operations, factories, shell) checked
  371 edges for path and named-export correctness and found **zero** broken
  imports. Note: this is not a full-repo `tsc` (the SWC blocker below prevents
  that); it covers the migrated surface and the legacy files in its route
  folders. See the 2026-08-08 comments/`let` sweep record.

- **The app will not run on this workstation.** Windows Application Control
  blocks Next.js's native compiler:

  ```
  ⚠ Attempted to load @next/swc-win32-x64-msvc, but an error occurred:
    An Application Control policy has blocked this file.
    apps\web\node_modules\@next\swc-win32-x64-msvc\next-swc.win32-x64-msvc.node
  ```

  `next dev` starts, then serves nothing. `next build` hangs. Consequences: no
  browser verification, no e2e, no axe, no Lighthouse, no bundle numbers. Every
  task is limited to static verification, and WEB-006 §3's "exercised by hand in
  the running dev server" and WEB-003 §10's manual checklist cannot be satisfied
  by anyone working on this machine. Not a code problem — it needs the binary
  allowlisted, or a WASM-compiler fallback accepted for local work. **This blocks
  the Definition of Done for every task from T-000 onward.**

---

## The 48-hour demonstration path

If the objective is to show the manager what this becomes, the shortest
credible story is **T-000 → T-001 → T-002 → T-003 → T-010 → T-012**:

> a rulebook enforced by CI · a design system you can browse · a shell that
> ships a fraction of the JavaScript · and one flagship screen rebuilt on it,
> with before-and-after numbers and an accessibility report.

That is a system with evidence, not a repainted page.
