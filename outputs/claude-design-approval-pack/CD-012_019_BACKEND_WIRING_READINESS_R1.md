# CD-012–019 Backend Wiring Readiness — R1

## Decision

**Do not implement a consolidated backend change yet.** The submitted design package is blocked and the product authority requires human design signoff before application edits. Several intended surfaces also lack approved route, data, RLS, audit, or policy contracts.

## Buildable after corrected design signoff

| CD | Existing backend seam | Safe next slice |
|---|---|---|
| 012 | `config_versions`, `proposeWorkflowDraft`, `saveWorkflowDraft`, `approvePublishWorkflow` | Align the approved library UI to real reads/actions and prove maker-checker/immutability negatives. |
| 014 | `engine_settings` risk read and `saveRiskSettings` weight validation | Align risk configuration UI to current direct write, RLS denial, audit evidence, and reproducibility inputs. |
| 015 | official coordinates/factory geofence data and `updateGeofenceRadius` | Align governed geofence edit UI to source, RLS and negative validation. |
| 018 | `ui_strings` save/review/add/sync/history/restore actions | Implement the approved localization screen against existing actions and prove draft/review/history negatives. |
| 019 | RLS-scoped `audit_events` query, filters, pagination, before/after detail | Align audit-browser presentation to the real reader without adding export/reveal/correlation claims. |

## Needs an approved backend contract first

| CD | Missing authority |
|---|---|
| 013 | Canvas persistence model, graph validation algorithm, scenario/replay fixtures/results, test store, audit events, SLA calendar. |
| 016 | Route ownership, rule schema, recipients, outbox, provider adapters, delivery receipts, deduplication, escalation/calendar policy, RLS/audit. |
| 017 | Permission-change schema/action, SoD guard, approval state machine, policy-citation data, audit, RLS. |
| 019 extensions | Privacy masking/reveal, export/retention, correlation model, tamper evidence, timezone/delivery-receipt policy. |

## Non-negotiable implementation sequence

For each signed-off slice: source receipt → data/API/RLS contract → forward migration if required → server action/read model → UI integration → audit and negative tests → RTL/theme/accessibility → focused regression → evidence and independent audit. Do not create a route, provider, policy, threshold, or workflow merely to satisfy a design mockup.
