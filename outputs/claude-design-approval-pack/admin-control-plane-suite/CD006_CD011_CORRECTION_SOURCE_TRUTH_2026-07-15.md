# CD-006–CD-011 correction source-truth memo

## Authority and observation

- Task: `TASK-DESIGN-ADMIN-SUITE-001`
- Lane: Admin Control Plane Suite, design-only
- Observed branch: `setup/Inspection`
- Observed commit: `1b530afe06a620b3b85173d10cec1f12074e2c18`
- Dirty worktree: `true` — concurrent unrelated work exists; do not absorb or change it
- Observation date: `2026-07-15`
- Gate: G10 PASS; G11 hardening OPEN; G12 release OPEN
- Screens: `SCR-ADM-011`, `SCR-ADM-020`, `SCR-ADM-030`, `SCR-ADM-031`, `SCR-ADM-040`, `SCR-ADM-041`
- Process/journey: `P00` / Compliance Configuration
- Requirement family: `MVP1-M09-001..030`, relevant `MVP1-FND-*`, `RBAC-001..006`, `ERR-PUB-001`, `ERR-AUTH-001`, `FLD-PEN-001`
- Acceptance: `AC-0449..0478`, `DSG-003..DSG-008`, `DSG-SHELL-001`, `DSG-A11Y-001`, `DSG-CODE-001`
- Frozen boundary: design documentation only. No application, Supabase, shared-shell, global contract, Git-history, or CD-004/CD-005 changes are authorized.

This memo freezes the runtime facts that the corrected design packages must use. Claude Design may verify them against an attached repository/runtime snapshot, but may not replace them with guesses. A contradiction must be reported and the affected wiring leg kept `HANDOFF_BLOCKED`.

## Shared route, RLS, audit, and state truth

### Routes

| Screen | Contract route | Current route | Reconciliation |
| --- | --- | --- | --- |
| SCR-ADM-011 | `/admin/regulations/:id` | `/admin/regulations` | Consolidated logical detail mode |
| SCR-ADM-020 | `/admin/items` | `/admin/items` | Direct |
| SCR-ADM-030 | `/admin/packages` | `/admin/packages` | Direct |
| SCR-ADM-031 | `/admin/packages/:id/designer` | `/admin/packages` | Consolidated logical designer mode |
| SCR-ADM-040 | `/admin/violations` | `/admin/violations` | Direct |
| SCR-ADM-041 | `/admin/penalties` | `/admin/violations` | Consolidated logical penalty mode |

The corrected design must preserve each logical screen inside the consolidated experience. It must not invent a new route or imply that the contract route already exists.

### Configuration RLS

Migration `supabase/migrations/0002_rbac_audit.sql` applies the same base policy to `regulations`, `regulation_clauses`, `inspection_items`, `packages`, `package_versions`, `violation_codes`, and `penalty_mappings`:

- SELECT: any authenticated user;
- all writes: `compliance_admin` or `form_admin` through RLS;
- navigation visibility is not authorization;
- no dedicated Admin-family direct-route guard is proven by these screens.

Where the catalogue persona is narrower than the current RLS, the design must show the contract persona and record the RLS mismatch as a wiring/security fact. It must not silently broaden the product contract.

### Audit

The generic row audit trigger covers `package_versions` and `regulations`. It does **not** cover `regulation_clauses`, `inspection_items`, `violation_codes`, or `penalty_mappings`.

The `audit_events` read policy allows `auditor`, `ops`, `security_admin`, `leadership`, `reviewer`, and `planner`. It does not grant audit-event reads to `compliance_admin` or `form_admin` solely because they are configuration writers.

Therefore:

- package-version and regulation row changes have generic audit-trigger coverage;
- clause, item, violation-code, and penalty-mapping changes must not be presented as audited unless another exact source is proved;
- an audit timeline visible to a Compliance/Form Admin must be marked unavailable or `HANDOFF_BLOCKED` unless a permitted reader/source is established.

### Required design-state model

