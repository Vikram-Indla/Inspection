# Claude Design End-to-End Prompt — CD-025 R2 — Fresh Account / Zero Memory

Paste this entire prompt into a brand-new Claude Design session.

## Zero-memory instruction

Assume you have no memory of any previous Saqeel conversation, design session, correction request or Claude account.

You have repository access. Everything needed to understand the task is either stated in this prompt or available at the repository paths listed below.

Do not ask the sponsor to provide an earlier prompt. Do not depend on chat history. Do not assume an earlier Claude Design project is available.

The repository may contain an R1 CD-025 package. Treat it as prior design evidence only. Its visual direction has useful parts, but its handoff files contain stale runtime claims. This prompt and the current repository/runtime evidence govern the new R2 output.

## Pipeline — mandatory

The delivery pipeline is:

1. This prompt instructs Claude Design.
2. Claude Design produces the complete CD-025 design and synchronized handoff package.
3. The sponsor and Codex review the design.
4. Only after explicit sponsor design approval may the sponsor paste Claude Design's generated Claude Code implementation prompt into Claude Code.
5. Claude Code may then implement the approved vertical slice, followed by an independent wiring audit.

You are performing step 2 only.

You are **Claude Design**, not Claude Code. Do not implement the application.

## Identity — mandatory

This task is:

- Design ID: `CD-025`
- Logical screen: `SCR-WEB-150`
- Process: `P03`
- Name: `Plan Review & Publish`
- Primary persona: Planner
- Acceptance: `DSG-020`, `DSG-A11Y-001`, `DSG-CODE-001`

Create a dedicated design file named:

`CD-025 Plan Review and Publish.dc.html`

All frames, exports, manifests, maps, checklists and handoff files must say `CD-025 / SCR-WEB-150`. Never identify this work as CD-021, CD-022, CD-023 or CD-024.

CD-024 is the upstream configuration-and-assignment design dependency. CD-025 is the final governed review and irreversible publication boundary. Do not merge the two screens and do not turn CD-025 into another configuration form.

## Task boundary

This is design research, interaction design, high-fidelity UI design and code-aware handoff generation only.

Do not edit:

- application code;
- migrations or database policies;
- tests;
- live data;
- product-contract files;
- Git history.

Do not implement, commit, push, merge, deploy, modify `main`, clean or discard the dirty worktree, or claim implementation readiness.

