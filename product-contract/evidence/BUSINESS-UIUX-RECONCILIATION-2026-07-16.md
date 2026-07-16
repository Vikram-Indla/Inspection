# Business UI/UX Reconciliation Package — Dashboard, Operations Center, Factory 360

Date: 2026-07-16
Task: TASK-G11-G12-RELEASE-001 (analysis only — stops before design/code)
Author role: Reconciliation (contract ↔ business direction)

## 0. Governing frame

The four supplied business files are **directional UI/UX inputs, not replacement requirements**:

| Input | Nature | Governs |
|---|---|---|
| `Factory_360_Specification.docx` v2.0 | Information architecture + business rules | Factory 360 (M07) |
| `Opearation Center.xlsx` | 3 capability specs | Operations Center (M08) |
| `dashboard.xlsx` (Strategic View / Ops view) | KPI catalogue + AI panels | Dashboard (sponsor DASH-001..016) |
| `saqeel (1).html` | Brand/IA shell reference | Shell / theme (DEC-011) |

Non-destruction guarantees applied throughout:
- No approved MVP1 requirement (M06/M07/M08/FND/INT/RBAC) is removed or weakened.
- No policy value, threshold, provider, cycle, SLA, risk weight or geography is invented. Where a business statement needs one and no governed source exists, the item is classed **PARTIALLY_COVERED (unavailable boundary)** or **CONFLICT_OR_AMBIGUITY (decision-blocked)** — never silently filled.
- A Phase-2 AI note defers only the AI sub-capability, never its deterministic parent.
- Existing business logic (compliance formula, operational-state model, RLS authority) is preserved unless a genuine functional gap is proven below.

Classification legend (per request): COVERED · COVERED_BUT_UI_UNSPECIFIED · PARTIALLY_COVERED · NEW_UI_RULE · GENUINE_FUNCTIONAL_GAP · CONFLICT_OR_AMBIGUITY · OUT_OF_MVP1.

Current staging anchors:
- Routes live: `/dashboard`, `/operations`, `/operations/live`, `/factories`, `/factories/[id]`.
- Nav source of truth: `apps/web/src/lib/shell-navigation.ts`.
- Prior closure: `product-contract/evidence/TASK-WEB-DASHBOARD-002-REQUIREMENT-MATRIX.md` (DASH-001..016, AC-0430..0448 all PASS or truthfully unavailable).
- Route catalogue: SCR-WEB-400 (Factory 360, M07/P12), SCR-WEB-500 (Operations Center, M08/P12), Dashboard = sponsor slice TASK-WEB-DASHBOARD-002.

---

## 1. Navigation direction reconciliation (approved)

Direction: Dashboard, Operations Center and Factory 360 are visible in primary navigation to **all authenticated non-admin business personas**; admin-only personas do not see them; menu visibility ≠ access; widget/record/geography/document/action permissions stay under RBAC; **direct-route authorization must match navigation authorization**.

### 1.1 Persona sets
- **Non-admin business personas** (should SEE the three menus): `planner`, `inspector`, `reviewer`, `ops`, `leadership`, `auditor`.
- **Admin-only personas** (should NOT see them): `compliance_admin`, `form_admin`, `workflow_admin`, `security_admin`, `gis_admin`, `risk_owner` (`ADMIN_ROLE_KEYS` in shell-navigation.ts).

### 1.2 Menu-visibility delta (menu permission dimension only)

| Nav item | Current `roles` in shell-navigation.ts | Target (direction) | Delta |
|---|---|---|---|
| Dashboard `/dashboard` | `ops, leadership` | all non-admin | **ADD** `planner, inspector, reviewer, auditor` |
| Operations Center `/operations` | `ops, leadership` | all non-admin | **ADD** `planner, inspector, reviewer, auditor` |
| Factory 360 `/factories` | `planner, inspector, reviewer, ops, leadership` | all non-admin | **ADD** `auditor` |

Classification: **NEW_UI_RULE (menu visibility)**. Pure visibility rule — no backend, no new requirement.

### 1.3 Direct-route authorization delta (action/route permission dimension)

