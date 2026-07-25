# M3 Operations Center pilot delta review

## Reviewer verdict

**BLOCK DUE TO MISSING CONTRACT**

M3 is a valid module choice and the mapped application routes exist, but the current consent and evidence package is not sufficient to start a complete design-to-code implementation lease. Design identities are stable in the repository; the functional delta is not yet bounded because several required capabilities depend on unresolved telemetry, risk, alert, export-audit, timeline, access-control, and configuration contracts.

Review baseline: `origin/main` / worktree HEAD `9d8c414258a5e04244fdf9ce350e5f25f952dfc1`.

## Pilot checks

| Check | Result | Evidence and implication |
|---|---|---|
| Stable design revision | **PASS WITH LIMITATION** | `WA-DES-033` is registered with SHA-256 `ea9dce0b775ba69eb1bea3ebe7a35c076de316c18f1b955b5b3d8a2e8c7988e1`; `WA-DES-034` with `157b68c8ba4bbbdba4f61265b25ff98d097a810e5acb42f2aef67f4b4403452d`. These are stable source identifiers in `DESIGN_ROUTE_MAP.csv`, but both remain `REQUIRES_PRODUCT_OWNER_APPROVAL`, and no accepted M3 screen-batch row or final comparison evidence exists. |
| Maps to real application pages | **PASS** | `/operations`, `/operations/live`, and `/operations/exceptions` exist. The first two are nearest matches for WA-DES-033/034. `/operations/exceptions` is a legitimate secondary child route but has no exact design match. `/api/routing/eta` exists as a supporting shared API, not an Operations screen. |
| Delta is bounded | **FAIL** | The requested module spans all CR-430..448. Existing code is a broad legacy command page plus a separate live prototype and partial exception projection. Required gaps include the two-primary-view IA, five prescribed KPIs, real inspector availability/location/workload, all-widget geography scoping, cancellation analytics, route history, canonical timeline, configured KPI period, audited export, direct-route capability checks, and independently retryable widget errors. |
| No unapproved backend work required | **FAIL FOR COMPLETE MODULE; PASS FOR A READ-ONLY SUBSLICE** | Existing Supabase/RLS reads can support a read-only Operations Map/National Performance shell with honest blocked states. A complete module cannot be certified without approved contracts for live telemetry/privacy/staleness, configurable map cadence, risk/posture policy, alert taxonomy, canonical operational timeline, audited export, KPI periods, and confirmed remote cancellation objects. No DDL, provider, or shared-data mutation is currently authorized. |
| Expected tests sufficient | **FAIL** | Current tests prove pieces: Mapbox provider availability, ETA success, seeded lifecycle counters, exception grouping, some override/cancellation workflows, and shell navigation. They do not prove WA-M3-AC-001..006, exact design parity, direct-route role negatives, all-widget geography isolation, synthetic-location prohibition, audited export, real tracking/timeline completeness, independent widget failure/retry, or the full EN/AR RTL responsive/accessibility matrix. |
| Consent packet complete | **FAIL** | The canonical current slice remains the promoted M1 Dashboard. There is no activated M3 task/screen batch, no M3 implementation lease, no Product Owner decision for WA-DES-033/034, no accepted semantic delta, no backend-contract disposition, and no ownership record for shared `GeoMap`, global styling, or `/api/routing/eta`. All six M3 acceptance rows are still `PLANNED_NOT_IMPLEMENTED`. |

## Material design-to-code delta

### `/operations` — WA-DES-033

The route and capability are correctly mapped, but the current page does not implement the accepted Operations Center information architecture. The design authority requires:

1. Operations Map;
2. National Performance;
3. Active Visits, On the Way, Executing, Submitted Today, and Active Alerts;
4. live highlights;
5. inspector and factory detail drawers.

The implementation instead presents seven raw lifecycle counters followed by operational queues and tables. Valuable existing behavior must be preserved, but the following requirement gaps remain material:

- CR-432 does not surface Cancelled and Expired in the principal state set.
- CR-433 and CR-440 lack real inspector availability, online/offline and workload.
- CR-434 is only partially covered by configured SLA calculations.
- CR-435 includes hard-coded regional posture derivation and incomplete selected-geography scoping.
- CR-436 shows notifications, not a proved configurable operational-alert model.
- CR-439 does not filter every widget, queue, risk list, alert and export.
- CR-441 shows pending decisions rather than cancellation monitoring analytics.
- CR-442 shows pending override decisions rather than complete override history.
- CR-443 and CR-444 lack route history and the canonical end-to-end operational timeline.
- CR-445 does not implement the specified configurable-period KPI set.
- CR-446 downloads client-generated CSV without server authorization/audit evidence.
- CR-447 relies on RLS and shared channel routing without an M3-specific direct-route capability gate.
- CR-448 provides an aggregate partial-load banner, not independent widget isolation and retry.

