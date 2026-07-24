# M3 Operations implementation readiness and test matrix

## Decision

**Current implementation readiness: NO-GO — design and contract gates remain open.**

This is a readiness plan, not implementation approval. The review baseline is commit
`3c5af511e45a5b359bf32e713bc7327ac55bac6c`, based on canonical
`origin/main` `9d8c414258a5e04244fdf9ce350e5f25f952dfc1`.
The only M3 changes at this baseline are the independent review artifacts; application
code is unchanged.

M3 can move to a later, route-local guarded-preview lease only when the objective
entry criteria below pass. It cannot be cut over until all `WA-M3-AC-001..006`
criteria pass and sponsor consent is recorded.

## Authority and reviewed evidence

- [M3 requirement baseline](../product-contract/web-admin-phase1/REQUIREMENT_BASELINE.csv):
  `CR-430..CR-448`, all currently `BASELINED_NOT_IMPLEMENTED`.
- [M3 design route map](../product-contract/web-admin-phase1/DESIGN_ROUTE_MAP.csv):
  `WA-DES-033` → `/operations`; `WA-DES-034` → `/operations/live`; both
  `REQUIRES_PRODUCT_OWNER_APPROVAL`.
- [M3 acceptance criteria](../product-contract/web-admin-phase1/ACCEPTANCE_CRITERIA.csv):
  `WA-M3-AC-001..006`, all `PLANNED_NOT_IMPLEMENTED`.
- [Operations shell authority](../product-contract/web-admin-phase1/WEB_ADMIN_SHELL_AUTHORITY.md):
  Operations Map then National Performance are the two primary views.
- [Operations preservation matrix](../product-contract/web-admin-phase1/WEB_ADMIN_SHELL_PRESERVATION_MATRIX.csv):
  `WA-SP-029..034`.
- [M3 route inventory](../product-contract/web-admin-phase1/ROUTE_INVENTORY.csv) and
  [migration rows](../product-contract/web-admin-phase1/CURRENT_TO_TARGET_MIGRATION.csv):
  `WA-MIG-047..049`.
- [Operations design acceptance](../design/claude-design-mvp1/acceptance/DESIGN_ACCEPTANCE_MATRIX.csv):
  `DSG-027` and `DSG-CMD-009..013`, all `not_started`.
- [Special-component acceptance](../design/claude-design-mvp1/acceptance/SPECIAL_COMPONENT_ACCEPTANCE.csv):
  relevant `SPC-GIS`, `SPC-LIVE`, `SPC-RT`, and `SPC-CMD` rows are all
  `not_started`.
- [Authenticated live-map prompt](../design/claude-design-mvp1/prompts/systems/AUTHENTICATED_LIVE_OPERATIONS_MAP.md)
  and [P12 journey prompt](../design/claude-design-mvp1/prompts/journeys/P12_FACTORY360_AND_OPERATIONS.md).
- [Independent mapping review](design-mapping-review.csv) and
  [pilot delta review](pilot-delta-review.md).

## Scoped routes, components, services, and current disposition

| Scope | Current implementation | Services and records | Readiness disposition |
|---|---|---|---|
| `/operations` | `apps/web/src/app/(app)/operations/page.tsx`; `Monitoring.tsx`; `OpsMap.tsx`; `OverrideQueue.tsx`; `CancellationQueue.tsx`; `OpsExport.tsx`; `Controls.tsx`; `actions.ts`; `sla.ts`; `region-posture.ts` | Supabase SSR/RLS; `visits`, `factories`, `geo_events`, `engine_settings`, `notifications`, `action_forms`, `inspections`, `evidence`, `geo_override_requests`, optional `cancellation_requests`; `decide_geo_override`, `expire_stale_geo_override_requests`, active-cancellation action | Correct business route but not design-ready. Missing the required two-view IA and multiple CR-430..448 contracts. A GET currently invokes `expire_stale_geo_override_requests`; observational capture is unsafe until route mutation is removed or separately governed. |
| `/operations/live` | `live/page.tsx`; `LiveOps.tsx`; `LiveMapInner.tsx`; `types.ts` | RLS-scoped factories and visits; Mapbox GL; KSA regions; map palette | Nearest match for WA-DES-034. Current mode is an explicitly projected—not live GPS—prototype. It lacks accepted freshness/stale/reconnect, RLS-empty, no-position, synchronized-list, and fault-isolation evidence. |
| `/operations/exceptions` | `exceptions/page.tsx`; `lib/operations/exceptions.ts` | Feature flag; `cases`; `risk_exceptions`; no-synthetic grouping | Valid secondary child route, but there is no exact design page. Keep unchanged unless a separate design and lease are accepted. |
| `/api/routing/eta` | `apps/web/src/app/api/routing/eta/route.ts` | Authenticated Mapbox Directions boundary | Shared Field-facing API, not an M3 screen dependency. Test as protected regression only; do not modify under M3. |
| Shared map/shell | `components/GeoMap.tsx`; `components/Shell*`; global SAQEEL CSS/navigation/i18n | Shared across M1, M3, Factory 360, Admin and Field | Explicitly outside the proposed M3 lease. Request a separately recorded owner if a proven blocker requires a shared change. |