| Route | Current guard | Required change | Class |
|---|---|---|---|
| `/dashboard` | `dashboard/page.tsx:100` allows only `ops|leadership`, else `redirect("/launch")` | Broaden guard to the non-admin set so nav and route agree | **NEW_UI_RULE** |
| `/operations` | No explicit role redirect found in `operations/page.tsx` (relies on RLS + shell) | Add/confirm an explicit non-admin route guard matching nav | **NEW_UI_RULE** |
| `/factories`, `/factories/[id]` | RLS-scoped, `notFound` when out of scope; no role redirect | Already matches broadened nav; keep | **COVERED** |

### 1.4 Preserved permission boundaries (do NOT weaken)
- **Data permission**: RLS remains the authorization boundary (FND-001). Broadening the menu/route only lets a persona *reach* the shell; row visibility, geography scope and masking still filter content. RBAC-013 (Leadership) explicitly permits masking sensitive Factory 360 detail — menu-visible, data-masked.
- **Widget permission**: KPI/widget-level gating (e.g. risk detail, contact info) stays RBAC-governed regardless of menu visibility.
- **Action permission**: Export, Create Inspection, Approve override, Mark handled remain action-permission gated (RBAC-008, Factory 360 permission matrix).

### 1.5 Open verification item (blocks flip-on)
- **CONFLICT_OR_AMBIGUITY**: role key `auditor` appears in REF-015 / personas but is **not present anywhere in `shell-navigation.ts` or route guards today**. The exact `role_key` string for the Auditor persona must be confirmed against `user_roles` before it is added, or Auditor silently gets nothing. Decision-blocked until the key is verified — do not guess.

---

## 2. Dashboard reconciliation (`dashboard.xlsx`)

Baseline: DASH-001..016 and AC-0430..0448 already implemented/verified (prior matrix). The new xlsx **names 11 Strategic KPIs + 8 Operational KPIs + 2 AI panels** — a more explicit KPI catalogue over the same governed data. Separation columns: BL=business logic, D=data, UI=composition, IX=interaction.

### 2.1 Strategic View KPIs

| # | Business KPI | Maps to | Class | Notes (BL / D / UI / IX) |
|---|---|---|---|---|
| S1 | Compliance rate trend | DASH-006/007/009, M08 compliance | **CONFLICT_OR_AMBIGUITY** | Source cell defines it as *non-compliant ÷ answered* but the "what it shows"/example use *compliant %*. Existing impl uses passed÷answered. **Preserve existing formula**; treat xlsx cell as a wording slip, not a logic change. UI: trend line new viz. |
| S2 | Risk distribution (count by Health Score band) | DASH national perf, M07-014 | **COVERED_BUT_UI_UNSPECIFIED** | D exists (risk_band). Bands = REF-006 *approved* thresholds — no new policy. UI: banded distribution chart. |
| S3 | Violation trend (per month × regulation × severity) | DASH-009 national movement | **COVERED_BUT_UI_UNSPECIFIED** | BL/D exist. UI: grouped trend. |
| S4 | Decision mix (Approve/Return/Reject %) | M06 review decisions, DASH-011 | **COVERED_BUT_UI_UNSPECIFIED** | D exists (Level-2 decisions). UI: % breakdown viz new. |
| S5 | License exposure (expired / expiring ≤30d) | — (new leg) | **PARTIALLY_COVERED** | Needs a governed **license expiry date** source on the factory/license record; "30 days" is a display window, not policy. If expiry field absent in staging → data gap. Verify `factories`/license source. |
| S6 | Cancellation rate | DASH-012 | **COVERED** | Cancelled ÷ planned; D exists. |
| S7 | Coverage (inspected ÷ due) | DASH-008 boundary | **PARTIALLY_COVERED (unavailable boundary)** | "Due" needs an **inspection-cycle/frequency policy** that is *not configured* (already a closed unavailable boundary in DASH-008). Decision-blocked; display "Not available". |
| S8 | Uninspected factories by stage/sector/region | DASH-008 boundary | **PARTIALLY_COVERED (unavailable boundary)** | "Overdue past cycle" inherits S7's undefined cycle. Zero-visit count *is* derivable; overdue leg is unavailable. |
| S9 | Checklist items per authority | Admin regulations config | **COVERED_BUT_UI_UNSPECIFIED** | D exists (regulation→issuing authority). UI: grouped count. |
| S10 | Risk-to-attention mismatch (visits/factory by band) | Existing visits + risk | **COVERED_BUT_UI_UNSPECIFIED** | Derived analytic; no new source. |
| S11 | Repeat violation rate (same item failed 2+/12mo) | checklist_responses history | **COVERED_BUT_UI_UNSPECIFIED** | Derived analytic over existing responses. |
| S12 | Strategic AI Summary (3–5 ranked NL findings) | — | **OUT_OF_MVP1 (Phase-2 AI sub-capability)** | Parent (the KPI panel) is COVERED. NL generation is deferred (consistent with prior removal of "Executive AI Brief"). Deterministic "biggest deltas" ranking may substitute, labelled non-AI. Advisory-only rule preserved. |

