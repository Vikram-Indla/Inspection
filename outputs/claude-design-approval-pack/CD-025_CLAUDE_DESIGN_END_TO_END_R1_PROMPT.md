# Claude Design End-to-End Prompt — CD-025 R1

This is the complete prompt to paste directly into Claude Design.

Claude Design must generate the visual design and the complete handoff package. The handoff package must include a paste-ready Claude Code implementation prompt for the sponsor to use only after approving the design.

## Identity — mandatory

This task is **CD-025 / SCR-WEB-150 / P03 Plan Review & Publish**.

Create a dedicated design file named:

`CD-025 Plan Review and Publish.dc.html`

Do not place this work inside CD-021, CD-022, CD-023 or CD-024.

CD-024 is the upstream configuration-and-assignment design dependency. CD-025 is the final governed review and publish boundary. It must not silently absorb configuration editing or become a renamed CD-024 screen.

All frame names, exports, manifests, handoff files and annotations must use `CD-025` and `SCR-WEB-150`.

## Task boundary

This is design research, interaction design and high-fidelity design only.

Do not edit application code, migrations, database policies, tests, runtime data or product-contract files.

Do not implement, commit, push, merge, deploy, modify `main`, discard dirty work or claim implementation readiness.

`Design only` does not mean “omit the Claude Code prompt.” Generate the paste-ready implementation prompt as a handoff artefact, but label it clearly: `DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL`.

Produce one complete, code-aware design package for sponsor review. Preserve the established Saqeel family grammar and introduce no more than one page-specific signature pattern.

The planner's job is to prove that the proposed plan is complete, understand exactly what publication will create or change, resolve every blocker, and deliberately cross an irreversible operational boundary without partial success being disguised as completion.

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
9. `design/claude-design-mvp1/MANIFEST.yaml`
10. `design/claude-design-mvp1/CURRENT_UI_BASELINE.md`
11. `design/claude-design-mvp1/prompts/00_MASTER_DESIGN_CONSTITUTION.md`
12. `outputs/claude-design-approval-pack/DESIGN_QUALITY_RATCHET_V4.md`
13. `outputs/claude-design-approval-pack/CD-024_CLAUDE_DESIGN_END_TO_END_R2_PROMPT.md`
14. `design/claude-design-mvp1/prompts/journeys/P03_PUBLISH_AND_VISIT_MANAGEMENT.md`
15. `design/claude-design-mvp1/authority/CODE_ROUTE_RECONCILIATION.csv`
16. `design/claude-design-mvp1/authority/JOURNEY_SCREEN_MAP.csv`
17. `design/claude-design-mvp1/authority/SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md`
18. `design/claude-design-mvp1/acceptance/DESIGN_ACCEPTANCE_MATRIX.csv`
19. `design/claude-design-mvp1/acceptance/SCREEN_STATE_MATRIX.csv`
20. `product-contract/screens/screen_route_catalogue.csv`
21. `product-contract/business/master_end_to_end_process.md` — P03
22. `product-contract/domain/process_catalog.yaml` — Visit Planning
23. `product-contract/domain/state_transitions.csv` — `STM-PLAN-001`, `STM-PLAN-002`
24. `product-contract/domain/rbac_matrix.csv` — `RBAC-007`
25. `product-contract/domain/field_dictionary.csv` — Plan, Visit and Assignment
26. `product-contract/domain/atomic_scope.csv` — `MVP1-M01-009`, `010`, `030`, `031`
27. `product-contract/governance/error_catalogue.csv`
28. `FABLE_UNDERSTANDING_TRACEABILITY.csv`
29. `FABLE_ACCEPTANCE_UNDERSTANDING.csv`
30. `apps/web/src/components/Shell.tsx`
31. `apps/web/src/components/ShellClient.tsx`
32. `apps/web/src/lib/shell-navigation.ts`
33. `apps/web/src/app/astryx.css`
34. `apps/web/src/app/planning/bulk/review/page.tsx`
35. `apps/web/src/app/planning/bulk/review/ReviewClient.tsx`
36. `apps/web/src/app/planning/bulk/actions.ts`
37. `supabase/migrations/0026_cd021_bulk_publish_atomic.sql`
38. `apps/web/src/app/planning/single/Wizard.tsx`
39. `apps/web/src/app/planning/single/actions.ts`
40. `apps/web/src/app/planning/immediate/page.tsx`
41. `apps/web/src/app/planning/immediate/actions.ts`
42. `apps/web/src/app/planning/plans/[id]/page.tsx`
43. `apps/web/src/app/planning/plans/page.tsx`
44. `apps/web/src/app/visits/page.tsx`
45. `apps/web/src/app/visits/[id]/page.tsx`

