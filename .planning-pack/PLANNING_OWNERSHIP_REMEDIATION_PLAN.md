# Planning Module Ownership & Remediation Plan

Status: **Ownership accepted — Slice 1 implemented, Slice 2 queued**
Owner: Codex
Scope: Visit Planning web module and its planning administration control plane

## Authority and inputs

- Product authority: `product-contract/` and the planning pack under `.planning-pack/`.
- Functional planning baseline: `PLANNING_SCHEMA_CONTRACT.md`, `CANONICAL_PLAN.md`,
  and the Kimi planning pack's canonical plan and acceptance matrix.
- Design authority: `design/saqeel/` plus the V5.1 implementation evidence under
  `docs/design-system-v5/`.
- Supplied archive reference: `/Users/vikramindla/Developer/Business - Inspection/SAQEEL Design System.zip`
  (SHA-256 `d019686f88d0b1239df289b4030796a64c70c5daa20c74971f7d2399e4510a28`).
  The archive is an external design export and must not be committed to Git.

## Coverage map

| Planning surface | Routes/files | Canonical SAQEEL coverage | Ownership status |
|---|---|---|---|
| Planning landing/list | `/planning`, `planning/page.tsx` | `legacy-*` controls, status lozenges, data grid, governed dates, shared empty states | Slice 1 aligned; UX audit queued |
| Single planning | `/planning/single`, `Wizard.tsx`, `IdentityDossier.tsx` | `legacy-*` controls, Field/Input/Select patterns, identity dossier, provenance | Slice 1 aligned; nomenclature audit queued |
| Bulk targeting | `/planning/bulk`, `CriteriaBuilder.tsx`, `BulkForm.tsx` | `legacy-*` controls, criteria builder, alert/ledger/table patterns | Slice 1 aligned; advanced interaction audit queued |
| Bulk review/publish | `/planning/bulk/review` | `legacy-*` actions, readiness/ledger patterns, package selection | Functional wiring retained; UX audit queued |
| Immediate planning | `/planning/immediate`, `ImmediateForm.tsx` | `legacy-*` controls, segmented identity, location/provenance states | Slice 1 aligned; touch/RTL audit queued |
| Plan register/drill | `/planning/plans`, `/planning/plans/[id]` | shared empty states, table/detail patterns | Slice 1 icon alignment; detail audit queued |
| Planning admin | `/admin/planning/lookups`, `/expiry`, `/status` | governed forms, read-only/error states, audit/control-plane patterns | CSS aligned; authorization/runtime audit queued |

## Implemented in Slice 1

- Replaced Planning's remaining legacy `.btn*` controls in the bulk criteria
  builder and single wizard with the canonical `legacy-btn` variants.
- Replaced Planning raw glyph/emoji empty states with the shared SVG icon API.
- Replaced user-facing Planning UTC string slicing with `formatDate` /
  `formatDateTime` using the governed Asia/Riyadh Gregorian service.
- Preserved business identifiers, lifecycle semantics, RBAC, atomic publish,
  draft behavior, and the existing reference-series schema.

## Queued remediation slices

### Slice 2 — Naming and information architecture

- Verify `plan_reference`, `visit_reference`, and `bulk_plan_reference` labels
  against the canonical plan and schema; no prefix changes without an approved
  contract decision.
- Make plan vs visit references visually distinct and consistently mono/LTR.
- Audit list column density, filters, URL continuity, empty/loading/error states,
  and detail return paths at desktop, 390px, Arabic/RTL, and dark mode.

### Slice 3 — Component coverage and interaction quality

- Replace remaining slice-specific styling where a canonical component already
  exists: FilterBar, DataGrid, StatusSelector, DateRangePicker, UserChip,
  EmptyState, Alert, Pagination, and Modal/Drawer patterns.
- Audit native selects versus the governed Select/Combobox contract; retain
  native selects only where the contract permits them and document exceptions.
- Verify keyboard focus, `aria-describedby`, `aria-sort`, listbox/tree semantics,
  touch targets, and reduced-motion behavior.

### Slice 4 — Runtime wiring and contract reconciliation

- Re-run the complete Planning browser matrix across Planner, Reviewer,
  Inspector, Admin, Arabic/RTL, light/dark, and narrow viewport.
- Verify reference-series values end-to-end from draft → publish → list → detail
  → export without changing immutable or unique business keys.
- Reconcile known gaps: intermittent Planning load latency, export date-stamp
  guardrail classification, reviewer publish asymmetry, and staging drift.

### Slice 5 — Certification and handoff

- Run focused typecheck/build, Planning e2e, negative paths, browser evidence,
  and the design-system guardrail.
- Update the acceptance/evidence records and session ledger only with observed
  results; do not claim the whole module complete while any required P0/P1
  criterion is unevidenced.

## Do-not-touch boundaries

- No changes to frozen product-contract artifacts without change control.
- No invented reference prefixes, thresholds, policy values, providers, or
  Arabic scope.
- No direct workflow-status mutation, immutable-version edits, or silent
  offline/server conflict overwrite.
- No changes to the unrelated Factory 360 slice or the active performance
  branch's protected evidence without an explicit task boundary.
- No merge, push, or main-branch rewrite.

## Current verification

- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- Planning-local design guardrail: 1 remaining finding, limited to the export
  filename date stamp in `planning/export-actions.ts`; no remaining Planning
  rendered-date or raw-glyph findings.
- Read-only browser certification attempt: BLOCKED at authentication setup;
  `/login` did not transition the supplied demo credentials to the persona home
  route, matching the prior independent browser observation. No Planning
  assertions were claimed from that run.