### 2.2 Operational View KPIs

| # | Business KPI | Maps to | Class | Notes |
|---|---|---|---|---|
| O1 | Visit pipeline (Draft/Published/Returned/Cancelled) | DASH-010/011 | **COVERED_BUT_UI_UNSPECIFIED** | UI: status-band counts. **CONFLICT check**: status labels must map to canonical `state_transitions.csv` states, not new statuses. |
| O2 | Expiring soon (published nearing execution deadline) | DASH-012, M08-005 | **COVERED_BUT_UI_UNSPECIFIED** | Execution-window/48h = configured window, not invented policy. |
| O3 | Active executions | DASH-011 | **COVERED** | Operational-state based (FND-002). |
| O4 | Pending approvals | DASH-011 | **COVERED** | Submitted w/o Level-2 decision. |
| O5 | Pending publish (draft config items) | Admin drafts | **CONFLICT_OR_AMBIGUITY (data permission)** | This is **admin-owned config data** surfaced on a business dashboard. Collides with "admin personas don't see business menus" and RLS. Must be **RBAC-gated widget** (visible only to the relevant admin role) or excluded for non-admin — do not expose admin drafts to planner/inspector/etc. |
| O6 | Today's schedule load per inspector | DASH-013, M08-011 | **COVERED (unavailable boundary)** | Per-inspector load exists; "realistically distributed" implies a **capacity threshold** that is not configured — relative load only. |
| O7 | GPS overrides today | DASH-012, M08-013 | **COVERED (unavailable boundary)** | Planned/observed + reason exist; inspector-confirmation field unavailable. |
| O8 | Live activity feed (latest N state changes) | M08-015 operational timeline | **COVERED** | Append-only audit events. |
| O9 | Operational AI Nudges (3–5 one-line + CTA) | M08-007 alerts + deep links | **COVERED (deterministic) + Phase-2 AI deferred** | Deterministic punch-list of time-critical alerts with pre-filled CTA = COVERED via existing alerts. NL phrasing/urgency ranking = deferred AI. Advisory-only, "CTA never executes" rule preserved. |

**Dashboard net**: mostly COVERED / UI-unspecified. Real deltas: S5 (license-expiry source), S7/S8 (inspection-cycle policy — decision-blocked), O5 (admin-data permission conflict), plus the two AI panels (deferred). No parent requirement changes.

---

## 3. Operations Center reconciliation (`Opearation Center.xlsx`)

Three capabilities vs M08-001..019 (AC-0430..0448 already PASS).

### 3.1 Live Operations Map

| Element | Maps to | Class | Separation notes |
|---|---|---|---|
| Live map of inspectors with active journeys | M08-002 (AC-0431), `/operations/live` | **COVERED** | Projected positions already labelled as projections. |
| Inspector Card (Inspector/Visit/Factory) | M08-004 | **COVERED** | Opens on marker select. |
| Elapsed time = now − operational-state start | M08 | **COVERED** | Preserves FND-002 (operational state ≠ workflow status). BL preserved. |
| "Arrived At" only after arrival; "Inspection Started At" only after start; License No. / Risk Level only when available | M08-002/006 | **NEW_UI_RULE (interaction/UI)** | Conditional-display contract over existing fields. No backend. |
| Open Visit Details → Inspection; Open Factory 360 | M08-008/009 | **COVERED** | Drilldowns exist (`/visits/:id`, `/factories/:id`). |
| Filter Region/City/Inspector/Visit Type/Operational State | M08-010 (boundary) | **COVERED (unavailable boundary)** | Region/city source-backed; no branch field. |
| No route calc in Phase 1 | — | **COVERED (constraint honored)** | Matches "no route calculation" — do not add navigation. |