### `/operations/live` — WA-DES-034

Mapbox and real factory coordinates exist, but inspector positions, routes, movement and ETA are deterministic projections constructed from visit identifiers and visit windows. The disclosure prevents a literal false claim in the copy, but does not satisfy CR-431/433 and is too risky for an operational map. Regional geometry radius and risk posture also use local constants. These values must not be upgraded into operational truth.

The safe implementation options are:

- wire an approved, RLS-scoped active-journey telemetry contract; or
- show factory/visit truth and a clear `LIVE INSPECTOR TELEMETRY UNAVAILABLE` state.

`/api/routing/eta` should not be assumed to solve this gap. It is a shared Field-facing Mapbox Directions endpoint, is not called by `/operations/live`, and has no M3 implementation lease.

### `/operations/exceptions` — no exact design

The route is permitted as a secondary child, but no registered M3 page is its exact design authority. It is off by default and its enabled projection covers only open cases and risk exceptions. Source errors are ignored, record drilldowns are absent, and defined sync-conflict/override categories are not sourced. Keep it secondary and request an accepted design before visual consolidation.

## Backend implications

Reusable contracts already exist for:

- Supabase SSR/RLS reads over visits, factories, assignments, inspections, geo events, notifications, actions, evidence and configured engine settings;
- geo-override and active-cancellation decision RPCs;
- Mapbox rendering and a fail-closed provider boundary;
- visit/Factory 360 handoff routes.

Missing or unproved contracts that block full certification:

- live inspector telemetry source, privacy window, stale/offline semantics and configured cadence;
- approved regional/risk posture formula;
- operational alert taxonomy and configuration;
- one canonical planning-to-review/compliance timeline projection;
- permission-controlled, audited export;
- KPI calculation period and exact formulas;
- M3-specific role/capability route guard and fail-closed role-resolution behavior;
- remote availability of cancellation schema/RPCs.

No migration, provider change, remote DDL, seed write, or shared-data mutation should be inferred from the module approval.

## Required verification before sponsor consent

Create an M3-focused suite that proves:

1. Operations Map then National Performance at the registered design viewport;
2. real RLS-scoped source records and truthful unavailable states;
3. no synthetic inspector location, route, ETA, risk band, SLA, KPI period, alert or AI value;
4. authorized Operations/Leadership positives and direct-route/RLS negatives;
5. region/branch/city filtering across every visible module dataset;
6. visit and Factory 360 read-only handoffs;
7. provider absent/error, stale/conflict, empty, partial and per-widget retry behavior;
8. audited export or an honest unavailable state;
9. workflow, maker-checker, immutable history and adjacent Dashboard/Planning/Factory 360 regression;
10. EN/LTR and AR/RTL, light/dark, keyboard/axe, 1440×900, 1200×800, 1024×768, 412/390 and 320 reflow;
11. a complete external evidence manifest and real-browser sponsor walkthrough.

Existing tests are useful protected regression inputs but are not an M3 acceptance certificate.

## Proposed corrected pilot boundary

If the sponsor wants M3 to proceed before all missing backend contracts are supplied, constrain the first implementation lease to a **read-only guarded preview**:

- `/operations?wa_preview=1`;
- Operations Map and National Performance composition only;
- existing real RLS-scoped factories, visits, assignments, notifications and configured SLA values;
- existing route handoffs;
- explicit blocked states for telemetry, workload, audited export, unapproved risk posture, timeline and other missing contracts;
- preservation of `/operations/live` and `/operations/exceptions` as unchanged compatibility routes;
- route-local components and CSS only.

Exclude shared `GeoMap`, shell/global CSS, migrations, providers, `/api/routing/eta`, Field/PWA/iPad and remote Supabase from the lease. Record separate ownership before any shared-file change.

## Missing consent evidence

- Product Owner acceptance of WA-DES-033 and WA-DES-034 revisions.
- Accepted mapping for `/operations/exceptions`, or an explicit decision to retain it as an undesigned secondary child.
- Approved semantic delta and corrected bounded slice.
- Disposition for every missing backend contract above.
- Exact implementation owner and shared-file ownership boundary.
- M3 acceptance/evidence plan and rollback.
- M3 current-slice activation.

Until those items exist, the reviewer recommendation remains:

**BLOCK DUE TO MISSING CONTRACT**

All `WA-M3-AC-001..006` rows remain `PLANNED_NOT_IMPLEMENTED`; no row is accepted, implemented, tested, or evidenced by this review.
