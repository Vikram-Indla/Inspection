# CD-006 through CD-011 backend completion — 2026-07-15

## Disposition

**SOURCE REMEDIATED / LOCALLY VERIFIED / LIVE MIGRATIONS AWAITING EXPLICIT APPROVAL.**

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
  private-storage attachment upload/retrieval are represented by server actions
  and a forward migration; files are SHA-256 checksummed and metadata-audited.
- Publish rejects empty regulations and clauses that are not mapped to an item.
- Publish records the checker and rejects no-op/stale transitions.
- Published/deactivated parent rows are immutable; clauses and attachment
  metadata are editable only while the parent regulation remains a draft.
- Deactivation prevents future package publication through both application
  validation and a database trigger without deleting prior version references.
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
- Penalty mappings carry governed draft/published/deactivated lifecycle and effective
  periods. One-draft/one-active indexes, atomic successor publication, maker-checker,
  row immutability, legal-basis/preset validation, audit and historical mapping-version
  references are enforced at the database boundary.

### Field/runtime enforcement

- Published package versions remain byte-for-byte immutable. Legacy versions use an
  append-only `package_version_item_snapshots` companion table; new publications embed
  the same item snapshot in their governed definition.
- Package effective windows and predecessor lineage are persisted and enforced through
  an atomic maker-checker publish RPC. All planning entry points reject future or expired
  package versions.

- Optional visible items may remain unanswered.
- Conditional items are mandatory only when visible and explicitly configured
  `mandatory_when_visible`.
- Scoring-disabled answers are always excluded from scoring.
- Item-answer conditions such as `ITEM-001=compliant` feed visibility directly;
  manual site flags are reserved for non-item keys.
- Mandatory evidence is counted by configured type, so a document cannot satisfy
  a required video leg; offline replay preserves photo/video/document/comment.
- Weighted health-score calculation excludes disabled/N/A answers from both the
  numerator and denominator and is persisted in the immutable submission snapshot.

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
- focused backend/runtime completion suite — **8/8 PASS**.
- `git diff --check` — PASS.
- The older CD-006..011 browser specs were also invoked, but cannot certify this
  isolated backend worktree: their persona storage states and Supabase runtime
  variables are intentionally absent, and several source assertions encode the
  superseded state where audit/usage/authoring legs were blocked. Result:
  Those specs have now been revised: stale route/blocker assertions were removed,
  admin authentication was added, screenshot waits require real content, and the
  regulation suite treats the unavailable completion schema as a failure. Final
  authenticated rerun remains pending the live migrations below.

## Live boundary

Migration `20260715173000_admin_configuration_audit.sql` is already live and was
read-only verified on project `iiozvqntawxfwbgffzqu`. The forward migrations
`20260715200000_cd006_011_backend_completion.sql` and
`20260715210000_cd006_011_frontend_strings.sql` have **not** been applied. Exact
live approval has been requested. Until it is given, the strict regulation browser
suite intentionally treats the unavailable completion schema as a certification
failure rather than accepting the degraded UI as a pass.

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
