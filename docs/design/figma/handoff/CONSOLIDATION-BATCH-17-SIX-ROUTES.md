# Batch 17 — six more contracts

| Contract | Frame | Route | Lines | States |
|---|---|---|--:|---|
| Drafts | `362:42915` | `/field/drafts` | 151 | error, loading, offline, permission |
| Completed | `362:42986` | `/field/completed` | 105 | error, offline, permission |
| Reports | `362:43070` | `/field/reports` | 416 | empty, error, loading, offline, permission |
| Account | `362:43138` | `/field/account` | 130 | error, permission |
| Task Map | `362:43213` | `/field/map` | 176 | empty, error, permission |
| Visit Calendar | `362:43301` | `/field/visits/calendar` | 76 | error, offline, permission |

**All six: 0 clipped, 0 crunched at 1280 / 1024 / 834 / 680. 0 off-ramp sizes, 0 unbound fills.**

## Copy is the repo's, including the empty states

Every empty and offline string is quoted from the shipped code rather than written here —
*"No drafts to resume"*, *"Offline copy — read only. Connect to refresh."*,
*"No submitted reports"*, *"Document unavailable offline"*, *"Account details are unavailable."*,
*"No mapped assignments"*, *"Task map unavailable"*, *"No prepared visits in this range."*

`Completed` carries the shipped framing **"Immutable submission history"**, and `/field/map`
carries **"Assigned establishments in visit-window order"** — both are governance statements, not
decoration.

## Reuse, not new components

- `Task Map` uses the existing `GeoWorkspace` `176:100` (`State=ready`) and `InspectionCard`
  `Variant=MapOverlay` — no new map component.
- `Visit Calendar` and `Drafts` use `InspectionCard` `Variant=Queue`.
- Risk legend uses `ExceptionMark` `172:98` — shape plus label, never colour alone.

**No component was created in this batch.** Fourteen existing ones covered all six screens, which
is the first time a batch has needed nothing new.

## Reachability recorded honestly

Three of these six — `/field/drafts` aside — are in the **unreachable** set found by the route
audit: `/field/completed`, `/field/reports` and `/field/map`'s siblings vary, but
`/field/completed` and `/field/reports` have **zero inbound navigation**, and their child routes
are reachable only from those dead parents.

Designing them does not make them reachable. The entry-point gap is a repository change and is
recorded, not papered over by the existence of a contract.

## Running total — 24 frames, 16 routes

`/field` · `/field/[visitId]` · `/field/establishments` (+Dark, AR, 3 states) ·
`/field/summons-notices` (+Dark, AR) · `/field/notifications` · `/field/settings/devices` ·
`/field/settings/conflicts` · `/field/factory-360/[id]` · `/field/visits` · `/field/search` ·
`/field/drafts` · `/field/completed` · `/field/reports` · `/field/account` · `/field/map` ·
`/field/visits/calendar`

## Remaining

| Route | Note |
|---|---|
| `/field/inspection/[id]` | already governed as `SCR-FLD-630` |
| `/field/inspection/[id]/results` · `/statement` | governed as SCR-IPAD-650/660 reference |
| `/field/[visitId]/travel` | governed as SCR-IPAD-620 reference |
| `/field/my-tasks` | governed as `SCR-FLD-600` |
| `/field/incident-reports` · `/destruction-reports` · `/sample-collection-reports` · `/facility-reports` | record types in the batch-06 flow |
| `/field/establishments/unregistered` · `/field/notifications/[id]` · `/field/completed/[id]` · `/field/reports/[id]` · `/field/virtual` · `/field/virtual/[id]` · `/field/feedback` · `/field/feedback/rate/[visitId]` · `/field/settings` · `/field/settings/readiness` · `/field/factory-360` | not yet contracted |

`/field/reports/[id]` is a 13-line redirect stub and does not warrant a contract.
