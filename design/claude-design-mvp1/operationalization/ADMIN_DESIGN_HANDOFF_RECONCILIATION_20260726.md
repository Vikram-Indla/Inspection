# Admin design handoff reconciliation — 2026-07-26

Status: implementation planning authority only. This document reconciles the imported Claude Design artifacts and external `CLAUDE-CODE-ADMIN-BUILD.md` handoff with the repository. It does not authorize new policy values, tables, RLS rules, workflow transitions, integrations, or product scope.

## Inputs and reconciliation result

- Design authority: `designs/admin/admin/*.dc.html` — 21 page artifacts, 1,375,523 bytes total.
- External handoff: `/Users/vikramindla/Attachment dump/CLAUDE-CODE-ADMIN-BUILD.md`.
- Repo-aware findings: `ADMIN_DESIGN_GAP_REGISTER_20260726.md` — 66 ranked gaps.
- Existing route map: `ADMIN_IMPLEMENTATION_MAP_20260726.md`.
- Production sources: current `apps/web/src/app/(app)/admin/**`, `apps/web/src/lib/**`, Supabase-backed actions, and current Playwright contracts.

The handoff substantially addresses the design register at the structural and state-model level. It does **not** prove that the proposed server lifecycles exist. The safe implementation rule is:

1. preserve all current routes, payloads, RLS, guards, transitions, audit behavior and historical data;
2. implement presentation, localization, responsive behavior, truthful state handling and hardening around existing contracts now;
3. expose unsupported capabilities as unavailable or not configured;
4. deliver schema, enforcement and new lifecycle work only through a separately accepted product/backend contract.

`SAQEEL Admin Lookups copy.dc.html` and `SAQEEL Admin Lookups.dc.html` are byte-identical. Both count toward the 21-file design inventory, but they represent one production page until Product Authority assigns the copy a distinct route and purpose.

## Shared change manifest

These changes apply to all 21 artifacts and reconcile gap-register rows 1, 8, 9, 11–20, 23, 27, 28, 63, 64 and 66.

| Concern | Imported design change | Production mapping | Acceptance |
|---|---|---|---|
| Chrome | Shared generated rail, utility bar, sub-navigation, command palette and sticky context | `apps/web/src/components/ShellClient.tsx`; admin landing route; production token/layout primitives | One document scroll; no hanging rail; no nested page scrollbar; 44px targets; focus remains visible |
| Authorization | Capability-filtered menu; unauthorized destinations absent; hidden/denied/locked/unavailable/read-only remain distinct | Existing server grant/RLS checks and route guards; never infer from role label | Scoped persona cannot find unauthorized destination in DOM and direct navigation fails safely |
| Routing | URL-backed `?view=` state and return-to-filter intent | Next.js route/search params, stable record identifiers and server redirects | Refresh retains supported view/selection; Back restores prior filter; invalid/denied deep link is safe |
| Locale | Complete EN and AR copy, logical layout and locale-aware formatting | Existing locale source and message dictionaries; CSS logical properties | EN/LTR and AR/RTL at every target viewport; no duplicate bilingual title or clipped text |
| Theme | Semantic-token light and dark presentation | Production design-system variables, not copied fixture CSS | AA contrast for text/control states; status has text or shape in addition to colour |
| Data truth | Loading, empty, read-only, degraded, conflict, unauthorized and error; no invented values | Server reads return factual values and per-source state | Partial read preserves available facts; missing facts say Not configured; partial is never rendered empty |
| Mutation | Dirty, validating, invalid, saving, saved and conflict; reason/impact/receipt for governed changes | Existing server actions and canonical transitions | No silent overwrite; field and summary errors; durable success/failure; immutable rows remain immutable |
| Responsive | Intentional desktop/tablet/mobile layouts | Page CSS/modules and shared components | 1440, 1280, 1024, 768, 412, 390 and 320; no horizontal page overflow or obscured action |

## Per-page manifest and implementation mapping

### 1. `SAQEEL Control Panel.dc.html`

