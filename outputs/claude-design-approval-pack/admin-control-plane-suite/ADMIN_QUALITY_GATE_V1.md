# Saqeel Admin Control Plane — Quality Gate V1

## Decision rule

Every CD is reviewed independently. A remaining P0 or P1 after the mandatory correction iteration blocks sponsor approval and blocks the next chapter. Numerical self-scoring is prohibited; evidence is reported as `PASS`, `FAIL`, `BLOCKED`, or `NOT_APPLICABLE` with a reason.

## Per-CD gates

| Gate | Criterion | Severity if missing | Required evidence |
|---|---|---:|---|
| ADM-QG-01 | Contract IDs, role, route, object, lifecycle, engine, error, acceptance, and evidence scope are exact | P0 | Traceability table linked to source files |
| ADM-QG-02 | Current route, imports, data sources, RLS/grants, guards, audit, and side effects were inspected | P0 | Route-and-runtime truth memo |
| ADM-QG-03 | Unsupported route/data/provider/action legs are `HANDOFF_BLOCKED` | P0 | Wiring map with missing-leg reason |
| ADM-QG-04 | The design is a governed control plane, not generic CRUD or equal KPI cards | P1 | Current-screen critique and decision-zone proof |
| ADM-QG-05 | Three hypotheses materially differ in information architecture/task flow | P1 | Equal-fidelity hypothesis frames and comparison |
| ADM-QG-06 | The selected hypothesis reduces decision time, hidden assumptions, or irreversible-error risk | P1 | Selection rationale and counterfactual |
| ADM-QG-07 | At most one justified page-specific signature pattern is introduced | P1 | Inheritance ledger and signature statement |
| ADM-QG-08 | Frozen shell, Saqeel tokens, typography, density, focus, status language, theme, and navigation are inherited | P0 | Component inheritance and regression checklist |
| ADM-QG-09 | Populated and hard-case content is realistic, source-labelled, and free of invented policy | P0 | Data-truth ledger and fixture disclosure |
| ADM-QG-10 | Loading, empty, validation, unauthorized/read-only, stale, degraded, failure, and recovery states are first-class | P0 | Per-CD state matrix and frames |
| ADM-QG-11 | One failing source is isolated and never rendered as zero, healthy, delivered, or platform-wide failure | P0 | Partial-failure frame and recovery annotation |
| ADM-QG-12 | Arabic is designed first with realistic long strings, mixed-direction identifiers/dates, and physical RTL order | P0 | Arabic RTL primary and constrained-width frames |
| ADM-QG-13 | Dark/light modes preserve semantic meaning and hierarchy | P1 | Equivalent-state dark/light evidence |
| ADM-QG-14 | Keyboard, focus transfer, semantic landmarks/headings, status announcements, non-color cues, and reduced motion are specified | P0 | Interaction/accessibility notes and keyboard model |
| ADM-QG-15 | Research records adopted principle, rejected treatment, and Saqeel-specific reason; no copying | P1 | Primary-source research ledger |
| ADM-QG-16 | Exact path-level component disposition and rollback/testing impact are supplied | P0 | Implementation manifest and component map |
| ADM-QG-17 | Every action maps UI → guard → data/RLS → transition → audit/side effect → negative result → test | P0 | Row-complete wiring map |
| ADM-QG-18 | Claude Code handoff is paste-ready but prominently `NOT EXECUTABLE` until sponsor approval, wiring audit, and explicit authorization | P0 | Handoff banner and blocked status |

## CD-004 additional gates

| Gate | Criterion | Severity |
|---|---|---:|
| CD004-QG-01 | The design does not infer engine health from counts or `engine_settings.updated_at` | P0 |
| CD004-QG-02 | A null/error count is not shown as zero and each source can fail independently | P0 |
| CD004-QG-03 | No approval age, overdue status, SLA, stale threshold, risk score, provider status, or runtime-consumption count is invented | P0 |
| CD004-QG-04 | Direct-route authorization mismatch is visible as `HANDOFF_BLOCKED` until reconciled | P0 |
| CD004-QG-05 | Admin-family role differences are visible without exposing or enabling unauthorized actions | P0 |
| CD004-QG-06 | The overview links to governed real routes only; no `/admin/notifications`, analytics, lookup, integration, or AI placeholder is added | P0 |
| CD004-QG-07 | Detailed module actions remain owned by later CDs; the home does not impersonate their lifecycle controls | P1 |
| CD004-QG-08 | `DSG-001` and `EV-DESIGN-001` evidence are complete for the screen, not inferred from suite-level proof | P1 |

## Required R1 return package

- route/object/lifecycle/backend-truth memo
- current-screen critique naming the three highest-cost decision failures
- primary-source research ledger
- three equal-fidelity decision-zone hypotheses
- hypothesis comparison and selected rationale
- selected full-page primary frame
- primary decision-zone close-up
- counterfactual frame without the signature interaction
- populated and all required hard-state frames
- Arabic RTL, English LTR, dark, light, desktop, and constrained-width evidence
- component inheritance/disposition ledger
- per-CD state matrix
- exact-path implementation manifest
- component map
- row-complete wiring map
- acceptance checklist
- paste-ready Claude Code handoff marked non-executable

## Mandatory review output

The independent review must return:

1. `P0`, `P1`, and `P2` findings with exact artifact/frame references.
2. A gate table for every `ADM-QG-*` and applicable `CD004-QG-*` row.
3. One consolidated correction prompt for all P0/P1 findings.
4. Status: `CORRECTION_REQUIRED` or `READY_FOR_SPONSOR_REVIEW`.

The reviewer never grants sponsor approval and never grants implementation authorization.
