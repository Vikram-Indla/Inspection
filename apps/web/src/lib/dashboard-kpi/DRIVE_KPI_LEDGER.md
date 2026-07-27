# Dashboard KPI authority ledger

Authority reopened 2026-07-27:

- Google Drive `dashboard.xlsx` (`11PfrgQcBSi58x8u4Ltrx2Z8TN3a_uiGV`, modified 2026-07-19T23:30:33Z).
- Google Drive `Inspection Project.xlsx` (`1Ei163mjV4_I9-pchlglwoWAAVdx5n9ge`, modified 2026-07-19T23:30:17Z).
- Runtime fixture: `supabase/seed_manifest_exact_10_20260727.sql` (one published bulk plan and nine deterministic published visits; fixed IDs, factory codes, windows and markers).

`(a)` means the formula is governed and implementable. `(b)` means the formula
is governed but required source semantics/schema are missing. `(c)` means a
policy value remains genuinely unresolved. Examples in the workbook do not
govern thresholds.

| ID | Formula; numerator / denominator; unit | Window and exclusions | Source tables / fields | Role scope | Drive reference | State |
|---|---|---|---|---|---|---|
| STR-KPI-001 | Compliant eligible answers / (Compliant + Non-compliant); compliant answers / eligible answered items; % | Selected period and trend periods; approved latest Level-2 outcome only; exclude N/A, unknown and incomplete | `checklist_responses.response,is_complete,item_id`; `inspections.submitted_at`; `reviews.status,decision` | Executive, Supervisor | `dashboard.xlsx` `'Stratgic View'!A2:D2`; approval lifecycle: `Inspection Project.xlsx` `'Inspection Excution-Level2Flow'!F5:M9` | Live `(a)`; cell B2 says Non-compliant but D2's 850 compliant / 1,000 = 85% and upstream approved-only contract govern the implemented orientation |
| STR-KPI-002 | Factory count by Health Score band; factories in band / n/a; count | Current as-of snapshot; exclude factories without governed Health Score | Missing Health Score snapshot/band source; do not substitute `factories.risk_band` | Executive, Supervisor | `'Stratgic View'!A3:D3` | Blocked `(b)` |
| STR-KPI-003 | Violations issued per month by regulation and severity; violation count / n/a; count | Monthly selected/trailing periods; official issued violations only | `violations.id,violation_code_id`; `violation_codes.level,clause_id`; missing official `violations.issued_at` and normalized severity | Executive, Supervisor, Compliance Admin | `'Stratgic View'!A4:D4` | Blocked `(b)` |
| STR-KPI-004 | Approve/Return/Reject share of latest Level-2 decisions; outcomes by decision / all decided outcomes; % | Selected decision period; exclude undecided submissions and superseded review rows | `reviews.inspection_id,status,decision,decided_at`; `inspections.submitted_at` | Executive, Supervisor, Compliance Admin | `'Stratgic View'!A5:D5`; `'Inspection Excution-Level2Flow'!F5:M9` | Live `(a)` |
| STR-KPI-005 | Factories with expired or expiring industrial licences; distinct exposed factories / eligible active licences; count | As-of reporting date; expiry lead X unresolved; exclude licences outside eligible active population | `industrial_licenses.factory_id,status,expiry_date` | Executive, Supervisor | `'Stratgic View'!A6:D6` | Blocked `(c)`; 30 days is explicitly an example |
| STR-KPI-006 | Cancelled visits / total planned visits; cancelled visits / all planned visits; % | Planning window in selected period; no narrower status denominator is specified | `visits.id,planning_status,window_start` | Executive, Supervisor, Planner | `'Stratgic View'!A7:D7`; planning state authority `'Visit Planning- Mangment'!J16` | Live `(a)` |
| STR-KPI-007 | Factories inspected / factories due; distinct due factories completed / distinct factories due; % | Selected governed inspection cycle; qualifying completion and due eligibility require policy | `factories.id`; `visits.factory_id`; `inspections.status,submitted_at`; missing governed cycle/due policy | Executive, Supervisor | `'Stratgic View'!A8:D8` | Blocked `(c)`; once/year is an example |
| STR-KPI-008 | Factories with zero visits or overdue past cycle grouped stage/sector/region; qualifying factory count / eligible factories; count | Current as-of and governed cycle X; exclude ineligible factories | `factories.id,activity_class,region`; `industrial_licenses.status`; `visits.factory_id,window_start`; missing governed cycle/overdue policy | Executive, Supervisor | `'Stratgic View'!A9:D9`; available planning filter dimensions `'Visit Planning-Planning'!H23` | Blocked `(c)` |
| STR-KPI-009 | Active checklist items grouped by published regulation issuing authority; distinct global items / n/a; count | Current effective configuration; exclude inactive items and non-published regulations | `inspection_items.id,active,clause_id`; `regulation_clauses.regulation_id`; `regulations.issuing_authority,status` | Compliance Admin, Executive, Supervisor | `'Stratgic View'!A10:D10`; compliance authority field `'Complince'!F2` | Live `(a)` |
| STR-KPI-010 | Visits in band / factories in band, compared across stored bands; visits / distinct factories; ratio | Visits in selected period against current stored band; exclude null band and zero-denominator bands | `visits.factory_id,window_start`; `factories.id,risk_band` | Executive, Supervisor | `'Stratgic View'!A11:D11`; risk filter field `'Visit Planning-Planning'!H23` | Live breakdown `(a)`; no mismatch threshold invented |
| STR-KPI-011 | Factories where same item failed 2+ times in 12 months / factories with >=1 violation; qualifying factories / violated factories; % | Rolling 12 months; official failures/violations only | `checklist_responses.item_id,response`; `inspections.submitted_at`; `violations.inspection_id`; missing governed failure-to-official-violation lineage/issue time | Executive, Supervisor, Compliance Admin | `'Stratgic View'!A12:D12` | Blocked `(b)` |
| STR-KPI-012 | 3–5 ranked, evidence-linked strategic findings from current + prior 2–3 periods; findings / n/a; none | Current plus trailing 2–3 periods; advisory only; every sentence traceable; include improvements and concerns | All STR KPI projections plus evidence refs; provider/evidence policy unresolved | Executive, Supervisor, Compliance Admin | `'Stratgic View'!A18:D30` | Blocked `(c)`; AI sub-capability deferred, parent KPI requirements remain |
| OPS-KPI-001 | Live count by Draft/Published/Returned/Cancelled; distinct visits by state / n/a; count | Current as-of; exclude Expired and execution states from this workbook-defined card | `visits.id,planning_status` | Planner, Inspector, Supervisor | `dashboard.xlsx` `'Ops view'!A2:D2`; planning states `'Visit Planning- Mangment'!F3`, with workbook-specific exclusion overriding the broader management KPI | Live `(a)` |
| OPS-KPI-002 | Published, not-started visits approaching window deadline; eligible visits / n/a; count | Now to now + governed lead X; exclude started, submitted and non-published | `visits.planning_status,operational_state,window_end`; lead policy missing | Planner, Supervisor | `'Ops view'!A3:D3` | Blocked `(c)`; 48 hours is an example |
| OPS-KPI-003 | Journey started and inspection not submitted; active visits / n/a; count | Current as-of; exclude submitted/closed journeys | `visits.operational_state`; `inspections.submitted_at`; journey authority `'Inspection excution-Start jou'!D2:J2` | Planner, Inspector, Supervisor | `'Ops view'!A4:D4` | Live `(a)` |
| OPS-KPI-004 | Submitted inspections without Level-2 decision; submitted undecided inspections / n/a; count | Current as-of queue; includes no-review rows; exclude decided outcomes | `inspections.id,submitted_at`; `reviews.inspection_id,decision,status` | Supervisor, Reviewer | `'Ops view'!A5:D5`; submission immutability `'Inspection excution-Start jou'!D93:J93` | Live `(a)` |
| OPS-KPI-005 | Draft regulations, checklist items and templates not published; draft object count / n/a; count | Current as-of; only the three named configuration families | `regulations.status`; `package_versions.status`; `inspection_items` lacks a draft/published lifecycle field | Compliance Admin | `'Ops view'!A6:D6` | Blocked `(b)` |
| OPS-KPI-006 | Visits scheduled today grouped inspector; visits / n/a; count | Asia/Riyadh today; no capacity judgement; exclude visits outside today | `visits.id,window_start,planning_status`; `assignments.visit_id,inspector_id` | Planner, Supervisor | `'Ops view'!A7:D7`; schedule source `'Inspection Execution - PreStart'!C6` | Live `(a)` |
| OPS-KPI-007 | Out-of-radius arrival overrides today; override events / n/a; count | Asia/Riyadh today; exclude ordinary in-radius arrivals | `geo_events.kind,geofence_result,occurred_at,visit_id` | Planner, Inspector, Supervisor | `'Ops view'!A8:D8` | Live `(a)` |
| OPS-KPI-008 | Latest N permission-visible state-change events ordered newest first; events / n/a; count/feed | Current as-of; N unresolved; immutable RLS-visible audit only | `audit_events.object_type,object_id,action,occurred_at,requirement_refs` | Planner, Inspector, Supervisor | `'Ops view'!A9:D9` | Live bounded feed `(a)`; UI shows latest 12 but does not claim workbook-governed N |
| OPS-KPI-009 | 3–5 today-only nudges ranked deadline first, each one sentence + one CTA; nudges / n/a; none | Today only; advisory; never auto-execute; context-prefilled CTA | OPS live projections plus evidence refs; governed trigger/CTA/provider policy missing | Planner, Inspector, Supervisor | `'Ops view'!A17:D27` | Blocked `(c)` |

