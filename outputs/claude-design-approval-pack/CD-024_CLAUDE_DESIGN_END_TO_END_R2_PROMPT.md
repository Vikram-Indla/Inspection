# Claude Design End-to-End Prompt — CD-024 R2

## Identity — mandatory

This task is **CD-024 / SCR-WEB-140 / P02 Visit Configuration & Assignment**.

It is not CD-021.

The earlier CD-024 frames were accidentally embedded as `4route` and `4a–4h` inside `CD-021 Bulk Targeting.dc.html`. Use those frames only as prior design input. Extract or duplicate them into a dedicated design file named:

`CD-024 Visit Configuration and Assignment.dc.html`

All new frame names, headings, exports, manifests and handoff paths must use `CD-024` and `SCR-WEB-140`.

CD-021 may be mentioned only as the upstream targeting/runtime dependency that currently supplies `/planning/bulk/review`, `loadBulkSelection`, `publishBulkPlan` and migration 0026. Never label this design task or its deliverables CD-021.

## Task boundary

This is design review and high-fidelity design only.

Do not edit application code, migrations, database policies, tests or runtime data.

Do not implement, commit, push, merge, deploy, modify `main`, discard dirty work or claim implementation readiness.

Preserve the selected candidate-first direction where it remains valid. Correct it progressively; do not restart with an unrelated design.

The planner must be able to configure an executable visit, understand exactly which assignment facts are verified, distinguish unknowns from blockers, resolve genuine conflicts and reach a truthful Ready to Publish state.

## Read first

Read, in order:

1. `AGENTS.md`
2. `product-contract/00_START_HERE.md`
3. `product-contract/CURRENT_STATE.md`
4. `product-contract/GATE_STATUS.md`
5. `product-contract/execution/CURRENT_SLICE.yaml`
6. `product-contract/execution/TASK_ROUTER.yaml`
7. `product-contract/governance/OPEN_DECISIONS.yaml`
8. `design/claude-design-mvp1/00_START_HERE.md`
9. `design/claude-design-mvp1/CURRENT_UI_BASELINE.md`
10. `design/claude-design-mvp1/prompts/00_MASTER_DESIGN_CONSTITUTION.md`
11. `outputs/claude-design-approval-pack/DESIGN_QUALITY_RATCHET_V4.md`
12. `outputs/claude-design-approval-pack/CD-024_DESIGN_REVIEW_R1.md`
13. `design/claude-design-mvp1/prompts/journeys/P02_VISIT_DESIGN_AND_ASSIGNMENT.md`
14. `design/claude-design-mvp1/authority/CODE_ROUTE_RECONCILIATION.csv`
15. `design/claude-design-mvp1/authority/SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md`
16. `product-contract/screens/screen_route_catalogue.csv`
17. `product-contract/business/master_end_to_end_process.md` — P02
18. `product-contract/domain/field_dictionary.csv` — Visit, Plan and Assignment
19. `product-contract/governance/error_catalogue.csv` — `ERR-ASG-001`, `ERR-PUB-001`, `ERR-AUTH-001`
20. `apps/web/src/components/Shell.tsx`
21. `apps/web/src/components/ShellClient.tsx`
22. `apps/web/src/lib/shell-navigation.ts`
23. `apps/web/src/app/planning/bulk/review/page.tsx`
24. `apps/web/src/app/planning/bulk/review/ReviewClient.tsx`
25. `apps/web/src/app/planning/bulk/actions.ts`
26. `supabase/migrations/0026_cd021_bulk_publish_atomic.sql`
27. `apps/web/src/app/planning/plans/[id]/page.tsx`

Record the current branch, commit and dirty-worktree state. Preserve all unrelated work.

## Requirements and acceptance

Process: `P02`.

Logical screen: `SCR-WEB-140`.

Requirements include:

- `MVP1-M01-006` Visit Configuration
- `MVP1-M01-007` Automatic Inspector Assignment
- `MVP1-M01-028` Automatic Inspector Assignment
- `MVP1-M01-029` Manual Inspector Assignment
- `MVP1-M02-012` Duplicate Visit Validation
- `MVP1-FND-001` RLS remains the authorization boundary
- `MVP1-FND-003` append-only immutable audit
- `MVP1-FND-011` status is never communicated by color alone
- `MVP1-FND-013` data freshness/truth must not be invented

Acceptance IDs: `DSG-019`, `DSG-A11Y-001`, `DSG-CODE-001`.

Engines: `ENG-02`, `ENG-03`, `ENG-05`, `ENG-06`, `ENG-11`, `ENG-12`.

