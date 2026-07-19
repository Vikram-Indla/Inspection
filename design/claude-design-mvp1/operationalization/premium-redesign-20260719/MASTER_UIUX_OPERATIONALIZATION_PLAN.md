# Inspection Platform — Premium UI/UX Operationalization Master Plan

**Plan ID:** `UIUX-OPS-20260719-001`  
**Status:** `PROPOSED — SOURCE-RECONCILED, NOT DESIGN-APPROVED`  
**Sponsor milestone:** transform the integrated MVP1/MVP2/MVP3 Inspection Platform from a functional 4/10 experience into a premium, Arabic-first, Saudi government inspection operating system without weakening accepted behaviour.

## 1. Objective

Create a complete, BRD-controlled UI/UX redesign programme that:

1. proves what is implemented across MVP1, MVP2 and MVP3;
2. captures and audits every implemented page and governed logical screen;
3. records at least 20 actionable findings per audited page and at least 200 non-duplicate platform UX findings overall;
4. baselines and receives sponsor approval for the shared design system and five representative screens;
5. redesigns all journeys through six modular Claude Design packages;
6. adds governed onboarding, persona learning, virtual inspection and ministerial decision support;
7. preserves every accepted requirement, workflow, permission, audit, offline, immutable-version and provider-truth rule;
8. produces an auditor-readable requirement → implementation → screenshot → finding → design → decision → implementation → test → evidence trail.

## 2. Source authority

Use sources in this order. Lower sources may clarify presentation but cannot override higher sources.

1. `Inspection_Project_Customer_Auditor_Baseline.xlsx` — 478 mandatory MVP1 rows.
2. Source BRDs, especially `MIM_Inspection_Strategic_BRD_Source.pdf`.
3. `Inspection_Platform_Strategic_Baseline_61_Sheets.xlsx` — strategic/persona/journey/map/AI/audit material.
4. Current `product-contract/**` controls, including MVP2 and MVP3 registers.
5. Current application source under `apps/web/src` and Supabase contracts.
6. Governed route, journey, state, RBAC, traceability and acceptance maps.
7. Existing screenshots and accepted design evidence.
8. External research as attributed inspiration only.

The canonical repository is `/Users/vikramindla/Developer/Inspection`. The retired `/Users/vikramindla/Documents/GitHub/Inspection` copy is never an execution authority.

## 3. Scope boundary

### Included

- All 59 implemented `page.tsx` route entries, reconciled to logical modes and governed screens.
- The 38 governed MVP1 logical screens and 14 P00–P12 journey branches.
- MVP2/MVP3 routes and modules outside the original 38-screen catalogue.
- Public entry/login, shell, top navigation, side panel, profile/account and support states.
- Admin control planes, planning, visit management, Factory 360, Operations, dashboard, field/iPad, virtual inspection, evidence, review, comparison, enforcement, cases, committee, reports, portal and AI/OCR surfaces.
- Physical and virtual execution modes. Other inspection/visit classifications remain source-controlled reference data and must not be invented.
- Every authorized persona, including external representatives and leadership.
- Sponsor-requested Minister experience mapped initially to the existing governed `Leadership` authorization boundary until change control approves a distinct role.
- Persona Academy/onboarding content, real-character media direction, walkthroughs and contextual help.

### Not included without separate authority

- New policy values, providers, thresholds, SLAs, retention rules, risk weights, legal mappings or production data.
- A new runtime Minister role, role impersonation or role switching.
- Claims of live GPS, production video or production AI where the adapter is not live.
- Workflow, RLS/RBAC, database, provider, release or design-approval changes during planning.
- Broad implementation before the five-screen visual direction and affected acceptance rows are approved.

## 4. Current truth and corrections

- The product has 59 implemented page routes; the previous 38-screen campaign is MVP1 logical coverage, not complete-system coverage.
- Existing capture manifests contain useful evidence but do not prove every page/state.
- Government Foundation V1 and the shared shell are implemented and technically evidenced.
- The full design-system baseline remains conditional because component families, responsive page composition and representative negative states are not fully approved.
- `DESIGN_AUTHORITY_STATUS.md` and older `CURRENT_UI_BASELINE.md` wording conflict with newer gate/foundation records and must be formally superseded or reconciled.
- Operations route movement is projected, not live GPS.
- Virtual OTP/state/audit exists; production video integration does not.
- Ministerial conversational AI is a sponsor requirement, but production output requires governed metrics, citations, authorization, an adapter and human-control rules.

## 5. Product storyline

The platform story is **Plan → Prepare → Inspect → Prove → Decide → Improve**.

1. **Plan:** administrators publish governed rules; planners choose targets, method, team and timing.
2. **Prepare:** inspector receives a trusted package, factory context, route, risk context, readiness and learning material.
3. **Inspect:** physical or virtual inspection guides the user through the valid next step, not a generic page collection.
4. **Prove:** evidence, location, identity, notes, findings, versions and sync state remain visible and defensible.
5. **Decide:** reviewers, committee, compliance and leadership see decision-grade context with lineage.
6. **Improve:** correction, reinspection, enforcement and analytics feed the next risk/planning cycle.