For every screen, `SCREEN_STATE_MATRIX.csv` requires: populated, loading, empty, validation, unauthorized, read-only, stale, degraded, and recovery. Offline and sync-conflict are not applicable. Required locales are EN and AR; required themes are dark and light; desktop is the governed viewport.

No stale threshold exists for these routes. A stale state may communicate that the page data may have changed or could not be refreshed, but it must not invent a duration, SLA, or policy. A failed source must render `unavailable` or `unknown`, never zero, healthy, complete, or successful.

## CD-006 — SCR-ADM-011 Regulation detail and version

### Exact source paths

- `apps/web/src/app/admin/regulations/page.tsx`
- `apps/web/src/app/admin/regulations/Controls.tsx`
- `apps/web/src/app/admin/regulations/actions.ts`
- `supabase/migrations/0001_foundation.sql`
- `supabase/migrations/0002_rbac_audit.sql`

### Current data and behavior

- `page.tsx` reads `regulations(id, code, title, issuing_authority, status)` and nested `regulation_clauses(id, clause_ref, title)` with nested `inspection_items(id, code)`.
- The page does not read clause `applicability` or `legal_source`, version history, dependencies beyond mapped items, or audit events.
- `createRegulation` inserts a `draft` regulation.
- `addClause` inserts `regulation_id`, `clause_ref`, `title`, and optional `legal_source`.
- `publishRegulation` directly updates `draft` to `published`.
- There is no mapped-clause validation in the publish action.
- There is no regulation-specific maker-checker enforcement.
- There is no regulation published-version immutability trigger; the package immutability trigger does not apply here.
- `regulations` row changes are audited by the generic trigger; clause changes are not.
- Contract persona: Compliance Admin and Reviewer. Do not substitute an invented generic Approver role.

### Design disposition

The document-dossier and clause-to-runtime trace direction may remain. The UI must not imply that validate, submit, approve, compare, published lock, supersede, dependency gate, or audit timeline is working unless an exact runtime leg is proved. Those legs are design targets with visible `HANDOFF_BLOCKED` annotations. The only proven lifecycle mutation is `draft → published` through the direct action.

## CD-007 — SCR-ADM-020 Inspection item catalogue

### Exact source paths

- `apps/web/src/app/admin/items/page.tsx`
- `apps/web/src/app/admin/items/Controls.tsx`
- `apps/web/src/app/admin/items/actions.ts`
- package consumer paths under `apps/web/src/app/admin/packages/`
- `supabase/migrations/0001_foundation.sql`
- `supabase/migrations/0002_rbac_audit.sql`

### Current data and behavior

- The route reads item `id`, `code`, `title`, `active`, `score_weight`, `response_model`, `evidence_rule`, and clause/regulation references.
- The schema also contains `score_excluded_on`, `guidance_en`, and `guidance_ar`; the current item list query does not project all of them.
- `createItem` uses governed response/evidence presets, stores the clause link, score weight, guidance, response model, evidence rule, and active state.
- `toggleItemActive` changes the boolean active state; deactivation preserves historical references.
- No deactivation reason is stored.
- Duplicate item code is enforced by the database unique constraint and currently returns the provider error through the action.
- The package publish validator blocks missing/inactive item references and malformed evidence/action mappings.
- There is no item-row audit trigger.
- A package-usage count for a selected item is not currently provided by the item route. Do not invent it.

### Design disposition

The semantic catalogue and runtime-preview strip may remain. Replace all “schema unknown” language with exact fields/actions above. Any reuse/usage count, edit-draft lifecycle, conditional-rule authoring, or item audit timeline remains `HANDOFF_BLOCKED` unless an exact source is added. Do not present the route as a generic survey-builder.

## CD-008 — SCR-ADM-030 Package library

### Exact source paths