## Exact-10 deterministic seed coverage

The manifest contains exactly one `visit_plans` row and nine `visits` rows. All
nine visits are `planning_status='published'`, `operational_state='new'`, use
fixed August 10–14 2026 windows, fixed approved factory codes, and fixed
synthetic markers.

| Coverage | KPI impact |
|---|---|
| Direct deterministic non-zero contribution | OPS-KPI-001 Published receives +9 when all seeded visits are RLS-visible; other approved data may increase the total |
| Deterministic denominator / zero-state coverage when the selected period includes August 10–14 | STR-KPI-006 planned denominator = 9 and cancelled numerator = 0; STR-KPI-010 visit numerators by the nine factories' stored bands |
| Deterministic future schedule coverage, not “today” on 2026-07-27 | OPS-KPI-006 only when the runtime date/window reaches the seeded dates |
| Explicit empty-state coverage | OPS-KPI-003/004/007 and all inspection/review/response/violation-derived strategic KPIs: the exact-10 manifest creates no journeys, inspections, reviews, checklist responses, violations or geo overrides |
| Configuration-only coverage outside the 10 domain records | STR-KPI-009 depends on the approved published package/configuration prerequisite, not on the nine visit rows |
| No coverage and must not be claimed | Health Score, licence expiry lead, due-cycle classification, repeat-violation lineage, pending-publish item lifecycle, AI summaries/nudges |

The manifest is deterministic rather than a production-data copy: it uses fixed
synthetic IDs/markers and an approved fixed set of factory codes. It does not
contain a generic scrambling algorithm, and the Dashboard must not claim that
the nine visit rows cover inspection, approval, enforcement or AI metrics.