- **Design change:** replaces the overloaded platform rail with a compact authorization-shaped control-panel IA, scoped role explanation, search, favourites/recents states and responsive drawer.
- **Repo mapping:** `/admin`; `apps/web/src/app/(app)/admin/page.tsx`; `apps/web/src/components/ShellClient.tsx`.
- **Safe now:** render only destinations granted by current server results; remove irrelevant business filters and admin-inapplicable utilities; correct sticky/scroll/layout behavior; preserve search/theme/notifications/account.
- **Contract-gated:** persistent favourites/recents and a new authorization-result endpoint if equivalent current grant data is insufficient.
- **Tests:** extend `cd-004-admin-control-plane-home`, `web-admin-f0-foundation`, `web-admin-f0-visual`, `web-admin-m3-route-safety` for full/scoped/read-only/denied personas, RTL/theme and 320–1440 widths.

### 2. `SAQEEL Admin.dc.html`

- **Design change:** route-aware configuration library, queue and request views; area cards distinguish live, pending, unconfigured and denied.
- **Repo mapping:** `/admin`; `admin/page.tsx`; deep links to existing admin routes and compliance request routes.
- **Safe now:** group and label existing destinations, show only sourced status/ownership, preserve deep links.
- **Contract-gated:** generic owner, approval counts, last-change and health fields where no aggregate read contract exists.
- **Tests:** landing card authorization, honest missing metadata, stable deep links, theme/locale/viewport matrix.

### 3. `SAQEEL Admin Detail.dc.html`

- **Design change:** reusable summary, activity, versions, links, request, roles, library and log views with stable selection and before/after history.
- **Repo mapping:** `/admin/regulations/[id]`, `/admin/items/[id]/runtime-preview`, `/admin/compliance-requests/[id]`; their existing detail components/actions.
- **Safe now:** use the detail hierarchy and timeline on existing stable routes.
- **Contract-gated:** `/admin/devices/[id]` and device activity API; do not substitute modal-only fake history.
- **Tests:** loading/not-found/denied; refresh-safe selection; Back restores filters; mutation receipts and immutable history.

### 4. `SAQEEL Admin Extended.dc.html`

- **Design change:** operations, audit log, retention, localization and notification workspaces with truthful unconfigured retention and source-aware states.
- **Repo mapping:** `/admin/audit`, `/admin/localization`, `/admin/notifications`, `/admin/security-access`; `AuditReplayWorkspace`, localization `Manager`, notification managers/actions.
- **Safe now:** readable audit timeline/diff, localization filters and validation, bilingual notification preview, explicit unconfigured retention.
- **Contract-gated:** retention value/approval, complete access-review assignment, notification provider delivery semantics and quiet-hours policy.
- **Tests:** `cd-042-audit-read-seam`, `mvp2-m2-05-audit-replay`, `web-admin-m9-localization`; add denied/export, placeholder validation, provider-degraded and no-default-retention assertions.

### 5. `SAQEEL Admin Execution.dc.html`

- **Design change:** governed policy overview rather than raw JSON-first editing; roles view; dependency/impact, validation, effective state and expert JSON recovery.
- **Repo mapping:** `/admin/execution`; `execution/page.tsx`, `actions.ts`, policy forms, `ReasonsManager.tsx`, `RawJsonDetails.tsx`.
- **Safe now:** consolidate existing forms, expose current server validation, localized usage/in-use state, disclosed schema-validated JSON with diff/recovery.
- **Contract-gated:** generic draft→approve→activate versions, effective dating, dependency graph, device propagation counts and rollback unless persisted per policy family.
- **Tests:** `execution-admin-contract`, `web-admin-m3-operations`; add invalid JSON recovery, protected in-use record, partial propagation and immutable-active negative paths.

### 6. `SAQEEL Admin Form Builder.dc.html`

