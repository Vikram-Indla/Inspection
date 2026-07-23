# SAQEEL Planning Module — Canonical Understanding, Conflict Resolution and One-Pass Implementation Plan

**Document:** SAQEEL-PLN-CANONICAL-PLAN v1.0  
**Purpose:** Engineering implementation authority for Kimi against the complete Inspection repository and the attached business documentation.  
**Preservation rule:** Existing routes, components, tables, RPCs, migrations, audit records, offline flows and accepted wiring must not be deleted, moved or bypassed. Requirements are absorbed additively. Where a requirement conflicts with current behaviour, the detailed Planning document is the business authority, and the implementation must reconcile rather than replace the accepted platform architecture.

## 1. Executive understanding

Planning is not merely a form that creates a visit. It is the connected **P01 Targeting and Planning → P02 Visit Design and Assignment → P03 Publish and Operational Management** capability that converts registered or controlled-manual factory context into an executable, assigned and auditable inspection visit.

The module has four connected surfaces:

1. **Planning workspace and visit list** — all Draft, Published, Returned, Cancelled and Expired planning records, with complete search, filtering, status-specific actions, export and filter continuity.
2. **Creation journeys** — Single and Bulk are mandatory under the supplied detailed specification. The already-built Immediate journey remains preserved as an additive controlled exception because existing functionality may not be removed.
3. **Configuration and assignment** — visit type, mode, priority, visit window, optional packages, notes, attachments, notification intent, source channel, inspector recommendation, override and bulk distribution.
4. **Lifecycle management** — draft continuation, publish, return and republish, reassignment, reschedule, cancellation, automatic expiry, duplicate/conflict controls, notifications, immutable audit and downstream execution handoff.

Planning is a core-operations module. Its outputs feed the Inspector pool, execution preparation, Operations Center, Dashboard counts, Factory 360 entry points, notifications, scheduler and audit. Any planning status or action that changes a dashboard number must use the same canonical records and state transitions; no page-specific duplicate counters are permitted.

## 2. Source precedence

1. `Planning.docx` — highest business authority for the detailed Planning module.
2. `Saqeel_Consolidated_BRD_5.pdf` — full platform context, 52 Planning and 46 Planning Management capabilities, screen catalogue, process spine, API catalogue and traceability.
3. Repository `setup/Inspection` at execution start — technical truth for existing routes, schemas, migrations, RPCs, RLS, tests and accepted design decisions.
4. Sanitized API documentation and API Set 2 — external structure and source-field contracts. Credentials and personal example data are never runtime requirements.
5. Existing approved decisions — especially DEC-024: `/planning/bulk/review` remains the pre-publish configuration/assignment/review workspace; `/planning/plans/:id` remains read-only; no replacement `/planning/:id/configure` route is introduced.

When sources conflict, the conflict register in this pack provides the canonical resolution. A missing external contract is rendered `CONTRACT_NOT_SUPPLIED`; it is never converted into fabricated data or a false empty result.

## 3. Non-regression and preservation contract

Kimi must first map every existing Planning entry point, route, component, server action, RPC, table, RLS policy, trigger, cron job, notification event, audit event and test. It must preserve at least:

- `/planning`, `/planning/bulk`, `/planning/bulk/review`, `/planning/single`, `/planning/immediate`;
- `/planning/plans` and read-only `/planning/plans/:id`;
- `/visits`, `/visits/:id`, calendar/map/workload surfaces already wired;
- Factory 360 and map quick-create handoffs;
- `publish_bulk_plan`, `publish_single_visit`, Immediate-visit atomic creation and planning lifecycle RPCs;
- scheduled expiry and append-only audit;
- existing execution, review, Factory 360, Operations Center and offline behaviour.

Reconciliation is additive. Existing accepted routes may become aliases or share canonical components, but must not break bookmarks, test IDs, links or accepted screen ownership.

## 4. Canonical role and access model

The business direction simplifies personas without weakening server enforcement:

### 4.1 Explicit classes

- **Admin** — dashboard plus Administration/control-plane capabilities only. Admin does not receive Planning, Inspection execution, Review, Operations or Compliance runtime access merely because the account is administrative.
- **Inspector** — own assigned field/execution work, preparation, Factory 360 context and the already-built authorized Immediate-visit exception. Inspector does not receive the general Planning workspace or management actions.
- **Internal business staff** — every authenticated internal user who is neither Admin nor Inspector. This is the broad business-access class and receives Planning and the other business modules. Fine-grained high-impact actions remain controlled by permission, state and scope.

