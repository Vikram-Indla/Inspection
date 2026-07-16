# Claude Design R1 Prompt — CD-004 / SCR-ADM-001

## Task boundary

Design and deterministic handoff documentation only. Do not edit Saqeel application code, tests, migrations, policies, runtime data, the shared shell, global contract records, or Git history.

Design the Saqeel Admin control-plane home for `CD-004 / SCR-ADM-001 /admin`. This is an evidence-led redesign of a functioning route, not a greenfield dashboard. The result must be premium, inspection-specific, Arabic-first, accessible, and truthful about every data and backend leg.

The Claude Code prompt you return is a future handoff artifact only. Put this exact banner at its top:

> **NOT EXECUTABLE — SPONSOR DESIGN APPROVAL, INDEPENDENT WIRING AUDIT, EXPLICIT IMPLEMENTATION AUTHORIZATION, AND A CLEAN DEDICATED WORKTREE ARE REQUIRED.**

## Read first, in order

1. `AGENTS.md`
2. `product-contract/00_START_HERE.md`
3. `product-contract/CURRENT_STATE.md`
4. `product-contract/GATE_STATUS.md`
5. `product-contract/execution/CURRENT_SLICE.yaml`
6. `product-contract/execution/TASK_ROUTER.yaml`
7. `product-contract/governance/OPEN_DECISIONS.yaml`
8. `product-contract/sessions/HANDOFF_2026-07-14_ADMIN_CONTROL_PLANE_PARALLEL_START.md`
9. `outputs/claude-design-approval-pack/admin-control-plane-suite/PARALLEL_OWNERSHIP.yaml`
10. `outputs/claude-design-approval-pack/admin-control-plane-suite/ADMIN_MASTER_FOUNDATION_V1.md`
11. `outputs/claude-design-approval-pack/admin-control-plane-suite/ADMIN_QUALITY_GATE_V1.md`
12. `outputs/claude-design-approval-pack/admin-control-plane-suite/ADMIN_COMPONENT_INHERITANCE_LEDGER_V1.md`
13. `design/claude-design-mvp1/00_START_HERE.md`
14. `design/claude-design-mvp1/CURRENT_UI_BASELINE.md`
15. `design/claude-design-mvp1/authority/SOURCE_AUTHORITY.md`
16. `design/claude-design-mvp1/authority/DESIGN_DECISIONS.md`
17. `design/claude-design-mvp1/authority/CODE_ROUTE_RECONCILIATION.csv`
18. `design/claude-design-mvp1/authority/JOURNEY_SCREEN_MAP.csv`
19. `design/claude-design-mvp1/authority/STORYBOARD_COVERAGE_MAP.csv`
20. `design/claude-design-mvp1/prompts/00_MASTER_DESIGN_CONSTITUTION.md`
21. `outputs/claude-design-approval-pack/DESIGN_QUALITY_RATCHET_V4.md`
22. `design/claude-design-mvp1/prompts/01_CODE_AND_RUNTIME_DISCOVERY.md`
23. `design/claude-design-mvp1/prompts/02_SAQEEL_FOUNDATIONS_AND_COMPONENTS.md`
24. `design/claude-design-mvp1/prompts/journeys/P00_PRE_DAY_ZERO_ADMIN_CONFIGURATION.md`
25. `design/claude-design-mvp1/prompts/systems/ARABIC_RTL_ACCESSIBILITY_AND_RESPONSIVE.md`
26. `design/claude-design-mvp1/prompts/systems/NOTIFICATIONS_SLA_AND_REALTIME_ALERTS.md`
27. `product-contract/screens/screen_route_catalogue.csv` — `SCR-ADM-001`
28. `product-contract/domain/atomic_scope.csv` — `MVP1-M09-001..030`
29. `product-contract/domain/rbac_matrix.csv` — `RBAC-001..006`
30. `product-contract/governance/error_catalogue.csv` — `ERR-PUB-001`, `ERR-AUTH-001`
31. `product-contract/governance/decision_register.csv`
32. `FABLE_UNDERSTANDING_TRACEABILITY.csv` — all rows mapped to `SCR-ADM-001`
33. `FABLE_ACCEPTANCE_UNDERSTANDING.csv` — `AC-0449..0478`
34. `product-contract/evidence/AC_LEDGER.csv` — `AC-0449..0478` and relevant foundation rows
35. `design/claude-design-mvp1/acceptance/DESIGN_ACCEPTANCE_MATRIX.csv` — `DSG-001`, `DSG-SHELL-001`
36. `design/claude-design-mvp1/acceptance/SCREEN_STATE_MATRIX.csv` — `SCR-ADM-001`
37. `design/claude-design-mvp1/acceptance/SPECIAL_COMPONENT_ACCEPTANCE.csv` — applicable realtime/truth rows
38. `design/claude-design-mvp1/acceptance/VISUAL_EVIDENCE_REGISTER.csv` — `EV-DESIGN-001`
39. `apps/web/src/app/admin/page.tsx`
40. `apps/web/src/components/Shell.tsx`
41. `apps/web/src/components/ShellClient.tsx`
42. `apps/web/src/lib/shell-navigation.ts`
43. `apps/web/src/components/NotificationBell.tsx`
44. `apps/web/src/lib/notify.ts`
45. `apps/web/src/app/admin/audit/page.tsx`
46. relevant current Admin child pages/actions under `apps/web/src/app/admin/**`
47. `apps/web/src/app/tokens.css`
48. `apps/web/src/app/astryx.css`
49. `supabase/migrations/0001_foundation.sql`
50. `supabase/migrations/0002_rbac_audit.sql`
51. `supabase/migrations/0004_fix_audit_trigger.sql`
52. `supabase/migrations/0005_audit_absolute_immutability.sql`
53. `supabase/migrations/0006_package_maker_checker.sql`
54. `supabase/migrations/0019_w5_records.sql`
55. `apps/web/e2e/cd-003-launch.spec.ts`
56. `apps/web/e2e/shell-navigation.spec.ts`
57. `apps/web/e2e/persona-tours.spec.ts`
58. `design/astryx/d2/D2_RELEASE_NOTES.md`
59. `design/astryx/d2/D2-01_admin-home.html` — design history only, after current runtime discovery