## ROUTE_AND_OWNERSHIP_DECISION — mandatory first output

Begin the design file with `ROUTE_AND_OWNERSHIP_DECISION` outside the user-facing product frame.

State all four facts:

1. The product contract targets logical screen `SCR-WEB-140` at `/planning/:id/configure`.
2. That contract route is not implemented.
3. `/planning/plans/:id` is the read-only post-publish plan drill-down and must remain non-editing.
4. The implemented pre-publish P02 subset lives at `/planning/bulk/review` but is currently labelled `SCR-WEB-120`, which collides with the governed Single Visit Planning identity.

Design a route-neutral P02 draft configuration and assignment workspace.

Do not choose or invent the final route.

The route manifest remains `HANDOFF_BLOCKED` until governance resolves the `SCR-WEB-120/140` collision and route ownership.

## Correct runtime truth

### Verified now

- Package choices expose code and version label from published/locked package versions.
- Factory identity, risk band/score and active-duplicate status are available in the bulk selection flow.
- Inspector candidates currently come from users holding the `inspector` role.
- Manual assignment checks pool membership and queries overlapping active assignments in the server action before the RPC call.
- Automatic assignment is deterministic round-robin. It is not AI, optimization or a recommendation engine.
- Plan, visits, assignments, draft-to-published updates and notification records are written atomically by the `SECURITY INVOKER` RPC after the server-action checks finish.
- RLS remains authoritative.
- Raw Supabase/provider error text must never reach the UI.
- `/planning/plans/:id` is read-only.

### Important correction: overlap is not transaction-safe

Never state that manual overlap is rechecked inside the atomic RPC or inside the database transaction.

The current overlap query runs in `publishBulkPlan` before `publish_bulk_plan` is called.

The RPC does not recheck manual overlap and does not check automatic round-robin overlap.

A concurrent assignment can therefore appear between validation and assignment insert.

Use truthful language such as:

- “Checked immediately before publish; availability may change.”
- “Concurrency-safe enforcement is not currently available.”
- “Automatic assignment does not evaluate schedule overlap.”

Keep concurrency-safe overlap enforcement `HANDOFF_BLOCKED`.

### Important correction: query failures currently fail open or collapse into emptiness

Current factory, package, inspector, duplicate and overlap reads do not consistently propagate structured errors.

A failed duplicate or overlap query must never be presented as zero duplicates, zero conflicts or readiness.

The design and handoff must require structured per-source outcomes:

- success with data;
- legitimate zero results with cause;
- source unavailable/failure;
- retry/revalidation required.

A source failure blocks readiness using neutral copy and preserves every entered field and assignment choice.

Never expose raw provider/schema errors.

Fail-closed query-error handling remains `HANDOFF_BLOCKED` until independently implemented and verified.

### Unavailable, unproven or blocked

- Skill/certification match
- Work hours
- Absolute workload or capacity
- Territory ownership
- Current inspector location
- Proximity
- Travel time
- Automatic overlap avoidance
- Virtual eligibility and OTP/provider readiness
- Team/crew assignment
- Candidate recommendation scoring
- Assignment confidence scoring
- Reasoned override policy and permission
- Attempted/blocked-conflict audit event
- Outbound notification delivery
- Candidate availability version token
- Authoritative package status/effective-date and visit-type revalidation inside the RPC

Render unsupported facts as `Unavailable`, `Not evaluated` or an operational blocker.

Do not display scores, ranks, optimistic badges, recommendations or false freshness.

## Protected behavior

Preserve:

- RLS/RBAC and Planner-only ownership
- append-only audit behavior
- atomic all-or-nothing write transaction
- current sessionStorage targeting-selection handoff
- empty-selection return to targeting
- neutral failure copy
- all entered values and assignment picks after failure
- physical-only execution mode
- notification record as queued/prospective, never delivered
- read-only post-publish plan drill-down
- exact package version visibility
- duplicate visit protection
- automatic/manual method distinction
- dark and light themes
- Arabic-first document-level RTL
- frozen shared Saqeel shell

Do not place editing controls on `/planning/plans/:id`.

## Primary design job

Turn assignment from a name-only dropdown into an evidence-led planning decision without pretending Saqeel has an optimization engine.

The single permitted new signature interaction is the **Assignment Evidence Ledger**.

For the focused or selected candidate/method, separate:

1. `Verified now`
2. `Not evaluated`
3. `Blocks assignment`
4. `Checked again before publish`

Do not use a confidence score.

Do not say “Rechecked inside atomic publish.”

Include a counterfactual without the ledger and state the measurable decision loss.

## Three equal-fidelity hypotheses