### 3.2 Regional Performance Map (choropleth)

| Element | Maps to | Class | Notes |
|---|---|---|---|
| KSA regional choropleth by selected metric; drill region→factory→Factory 360 | related to DASH-007 (group-by-region), M08-010 | **NEW_UI_RULE + COVERED_BUT_UI_UNSPECIFIED** | Metric data exists (KPI engine); the **map composition and region→factory drill** is new UI, not a new requirement. Regional Compliance Rate formula matches existing passed÷answered — BL preserved. |
| Region colours by "configurable performance thresholds" | — | **CONFLICT_OR_AMBIGUITY (decision-blocked)** | Colour bands need **performance threshold policy values**. None governed → cannot invent. Ship greyscale/ranked or defer colour banding until thresholds are decided. |
| "Same metric consistent at national/regional/factory" | KPI engine | **COVERED** | Consistency rule, no new logic. |

### 3.3 Operational Highlights

| Element | Maps to | Class | Notes |
|---|---|---|---|
| Priority-sorted highlight panel, deep links, auto-refresh | M08-007 alert management | **COVERED (deterministic)** | Deterministic overdue/review/override/cancellation rows already PASS; grouping + priority order + deep link = interaction contract. |
| "Convert events to natural-language summaries" | — | **OUT_OF_MVP1 (Phase-2 AI)** | NL generation deferred. Explicit rule "no recommendations / no automatic decisions" is preserved and reinforces advisory-only. |

**Ops Center net**: Live map = COVERED + conditional-display UI rules. Regional map = new UI composition (safe) but **colour thresholds are decision-blocked**. Highlights = COVERED deterministic; NL layer deferred.

---

## 4. Factory 360 reconciliation (`Factory_360_Specification.docx` v2.0)

Baseline M07-001..020 (all MVP1 mandatory), route `/factories/[id]` already built with tabs: timeline · inspection history · documents · representatives · products · materials · workforce; reads risk score/band/version, employees + Saudization (M07-008), products (M07-006), materials (M07-007), documents (M07-016), violations (M07-012). BR-004 read-only module — **matches current read-only page**.

### 4.1 Structural IA (biggest divergence)

| Business IA | Maps to | Class | Notes |
|---|---|---|---|
| CR → multiple Industrial Licenses → one Plant, with **License Selector** and **CR Overview portfolio** | M07-003 (License), M07-004 (CR) | **PARTIALLY_COVERED (composition)** | Current page is **single-factory** centric; docx adds a **CR-with-license-selector** shell (select license → refresh all sections without leaving). This is a UI-composition reframe of existing fields, **not new domain logic**. Requires a factory↔license↔CR relation the staging read may not expose yet — verify data model before composing. |
| CR Overview portfolio summary (Total/Active/Expired/Suspended licenses, Highest Risk License, Total Approved Inspections, Total Open Violations, Total Active Penalties) | aggregation of M07 data | **COVERED_BUT_UI_UNSPECIFIED** | Counts only, over existing rows. BR-005/BR-006 forbid CR-level Risk Score/Compliance Rate — **honored**; do not compute them. |

### 4.2 Sections vs current tabs

