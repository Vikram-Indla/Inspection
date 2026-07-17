# Claude Design Journey Prompt — CD-042 Command Group Business Reconciliation

Dashboard · Operations Center · Factory 360

Paste `prompts/00_MASTER_DESIGN_CONSTITUTION.md` and `${INSPECTION_DOCS_ROOT}/05_UI_UX_AND_STORYBOARDS/outputs/claude-design-approval-pack/DESIGN_QUALITY_RATCHET_V4.md` before this prompt. Where they conflict, the V4 ratchet governs.

## Authority and outcome

Evolve the UX of the three **Command** destinations to absorb the approved business UI/UX direction, **without** rediscovering the product, changing behavior, or building anything the reconciliation marked deferred/decision-blocked. This is a design-only task. Fable implements only after the CD-042 acceptance rows are signed off.

Outcome: three coherent, source-truthful business surfaces whose menu and route reach every non-admin persona, whose data stays RBAC/RLS-filtered, and whose KPIs/panels recompose **existing governed data** — no invented policy, no fabricated integration.

Authoritative reconciliation input: `product-contract/evidence/BUSINESS-UIUX-RECONCILIATION-2026-07-16.md`. Every classification, preservation rule, gap and decision-block there is binding on this design.

## Mandatory read order

1. `AGENTS.md` / `CLAUDE.md`
2. `product-contract/00_START_HERE.md`, `CURRENT_STATE.md`, `GATE_STATUS.md`
3. `product-contract/evidence/BUSINESS-UIUX-RECONCILIATION-2026-07-16.md`
4. `product-contract/evidence/TASK-WEB-DASHBOARD-002-REQUIREMENT-MATRIX.md`
5. `product-contract/screens/screen_route_catalogue.csv` (SCR-WEB-400, SCR-WEB-500)
6. `product-contract/domain/rbac_matrix.csv`, `personas.yaml`, `state_transitions.csv`, `reference_data.csv`
7. `design/claude-design-mvp1/authority/SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md`, `DASHBOARD_BUSINESS_REQUIREMENT_CONTRACT_V1.md`
8. `FABLE_UNDERSTANDING_TRACEABILITY.csv`, `FABLE_ACCEPTANCE_UNDERSTANDING.csv`
9. Current source: `apps/web/src/lib/shell-navigation.ts`, `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/app/operations/page.tsx` (+ `OpsMap`, `OpsExport`), `apps/web/src/app/factories/page.tsx`, `apps/web/src/app/factories/[id]/page.tsx`
10. The CD-042 acceptance artefacts: `design/claude-design-mvp1/acceptance/CD042_ACCEPTANCE_ROWS.csv`

Report Git commit + dirty-worktree state. Never design from screenshots alone.

## Traceability

- Task: `TASK-DESIGN-CD042`
- Design prompt: `CD-042`
- Screens: `SCR-WEB-400` (Factory 360), `SCR-WEB-500` (Operations Center), `/dashboard` (sponsor destination)
- Processes: `P12` primary; `P03`, `P06A` referenced illustratively
- Engines: `ENG-04`, `ENG-06`, `ENG-09`, `ENG-11`, `ENG-12`
- Requirements: `MVP1-M07-001..020`, `MVP1-M08-001..019`, sponsor `DASH-001..016`, `RBAC-008`, `RBAC-013`, `FND-001` (RLS authority), `FND-002` (operational-state ≠ workflow status), `FND-011` (non-color status), `FND-012` (partial-service isolation)
- Acceptance: `AC-0430..AC-0448`, `DASH-AC-001..016`, `DSG-CMD-001..020`, `SPC-CMD-001..006`

## Non-negotiable preservation (from the reconciliation ledger §5)