Create three equal-fidelity primary decision-zone alternatives using the same data, typography, state and component depth:

1. **Constraint-first:** visit/package/window facts establish the rule context before candidates.
2. **Candidate-first:** semantic candidate comparison foregrounds verified evidence, unknowns and blockers.
3. **Schedule-context:** candidate rows include a compact known-assignment view explicitly labelled as not availability; the complete task remains operable through a table/list.

Do not present the alternatives as low-fidelity diagrams while the selected direction is high fidelity.

Compare them against:

- time to a safe decision;
- hidden assumptions;
- conflict prevention;
- evidence visibility;
- Arabic/RTL integrity;
- keyboard burden;
- narrow-layout survival;
- implementation truth.

Retain candidate-first only if it still wins.

## Frozen shell and production-copy rules

Use the exact sponsor-accepted shared shell:

- grouped desktop navigation;
- navigation search;
- Planning selected in the correct group;
- theme, language, notifications and own-account controls;
- desktop collapse;
- mobile drawer and focus behavior;
- Arabic physical ordering.

If a frame intentionally excludes the shell, label it `CONTENT_CROP` outside the product UI.

Do not invent simplified replacement navigation.

Never place developer/governance artefacts inside the planner-facing interface.

Move these outside the product frame into annotations and handoff records:

- `SCR-WEB-140`
- `HANDOFF_BLOCKED`
- requirement IDs
- engine IDs
- `P03`
- migration numbers
- RPC names
- `SECURITY INVOKER`
- internal truth-rule numbers

User copy must describe operational consequences in plain language.

Do not call factories “publishable” while another blocker remains. Prefer precise copy such as “10 without active duplicate visits.”

Do not recommend “Pick Inspector X” merely because no known overlap exists. Use neutral actions such as “Review Inspector X — no known overlap.”

## Required primary content

Show:

- planning method and targeting context;
- selected factories with stable identifiers;
- visit type;
- exact package code and version;
- visit window;
- notes;
- physical-only execution mode as a fixed fact, not a toggle;
- automatic round-robin versus manual assignment;
- candidate comparison using verified fields only;
- exact conflicting visit and window when a proven overlap exists;
- explicit duplicate-target scope decision;
- named removed factories and recalculated totals;
- restoration of removed factories;
- readiness separated into blockers, warnings, unknowns and prospective effects;
- future audit/notification effects labelled prospective until commit;
- queued notification truth without delivery claims;
- one clear publish action with blocking reason.

## Required designed states

Do not describe these only in prose. Produce actual visual frames or high-fidelity mini-frames for each:

1. Populated and genuinely ready to publish
2. Populated but blocked
3. No published package
4. No inspectors in the role pool
5. Legitimate zero candidates/results
6. Factory source failure
7. Package source failure
8. Inspector source failure
9. Duplicate/conflict query failure that blocks safely
10. Manual overlap conflict with exact visit/window
11. Automatic method with overlap not evaluated
12. Stale/concurrent change detected before publish
13. Invalid or tampered package/visit type
14. Submit in progress
15. Neutral transaction failure with all input preserved
16. Explicit scope reduction after-state
17. Restored factory after scope reduction
18. Unauthorized/not-in-scope direct-route state
19. Empty selection/direct URL state
20. Read-only published plan destination
21. Successful commit and next destination

The current design must not show a successful or ready state if any required check failed or is unavailable.

## Authorization design

Shell visibility is not the direct-route authorization control.

Design a distinct unauthorized/not-in-scope state for a non-Planner opening the route directly.

Add `apps/web/src/app/planning/bulk/review/page.tsx` to the future component/handoff map for an explicit Planner route guard while keeping RLS as the data boundary.

Do not collapse unauthorized, empty selection and source failure into the same screen.

## Arabic, RTL, themes and responsive proof

- Arabic is the fresh-session default.
- Use document-level `lang="ar" dir="rtl"`.
- Use realistic long Arabic factory and inspector names.
- Isolate UUIDs, codes and timestamps with correct `bdi` treatment.
- Use the same complete hard state in English dark, English light, Arabic RTL and narrow/mobile.
- Do not simplify away fields, blockers, unknowns, readiness or shell controls in Arabic or light mode.
- Export a dedicated light-theme PNG.
- Produce a full operable 390–430px frame.
- The narrow frame must include real inputs, candidate cards/list, ledger, scope decision, readiness and publish action.
- Do not submit a numbered outline that merely describes the intended mobile screen.
- Required narrow order: context → configuration → blockers/unknowns → candidate evidence → readiness → action.
- No horizontal overflow.
- Controls and touch targets must meet the accepted Saqeel accessibility sizing.