Record the current branch, commit and dirty-worktree state. Preserve all unrelated work.

Do not design from screenshots, the old approval matrix row or a presumed route alone. Verify the runtime and repository files first.

## Governed contract

Process: `P03`.

Logical screen: `SCR-WEB-150`.

Contract route: `/planning/:id/review`.

Persona: Planner; Approver only if a planning-specific approval configuration is proven.

Engines: `ENG-03`, `ENG-05`, `ENG-11`, `ENG-12`.

Primary requirements:

- `MVP1-M01-009` Review Visit Plan
- `MVP1-M01-010` Publish Visit Plan
- `MVP1-M01-030` Review Visit Plan
- `MVP1-M01-031` Publish Visit Plan
- `MVP1-M01-006` Visit Configuration
- `MVP1-M01-007` Automatic Inspector Assignment
- `MVP1-M01-008` Manual Inspector Assignment
- `MVP1-M01-027` Visit Configuration
- `MVP1-M01-028` Automatic Inspector Assignment
- `MVP1-M01-029` Manual Inspector Assignment
- `MVP1-M02-012` Duplicate Visit Validation
- `MVP1-FND-001` RLS remains the authorization boundary
- `MVP1-FND-002` planning state and operational state remain distinct
- `MVP1-FND-003` append-only immutable audit
- `MVP1-FND-004` notification records do not prove provider delivery
- `MVP1-FND-011` status is never communicated by color alone
- `MVP1-FND-013` freshness and provider truth must not be invented

Acceptance IDs: `DSG-020`, `DSG-A11Y-001`, `DSG-CODE-001`.

Canonical transitions:

- `STM-PLAN-001`: Draft → Validated after mandatory fields and targets pass validation, with a validation result and audit.
- `STM-PLAN-002`: Validated → Published only when assignments are valid, the package is published and no blockers remain; create visits, notify, lock the version and audit publication.

Do not weaken the transition merely because the current runtime does not yet persist the full canonical lifecycle.

## ROUTE_LIFECYCLE_AND_OWNERSHIP_DECISION — mandatory first output

Begin the design file with a non-product annotation page named:

`ROUTE_LIFECYCLE_AND_OWNERSHIP_DECISION`

State these verified facts without smoothing over the conflict:

1. The product contract defines `SCR-WEB-150` at `/planning/:id/review`.
2. That route is not implemented.
3. `/planning/plans/:id` is a post-publication, read-only plan drill-down. It must not receive review-mode editing or publish controls.
4. The current bulk flow keeps its staged selection/configuration in client/session state and publishes directly from `/planning/bulk/review`.
5. The bulk plan and child visits do not exist before the publish RPC; the RPC creates and publishes them in one transaction.
6. The current single flow also publishes directly from its wizard. It creates a draft plan only after publish is submitted and can resume a partially completed write sequence.
7. There is therefore no route-addressable, persisted `Validated` plan that can truthfully supply `/planning/:id/review` before publication.
8. The route reconciliation row that maps CD-025 to `/planning/plans/:id` is stale and must not override observed runtime behavior.
9. Immediate planning creates a published Visit directly and intentionally creates no Visit Plan. It does not pass through CD-025.
10. A separate planning maker-checker/approver workflow is not proven by the current runtime. Package maker-checker behavior is not evidence of plan approval behavior.

Design a **route-neutral staged Plan Review & Publish workspace**.

Do not invent the final URL, persisted draft identifier, handoff mechanism or approval queue.

The implementation manifest must keep route, lifecycle and handoff ownership `HANDOFF_BLOCKED` until governance chooses and implementation proves one coherent model:

- persist Draft/Validated plan records before review and use a real plan ID; or
- retain an ephemeral staged review with an approved non-ID route and explicit recoverability semantics.

The design may show a human-readable temporary review reference only if it is clearly sample content and not represented as a persisted plan ID.

## Scope boundary by planning method

### Bulk plan — primary designed method

Use a populated bulk plan as the primary high-fidelity scenario because the current bulk publish RPC proves all-or-nothing writes for:

- plan creation;
- one visit per retained factory;
- one assignment per visit;
- plan and visit transition to `published`;
- assignment notification-row creation.

This transaction is real, but its validation inputs are not all rechecked inside the transaction. Do not turn write atomicity into a claim that every precondition is concurrency-safe.

### Single plan — required variant

Show how the same review grammar reduces to one factory, one visit and one assignment.

Do not claim atomic publication. The current single publish action uses sequential writes with a resumable plan ID. Plan, visit, assignment, status and notification can complete in separate steps.

The single-plan publish action remains `HANDOFF_BLOCKED` against the P03 atomic-publication contract until a transactional implementation and rollback evidence exist.

### Immediate visit — explicitly excluded

Do not force immediate visits through CD-025. The current immediate flow creates a direct published Visit with no Visit Plan by contract.

Mention this exclusion in the non-product handoff, not as unexplained user-facing copy.

## Correct runtime truth

### Proven bulk behavior

- `publishBulkPlan` performs server-side mandatory-field, duplicate, inspector-pool and manual-overlap checks before calling the RPC.
- `publish_bulk_plan` is a `SECURITY INVOKER` function, so caller RLS remains active.
- The RPC creates the plan, visits, assignments, publication-state updates and notification rows in one database transaction.
- Any error inside the RPC rolls the complete RPC transaction back.
- Automatic bulk assignment is deterministic round-robin over the inspector role pool. It is not AI, optimization, suitability ranking or a capacity engine.
- Manual assignments are honored when supplied.
- Successful bulk publish currently redirects to `/visits`.
- Audit triggers may record table mutations, but the design handoff must name and prove the exact publication audit evidence before claiming a dedicated business event.

### Proven single behavior

- The single wizard validates mandatory factory, licence/location, package, inspector, window and duplicate rules before starting writes.
- It queries overlapping active assignments and chooses a non-overlapping inspector for automatic assignment at that moment.
- It creates or resumes a draft plan, then creates the visit, assignment, publication status and notification row sequentially.
- A failed later step can leave earlier draft or published records present.
- Retry is designed around a resumable plan ID to reduce duplicate creation, but it is not an all-or-nothing transaction.
- Successful single publish currently redirects to `/visits/:visitId`.

### Notification truth

- A notification database row can be created as part of publication.
- A queued record is not proof of push delivery, receipt, opening or acknowledgement.
- Use `Notification queued` or `Assignment notification recorded` only where supported.
- Never use `Inspector notified`, `Delivered`, `Received` or `Acknowledged` without provider/runtime evidence.

### Validation truth and fail-closed requirement

Current bulk factory, package, inspector, duplicate and overlap reads do not consistently return structured error outcomes.

Current server validation happens before the atomic bulk RPC. The RPC does not authoritatively recheck:

- active duplicates;
- package status/effective date;
- visit-type validity;
- manual inspector overlap;
- automatic-assignment overlap;
- whether the automatic pool changed;
- stale factory/target data.

A failed query must never be rendered as a legitimate zero result or a ready state.

The design must distinguish:

- verified success with data;
- verified success with zero results;
- warning/unknown that does not block under an existing rule;
- source unavailable or validation failed;
- stale/concurrent change requiring revalidation;
- business blocker.

Any source required for publication that fails or becomes stale blocks publish, preserves the staged plan and provides a retry/revalidate path using safe neutral copy.

### Unavailable or unproven

Do not invent or imply:

- planning-specific maker-checker configuration;
- approver queue, approval SLA or delegation;
- persisted Draft or Validated plan before publish;
- validation version/concurrency token;
- authoritative in-transaction duplicate recheck;
- automatic schedule-overlap avoidance in bulk;
- skill, certification, territory or work-hours eligibility;
- travel-time or route feasibility;
- inspector capacity score or recommendation confidence;
- notification provider delivery;
- inspector acceptance;
- dedicated attempted/blocked-publication audit event;
- guaranteed return-to-edit route;
- exact publish duration;
- bulk size limit as a business policy;
- override permission, reason taxonomy or escalation path;
- support contact details;
- success receipt persistence or download;
- partial-publish cleanup policy.

Render unavailable facts as `Not evaluated`, `Unavailable` or a blocking dependency, whichever is truthful.

## Protected behavior

Preserve:

- RLS/RBAC as the authorization boundary;
- Planner ownership and organizational scope;
- append-only audit behavior;
- atomic all-or-nothing bulk RPC;
- single-flow resumable retry behavior until separately replaced;
- exact package code and version reference;
- factory identifiers and retained target scope;
- duplicate-visit protection;
- manual versus automatic assignment method;
- physical-only bulk execution behavior;
- neutral errors with no raw Supabase/provider text;
- all staged choices after validation or transaction failure;
- post-publish read-only plan drill-down;
- method-specific success destinations;
- dark and light themes;
- Arabic-first document-level RTL;
- frozen shared Saqeel shell.

Never place editing or publish controls on `/planning/plans/:id`.

Never show a partial single-flow step ledger as successful publication.

Never allow a double submit while publication is in progress.

## Current-screen critique — required before composition

Inspect the current bulk review, single wizard and post-publish plan detail. Name the three highest-cost decision failures with exact evidence.

At minimum assess:

1. configuration, assignment, validation and irreversible publication currently collapse into one screen/action;
2. the user cannot inspect a stable, explicit consequence model before committing;
3. the governed review route and persisted Validated lifecycle do not exist;
4. bulk atomic writes can still consume stale pre-transaction validation;
5. single publication is resumable but non-atomic;
6. post-publish plan detail cannot serve as a pre-publish workspace.

Do not award scores. Show evidence and the operational cost.

## Primary design job

Create a calm, evidence-led final review that answers five questions in one scan:

1. What plan am I about to publish?
2. Which factories, visits, packages and assignments are included?
3. What is verified, stale, unknown, warning or blocked?
4. What exactly will publication create, lock, queue and make operational?
5. Where can I correct a problem without losing completed work?

The page is a pre-flight decision surface, not a dashboard and not a generic confirmation modal.

## Single permitted signature pattern: Publish Consequence Ledger

The one new CD-025 signature interaction is the **Publish Consequence Ledger**.

It must connect each consequence to the object count, validation state and correction path.

Use four truthful groups:

1. **Will be created on successful commit**
   - one plan;
   - the exact number of retained child visits;
   - the exact number of assignments.
2. **Will be referenced or locked for those visits**
   - exact package code and version;
   - the configured visit window and type;
   - assignment method and per-visit assignee.
3. **Will be recorded or queued**
   - publication/audit effects only where proven;
   - assignment notification rows, explicitly not delivery.
4. **Will not happen at publication**
   - no inspection starts;
   - no inspector acceptance is proven;
   - no notification delivery is proven;
   - no target is silently dropped;
   - no partial bulk result is considered success.

For bulk, label the commit as all-or-nothing while separately disclosing that readiness checks are revalidated before submission but are not yet all transaction-safe.

For single, replace the atomic commitment label with a blocking truth state in the implementation handoff. Do not visually promise a guarantee the runtime lacks.

Every failed ledger row must link to the exact blocking section or object. Every correction link must carry accessible hidden context and preserve prior entries.

Include a counterfactual frame with the ledger removed and explain the measurable loss: hidden consequences, slower blocker location or increased irreversible-error risk.

Do not add another page-specific novelty pattern.

## Three equal-fidelity hypotheses

Create three equal-fidelity alternatives for the primary decision zone. Use the same real sample plan, same hard state, same typography and same component depth.

1. **Object-first dossier**
   - plan summary opens into targets, visits, package and assignment evidence;
   - the consequence ledger synthesizes those objects at the final action boundary.
2. **Blocker-first pre-flight**
   - readiness groups and linked blockers lead;
   - verified object sections remain directly inspectable and changeable.
3. **Consequence-first commit boundary**
   - the consequence ledger leads;
   - each consequence expands to its evidence and correction path.

These must differ in decision flow and primary information architecture, not only card order, color or spacing.

Compare them against:

- time to determine whether publication is safe;
- time to locate and correct one blocker;
- visibility of affected factories and visits;
- prevention of silent scope loss;
- separation of verified, stale, unknown and blocked facts;
- irreversible-action comprehension;
- Arabic/RTL integrity;
- keyboard burden;
- narrow-layout survival;
- implementation truth across bulk and single methods.

Select one direction with evidence. Do not self-award a score.

## Required primary scenario

Use a realistic populated bulk plan with mixed operational evidence, not a clean toy example.

The primary ready scenario must show:

- planning method;
- retained factory count;
- stable factory codes and names;
- visit type;
- physical execution mode as a fixed fact;
- exact package code and version;
- window start and end;
- assignment coverage and method;
- a compact per-visit/factory list with assignee;
- warnings separated from blockers;
- source/check status and truthful freshness where available;
- prospective notification-row count;
- consequence ledger;
- a clear return/change path for each editable section;
- one unambiguous final publish action;
- explicit all-or-nothing bulk outcome language;
- the destination after success without pretending a success page already exists.

Do not expose requirement IDs, engine IDs, migration numbers, RPC names or internal statuses in user-facing copy.

## Mandatory scope-integrity behavior

No selected factory may disappear between targeting, configuration and final review without explicit, named disclosure.

When duplicate factories are removed under an existing allowed rule:

- list every removed factory by name and stable code;
- explain the verified reason;
- recalculate plan, visit, assignment and notification counts;
- allow return to the relevant correction point;
- never preselect a destructive scope reduction without clear disclosure;
- never call the remaining plan ready if any retained target still has a blocker.

If the runtime cannot restore or edit scope from CD-025, mark that correction path `HANDOFF_BLOCKED`; do not invent a working link.

## Publish action and confirmation behavior

Do not use a generic modal that repeats the page.

The final action zone must remain in the reading and keyboard flow and must show:

- precise action label, for example `Publish plan and create 12 visits`;
- counts derived from the displayed retained scope;
- the exact package version;
- the all-or-nothing bulk consequence;
- notification queued, not delivered;
- a secondary return-to-edit action;
- why the action is disabled when blocked;
- what is being revalidated when publication begins.

Do not invent a typed confirmation phrase, password re-entry, checkbox attestation, two-person approval or countdown.

During publish:

- disable repeat submission;
- keep the plan context visible;
- announce progress without promising a duration;
- never optimistically display Published;
- only show completion after the authoritative result returns.

## Required designed states

Produce actual high-fidelity frames or high-fidelity state panels for each applicable state. A prose-only state inventory does not satisfy this task.

1. Initial validation/loading with known staged context retained
2. Populated bulk plan, genuinely ready
3. Populated plan with multiple blockers
4. Mandatory configuration missing
5. No published/locked package available
6. Selected package invalidated or no longer available
7. No inspectors in the role pool
8. Partial assignment coverage
9. Duplicate active visit on one or more targets
10. Explicit scope reduction after duplicate removal
11. Manual inspector overlap with exact known visit/window
12. Automatic bulk assignment with overlap explicitly not evaluated
13. Factory/target source failure that blocks safely
14. Package source/validation failure that blocks safely
15. Inspector source/validation failure that blocks safely
16. Duplicate/overlap query failure that blocks safely
17. Stale target, package or assignment data requiring revalidation
18. Concurrent change detected between review and submit
19. Approval required only if a real planning approval configuration is proven
20. Planner may publish directly when no approval configuration is proven
21. Unauthorized/not-in-scope direct access
22. Lost/expired ephemeral staged review
23. Publish in progress with double-submit prevented
24. Bulk transaction failure with nothing published and all staged choices preserved
25. Single-flow partial-step failure, clearly not called success
26. Bulk publication complete with plan/visit counts and truthful next destination
27. Read-only post-publish plan detail destination
28. Return-to-edit with focus landing on the requested section

If a state cannot be supported by the current route or runtime, design its truthful unavailable/recovery treatment and mark the wiring leg `HANDOFF_BLOCKED`.

## Success truth

Bulk success may say:

- the plan was published;
- the exact number of visits and assignments created;
- assignment notification records were queued;
- where the planner can view visits or the published plan.

Bulk success must not say:

- messages were delivered;
- inspectors accepted work;
- inspections started;
- all preconditions were rechecked inside the transaction;
- no concurrent change was possible unless a version guard is implemented.

Single success must not be presented as atomically committed under the current runtime.

Do not invent a downloadable receipt or persistent confirmation page.

## Failure truth

For a bulk RPC failure, use neutral language that says nothing was published and the staged review is preserved where the approved handoff model can actually preserve it.

For a single sequential-write failure, do not say nothing was created. State neutrally that publication did not complete, work is retained for safe retry, and Published is not confirmed.

Never expose raw provider, schema, SQL, policy, RPC or stack errors.

Never show a partially completed write sequence as green or complete.