Every page must answer: **Where am I? Why am I here? What is the current state? What must I do next? What blocks me? What evidence exists? What happens after my action?**

## 6. Design-system baseline

### Preserve

- Light-first institutional authenticated interface with a neutral dark peer.
- IBM Plex Sans Arabic product typography and monospaced identifiers/telemetry.
- Semantic token governance, restrained radii/shadows, 44–48px desktop controls and 52px field controls.
- English/Arabic, true RTL, persistent theme, keyboard/focus, responsive drawer and existing frozen input geometry.
- Cinematic Atlas only as the expressive public/login exception.

### Premium composition layer to add

- A clear government masthead and global command strip.
- Stable role-scoped navigation grouped by user job, not implementation module.
- Visible persona name, governed role and jurisdiction/scope in the side/account area.
- Page decision header: job, lifecycle state, scope/freshness, blocker and one primary action.
- Synchronized map/list/detail composition.
- Context/evidence/audit/help panel using progressive disclosure.
- Consistent density, status, empty, error, stale, partial, offline and conflict patterns.
- Arabic-first writing and terminology that avoids heavy imported language such as “dossier” unless legally necessary.

### Design baseline exit

The chassis becomes `PASS` only when:

1. stale authority contradictions are reconciled;
2. shared component/state inventory is complete;
3. five representative screens are presented at equal fidelity;
4. EN/LTR light and AR/RTL dark are shown for all five;
5. field, map, review, virtual/provider, offline/conflict and unauthorized states are evidenced;
6. sponsor approves the visual direction explicitly.

## 7. Five-screen sponsor gate

1. **Onboarding and secure access:** real Inspector and Factory Representative, realistic Saudi industrial context, captioned short film/poster/transcript/material chapters; no autoplay audio or unlicensed media.
2. **Minister/Leadership Command:** source-backed national KPIs, Saudi map + ranked list, drilldown, freshness/lineage, conversational composer, preset questions, citation/uncertainty/human-control states; no invented metrics or role.
3. **Admin Control Plane:** decisions, publish blockers, versions, dependencies, maker-checker and audit—not generic CRUD cards.
4. **Inspector iPad Workspace:** inspection progress, active question, context/evidence, saved/queued/syncing/synced/failed/conflict and returned/locked truth.
5. **Virtual Inspection Room:** participant verification, readiness, governed next transition, evidence/checklist/notes and explicit provider-pending/fallback states.

Each screen requires baseline/proposal comparison, rationale, EN/AR, light/dark, responsive state, at least one negative state and source/route/acceptance mapping.

## 8. Execution phases

| Phase | Outcome | Exit gate |
|---|---|---|
| 0 — Control reset | One canonical scope, sources, IDs, paths and ownership | Sponsor scope reflected without dilution |
| 1 — Full inventory | 478 rows + MVP2/MVP3 + 59 routes + logical modes + personas + inspection types reconciled | No orphan route, capability or source |
| 2 — As-is evidence | Every safe distinct route/state captured; unsafe/provider states explicitly held | Screenshot manifest is complete or dispositioned |
| 3 — UX audit | 20+ page findings and 200+ deduplicated overall findings with severity/evidence | P0/P1 register accepted for design input |
| 4 — Design-system gate | Five approval screens and shared chassis | Explicit sponsor approval |
| 5 — Six design packages | Full journey redesign and code-ready specifications | Internal design audit passes |
| 6 — Controlled implementation | Approved vertical slices, smallest coherent journey first | Tests, negative paths, before/after evidence |
| 7 — Onboarding and learning | Persona Academy, visual guide and real-media production package | Journey accuracy and accessibility approved |
| 8 — Final audit | Functional, UX, Arabic, accessibility, security and evidence pack | Residual gaps closed or formally owned |

Phases 1–3 may run in parallel by non-overlapping route families. Phase 5 packages may run in parallel after the chassis contract is fixed. Implementation never races ahead of design signoff.

## 9. Screenshot and finding protocol

### Coverage layers

- **Layer A:** 38 governed MVP1 logical screens and required logical modes.
- **Layer B:** all 59 implemented page routes, including MVP2/MVP3 and platform utility surfaces.
- **Layer C:** consolidated modes, drawers, dialogs, tabs, map/list states and critical negative states not represented by unique URLs.

### Minimum evidence per distinct page family

- primary populated state;
- empty/loading/unauthorized or most important failure state;
- EN/LTR light and AR/RTL dark;
- primary desktop/iPad viewport and one constrained viewport;
- source commit, persona, state, locale, direction, theme, viewport, time, path and hash.