## Design and special-component blockers

### Design acceptance blockers

| ID | Required outcome | Current state | Objective unblock evidence |
|---|---|---|---|
| `DSG-027` | Trustworthy KPIs, map/list, alerts, SLA, workload and drilldown | `not_started` | Accepted dashboard, live-map and wallboard frames including stale and provider failure |
| `DSG-CMD-009` | Live map and Inspector Card with projection truth and handoffs | `not_started` | Projected map, card, visit and Factory 360 drill frames |
| `DSG-CMD-010` | Conditional Inspector Card facts | `not_started` | Before/after arrival and missing-field frames |
| `DSG-CMD-011` | Regional Performance Map and drill hierarchy | `not_started` | National, regional and factory drill frames plus synchronized list |
| `DSG-CMD-012` | Ranked/greyscale default while colour thresholds are ungoverned | `not_started`; `SL-2` blocks colour bands | Accepted ranked default with no invented threshold |
| `DSG-CMD-013` | Deterministic priority highlights with deep links | `not_started`; natural-language layer deferred | Priority-ordered deterministic panel, evidence links and explicit non-AI labelling |

`EV-DESIGN-007` remains `pending` with no artifact path. The evidence inventory
states that `SCR-WEB-500` has no capture.

### Special-component blockers

The following rows are all `not_started` and block implementation or cutover at
their declared severity:

- `SPC-LIVE-001`, `SPC-LIVE-002`, `SPC-LIVE-003`, `SPC-LIVE-004`,
  `SPC-LIVE-005`, `SPC-LIVE-006`, and `SPC-LIVE-007`: projection label,
  aggregation/freshness, synchronized selection, stale/reconnect, fault
  isolation, reduced motion, and future genuine telemetry requirements.
- `SPC-GIS-001`, `SPC-GIS-004`, `SPC-GIS-007`, `SPC-GIS-008`: synchronized
  accessible list, provider failure, non-colour/reduced-motion semantics, and
  aggregate-zone boundary truth.
- `SPC-RT-001`, `SPC-RT-002`, `SPC-RT-003`, `SPC-RT-004`, `SPC-RT-005`,
  `SPC-RT-007`, and `SPC-RT-008`: freshness, provider delivery truth, SLA
  meaning, alert lifecycle/deep links, fault isolation and accessible urgency.
- `SPC-CMD-001`, `SPC-CMD-003`, `SPC-CMD-004`, `SPC-CMD-005`,
  `SPC-CMD-006`, `SPC-CMD-007`, `SPC-CMD-008`, `SPC-CMD-009`,
  `SPC-CMD-010`, and `SPC-CMD-016`: persona navigation, accessible regional
  map, disabled ungoverned colour bands, projected-position truth, conditional
  inspector facts, deterministic highlights, metric provenance/unavailable
  states, deferred-AI truth, RBAC-gated widgets and partial-source isolation.

### Contract conflicts that require an explicit design decision

1. The authenticated live-map prompt requests a projected route trail, while
   `SPC-CMD-005` says no route/navigation is drawn in Phase 1. A single accepted
   Phase 1 rule must win before implementation.
2. Current `/operations/live` synthesizes projected origin, motion and ETA. The
   accepted current-mode prompt permits projected movement only with a persistent
   `Projected route — not live GPS` label; it does not authorize invented
   navigation/ETA truth.
3. Current regional posture code derives risk bands and region states from local
   numeric cutoffs. `DSG-CMD-012`/`SPC-CMD-004` require greyscale/ranked output
   while threshold policy is ungoverned.
4. `/operations` executes an expiry RPC during GET. The Phase 2 evidence intake
   marks `SCR-WEB-500` route capture unsafe for that reason. A read-only design
   preview and sponsor walkthrough cannot depend on a mutating GET.
5. `/operations/exceptions` has no exact design page. It must remain a preserved
   secondary route unless design authority explicitly adds it.

## CR-430..448 implementation and verification matrix

