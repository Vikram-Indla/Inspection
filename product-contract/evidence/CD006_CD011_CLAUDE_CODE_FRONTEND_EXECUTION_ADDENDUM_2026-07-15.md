# CD-006 through CD-011 — Claude Code frontend execution addendum

Date: 2026-07-15
Authority: `DEC-ADMIN-CP-001`, `HUMAN_APPROVALS.yaml` gate
`CD-006-011-backend-authorization`, and the sponsor direction to continue until
the complete Admin Control Plane requirement family is passed.

## Start point and isolation

- Create a new clean worktree from the commit that contains this addendum.
- Use one integrated non-main branch, recommended:
  `feat/cd006-011-frontend-final`.
- Do not work in `/private/tmp/Inspection-cd006-011-frontend`; Codex owns that
  worktree for backend/live verification and reconciliation.
- Do not modify, reset, clean, stash, absorb, or stage the dirty primary checkout.
- Do not push, merge, deploy, or apply migrations.

The two backend checkpoints immediately preceding this addendum are:

- `b89a030` — `feat(admin): wire CD-006 through CD-011`
- `9bac219` — `feat(admin): govern configuration lifecycles`

## Design source

The complete design delivery is in:

`/Users/vikramindla/Downloads/MVP1 UXUI refinement program-2.zip`

Use these directories inside the archive:

- `outputs/claude-design-approval-pack/admin-control-plane-suite/cd-006/`
- `outputs/claude-design-approval-pack/admin-control-plane-suite/cd-007/`
- `outputs/claude-design-approval-pack/admin-control-plane-suite/cd-008/`
- `outputs/claude-design-approval-pack/admin-control-plane-suite/cd-009/`
- `outputs/claude-design-approval-pack/admin-control-plane-suite/cd-010/`
- `outputs/claude-design-approval-pack/admin-control-plane-suite/cd-011-r2/`

The older per-CD implementation prompts under
`/Users/vikramindla/Downloads/outputs/claude-design-approval-pack/admin-control-plane-suite/implementation-prompts/`
describe the pre-completion backend and therefore are not current source truth for
blocked wiring. Preserve their visual, accessibility, failure-state, evidence, and
frozen-shell constraints; use the current repository for backend capability truth.

`DEC-ADMIN-CP-001` records the sponsor override that materially satisfies the old
manifest gate. Do not stop solely because the archived manifest still contains
`implementation_authorized: false`.

## Current backend truth that supersedes archived HANDOFF_BLOCKED rows

### CD-006 — regulation detail and version

- A real `/admin/regulations/[id]` route exists and is role-gated.
- Regulation draft editing, effective date, attachment upload/private retrieval,
  mapped-clause validation, maker-checker publish, governed deactivation, child
  immutability, scoped audit, and dependency protection exist.
- Do not invent a regulation side-by-side comparison engine. If the design requires
  it, render only what can be derived from existing version/source records or keep
  that visual target disabled with a truthful reason.

### CD-007 — inspection item catalogue

- Required/optional/conditional modes, conditional visibility and mandatory-when-
  visible, scoring enable/disable, all four governed evidence types, usage counts,
  scoped audit, reasoned deactivation, configuration versioning, and safe item edits
  after governed package snapshots exist.
- Existing published package definitions must remain immutable. Legacy item semantics
  come from the append-only companion snapshot table; new versions embed snapshots.

### CD-008/CD-009 — package library and designer

- Package effective windows, predecessor lineage, scheduled availability, item
  snapshots, dependency validation, circular visibility-rule rejection, impact
  counts, maker-checker publication, and immutable published versions exist.
- Every planning entry point rejects future or expired package versions.
- The package preview remains a read-only projection, not a simulation engine.
- A visual simulation tool and rich arbitrary rule canvas are not backend capabilities;
  never fabricate them.

### CD-010/CD-011 — violation and penalty governance

- Violation usage, scoped audit, active-window validation, reasoned/future-safe
  deactivation, role gating, and neutral errors exist.
- Penalty mappings have draft/published/deactivated lifecycle, effective periods,
  one-draft/one-active enforcement, successor lineage, maker-checker publication,
  and immutable governed rows.
- The approved schema still has no governed category/applicability value set or
  separate violation-code version model. Do not invent policy semantics. Keep those
  controls disabled/annotated unless a separate approved source is found.
- Never invent monetary amounts, legal rules, severity values, or penalty providers.

## Frontend implementation scope

Implement the approved visual composition, interaction, state, and accessibility
contracts in the existing Admin route families. The backend server actions and
migrations are protected behavior: consume them; do not redesign or replace them.

Permitted application areas:

- `apps/web/src/app/admin/regulations/**`
- `apps/web/src/app/admin/items/**`
- `apps/web/src/app/admin/packages/**`
- `apps/web/src/app/admin/violations/**`
- focused CD-006 through CD-011 Playwright tests and evidence records

Protected boundaries:

- Do not change `Shell.tsx`, `ShellClient.tsx`, `shell-navigation.ts`, `tokens.css`,
  global shell behavior, or global `astryx.css` rules.
- Do not modify `supabase/migrations/**`, RLS, grants, triggers, RPCs, storage policy,
  server-action semantics, workflow transitions, or historical snapshot behavior.
- Preserve neutral failures: unavailable/unknown is never zero, healthy, complete,
  or successful.
- Preserve the contract roles and server route guards; navigation visibility is not
  authorization.

## Required proof before handback

For each CD, return a path-by-path diff and reconcile every design wiring row to one
of: runtime PASS, tested negative PASS, or truthful HANDOFF_BLOCKED with owner.

Required verification:

- Typecheck and production build.
- Populated, loading, verified-empty, validation, unauthorized, read-only, stale,
  degraded, and recovery states where the source can deterministically exercise them.
- Writer and non-writer personas; maker-checker success and same-user denial.
- English and Arabic document-level RTL.
- Dark and light themes at desktop and native 1024×1366; narrow responsive check.
- No horizontal overflow; 44px minimum action targets; 16px inputs; keyboard focus,
  status/alert semantics, non-colour cues, and reduced-motion behavior.
- Focused CD-006–011 suites, then the complete regression with no hidden exclusions.

Do not claim `VERTICAL_SLICE_PASS` from screenshots or source-string assertions alone.
Live writer and migration-dependent proof will be completed by Codex after the final
Supabase migrations are explicitly approved and applied.
