# Claude Design Prompt V5 — CD-026 / SCR-WEB-200 Visit Management Workspace

## Where this prompt goes

Paste this entire document into **Claude Design** in a new project or fresh Claude Design account.

This is not a Claude Code implementation prompt.

The required pipeline is:

1. This prompt directs Claude Design.
2. Claude Design researches and produces the complete CD-026 high-fidelity design package.
3. Claude Design produces a sponsor-gated Claude Code implementation prompt as one deliverable.
4. The sponsor and Codex review the design and wiring package.
5. Only after explicit sponsor design approval may the approved Claude Code prompt be pasted into Claude Code.

Do not implement application code during this task.

---

## 1. Task identity

- Product: Saqeel MVP1 industrial inspection platform.
- Prompt: `CD-026`.
- Task: `TASK-DESIGN-CD026`.
- Screen: `SCR-WEB-200`.
- Screen name: Visit Management Workspace.
- Journey/process: `P03 — Publish and operational visit management`.
- Storyboard: `SB05 — Visit Planning, Management Workspace and Operational Control`.
- Routes currently implemented:
  - `/visits`
  - `/visits/calendar`
  - `/visits/workload`
- Logical map mode: required by `MVP1-M02-039`, but not implemented or wired into Visit Management.
- Current runtime roles with shell access: Planner and Operations.
- Contract persona requiring reconciliation: Branch Manager.
- Engines: `ENG-03`, `ENG-05`, `ENG-06`, `ENG-11`, `ENG-12`.
- Requirements: `MVP1-M02-001..046` plus relevant foundation requirements.
- Acceptance: `AC-0053..AC-0098`, `DSG-021`, `DSG-A11Y-001`, `FND-ACC-001..004`, `FND-ACC-011`, `FND-ACC-013`.
- Design status requested: `READY_FOR_DESIGN_REVIEW_R1`.
- Implementation status: `implementation_authorized: false`.

This task is design-only. Do not edit application code, migrations, database data, tests, product-contract files, Git history, branches or deployment state. Do not commit, push, merge, deploy, reset, clean, stash, discard or modify `main`.

CD-025 R3 correction remains open. CD-026 design may proceed independently because its routes already exist, but no CD-025 route, persisted-review assumption or cross-screen selection state may be invented.

The current product-contract execution slice does not authorize CD-026 implementation. Do not change `CURRENT_SLICE.yaml`. The design package and future Claude Code handoff must remain sponsor-gated.

---

## 2. Baseline safety rule — learned from CD-025

The correct locally verified repository baseline is:

- branch: `main`
- commit: `9360fc9`
- remote `origin/main` observed behind the local branch at the time this prompt was prepared
- local working tree already dirty with unrelated user work
- full no-exclusion Playwright baseline: `99/99 PASS`, zero failures and zero skips

Do not use `setup/Inspection` as the baseline. It is obsolete.

Do not infer that the remote default branch is current merely because a repository connector opens it first.

### Required baseline procedure

1. Try to open `main @ 9360fc9`.
2. Record the exact ref and commit that Claude Design can actually inspect.
3. Confirm that the exact files listed in section 4 exist.
4. Compare their contents with the binding runtime dossier in section 5.
5. If `main @ 9360fc9` is available, use it.
6. If it is unavailable, do not fall back to `setup/Inspection`.
7. You may continue the visual design using this prompt's embedded, locally verified runtime dossier, but every implementation asset must state:

   `BASELINE_REVERIFY_REQUIRED — current local main was not independently accessible to Claude Design`

8. In that case, all file-change and wiring claims remain `HANDOFF_BLOCKED_BASELINE` until Codex re-verifies them locally.

Never downgrade or contradict the binding current-runtime facts merely because an older remote ref differs.

---

## 3. Mandatory read order

Read these sources before composing any frame:

1. `AGENTS.md`
2. `product-contract/00_START_HERE.md`
3. `product-contract/CURRENT_STATE.md`
4. `product-contract/GATE_STATUS.md`
5. `product-contract/execution/CURRENT_SLICE.yaml`
6. `product-contract/execution/TASK_ROUTER.yaml`
7. `product-contract/governance/OPEN_DECISIONS.yaml`
8. `product-contract/governance/DECISIONS_ACCEPTED_2026-07-12_SAQEEL.yaml`
9. `design/claude-design-mvp1/00_START_HERE.md`
10. `design/claude-design-mvp1/CURRENT_UI_BASELINE.md`
11. `design/claude-design-mvp1/authority/SOURCE_AUTHORITY.md`
12. `design/claude-design-mvp1/authority/DESIGN_DECISIONS.md`
13. `design/claude-design-mvp1/authority/CODE_ROUTE_RECONCILIATION.csv`
14. `design/claude-design-mvp1/authority/JOURNEY_SCREEN_MAP.csv`
15. `design/claude-design-mvp1/authority/SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md`
16. `design/claude-design-mvp1/prompts/00_MASTER_DESIGN_CONSTITUTION.md`
17. `design/claude-design-mvp1/prompts/02_SAQEEL_FOUNDATIONS_AND_COMPONENTS.md`
18. `design/claude-design-mvp1/prompts/journeys/P03_PUBLISH_AND_VISIT_MANAGEMENT.md`
19. `design/claude-design-mvp1/prompts/systems/GIS_GEOFENCE_AND_ROUTE_DESIGN.md`
20. `design/claude-design-mvp1/prompts/systems/ARABIC_RTL_ACCESSIBILITY_AND_RESPONSIVE.md`
21. `outputs/claude-design-approval-pack/DESIGN_QUALITY_RATCHET_V4.md`
22. `outputs/claude-design-approval-pack/POST_APPROVAL_VERTICAL_SLICE_SOP_V4.md`
23. `product-contract/screens/screen_route_catalogue.csv`
24. `product-contract/domain/atomic_scope.csv`
25. `product-contract/domain/field_dictionary.csv`
26. `product-contract/domain/rbac_matrix.csv`
27. `product-contract/domain/state_transitions.csv`
28. `product-contract/governance/error_catalogue.csv`
29. `product-contract/evidence/AC_LEDGER.csv`
30. `FABLE_UNDERSTANDING_TRACEABILITY.csv`
31. `FABLE_ACCEPTANCE_UNDERSTANDING.csv`
32. `outputs/claude-design-approval-pack/Saqeel_43_Screen_Claude_Design_Matrix.csv`
33. `outputs/claude-design-approval-pack/CD-025_DESIGN_REVIEW_R2.md`