| Requirement | Later implementation boundary | Required objective proof |
|---|---|---|
| `CR-430` Command Center | Operations Map and National Performance, preserving governed queues/handoffs | Authorized Operations/Supervisor/Leadership positive paths; read-only behavior without supervisor action capability; truthful unavailable AI summary |
| `CR-431` Live Operations Map | Real factory/visit coordinates; projected inspector mode only under accepted projection contract; configurable refresh when configured | Map/list synchronization; factory/visit/inspector pin truth; pan/zoom/filter/drill; freshness; no fabricated GPS/ETA; provider and no-position states |
| `CR-432` Visit Monitoring | Full operational vocabulary: New, Prepared, On the Way, Arrived, Executing, Submitted, Cancelled, Expired; workflow kept separate | Record-truth comparison for every state; stuck state only from a governed rule; visit drilldown |
| `CR-433` Inspector Monitoring | Availability, active visit, allowed location, online/offline and workload only when sourced | Active-journey privacy boundary; no-position and stale cases; missing-source state instead of a projection claimed as GPS |
| `CR-434` SLA Monitoring | Server-time/configured SLA projection over required lifecycle/review stages | Configured calendar/start/stop/pause/reminder/breach/escalation evidence; missing-config state; clock-boundary cases |
| `CR-435` Risk Monitoring | Read-only governed risk fields and ranked regional/factory list | No local thresholds; greyscale/ranked default; filter and Factory 360 drill; absent-risk state |
| `CR-436` Alert Management | Configured operational alert sources and allowed acknowledge lifecycle | New/acknowledged/handled/resolved/failed; exact deep link; provider delivery not overstated; one-source failure isolation |
| `CR-437` Visit drilldown | Read-only visit handoff unless user has explicit action capability | Correct ID/context; unauthorized action absent/denied; no state mutation from drill |
| `CR-438` Factory 360 drilldown | Factory handoff using Factory 360 access rules | RLS-scoped exact factory; masked/denied persona cases |
| `CR-439` Branch/Region Filtering | One canonical authorized geography scope applied to every map, KPI, list, alert, queue and export | Same scoped record IDs/counts in all widgets; unauthorized region cannot be requested by URL; city reset on region change |
| `CR-440` Workload Monitoring | Assigned, active, completed and overdue by inspector/branch using current and planned visits | Denominator/source shown; empty assignment and missing inspector cases; no balancing recommendation without approved engine |
| `CR-441` Cancellation Monitoring | Cancelled visit analytics by configured reason, inspector, factory, region and date; pending decision queue remains separately governed | Mandatory reason; categorized historical records; self-decision/terminal/idempotent negatives protected |
| `CR-442` GPS Override Monitoring | Complete auditable planned-versus-observed override history plus pending decisions | Accuracy, timestamps, reason/evidence, requester/approver separation, expired/already-decided/RLS negatives |
| `CR-443` Live Tracking History | Immutable route history only from real geo events | Ordered path, timestamps, arrival and observed coordinates; append-only proof; RLS-empty and no-position states |
| `CR-444` Operational Timeline | One canonical planning-to-review/compliance event projection | All major source events once, stable ordering, exact object handoffs, no synthetic summary row |
| `CR-445` Operations KPIs | Planned, completed, cancelled, overdue, active inspectors, average duration and SLA breach rate for a configured period | Formula/source/denominator/period displayed; zero denominator; missing period/config; exact record reconciliation |
| `CR-446` Export | Permission-controlled and audited server boundary or explicit unavailable state | Authorized export, unauthorized denial, current-filter equivalence, audit row, Arabic/CSV safety, provider/failure recovery |
| `CR-447` Access Control | M3-specific fail-closed route/capability guard plus RLS | Anonymous, inspector, admin-only and out-of-region denials; Operations/Leadership positives; role-resolution error fails closed |
| `CR-448` Error Handling | Widget-local error/freshness/retry with stable unaffected regions | Each source failed independently; core page remains usable; error never appears as genuine empty/zero; retry and recovery evidence |

## WA-M3 acceptance matrix

