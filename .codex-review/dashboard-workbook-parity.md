# M1 Dashboard — Workbook-to-Runtime Parity Review

## Verdict

`NOT DELIVERED`

Source workbook:
`/Users/vikramindla/Developer/Business - Inspection/Saqeel Web/dashboard.xlsx`

The workbook defines 21 capabilities:

- 11 Strategic KPIs plus one Strategic AI Summary;
- 8 Operational KPIs plus one Operational AI Nudges capability.

Column D contains examples. Those values are not approved production data,
targets, thresholds, or fixtures for runtime display.

## Why the current screenshots are not acceptable

- The active Dashboard view renders labelled placeholder canvases instead of
  mounting the existing shared `GeoMap` through `DecisionCanvas`.
- The responsive shell/content grid overflows at the captured narrow width;
  the rail remains in the layout and the Dashboard content is pushed
  horizontally off-screen.
- The current operational cards use labels/states that do not exactly match the
  workbook visit-pipeline contract.
- Several shown figures depend on unapproved risk, cycle, terminal-state, SLA,
  or capacity policies.
- The route can show a green `Live` state while a data source has failed because
  the active page discards `partialSources`.
- `?view=analytics` silently renders Strategic rather than a real Analytics
  view or an honest blocked state.

## Strategic parity

| Workbook capability | Current runtime | Validation |
| --- | --- | --- |
| Compliance rate trend | Approved-only point-in-time calculation exists; no complete governed trend presentation | PARTIAL |
| Risk distribution | Current presentation implies risk bands without proven policy/source | BLOCKED / INCORRECT |
| Violation trend | Current-vs-previous count exists; required month/regulation/severity treatment is incomplete | PARTIAL |
| Decision mix | Not represented as the workbook's Approve/Return/Reject Level-2 mix | MISSING |
| License exposure | No governed licence-expiry source | BLOCKED |
| Cancellation rate | Registry/projection support exists but active view does not present the workbook KPI | UNWIRED |
| Coverage | Correctly shown as not configured because cycle/eligibility policy is absent | BLOCKED HONESTLY |
| Uninspected factories | Zero-visit and overdue-cycle concepts are not separately presented | MISSING / BLOCKED |
| Checklist items per authority | Current authority lens is not the required item-count KPI | INCORRECT SUBSTITUTE |
| Risk-to-attention mismatch | No governed risk policy/denominator semantics | BLOCKED |
| Repeat violation rate | Stable item lineage, issue date and lookback are not governed | BLOCKED |
| Strategic AI Summary | Deterministic summary exists; generated AI is deferred and evidence-clickthrough is incomplete | PARTIAL |

## Operational parity

| Workbook capability | Current runtime | Validation |
| --- | --- | --- |
| Visit pipeline | Present, but state labels/counting do not exactly match Draft/Published/Returned/Cancelled | INCORRECT MAPPING |
| Expiring soon | Past-window nudge is not the same as published visits approaching their execution deadline | PARTIAL / INCORRECT |
| Active executions | Present from journey-started/not-submitted records | PARTIAL PENDING NEGATIVE TESTS |
| Pending approvals | Present; immutable latest-review semantics still require runtime proof | PARTIAL |
| Pending publish | Permission-blocked for the current default audience; no admin draft counts may leak | BLOCKED HONESTLY |
| Today's schedule load | Present as relative assigned load; must not claim capacity without policy | PARTIAL |
| GPS overrides today | Data support exists; same-day window and immutable-event semantics require proof | PARTIAL |
| Live activity feed | Required latest-N state-change feed is not delivered | MISSING |
| Operational AI Nudges | Deterministic record filters exist; generated AI is deferred, CTA context is not fully proven | PARTIAL |

## Mapbox root cause

The shared Mapbox implementation exists:

- `apps/web/src/components/GeoMap.tsx`
- `apps/web/src/app/(app)/dashboard/DecisionCanvas.tsx`

It was previously wired by commit `b825bfc6`. A later merge,
`80c729dc`, replaced the active Dashboard page/view with an older composition.
The current `DashboardView.tsx` displays static text such as `Mapbox GL`,
`Live basemap`, legends, and attribution, but does not mount the map component.

This is a merge regression and a false-functionality defect. The correction is
to wire the existing fail-closed map composition, not build another map.

## Required correction order

1. Accept a stable Claude Design M1 revision covering all 21 workbook items.
2. Preserve example values only as explanatory design annotations, never live
   production values.
3. Wire the registry-backed KPI projection and `MetricStrip`.
4. Wire the real `DecisionCanvas`/shared `GeoMap`.
5. Correct partial/degraded state propagation and remove false `Live`.
6. Correct Strategic/Operational URL-state and explicitly block Analytics until
   its real view exists.
7. Correct narrow-width shell/content behavior against the accepted F0 shell.
8. Run formula, RLS, permission, provider-failure, responsive, RTL,
   accessibility, performance and adjacent-module regression tests.

No Dashboard unit may be called delivered until every row is live with evidence
or visibly classified as unavailable, not configured, decision required,
permission blocked, or deferred.
