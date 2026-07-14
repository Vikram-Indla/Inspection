# Saqeel Dashboard Business Requirement Contract V1

## Authority and change control

Sponsor direction on 2026-07-13 authorizes completing the dashboard represented by
`/Users/vikramindla/Downloads/saqeel.html` while CD-020 proceeds independently. This is a
read-model and interaction change under `TASK-WEB-DASHBOARD-002`; it does not change canonical
workflow transitions, RLS, audit, immutable versions, engine policy, or the CD-020 design.

The HTML is business information-architecture input, not data authority. Its example numbers,
green styling and AI text are not production truth. Every runtime value must derive from the
current user's RLS-scoped records, and missing policy must produce a truthful unavailable state.

## Requirements and acceptance

| ID | Business requirement | Runtime acceptance |
|---|---|---|
| DASH-001 / DASH-AC-001 | Dedicated Dashboard destination | Dashboard is a real route, distinct from the detailed Operations Center and live map. |
| DASH-002 / DASH-AC-002 | Strategic / Operational switch | Two keyboard-operable views share the same declared filter scope and preserve the chosen view in the URL. |
| DASH-003 / DASH-AC-003 | Dashboard topbar search | Search factories, visits and inspections through RLS; results link to governed dossiers. It is not navigation-only search. |
| DASH-004 / DASH-AC-004 | Date scope | Default is the business-supplied last 30 days. Explicit user-selected from/to dates may replace it; visible freshness and scope are mandatory. |
| DASH-005 / DASH-AC-005 | Geography scope | All Regions plus source-backed region values filter every dashboard metric and breakdown consistently. |
| DASH-006 / DASH-AC-006 | National performance | Show inspection completion volume, compliance rate and inspection approval rate with visible formulas and denominators. Annual-target percentage remains unavailable until a governed target exists. |
| DASH-007 / DASH-AC-007 | Compliance explorer | The same compliance formula can be grouped by Region, City, Sector/activity class and issuing Authority; unknown dimensions remain explicitly labelled. |
| DASH-008 / DASH-AC-008 | Strategic exceptions | Show top violated regulations, high-risk/L1 factories and annual-inspection readiness. “Pending annual inspection” remains unavailable until the inspection-year boundary and active-factory definition are governed. |
| DASH-009 / DASH-AC-009 | National movement | Show current-versus-previous-window violation movement using inspection submission timestamps; never imply an issuance timestamp that the schema does not contain. |
| DASH-010 / DASH-AC-010 | Today's operations | Show today's planned visits and submitted/completed share using Asia/Riyadh calendar boundaries and canonical visit states. |
| DASH-011 / DASH-AC-011 | Execution and approval status | Show active field inspections, overdue visits, reports awaiting approval and returned reports with drilldowns. |
| DASH-012 / DASH-AC-012 | Operational exceptions | Show high-priority pending visits, cancelled visits/reasons, SLA breaches and GPS overrides from governed records/configuration. |
| DASH-013 / DASH-AC-013 | Inspector workload | Show assigned, active, completed and overdue visits by inspector. Without a configured capacity threshold, label relative workload and never claim absolute utilization. |
| DASH-014 / DASH-AC-014 | KPI completeness | Cover M08-016: planned, completed, cancelled, overdue, active inspectors, average duration and SLA breach rate; expose denominator and unavailable states. |
| DASH-015 / DASH-AC-015 | Shell and access | Preserve role-scoped sidebar, Arabic-first RTL, dark/light, notification/account/language/sign-out and RLS authorization. Operations/Leadership see Dashboard; other roles do not gain it. |
| DASH-016 / DASH-AC-016 | Quality and failure states | Desktop and narrow layouts reflow; keyboard focus is visible; tabs expose selected state; loading/empty/partial failures are announced; values do not rely on color alone. |

## KPI source and formula ledger

| Metric | Formula | Source | Exclusions / truth guard |
|---|---|---|---|
| Inspection completion volume | count distinct inspections with `submitted_at` inside scope | `inspections` joined to `visits.factories` | No annual-target percentage without governed target. |
| National compliance rate | compliant answers / (compliant + non-compliant answers) | `checklist_responses.response.value` | Exclude incomplete, `na`, null and unknown values. |
| Inspection approval rate | approved distinct scoped inspections / submitted distinct scoped inspections | `inspections` plus `reviews.decision` | Display both numerator and denominator; no target invented. |
| Today planned visits | published visits whose `window_start` is inside today's Asia/Riyadh day | `visits` | Workflow and operational states remain separate. |
| Today completion rate | today-planned visits in `operational_state=submitted` / today planned | `visits` | Zero denominator displays unavailable, never 0%. |
| Active field inspections | count inspections with an active runtime status | `inspections.status` | Status list must be limited to canonical runtime values observed in code/contract. |
| Overdue visits | published non-submitted visits whose `window_end` is before now | `visits` | Cancelled/expired planning states excluded. |
| Awaiting approval | reviews in `pending_review` or `under_review` | `reviews` | RLS-scoped only. |
| Returned reports | latest/current reviews in `returned` state | `reviews` | Do not count historical return decisions as current work unless visibly labelled. |
| High-priority pending | high/critical priority visits not submitted/cancelled/expired | `visits.priority` | Priority value is record data, not a dashboard-generated score. |
| Active inspectors | distinct assigned inspectors on published non-submitted visits | `assignments` + `visits` | Does not imply online presence. |
| Average execution duration | average `submitted_at - started_at` for valid scoped inspections | `inspections` | Invalid/negative/missing intervals excluded and counted as unavailable coverage. |
| SLA breach rate | breached eligible visits / eligible published non-submitted visits | `visits` + `engine_settings.sla` | Thresholds only from accepted engine configuration. |
| Violation movement | violations linked to inspections submitted in current vs previous equal window | `violations` + `inspections.submitted_at` | Label as submission-linked, not violation issuance trend. |

## Explicitly unavailable or prohibited

- Annual inspection target and target percentage: no governed target exists.
- Inspection-year boundary and active-factory eligibility: no governed definition exists.
- Absolute inspector capacity/utilization: no capacity threshold exists.
- Inspector online/offline classification: no presence source or timeout policy exists.
- AI assistant, AI brief and AI recommendations: Phase 2; prohibited in this MVP1 slice.
- Predictive forecasts, scoring or prescriptive recommendations: not authorized.

These are complete truthful states, not permission to fabricate substitute values.