1. Compliance Rate = passed ÷ answered eligible items; latest **Approved** inspection only; "Not Available" when none — identical on Dashboard and Factory 360.
2. Operational state is separate from workflow status; elapsed time derives from operational-state start.
3. RLS is the authorization boundary; menu/route visibility never grants data. Leadership masking (RBAC-013) stays.
4. No CR-level Risk Score / Compliance Rate (BR-005/006).
5. Factory 360 / Compliance show inspection reports, never visits (BR-009).
6. Returned/Rejected inspections stay visible, excluded from compliance (CR-004/005).
7. Inspection evidence stays linked to its report; never merged into the official gallery (DOC-002).
8. Pending government services excluded; expired approvals retained (GI-001/002).
9. AI is advisory-only, fully traceable, never mutates.
10. Only canonical visit states; pipeline labels map, never replace.

## Journey coverage and per-surface design scope

### A. Navigation reconciliation (all three)
- Design the **broadened primary-nav** state: Dashboard, Operations Center, Factory 360 visible to `planner, inspector, reviewer, ops, leadership, auditor`; **hidden for admin-only roles**.
- Design the truth that **menu ≠ access**: a persona reaching a surface with narrow data scope sees governed empty/masked/partial states, not errors.
- Do **not** enable the Auditor entry visually until §Stop-line SL-1 (role key) is resolved — show it as a gated placeholder in the spec.

### B. Dashboard (`/dashboard`)
- Recompose the Strategic + Operational KPI catalogue from `dashboard.xlsx` over **existing** data (reconciliation §2): S2/S3/S4/S9/S10/S11 and O1/O2/O8 are pure UI composition.
- Compliance-trend viz uses the **existing** passed÷answered formula (ignore the xlsx S1 wording slip).
- Render decision-blocked KPIs (Coverage S7, Uninspected-overdue S8, capacity-load O6) as explicit **"Not available — not configured"** states, never invented.
- Pending-publish (O5) is admin-owned data: design it as an **RBAC-gated widget** visible only to the owning admin role, or omit for non-admin — never leak admin drafts.
- AI Summary (S12) is deferred: design the panel slot as a deterministic "biggest movements" list **labelled non-AI**, or an empty deferred state.

### C. Operations Center (`SCR-WEB-500`)
- Live Operations Map + Inspector Card: design the **conditional-display interaction contract** — "Arrived At" only after arrival, "Inspection Started At" only after start, License No./Risk Level only when available (reconciliation §3.1). "Projected route" is not "Live GPS".
- Regional Performance Map: design the KSA choropleth + region→factory→Factory 360 drill as **new UI composition** over existing metrics. Colour banding needs threshold policy that does not exist → design a **greyscale/ranked** default and mark colour banding as decision-blocked (SL-2).
- Operational Highlights: design the deterministic priority-ordered panel with deep links (COVERED via M08-007). The natural-language layer is deferred — design deterministic phrasing, labelled non-AI.

### D. Factory 360 (`SCR-WEB-400`)
- Design the **CR → License-selector → single-plant** IA shell (docx §2/§6): selecting a license refreshes all sections without leaving the surface. Mark the CR↔license↔plant relation as source-verify (SL-3) before committing the shell.
- CR Overview portfolio = **counts only** (Total/Active/Expired/Suspended licenses, Highest Risk License, Total Approved Inspections, Total Open Violations, Total Active Penalties); **no** CR-level risk/compliance number.
- Add the missing panels over existing rows: License Overview fields, factory-level **Compliance Rate** (existing formula), **compliance/risk trend charts**, **penalties**, **grouped document/image galleries** (non-merge rule; viewer stays metadata-only / blocked).
- Government Information + Machines are **source-gated gaps** (SL-4/SL-5): design them as **unavailable-boundary sections** unless the Senaei feed is confirmed. GI rules (exclude pending, keep expired) apply when it lands.
- AI Risk Explanation (BR-010) is deferred: design the entry point + traceable placeholder, not a generated explanation.
- PDF export (Export Factory) is a new action (SL-6): design the action + its action-permission, gated on a governed export existing.

## Required states (where relevant, per surface)