## Authorization and approver behavior

Navigation visibility does not authorize publication.

Design a distinct unauthorized/not-in-scope state for direct access by a non-Planner or out-of-scope Planner.

RLS remains the data boundary, but the future route also requires an explicit role/scope guard and neutral denial treatment.

`Planner; Approver if configured` does not authorize invention of maker-checker.

Only design a separate approval-required user flow if repository evidence identifies:

- the configuration source;
- approver role and scope;
- submission transition;
- approval transition;
- self-approval guard;
- audit event;
- notification effect;
- negative path;
- destination and return behavior.

Otherwise keep planning approval `HANDOFF_BLOCKED` in annotations and show the direct Planner publication state supported by `RBAC-007`.

Do not copy the package-publishing maker-checker pattern into planning.

## Frozen shared shell and copy rules

Use the exact sponsor-accepted Shared Web/Operations shell V1:

- grouped desktop navigation;
- navigation search;
- Planning selected in the correct group;
- page-scoped top-bar controls only;
- theme, language, notifications and own-account controls;
- desktop collapse;
- mobile drawer with focus containment and Escape behavior;
- Arabic physical ordering;
- sponsor-approved magenta-violet Saqeel tokens.

Do not redesign the sidebar or top navigation.

If a frame excludes the shell for a close-up, label it `CONTENT_CROP` outside the product UI.

Keep these outside user-facing frames:

- `CD-025` and `SCR-WEB-150`;
- requirement, acceptance and engine IDs;
- `HANDOFF_BLOCKED`;
- route-governance notes;
- migration and RPC names;
- database/security implementation terms;
- internal audit-event keys.

Use plain operational copy. Never call the plan ready when a required source failed, a blocker remains or retained-scope counts disagree.

## Family inheritance and visual ambition

Inherit the strongest accepted Saqeel grammar from the shared shell and CD-024:

- typography and density;
- semantic tokens;
- focus ring and error grammar;
- status lozenges with text and non-color cues;
- evidence-led object rows;
- exact package-version treatment;
- blocker/warning/unknown separation;
- dark/light equivalence;
- Arabic-first RTL;
- accessible table/list behavior.

Do not duplicate CD-024's Assignment Evidence Ledger as a second novelty. CD-025 may summarize its verified result and link back to assignment correction.

The design must look unmistakably like an inspection publication boundary. If Saqeel branding and the title are removed, the object grammar must still reveal factories, plan, visits, assignments, package version, validation and operational consequences—not generic cards, CRM records or project tasks.

## Arabic, RTL, theme and responsive proof

- Arabic is the fresh-session default.
- Use full-document `lang="ar" dir="rtl"`.
- Use realistic long Arabic factory names, inspector names, blocker copy and action labels.
- Keep codes, UUIDs, factory IDs, package versions, dates and times directionally isolated with correct `bdi` treatment.
- Preserve correct physical ordering, not a cosmetic mirror.
- Show the same complete hard state in English dark, English light, Arabic RTL dark and Arabic RTL light evidence.
- Provide desktop, 1024px tablet and a fully operable 390–430px narrow frame.
- Do not simplify away targets, blockers, consequence ledger, change paths or final action in Arabic, light mode or narrow layout.
- No horizontal page overflow.
- Dense visit rows may become semantic stacked rows on narrow screens, but counts, identifiers, validation and correction actions must remain visible.
- Sticky actions must not cover content, focus targets or announcements.
- Touch targets and input sizing must follow the accepted Saqeel accessibility baseline.

Required narrow order:

1. plan context;
2. readiness and linked blockers;
3. retained targets/visits;
4. package and assignment evidence;
5. publish consequence ledger;
6. return/change paths;
7. final action.

## Accessibility and keyboard model

Use semantic headings, lists, description lists and tables. Do not create an ARIA grid unless the interaction genuinely requires composite keyboard navigation and the full model is specified and tested.

Define and visually prove:

- skip link and main landmark;
- logical heading hierarchy;
- keyboard traversal through summary, blockers, object rows, change links and final action;
- visible focus in dark and light themes;
- linked blocker summary that moves focus to the exact invalid section or row;
- accessible hidden text for repeated `Change` actions;
- focus return to the review heading or corrected section after returning from edit;
- focus placement on the error summary after failed submit;
- focus placement on the completion heading after confirmed success;
- focus restoration when a modal is not used;
- no hover-only, map-only, drag-only or color-only information;
- table headers and row relationships announced correctly;
- collapsed/expanded state announced if disclosure is used;
- publishing and revalidation status announced politely;
- blocker, stale-state and transaction failure announced assertively without duplicate speech;
- scope-count changes announced after removal/restoration;
- reduced-motion behavior that preserves object continuity without animated theatre;
- disabled-button explanation available to keyboard and screen-reader users.