| Business section | Maps to | Class | Notes |
|---|---|---|---|
| License Overview (No., Plant, Type, Stage, Status, Issue/Expiry, Risk, Compliance Rate) | M07-003/014/015 | **PARTIALLY_COVERED** | Risk present; License Type/Stage/Plant/expiry and factory-level **Compliance Rate** (latest approved inspection, formula given) not clearly surfaced on the page → verify fields; compliance-rate leg reuses existing formula. |
| Factory Profile (name, region, city, address, coordinates+map, sector, activity, contact, images) | M07-001/002/005 | **PARTIALLY_COVERED** | Identity + risk present; **map action** and **grouped image gallery** partial. Contact = permission-based (already masked for leadership — HANDOFF_BLOCKED_ROLE). |
| Factory Images grouped (Official / Profile / Inspection / Arrival / Violation evidence); DOC-002 never merge evidence into official gallery | M07-016 | **PARTIALLY_COVERED** | Documents are **metadata-only today** (HANDOFF_BLOCKED_DOCUMENT_VIEWER — no signed URL/viewer). Grouped gallery + non-merge rule = UI contract; viewer itself is a blocked capability. |
| Compliance (rate, risk trend, compliance trend, reports, violations, penalties); CR-001..008, formula | M07-011/012 | **PARTIALLY_COVERED** | Violations + history present; **compliance/risk trend charts** and **penalties** partial. Formula = existing passed÷answered; "Not Available when no approved inspection" preserved. Rule "visits never shown, only inspection reports" (BR-009) — honored. |
| Industrial Information — Products / **Machines** / Raw Materials / Employees / Production | M07-006/007/008/009 | Products/Materials/Workforce **COVERED**; **Machines = GENUINE_FUNCTIONAL_GAP or OUT_OF_MVP1**; Production = **PARTIALLY_COVERED** | **Machines** is not an M07 atomic requirement and no machine source is proven → new item; classify OUT_OF_MVP1 unless a Senaei machine feed is in integration scope (verify INT). Investment & Capacity (M07-009) partial. |
| Government Information (Land Provider, Chemical Permit, Customs Exemption, Approved Incentives, Approved Services); GI-001 pending excluded | — (no M07 atomic row) | **GENUINE_FUNCTIONAL_GAP (source-dependent)** | No "Government Information" section in staging and **no governed Senaei government feed** proven. This is the clearest net-new surface. Gate on INT (Senaei) availability; if unavailable → unavailable-boundary section, not invented data. GI rules (exclude pending, keep expired) are correct constraints. |
| Documents & Images grouped by category; DOC-001..005; upload not supported; download permission-based | M07-016 | **PARTIALLY_COVERED** | Grouping + friendly empty state = UI contract; DOC-003 "no upload from Factory 360" matches read-only; download viewer blocked today. |
| Timeline (business events only, BR-011) | M07-017 | **COVERED** | Case timeline present; unavailable legs already explicit (risk history, evidence timeline). |
| AI Risk Explanation (explains Risk Engine factors only, BR-010) | M07-014/015 AI notes | **OUT_OF_MVP1 (Phase-2 AI)** | Deterministic risk display = COVERED; the **explanation panel** is the deferred AI sub-capability. Traceability rule ("only Risk Engine variables") preserved for when it lands. |

### 4.3 Actions / permissions (Factory 360 permission matrix)

| Action | Permission | Class | Notes |
|---|---|---|---|
| View Factory 360 | View Factory 360 | **COVERED** | RLS/notFound scoping present. |
| View / Download Documents | View / Download Factory Documents | **PARTIALLY_COVERED** | Preview/download blocked (no viewer) — action-permission model fine, capability blocked. |
| View AI Explanation | View Risk Details | **OUT_OF_MVP1 (AI)** | Permission row valid; panel deferred. |
| Export PDF | Export Factory | **NEW_UI_RULE / GENUINE_FUNCTIONAL_GAP** | No PDF export on the factory page today. New action + action-permission; ship only with a governed export. |
| Create Inspection | Create Inspection | **COVERED (link)** | Planning entry already exists; deep-link with selected license = interaction contract. |

**Factory 360 net**: read-only spine COVERED. Real work is UI composition (CR/license-selector shell, grouped galleries, trend charts) plus three genuinely-new, source-gated surfaces: **Government Information** (Senaei feed), **Machines** (Senaei feed), **PDF export**. All AI explanation deferred.

---

## 5. Business-logic preservation ledger (do NOT change)

1. Compliance Rate = passed ÷ answered eligible items; latest **Approved** inspection only; "Not Available" when none (dashboard + Factory 360 identical) — S1 xlsx wording slip ignored.
2. Operational state is separate from workflow status (FND-002); elapsed time derives from operational-state start.
3. RLS is the authorization boundary (FND-001); menu/route visibility never grants data.
4. No CR-level Risk Score / Compliance Rate (BR-005/006).
5. Visits are never shown in Factory 360 / Compliance; inspection reports are (BR-009).
6. Returned/Rejected inspections stay visible for audit, excluded from compliance (CR-004/005).
7. Inspection evidence stays linked to its originating report; never merged into official gallery (DOC-002).
8. Pending government services excluded; expired approvals retained (GI-001/002).
9. AI is advisory-only, fully traceable, never mutates/reassigns/cancels (all three modules).
10. Canonical visit states only (state_transitions.csv) — pipeline labels map, not replace.