Populated · loading · empty · **not-configured/unavailable-boundary** · validation · unauthorized · read-only · stale · degraded · partial-source-isolated · masked (leadership) · offline (n/a here) · deferred-AI placeholder.

## Stop-lines — status after schema/code verification 2026-07-16

Resolved against staging (`supabase/migrations`, `apps/web/src`). See `CD042_DECISION_SHEET.md`.

- **SL-1 — RESOLVED.** `role_key = 'auditor'` exists (`supabase/migrations/0001_foundation.sql:360`). Wire the Auditor nav entry normally; drop the gated placeholder.
- **SL-2 — OPEN (governance).** Regional-map colour thresholds ungoverned → greyscale/ranked default only; no colour banding. Awaits sponsor decision D1.
- **SL-3 — RESOLVED-NO (schema gap).** Schema is flat: `factories.cr_number` + `license_number` are plain columns; no `licenses` table, no one-CR→many-licenses relation (`0001_foundation.sql:126-138`). **Do NOT design the CR-Overview-portfolio / License-Selector multi-license shell** — it has no data. Design Factory 360 as single-factory (one CR + one license). Multi-license IA is blocked pending an approved schema change (D3).
- **SL-4 — RESOLVED-NO.** No governed government feed (`senaei` is only a provenance tag). Government Information renders as an unavailable-boundary section.
- **SL-5 — RESOLVED-NO.** No machines/equipment source (only `factory_products`, `factory_materials`). Machines renders as unavailable-boundary / OUT.
- **SL-6 — RESOLVED-NO.** No factory PDF export exists. Export is spec-only, gated on a build decision (D4); design the action + permission but mark unbuilt.
- **SL-7 — OPEN (governance).** No inspection-cycle / inspection-year policy → Coverage and Uninspected-overdue stay "Not available — not configured". Awaits sponsor decision D2.
- **SL-8 — RESOLVED-NO.** `factory_documents` is metadata-only, `storage_path` null, no signed-URL viewer. Grouped galleries are layout + metadata only.
- **SL-9 (new) — RESOLVED-partial.** Only `penalty_mappings` (violation-code → penalty ref/range) exists; no issued penalty records with status/effective/end dates. Factory 360 Penalties shows the mapped penalty reference for a violation only — no penalty lifecycle (status/dates). Design accordingly.

Design may proceed now: everything except the CR/selector shell (SL-3) is designable, with SL-2/SL-4/SL-5/SL-6/SL-7/SL-8/SL-9 surfaces rendered as explicit unavailable/not-configured/spec-only states. Only two sponsor decisions (D1, D2) and two build/schema decisions (D3, D4) remain — none block the design run.

## Saqeel language

Existing dark/light violet identity and typography. Calm operational density, strong hierarchy, precise status language, generous touch targets, minimal motion. Encode status with icon + shape + label + position, not colour alone (FND-011, GLOBAL COLOR LAW — ADS/Saqeel tokens only, no bare colours). Not a generic AI dashboard.

## Required response

1. Discovery + code inventory (three surfaces).
2. Journey/screen/state coverage vs CD-042 rows.
3. Component disposition table (preserve / refine / consolidate / replace / new design-only) — reuse Shell, OpsMap, shared map, KPI/stat components before inventing.
4. High-fidelity screens/states: EN + Arabic RTL, dark + light, desktop + narrow, per surface.
5. Interaction/transition annotations incl. the conditional-display contract and license-selector refresh.
6. Responsive, RTL, dark/light, accessibility decisions (keyboard, focus, status semantics, map list-equivalent).
7. Provider + unresolved-decision register mapping SL-1..SL-8 to affected frames.
8. P0/P1 acceptance evidence against `CD042_ACCEPTANCE_ROWS.csv` without numerical self-scoring.
9. Evidence assets at stable locations under `${INSPECTION_DOCS_ROOT}/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/cd-042-command/`.
10. `READY_FOR_DESIGN_REVIEW` — never self-approve.
