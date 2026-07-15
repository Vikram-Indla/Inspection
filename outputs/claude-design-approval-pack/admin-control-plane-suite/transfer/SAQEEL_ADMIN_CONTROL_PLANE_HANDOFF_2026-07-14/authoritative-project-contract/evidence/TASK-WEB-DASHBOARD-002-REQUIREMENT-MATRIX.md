# TASK-WEB-DASHBOARD-002 Requirement Closure Matrix

Date: 2026-07-13  
Business input: `/Users/vikramindla/Downloads/saqeel.html`  
Runtime: `/dashboard`, `/operations`, `/operations/live`

`saqeel.html` is approved information-architecture input, not policy or metric data. “Pass — unavailable boundary” means the usable parent requirement is present and the missing sub-leg is explicitly unavailable because no governed source, field, threshold or policy exists. It does not mean a substitute value was invented.

## Dashboard input requirements

| ID | Requirement | Status | Runtime evidence |
|---|---|---|---|
| DASH-001 | Dedicated Dashboard destination | PASS | `/dashboard`; distinct `/operations` and `/operations/live` destinations. |
| DASH-002 | Strategic / Operational switch | PASS | URL-backed tabs with `aria-selected`, labelled panels and focus proof. |
| DASH-003 | Entity search | PASS | RLS-scoped factory, visit and inspection results with governed dossier/report links. |
| DASH-004 | Date scope | PASS | Visible last-30-days default, custom from/to range and refreshed timestamp. |
| DASH-005 | Region scope | PASS | Source-backed All Regions/region selector applied to dashboard aggregation. |
| DASH-006 | National performance | PASS — unavailable boundary | Completion volume, compliance and approval formulas/denominators are live; annual target is explicitly not configured. |
| DASH-007 | Compliance explorer | PASS | Same eligible-answer denominator grouped by region, city, sector and authority. |
| DASH-008 | Strategic exceptions | PASS — unavailable boundary | Top regulation and high-risk/L1 factory filter are live; annual-inspection eligibility/year definition is not configured. |
| DASH-009 | National movement | PASS | Current versus prior equal-window violations, explicitly linked to inspection submission time. |
| DASH-010 | Today's operations | PASS | Asia/Riyadh planned/submitted metrics. |
| DASH-011 | Execution and approvals | PASS | Active, overdue, awaiting and returned counts with drilldowns. |
| DASH-012 | Operational exceptions | PASS | High priority, cancellations/reasons, SLA/review alerts and GPS overrides. |
| DASH-013 | Inspector workload | PASS — unavailable boundary | Assigned/active/completed/overdue aggregation; relative load only because no capacity threshold exists. |
| DASH-014 | KPI completeness | PASS | Planned, completed, cancelled, overdue, active inspectors, duration and SLA breach numerator/denominator. |
| DASH-015 | Shell and access | PASS | Operations/Leadership visibility plus route-level guard; RLS remains authoritative. |
| DASH-016 | Responsive/accessibility/failure quality | PASS | Arabic RTL, English, dark/light, desktop/mobile, visible focus, status/alert semantics and partial-source banner. |

## Operations Center acceptance reconciliation

| Requirement / AC | Status | Closure evidence or truthful boundary |
|---|---|---|
| MVP1-M08-001 / AC-0430 Command Center | PASS | Source-backed dashboard and detailed Operations Center coexist. |
| MVP1-M08-002 / AC-0431 Live map | PASS | KSA factory/active-visit map plus `/operations/live`; projected positions are labelled as projections. |
| MVP1-M08-003 / AC-0432 Visit monitoring | PASS | State KPIs, live monitoring refresh and drilldown. |
| MVP1-M08-004 / AC-0433 Inspector monitoring | PASS — unavailable boundary | Scoped workload exists; online/offline is explicitly unavailable because there is no presence source or timeout policy. |
| MVP1-M08-005 / AC-0434 SLA monitoring | PASS | Visit SLA and configured business-day review-SLA conditions use `engine_settings`; no forecast is invented. |
| MVP1-M08-006 / AC-0435 Risk monitoring | PASS | Governed risk/L1 record filters; no generated recommendation. |
| MVP1-M08-007 / AC-0436 Alert management | PASS — unavailable boundary | Deterministic overdue, review, override and cancellation alerts plus RLS-scoped mark-handled path; offline/stuck alerts are unavailable without source/policy. |
| MVP1-M08-008 / AC-0437 Visit drilldown | PASS | `/visits/:id`. |
| MVP1-M08-009 / AC-0438 Factory drilldown | PASS | `/factories/:id`. |
| MVP1-M08-010 / AC-0439 Geography filter | PASS — unavailable boundary | Region/city are source-backed; no branch field exists. |
| MVP1-M08-011 / AC-0440 Workload | PASS — unavailable boundary | Per-inspector aggregation exists; no absolute capacity threshold or balancing recommendation. |
| MVP1-M08-012 / AC-0441 Cancellation monitoring | PASS | Cancelled count, reasons and deterministic alert rows. |
| MVP1-M08-013 / AC-0442 GPS override monitoring | PASS — unavailable boundary | Planned/observed coordinates, reason and time; inspector confirmation is unavailable because no field exists. |
| MVP1-M08-014 / AC-0443 Tracking history | PASS | Immutable location-event history and governed visit drilldown; projected routes never claim GPS history. |
| MVP1-M08-015 / AC-0444 Operational timeline | PASS | Scoped planning-to-review audit timeline from append-only audit events. |
| MVP1-M08-016 / AC-0445 Operations KPIs | PASS | Complete selected-window scorecard with formulas and denominators. |
| MVP1-M08-017 / AC-0446 Export | PASS | Existing UTF-8 CSV export preserves region/city scope. |
| MVP1-M08-018 / AC-0447 Access control | PASS | RLS, role-scoped shell and explicit `/dashboard` route guard. |
| MVP1-M08-019 / AC-0448 Failure handling | PASS | Per-source degradation, partial banner and monitoring refresh error state. |

## Business tabs and prohibited reference content

- Every supplied navigation item has a governed disposition in `design/claude-design-mvp1/authority/SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md`.
- Analytics, Lookup Management, Notification Configuration and Integration Management remain hidden because there is no approved route/behavior contract. This is a closed disposition, not a claim that those products were built.
- AI Assistant, Executive AI Brief and Operational AI Priorities are removed for MVP1. Deterministic record filters are labelled as such.
- Sample values such as 85%, 92%, 98%, 50,000 and 1,250 are not copied into runtime.

## Verification disposition

- TypeScript: PASS.
- Production build: PASS.
- Focused dashboard/shell Playwright: PASS 16/16.
- Complete Playwright regression: PASS 50/50.
- Visual evidence: English dark/light desktop and Arabic RTL mobile reviewed.
- Sponsor runtime visual acceptance of the completed dashboard remains the only approval step; no implementation requirement is silently outstanding.