---

## 6. Genuine functional gaps (proven net-new, source-gated)

| Gap | Module | Blocker | Disposition |
|---|---|---|---|
| Factory 360 **Government Information** section | M07 | No governed Senaei government feed proven | Gate on INT; else unavailable-boundary section |
| Factory 360 **Machines** list | M07 | Not an atomic requirement + no machine source | OUT_OF_MVP1 unless Senaei machines feed confirmed in INT scope |
| Factory 360 **PDF export** | M07 | No export capability today | New action; ship only with governed export |
| **CR/License-selector** IA shell | M07 | Current page single-factory; CR↔license↔plant relation may not be exposed | Verify data model before composing |
| Factory-level **compliance/risk trend charts + penalties** | M07 | Data exists, viz absent | UI build (safe) |
| Dashboard **license-expiry** exposure (S5) | Dashboard | License expiry-date source unverified | Verify field |
| Document/image **viewer** (all grouped galleries) | M07 | HANDOFF_BLOCKED_DOCUMENT_VIEWER — no signed URL/viewer | Capability blocked |

## 6b. Decision-blocked (needs governance, do NOT invent)

| Item | Missing policy | Where |
|---|---|---|
| Coverage / Uninspected-overdue (S7/S8) | Inspection cycle / frequency + inspection-year boundary | Dashboard |
| Regional map colour bands | Regional performance threshold values | Ops Center 3.2 |
| Today's-load "balanced" (O6) | Inspector capacity threshold | Dashboard/Ops |
| Auditor menu enablement | Confirmed `auditor` role_key | Nav §1.5 |
| Pending-publish widget (O5) | Admin-data RBAC gating decision | Dashboard/Ops |

---

## 7. Minimum safe implementation delta from current staging

Ordered smallest-safe-first; **no code in this package** — this is the build boundary the next slice would take.

**A. Navigation (zero backend, highest value):**
1. In `shell-navigation.ts`, add `planner, inspector, reviewer, auditor` to Dashboard + Operations Center `roles`; add `auditor` to Factory 360 — **only after §1.5 auditor key is confirmed**.
2. Broaden `/dashboard` route guard (`dashboard/page.tsx:100`) and add/confirm `/operations` guard to the non-admin set, so route auth == nav auth. RLS/widget/action perms untouched.

**B. Pure-UI composition over existing governed data (no new source):**
3. Dashboard: render the already-mapped KPIs as the xlsx catalogue (S2/S3/S4/S9/S10/S11, O1/O2/O8) — recompose, do not re-source.
4. Ops Center: add conditional-display interaction rules to the Inspector Card (§3.1) and the deterministic Operational Highlights ordering (§3.3).
5. Factory 360: add compliance/risk **trend charts** and **penalties** panels from existing rows; grouped document/image **layout** (non-merge rule) even while the viewer stays blocked.

**C. Source-verify then build (gated):**
6. Confirm license expiry (S5), CR↔license relation (§4.1), machines/government Senaei feeds (INT) — build only what has a governed source; everything else renders an explicit unavailable-boundary state.

**D. Explicitly deferred (do NOT build in MVP1):**
7. Strategic AI Summary (S12), Operational AI Nudges NL layer (O9), Factory 360 AI Risk Explanation (§4.2) — Phase-2 AI sub-capabilities; deterministic parents stay.

**E. Decision-gated (do NOT build until governance answers §6b):**
8. Coverage/overdue cycle, regional colour thresholds, capacity thresholds, pending-publish RBAC, auditor key.

---

## 8. Stop line

This package reconciles direction ↔ contract, classifies every business item, separates the seven concern dimensions, preserves all approved logic, isolates the proven gaps and the decision-blocked items, and states the minimum safe delta. **No design and no code produced.** Next step requires human signoff on §6b decisions and the §1.5 auditor key before any slice opens.