| Acceptance ID | Entry and exit evidence | Status now |
|---|---|---|
| `WA-M3-AC-001` Functional | CR-430..448 record-backed positives; required interactions, synchronization and handoffs; unsupported contracts visibly unavailable | `PLANNED_NOT_IMPLEMENTED` |
| `WA-M3-AC-002` Negative/security | Direct-route role/RLS negatives; invalid geography; stale/conflict; provider missing/failure; unauthorized actions/export; no synthetic truth | `PLANNED_NOT_IMPLEMENTED` |
| `WA-M3-AC-003` Visual | Accepted WA-DES-033/034 comparison at 1440×900 and 1200×800 with zero unapproved difference | `PLANNED_NOT_IMPLEMENTED` |
| `WA-M3-AC-004` RTL/responsive/a11y | EN/LTR and AR/RTL; light/dark; desktop, wallboard, 1024×768, 412/390 and 320; keyboard, screen-reader names and axe | `PLANNED_NOT_IMPLEMENTED` |
| `WA-M3-AC-005` Regression | Workflow, audit, immutable history, maker-checker, M1 Dashboard, Planning, Factory 360, reviews, Field-shared ETA and Mapbox contracts | `PLANNED_NOT_IMPLEMENTED` |
| `WA-M3-AC-006` Evidence | Requirement/design/route/test IDs; accepted design revision; screenshots/recordings; external evidence manifest; truthful blockers | `PLANNED_NOT_IMPLEMENTED` |

## Test matrix

### Positive and record-truth tests

| Test family | Required cases |
|---|---|
| Authorized routes | Operations/Supervisor and Leadership reach `/operations`; only accepted personas reach `/operations/live`; each sees only RLS-authorized data |
| Primary views | Operations Map is first; National Performance second; switching preserves canonical filter state without duplicate requests or mutation |
| KPI truth | Required KPI set reconciles to exact RLS-scoped source IDs for the configured period; zero denominator and missing configuration are explicit |
| Map/list synchronization | Select from map and list; counters, filter, detail card and handoff agree; attribution and legend remain present |
| Handoffs | Visit, Factory 360, override, cancellation, alert and timeline links open the exact governed object |
| Alerts/SLA/workload | Configured alert lifecycle, SLA context and workload denominators are visible and source-backed |
| Projection mode | Persistent `Projected route — not live GPS`; no invented accuracy, last-known timestamp, connection, navigation route or ETA |

### Negative, security, and isolation tests

| Test family | Required cases |
|---|---|
| Authentication/capability | Anonymous redirect/401; inspector, admin-only and unauthorized direct routes denied; role lookup failure fails closed |
| RLS geography | Authorized zero-row scope produces an RLS-empty state; URL-forged region/branch/city cannot expose another scope; every widget/export remains identically scoped |
| RLS empty vs error | Zero rows, permission-denied, source error and provider failure render four distinct states |
| Mutating actions | Read-only preview GET causes no RPC/write; maker-checker, self-decision, expired, already-decided, terminal and idempotent negatives remain protected |
| Stale/conflict | Stale timestamp, reconnecting, out-of-order event and server conflict never appear fresh; retry preserves the prior trusted view |
| Provider | Token absent, tile authorization/style failure, network failure and recovery preserve lists/KPIs and expose provider-unavailable status |
| Partial source | Fail visits, factories, alerts, SLA, workload, risk and timeline independently; only the owning widget degrades |
| No position | Factory missing coordinates; active visit without allowed inspector position; no inspectors; all positions stale; map remains usable with synchronized textual alternative |
| No invented policy | Missing risk band, SLA setting, KPI period, telemetry contract, export audit or AI provider yields unavailable—not a number, colour band or recommendation |

### Responsive, RTL, accessibility, and motion tests

| Dimension | Required cases |
|---|---|
| Viewports | WA-DES-033 at 1440×900; WA-DES-034 at 1200×800; 1920×1080 wallboard; 1024×768; 412×915; 390×844; 320×800 |
| Language/direction | EN/LTR and AR/RTL with Arabic labels, logical alignment, correct number/date direction, map controls and drawers |
| Theme | Light and dark including tile/basemap state, focus visibility and contrast |
| Keyboard | Skip/focus order, primary-view tabs, filters, map-equivalent list, pin/row selection, detail drawer close/restore, retry and handoff |
| Screen reader | Named regions, status/refresh announcements, table headers, legend, non-colour severity, exact unavailable/error semantics |
| Automated | Zero serious/critical axe findings; no horizontal page overflow at any required viewport |
| Reduced motion | With `prefers-reduced-motion: reduce`, projected animation freezes while inspector state, position basis and projection label remain visible |
| No position/provider | Textual list and operational data remain accessible when WebGL, tiles or every position is unavailable |

## Proposed later implementation lease

Activate only after the GO criteria below pass.

### Owned files

- `apps/web/src/app/(app)/operations/page.tsx`
- New route-local `apps/web/src/app/(app)/operations/OperationsCenterPreview.tsx`
- New route-local `apps/web/src/app/(app)/operations/operations.module.css`
- `apps/web/src/app/(app)/operations/Monitoring.tsx`
- `apps/web/src/app/(app)/operations/OpsMap.tsx`
- `apps/web/src/app/(app)/operations/live/page.tsx`
- `apps/web/src/app/(app)/operations/live/LiveOps.tsx`
- `apps/web/src/app/(app)/operations/live/LiveMapInner.tsx`
- `apps/web/src/app/(app)/operations/live/types.ts`
- `apps/web/src/app/(app)/operations/region-posture.ts`
- New `apps/web/e2e/web-admin-m3-operations.spec.ts`
- New M3 evidence manifest and non-frozen M3 session records named by the activated slice