- `apps/web/src/app/admin/packages/page.tsx`
- `apps/web/src/app/admin/packages/ImpactPanel.tsx`
- `apps/web/src/app/admin/packages/PackagePreview.tsx`
- `apps/web/src/app/admin/packages/PublishControls.tsx`
- `apps/web/src/app/admin/packages/actions.ts`
- `supabase/migrations/0001_foundation.sql`
- `supabase/migrations/0002_rbac_audit.sql`
- `supabase/migrations/0006_package_maker_checker.sql`
- `supabase/migrations/0024_fix2_admin_package_impact.sql`

### Current data and behavior

- The route reads packages and version rows with `id`, `version_label`, `status`, `published_at`, and JSON `definition`.
- It reads the live item bank and constructs inspector-facing preview data.
- `getPinnedActiveImpact` calls the real `package_version_impact(uuid)` aggregate RPC.
- The RPC returns active visit/inspection counts pinned to prior published/locked versions, grouped by prior version, and is internally limited to configuration/checker roles.
- `ImpactPanel` also computes other published packages sharing items and a definition diff versus the current published version.
- `createDraftVersion` clones the latest definition into a new draft and records `created_by`.
- `approveAndPublish` validates item existence/active state, response-linked violations, penalty mappings, evidence rules, and action-form references before publishing.
- The database enforces a distinct package-version approver and requires `approved_by` for published/locked status.
- The database prevents definition/version-label edits to published/locked package versions.
- `package_versions` row changes are audit-triggered.

### Design disposition

The version-led library is retained. Replace assumed/unknown source claims with the real RPC, impact computation, publish validation, maker-checker, audit, and immutability paths. Counts may be shown only as a labelled design fixture or from returned RPC evidence; RPC failure or denied scope is `unavailable`, never zero. Do not invent effective dates, scheduled versions, or supersede rules that the current schema does not provide.

## CD-009 — SCR-ADM-031 Package and form designer

### Exact source paths

- `apps/web/src/app/admin/packages/page.tsx`
- `apps/web/src/app/admin/packages/DraftEditor.tsx`
- `apps/web/src/app/admin/packages/PackagePreview.tsx`
- `apps/web/src/app/admin/packages/ImpactPanel.tsx`
- `apps/web/src/app/admin/packages/PublishControls.tsx`
- `apps/web/src/app/admin/packages/actions.ts`
- field runtime comparison source must be named if equivalence is claimed

### Current data and behavior

- `DraftEditor` edits draft JSON definitions only.
- It supports changing section titles, setting a section mandatory flag, adding/removing item codes, adding sections, and saving the definition.
- The array order is consumed in preview/runtime, but the editor has no reorder control.
- It does not author condition expressions, per-item required/optional/conditional rules, scoring enable/disable, full evidence models, or action-form definitions.
- Existing conditional values can be displayed from item response-model data, but condition authoring is not implemented.
- There is no simulation engine and no circular-condition detector.
- `PackagePreview` is a real read-only projection of stored definition plus item-bank data; it displays responses, evidence, conditional source text, guidance, legal clause, violation link, and action-form shape.
- `saveDraftDefinition` writes only while version status remains `draft`.
- Package publish validation, maker-checker, impact, audit, and published immutability are proven as described under CD-008.

### Design disposition

The governed studio concept may remain, but working controls must be limited to the proven editor behavior. Reorder, condition authoring, simulation, circular detection, and any new validation engine must be visibly `HANDOFF_BLOCKED`; do not render them as active successful controls. The preview must be described as read-only runtime-shaped projection, not an interactive simulator.

## CD-010 — SCR-ADM-040 Violation catalogue

### Exact source paths

- `apps/web/src/app/admin/violations/page.tsx`
- `apps/web/src/app/admin/violations/Controls.tsx`
- `apps/web/src/app/admin/violations/actions.ts`
- `supabase/migrations/0001_foundation.sql`
- `supabase/migrations/0002_rbac_audit.sql`

### Current data and behavior