Where an older narrative conflicts with current source, migrations or this locally verified dossier, record the conflict. Do not silently choose the older statement.

---

## 4. Exact repository files to inspect

### Shared frozen shell

- `apps/web/src/components/Shell.tsx`
- `apps/web/src/components/ShellClient.tsx`
- `apps/web/src/lib/shell-navigation.ts`
- `apps/web/src/app/astryx.css`
- `apps/web/src/app/tokens.css`

### CD-026 current routes

- `apps/web/src/app/visits/page.tsx`
- `apps/web/src/app/visits/loading.tsx`
- `apps/web/src/app/visits/VisitsBoard.tsx`
- `apps/web/src/app/visits/actions.ts`
- `apps/web/src/app/visits/calendar/page.tsx`
- `apps/web/src/app/visits/calendar/CalendarBoard.tsx`
- `apps/web/src/app/visits/workload/page.tsx`

### Adjacent, not automatically in implementation scope

- `apps/web/src/app/visits/[id]/page.tsx`
- `apps/web/src/app/visits/[id]/ActionBar.tsx`
- `apps/web/src/app/visits/[id]/actions.ts`
- `apps/web/src/app/visits/[id]/Attachments.tsx`
- `apps/web/src/app/visits/[id]/NotesEditor.tsx`
- `apps/web/src/app/planning/plans/[id]/page.tsx`

CD-027 owns the full Visit Detail redesign. CD-026 may open `/visits/:id` and may use a concise selected-visit continuity panel, but it must not redesign the complete detail page or duplicate every detail action.

### Map and operations references — inspect, do not assume reusable wiring

- `apps/web/src/components/GeoMap.tsx`
- `apps/web/src/app/operations/OpsMap.tsx`
- `apps/web/src/app/operations/page.tsx`
- `apps/web/src/app/operations/live/LiveOps.tsx`
- `apps/web/src/app/operations/live/LiveMapInner.tsx`

### Security, state, audit and expiry

- `supabase/migrations/0001_foundation.sql`
- `supabase/migrations/0002_rbac_audit.sql`
- `supabase/migrations/0012_admin_dossier_visibility.sql`
- `supabase/migrations/0021_fix_broad_rls.sql`
- `supabase/migrations/0024_fix2_ops_planning_visits.sql`
- `supabase/migrations/0025_scheduled_visit_expiry.sql`
- `supabase/migrations/0031_cd023_assignment_overlap_guard.sql`
- `supabase/migrations/20260714091726_plan_validated_state.sql`
- `supabase/migrations/20260714091727_planning_publish_guards.sql`

### Existing tests

- `apps/web/e2e/persona-tours.spec.ts`
- `apps/web/e2e/shell-navigation.spec.ts`
- `apps/web/e2e/golden-journey.spec.ts`
- all existing CD-020..CD-023 specs

There is no dedicated CD-026 acceptance spec in the current repository. The handoff must propose `apps/web/e2e/cd-026-visit-management.spec.ts`; do not claim it exists or passes.

---

## 5. Binding current-runtime dossier

These facts were locally verified against `main @ 9360fc9`. Treat them as binding design truth.

### 5.1 Current shell

- The accepted shared shell is grouped, role-scoped and responsive.
- Planner navigation exposes Factory 360, Planning and Visit Management.
- Operations navigation exposes Dashboard, Operations Center, Factory 360 and Visit Management.
- The topbar owns navigation search, theme, notifications and the own-account trigger.
- Language and sign-out are inside the account menu.
- Desktop navigation can collapse.
- The responsive drawer already provides focus entry, focus containment, Escape close and focus restoration.
- Arabic is full-document RTL and the drawer opens physically from the correct side.
- Unsupported Analytics, Lookup, Notification Configuration, Integration and AI destinations remain hidden.

Do not render a flat legacy navigation list. Do not propose a new mobile shell. Do not relocate account/language/sign-out to the sidebar.

### 5.2 Current list route

- `/visits` queries RLS-scoped visits, factory identity, plan method, first assignment and inspection state.
- It calls `expire_lapsed_visits()` before the read.
- It loads 100 records initially and can increase the server limit in steps up to 1000.
- Search and filters operate client-side only over the currently loaded rows.
- Search covers Visit ID, Plan/Campaign ID, factory, CR, industrial licence and Inspector.
- Filters cover planning status, type, execution mode, region, city and date range.
- Sort covers window ascending, window descending and factory name.
- KPI tiles are status filters.
- Multi-selection can persist in client state while filters change.
- Current selection is not shared with calendar or workload routes.
- Current filter state is not shared with calendar or workload routes.
- Current filter state is not URL-persisted.
- Saved views do not exist.
- Visit Management export does not exist.

### 5.3 Current state domains

Never collapse these into one status chip.

Planning status is a separate lifecycle:

- `draft`
- `validated`
- `published`
- `returned`
- `cancelled`
- `expired`

Operational state is independent:

- `new`
- `prepared`
- `on_the_way`
- `arrived`
- `executing`
- `submitted`

Inspection, assignment, journey and review states are separate again. Do not infer one from another.

### 5.4 Current calendar route

- `/visits/calendar` loads up to 1000 RLS-scoped visit rows.
- It calls `expire_lapsed_visits()` before rendering.
- It supports Day, Week and Month.
- The calendar places visits by `window_start` using UTC-date helpers.
- KSA weeks are presented Sunday-first.
- A visit opens `/visits/:id`.
- The calendar does not inherit the list route's filters or selected object.
- It does not prove workload capacity, travel time, route feasibility or conflict detection.