Use `role="status"` for non-urgent validation/publishing progress and `role="alert"` or equivalent for actionable blocking failures. Do not put every state change in an assertive live region.

## Research provenance

Use exact primary sources. For each, record:

- observed principle;
- treatment adopted;
- treatment rejected;
- Saqeel-specific reason;
- exact frame/node where the principle appears.

Required sources:

1. GOV.UK Design System — Check answers:
   `https://design-system.service.gov.uk/patterns/check-answers/`
2. GOV.UK Design System — Confirmation pages:
   `https://design-system.service.gov.uk/patterns/confirmation-pages/`
3. GOV.UK Design System — Error summary:
   `https://design-system.service.gov.uk/components/error-summary/`
4. W3C WCAG 2.2 — Focus Order:
   `https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html`
5. W3C WCAG 2.2 — Status Messages:
   `https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html`
6. Saudi Digital Government Authority — Web accessibility guidance:
   `https://dga.gov.sa/en/digital-knowledge/web-accessibility-disabilities-and-elderly-people`
7. PostgreSQL documentation — Transaction Isolation:
   `https://www.postgresql.org/docs/current/transaction-iso.html`

Adopt principles, not external visual brands.

Explicitly reject:

- generic government-service styling copied into Saqeel;
- a green success panel that claims unproven delivery;
- a decorative deployment checklist disconnected from actual objects;
- a generic confirmation modal;
- optimistic publication;
- checkbox theatre;
- color-only readiness;
- a success receipt with invented next-step timing or support information.

Arabic-first is a binding Saqeel decision, not a conclusion borrowed from an external source.

## Required deliverables

Return one coherent package containing:

1. `CD-025 Plan Review and Publish.dc.html`
2. `ROUTE_LIFECYCLE_AND_OWNERSHIP_DECISION`
3. Current-screen critique with the three highest-cost failures
4. Contract-to-runtime truth matrix
5. Bulk/single/immediate method boundary matrix
6. Supported, unsupported and `HANDOFF_BLOCKED` data/action matrix
7. Research provenance ledger
8. Three equal-fidelity decision-zone hypotheses
9. Hypothesis comparison and evidence-based selection
10. Selected full high-fidelity bulk review page
11. Primary decision-zone close-up
12. Publish Consequence Ledger close-up
13. Counterfactual without the ledger
14. Compact single-plan variant showing the atomicity limitation
15. Actual visual hard-state contact sheet covering every required state
16. Full desktop dark frame
17. Full desktop light frame
18. Full Arabic RTL dark frame for the same hard state
19. Full Arabic RTL light evidence
20. Full 1024px tablet frame
21. Full 390–430px operable narrow frame for the same hard state
22. Linked error-summary and focused blocker frame
23. Publishing/double-submit-prevention frame
24. Neutral atomic bulk-failure frame with staged work preserved
25. Truthful single partial-step-failure frame
26. Completion and read-only destination frames
27. Keyboard, focus, live-region and reduced-motion specification
28. Family inheritance ledger and one-pattern novelty declaration
29. `IMPLEMENTATION_MANIFEST_CD-025.yaml`
30. `COMPONENT_MAP_CD-025.csv`
31. `WIRING_MAP_CD-025.csv`
32. `STATE_MATRIX_CD-025.csv`
33. `ACCEPTANCE_CHECKLIST_CD-025.md`
34. `RESEARCH_PROVENANCE_CD-025.md`
35. `CLAUDE_CODE_HANDOFF_CD-025.md`
36. `CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-025.md` — a complete paste-ready prompt for Claude Code, labelled `DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL`
37. PNG exports named consistently with `CD-025_SCR-WEB-150_*`

Every exported frame must have a stable node/frame identifier referenced by the checklist.

## Handoff rules

Every user action and system state must map through:

1. UI trigger;
2. client component;
3. route/server action;
4. validation guard;
5. canonical transition;
6. table/RPC/storage/provider;
7. RLS/grant/role/scope;
8. audit effect;
9. notification or provider effect;
10. success result;
11. negative, stale and partial-failure result;
12. retry/idempotency behavior;
13. automated test;
14. runtime evidence.

Missing legs are `HANDOFF_BLOCKED`.

Keep these specific legs blocked unless independently proven in the repository/runtime:

- final CD-025 route and ownership;
- persisted Draft/Validated plan lifecycle before review;
- CD-024 → CD-025 staged handoff and recovery;
- return-to-edit route with preserved focus/context;
- planning-specific approver configuration and maker-checker;
- fail-closed structured source/query errors;
- versioned/stale-state concurrency guard;
- authoritative in-transaction duplicate check;
- authoritative in-transaction package/effective-date/visit-type validation;
- concurrency-safe manual overlap validation;
- bulk automatic-overlap avoidance;
- single-plan atomic transaction and rollback;
- attempted/blocked-publication audit event;
- notification provider delivery;
- success receipt persistence;
- partial single-flow cleanup policy;
- route-level Planner/scope guard if not present.

The component/file map must distinguish:

- existing files that are evidence only;
- existing files that could be updated after approval;
- proposed new files whose names/routes remain blocked;
- read-only files that must be preserved.

Never list `apps/web/src/app/planning/plans/[id]/page.tsx` as an editable pre-publish review route. Its protected responsibility is post-publish read-only plan detail.

Do not guess a new Next.js route filename. Use a route-neutral proposed component name and mark its route target blocked.

The manifest must state `implementation_authorized: false`.

The generated `CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-025.md` must:

- implement only the sponsor-approved CD-025 design and vertical slice;
- require Claude Code to read the approved design file, manifest, component map, wiring map, state matrix and acceptance checklist before editing;
- preserve all protected behavior and the existing dirty worktree;
- prohibit commit, push, merge, deployment and modification of `main` unless separately authorized;
- require exact route, lifecycle, validation, RLS, audit, notification, negative-path, Arabic/RTL, theme, responsive and accessibility evidence;
- instruct Claude Code to stop rather than invent any unresolved policy or backend behavior;
- include the exact files and tests identified by the final selected design;
- remain a handoff artefact until the sponsor explicitly approves CD-025.

## Acceptance proof

The acceptance checklist must cite exact frame/node evidence for:

- `DSG-020` complete plan, child visits, blockers, notifications and atomic bulk publish;
- all contract-linked requirements discovered in FABLE ledgers;
- bulk/single truth distinction;
- route/lifecycle conflict disclosure;
- no partial success;
- all hard states;
- dark/light equivalence;
- Arabic-first RTL;
- desktop/tablet/narrow behavior;
- keyboard and screen-reader operation;
- focus transfer to blockers and completion;
- neutral raw-error protection;
- RLS/RBAC boundary;
- audit and notification truth;
- frozen shared shell;
- one-pattern novelty limit;
- exact implementation blockers.

Do not self-award numerical grades, `5/5`, approval or completion.

## Self-criticism loop — complete before return

Run and record evidence from these passes:

1. **Contract coverage:** every mapped requirement, role, transition, state and failure is represented.
2. **Runtime truth:** no route, object, atomicity, approver, audit, notification, freshness or recovery claim exceeds evidence.
3. **Decision superiority:** a planner can find the affected object and correction path faster than in the current combined publish screen.
4. **Hard-case integrity:** stale, failed-source, duplicate, overlap, unauthorized, partial single write and bulk transaction failure are first-class.
5. **Inspection specificity:** the structure remains recognizably factory/visit/assignment/package publication without Saqeel branding.
6. **Family continuity:** shell, tokens, density, typography, focus and status grammar are inherited.
7. **Arabic-first integrity:** the same difficult state works in realistic RTL and narrow layouts.
8. **Accessibility:** keyboard, focus, announcements, non-color cues and reduced motion are explicit.
9. **Implementation fit:** every action has a truthful wiring row and every missing leg is blocked.
10. **Novelty discipline:** the Publish Consequence Ledger is the only new signature pattern and materially reduces irreversible-error risk.

Revise the design internally when a pass finds a problem. Return evidence, not scores.

## Final status

Finish with exactly:

`READY_FOR_DESIGN_REVIEW_R1`

Never state approved, accepted, build-complete, vertically complete or implementation-ready.