Record the current Git branch, commit, dirty-worktree paths, locale, theme, viewport, persona, and discovery timestamp. Do not modify, clean, stage, reset, or absorb any dirty file.

## Contract header

- Task: `TASK-DESIGN-ADMIN-SUITE-001`
- Prompt: `CD-004`
- Screen: `SCR-ADM-001`
- Route: `/admin`
- Channel: Admin
- Process: `P00`
- Storyboards: `SB03`, `SB13`, `SB18`
- Personas: Compliance Admin, Form Admin, Workflow Admin, Risk Owner, GIS Admin, Security Admin; reconcile the catalogue’s broader Business/Technical labels to actual role keys without inventing roles
- Engines: suite context `ENG-01..ENG-12`; identify which engines the current route actually reads or can evidence
- Requirements: `MVP1-M09-001..030`
- Foundation guards: `MVP1-FND-001`, `MVP1-FND-003`, `MVP1-FND-004`, `MVP1-FND-010..013`, `MVP1-FND-015`
- RBAC: `RBAC-001..006`
- Errors: `ERR-PUB-001`, `ERR-AUTH-001`
- Source acceptance: `AC-0449..0478`
- Design acceptance: `DSG-001`, `DSG-SHELL-001`, `DSG-A11Y-001`, `DSG-CODE-001`
- Visual evidence: `EV-DESIGN-001`

Primary user job:

> Know what is verified, what is draft, what is blocked, what requires a governed action, and what is unavailable before runtime inspection behavior is affected.

Primary 30-second question:

> What can harm tomorrow’s inspections, what needs attention now, and which apparent problem is only missing evidence rather than a failed engine?

## Mandatory first return — route, ownership, and runtime truth

Before composing frames, return `ROUTE_AND_RUNTIME_TRUTH_CD-004` and verify these facts in the current repository.

### Route and ownership

- `/admin` is the real Admin control-plane home.
- It is inside the sponsor-accepted shared shell.
- `Approval & Configuration` is the real shell destination for Admin-family roles.
- Unsupported Analytics, Lookup, Notification Configuration, Integration, and AI destinations remain hidden.
- The screen catalogue requires an unauthorized state.
- Current middleware proves authentication, not an Admin-family route guard.
- Current tests intentionally allow an Inspector to render `/admin` as a cross-channel shell.
- Current config read policies are broader than shell navigation visibility.

Therefore, design a safe unauthorized state but mark the route-guard/wiring leg `HANDOFF_BLOCKED` until product/security authority reconciles direct-route behavior. Do not silently reinterpret the current cross-channel test as proof of Admin authorization.

### Verified current reads

The current route performs six parallel reads:

1. `engine_settings`: `engine`, `version_label`, `updated_at`
2. exact count of `regulations`
3. exact count of `inspection_items`
4. exact count of `package_versions` filtered to `status = published`
5. exact count of `violation_codes`
6. exact count of `audit_events`