### 5.5 Current workload route

- `/visits/workload` reads assignments joined to published visit windows.
- It calls `expire_lapsed_visits()` first.
- It groups active visits per Inspector across six Sunday-first week buckets.
- It excludes submitted operational states.
- The utilization bar is relative to the busiest Inspector in the loaded data.
- No absolute capacity threshold exists.
- No skills, territory, travel time, proximity, work-hours or availability model is proven here.
- The workload route does not inherit list filters or selected Visit identity.

Never label the relative bar as capacity, availability, eligibility, overload or recommendation.

### 5.6 Current map truth

- No `/visits/map` route or Visit Management map mode exists.
- `GeoMap.tsx` and `OpsMap.tsx` exist elsewhere.
- The Operations map can show factory/visit pins based on official factory coordinates.
- That does not prove Visit Management selection/filter continuity.
- Inspector live locations are not provided to CD-026.
- Projected operations movement is not genuine GPS.
- Map tiles are an external dependency.

CD-026 must design the required map lens and its unavailable/list-alternative states, but mark its implementation wiring `HANDOFF_BLOCKED_MAP` until a current query, coordinates, provider/failure behavior, selection state and route ownership are explicitly mapped.

Do not show Inspector live locations, routes, travel time or proximity.

### 5.7 Current bulk actions

Current actions are:

- bulk cancel;
- bulk reschedule;
- bulk reassign;
- bulk edit Visit type and/or notes.

They iterate selected Visit IDs one by one. They are not one atomic all-or-nothing transaction.

Per-item partial success is expected and must be visible.

The current action functions can:

- update one Visit and fail another;
- update a Visit or assignment, then fail while inserting the notification row;
- return raw Supabase/database error messages to the client;
- label mixed success through a general success banner if at least one item changed.

The design must correct the user experience without pretending the backend is already corrected:

- never expose raw provider/database errors;
- never call a mixed result simply successful;
- show one authoritative per-item outcome ledger;
- distinguish `Applied`, `Blocked before change`, and `Change applied — notification not queued`;
- preserve the affected Visit IDs and reasons;
- make retry scope explicit;
- do not retry already-applied mutations blindly;
- keep implementation correction rows separate from visual approval.

### 5.8 Current bulk-guard gaps

The product contract says bulk edit is restricted to child visits belonging to the same Visit Plan. Current list selection can include Visits from different plans and the actions do not enforce same-plan scope.

The product contract says rescheduling validates planning conflicts. Current bulk reschedule validates dates and `published/new`, but does not authoritatively recheck Inspector overlap after changing the Visit window.

The product contract says reassignment validates eligibility and workload. Current bulk reassign checks that inspection has not started and that an assignment row exists, but it does not prove absolute capacity, travel, skills, territory or availability.

Therefore:

- mixed-plan bulk edit must be visibly ineligible and `HANDOFF_BLOCKED_GUARD` for implementation;
- bulk reschedule conflict assurance must not be claimed;
- Inspector workload is evidence, not an eligibility recommendation;
- the action preview must say what is verified and what will be rechecked;
- no green `safe` label may appear without an authoritative guard.

### 5.9 Notification and audit truth

- Successful Visit and assignment mutations are captured by append-only table audit triggers.
- `expire_lapsed_visits()` performs the canonical Published→Expired transition and inserts in-app expiry notifications in the same database operation.
- Bulk application actions insert notification rows after individual mutations.
- A notification row is not proof of external delivery, receipt, opening or acceptance.
- Current strings such as `inspector notified` overclaim where only a row was inserted.

Use `notification queued` or the exact proven in-app state. Do not claim push delivery.

### 5.10 Role truth

- Runtime role keys include `planner`, `ops`, `inspector`, `reviewer`, `auditor`, `leadership` and the governed Admin roles.
- There is no `branch_manager` runtime role key.
- The catalogue names Branch Manager for SCR-WEB-200.
- Shell visibility currently exposes Visit Management to Planner and Operations only.
- RLS may allow some adjacent roles to read Visit rows for their own governed purposes, but that does not make them Visit Management actors.
- The current CD-026 routes do not contain a dedicated Planner/Operations route guard comparable to the dashboard guard.

Do not invent Branch Manager permissions or map Branch Manager silently to Operations. Mark it `HANDOFF_BLOCKED_ROLE_MAPPING`.

Design a direct-route unauthorized/not-in-scope state. The handoff must separately identify the missing explicit route guard if current code still lacks one.

### 5.11 Freshness truth

- Factory `source_synced_at` exists, but the current Visit list query does not select or display it.
- There is no approved generic freshness threshold for Visit Management.
- Exact last-checked or source timestamps may be shown only when actually queried.
- A Visit can become stale while selected because status, assignment or window can change concurrently.

Do not invent a stale-after duration. Use proven version/state change, a failed recheck or an authoritative updated timestamp.

---

## 6. Requirement and acceptance register

Every row below remains mandatory. Trace each row in `ACCEPTANCE_CHECKLIST_CD-026.md` and `WIRING_MAP_CD-026.csv`.