Generate a complete paste-ready Claude Code prompt as a handoff artefact, but label it exactly:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL`

The implementation prompt is a future handoff, not authorization to implement now.

## Quality objective

Produce a premium, inspection-specific decision surface—not a generic dashboard, CRUD form, card collection or confirmation modal.

The planner must be able to:

1. prove the plan is complete;
2. identify every included factory and proposed visit;
3. distinguish verified facts, warnings, unavailable evidence and blockers;
4. understand exactly what publication will create, reference, record and not do;
5. correct a problem without losing completed work;
6. cross the irreversible publish boundary deliberately;
7. receive a truthful authoritative result with no partial success disguised as completion.

Preserve the accepted Saqeel family grammar. Introduce only one page-specific signature pattern.

## Repository authority — read in this order

Read every item in this list before designing. If a path has moved, locate the current equivalent and record the substitution.

### Project and execution authority

1. `AGENTS.md`
2. `product-contract/00_START_HERE.md`
3. `product-contract/CURRENT_STATE.md`
4. `product-contract/GATE_STATUS.md`
5. `product-contract/execution/CURRENT_SLICE.yaml`
6. `product-contract/execution/TASK_ROUTER.yaml`
7. `product-contract/execution/WORK_QUEUE.yaml`
8. `product-contract/governance/OPEN_DECISIONS.yaml`
9. `product-contract/governance/decision_register.csv`
10. `product-contract/governance/HUMAN_APPROVALS.yaml`
11. `product-contract/sessions/LAST_SESSION.md`

### Design authority and accepted family grammar

12. `design/claude-design-mvp1/00_START_HERE.md`
13. `design/claude-design-mvp1/MANIFEST.yaml`
14. `design/claude-design-mvp1/CURRENT_UI_BASELINE.md`
15. `design/claude-design-mvp1/prompts/00_MASTER_DESIGN_CONSTITUTION.md`
16. `design/claude-design-mvp1/prompts/journeys/P03_PUBLISH_AND_VISIT_MANAGEMENT.md`
17. `design/claude-design-mvp1/authority/CODE_ROUTE_RECONCILIATION.csv`
18. `design/claude-design-mvp1/authority/JOURNEY_SCREEN_MAP.csv`
19. `design/claude-design-mvp1/authority/SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md`
20. `design/claude-design-mvp1/acceptance/DESIGN_ACCEPTANCE_MATRIX.csv`
21. `design/claude-design-mvp1/acceptance/SCREEN_STATE_MATRIX.csv`
22. `outputs/claude-design-approval-pack/DESIGN_QUALITY_RATCHET_V4.md`
23. `outputs/claude-design-approval-pack/CD-024_CLAUDE_DESIGN_END_TO_END_R2_PROMPT.md`
24. `outputs/claude-design-approval-pack/CD-025_DESIGN_REVIEW_R1.md`
25. `outputs/claude-design-approval-pack/CD-025_PROGRESSIVE_CORRECTION_PROMPT_R1.md`

### Product contract

26. `product-contract/screens/screen_route_catalogue.csv`
27. `product-contract/business/master_end_to_end_process.md` — process P03
28. `product-contract/domain/process_catalog.yaml` — Visit Planning
29. `product-contract/domain/state_transitions.csv` — `STM-PLAN-001`, `STM-PLAN-002`
30. `product-contract/domain/rbac_matrix.csv` — `RBAC-007`
31. `product-contract/domain/field_dictionary.csv` — Plan, Visit and Assignment
32. `product-contract/domain/atomic_scope.csv` — `MVP1-M01-009`, `MVP1-M01-010`, `MVP1-M01-030`, `MVP1-M01-031`
33. `product-contract/governance/error_catalogue.csv`
34. `product-contract/evidence/AC_LEDGER.csv`
35. `FABLE_UNDERSTANDING_TRACEABILITY.csv`
36. `FABLE_ACCEPTANCE_UNDERSTANDING.csv`

### Current shell implementation — exact design baseline

37. `apps/web/src/components/Shell.tsx`
38. `apps/web/src/components/ShellClient.tsx`
39. `apps/web/src/components/ThemeToggle.tsx`
40. `apps/web/src/components/NotificationBell.tsx`
41. `apps/web/src/lib/shell-navigation.ts`
42. `apps/web/src/app/tokens.css`
43. `apps/web/src/app/astryx.css`

### Current planning and destination implementation

44. `apps/web/src/app/planning/page.tsx`
45. `apps/web/src/app/planning/bulk/page.tsx`
46. `apps/web/src/app/planning/bulk/actions.ts`
47. `apps/web/src/app/planning/bulk/review/page.tsx`
48. `apps/web/src/app/planning/bulk/review/ReviewClient.tsx`
49. `apps/web/src/app/planning/single/page.tsx`
50. `apps/web/src/app/planning/single/Wizard.tsx`
51. `apps/web/src/app/planning/single/actions.ts`
52. `apps/web/src/app/planning/immediate/page.tsx`
53. `apps/web/src/app/planning/immediate/actions.ts`
54. `apps/web/src/app/planning/plans/page.tsx`
55. `apps/web/src/app/planning/plans/[id]/page.tsx`
56. `apps/web/src/app/visits/page.tsx`
57. `apps/web/src/app/visits/[id]/page.tsx`

### Authoritative migrations and verified wiring

58. `supabase/migrations/0026_cd021_bulk_publish_atomic.sql` — historical predecessor only
59. `supabase/migrations/0031_cd023_assignment_overlap_guard.sql`
60. `supabase/migrations/20260714091726_plan_validated_state.sql`
61. `supabase/migrations/20260714091727_planning_publish_guards.sql`
62. `outputs/cd-021/IMPLEMENTATION_MANIFEST_CD-021.yaml`
63. `outputs/cd-021/WIRING_MAP_CD-021.csv`
64. `outputs/cd-022/IMPLEMENTATION_MANIFEST_CD-022.yaml`
65. `outputs/cd-022/WIRING_MAP_CD-022.csv`
66. `product-contract/evidence/TASK-BASELINE-WIRING-AUDIT-001.md`
67. `product-contract/evidence/screens/cd-021-bulk-v1/CODEX_AUDIT_CD-021.md`
68. `apps/web/e2e/cd-021-bulk-targeting.spec.ts`
69. `apps/web/e2e/cd-022-identity-lens.spec.ts`
70. `apps/web/e2e/golden-journey.spec.ts`

### Prior CD-025 evidence — use carefully

71. `outputs/cd-025/CD-025 Plan Review and Publish.dc.html`
72. `outputs/cd-025/IMPLEMENTATION_MANIFEST_CD-025.yaml`
73. `outputs/cd-025/COMPONENT_MAP_CD-025.csv`
74. `outputs/cd-025/WIRING_MAP_CD-025.csv`
75. `outputs/cd-025/STATE_MATRIX_CD-025.csv`
76. `outputs/cd-025/ACCEPTANCE_CHECKLIST_CD-025.md`
77. `outputs/cd-025/RESEARCH_PROVENANCE_CD-025.md`
78. `outputs/cd-025/CLAUDE_CODE_HANDOFF_CD-025.md`

The prior CD-025 handoff is not authoritative where it conflicts with current code, migrations, verified evidence or this prompt. In particular, do not copy its migration-0026-only, round-robin, pre-RPC-only or sequential-single-write claims.

Record the exact current branch, commit and dirty-worktree state. Preserve unrelated and concurrent work.

At the creation of this prompt, the verified baseline was `main @ 9360fc9`; migrations `20260714091726` and `20260714091727` were live; the complete Playwright suite was `99/99` with zero failures and zero skips. Re-verify from the repository because current evidence always wins over this snapshot.

## Governed contract

Process: `P03`.

Logical screen: `SCR-WEB-150`.

Contract route: `/planning/:id/review`.

Persona: Planner. An Approver exists only if a planning-specific approval configuration is proven; none is currently proven.

Engines: `ENG-03`, `ENG-05`, `ENG-11`, `ENG-12`.

Primary requirements:

- `MVP1-M01-006` Visit Configuration
- `MVP1-M01-007` Automatic Inspector Assignment
- `MVP1-M01-008` Manual Inspector Assignment
- `MVP1-M01-009` Review Visit Plan
- `MVP1-M01-010` Publish Visit Plan
- `MVP1-M01-027` Visit Configuration
- `MVP1-M01-028` Automatic Inspector Assignment
- `MVP1-M01-029` Manual Inspector Assignment
- `MVP1-M01-030` Review Visit Plan
- `MVP1-M01-031` Publish Visit Plan
- `MVP1-M02-012` Duplicate Visit Validation
- `MVP1-FND-001` RLS remains the authorization boundary
- `MVP1-FND-002` planning state and operational state remain distinct
- `MVP1-FND-003` append-only immutable audit
- `MVP1-FND-004` notification records do not prove provider delivery
- `MVP1-FND-011` status is never communicated by color alone
- `MVP1-FND-013` freshness/provider truth must not be invented

Canonical transitions:

- `STM-PLAN-001`: Draft → Validated after mandatory fields, targets and validation pass.
- `STM-PLAN-002`: Validated → Published only when assignments are valid, the package is published and no blocker remains; create visits, queue assignment notification records, lock/reference the exact version and audit the mutations.

## Mandatory first output: ROUTE_LIFECYCLE_AND_OWNERSHIP_DECISION

Begin the design file with a non-product annotation page named exactly:

`ROUTE_LIFECYCLE_AND_OWNERSHIP_DECISION`

State these current facts without smoothing over the conflict:

1. The product contract defines `SCR-WEB-150` at `/planning/:id/review`.
2. That route is not implemented.
3. `/planning/plans/:id` is a post-publication read-only plan drill-down. It must never receive pre-publish editing or publish controls.
4. `/planning/bulk/review` is currently a CD-021/P02 configuration, assignment and direct-publish route using client/session-held staged selection.
5. The bulk plan and child visits do not exist before publish. `publish_bulk_plan` creates the plan, visits, assignments, transitions and queued notification rows atomically.
6. The current single flow publishes directly from its wizard. `publish_single_visit` now performs the guarded plan/visit/assignment/transitions/notification write atomically; its resume ID is restricted to an owned empty legacy draft and is not evidence of a current partial-write workflow.
7. Neither method currently provides a route-addressable persisted Validated plan before publication.
8. Therefore `/planning/:id/review` cannot be mounted truthfully without a governed lifecycle/handoff decision.
9. The reconciliation row that maps CD-025 to `/planning/plans/:id` is stale and cannot override observed runtime responsibility.
10. Immediate planning creates a direct published Visit with no Visit Plan and does not pass through CD-025.
11. No planning-specific maker-checker/approver configuration is proven. Package approval behavior is not evidence of plan approval behavior.
12. CD-024→CD-025 staged ownership, return-to-edit context and recoverability remain unresolved.

Design a route-neutral staged Plan Review & Publish workspace.

Do not invent:

- the final URL;
- a persisted pre-publish plan ID;
- a handoff storage mechanism;
- recoverability guarantees;
- an approval queue.

Keep final route/lifecycle/handoff ownership `HANDOFF_BLOCKED` until governance chooses one coherent model:

- persist Draft/Validated plans before review and use a real plan ID; or
- retain an ephemeral staged review on an approved non-ID route with explicit recoverability semantics.

A human-readable review reference may appear only as clearly labelled sample content. Never represent it as a persisted plan identifier.

## Current runtime truth — binding

### Bulk publisher

The current authoritative bulk publisher is `publish_bulk_plan` from `20260714091727_planning_publish_guards.sql`, not migration 0026 alone.

It:

- runs as `SECURITY INVOKER`;
- rechecks the Planner role;
- validates non-empty unique targets and the current supported bulk visit type;
- validates the window;
- rechecks the package version is published or locked;
- rechecks every factory exists;
- takes stable factory-scoped advisory transaction locks;
- rechecks active duplicates inside the transaction;
- validates manual inspectors remain in the Inspector role;
- derives automatic assignment server-side;
- ignores the caller-supplied automatic pool retained for API compatibility;
- selects the first eligible Inspector available in the window;
- rechecks assignment overlap;
- is additionally protected by the canonical assignment-overlap guard in migration 0031;
- inserts one plan, one visit per retained factory and one assignment per visit;
- persists Draft → Validated → Published;
- inserts assignment notification records as queued rows;
- relies on existing append-only table triggers for mutation audit;
- returns the plan ID;
- rolls the complete transaction back on any guard or write failure.

Bulk automatic assignment is not:

- round-robin;
- AI;
- optimization;
- a capacity score;
- a skills match;
- a territory recommendation;
- a travel-time decision.

The truthful label is: `first eligible Inspector available in the window, chosen at publish`.

The current server action redirects successful bulk publication to `/visits` and currently discards the returned plan ID.

### Single publisher

The current authoritative single publisher is `publish_single_visit` from `20260714091727_planning_publish_guards.sql`.

It:

- runs as `SECURITY INVOKER`;
- rechecks the Planner role;
- rechecks factory identity/licence truth;
- rechecks location confirmation and coordinate validity;
- rechecks execution-mode eligibility;
- rechecks package status;
- takes a factory-scoped advisory transaction lock;
- rechecks active duplicates;
- validates manual Inspector eligibility/overlap or derives the first eligible available Inspector;
- permits only an owned, empty, single-method legacy draft as a resume input;
- inserts/uses the plan, visit and assignment atomically;
- persists Draft → Validated → Published;
- queues one assignment notification record;
- records table mutations through existing audit triggers;
- returns the visit ID;
- rolls everything back on failure.

Successful single publication redirects to `/visits/:visitId`.

Do not describe the current single path as sequential, partially committed or non-atomic. That was an older implementation and is no longer true.

### Fail-closed reads and authorization

Current bulk/single source reads return neutral unavailable outcomes rather than silently converting required-source failures into legitimate emptiness.

The current bulk review route explicitly checks the Planner role before rendering. The guarded RPC rechecks it again. RLS remains the authoritative data boundary.

Do not list these already-fixed legs as backend blockers:

- fail-closed bulk/single source reads;
- route-level Planner denial on the existing bulk review route;
- in-transaction duplicate/package/visit-type/assignment rechecks;
- concurrency-safe assignment overlap enforcement;
- schedule-aware first-available automatic assignment;
- single-plan atomic publication;
- canonical Draft → Validated → Published persistence inside publication.

### Current UI gaps that the handoff must correct

The current implementation still contains user-facing strings/comments based on the older architecture, including `round-robin` automatic assignment and a generic `contact support` failure instruction. Treat current code as evidence of what exists, not permission to repeat false or ungoverned copy.

The approved implementation handoff must replace those strings with current truthful behavior and neutral recovery without inventing a support destination.

## Notification and audit truth

A notification row created in the transaction means queued/recorded for sending only.

Allowed copy:

- `Assignment notification queued`
- `Notification record created`
- `Queued for sending`

Disallowed without provider evidence:

- `Inspector notified`
- `Delivered`
- `Received`
- `Opened`
- `Acknowledged`
- `Accepted`

Existing append-only table triggers record successful mutations and actors. Do not claim a separate named publication-business event or attempted/blocked-publication event unless current repository evidence proves it.

A rolled-back transaction must not leave a false success audit or notification row.

## Remaining HANDOFF_BLOCKED legs

Keep these blocked unless the current repository independently proves them during this session:

- final CD-025 route and screen ownership;
- persisted Draft/Validated plan before the review screen;
- CD-024→CD-025 staged handoff mechanism;
- lost/expired staged-review recovery semantics;
- guaranteed return-to-edit route with preserved context/focus;
- planning-specific approver configuration/maker-checker;
- dedicated attempted/blocked-publication business audit event;
- notification provider delivery/receipt/acceptance;
- durable success receipt/download;
- any policy-based freshness duration or stale threshold;
- support/escalation destination;
- post-publication mutation through `/planning/plans/:id`.

Do not keep already-fixed atomicity, guard, fail-closed-read or overlap legs blocked.

## Protected behavior

Preserve:

- RLS/RBAC and server-side Planner checks;
- `SECURITY INVOKER` behavior;
- factory-level concurrency locks;
- assignment overlap serialization;
- Draft → Validated → Published transitions;
- full rollback for both bulk and single publishers;
- append-only audit triggers;
- exact package code/version;
- stable factory identifiers;
- duplicate protection;
- manual versus automatic assignment distinction;
- physical-only bulk execution;
- neutral errors with raw provider/database details logged only server-side;
- notification queued-not-delivered truth;
- method-specific success destinations;
- read-only `/planning/plans/:id`;
- immediate planning outside CD-025;
- dark/light themes;
- Arabic-first document-level RTL;
- the sponsor-accepted shared shell.

Never optimistically show Published. Never allow double submit. Never show a rolled-back or partial result as success.

## Do not invent

Do not invent or imply:

- planning maker-checker, approver SLA, delegation or self-approval policy;
- a final route or persisted pre-review ID;
- a validation-version token;
- a freshness threshold such as “stale after 40 minutes”;
- bulk size as business policy merely because code has a defensive cap;
- skills, certification, territory, work-hours or capacity eligibility;
- route/travel feasibility;
- risk-based assignment recommendation;
- provider delivery or Inspector acceptance;
- support contact information or escalation path;
- receipt persistence/download;
- a typed confirmation phrase, password re-entry, checkbox attestation or countdown;
- an override permission or reason taxonomy;
- recovery guarantees not supported by the selected route/handoff model.

Use `Not evaluated`, `Unavailable` or a blocking dependency where evidence is absent.

## Required current-screen critique

Before composing the selected design, inspect the current bulk review, single wizard and read-only plan detail. Produce a non-product critique naming the highest-cost decision failures with exact file/runtime evidence.

At minimum evaluate:

1. current configuration, assignment, review and irreversible publication are compressed into the CD-021 P02 route;
2. no dedicated contract-owned CD-025 route exists;
3. no stable explicit consequence model is shown before commit;
4. current code copy still says round-robin despite first-available server behavior;
5. generic support wording has no governed destination;
6. the server action discards the returned bulk plan ID and always redirects to `/visits`;
7. `/planning/plans/:id` is read-only and cannot substitute for pre-publish review;
8. the current UI does not present the premium blocker-to-object focus and consequence grammar required here.

Do not score the current screen. State evidence and operational cost.

## Primary design job

Create a calm, evidence-led pre-flight decision surface that answers in one scan:

1. What plan is being reviewed?
2. Which factories and visits are included?
3. Which package version and window apply?
4. Which assignments are manual, automatic, verified or blocked?
5. What is verified, unavailable, warning, stale-by-evidence or blocked?
6. What will publication create, reference, record and not do?
7. What must be corrected before publish?
8. Where will the planner go after the authoritative result?

This is not a dashboard and not a modal.

## Binding sample-data/count model

Use one internally consistent industrial scenario across every full frame, theme, language, breakpoint, contact-sheet state and handoff file.

### Pre-decision blocked state

- 12 factories selected.
- 2 factories have active periodic visits and are duplicate-blocked.
- Those 2 have no proposed assignment and are not counted as assignments or notifications.
- 10 non-duplicate proposed visits remain if the two duplicates are explicitly removed.
- Across those 10: 3 manual assignments and 7 automatic assignments.
- Of the 3 manual assignments: 2 are verified and 1 has an exact known overlap blocker.
- The 7 automatic Inspectors are chosen at publish as first eligible available in the window; names are not promised beforehand.
- Publish is disabled.

In this state, do not promise 12 assignments or 12 notifications. Do not say 9 automatic anywhere.

The final action may say `Publish blocked — resolve 3 items` until retained scope is known.

### Explicit scope-reduction state

After the planner explicitly removes the two named duplicate factories:

- show `12 selected → 10 retained`;
- name both removed factories and stable codes;
- retain 10 proposed visits;
- retain 3 manual and 7 automatic assignments;
- show 10 prospective queued notification rows;
- keep publish disabled because the one manual overlap remains.

The action may now say `Publish plan and create 10 visits — blocked`.

### Ready state

After the manual assignment is corrected and authoritative sources are verified:

- 10 retained factories;
- 10 proposed visits;
- 10 valid assignments;
- 3 manual and 7 automatic;
- 10 notification records to be queued on successful commit;
- exact package/version and window;
- no blocker;
- final action `Publish plan and create 10 visits`.

### Immediate success state

After the authoritative result:

- one plan published;
- 10 child visits published;
- 10 assignments created;
- 10 notification records queued, not delivered;
- zero completed visits at that immediate moment;
- zero draft child visits at that immediate moment.

If you demonstrate later progress such as completed, returned, cancelled or expired visits, label it as a separate later historical example. Never show `7 published · 1 completed · 2 draft` as the immediate continuation of a transaction that just published all 10.

## Single permitted signature pattern: Publish Consequence Ledger

The one new CD-025 pattern is the **Publish Consequence Ledger**.

It must bind each consequence to:

- current retained-scope count;
- verification/blocking state;
- affected object(s);
- exact correction path.

Use four operational groups:

1. **Will be created on successful commit**
   - one plan;
   - exact retained visit count;
   - exact assignment count.
2. **Will be referenced for those visits**
   - exact package code/version;
   - visit type and physical mode;
   - window;
   - manual/automatic method and assignee truth.
3. **Will be recorded or queued**
   - proven audit mutations;
   - exact queued notification-record count;
   - explicit queued-not-delivered explanation.
4. **Will not happen at publication**
   - no inspection starts;
   - no Inspector acceptance is proven;
   - no message delivery is proven;
   - no factory is silently dropped;
   - no partial result is called success.

Before duplicate resolution, the ledger must state that a committable retained scope is not yet final. After explicit reduction it must recalculate to 10 everywhere.

Every failed ledger row links to the exact blocker/object. Every correction link preserves context and has an accessible name.

Keep design-process wording such as `SIGNATURE — one per screen` outside product UI.

Include a counterfactual frame with the ledger removed and explain the measurable loss.

Do not add another signature pattern.

## Three equal-fidelity hypotheses

Create three equal-fidelity alternatives using the same sample data and hard state:

1. **Object-first dossier** — plan/targets/visits/package/assignment evidence leads; ledger synthesizes at the boundary.
2. **Blocker-first pre-flight** — linked readiness and blockers lead; objects remain directly inspectable.
3. **Consequence-first boundary** — the ledger leads; consequences expand to evidence and correction.

They must differ in decision flow and information architecture, not merely card order, color or spacing.

Compare without numerical scores against:

- time to decide whether publish is safe;
- time to locate and fix a blocker;
- visibility of affected factories/visits;
- prevention of silent scope loss;
- separation of verified/unavailable/warning/blocked evidence;
- irreversible-action comprehension;
- Arabic/RTL integrity;
- keyboard burden;
- narrow-layout survival;
- implementation truth.

Select one with evidence. Preserve the R1 blocker-first direction if it remains superior after correction; do not change direction merely to appear novel.

## Required primary page content

The selected high-fidelity page must include:

- planning method;
- staged/not-yet-persisted truth without implying a saved plan ID;
- selected and retained factory counts;
- stable factory names/codes;
- visit type;
- physical execution mode;
- exact package code/version;
- window start/end;
- manual/automatic assignment split;
- per-factory/visit assignment evidence;
- linked blocker summary;
- source/check status without invented freshness policy;
- explicit named scope decision;
- full live consequence ledger;
- return/change paths;
- disabled-reason text;
- one final publish action;
- progress state;
- neutral authoritative failure;
- truthful completion/destination.

Keep requirement IDs, migration names, RPC names, security terms, route governance and handoff labels outside product UI.

## Scope-integrity behavior

No selected factory may disappear silently.

When duplicates are removed:

- list each removed factory name and stable code;
- state the proven active-visit reason;
- make the choice explicit and unselected by default;
- recalculate visits, assignments, method split and notifications;
- announce the count change politely;
- keep the remaining manual blocker visible;
- provide a truthful correction/return path;
- never claim restoration if the governed handoff cannot restore it.

## Publish action behavior

Do not use a generic confirmation modal.

The final action remains in reading/keyboard flow.

It must show:

- exact action and retained count when known;
- exact package/version;
- all-or-nothing transaction truth;
- queued-not-delivered notification truth;
- why it is disabled;
- correction links;
- what will be authoritatively rechecked;
- truthful destination.

During publish:

- disable repeat activation;
- keep context visible;
- announce progress with `role="status"`;
- do not promise duration;
- do not show optimistic Published;
- show completion only after the authoritative result.

## Required designed states — all 28

Produce a high-fidelity state frame/panel for each item. Prose-only inventory is insufficient.

1. Initial validation/loading with known staged context retained
2. Populated 10-retained bulk plan genuinely ready
3. Pre-decision 12-selected plan with multiple linked blockers
4. Mandatory configuration missing
5. Legitimate no published/locked package available
6. Selected package invalidated/unavailable at authoritative check
7. Legitimate no Inspector in the role pool
8. Partial assignment coverage
9. Duplicate active visit on named targets
10. Explicit named 12→10 scope reduction with all counts recalculated
11. Manual Inspector overlap with exact visit/window
12. Automatic assignment: first eligible available Inspector chosen at publish; skills/capacity/territory not evaluated
13. Factory/target source failure that blocks safely
14. Package source failure distinct from legitimate no-package state
15. Inspector source failure distinct from legitimate empty pool
16. Duplicate/overlap query failure distinct from verified zero conflicts
17. Revalidation required due to a proven change/source condition, with no invented elapsed-time threshold
18. Concurrent change caught inside authoritative publish; full rollback
19. Approval-required annotation only, because planning maker-checker is unproven
20. Direct Planner publication supported by current RBAC and publisher guard
21. Unauthorized/not-in-scope direct access
22. Lost/expired ephemeral staged review, with recovery HANDOFF_BLOCKED
23. Publish in progress with double-submit prevented
24. Bulk transaction failure: nothing published; neutral retry; no invented support path or unproven preservation guarantee
25. Single atomic publication failure: publication not completed; full rollback; safe neutral retry; never described as a partial sequential write
26. Bulk publication complete: 10 visits, 10 assignments, 10 notifications queued; truthful destination
27. Read-only post-publish plan detail with immediate 10-published truth, plus separately labelled later-history example if desired
28. Return-to-edit/focus landing design, with route/context wiring HANDOFF_BLOCKED

## Success and destination truth

Bulk success may say:

- plan published;
- exact visits/assignments created;
- exact assignment notification records queued;
- no delivery/acceptance/inspection start is implied;
- continue to `/visits`.

`Go to visits` is the primary truthful action.

An optional `Open the published plan (read-only)` action may appear only if the implementation handoff explicitly adds the leg to capture the RPC-returned plan ID and route to `/planning/plans/:id`. Otherwise omit it.

Do not invent a downloadable/persistent receipt.

Single success must show atomic completion and redirect to `/visits/:visitId`.

## Failure truth

For bulk or single guarded-publisher failure:

- say publication did not complete;
- say nothing was published/created only when full rollback is proven for that method;
- preserve neutral copy;
- provide retry and a governed return path where available;
- never expose raw provider/schema/SQL/policy/RPC/stack text;
- never say `contact support` because no support destination is governed;
- never promise staged recovery beyond the selected route/handoff evidence.

Suggested bulk copy:

`Publishing failed — nothing was published. The plan and visits were not created. Review the flagged items and try again.`

## Authorization and approval behavior

Navigation visibility is not authorization.

Show a distinct direct-route unauthorized state. Preserve the existing Planner page guard, guarded RPC role recheck and RLS boundary.

Do not design a planning approval queue unless the repository proves all of:

- configuration source;
- approver role/scope;
- submission transition;
- approval transition;
- self-approval guard;
- audit event;
- notification effect;
- negative path;
- destination/return behavior.

Otherwise show direct Planner publication and keep planning maker-checker external and blocked.

## Exact frozen shared shell

Use the current runtime shell exactly. Do not draw a simplified approximation.

For a pure Planner persona, the role-scoped groups/destinations are derived from `shell-navigation.ts`, including:

- Command group: Factory 360;
- Inspection group: Planning and Visit Management;
- Planning marked current.

If the persona is multi-role, show only destinations produced by the actual role set. Do not invent tabs.

Desktop full frames must show:

- real Saqeel prism/Arabic brand lockup;
- grouped role-scoped navigation;
- real icon grammar;
- group disclosure behavior;
- desktop collapse control and collapsed-state evidence;
- navigation search as a native input;
- theme control;
- notification control;
- topbar own-account trigger with identity and roles;
- language and sign-out inside the account menu;
- page header/title/context structure;
- skip-to-content relationship.

Do not relocate account identity to the sidebar. Do not use colored squares as navigation icons. Do not put a standalone language button in the topbar when runtime places language in the account menu.

At narrow widths show closed and open drawer states. Prove:

- focus moves into the drawer;
- Tab is contained;
- Escape closes it;
- focus returns to the menu trigger;
- body scroll is contained;
- RTL drawer enters/exits from the correct physical side.

Close-ups without shell must be labelled `CONTENT_CROP` outside product UI.

## Family grammar and visual ambition

Inherit:

- Space Grotesk / IBM Plex Sans Arabic / JetBrains Mono roles from current tokens;
- magenta-violet Saqeel prism tokens;
- accepted surface/radius/density scale;
- focus and error grammar;
- status text plus glyph/non-color cue;
- evidence-led object rows;
- exact package-version treatment;
- blocker/warning/unavailable separation;
- dark/light equivalence;
- full Arabic RTL;
- native semantic table/list behavior.

Summarize CD-024 assignment evidence; do not duplicate its Assignment Evidence Ledger as another novelty.

Without the logo/title, the page must still read as industrial inspection publication through factories, stable codes, visits, assignments, package version, window, validation and operational consequence.

## Arabic, RTL, themes and responsive proof

- Arabic is the fresh-session default.
- Use `lang="ar" dir="rtl"` at document level.
- Show realistic long Arabic factory/Inspector names and blocker/action copy.
- Isolate codes, UUIDs, package versions, dates and times using correct `bdi`/direction treatment.
- Mirror physical ordering through logical properties, not cosmetic reversal.
- Show the same hard state in English dark, English light, Arabic dark RTL and Arabic light RTL.
- Provide full desktop, 1024px tablet and fully operable 390–430px narrow evidence.
- Do not simplify away targets, blockers, counts, consequence ledger, correction paths or final action.
- No horizontal page overflow.
- Sticky action areas must not cover content, focus targets or announcements.
- Use accepted 44–48px minimum interactive targets.

Required narrow DOM/reading order:

1. plan context;
2. readiness and linked blockers;
3. targets/visits;
4. package/assignment evidence;
5. consequence ledger;
6. correction/return paths;
7. final action.

## Accessibility and semantic implementation specification

The artifact and handoff must match the accessibility prose.

Use native:

- `main` and navigation landmarks;
- heading hierarchy;
- `table`, `thead`, `tbody`, `tr`, `th scope="col"`, `td`;
- buttons, links, inputs and disclosure controls.

Do not use `sc-raw-table`, `sc-raw-th`, `sc-raw-td` or unsupported custom tags as substitutes for table semantics. Do not create an ARIA grid unless composite-grid keyboard behavior is genuinely required and fully specified.

Prove:

- skip link to main;
- logical heading order;
- native traversal through summary, object rows, correction links, ledger and final action;
- visible focus in both themes;
- linked error summary moves focus to the exact invalid row/section;
- repeated `Change`/`Fix` actions have hidden object context;
- failed submit focuses one `role="alert"` summary rendered once;
- validation/publishing progress uses `role="status"`;
- success focuses a real heading or labelled summary target;
- corrected return focuses the corrected row or review heading;
- no hover-only, drag-only, map-only or color-only information;
- scope count changes are announced politely;
- blocker/concurrent/failure messages are assertive without duplicate speech;
- reduced motion removes theatrical animation without losing continuity;
- disabled publish is a native disabled control;
- the visible disabled reason has a stable ID;
- `aria-describedby` connects the disabled control to that reason;
- shell search/theme/notification/account/drawer controls retain native semantics.

Do not claim an adjacent sentence is screen-reader-associated unless the control is programmatically connected to it.

## Freshness truth

Do not invent a time threshold.

An exact `Last checked at 10:42` value may be provenance, not policy.

A blocking revalidation state must arise from evidence such as:

- the package/target/assignment changed after review loaded;
- a newer authoritative revision is observed;
- a required verification source became unavailable;
- the commit-time guard rejected changed data.

Never say data is stale merely because 40 minutes or another unconfigured duration passed.

## Research provenance

Use primary sources and record for each:

- observed principle;
- adopted treatment;
- rejected treatment;
- Saqeel-specific reason;
- exact design frame/node.

Required external sources:

1. GOV.UK Design System — Check answers  
   `https://design-system.service.gov.uk/patterns/check-answers/`
