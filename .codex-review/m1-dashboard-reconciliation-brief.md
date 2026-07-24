# M1 Dashboard — Read-only Reconciliation Brief

## Disposition

`RETURN FOR DESIGN AND WIRING CORRECTION`

Do not begin M1 product-code work under the F0 lease. The next M1 consent packet
must reconcile the approved Dashboard authorities, current live route, dormant
newer components, data-source truth states, role boundary, and performance
contract.

## Authority inputs

- Module: M1 Dashboard
- Acceptance range: `WA-SP-010..028`
- Approved design references: `SRC-DES-025`, `SRC-DES-046`
- Primary business artifact: `dashboard.xlsx`
- Route under review: `/dashboard`

The canonical repository does not currently contain stable Claude Design page
IDs, a stable revision, semantic delta, or a current consent packet for M1.
Claude Design remains responsible for supplying those design-side artifacts.

## Current implementation findings

- The active `/dashboard` route still uses the older
  `DashboardView`/`KpiGrid` implementation with substantial global/inline
  styling.
- A newer shared KPI registry/projection, `MetricStrip`, and a real
  `DecisionCanvas`/`GeoMap` exist but are not wired into the active route.
- The live view presents map placeholders while the unused Decision Canvas
  already renders the shared map implementation.
- The route passes `partialSources=[]` despite receiving failed sources, so the
  control can claim `Live` during a partial data failure.
- Critical factories are derived from `risk_band=high`/`L1`, while
  `WA-SP-016` requires fail-closed behavior until the governed risk source and
  policy are established.
- The performance contract is not met: the route remains force-dynamic, has no
  view-specific Suspense/loading boundary, and does not use a grouped RPC.
- The current role boundary permits all business roles. Existing inventory and
  design evidence disagree on whether Dashboard is for
  inspector/planner or operations/leadership.

## Required Claude Design correction packet

Claude Design must provide:

1. stable M1 page ID and revision;
2. explicit views, including Analytics, without silently reusing Strategic;
3. exact source-of-truth states for live, partial, degraded, blocked, empty,
   unauthorized, and provider unavailable;
4. the real Decision Canvas/GeoMap treatment;
5. role/persona authority for every view;
6. critical-risk behavior when the governed risk source is unavailable;
7. responsive EN/AR, LTR/RTL, light/dark evidence;
8. semantic delta against the active `/dashboard` implementation;
9. bounded file proposal and tests;
10. sponsor consent packet.

## Wiring prerequisites

- Decide the authoritative Dashboard persona boundary.
- Establish the governed risk source/policy or keep critical-risk output
  fail-closed.
- Propagate real failed-source state to the UI.
- Choose whether to wire the existing Decision Canvas/GeoMap or formally
  supersede it.
- Define grouped data loading and view-specific loading boundaries.
- Expand the M1 file lease beyond `page.tsx`; the active view, styles, shared
  components, and focused tests are necessarily involved.

## Minimum acceptance evidence

- Exact `WA-SP-010..028` traceability.
- Role-positive and role-negative route tests.
- Live/partial/degraded/blocked/empty/unauthorized/provider-unavailable states.
- Governed risk fail-closed negative test.
- Real map/provider behavior; no permanent placeholder claimed complete.
- 1440, 1024, tablet, and mobile EN/AR light/dark checks.
- Keyboard and accessibility checks.
- Typecheck, production build, focused M1 suite, and protected F0 regression.

## Ownership boundary

- Claude Design: M1 stable revision, visual/state correction, semantic delta,
  and consent packet.
- Codex: repository mapping, contract challenge, wiring plan, and—only after
  sponsor consent—the single implementation lease.
- Reviewer/test stream: independent negative-path and regression certification;
  no modification of leased files.