| Requirement | Acceptance | Obligation |
|---|---|---|
| MVP1-M02-001 | AC-0053 | Visit Management workspace |
| MVP1-M02-002 | AC-0054 | Visit KPIs and KPI-to-filter behavior |
| MVP1-M02-003 | AC-0055 | Search Visits |
| MVP1-M02-004 | AC-0056 | Filter Visits |
| MVP1-M02-005 | AC-0057 | Open Visit details |
| MVP1-M02-006 | AC-0058 | Edit only allowed Visit fields with validation/audit |
| MVP1-M02-007 | AC-0059 | Bulk edit child Visits |
| MVP1-M02-008 | AC-0060 | Returned Visit handling |
| MVP1-M02-009 | AC-0061 | Republish returned Visit and notify correctly |
| MVP1-M02-010 | AC-0062 | Cancel Visit with mandatory reason |
| MVP1-M02-011 | AC-0063 | Bulk cancel with per-item truth |
| MVP1-M02-012 | AC-0064 | Duplicate active Visit validation |
| MVP1-M02-013 | AC-0065 | Activity timeline |
| MVP1-M02-014 | AC-0066 | Audit trail |
| MVP1-M02-015 | AC-0067 | Canonical Visit status transitions |
| MVP1-M02-016 | AC-0068 | Expired Visit management |
| MVP1-M02-017 | AC-0069 | Visit Plan parent/child detail |
| MVP1-M02-018 | AC-0070 | Assignment overview without invented capacity |
| MVP1-M02-019 | AC-0071 | Visit Management operational workspace |
| MVP1-M02-020 | AC-0072 | Planning KPI summary |
| MVP1-M02-021 | AC-0073 | Advanced search including Plan/Campaign ID |
| MVP1-M02-022 | AC-0074 | Advanced filters |
| MVP1-M02-023 | AC-0075 | Sort, group, select and open Visit list |
| MVP1-M02-024 | AC-0076 | View complete Visit information |
| MVP1-M02-025 | AC-0077 | Edit allowed Visit data |
| MVP1-M02-026 | AC-0078 | Reassign Inspector with authoritative guards |
| MVP1-M02-027 | AC-0079 | Reschedule with conflict validation |
| MVP1-M02-028 | AC-0080 | Cancel with reason, audit and notification truth |
| MVP1-M02-029 | AC-0081 | Process a returned Visit |
| MVP1-M02-030 | AC-0082 | Republish same Visit identity |
| MVP1-M02-031 | AC-0083 | Bulk edit only within one Visit Plan |
| MVP1-M02-032 | AC-0084 | Bulk reassign only not-started Visits |
| MVP1-M02-033 | AC-0085 | Bulk reschedule only not-started Visits with conflict validation |
| MVP1-M02-034 | AC-0086 | Bulk cancel only not-started Visits |
| MVP1-M02-035 | AC-0087 | Visit Plan summary and children |
| MVP1-M02-036 | AC-0088 | Campaign progress derived from child states |
| MVP1-M02-037 | AC-0089 | Assignment Centre/read-only workload evidence |
| MVP1-M02-038 | AC-0090 | Day/Week/Month calendar |
| MVP1-M02-039 | AC-0091 | Planning-related map view and location selection |
| MVP1-M02-040 | AC-0092 | Conflict validation centre |
| MVP1-M02-041 | AC-0093 | Planning-event notifications |
| MVP1-M02-042 | AC-0094 | Visit attachments lifecycle |
| MVP1-M02-043 | AC-0095 | Authorized internal notes |
| MVP1-M02-044 | AC-0096 | Immutable system-generated activity timeline |
| MVP1-M02-045 | AC-0097 | Immutable audit history |
| MVP1-M02-046 | AC-0098 | Automatic Published→Expired and read-only expiry |

Foundation requirements to trace:

- `MVP1-FND-001`: RLS/RBAC least privilege.
- `MVP1-FND-002`: separate state machines.
- `MVP1-FND-003`: append-only audit.
- `MVP1-FND-004`: notification truth.
- `MVP1-FND-011`: semantic tokens and non-color status.
- `MVP1-FND-013`: source/provenance/freshness when data exists.

---

## 7. Primary user decision and design thesis

The 30-second decision is:

`Which Visits require intervention now, which action is actually allowed, and can the selected set be changed without silently crossing Plan, lifecycle or authorization boundaries?`

Design one synchronized operational workspace with stable query context and explicit object continuity.

The page must reduce these current costs:

1. Users rebuild filters and mental context when moving among List, Calendar and Workload.
2. Planning status and operational state can be mistaken for one lifecycle.
3. Bulk actions expose all controls at once, even when selected Visits belong to different Plans or states.
4. Mixed bulk outcomes are reduced to multiline banners instead of recoverable per-item evidence.
5. The map requirement is invisible rather than truthfully unavailable.
6. Workload percentages look like capacity even though they are only relative counts.

### Signature objective

Create at most one new signature pattern for CD-026:

**Selected Visit Continuity Spine** — one stable selected Visit identity, scope and allowed-action context that remains visibly the same across List, Calendar, Workload and the designed Map lens.

This is a design objective, not a forced visual solution. Claude Design must still compare three equal-fidelity hypotheses.

The signature succeeds only if it:

- reduces re-identification effort;
- prevents action on the wrong Visit or Plan;
- separates planning and operational state;
- preserves filters and selected identity conceptually across modes;
- works without a map;
- works by keyboard and screen reader;
- degrades truthfully when continuity is not yet implemented.

Do not add a second novelty pattern for the bulk result. Integrate the per-item outcome ledger into the same continuity model.

---

## 8. Mandatory equal-fidelity hypotheses

Before choosing the final design, create three equal-fidelity primary decision zones.

### Hypothesis A — Coordinated lenses

- Stable query/selection header.
- List as precision anchor.
- Calendar, Workload and Map as coordinated lenses over the same set.
- Selected Visit continuity panel persists across lenses.
- Bulk actions derive from the selected set.

### Hypothesis B — Exception queue first

- Attention-required Visits form the starting work queue.
- List precision remains primary evidence.
- Calendar/Workload/Map explain the selected exception.
- Selection and allowed action remain visible.

### Hypothesis C — Schedule context first

- Calendar/workload context starts the decision.
- Selecting a time/resource cell reveals exact Visits.
- The table remains the authoritative action and audit surface.
- Map remains optional and non-authoritative.

The three hypotheses must differ in information architecture and task sequence, not colors, card order or density.

Compare them against:

- time to locate an intervention Visit;
- risk of acting on the wrong Plan or lifecycle state;
- clarity of partial bulk outcomes;
- object continuity across routes;
- density and scan precision;
- map independence;
- Arabic RTL integrity;
- keyboard burden;
- 412px reflow;
- implementation truth;
- ability to preserve the accepted shell.

Select one. Explain why it wins. Do not self-score `5/5`.