It renders localized labels, an engine table, and real links to `/admin/regulations` and `/admin/audit`.

### Verified platform constraints

- RLS remains the authorization boundary; shell visibility is not security.
- `config_versions` has version/status/maker-checker fields.
- package versions have distinct-approver and published-definition immutability guards.
- audit events are append-only and reject update/delete.
- configuration tables and `engine_settings` have actual RLS policies; identify their exact scope.
- in-app notification persistence is delivery only for the in-app channel; outbound provider delivery is not proven.
- `engine_settings.updated_at` is a timestamp, not a governed health or stale verdict.

### Current route defects and gaps to design truthfully

- Query errors are not interpreted.
- Null counts render as zero, which can confuse unavailable with empty.
- The `live database` success lozenge is static and can overstate aggregate health.
- Counts do not show drafts, approval state, dependencies, impact, ownership, or runtime consumption.
- No current query produces an approval queue.
- No current query produces publish blockers or dependency warnings.
- No current query produces runtime-consumption counts or a runtime version map.
- No current query proves provider/service health.
- No governed stale threshold or approval-overdue threshold is available to this screen.
- Maker-checker is not uniformly proven across every Admin object.

Do not hide these gaps with plausible-looking data. Put unsupported legs in the truth ledger and wiring map as `HANDOFF_BLOCKED`.

## Current-screen critique

Name and evidence the three highest-cost decision failures before proposing a design. At minimum assess:

1. equal count cards require the user to mentally reconstruct lifecycle and risk;
2. source/query failure can be misread as a legitimate zero and is not isolated;
3. the page cannot prove approval debt, dependency risk, or runtime consumption even though the design brief asks for them.

Also assess the static health label and the direct-route authorization mismatch. Separate visual shortcomings from behavioral/backend gaps.

## Design thesis

Design a configuration command centre organized around governed evidence and lifecycle, not module shortcuts or generic metrics.

The page may use a `configuration health spine` as its single signature interaction only if the hypothesis comparison proves it superior and every segment distinguishes:

- verified fact;
- lifecycle state;
- source/timestamp;
- attention or blocker backed by a real rule;
- unavailable/unverified evidence;
- real destination for the next safe action.

Do not call an engine `healthy`, `stale`, `overdue`, `blocked`, `consumed`, or `delivered` unless the exact current source and rule support that word.

## Three equal-fidelity decision-zone hypotheses

Create all three at the same fidelity using the same verified dataset and hard case.

### Hypothesis A — Lifecycle spine

Organize each governed engine/object family across `Draft → Validate → Approve → Publish/Effective → Runtime evidence`. Unlike lifecycles remain visibly distinct. Missing stages are labelled unavailable rather than implied complete.

### Hypothesis B — Exception-first attention ledger

Lead with a prioritized evidence ledger: verified blockers, pending governed actions, unavailable evidence, and recently published/locked changes. Priority may use only explicit rule severity, never an invented risk score or SLA.

### Hypothesis C — Control-plane matrix

Use engine/object rows against evidence columns such as version, lifecycle, owner/role, dependency validation, impact proof, runtime evidence, audit, and source time. The matrix must survive Arabic RTL and constrained width without a horizontal-scroll trap.

Compare the hypotheses against:

- time to identify the next safe action;
- ability to distinguish zero from unavailable;
- hidden assumption count;
- irreversible-error prevention;
- lifecycle and version comprehension;
- partial-failure isolation;
- Arabic/RTL clarity;
- keyboard burden;
- constrained-width survival;
- implementation truth using current data.

Select one. Do not self-score. State evidence, trade-offs, and why the other two lose. Then produce a counterfactual with the selected signature removed and explain the measurable decision loss.

## Required information and action model

The final design must account for these objects without claiming unsupported data:

- configuration families/engines;
- current version label where available;
- last-updated fact and source;
- published package count and other verified counts;
- draft/approved/published/locked status only where exact tables expose it;
- role ownership/allowed action from RBAC, distinguished from a named human owner;
- dependency/validation result only where exact code/query exists;
- audit evidence and route to the immutable audit browser;
- real Admin destinations exposed by the frozen shell;
- unavailable evidence with an explicit reason and recovery/next step.

Detailed regulation, item, package, enforcement, workflow, risk, GIS, notification/SLA, access, localization, and audit work remains owned by CD-005..CD-019. CD-004 may summarize and route; it must not invent their detailed actions or complete their acceptance rows by proxy.

## Mandatory states and frames

Use current runtime data when accessible. If a fixture is required, mark it visibly `DESIGN FIXTURE — NOT RUNTIME EVIDENCE` and do not invent thresholds, deadlines, legal facts, providers, delivery, or business results.

