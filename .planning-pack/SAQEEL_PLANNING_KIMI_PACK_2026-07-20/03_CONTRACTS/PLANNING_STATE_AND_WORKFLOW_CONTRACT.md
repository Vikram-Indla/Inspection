# Planning State and Workflow Contract

## Separate state domains

- **Planning status:** Draft, Published, Returned, Cancelled, Expired.
- **Internal plan validation:** Incomplete, Validated, Blocked (not user tabs).
- **Operational state while Published:** New, Ready for Execution, On the Way, Arrived, Executing Inspection, Submitted.
- **Inspection/review states:** owned by Execution/Review and never collapsed into Planning status.

## Core transitions

| From | Trigger | To | Guards | Side effects |
|---|---|---|---|---|
| none | Save draft | Draft | minimum draft identity | stable reference, audit; no inspector notification/pool |
| Draft | Publish | Published/New | complete publish guards | assignments, notifications queued, audit, optional package snapshots |
| Published/New | Return | Returned | reason, authorized actor, pre-execution | remove active schedule where applicable, notify planner, history |
| Returned | Republish | Published/New | revalidated config/assignment/window | same Visit ID/Plan ID, notify inspector |
| Draft | Discard | archived draft | authorized, never published | soft-delete/archive + audit |
| Draft or Published/New | Cancel | Cancelled | reason, before cut-off | final/read-only, notify, preserve previous assignment/window |
| Published eligible | Scheduled expiry | Expired | configured rule fires | final/read-only, reason + notifications + audit |
| Cancelled/Expired | Duplicate | new Draft | eligible fields only | new IDs; no execution/evidence/review copied |

## Expiry rule families

Admin may enable/version: no acknowledgement; no execution date; execution not started; visit not completed. Each rule includes event/time basis, scope, reason, notification recipients and effective dates. The scheduler must evaluate idempotently and record the rule/version used.