Use a dimension-covering set, not an uncontrolled Cartesian explosion. Additional variants are captured when risk, state or layout genuinely differs.

### Finding fields

`finding_id, route, screen_id, journey_id, persona, state, severity, category, observation, user_cost, evidence_path, BRD_or_requirement_source, recommendation, acceptance_test, design_package, status, decision_ref`

Only actionable UI/UX findings count. Duplicated global findings are logged once as a system finding and linked to every affected page. Page-specific counts distinguish local evidence from inherited system issues.

## 10. Six Claude Design packages

1. `CD-PREM-01` — foundation, navigation, top command strip, persona identity, context panel and shared states.
2. `CD-PREM-02` — onboarding, Persona Academy, real-character/video/material system and in-product help.
3. `CD-PREM-03` — Minister/Leadership command, dashboards, map/list drilldown and governed conversational AI.
4. `CD-PREM-04` — planning, visits, Factory 360 and Operations decision journey.
5. `CD-PREM-05` — inspector iPad, physical inspection, evidence, offline, submission, return and correction.
6. `CD-PREM-06` — virtual inspection, admin/review/compliance/committee and audit-grade decision surfaces.

Each package is independent after `CD-PREM-01` publishes a provisional chassis contract. Packages cannot change routes, roles, data, policy or provider truth. Conflicts are returned to the lead for reconciliation, not resolved through invention.

## 11. Onboarding and Persona Academy

The side panel includes a `Learn the platform` destination, not a security role switcher. It lists governed personas with human-readable names and job outcomes. Selecting a persona opens:

- a 20–45 second real-character chapter or approved poster fallback;
- “your day” storyline;
- what the persona can see and cannot do;
- the journey map and the next/previous handoff;
- short task demonstrations linked to live routes;
- downloadable visual material and transcript;
- progress, revisit and accessibility controls.

Initial persona set comes from the governed role/persona source: Compliance Admin, Form Admin, Workflow Admin, Risk Owner, GIS Admin, Security Admin, Planner, Operations, Inspector, Reviewer, Auditor, Leadership and Factory Representative. Strategic-source personas such as Committee, Investor, Risk Approver and Integration Admin are reconciled before inclusion.

## 12. Minister/Leadership AI rules

The composer supports questions such as inspection counts only when answers are generated from authorized governed metrics. Every response must show:

- interpreted question and active filters;
- answer time and freshness;
- metric definition and numerator/denominator where applicable;
- citations/drilldown to source records;
- access scope and partial/unavailable sources;
- uncertainty or “cannot answer” state;
- no automatic regulatory decision or prescriptive action;
- separate human follow-up/action with audit trail.

Until the provider and governed query layer are live, the design shows `AI briefing not enabled` and an adapter-ready specification—never fabricated answers.

## 13. Internal audit before design handoff

For every package verify:

1. all mapped BRD/requirement rows are preserved;
2. route and logical mode are real;
3. persona and permission are governed;
4. state transitions and immutable boundaries are unchanged;
5. data, provider, map, AI and video claims are truthful;
6. EN/AR, RTL, accessibility and responsive states exist;
7. negative, stale, offline, partial and recovery states are covered;
8. code-ready components/actions/data/audit annotations exist;
9. screenshots have stable provenance;
10. no design package self-approves.

Verdicts are `READY_FOR_SPONSOR_REVIEW`, `RETURNED_WITH_FINDINGS` or `BLOCKED_BY_NAMED_AUTHORITY`. “Looks good” is not an audit verdict.

## 14. Acceptance criteria for the programme milestone

- 100% of source scope has a disposition.
- 100% of 59 implemented route pages and 38 governed logical screens are mapped.
- Every safe route/state has screenshot evidence; every unsafe/unavailable state has an explicit hold.
- Every audited page has 20+ evidence-linked findings or a justified `NOT_APPLICABLE` disposition; the platform has at least 200 deduplicated UX findings.
- 50 additional improvement recommendations are screened and dispositioned.
- Five approval screens receive explicit sponsor direction.
- Six Claude Design packages pass the internal design audit.
- Onboarding, virtual inspection and Minister/Leadership are neither omitted nor misrepresented.
- Every later implementation change links requirement, design, code, test and evidence.
- No provider, policy, role, metric or completion claim is invented.

## 15. Immediate next actions

1. Complete the 59-route master reconciliation and mark the 21 routes outside the old 38-screen catalogue.
2. Reconcile design-authority contradictions through controlled governance.
3. Complete the shared component/state inventory.
4. Audit the 66 existing captures and capture only missing safe deltas.
5. Populate the page findings ledger, prioritizing shell/navigation, Inspector, Operations/Factory 360, dashboard and virtual inspection.
6. Run `CD-PREM-01..03` first to produce the five-screen gate; packages 04–06 may prepare evidence but cannot finalize page designs until the chassis direction is accepted.
7. Present the five-screen gate to the sponsor, then release all six packages for full design execution.