- **Design change:** palette/canvas/inspector builder, separate compliance-request lifecycle and operational status, EN/AR preview, named publish blockers and governed JSON escape hatch.
- **Repo mapping:** `/admin/templates`, `/admin/packages`; template actions plus `TemplateRegistry`, `DraftEditor`, `PackagePreview`, `PublishControls`.
- **Safe now:** build over current schema/action payload, field-level validation, selected/empty inspector, preview, dirty/conflict protection.
- **Contract-gated:** unsupported conditional logic, scoring, repeat groups, evidence cascade, autosave, release-date scheduler and any new create/modify approval transition.
- **Tests:** existing admin batch specs plus keyboard builder, named blocker, bilingual preview, large-form, conflict and immutable-published tests.

### 7. `SAQEEL Admin Workflow Builder.dc.html`

- **Design change:** structured states/transitions/guards editor before guarded JSON, real graph/validator output, simulation trace, draft/published diff and reachable retire/rollback.
- **Repo mapping:** `/admin/workflows`; `WfDeck.tsx`, `Controls.tsx`, `actions.ts`, transition/SLA/task actions; `src/lib/workflow/**`.
- **Safe now:** render/edit canonical nodes and transitions, call existing validator/actions, preserve unknown JSON keys and show line/column errors.
- **Contract-gated:** executable guards, simulation persona/data, SLA clock, approval, rollback and retirement when not exposed by canonical transitions.
- **Tests:** `mvp2-m2-02-workflow-validator`, `web-admin-m2-batch-002`; add keyboard graph, VAL-01…06 source truth, parse error, unknown-key preservation and conflict tests.

### 8. `SAQEEL Admin Geofence.dc.html`

- **Design change:** registry/layers/pins/proposal views, synchronized map and coordinate authoring, visible authority, undo and degraded-provider review.
- **Repo mapping:** `/admin/gis`, `/admin/gis/spatial`; `GisStudio.tsx`, `CreateLayer.tsx`, existing GIS actions.
- **Safe now:** synchronize existing coordinate/radius/geometry fields, preserve values during provider failure, improve list/map selection and keyboard summaries.
- **Contract-gated:** dual-pin meaning, precision/provider policy, authoritative geometry rules, Saudi-region source acceptance and approval/version lifecycle.
- **Tests:** existing admin batch spec plus coordinate/map synchronization, precision error, undo, keyboard operation, provider degradation and audit-reason tests.

### 9. `SAQEEL Admin Integrations.dc.html`

- **Design change:** connections/endpoints/events views with connected, degraded, paused, failed and unconfigured states and per-source provenance.
- **Repo mapping:** `/admin/integrations`; existing integration landing and factory/Senaei links; `src/lib/integrations/**`.
- **Safe now:** normalize statuses returned by real providers, show real timestamps/errors and partial-source state.
- **Contract-gated:** owner, next run, latency target, pause, retry and scheduling unless returned by accepted provider/actions.
- **Tests:** industry-shared and Senaei contract specs; add unconfigured/degraded/partial/denied and no-invented-health assertions.

### 10. `SAQEEL Admin Integrations Data.dc.html`

- **Design change:** imports/mapping/exports/writeback views, validation totals, rejected rows, provenance and explicit irreversible actions.
- **Repo mapping:** `/admin/integrations/factory-data`; `CsvImportForm.tsx`, `MasterDataForms.tsx`, actions.
- **Safe now:** improve current upload/forms, expose server validation, localize enum labels while retaining raw source values.
- **Contract-gated:** configurable mapping, duplicate strategy, resumability, rejected-row artifact/export, replacement semantics and writeback lifecycle.
- **Tests:** industry integration spec plus invalid schema, duplicate, partial reject, pagination, permission and irreversible-confirmation coverage.

### 11. `SAQEEL Admin SENAI Data.dc.html`