## Accessibility and keyboard model

Choose one coherent interaction model.

Preferred model: plain semantic HTML table/list.

- Native selects, buttons and links remain in the normal tab order.
- The ledger updates from row `focusin`, explicit selection or a “Review evidence” action.
- Do not call it a one-tab-stop roving table.

Alternative model: a true ARIA grid.

Choose this only if you specify and test:

- correct grid/row/gridcell semantics;
- managed focus entry and exit;
- arrow-key cell/row navigation;
- widget activation and restoration;
- Enter/F2/Escape behavior;
- screen-reader behavior;
- interaction with native selects.

Do not mix plain table semantics with composite-grid keyboard behavior.

Define and visually prove:

- initial focus entry;
- movement between configuration and candidate evidence;
- focus/selection distinction;
- error-summary focus after submit failure;
- linked navigation from summary to inline error;
- focus restoration after correction;
- polite loading, scope-change, submit and success status;
- assertive blocker, conflict and transaction-failure alert;
- non-color conflict and selection cues;
- reduced-motion behavior with no loss of context.

## Research provenance

Use exact primary sources and record observed principle, adoption, rejection and Saqeel-specific reason.

Use:

1. Microsoft Field Service schedule board/manual scheduling:
   `https://learn.microsoft.com/en-us/dynamics365/field-service/work-with-schedule-board`
2. Microsoft Field Service resource types:
   `https://learn.microsoft.com/en-us/dynamics365/field-service/scheduling-resource-types`
3. W3C APG grid:
   `https://www.w3.org/WAI/ARIA/apg/patterns/grid/`
4. W3C APG listbox:
   `https://www.w3.org/WAI/ARIA/apg/patterns/listbox/`
5. GOV.UK error summary:
   `https://design-system.service.gov.uk/components/error-summary/`
6. Saudi Digital Government Authority accessibility guidance:
   `https://dga.gov.sa/en/digital-knowledge/web-accessibility-disabilities-and-elderly-people`

Do not use the generic DGA homepage as evidence for Arabic-first behavior.

Arabic-first is already a binding Saqeel baseline decision.

Do not copy external visuals or introduce unsupported scheduling functions.

## Required corrected deliverables

Return:

1. Dedicated `CD-024 Visit Configuration and Assignment.dc.html`
2. `CD-024_R1_CORRECTION_LOG`
3. `ROUTE_AND_OWNERSHIP_DECISION`
4. Current-screen critique naming the three highest-cost decision failures
5. Corrected runtime truth and unsupported-data matrix
6. Research ledger with valid primary-source links
7. Three equal-fidelity decision-zone hypotheses and comparison
8. Selected full high-fidelity primary page
9. Primary decision-zone close-up
10. Counterfactual without the Assignment Evidence Ledger
11. Actual visual hard-state contact sheet
12. Full desktop dark frame
13. Full desktop light frame
14. Full Arabic RTL frame for the same hard state
15. Full 390–430px operable narrow frame for the same hard state
16. Focused linked-error-summary frame
17. Keyboard, focus, status/alert and reduced-motion specification
18. Family inheritance ledger and one-pattern novelty declaration
19. `IMPLEMENTATION_MANIFEST_CD-024.yaml`
20. `COMPONENT_MAP_CD-024.csv`
21. `WIRING_MAP_CD-024.csv`
22. `ACCEPTANCE_CHECKLIST_CD-024.md`
23. `RESEARCH_PROVENANCE_CD-024.md`
24. `CLAUDE_CODE_HANDOFF_CD-024.md`
25. Corrected PNG exports including light theme

## Handoff rules

The manifest and wiring map must keep these legs `HANDOFF_BLOCKED` unless the current repository independently proves them:

- route ownership and screen identity;
- fail-closed source/query-error handling;
- automatic overlap protection;
- concurrency-safe manual overlap enforcement;
- authoritative package/effective-date/visit-type validation;
- virtual mode and provider readiness;
- attempted/blocked assignment audit;
- notification delivery;
- stale availability/version token.

Every proposed action must map through:

1. UI trigger
2. client component
3. server action
4. validation guard
5. canonical transition
6. table/RPC/storage
7. RLS/role
8. audit effect
9. notification/provider effect
10. success result
11. negative/partial result
12. automated test
13. runtime evidence

Missing legs are `HANDOFF_BLOCKED`.

The acceptance checklist must reference exact frame/node evidence. Do not self-award completion or numerical scores.

Finish with:

`READY_FOR_DESIGN_REVIEW_R2`

Never state approved, accepted or implementation-ready.