`ops` is not a future canonical role. Existing `planner`, `reviewer`, `ops`, `leadership` and similar rows are retained temporarily as compatibility aliases while permissions are migrated. No row is destructively deleted during the first implementation. Route and RLS logic must stop depending on `ops` as a unique authority.

### 4.2 Capability enforcement

Menu visibility is not authorization. Every action must be checked by server action/RPC and RLS using capabilities such as:

- `planning.view`, `planning.create`, `planning.edit_draft`, `planning.publish`;
- `planning.manual_factory`, `planning.correct_location`, `planning.override_assignment`;
- `planning.cancel`, `planning.reassign`, `planning.reschedule`, `planning.export`;
- `planning.configure_workflow`, `planning.configure_lookups`, `planning.configure_expiry`.

Admin manages capabilities and configuration through the control plane, but does not inherit business data access unless explicitly granted through a separate controlled delegation.

## 5. Canonical information architecture and entry points

### 5.1 Main navigation

`Operations → Planning` must open the **Planning Visit List**, not only a method chooser. Preserve the existing `/planning` route and refactor it into a route-neutral landing composition:

- KPI/status tabs and planning records first;
- `Create Visit` action opens method selection for Single, Bulk and preserved Immediate;
- draft continuation, returned work and recent plans remain visible;
- `/visits` remains a backward-compatible management alias using the same canonical list/query contract.

### 5.2 Required entry points

- Planning list → Create Visit.
- Factory 360 → prefilled Single Planning with CR, selected licence and plant.
- Factory map/quick card → prefilled Single Planning.
- Returned notification → visit details focused on return reason/comments.
- Draft notification/shortcut → persisted draft continuation.
- Visit details → Duplicate Visit, creating a new Draft from eligible fields only.
- Existing Factory 360 → Immediate action remains preserved where currently wired.

Every handoff records `source_channel` and carries stable CR/licence/plant identifiers rather than display text.

## 6. Planning list and management workspace

### 6.1 Status tabs

All, Draft, Published, Returned, Cancelled and Expired. Internal technical states such as `validated` may remain in the engine, but must not create undocumented user tabs.

### 6.2 Required columns

Visit Reference; Planning Type; Planning Status; Operational State; Visit Type; Visit Mode; Priority; CR Number; CR Name; Licence Number; Plant Number; Factory Name; Region; City; Assigned Inspector; Visit Window Start; Visit Window End; Execution Date; Report Packages; Created By; Created Date; Source Channel; Return Status; Bulk Plan Reference; last action/update.

Columns should be configurable at presentation level but all canonical values must be available to list/export/detail contracts.

### 6.3 Search and filters

General search covers visit reference, CR number/name, licence, plant, factory, inspector and creator. Filters must include planning type, status, visit type, region, dependent city, inspector, window dates, created range/creator, package, priority, return status and bulk plan reference. Reset is mandatory. Filter state survives detail navigation during the current session and is represented in a share-safe URL or session state without leaking sensitive data.

### 6.4 Actions

Page actions: Create Visit, Export authorized filtered rows, Refresh. Row actions are state/permission driven exactly as defined in the source. Bulk edit/reassign/reschedule/cancel operates per row with an outcome ledger; one blocked row does not falsely label the whole action successful.

## 7. Single Planning

Single Planning searches by **CR, Industrial Licence or Plant Number**. It uses the canonical CR → many licences → one selected licence → one plant model.

When CR search returns multiple licences:

1. show CR identity;
2. show every related licence and plant;
3. require selection of the target licence/plant;
4. show the selected factory profile;
5. create the visit against that licence/plant, never only at CR level where a plant-level target exists.

Registered fields retain source/freshness and are read-only except controlled contact/location overrides. Planning coordinates never update Senaei master data. Current code that permits CR-level continuation without a licence must be reconciled with an explicit eligibility state, not silently retained.

## 8. Manual and Immediate Planning

The detailed document permits manual unregistered factory data only when all eligibility rules pass. The existing Immediate journey is preserved and upgraded to the same contract.