- **Design change:** sources/fields/records views with received-at/schema provenance, accepted/rejected totals, source freshness and retry/writeback states.
- **Repo mapping:** `/admin/integrations/senai-data`; current page/module CSS; Senaei clients, schemas and adapters.
- **Safe now:** render returned provenance, schema, errors and localized values; preserve raw source value in detail/audit.
- **Contract-gated:** retry/writeback controls, persisted schema version, rejected-row download and pagination unless the API supplies them.
- **Tests:** `senaei-integration-contract`; add partial source, stale, malformed enum, failed page, permission and honest missing-metadata tests.

### 12. `SAQEEL Admin Lookups.dc.html`

- **Design change:** lists/entries/localization views with governed CRUD, usage visibility, in-use protection and localized/raw value separation.
- **Repo mapping:** `/admin/planning/lookups`; adjacent `/admin/planning/status` and `/admin/planning/expiry`; `LookupsAdmin`, `ExpiryAdmin` and actions.
- **Safe now:** clarify IA while keeping lookup/status/expiry persistence separate; harden existing CRUD and read-only states.
- **Contract-gated:** deprecation replacement, usage counts and retirement rules not already enforced server-side.
- **Tests:** `cd-044-admin-planning`; add create/edit/retire/in-use, deterministic sort, pagination, RTL and read-only/denied coverage.

### 13. `SAQEEL Admin Lookups copy.dc.html`

- **Design change:** none distinct; the file is byte-identical to the canonical Lookups artifact.
- **Repo mapping:** none additional. It maps to the same planning routes only as duplicate design inventory evidence.
- **Safe now:** retain as imported authority evidence.
- **Contract-gated:** any second destination, label, data model or purpose.
- **Tests:** no duplicate production-navigation destination; canonical Lookups tests cover the shared concept.

### 14. `SAQEEL Admin Role Override.dc.html`

- **Design change:** overrides/request/active/history views with baseline diff, scope, reason, approver, expiry, conflict and revoke.
- **Repo mapping:** `/admin/access`; `RoleCapabilityPanel.tsx`, `role-capability-actions.ts`.
- **Safe now:** show current baseline and server-returned override decisions; retain deny/locked semantics.
- **Contract-gated:** required expiry, auto-reversion, conflict detection, maker-checker approval and revoke receipt unless enforced in schema/actions.
- **Tests:** baseline/override decision rendering; deny beats allow; locked cannot mutate; expiry/revoke/receipt only when backend exists.

### 15. `SAQEEL Admin Virtual Premium.dc.html`

- **Design change:** register/device/commands/providers views; distinct trust and command-delivery states; honest WebAuthn support/challenge/verified/failed presentation.
- **Repo mapping:** `/admin/devices`; current device page and field-device sources.
- **Safe now:** truthful feature detection, responsive inventory, existing device/provider facts and offline caveat.
- **Contract-gated:** passkey challenge/credential binding/assertion/revoke, stable device detail, quarantine, risk signal, expiry and bulk governance.
- **Tests:** `m04-device-eta-override`; add unsupported WebAuthn, queued≠applied, offline device, 320px card mode, confirmation and no-false-verified tests.

### 16. `SAQEEL Users Roles.dc.html`

- **Design change:** users/roles/overrides/review views; lifecycle roster; capability decisions with source/scope/channel; staged role matrix; SoD and access-review presentation.
- **Repo mapping:** `/admin/access`, `/admin/security-access`; `AccessManager`, `RoleCapabilityPanel`, actions.
- **Safe now:** capability matrix over existing grants, authorization-filtered actions, factual current user states and scopes.
- **Contract-gated:** `role_capability_versions`, `sod_rules`, `access_change_requests`, invite expiry, last sign-in, passkey/MFA verification and last-security-admin constraint where absent.
- **Tests:** `cd-006-admin-backend-foundation`, `web-admin-m3-route-safety`; add lifecycle, matrix precedence, scope, self-escalation refusal, last-admin refusal and review receipt when supported.

### 17. `SAQEEL Delegation.dc.html`