- `violation_codes` fields are `id`, unique `code`, `title`, `level`, optional `clause_id`, `active_from`, and `active_to`.
- `page.tsx` reads code, title, level, active-from date, clause/regulation reference, and nested penalty mapping summary.
- `createViolationCode` requires code, title, one of `L1/L2/L3`, a clause, and active-from date.
- The current action surface has no violation edit, version, deactivate, usage-count, or explicit trace-query action.
- Category and applicability are not fields on `violation_codes`.
- Legal basis belongs to the penalty mapping, not the violation-code row.
- Historical runtime violations are a different `violations` table. Do not confuse its audit trigger with `violation_codes`.
- `violation_codes` has no generic audit trigger.

### Design disposition

The legal-taxonomy table and trace-ribbon direction may remain. Show only proven source legs as current. Category, applicability, usage count, deactivate control, historical-count claim, trigger trace, and audit timeline remain `HANDOFF_BLOCKED` unless an exact query/action is proved. Active/future/deactivated display may be derived from `active_from`/`active_to` only when the derivation and current date are explicit; do not invent a status enum.

## CD-011 — SCR-ADM-041 Penalty mapping

### Exact source paths

- `apps/web/src/app/admin/violations/page.tsx`
- `apps/web/src/app/admin/violations/Controls.tsx`
- `apps/web/src/app/admin/violations/actions.ts`
- `supabase/migrations/0001_foundation.sql`
- `supabase/migrations/0002_rbac_audit.sql`

### Current data and behavior

- Penalty mapping is consolidated into `/admin/violations`; `/admin/penalties` is not implemented.
- `penalty_mappings` fields are `id`, unique `violation_code_id`, `penalty_ref`, JSON `penalty_range`, JSON `repeat_rule`, `legal_basis`, and `mapping_version`.
- The unique violation reference enforces one penalty mapping per violation.
- `createPenaltyMapping` requires violation, penalty reference, legal basis, mapping version, a governed range preset, and a governed repeat-rule preset.
- Current presets are configuration tokens (`schedule_approved` or none; `escalate_one_level` or none), not editable monetary/legal values.
- There are no effective-period fields, no overlap/gap engine, no general cardinality model beyond the one-to-one unique constraint, and no submit/approve/publish lifecycle/status on this table.
- There is no penalty-mapping maker-checker implementation, immutability trigger, or generic audit trigger.
- Contract maker-checker/Approver behavior is therefore an unresolved implementation leg, not current runtime truth.
- Exact mapping version is a governed immutable reference for inspection results (`FLD-PEN-001`), but this does not make the mapping row itself immutable.

### Design disposition

Regenerate the full CD-011 visual package. Retain a relationship-workspace direction only if its conflict lens is restricted to proven conditions: unmapped violation, existing one-to-one mapping, missing legal basis before create, invalid/missing preset, or duplicate mapping rejection. Do not show effective-period overlaps/gaps, invented monetary amounts, a working approval workflow, publish, or locked mapping state. Those contract-target capabilities must be visibly `HANDOFF_BLOCKED`.

## Evidence and packaging truth

The previous CD-006–CD-010 image hashes matched their manifests, but their files named as 1024×1366 evidence were 700×520. CD-011 declared images that were absent.

Every corrected CD must return:

1. standalone primary and critical-outlier exports;
2. Arabic RTL dark and light at 1440×1024;
3. English LTR dark and light at 1440×1024;
4. a native 1024×1366 constrained export, not a scaled preview;
5. hard-state evidence covering every required state;
6. `STATE_MATRIX_CD-0XX.csv` mapping every required state to a frame/file;
7. `EVIDENCE_MANIFEST_CD-0XX.csv` generated from measured dimensions and SHA-256;
8. a route/runtime truth memo, data-truth ledger, component map, exact-path implementation manifest, row-complete wiring map, accessibility/keyboard spec, localization inventory, research ledger, acceptance checklist, and non-executable Claude Code handoff.

Every visual export must visibly state `DESIGN FIXTURE — NOT RUNTIME EVIDENCE`. Visuals are appearance evidence only. No package may claim sponsor approval, implementation authorization, runtime test success, provider success, or audit coverage not proved by the source.