Required controls:

- explicit not-found confirmation;
- permission and Visit-Type eligibility;
- manual-entry reason lookup;
- required establishment name, region, dependent city and map pin;
- conditional mobile when factory notification is enabled;
- licence/plant values marked unverified;
- supporting attachment when configured;
- `location_source = Planner` or Inspector for the inspector-created Immediate exception;
- immutable audit and later reconciliation flag.

Current optional name/region/city behaviour and free-text priority are gaps. Priority, reasons and eligibility come from Admin-managed active lookups.

## 9. Bulk Planning

### 9.1 Search contract

Support region, city, sector, licence stage, activity, product/HS, land provider, employee count, licence status, risk level, previous violation count, previous outcome, last inspection date and issuing authority. At least one valid criterion is required unless the user has an explicit unrestricted-retrieval capability.

The condition tree supports field-appropriate operators: equals, not equals, contains, greater/less, between and in, with nested AND/OR groups and correct parentheses. Existing nesting/depth protections are retained.

### 9.2 Selection contract

Select one, multiple, current page, all matching up to an Admin-configured maximum; unselect; open details/Factory 360; remove ineligible rows; review selected count. Selection must survive criteria/review navigation in a persisted Draft, not only browser `sessionStorage`.

### 9.3 Eligibility and creation

Validate each selected factory independently and show Total, Eligible, Ineligible, To Create, Missing Location, Active Conflicts and Manual Override Required. The Planner may proceed with the eligible subset after explicit acknowledgement. The chosen eligible subset is then committed atomically: one Visit Plan, one unique Visit per eligible licence/plant, shared Bulk Plan Reference, unique Visit Reference and individual assignments. This reconciles “one invalid factory must not block valid factories” with transactional safety: partition before commit; never partially commit the accepted eligible subset.

## 10. Visit configuration and report packages

Common fields must include Planning Type, Visit Type, Visit Mode, Priority, Visit Window, Assigned Inspector, zero-or-more Report Packages, Planner Notes, Attachments, Notify Factory, Internal Reference and Source Channel.

**Report Package is optional during Planning.** Current home and journey blockers that require a published package before planning or publishing conflict with the business rule. When no package is selected, publish remains allowed and the Inspector must choose eligible package(s) during preparation. When packages are selected, store immutable package-version references/snapshots.

Bulk configuration may apply common fields with permitted per-factory overrides. Existing fixed Periodic + Physical + single package assumptions must become lookup/config-driven without removing the current defaults.

## 11. Inspector assignment and bulk distribution

Recommendation is deterministic and explainable, prioritized by:

1. active inspector;
2. same/operational region;
3. lower active workload;
4. availability inside the window.

Display inspector, region, assigned visits, overlapping visits, availability, recommendation reason and warnings. Skills/leave/capacity are shown as `not evaluated` until a governed source exists; they are never represented as zero.

Manual override is allowed with warning and configured override reason. Bulk planning supports automatic distribution, one inspector for all where eligible, and per-factory manual assignment/reassignment. Concurrency and overlap checks must be authoritative inside the publish transaction, not preview-only. Attempted conflicts are audited.

## 12. Location and provenance

Every visit stores:

- original/master coordinates;
- current visit coordinates;
- source (`License`, `Planner`, `Inspector`, `Integration`, `Historical Inspection`);
- actor and timestamp;
- immutable change history.

Planner correction requires capability and changes only visit coordinates. Inspector correction preserves both master and planning history. Missing coordinates block publish when required by Visit Type or place the row in Bulk ineligible state. The map is a UI over this canonical location contract, not the source of truth.

## 13. Draft and persistence

Drafts are real server records, not only client state. Minimum initial draft data is Planning Type and a search/selection attempt, unless governed auto-save introduces an explicitly incomplete initial draft.

Drafts retain every entered value, selected factories, criteria tree, per-row assignments, package selection, notes, attachments and validation status. They do not notify inspectors, reserve workload or appear in the inspector pool. They display missing publish requirements and have a stable Draft/Visit Plan reference.

Source wording says both delete and cancel draft. Canonical resolution:

- **Discard/Delete Draft** — permitted only before publish, soft-deleted or archived with audit; no published/child visit exists.
- **Cancel Draft** — optional explicit business action when a durable cancelled history is desired. The UI must not confuse it with cancelling a published visit.

## 14. Publish contract

Before publish, validate all documented preconditions. Package selection is not one of the mandatory preconditions. Duplicate and active conflict checks include same licence/plant, type, overlapping window, active Draft/Published and campaign/reference rules.

Successful publish:

- status `Published`, operational state `New`;
- assigned visit visible in inspector pool;
- notification row queued with honest delivery state;
- factory notification only by configured process;
- package snapshot only for selected packages;
- publisher/date/audit recorded;
- retry idempotent.

Bulk publication is atomic for the explicitly accepted eligible subset. Single and Immediate creation use equivalent guarded transactions.

## 15. Return, cancellation, expiry and duplicate

### Return

Normalize return reason and comments into dedicated records/lookups/history; do not encode business state in a notes prefix. Returned visits retain ID and plan linkage, leave the active inspector schedule where applicable, appear in Returned, expose permitted editing, and may be reassigned, re-windowed, repackaged, cancelled or republished.

### Cancellation

Allowed for Draft and Published+New before configured cut-off. Block after Start Journey, Arrival, execution start or submission. Store reason, conditional comments, actor/date, previous inspector and previous window. Cancelled is final/read-only; Duplicate produces a new Draft.

### Expiry

Expiry is Admin-configurable and scheduled. Required rule types include no acknowledgement, no execution date, no execution start and not completed at window end. Each rule has enabled state, scope, evaluation point, reason, notifications and audit. Existing scheduled expiry is preserved but generalized. Expired is final/read-only and duplicable; no automatic extension.

### Duplicate

Duplicate creates a new Draft and copies only eligible planning fields. It never copies IDs, execution state, submitted evidence, review decisions or immutable downstream versions.

## 16. Visit details

The read-only details contract includes identity/status/operational state, complete factory/licence/plant/contact context, location and history, visit configuration, assignment recommendation and override, packages and selection source, attachments, return/cancellation information, execution timestamps, audit, related visits and Bulk Plan context. Edit actions open controlled state-specific modes; the details representation remains canonical and complete.

## 17. Administration required for Planning

The existing Workflow configuration and lookup/control-plane surfaces are preserved and extended. Admin must be able to manage, under versioning and maker-checker where applicable:

- active Visit Types and manual-entry eligibility;
- Visit Modes and eligibility rules;
- Priorities;
- Return and Cancellation reasons, including conditional comments/evidence;
- Planning statuses and allowed transitions;
- operational-state mapping displayed by Planning;
- expiry rule families and scheduler frequency;
- cancellation cut-off guards;
- bulk maximum and unrestricted-search capability;
- assignment warnings/override reasons and recommendation weights/order;
- notification events/recipients/templates;
- attachment formats/limits where governed;
- region/city and other lookups;
- roles/capabilities and scope.

The current `/admin/access` roster is read-only, so role/capability assignment and revocation with self-escalation prevention, audit and approval is a mandatory gap. The current workflow editor is useful but a raw JSON payload alone is not sufficient for every line item: provide a governed Planning-specific status/rule view backed by the same versioned configuration.

## 18. API and canonical-data integration

The supplied Inspection API exposes authentication, regulations, task list/detail, plant production-line and submission. It does **not** expose a complete Planning-create API. Therefore Planning must not call external APIs directly from the browser or per row.

Canonical flow:

`Senaei / approved provider → server-only typed adapter → validated canonical factory/licence/plant tables + source/freshness → Planning search/read model → visits/assignments`

Relevant external fields include CR, unified number, names, licence/type/status/investment, plant/state, address/city/region, activity codes, land provider and production-line products/raw materials/spare parts/machines. Task data is downstream context, not the authority to create local plans.

Employee count, authoritative workforce, contacts and some activity catalogues may depend on Industry Shared contracts. Until verified, related filters show `CONTRACT_NOT_SUPPLIED` or are disabled with explanation; missing provider data never becomes zero. Raw credentials, bearer tokens and personal example values are excluded from this pack and from evidence.

## 19. Dashboard, Operations and downstream effects

