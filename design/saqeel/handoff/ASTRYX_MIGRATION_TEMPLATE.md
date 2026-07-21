# ASTRYX → SAQEEL migration map (populated from the real repository)

Source of truth inventoried 20 Jul 2026 from `Vikram-Indla/Inspection@setup/Inspection`:
- **Tokens:** `apps/web/src/app/tokens.css` — "SAQEEL (صقيل) Government Foundation V1", `--ax-*` custom properties, themes via `:root[data-theme]`, RTL via logical properties + `:lang(ar)`.
- **Component layer:** `apps/web/src/app/astryx.css` (`.ax-*` classes, imported by `layout.tsx`); design authority copies in `design/astryx/`.
- **React components:** `apps/web/src/components/*` + route-level components under `apps/web/src/app/*`.
- Legacy packs (`saqeel-astryx.css`, `outputs/cd-*`, `MIM_Inspection_Meta_Astryx_Fable_Pack`) are historical — do not migrate them; they die with Astryx.

## ✅ Reconciliation decisions (owner-resolved 20 Jul 2026)

**The SAQEEL design system (this project) is the sole authority. No trace of Astryx may survive** — tokens, classes, fonts, specs, e2e contract assertions, historical packs.

1. **Brand:** **SAQEEL (صقيل)** — confirmed. This design system is rebranded accordingly.
2. **Type scale:** the new SAQEEL scale wins (14px body / 13px table, roles in TYPOGRAPHY_SPEC.md). Astryx's 16px minimum is superseded; record the supersession in the product's decision register.
3. **Control heights:** SAQEEL metrics win (28/32/40px; `--touch-target` 44px). Field/iPad surfaces use `[data-density="field"]` (controls 40/44/52px — Astryx's 44/48/52 field metrics preserved where touch demands them) so touch targets stay ≥44px.
4. **Input contract:** superseded — IBM Plex Sans inputs, 3px radius per SAQEEL spec. Space Grotesk is removed.
5. **Fonts:** IBM Plex Mono replaces JetBrains Mono; IBM Plex Sans (EN) / IBM Plex Sans Arabic (AR) split replaces Arabic-for-everything. Dark primary becomes SAQEEL emerald.

Execution consequences: the four Playwright design-contract specs are rewritten against SAQEEL tokens in the same PR as the token swap; `design/astryx/`, `outputs/cd-*` styling packs, `MIM_Inspection_Meta_Astryx_Fable_Pack` and all `--ax-*`/`.ax-*` code are deleted at step 12; a final repo-wide grep for `ax-|astryx|Space Grotesk|JetBrains|Barlow` must return zero product-code hits.

## Token mapping (`--ax-*` → SAQEEL)

| Astryx token | SAQEEL token | Notes |
|---|---|---|
| --ax-color-primary #176B52 / #78AEDA(dark) | --action-primary #115c44 / #2e9e77 | Light values are near-identical emeralds; **dark primary changes from steel-blue to emerald** — visible change, flag to sponsor |
| --ax-color-primary-hover | --action-primary-hover | dark hover flips to lighter, matching SAQEEL rule |
| --ax-color-canvas / surface / surface-sunken / surface-raised | --surface-canvas / -primary / -sunken / -raised | SAQEEL adds --surface-secondary; Astryx derived tints via color-mix die |
| --ax-color-text / text-secondary / text-disabled | --text-primary / -secondary / -disabled | SAQEEL adds --text-muted |
| --ax-color-border / border-strong | --border-subtle / -strong | SAQEEL adds --border-input |
| --ax-color-success / warning / critical / info (+tint/strong) | --status-compliant / -warning / -critical / -info (base/soft/text) | Astryx has 4 semantic colours; SAQEEL has 10 — see status mapping below |
| --ax-color-overlay | --surface-overlay | |
| --ax-focus-ring (2-layer ring) | --focus-ring outline | mechanism changes from box-shadow to outline |
| --ax-font-sans / -arabic / -mono / -input | --font-body (+RTL flip) / --font-mono | Space Grotesk input font dropped (pending flag 4) |
| --ax-text-* (display 32 … micro 12) | --type-* roles | sizes conflict — see flag 2 |
| --ax-numeric-features | font-variant-numeric: tabular-nums (`.t-mono`, `.cell-num`) | |
| --ax-space-050…600 | --space-1…12 | same 4px base; rename only |
| --ax-radius-small/standard/large/full/input | --radius-xs/sm/md/lg/full | Astryx 4/6/8 → SAQEEL 2/3/4/6; radius-input 12px pending flag 4 |
| --ax-shadow-raised(none)/overlay | --shadow-xs…lg | |
| --ax-motion-fast/standard | --motion-fast/base/slow + --ease-standard | |
| --ax-shell-nav-width 248px / panel 360px | --sidebar-w 248px / drawer width prop | identical nav width |
| --ax-z-* | --z-* | SAQEEL adds popover layer |
| --ax-color-atlas-* / prism-magenta | **keep as-is** | Cinematic Atlas (login) is an approved standalone exception — out of migration scope |

## Component mapping (one row per real export/class family)

| Astryx (path / class) | Usage | SAQEEL component | Behaviour unchanged | Visual change | Risk | Verify |
|---|---|---|---|---|---|---|
| `.ax-btn` +--secondary/--subtle/--danger/--prominent/--field/--icon; `.ax-splitbtn` | app-wide | actions/Button, SplitButton (--subtle→ghost, --prominent→lg, --field→lg+touch) | onClick, disabled, form submit | radius 6→3, heights per flag 3 | --field height on iPad | click-through all CTAs; iPad targets ≥48px |
| `.ax-field/.ax-input/.ax-select/.ax-textarea/.ax-search` | app-wide | inputs/Field+Input+Select+TextArea | validation triggers, masks | input radius 12→3 (flag 4), Space Grotesk dropped | frozen contract | submit invalid forms EN+AR |
| `.ax-choice/.ax-check` (native accent-color) | forms | Checkbox/RadioGroup (custom-drawn) | checked semantics | drawn controls replace accent-color | indeterminate | bulk-select flows |
| `.ax-switch` | settings, layers | Switch | instant-effect semantics | 40×22→32×18 | touch size on iPad | layer toggles |
| `.ax-segmented` | view switches | SegmentedControl | aria-pressed model (same) | token swap only | low | — |
| `.ax-tabs` role=tab | detail pages | Tabs | tab routing | token swap | low | deep links |
| `components/Pagination.tsx`, `.ax-pagination` | tables | Pagination | page param behaviour | style only | low | RTL chevrons |
| `components/Accordion.tsx`, `.ax-accordion` | checklists | Accordion (native details) | open state | style only | low | — |
| `.ax-lozenge` --success/--warning/--critical/--info; `.ax-badge` | status everywhere | data/StatusBadge + signature/ExceptionMark | **status VALUES in data unchanged** | 4-tone → 10-role vocabulary | meaning mapping | every status value in register + visits |
| `.ax-version` | reviews | data/Tag or id-code treatment | version semantics | mono styling | low | VersionCompare |
| `components/Toast.tsx`, `CreatedToast`, `.ax-toast(-region)` | mutations | feedback/Toast | trigger conditions, auto-dismiss | accent edge style | stacking | success/error paths |
| `.ax-banner` --warning/--critical/--success/**--immutable** | records | feedback/Alert; immutable → Alert variant **to add** | immutability display rule | left-edge kept for severity only | immutable banner is contractual | read-only records |
| `.ax-modal(-backdrop)`, `.ax-drawer` | confirmations, context | feedback/Modal, Drawer | focus trap, Esc, backdrop | radius/shadow tokens | nested layers | destructive confirms; RTL drawers |
| `.ax-menu/.ax-popover`, `.ax-tooltip` | overflow actions | feedback/Menu, Tooltip | menu items, Esc | token swap | low | keyboard nav |
| `components/Skeleton.tsx`, `Spinner`, `.ax-skeleton` | loading | feedback/Skeleton, Button loading | Suspense boundaries | pulse style | low | route loading.tsx files |
| `components/EmptyState.tsx`, `AccessState`, `NotYetBoundary`, `.ax-state(--inline)` (12 mandatory states) | all screens | feedback/EmptyState (empty/no-results/error/permission/offline via copy) | the **12-state contract** (loading/empty/populated/validation/unauthorized/read-only/stale/degraded/offline/syncing/conflict/success) | style only | e2e contract tests assert states | run design-foundation-contract.spec + ui-compliance specs |
| `.ax-sync` --synced/--offline/--pending/--syncing/--conflict/--failed; `.ax-freshness` | offline-first PWA chrome | **GAP — new SAQEEL SyncIndicator required** (ExceptionMark grammar + spinner) | offline/sync logic untouched | new component, SAQEEL styling | offline is core; no SAQEEL equivalent yet | field flows offline→sync→conflict |
| `.ax-conflict`, `.ax-diff-del/-ins`, `VersionCompare.tsx` | review conflicts | **GAP — ConflictResolver/DiffView to add** (panel + status-soft diff tints) | conflict resolution logic | tint tokens | contractual states | reviews/[id] compare |
| `components/Shell.tsx` + `ShellClient` + `.ax-shell/.ax-nav-*/.ax-topbar-*/.ax-shell-search/.ax-shell-scope/.ax-pagehead/.ax-content` | every page | navigation/Sidebar+TopBar+PageHeader (+ scope controls into TopBar slots) | **role-scoped nav builder, RLS-scoped region/date scope, i18n strings, skip-link** | graphite nav (Astryx nav is light-surface) — biggest visible change | nav is server-built; keep buildShellNavigation untouched | all roles' nav trees EN+AR |
| `components/NotificationBell.tsx`, `.ax-notification` | topbar | TopBar slot + Menu | event types, mark-read | style only | low | live notifications |
| `ThemeToggle/ThemeScript` | topbar | keep mechanism (`data-theme`) — tokens swap under it | flash-free boot script | none | none | theme persistence |
| `.ax-breadcrumb` | detail pages | Breadcrumb | links | ›→/ separator | low | RTL |
| `.ax-commandbar/.ax-filterchip` | registers | navigation/FilterBar | filter query behaviour | dashed→set chip grammar | saved views parity | filtered URLs |
| `.ax-kpi(-row)`, `components/charts/{Bar,Donut,Line}Chart` | dashboard | data/KPICard+MetricStrip; charts re-tokened to --chart-* | chart data props | palette + grid tokens | Donut colour count >6 | dashboard EN/AR/dark |
| `.ax-tablewrap/.ax-table/.ax-td-num/.ax-bulkbar` + per-page table code | registers | grid/DataGrid | sort/filter/pagination API calls, RLS-scoped rows | compact rows, pinned ID col, rail | custom cell renderers per page | visits, factories, reviews, admin/items CRUD + export |
| `.ax-stepper` (is-done/is-active/is-blocked) | wizards | navigation/Steps + signature/StatusSpine for lifecycle | step logic | spine replaces arrow-stepper on lifecycle surfaces | scope creep | planning/single Wizard |
| `.ax-timeline` (is-key) | audit | data/Timeline / inspection/AuditTrail | entries | dot tones | low | audit pages |
| `.ax-authoritybar`, `AuthorityBar.tsx`, `DualStateRibbon.tsx` | planning, visits | inspection/ReviewPanel + StatusBadge pair; DualStateRibbon → StatusSpine compact horizontal | authority rules | spine treatment | ribbon is dual-state (official/observed) — keep both values visible | planning/immediate |
| `.ax-validation(--clear)` | forms | Alert critical/success + Field errors | validation logic | style | low | form submits |
| `.ax-permission` | gated areas | EmptyState permission variant | RBAC checks | style | low | unauthorized routes |
| `.ax-map/.ax-pin(--official/--observed)/.ax-geofence`, `GeoMap.tsx`, `OpsMap`, `LiveMapInner`, `VisitMap`, `FactorySpatialMap`, `GisStudio` | ops/visits/factories/gis | map/* + signature/GeoWorkspace (chrome only) | **map engine, zone-hover lift, geofence logic, live data untouched** | markers→status-toned keyline style; official/observed → distinct kinds not colour-only | marker semantics (official vs observed ≠ severity) | operations/live with realtime; visits/map |
| `.ax-visitcard` | field/visits | inspection/InspectionCard | card click targets | token swap | low | field home |
| `.ax-evidence(-grid)`, `ImageAnnotator`, `SignaturePad`, `Attachments` | field, reviews | signature/EvidenceStack + EvidenceCard (annotator/pad logic kept, re-chromed) | capture, annotation, signature logic | provenance metadata surfaced | EvidenceStack expects provenance fields — verify data availability | evidence-ocr, field inspection |
| `.ax-rule`, `CriteriaBuilder.tsx` | planning/bulk | navigation/FilterRule builder | criteria semantics | token swap | operator parity | bulk targeting |
| `.ax-flow`, `WfDeck.tsx` | admin/workflows | **GAP — workflow canvas keeps own layout**, re-tokened only | flow logic | tokens only | do not rebuild canvas | admin/workflows |
| `.ax-field-page/-taskbar/-performance`, `FieldHome`, `GatedRepeaterSection`, `Repeater` | iPad field | form system (Steps, ChecklistQuestion, Accordion) at field density (52px controls) | gating, repeater, offline save | SAQEEL form chrome | touch + offline | field/[visitId] full flow |
| `.ax-stack/.ax-row/.ax-grid-2/.ax-sr-only` | layout utils | .stack/.row/grid utilities | none | rename | low | — |
| `.ax-trace`, `FindingTraceChain` | reviews | inspection/FindingCard chain + Timeline | trace links | style | low | reviews/[id] |
| `login/*` (SaqeelHero, Cinematic Atlas, login.css) | login | **OUT OF SCOPE** — approved standalone visual exception (atlas tokens fixed) | everything | none | none | login unaffected |
| `PrintReport`, `reports/report.css` | inspection report | print styles on SAQEEL tokens (--ax-color-print-* → fixed print values kept) | report content | fonts/tokens | print fidelity | print inspection report |

## Status-value mapping (data values unchanged; presentation vocabulary)

| Astryx presentation | SAQEEL role |
|---|---|
| lozenge--success / validation--clear | compliant |
| lozenge--warning | warning (due-soon) or major (violation severity) — **split by context, confirm per surface** |
| lozenge--critical / badge--critical / is-row-failed | critical |
| lozenge--info | info |
| stepper is-blocked | spine state `blocked` |
| sync--synced/--pending/--syncing/--offline/--conflict/--failed | new SyncIndicator: compliant / pending / info+spin / disabled / critical / critical |
| pin--official vs --observed | MapMarker kinds (shape/glyph distinction, not colour-only) |
| banner--immutable | new Alert `immutable` variant (neutral + lock icon) |
| draft/onhold/completed lifecycle values in `state_transitions.csv` | draft / onhold / completed — reconcile against that CSV before coding |

## Identified gaps → SAQEEL additions required before step 9
1. ~~SyncIndicator~~ — **DONE**: components/feedback/SyncIndicator.jsx (synced/pending/syncing/offline/conflict/failed)
2. ~~ImmutableBanner~~ — **DONE**: Alert tone="immutable" (dashed sunken + lock)
3. ~~ConflictResolver / DiffView~~ — **DONE**: components/feedback/DiffView.jsx (del/ins tints; onKeep = conflict resolution)
4. ~~Field-density form profile~~ — **DONE**: `[data-density="field"]` in tokens/layout.css (controls 40/44/52, rows 52, body 15px); maps Astryx --ax-control-height-field 52px 1:1

## Verification gates (per e2e contracts already in repo)
The repo enforces design via Playwright: `design-foundation-contract.spec.ts`, `platform-design-system-contract.spec.ts`, `ui-compliance-contract.spec.ts`, `inspector-shell-uplift.spec.ts` all read `astryx.css` directly — **these specs must be rewritten against SAQEEL tokens in the same PR as step 1**, or CI blocks everything.

## Removal gate
`astryx.css`, `tokens.css` (ax), `design/astryx/`, Space Grotesk + JetBrains Mono loads removed only when every row above verifies in EN+AR × light+dark × desktop+iPad, and the four contract specs pass against the SAQEEL sheet.