- **Design change:** given/received/new/history concept with policy panel, mandatory reassignment preview, two-step confirmation and receipts.
- **Repo mapping:** no live route, component, action, schema or test found.
- **Safe now:** an honest unavailable state only, if a discoverable destination is product-approved; otherwise keep destination absent.
- **Contract-gated:** entire capability—route, tables/RLS, grant intersection, eligibility, maximum window, self-delegation/escalation prevention, maker-checker, expiry/revoke, reassignment preview, audit and notifications.
- **Tests:** required before enablement: negative RLS, escalation, self-delegation, expired grant, requester-approver equality, preview-not-run, offline/partial preview and audited revoke.

### 18. `SAQEEL Risk.dc.html`

- **Design change:** models/workbench/validation/publish views; factor/source/transformation/weight/missing-data/bands, deterministic scenario and governed lifecycle.
- **Repo mapping:** `/admin/risk`, `/admin/risk/models`; `RiskForm`, `RiskModels`, actions; canonical `src/lib/risk/model.ts`.
- **Safe now:** derive visible model shape and scoring only from canonical model/server action; show honest no-model, partial/stale/calculation-failed states; keep health separate.
- **Contract-gated:** weights, thresholds, missing-data rule, approval, effective date, rollback target, affected-object counts and reproducible result persistence not already modeled.
- **Tests:** `mvp2-m2-04-risk-model`; deterministic boundary scenarios, no platform-health input, immutable active model, partial input and server-result receipt.

### 19. `SAQEEL KPI Management.dc.html`

- **Design change:** definitions/parameters/preview/publish views with formula, unit, owner, source, frequency, dimensions, bands, exclusions and lineage.
- **Repo mapping:** `/admin/dashboard-config`; dashboard action form/components; `src/lib/dashboard-kpi/**`.
- **Safe now:** definition rail, accessible preview/table/export from current KPI registry and returned data; report missing Arabic titles.
- **Contract-gated:** formula parser, lineage graph, targets, owner, source-delay model, publish lifecycle and the missing Arabic translations.
- **Tests:** dashboard KPI contract/seed and M1 dashboard specs; add missing-AR, calculation error, delayed/partial source, locale-number, non-colour status and printable/export cases.

### 20. `SAQEEL Dashboard Config.dc.html`

- **Design change:** widgets/layout/audience/publish views with responsive composition, selection, collision/undo intent and publication states.
- **Repo mapping:** `/admin/dashboard-config`; current page, `ActionForm.tsx` and dashboard components.
- **Safe now:** accessible composition over current persisted layout and current audience facts; preview existing breakpoints.
- **Contract-gated:** breakpoint-specific persistence, collision rules, undo history, audience publication and new publish transition.
- **Tests:** current dashboard specs plus keyboard move/resize, collision, narrow preview, dirty/conflict, audience denied and refresh persistence.

### 21. `SAQEEL Item Execution.dc.html`

- **Design change:** register/item/responses/usage/request views; bilingual item/evidence/violation rules, usage protection, runtime preview and governed request state.
- **Repo mapping:** `/admin/items`, `/admin/items/[id]/runtime-preview`, adjacent `/admin/violations` and `/admin/bulk-violations`; current controls/actions.
- **Safe now:** preserve accepted item/violation fields, improve selection, validation, localized response/evidence presentation and runtime preview.
- **Contract-gated:** new scoring, evidence rules, cascade/retirement behavior, response management or approval semantics beyond accepted schemas/transitions.
- **Tests:** admin M2/M3 specs plus bilingual response values, named blocker, in-use protection, preview fidelity, denied/read-only and immutable-history paths.

## Concrete implementation sequence