Planning KPIs use planning statuses only. Dashboard/Operations counts must derive from the same canonical visits, assignments and transitions. Publish, reassignment, cancellation, return, expiry and window change create notifications and audit events. Published visits enter Inspector preparation; Draft never appears. One provider/widget failure must not blank unrelated planning content.

## 20. Current implementation conflicts requiring remediation

The attached Conflict Register is authoritative. Highest-priority gaps include:

- planner-only route guards conflict with broad non-admin/non-inspector business access;
- separate `ops` dependency conflicts with the simplified role model;
- `/planning` currently opens a method chooser rather than the required Planning List;
- package is currently treated as mandatory in multiple paths;
- Single search lacks canonical Plant search and can proceed at CR level;
- Bulk criteria currently cover only region/risk/activity class/city with only is/is-not;
- bulk staged selection is browser-only and drafts are not resumable;
- bulk review is fixed to periodic/physical and one package;
- assignment skills/capacity are unverified and auto-overlap/concurrency protection is incomplete;
- Immediate manual required fields/eligibility/reasons/attachments are incomplete;
- list columns/filters/export/session continuity are incomplete;
- return reason is encoded in notes rather than normalized history;
- expiry uses one hard-coded condition rather than configurable rule families;
- role changes are not actionable in Admin.

## 21. One-pass implementation sequence

1. **Independent repo and browser baseline audit** — produce exact current-state and preservation maps before edits.
2. **Canonical data/RBAC/state migrations** — compatibility-safe role capabilities, planning drafts, normalized return/cancel/location histories, package multiplicity, configuration and indices.
3. **Planning list and entry-point convergence** — make `/planning` the canonical list while preserving aliases/routes.
4. **Single + Factory 360/map handoffs** — CR/licence/plant resolution and manual eligibility.
5. **Immediate reconciliation** — preserve and bring to the same manual/provenance/admin contract.
6. **Bulk criteria, persisted selection, eligibility partition and bulk assignment**.
7. **Configuration, optional packages and atomic publish guards**.
8. **Management lifecycle** — details, return, duplicate, cancel, expiry, bulk operations, export, notification/audit.
9. **Admin control plane** — lookups, status rules, expiry/cut-off, role/capability workflow.
10. **Dashboard/downstream reconciliation**.
11. **Automated and in-browser certification** on `127.0.0.1:3000` against the approved staging backend.
12. **Fix/retest loop** until every engineering-controlled acceptance row passes; push one branch, no automatic merge/deploy.

## 22. Kimi execution model

Use `PROMPT_00_MASTER_GOAL_UNDER_4000.txt` with `PROMPT_00_MASTER_EXECUTION_BRIEF.md` attached. The goal is deliberately short; the Markdown is the full authority. Kimi must read the complete repository and all source files, create its detailed plan internally, then loop:

`discover → compare → implement → migrate → test → diagnose → fix → retest → evidence`

Kimi must not stop for progress checkpoints or ask whether to continue. It may stop only for an external credential/contract, a destructive/production action, or a genuine business value that the sources explicitly forbid it to invent.

After implementation, run the separate Browser Certification goal/brief. Kimi must inspect every Planning screen, all statuses, role classes, data sources and documents in Chrome, not merely rely on static tests.

## 23. Final acceptance definition

Planning closes only when:

- all 52 Planning and 46 Management capabilities are mapped to code, test and evidence;
- every detailed Planning line is dispositioned in the atomic source ledger;
- Single/Bulk/Immediate and every entry point work without regression;
- the full list/search/filter/action contract works;
- role simplification is enforced server-side;
- optional package behaviour works;
- multi-licence targeting and manual eligibility are correct;
- bulk partial eligibility + atomic accepted-subset creation works;
- assignment, location, drafts, publish, return, cancellation, expiry and duplicate pass;
- Admin can govern the required lookups/status/rules/capabilities;
- dashboard/inspector/audit/notifications remain consistent;
- English/Arabic, RTL, dark/light, desktop/narrow and accessibility pass;
- browser journeys, RLS negatives, typecheck, build, focused and full regression pass;
- only verified external contracts remain blocked and are surfaced honestly.


---

## Execution attachments

Use every ledger, contract, source extract and original document included in this ZIP. Update the ledgers with code paths, tests, evidence and final status. Do not alter source files in `06_SOURCE_INPUTS`.