### Preserve without editing in the first lease

- `actions.ts`, `Controls.tsx`, `OverrideQueue.tsx`, `CancellationQueue.tsx`,
  `OpsExport.tsx`, `sla.ts`, and existing regression tests.
- `/operations/exceptions` and `lib/operations/exceptions.ts`.
- Current `/operations` default behavior; expose the new composition only through
  a server-evaluated guarded preview until acceptance.

If route-safety, audited export, direct-route authorization, or action changes
are required, create a separate explicit lease with exact files, backend
contracts and negative tests. Do not silently expand this lease.

## Do not touch

- `main`, `setup/Inspection`, existing stashes, existing commits or another worktree.
- `product-contract` frozen authority or accepted design authority.
- Shared `Shell`, navigation, global CSS/tokens, global i18n or `GeoMap`.
- `/api/routing/eta`, providers, environment configuration or Mapbox credentials.
- Supabase migrations, RLS/RBAC policies, RPCs, remote schema or shared data.
- `/field/**`, PWA, service worker, offline engine or iPad application.
- M1 Dashboard, Planning, Factory 360, Reviews or Admin application files.
- `/operations/exceptions` until it has an exact accepted design and its own lease.

## Objective GO / NO-GO criteria

### GO to a guarded implementation preview only when all are true

1. `DSG-027` and `DSG-CMD-009..013` have accepted revisions and evidence.
2. Every applicable P0 `SPC-LIVE`, `SPC-GIS`, `SPC-RT` and `SPC-CMD` row has an
   accepted disposition; P1 rows have either accepted evidence or a named,
   sponsor-approved non-release blocker.
3. The projected-trail/no-route conflict has one accepted Phase 1 rule.
4. `SL-2` remains enforced: no colour band appears without governed thresholds.
5. A read-only `/operations` preview causes zero writes; the mutating GET/RPC
   route-safety issue is resolved or the route remains uncaptured and blocked.
6. Live telemetry, freshness/privacy, alert, timeline, KPI-period, audited-export
   and capability contracts are supplied, or every unsupported feature has an
   accepted unavailable state.
7. Exact implementation ownership, branch/worktree, rollback and shared-file
   exclusion are recorded in an activated M3 slice.
8. Approved read-only Operations/Supervisor/Leadership test personas and
   deterministic RLS-scoped fixtures exist without requiring shared mutation.
9. The focused test/evidence matrix and sponsor comparison viewport are accepted.

### NO-GO if any is true

- Any required P0 DSG/SPC row remains `not_started`, rejected, or unevidenced.
- The implementation would invent GPS, ETA, freshness, risk thresholds, SLA,
  KPI periods, alert priority, AI text or export audit.
- A GET, screenshot or read-only browser review can mutate workflow or expiry state.
- An error or RLS denial is rendered as a genuine empty/zero state.
- Shared shell, `GeoMap`, API, migration, Supabase, Field/PWA/iPad or another
  module must change without a separate recorded owner.
- `/operations/exceptions` is represented as design-matched without a dedicated
  accepted design.
- The guarded preview cannot be disabled without deleting or weakening the
  retained implementation.

### GO to canonical cutover only when all are true

1. `WA-M3-AC-001..006` are no longer `PLANNED_NOT_IMPLEMENTED` and have complete,
   reviewable evidence.
2. `CR-430..448` each have passing positive, negative and record-truth evidence,
   or an explicit sponsor-accepted external block rendered honestly.
3. Typecheck, production build, focused M3 suite, protected workflow/security
   regression, adjacent M1/M2/M4 routes, and the 478-requirement validator pass.
4. EN/AR, LTR/RTL, light/dark, responsive, wallboard, keyboard, axe,
   reduced-motion, RLS-empty, stale, provider-failure and no-position evidence
   passes.
5. A real-browser comparison is accepted and the sponsor explicitly authorizes
   cutover; rollback remains retained through stabilization.

## Final readiness finding

The routes, source records and substantial legacy functionality exist, so M3 is
technically discoverable. It is **not implementation-ready** because the design
acceptance, special-component acceptance, route-safety and multiple operational
truth contracts remain open. The safe next milestone is design/contract closure,
followed by the bounded guarded-preview lease above.