2. GOV.UK Design System — Confirmation pages  
   `https://design-system.service.gov.uk/patterns/confirmation-pages/`
3. GOV.UK Design System — Error summary  
   `https://design-system.service.gov.uk/components/error-summary/`
4. W3C WCAG 2.2 — Focus Order  
   `https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html`
5. W3C WCAG 2.2 — Status Messages  
   `https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html`
6. Saudi Digital Government Authority — Web accessibility guidance  
   `https://dga.gov.sa/en/digital-knowledge/web-accessibility-disabilities-and-elderly-people`
7. PostgreSQL — Transaction Isolation  
   `https://www.postgresql.org/docs/current/transaction-iso.html`

Use these for principles, not visual copying. Arabic-first is a binding Saqeel decision, not an inference from an external website.

Explicitly reject:

- generic government-service visual styling;
- generic confirmation modal;
- decorative checklist disconnected from real objects;
- optimistic success;
- green status that implies delivery/acceptance;
- checkbox or typed-phrase theatre;
- color-only readiness;
- invented timing/support information;
- design-process labels inside product UI.

## Required deliverables

Return one synchronized package containing:

1. `CD-025 Plan Review and Publish.dc.html`
2. standalone HTML export
3. `ROUTE_LIFECYCLE_AND_OWNERSHIP_DECISION`
4. current-screen critique
5. contract/runtime truth matrix
6. bulk/single/immediate boundary matrix
7. supported/unsupported/HANDOFF_BLOCKED matrix
8. research provenance ledger
9. three equal-fidelity hypotheses
10. evidence-based hypothesis selection
11. selected full dark desktop blocked state
12. corrected post-scope-reduction state
13. genuinely ready state
14. Publish Consequence Ledger close-up
15. counterfactual without the ledger
16. compact single-plan atomic variant
17. 28-state high-fidelity contact sheet
18. full English dark frame
19. full English light frame
20. full Arabic RTL dark frame
21. full Arabic RTL light frame/evidence
22. full 1024px tablet frame
23. full 390–430px narrow frame
24. mobile drawer closed/open/focus-return evidence
25. linked error-summary/focused-row frame
26. publish-in-progress/double-submit frame
27. neutral bulk-failure frame
28. neutral single atomic-failure frame
29. immediate completion frame
30. read-only destination frame
31. separately labelled later-history destination example if used
32. keyboard/focus/live-region/reduced-motion specification
33. family inheritance ledger
34. one-pattern novelty declaration and counterfactual evidence
35. `IMPLEMENTATION_MANIFEST_CD-025.yaml`
36. `COMPONENT_MAP_CD-025.csv`
37. `WIRING_MAP_CD-025.csv`
38. `STATE_MATRIX_CD-025.csv`
39. `ACCEPTANCE_CHECKLIST_CD-025.md`
40. `RESEARCH_PROVENANCE_CD-025.md`
41. `CLAUDE_CODE_HANDOFF_CD-025.md`
42. `CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-025.md`
43. consistently named PNG exports: `CD-025_SCR-WEB-150_*`