Return at least:

1. `CD-004_SCR-ADM-001_primary_ar_rtl_dark_1440.png` — primary populated Arabic RTL desktop.
2. `CD-004_SCR-ADM-001_primary_en_ltr_light_1440.png` — semantically equivalent English LTR light desktop.
3. `CD-004_SCR-ADM-001_outlier_partial_failure_ar_rtl_dark_1440.png` — one or more source reads unavailable while verified sources remain usable; no false zero or whole-platform failure.
4. `CD-004_SCR-ADM-001_constrained_ar_rtl_light_1024.png` — same decision at constrained width with realistic long Arabic and mixed-direction IDs/dates.
5. `CD-004_SCR-ADM-001_loading.png` — source-aware skeleton/loading state.
6. `CD-004_SCR-ADM-001_empty.png` — legitimate first-use/no-visible-records state distinct from failure.
7. `CD-004_SCR-ADM-001_unauthorized_design_only.png` — safe no-data-exposure state, explicitly `HANDOFF_BLOCKED` for direct-route enforcement.
8. `CD-004_SCR-ADM-001_read_only.png` — authenticated user can inspect verified evidence but has no action authority, only if repository/RBAC discovery supports the state.
9. `CD-004_SCR-ADM-001_validation_or_publish_blocked.png` — include only exact blockers from current data; otherwise show the region as unavailable and mark the wiring leg blocked.
10. `CD-004_SCR-ADM-001_counterfactual.png` — selected composition without its signature interaction.

The state matrix must explicitly classify populated, loading, empty, validation, unauthorized, read-only, stale/unverified, degraded, failure, and recovery. Mark offline and sync conflict `NOT_APPLICABLE` unless current Admin runtime discovery proves otherwise.

## Arabic, RTL, responsive, and accessibility contract

- Start composition in Arabic with `lang=ar` and `dir=rtl`.
- Use realistic long Arabic configuration, regulation, workflow, and audit strings.
- Keep engine keys, version labels, UUID fragments, dates, and timestamps directionally stable.
- Preserve physical reading and action order; do not merely mirror an English frame.
- Use semantic landmarks, one clear `h1`, logical heading order, native tables/lists where possible, and meaningful labels.
- Specify complete keyboard order, focus states, retry focus behavior, and focus movement after a failed action.
- Announce source failures and recovery using appropriate status/alert semantics without repeated screen-reader noise.
- Status uses text plus icon/shape and location, never color alone.
- Dark and light retain the same meaning and attention order.
- Motion may only explain continuity or focus; supply reduced-motion behavior.
- Prevent narrow-width horizontal overflow. A wide control-plane matrix requires an equivalent stacked/list representation.
- Meet WCAG AA and the current Saqeel control sizing/type constraints.

## Research and originality

Create `RESEARCH_LEDGER_CD-004.csv` with primary sources. Include at least:

- `R01` product contract/internal authority;
- `R02` Saqeel DEC-011/tokens;
- `R09` ArcGIS Dashboards coordinated operational context;
- `R11` SAP Fiori role-oriented overview/floorplan principles;
- `R12` IBM Carbon dense-table and status discipline;
- `R16` or `R17` Saudi Digital Government authority;
- `R18` WCAG 2.2;
- `R19` WAI-ARIA Authoring Practices.

For each source record: problem observed, primary-source URL/path, principle adopted, treatment rejected, and Saqeel-specific reason. Do not copy a screenshot, shell, icon set, brand, component styling, or language.

Run the genericity test: remove Saqeel name, colors, and page title. If the design could pass unchanged as CRM, ticketing, project management, or a generic status dashboard, revise it around configuration versions, governed lifecycle, runtime inspection consequences, audit, and dependency truth.

## Frozen shell and component inheritance

Do not redesign:

- global sidebar/navigation groups;
- sticky topbar;
- navigation search;
- account, theme, language, notifications, sign-out;
- desktop collapse;
- mobile drawer;
- shared Arabic-first document behavior.

Use the frozen shell as the frame. Design page content and page-specific interactions only.

Reuse existing Saqeel tokens and component grammar. Each proposed component must be classified `PRESERVE`, `UPDATE`, `CREATE`, or `REMOVE`; `REMOVE` requires explicit human approval. Name exact existing selectors/components/tokens and distinguish design history from production code.

The minimum candidate code path is `apps/web/src/app/admin/page.tsx`. Verify transitive imports and runtime composition before adding any exact path. A directory or guessed filename is not a file change.

## Deterministic wiring map

Return `WIRING_MAP_CD-004.csv` with one row for every user action and system state. Columns:

`row_id, prompt_id, screen_id, state_or_action, ui_trigger, client_or_server_component, route_or_server_action, validation_or_guard, canonical_transition, table_rpc_storage_provider, rls_grant_role, audit_event, notification_or_side_effect, success_result, negative_or_partial_failure_result, automated_test, runtime_evidence, status, blocker_reason`

Include at least rows for:

- authenticated page load;
- role/nav resolution;
- each current data source load;
- partial source failure;
- legitimate zero/empty;
- engine/version inspection;
- opening a real Admin destination;
- opening the audit browser;
- retry/recovery if proposed;
- unauthorized direct-route state;
- read-only/no-action state;
- any proposed approval, dependency, impact, or runtime-evidence interaction.

If a leg is missing, set `status=HANDOFF_BLOCKED` and name the missing evidence. Never invent a handler, query, RPC, policy, guard, transition, audit event, notification delivery, provider result, or test.

## Exact R1 deliverables

Return the design plus:

1. `ROUTE_AND_RUNTIME_TRUTH_CD-004.md`
2. `CURRENT_SCREEN_CRITIQUE_CD-004.md`
3. `RESEARCH_LEDGER_CD-004.csv`
4. `HYPOTHESIS_COMPARISON_CD-004.md`
5. all named frames and design frame IDs
6. `STATE_MATRIX_CD-004.csv`
7. `IMPLEMENTATION_MANIFEST_CD-004.yaml`
8. `COMPONENT_MAP_CD-004.csv`
9. `WIRING_MAP_CD-004.csv`
10. `ACCEPTANCE_CHECKLIST_CD-004.md`
11. `CLAUDE_CODE_HANDOFF_CD-004.md`
12. `DESIGN_REVIEW_INDEX_CD-004.md`

### Implementation manifest requirements

`IMPLEMENTATION_MANIFEST_CD-004.yaml` must contain:

- prompt/task/screen/route/process/storyboard/engine/requirement/acceptance IDs;
- source branch, commit, dirty-worktree paths, timestamp;
- design frame IDs and PNG paths;
- shell and token inheritance;
- unresolved decisions and `HANDOFF_BLOCKED` legs;
- one `file_changes` row per exact path with current responsibility, disposition, future responsibility, design node, code target, protected behavior, dependencies, RTL/theme impact, tests, rollback, and authorization state;
- top-level status `DESIGN_R1_ONLY_NOT_IMPLEMENTATION_AUTHORIZED`.

### Component map requirements

Map every component and state to an existing or proposed code component, export, selector, semantic token, data source, locale/theme behavior, and accessibility contract. Proposed components remain design-only.

### Acceptance checklist requirements

Trace every applicable row across:

- `MVP1-M09-001..030` gateway coverage;
- relevant foundation and RBAC guards;
- `AC-0449..0478` without pretending CD-004 owns all detailed module behavior;
- `DSG-001`, `DSG-SHELL-001`, `DSG-A11Y-001`, `DSG-CODE-001`;
- `EV-DESIGN-001`;
- every `ADM-QG-*` and `CD004-QG-*` row.

Use `PASS`, `FAIL`, `BLOCKED`, or `NOT_APPLICABLE`; no numerical grades.

### Claude Code handoff requirements

`CLAUDE_CODE_HANDOFF_CD-004.md` must be paste-ready but non-executable. It must:

- begin with the exact non-executable banner from this prompt;
- require a clean dedicated non-main worktree/branch;
- preserve unrelated work and the frozen shell;
- implement only a sponsor-approved manifest;
- require an independent wiring audit before authorization;
- use the controlled order: semantic tokens → approved assets → shared/page components → route composition → localization → tests/evidence;
- require positive, negative, role, partial-failure, Arabic/RTL, dark/light, constrained-width, keyboard/screen-reader, typecheck, build, focused Playwright, and full regression evidence;
- prohibit deployment, main modification, provider claims, policy invention, and self-approval.

## Self-criticism before return

Run these passes and correct failures before returning:

1. Contract and traceability coverage
2. Route/data/RLS/audit truth
3. Partial-failure and zero-versus-unavailable truth
4. Inspection/control-plane specificity
5. Three-hypothesis differentiation
6. One-pattern novelty and family continuity
7. Arabic-first RTL and constrained-width integrity
8. Accessibility and keyboard operation
9. Exact file-level handoff and blocked-leg honesty
10. Non-executable implementation boundary

Do not self-award a grade. Do not mark design approved. Do not mark implementation ready.

Finish with exactly:

`READY_FOR_MANDATORY_R1_REVIEW`