Create one counterfactual with the continuity pattern removed and state the measurable loss.

---

## 9. Mandatory workspace composition

The final chosen design must include the following, but hierarchy is yours to solve.

### 9.1 Exact shared shell

Use the current grouped, role-scoped shell exactly.

Show at minimum:

- Planner desktop shell with Visit Management active;
- Operations desktop shell with Visit Management active;
- collapsed desktop state;
- 412px closed drawer;
- 412px open drawer;
- Arabic RTL physical mirroring;
- current topbar search/theme/notifications/account ownership.

Do not redesign the shell.

### 9.2 Workspace scope bar

The page-specific workspace header must make visible:

- role/scope, without pretending navigation is authorization;
- result count and loaded count;
- exact filter scope;
- selected Visit or selected-set identity;
- current lens;
- exact last recheck time only if sourced;
- recheck action where appropriate;
- an explicit map-wiring unavailable state rather than a fake map.

### 9.3 Filters

Design one filter model shared across lenses:

- search;
- planning status;
- operational state;
- Visit type;
- execution mode;
- region;
- city;
- date range;
- Inspector;
- Plan/Campaign;
- clear/reset;
- visible active-filter summary;
- result and selected counts.

Do not claim saved filters exist. A Saved Views treatment may be designed, but mark persistence `HANDOFF_BLOCKED_SAVED_VIEWS` unless a current storage contract is found.

Do not silently apply filters only to 100 loaded rows while labelling the result as the full RLS-scoped dataset. The design must distinguish loaded/total or require server-side query wiring.

### 9.4 List lens

The list is the precision and accessibility anchor.

It must show:

- Visit identity;
- Plan/Campaign identity;
- factory name and governed identifiers;
- planning status;
- operational state;
- Visit type and execution mode;
- Inspector assignment;
- window start/end;
- location availability/provenance where available;
- action eligibility reason;
- selection state;
- stale/concurrent state;
- open-detail path.

Use a native semantic table for desktop. Do not turn it into an ARIA grid unless composite keyboard behavior is truly required and fully specified.

### 9.5 Calendar lens

Preserve Day/Week/Month and Sunday-first KSA week behavior.

The selected Visit must remain identifiable through Visit ID, factory, state and window—not color alone.

Do not use drag-and-drop to imply rescheduling unless the exact guarded write path and accessible alternative are mapped. The current runtime has no safe drag reschedule.

Provide a list/day alternative at narrow width. Do not delete information merely to keep a miniature month grid.

### 9.6 Workload lens

Show assignment counts by Inspector and time bucket.

Use wording such as:

- `Relative assigned load`;
- `Active Visit count`;
- `Compared with the busiest Inspector in this result set`.

Do not use:

- `Capacity`;
- `Available`;
- `Overloaded`;
- `Recommended Inspector`;
- `Utilization against capacity`.

Selecting an Inspector may filter the Visit set, but this behavior must be explicitly designed and mapped.

### 9.7 Map lens

Design the required Map lens at full fidelity, including:

- official factory coordinates only;
- source/provenance and no-coordinate state;
- selected Visit ↔ selected pin continuity;
- legend with shape and label in addition to color;
- list/table equivalent;
- loading, tile failure, provider unavailable, partial coordinates and no results;
- keyboard-accessible non-map selection;
- Arabic labels and mixed-direction IDs;
- provider attribution area;
- reduced-motion behavior.

Do not show Inspector live position, travel path, travel time, route feasibility, proximity or geofence truth in CD-026.

Every map implementation row remains `HANDOFF_BLOCKED_MAP` unless exact current wiring is found and proven.

### 9.8 Selected Visit continuity panel

The selected object surface must show only the information needed to preserve identity and action context:

- full Visit ID;
- factory;
- Plan/Campaign;
- planning status;
- operational state;
- assignment;
- window;
- current lens context;
- allowed action summary;
- reason an action is unavailable;
- open full Visit detail.

Do not duplicate CD-027's complete dossier, attachments, notes, audit timeline or all actions.

### 9.9 Bulk action eligibility and preview

The bulk action bar must appear only after selection and must not present every action as universally valid.

Before confirmation, show:

- selected total;
- same-Plan count;
- eligible count;
- blocked count;
- reasons grouped by exact Visit IDs;
- verified facts versus submit-time rechecks;
- notification consequence as queued, not delivered;
- whether partial success is possible.

Mandatory blockers include:

- mixed Visit Plans for bulk edit;
- started inspections for reassign/reschedule/cancel;
- final Expired/Cancelled state;
- returned-state restrictions;
- missing assignment;
- unauthorized/out-of-scope row;
- changed/stale row;
- invalid date window;
- unavailable authoritative validation source.

Do not imply all-or-nothing behavior for these current actions.

### 9.10 Per-item outcome ledger

After submit, show one result row per selected Visit with:

- Visit ID and factory;
- requested action;
- `Applied`;
- `Blocked before change`;
- `Change applied — notification not queued`;
- neutral reason;
- whether retry is safe;
- open Visit detail;
- retry only failed-safe rows where the action semantics support it.

Do not use one green success banner for mixed outcomes.

Do not expose SQL, table, schema, policy, provider, PostgREST or Supabase error text.

### 9.11 Export

The product matrix mentions export, but CD-026 has no current export component or action.

Design the placement and scope explanation only if useful. Mark it `HANDOFF_BLOCKED_EXPORT` until a server/client export path, field masking, locale encoding, RLS scope and test are mapped.

Do not copy `OpsExport` automatically; it is owned by Operations datasets.

---

## 10. Role/action matrix

Produce `ROLE_ACTION_MATRIX_CD-026.csv`.

At minimum include:

- Planner;
- Operations;
- Inspector direct-route attempt;
- Reviewer direct-route attempt;
- Auditor direct-route attempt;
- Leadership direct-route attempt;
- Branch Manager contract persona.

For each, map:

- shell visibility;
- route access;
- RLS read scope;
- row selection;
- bulk edit;
- bulk reassign;
- bulk reschedule;
- bulk cancel;
- map visibility;
- export;
- open Visit detail;
- audit visibility;
- exact evidence;
- `PASS`, `HANDOFF_BLOCKED` or `NOT_AUTHORIZED`.

Do not invent Branch Manager mapping.

---

## 11. Mandatory state set

Build a state selector inside the `.dc.html` covering at least these individually reviewable states:

1. Initial workspace loading.
2. Populated Planner list.
3. Populated Operations list.
4. RLS-scoped empty state.
5. No search/filter matches.
6. Visit query failure with neutral recovery.
7. Inspector-pool query failure isolated from Visit list.
8. Expiry RPC/recheck failure isolated and truthfully labelled.
9. List lens with one selected Visit.
10. Calendar lens with the same selected Visit.
11. Workload lens with the same selected Visit/Inspector context.
12. Map lens design with the same selected Visit.
13. Map wiring unavailable.
14. Map tiles/provider unavailable with list alternative.
15. Visit missing coordinates.
16. Planning and operational states shown separately.
17. Returned Visit.
18. Cancelled final Visit.
19. Expired final/read-only Visit.
20. Started Visit whose planning actions are blocked.
21. Mixed-Plan selection.
22. Same-Plan eligible selection.
23. Stale selection after concurrent change.
24. Bulk action validation failure with inputs preserved.
25. Bulk submit in progress with double-submit prevention.
26. All selected items applied.
27. All selected items blocked.
28. Mixed partial outcome.
29. Mutation applied but notification row failed.
30. Unauthorized direct route.
31. Branch Manager role mapping unresolved.
32. Saved Views unavailable.
33. Export unavailable.
34. Narrow list/card adaptation.
35. Arabic RTL narrow hard state.
36. Dark theme.
37. Light theme.
38. Keyboard focus transfer to bulk outcome summary.
39. Screen-reader status/alert announcement evidence.
40. Reduced-motion selection continuity.

Do not combine states in a way that prevents individual sponsor review.

---

## 12. Reconciled design sample

Use one internally consistent, clearly illustrative data set across every frame.

Requirements:

- at least 12 Visits;
- at least two Plans/Campaigns;
- one Immediate Visit without a Plan;
- realistic Saudi regions/cities;
- clearly fictional factory names;
- English and Arabic factory-name variants;
- mixed-direction Visit/Plan IDs wrapped correctly;
- planning and operational states that do not contradict each other;
- at least one Returned, Cancelled and Expired Visit;
- at least one started Visit;
- at least one missing-coordinate Visit;
- one same-Plan five-Visit bulk selection;
- one mixed-Plan selection;
- one partial result where three apply, one is blocked before mutation and one changes but its notification row fails.

Every count must reconcile across KPI, List, Calendar, Workload, Map, selection bar and outcome ledger.

Label prototype data outside the product surface as `DESIGN SAMPLE — NOT LIVE`.

Do not present the sample as a real Ministry operational dataset.

---

## 13. Arabic, RTL, responsive and theme requirements

Arabic is first-class.

Provide the same hard state in:

- English LTR dark desktop at 1440px;
- English LTR light desktop at 1440px;
- Arabic RTL dark desktop at 1440px;
- Arabic RTL light desktop at 1440px;
- constrained desktop/tablet at 1024px;
- English narrow at 412px;
- Arabic RTL narrow at 412px.

Use realistic long Arabic labels and factory names.

Requirements:

- full document `lang="ar" dir="rtl"`;
- physical RTL composition, not only text alignment;
- stable logical reading and keyboard order;
- `bdi` or equivalent isolation for IDs, CR/licence values, dates and mixed text;
- Arabic numerals follow the existing locale behavior;
- tables retain all information through controlled horizontal scrolling or a semantic narrow alternative;
- the bulk action and outcome states remain complete at 412px;
- no desktop-only hover action;
- both themes preserve semantic meaning and contrast;
- no green/red-only outcome coding.

Do not shrink text below the Saqeel foundation scale to make the dense workspace fit.

---

## 14. Accessibility and keyboard contract

Meet WCAG 2.2 AA and `DSG-A11Y-001`.

Specify and demonstrate:

- skip-to-content target;
- semantic headings and named regions;
- native table semantics with `th scope="col"`;
- labelled checkboxes with full Visit identity;
- indeterminate select-all state;
- visible focus in both themes;
- keyboard-reachable filter controls;
- keyboard-reachable lens switch;
- no map dependency for completion;
- no drag dependency;
- selected Visit continuity announced without excessive live-region noise;
- bulk validation summary receives focus after failed submit;
- summary links focus the exact Visit row;
- bulk progress uses `role="status"`;
- partial/failure outcome uses one `role="alert"` summary plus the semantic outcome table;
- success focus moves to a real heading or labelled summary;
- returned focus after closing drawers/dialogs;
- 48px touch targets where the established shell/component contract requires them;
- 16px input text;
- reduced motion for selection continuity and map focus;
- table reflow/controlled two-dimensional scrolling without loss of functionality;
- screen-reader wording that distinguishes planning status from operational state.

Do not invent an ARIA grid merely to imitate a schedule board.

---

## 15. Security, audit and failure contract

- RLS remains authoritative.
- Shell visibility is not authorization.
- A direct-route unauthorized state is mandatory.
- Never expose raw Supabase/Postgres/provider errors.
- Never display a record the current caller cannot read.
- Never imply external notification delivery.
- Never mutate workflow state directly from design-only client controls.
- Never call a partial bulk result atomic or successful.
- Never silently remove failed/stale selected Visits.
- Never retry already-applied mutations without idempotency evidence.
- Never overwrite concurrent changes.
- Never unlock submitted inspection content.
- Never invent a support contact or escalation route.
- Never invent capacity, travel, proximity, skills, territory or availability policy.
- Never invent freshness thresholds.
- Never invent a Branch Manager role mapping.

The design annotation must distinguish:

- UI preview;
- server guard;
- canonical transition;
- database mutation;
- audit trigger;
- notification-row insertion;
- provider delivery;
- user receipt/acceptance.

---

## 16. Primary-source research ledger

Research informs principles only. Do not copy brands, screenshots, component styling or information architecture wholesale.

Inspect at least these primary sources:

1. Microsoft Dynamics 365 Field Service Schedule Board  
   `https://learn.microsoft.com/en-us/dynamics365/field-service/work-with-schedule-board`

   Examine filters, time scales, list/Gantt/map modes, contextual details and the distinction between manual booking and constraint-aware scheduling. Adopt coordinated context. Reject Dynamics chrome, drag-to-book assumptions and any constraints Saqeel cannot prove.

2. ArcGIS Dashboards Actions  
   `https://doc.arcgis.com/en/dashboards/latest/create-and-share/actions.htm`

   Examine selection-driven filtering and source/target relationships. Adopt stable object continuity. Reject ArcGIS dashboard styling and any implication that ArcGIS is Saqeel's chosen provider.

3. IBM Carbon Data Table  
   `https://carbondesignsystem.com/components/data-table/usage/`

   Examine selection, indeterminate select-all, batch-action mode, toolbar scope, pagination, loading and keyboard behavior. Adopt interaction discipline. Reject Carbon visual styling and AI variants.

4. SAP Fiori floorplan overview  
   `https://experience.sap.com/fiori-design-web/floorplan-overview/`

   Examine find-and-act lists and adaptive list-detail continuity. Adopt floorplan discipline. Reject SAP shell and styling.

5. W3C WCAG 2.2 Understanding  
   `https://www.w3.org/WAI/WCAG22/understanding/`

   Cover Reflow, Focus Appearance, Target Size, Status Messages, Keyboard and non-color communication.

6. WAI-ARIA Authoring Practices  
   `https://www.w3.org/WAI/ARIA/apg/patterns/`

   Use native table, dialog, tabs and focus-management guidance. Reject unnecessary composite-widget complexity.

7. Saudi Digital Government Authority accessibility guidance  
   `https://dga.gov.sa/en/digital-knowledge/web-accessibility-disabilities-and-elderly-people`

   Use as Saudi public-service accessibility evidence. Do not replace Saqeel identity with an external visual system.

Return `RESEARCH_LEDGER_CD-026.csv` with:

- source;
- date accessed;
- primary-source status;
- observed principle;
- treatment adopted;
- treatment rejected;
- Saqeel-specific reason;
- frame/component influenced;
- capability not authorized by the source.

---

## 17. Current-screen critique and family drift audit

Before final frames, return:

1. the three highest-cost current decision failures;
2. what current behavior must be preserved;
3. what visual/interaction structure may change safely;
4. what remains blocked by runtime/data/role gaps;
5. a family comparison against the strongest accepted CD-021..CD-025 Planning grammar;
6. a shell regression comparison against `TASK-WEB-SHELL-001`;
7. a drift audit because the programme requires one after CD-026.

The drift audit must answer:

- Is CD-026 more generic than the strongest accepted Planning screen?
- Did density become a wall of cards?
- Did the signature pattern create extra work?
- Did Arabic/narrow lose content?
- Did a map become theatre?
- Did status language drift?
- Did any unsupported action become visually enabled?
- Did shell ownership move?
- Did a P2 preference displace a P0/P1 truth?

Revise internally until no P0/P1 drift remains. Do not self-approve.

---

## 18. Component inheritance and exact file disposition

Return `COMPONENT_MAP_CD-026.csv` and `IMPLEMENTATION_MANIFEST_CD-026.yaml`.

Classify every exact file/component as:

- `PRESERVE`;
- `UPDATE_AFTER_APPROVAL`;
- `CREATE_AFTER_APPROVAL`;
- `REMOVE_REQUIRES_HUMAN_APPROVAL`;
- `HANDOFF_BLOCKED_*`.

The manifest must include, for every exact path:

- before responsibility;
- disposition;
- after responsibility;
- design node/frame;
- exact component/export/selector/token;
- protected behavior;
- dependencies;
- role/RLS impact;
- state-transition impact;
- audit impact;
- notification impact;
- Arabic/RTL impact;
- theme impact;
- responsive impact;
- accessibility impact;
- tests;
- rollback;
- implementation blocker.

Do not list only directories. Do not guess filenames.

Likely candidates requiring verification include:

- `apps/web/src/app/visits/page.tsx`
- `apps/web/src/app/visits/VisitsBoard.tsx`
- `apps/web/src/app/visits/actions.ts`
- `apps/web/src/app/visits/calendar/page.tsx`
- `apps/web/src/app/visits/calendar/CalendarBoard.tsx`
- `apps/web/src/app/visits/workload/page.tsx`
- a proposed shared workspace query/state component;
- proposed map lens files;
- proposed localization keys;
- `apps/web/src/app/astryx.css` only where existing semantic classes cannot express the design;
- `apps/web/src/app/tokens.css` only for genuinely semantic reusable tokens;
- `apps/web/e2e/cd-026-visit-management.spec.ts` as proposed evidence.

Do not change the shared shell files unless a demonstrated P0/P1 shell defect exists. CD-026 should consume them, not redesign them.

---

## 19. Wiring map — mandatory

Return `WIRING_MAP_CD-026.csv` with one row per user action and system state.

Required columns:

- action/state ID;
- user role;
- UI trigger;
- client component;
- route;
- server component/action;
- validation;
- authoritative guard;
- canonical transition;
- table/RPC/storage/provider;
- RLS/grant/role;
- audit event/source;
- notification/side effect;
- success result;
- partial result;
- failure result;
- preserved user state;
- focus/status behavior;
- automated test;
- runtime evidence;
- status.

At minimum map:

- list load;
- expiry recheck;
- search;
- each filter;
- KPI filter;
- sort;
- load more/pagination;
- select one;
- select visible;
- clear selection;
- switch to Calendar;
- switch to Workload;
- switch to Map;
- open selected Visit;
- save view;
- export;
- bulk edit;
- bulk reassign;
- bulk reschedule;
- bulk cancel;
- mixed-Plan rejection;
- stale-selection rejection;
- started-Visit rejection;
- partial success;
- notification insertion failure after mutation;
- query/provider degraded state;
- direct-route unauthorized state;
- Arabic/theme/responsive state.

Use `HANDOFF_BLOCKED` for missing legs. Never invent a handler, RPC, policy, provider, role, atomicity guarantee, audit event or side effect.

---

## 20. Required design package

Return one synchronized archive containing:

1. `CD-026 Visit Management Workspace.dc.html`
2. `CD-026 Visit Management Workspace.standalone.html`
3. `IMPLEMENTATION_MANIFEST_CD-026.yaml`
4. `COMPONENT_MAP_CD-026.csv`
5. `WIRING_MAP_CD-026.csv`
6. `STATE_MATRIX_CD-026.csv`
7. `ROLE_ACTION_MATRIX_CD-026.csv`
8. `VIEW_CONTINUITY_MATRIX_CD-026.csv`
9. `RESEARCH_LEDGER_CD-026.csv`
10. `ACCEPTANCE_CHECKLIST_CD-026.md`
11. `CLAUDE_CODE_HANDOFF_CD-026.md`
12. `CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-026.md`
13. `FAMILY_DRIFT_AUDIT_CD-026.md`
14. PNG exports listed below.

The Claude Code files are deliverables from Claude Design, but they must say:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

They must also contain:

- `implementation_authorized: false`;
- current verified baseline/ref;
- dirty-worktree warning;
- exact file list;
- protected behaviors;
- all blocked legs;
- no direct main work;
- no commit/push/merge/deploy authorization;
- requirement for path-by-path diff reporting;
- required tests and evidence;
- stop condition if the baseline differs.

---

## 21. Required PNG evidence

Export at minimum:

- `CD-026_SCR-WEB-200_HYP-A_dark_en_desktop.png`
- `CD-026_SCR-WEB-200_HYP-B_dark_en_desktop.png`
- `CD-026_SCR-WEB-200_HYP-C_dark_en_desktop.png`
- `CD-026_SCR-WEB-200_PRIMARY_dark_en_desktop.png`
- `CD-026_SCR-WEB-200_PRIMARY_light_en_desktop.png`
- `CD-026_SCR-WEB-200_PRIMARY_dark_ar_desktop.png`
- `CD-026_SCR-WEB-200_PRIMARY_light_ar_desktop.png`
- `CD-026_SCR-WEB-200_PRIMARY_dark_en_1024.png`
- `CD-026_SCR-WEB-200_PRIMARY_dark_en_412.png`
- `CD-026_SCR-WEB-200_PRIMARY_light_ar_412.png`
- `CD-026_SCR-WEB-200_CALENDAR_dark_en_desktop.png`
- `CD-026_SCR-WEB-200_WORKLOAD_dark_en_desktop.png`
- `CD-026_SCR-WEB-200_MAP-BLOCKED_dark_en_desktop.png`
- `CD-026_SCR-WEB-200_MIXED-PLAN-BLOCK_dark_en_desktop.png`
- `CD-026_SCR-WEB-200_PARTIAL-BULK_dark_en_desktop.png`
- `CD-026_SCR-WEB-200_STALE-SELECTION_light_ar_412.png`
- `CD-026_SCR-WEB-200_UNAUTHORIZED_dark_en_desktop.png`
- `CD-026_SCR-WEB-200_DRAWER-OPEN_dark_ar_412.png`
- `CD-026_SCR-WEB-200_COUNTERFACTUAL_dark_en_desktop.png`

Every PNG must carry a stable frame ID outside product UI. Do not put design commentary inside the product surface.

---

## 22. Acceptance checklist before return

Do not return the package until all are true:

- exact screen/task IDs are correct;
- current ref is recorded honestly;
- `setup/Inspection` is not treated as current;
- current shell is inherited exactly;
- Planner and Operations shells are role-correct;
- Branch Manager remains blocked pending mapping;
- the design does not claim a current wired Visit Management map;
- map/list equivalence is designed;
- filters, selected Visit and lens continuity are explicit;
- implementation persistence is not invented;
- planning status and operational state remain separate;
- current relative workload is not called capacity;
- no travel/proximity/skills/availability recommendation appears;
- same-Plan bulk-edit rule is visible;
- started/final/stale/out-of-scope action guards are visible;
- bulk actions are presented as per-item and potentially partial;
- mixed outcomes use a per-item ledger, not a green success banner;
- mutation-applied/notification-failed is distinct;
- raw backend/provider errors never appear;
- notification queued is not called delivered;
- no freshness duration is invented;
- all 40 states are individually selectable;
- the sample counts reconcile across every lens;
- dark/light parity is complete;
- Arabic RTL is complete;
- 1024px and 412px states preserve functionality;
- native table semantics are used;
- keyboard order, focus transfer, status and alert behavior are evidenced;
- reduced motion is specified;
- three hypotheses are equal fidelity;
- chosen hypothesis superiority is explained without numerical self-scoring;
- one counterfactual proves the signature interaction's value;
- family drift audit is complete;
- every action appears in the wiring map;
- missing legs are `HANDOFF_BLOCKED`;
- all deliverables agree with each other;
- `implementation_authorized: false` is explicit;
- final status is `READY_FOR_DESIGN_REVIEW_R1`.

---

## 23. Final response format

Return:

1. baseline/ref and repository-access result;
2. current-screen critique;
3. route/role/runtime truth memo;
4. research ledger summary;
5. three hypothesis comparison;
6. selected direction and counterfactual;
7. frame index and state coverage;
8. Arabic/theme/responsive/accessibility evidence;
9. exact component/file disposition;
10. protected-behavior register;
11. blocked-leg register;
12. synchronized archive contents;
13. sponsor review instructions;
14. final status `READY_FOR_DESIGN_REVIEW_R1`.

Do not self-approve. Do not claim implementation readiness. Do not implement.