1. **Shared shell and authorization:** finish capability-derived menu filtering and direct-route guards; establish one-scroll responsive chrome, logical CSS, theme/locale tokens and shared truthful-state components.
2. **Read-only reconciliation:** Admin landing/detail, integration status, audit, localization, KPI/risk definition views and source provenance. This produces useful parity without schema invention.
3. **Existing-action hardening:** add dirty/conflict/error summaries, typed confirmation, reason/impact and durable server receipts to actions that already exist.
4. **Builders:** Form → Workflow → Item/Lookups, constrained to current schemas and canonical transitions.
5. **Domain workspaces:** Execution → KPI/Dashboard → Risk → Integrations/Data → Devices → GIS → Access, with a contract check before every proposed mutation.
6. **Gated backend slices:** delegation, capability versioning/maker-checker, WebAuthn, device detail/governance, geofence semantics, import/writeback, generic version lifecycles and retention only after accepted requirements, schema/RLS, negative tests and audit contracts exist.
7. **Independent verification:** browser matrix, Supabase/RLS negative tests, immutable-row checks and Anthropic Claude Code `/design-critique`; resolve verified issues without allowing critique output to create policy.

## Acceptance-test matrix

Every touched production page must be exercised across:

- **Locale/direction:** `en/LTR`, `ar/RTL`; native direction, locale date/number/status/error, logical geometry.
- **Theme:** light and dark with AA text/control contrast and non-colour status meaning.
- **Viewport:** 1440, 1280, 1024, 768, 412, 390, 320; intentional small-screen tables/builders/maps.
- **Authority:** full admin, scoped admin, reviewer, read-only and denied; matching navigation, action, field and data scope; direct-route negative path.
- **Read state:** loading, live, empty, partial, stale, degraded and failed; no fixtures and no partial-as-empty.
- **Edit state:** pristine, dirty, validating, invalid, saving, saved and conflict; no silent overwrite.
- **Governance:** only lifecycle states returned by the canonical domain transition; immutable published/submitted version negative update/delete.
- **Destructive/security action:** exact scope, reason, confirmation/recent-auth where contracted, progress, failure and durable receipt.
- **Accessibility:** keyboard equivalent, visible focus, named controls, announced error/status, 44px targets, 200% zoom.
- **Navigation:** stable URL/selection, refresh, Back-to-filter and safe unauthorized/not-found behavior.

## Conflicts and required dispositions

| Conflict | Design request | Repo/contract position | Disposition |
|---|---|---|---|
| Lookups duplication | 21-page inventory contains canonical and copy artifacts | No second route or distinct model | Keep both artifacts; implement one destination until Product Authority assigns purpose |
| Delegation | Full governed flow | No production route/schema/RLS/actions/tests | Block; unavailable/hidden only |
| Generic authorization endpoint | One route-result response shape | Existing pages use current grants/guards in several forms | Normalize only if a separately reviewed endpoint contract is accepted; do not weaken current guards |
| Capability versioning/SoD | New tables and maker-checker lifecycle | Not established as shared schema contract | Backend slice first; current grants remain authoritative |
| Generic immutable version triggers | All listed config families | Domain tables/transitions differ | Add per-domain migrations/tests only; never apply a decorative generic status |
| Retention | Retention workspace | Approved values absent | Render Not configured; no default |
| WebAuthn | Full binding/assertion lifecycle | Current device UI does not prove it | Feature-detect presentation only; block verified state until server proof |
| Geofence dual pin | Centre/boundary semantics | Meaning and precision/provider policy absent | Preserve current fields; contract before new geometry semantics |
| Import/writeback | Mapping, resume, rejected export, retry/writeback | Actions/storage incomplete | Show returned facts; keep unsupported controls unavailable |
| Risk lifecycle | Approve/effective/rollback/impact | Canonical model exists, not every proposed governance field | Use canonical model/actions; gate missing lifecycle fields |
| Dashboard editing | Breakpoint layouts, collisions, undo, audience publish | Persisted schema/action support incomplete | Implement only current layout contract |
| New values | thresholds, SLAs, owners, dates, weights, providers | Source authority absent | Never invent; Not configured |

## Definition of reconciled delivery

The imported design is considered implemented only when each enabled interaction maps to an existing or newly approved server contract, its negative path is tested, and EN/AR, RTL/LTR, light/dark and responsive evidence exists. Visual similarity alone is insufficient. A design-only control that lacks a server contract remains disabled as unavailable or absent according to authorization—not simulated with client state.
