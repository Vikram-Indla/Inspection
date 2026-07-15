# CD-006 through CD-011 backend completion — 2026-07-15

## Disposition

**SOURCE COMPLETE / LOCALLY VERIFIED / LIVE MIGRATION AWAITING EXPLICIT APPROVAL.**

Sponsor authorization is recorded under `CD-006-011-backend-authorization` in
`product-contract/governance/HUMAN_APPROVALS.yaml`. This slice closes the
remaining backend-authoring gaps for the Admin Control Plane family without
authorizing the frontend design, inventing policy values, or mutating `main`.

## Contract scope

- Screens: CD-006, CD-007, CD-008, CD-009, CD-010, CD-011.
- Process: P09 Admin Control Plane.
- Requirements: MVP1-M09-001, MVP1-M09-005, MVP1-M09-018,
  MVP1-M09-021, MVP1-M09-022, MVP1-M09-024, plus the already implemented
  M09-002..004, M09-012..013, M09-019..020, M09-025..026, M09-028..030
  contracts that these changes preserve.
- Acceptance: AC-0449, AC-0453, AC-0466, AC-0469, AC-0470, AC-0472.
- Engines: ENG-08 configuration, ENG-12 audit.
- Roles: compliance_admin and form_admin; all writes remain fail-closed through
  `requireConfigurationWriter()` and database RLS.

## Implemented backend contracts

### CD-006 — regulation detail and lifecycle

- Effective date, draft update, governed publish, governed deactivation, and
  attachment metadata are represented by server actions and a forward migration.
- Publish rejects empty regulations and clauses that are not mapped to an item.
- Publish records the checker and rejects no-op/stale transitions.
- Published/deactivated parent rows are immutable; clauses and attachment
  metadata are editable only while the parent regulation remains a draft.
- Deactivation prevents future active use without deleting prior references.
- Object-scoped audit retrieval exposes the exact regulation timeline to config
  authors without granting broad access to `audit_events`.

### CD-007 — inspection item authoring

- Evidence presets cover the four accepted types: photo, video, document,
  comment. No free-form policy payload is accepted.
- Required, optional, and conditional modes are authored explicitly.
- Conditional rules use the runtime-supported `key=value` grammar and carry
  `mandatory_when_visible` explicitly.
- Scoring is explicitly enabled/disabled; disabled items are excluded for every
  accepted response and do not retain a score weight.
- A role-gated aggregate usage reader returns package/version counts without
  exposing operational rows.

### CD-008/CD-009 — package library and designer

- Publish validation now rejects missing or malformed conditional rules in
  addition to existing item, action-form, evidence, violation, and penalty
  dependency checks.
- Published versions remain immutable and active prior versions remain pinned.

### CD-010/CD-011 — violation and penalty control planes

- Violation deactivation requires an explicit valid active-to date and rejects
  a date before active-from; a database check enforces the same invariant.
- Aggregate usage returns item-reference and runtime-reference counts.
- Existing one-to-one penalty mapping, legal-basis requirement, governed presets,
  neutral failures, audit triggers, and unique-constraint negatives are preserved.

### Field/runtime enforcement

- Optional visible items may remain unanswered.
- Conditional items are mandatory only when visible and explicitly configured
  `mandatory_when_visible`.
- Scoring-disabled answers are always excluded from scoring.
- Hidden items remain outside mandatory validation through the existing
  visibility evaluation.

## Files

- `supabase/migrations/20260715200000_cd006_011_backend_completion.sql`
- `apps/web/src/app/admin/regulations/actions.ts`
- `apps/web/src/app/admin/items/actions.ts`
- `apps/web/src/app/admin/packages/actions.ts`
- `apps/web/src/app/admin/violations/actions.ts`
- `apps/web/src/app/field/inspection/[id]/runtime.ts`
- `apps/web/e2e/cd-006-011-backend-completion.spec.ts`
- `outputs/claude-design-approval-pack/admin-control-plane-suite/CD006_CD011_CLAUDE_CODE_FRONTEND_HANDOFF_2026-07-15.md`

## Verification

- `npm run typecheck` — PASS.
- `npm run build` — PASS.
- focused backend completion suite — **7/7 PASS**.
- `git diff --check` — PASS.
- The older CD-006..011 browser specs were also invoked, but cannot certify this
  isolated backend worktree: their persona storage states and Supabase runtime
  variables are intentionally absent, and several source assertions encode the
  superseded state where audit/usage/authoring legs were blocked. Result:
  7 replacement backend checks passed; 62 old frontend/environment checks failed
  before meaningful runtime assertions. They must be revised and rerun by the
  frontend implementation lane with generated personas and configured runtime.

## Live boundary

Migration `20260715173000_admin_configuration_audit.sql` is already live and was
read-only verified on project `iiozvqntawxfwbgffzqu`. The new forward migration
`20260715200000_cd006_011_backend_completion.sql` has **not** been applied: the
shared live schema change requires the sponsor's explicit approval for this exact
migration after risk disclosure. Until that approval, frontend implementation may
compile against the source contract but live runtime verification of the new
columns, table, triggers, and RPCs remains pending.

## Claude Code frontend handoff

Frontend work may proceed in a separate branch/worktree from backend commit
`4af67c0` (preferred) or baseline commit `c6187cb` with implementation commits
`c4c5701` and `4af67c0` cherry-picked.
It should consume the exported
actions/RPC helpers and replace superseded HANDOFF_BLOCKED UI states.

Backend-owned files during parallel work:

- `supabase/migrations/**`
- `apps/web/src/app/admin/*/actions.ts`
- `apps/web/src/app/field/inspection/[id]/runtime.ts`
- this evidence record and the backend completion spec

Frontend-owned files:

- Admin page/components, CSS/tokens, localization copy/migrations coordinated
  separately, and CD-006..011 browser/visual/accessibility specs.

Do not merge a frontend claim of live completion until the forward migration is
explicitly approved, applied through the governed path, read-only reconciled,
and the revised authenticated browser suites pass.

Supabase's current security guidance was checked before finalization. The new
table has explicit authenticated Data API privileges plus RLS, and the scoped
`SECURITY DEFINER` readers use an empty search path, schema-qualified relations,
internal role checks, and explicit `PUBLIC`/`anon` execution revocation.