Every frame must have a stable identifier referenced by the checklist, state matrix and PNG manifest.

All HTML, PNGs, maps, manifests, checklists and Claude Code prompts must describe the same R2 design, sample counts and runtime truth. Do not update only the standalone HTML while leaving the repository handoff stale.

## Handoff mapping contract

Every user action/system state must map through all 14 legs:

1. UI trigger
2. client component
3. route/server action
4. validation guard
5. canonical transition
6. table/RPC/storage/provider
7. RLS/grant/role/scope
8. audit effect
9. notification/provider effect
10. success result
11. negative/stale/failure result
12. retry/idempotency
13. automated test
14. runtime evidence

Missing legs are `HANDOFF_BLOCKED`.

Distinguish:

- existing evidence-only files;
- existing files to update after approval;
- proposed route-neutral components;
- blocked route targets;
- protected read-only files.

Never list `apps/web/src/app/planning/plans/[id]/page.tsx` as the editable pre-publish route.

Do not guess a Next.js route filename. Use a route-neutral component name until governance resolves ownership.

The manifest must state:

`implementation_authorized: false`

## Claude Code implementation prompt requirements

Generate a complete prompt for Claude Code, but do not execute it.

It must:

- begin `DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL`;
- identify `CD-025 / SCR-WEB-150 / P03`;
- require reading the approved R2 design and every synchronized handoff file;
- require re-reading current repository/runtime truth before editing;
- implement only the sponsor-approved vertical slice;
- stop if final route/lifecycle/CD-024→025 ownership remains ungoverned;
- preserve both guarded atomic publishers and never restore migration-0026-only behavior;
- preserve RLS, role checks, overlap locks/guards, audit triggers and queued-not-delivered notification truth;
- replace stale round-robin and ungoverned support copy;
- use the exact shared shell rather than rebuilding it;
- preserve `/planning/plans/:id` as read-only;
- map the optional read-only-plan action only if the returned plan ID is captured;
- implement all approved negative states, focus behavior, Arabic/RTL, themes and responsive layouts;
- require positive, negative, role, transaction rollback, audit, notification, keyboard, screen-reader, theme, RTL and responsive evidence;
- require an independent post-implementation wiring audit;
- prohibit inventing unresolved policy/backend behavior;
- prohibit commit, push, merge, deployment or `main` changes without separate authorization;
- preserve the dirty worktree and unrelated parallel work.

