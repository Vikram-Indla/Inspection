# AI delta implementation charter

Date: 2026-07-18
Baseline: integrated `main` at `4c22d8f`

This charter records the AI requirements that were present in the source
contracts but were not represented by a business-context insertion point. The
existing `/ai/suggestions` docket is explicitly out of scope for this slice and
is not being redesigned or removed.

## Authoritative deltas

| Requirement | Business use case | Insertion point | Status before this slice |
|---|---|---|---|
| MVP1-M01-016 / AC-0016 | Explain planning risks, workload, hotspots and recommendations | Bulk planning review | Not delivered |
| MVP1-M01-026 / AC-0026 | Summarize coverage, hotspots, overloaded regions, workload, high-risk factories and priorities | Bulk planning review | Not delivered |
| MVP1-M03-009 / AC-0107 | Daily summary, risk summary, route optimization and preparation recommendations | Inspector pre-start | Not delivered |
| MVP1-M04-138 | Explain an inspection requirement (future-AI contract) | Inspection item detail | Delivered in this slice: server-re-read, locked-package item explanation; advisory only |
| MVP1-M07-014 / MVP1-M07-015 | Explain the stored Factory 360 health score and risk drivers | Factory 360 risk history | Delivered in this slice: server-re-read persisted scores, model versions and driver snapshots; no recalculation or decision mutation |
| MVP3 M3-10 / MVP2-REQ-0255 | Evidence-cited AI suggestions with confidence, edit/reject and separate human decision; never write penalty/severity/license decisions | Governed advisory surface | Generic docket only; contextual wiring not delivered |

The wider recommendation/summary delta register is also tracked here so it
cannot disappear between slices. These rows remain queued after the mandatory
two-slice delivery: M01 `002,003,004,005,006,008,009,010,012,016,022,023,024,025,027,029,030,031,032,035,036,037,038,039,041,042,044,046,047,049,050`; M02 `001,002,003,004,005,006,007,008,009,012,013,015,016,017,018,027,035,036,042`; M03 `001,003,004,009,010,013,014`; M04 `114,138,218`; M07 `007,014,015`; M08 `016`.

## Complete source-backed delivery register

This is the complete non-generic AI delta found in `atomic_scope.csv`. It is a
charter, not a claim that every item below is implemented. “Delivered” means a
real user insertion point, server re-read and a persisted advisory result;
“queued” means it must not be silently represented by the generic docket.

| Delivery group | Source requirements | Source-requested AI behavior | Current treatment |
|---|---|---|---|
| Planning review and target selection | M01-002/003/004/005/006/008/009/010/012/016/022/023/024/025/027/029/030/031/032/035/036/037/038/039/041/042/044/046/047/049/050 | Factory, criteria, assignment, timing and publication recommendations; risk/overdue/conflict/location/duplicate highlights and outcomes | **Partially delivered:** M01-016/026 planning summary. **Queued:** every suggestion that could select a factory, assign a person, set a date, publish, or infer a location until its source data and human-disposition workflow are explicitly wired. |
| Visit management and campaign operations | M02-001/002/003/004/005/006/007/008/009/012/013/015/016/017/018/027/035/036/042 | Attention/trend/risk/campaign summaries; filters, assignment/time recommendations, duplicate/transition checks, attachment classification and completion prediction | **Queued:** summaries can be delivered once each page has RLS-scoped source facts. Recommendation, prediction and classification require an approved confidence/disposition contract; no automatic reschedule, assignment or transition. |
| Inspector preparation | M03-001/003/004/009/010/013/014 | Daily/workload/risk/route/preparation brief; saved-filter, notification and appointment-time suggestions | **Partially delivered:** M03-009 preparation assistant. **Queued:** daily dashboard, route, notification and appointment slices; Mapbox remains source of route geometry and unavailable is stated honestly. |
| Field inspection and review | M04-114/138/218 | Corrective-action suggestion, requirement explanation, reviewer recommendation | **Partially delivered:** M04-138 item explanation. **Queued:** corrective action and reviewer suggestions, because they require explicit workflow/RBAC and human disposition before any action can be presented. |
| Factory 360 and Operations Center | M07-007/014/015; M08-016 | Material-change, health/risk-driver and KPI-change explanations | **Partially delivered:** M07-014/015 persisted score/risk explanation. **Queued:** materials-change and KPI-change explanations until the authoritative comparison period and KPI definition are bound. |

### Ordered implementation queue

1. M08-016 Operations KPI change explanation — low mutation risk once the
   KPI comparison window and metric definitions are read from the operations
   source rather than calculated by the model.
2. M07-007 materials change explanation — compare recorded material versions
   only; never label a change suspicious or take enforcement action.
3. M03-001/003/010 daily inspector briefing and preparation depth — use the
   existing visit/Mapbox facts, no route or start-state mutation.
4. M02 summary-only surfaces — campaign/visit status summaries with explicit
   data freshness and no prediction, assignment or transition.
5. Recommendation and prediction surfaces — only after M3-10’s edit/reject,
   confidence evidence and human-disposition lifecycle is implemented.

The supporting source is `product-contract/domain/atomic_scope.csv` and the
MVP2 local certificate. The repository does not contain the original workbook's
full prose for every M2-11 row, so no missing acceptance text is invented here.

## Guardrails

- AI is advisory only and never selects factories, changes risk, changes a visit,
  gates geofence/start, edits an inspection answer, or writes a legal/penalty/
  severity/license decision.
- Every generated result is tied to server-re-read source facts and explicit
  evidence references; client snapshots are never treated as authoritative.
- No provider/key means an honest unavailable state and no database write.
- Offline pre-start never calls the provider or writes an AI result.
- English/Arabic, LTR/RTL, keyboard, narrow viewport and negative paths are part
  of the acceptance contract.

## Delivery sequence

1. Planning Summary: server-re-read bulk review facts, Gemini advisory panel,
   append-only contextual insight record, evidence refs, no-selection mutation.
2. Preparation Assistant: server-re-read visit/factory/package/route facts,
   pre-start advisory panel, no workflow gating, offline fail-closed.
3. Item-context explanation: a server-re-read, locked-package explanation of the
   item title, recorded guidance, clause reference and evidence rule; it does
   not interpret law or recommend an answer. The full M3-10 edit/reject
   experience remains a separately governed lifecycle enhancement.
4. Factory 360 score/risk explanation: server-re-read persisted score, band,
   model version and driver snapshots; it cannot calculate or change risk, or
   recommend an enforcement, licence or inspection outcome.

## Acceptance evidence required

- Source-to-screen-to-action mapping for each requirement above.
- Provider-configured and provider-unavailable tests.
- Evidence references present on every generated record.
- Human disposition/rejection is separate from generated content.
- No mutation of factory selection, visit state, risk values or inspection data.
- EN/AR + RTL + 412px and offline negative-path coverage.
- Full MVP1/MVP2 regression after each slice.