## Acceptance checklist requirements

The checklist must cite exact frame/node and handoff evidence for:

- `DSG-020` complete plan/child visits/blockers/notifications/atomic publication;
- all mapped FABLE/product requirements;
- route/lifecycle conflict;
- current atomic bulk and single truth;
- first-available automatic assignment truth;
- fail-closed source states;
- explicit 12→10 scope change;
- count consistency across every frame;
- no partial/optimistic success;
- all 28 hard states;
- exact shared shell;
- English/Arabic and dark/light parity;
- desktop/tablet/narrow and drawer behavior;
- native table/control semantics;
- keyboard/focus/live-region/reduced-motion behavior;
- neutral raw-error protection;
- RLS/RBAC/audit/notification truth;
- read-only destination;
- one-pattern novelty limit;
- exact remaining implementation blockers;
- synchronized HTML/PNG/manifest/map/checklist/handoff versions.

Do not self-award scores or approval.

## Mandatory self-criticism passes

Run and record evidence from these passes before returning:

1. **Contract coverage** — every requirement, role, transition and failure is represented.
2. **Runtime truth** — no route, atomicity, assignment, audit, notification, freshness, support or recovery claim exceeds current evidence.
3. **Count integrity** — every selected/retained/visit/assignment/manual/automatic/notification number reconciles.
4. **Decision superiority** — the planner can find and fix an affected object faster than in the current screen.
5. **Hard-case integrity** — source failure, duplicate, overlap, unauthorized, concurrent change and rollback are first-class.
6. **Inspection specificity** — the page cannot be mistaken for generic CRM/project/admin UI.
7. **Family continuity** — exact shell, tokens, typography, density, focus and status grammar are inherited.
8. **Arabic-first integrity** — the same hard case survives realistic RTL and narrow layouts.
9. **Accessibility** — semantic elements, keyboard, focus, announcements, non-color cues and reduced motion match the written specification.
10. **Implementation fit** — every action has 14-leg mapping; only genuinely unresolved legs are blocked.
11. **Handoff synchronization** — design, exports, manifests, maps, states, checklist and Claude Code prompt agree.
12. **Novelty discipline** — the Publish Consequence Ledger is the only new signature pattern and passes the deletion test.

Revise internally when a pass finds a problem. Return evidence, not numerical grades.

## Final status

Finish with exactly:

`READY_FOR_DESIGN_REVIEW_R2`

Never state approved, accepted, implemented, vertically complete, build-complete or implementation-ready.

