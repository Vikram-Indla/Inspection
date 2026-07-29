# Requirements Alignment closure implementation evidence

Status: `LOCAL_IMPLEMENTATION_ACTIVE`

Packet: `REQ-ALIGNMENT-CLOSURE-IMPLEMENTATION-001`

Base: `58b71f19`

Branch: `codex/requirements-alignment-closure`

## Authorization boundary

The Product Owner authorized Codex as delivery actor for this bounded packet,
superseding the permanent no-holder rule for this packet only. Repository
changes and local tests are authorized. Drive, production database, deployment,
account changes, push and merge remain excluded.

## Approved decisions

1. Immediate/manual establishment remains a separately permissioned exception.
   Normal Single Planning remains registered-only; manual data remains visibly
   unverified and does not overwrite Senaei/master establishment data.
2. A stale saved target retains its historical snapshot but must be reselected
   against current canonical identity before publication.
3. The configured 720-hour cancellation/rescheduling boundary is inclusive.
   Evidence must identify the applied rule/version and server evaluation facts.

## Evidence ledger

| Requirement | Local implementation | Local verification | Live proof | State |
|---|---|---|---|---|
| REQ-005 | Immediate retained as permissioned exception; registered master remains protected | source contract PASS | authenticated role/manual-record proof required | implemented, not live-closed |
| REQ-006 | existing partial | source-reviewed | provider call required | open |
| REQ-007 | existing partial | source-reviewed | cross-role proof required | open |
| REQ-008 | explainable region/capacity recommendation; automatic assignment stores ranked factors; override requires explicit capability, governed reason and immutable audit | source contract PASS | planner/supervisor recommendation and override proof required | implemented, not live-closed |
| REQ-010 | existing forward migration | pending | database proof required | open |
| REQ-011 | saved history retained; resumed publication requires explicit exact reselection | source contract PASS | resume/reselect/concurrency proof required | implemented, not live-closed |
| REQ-012 | existing forward migration | pending | rollback/replay proof required | open |
| REQ-013 | versioned effective cutoff, inclusive evaluation, database guard and receipt provenance | source contract PASS | migration and exact boundary proof required | implemented, not live-closed |
| REQ-014 | Planning landing now describes Immediate as a permissioned exception rather than an unresolved decision | source contract PASS | role-routing proof required | implemented, not live-closed |
| REQ-015 | existing substantial | source-reviewed | filter/export proof required | open |
| REQ-016 | handoff/draft identity must resolve and be explicitly reselected before publish | source contract PASS | Factory 360 handoff proof required | implemented, not live-closed |
| REQ-017 | existing durable intent | source-reviewed | provider lifecycle proof required | open |
| REQ-018 | versioned attachment-policy resolver validates count, MIME and size without invented defaults | source contract PASS | upload/publish integration proof required | backend partial |

No requirement is closed by this local packet. Authenticated non-production
runtime evidence remains mandatory.

## Local verification

- `git diff --check`: PASS.
- Focused Playwright source contract:
  `requirements-alignment-closure.spec.ts --project=e2e --no-deps`:
  **5 passed / 0 failed**.
- Full TypeScript check: environment-blocked. This worktree has no dependency
  installation; invoking the canonical clone's compiler cannot resolve modules
  from this worktree. No dependency installation or layout mutation was made.
- Full Playwright setup: environment-blocked by absent persona credentials.
  The focused source-only project was rerun without setup dependencies.

## Acceptance-return repairs

The Action Register owner returned three defects and they were repaired
forward-only in this packet:

1. Automatic recommendation now applies only to Single Planning assignments.
   Bulk and Immediate assignment inserts retain their existing governed
   contracts.
2. Inspector recommendations exclude profiles whose governed account status is
   not active, without changing any profile, role or account.
3. Attachment validation fails closed for missing, negative, nonnumeric and
   out-of-range `size_bytes`; the configured maximum is evaluated only after a
   valid non-negative integer is established.

Focused source verification was rerun after these repairs: **5 passed / 0
failed**. `git diff --check` also passed. Executable SQL and authenticated
non-production proofs remain required before any requirement is closed.

## Concurrent-path disclosure

During verification, unrelated wording edits appeared in
`planning/page.tsx` and `planning/single/page.tsx`. This packet did not author
the `Plan one visit` → `Plan single visit` wording change. It is preserved and
excluded from this packet's evidence claim. The packet's own edit in
`planning/page.tsx` is limited to the approved Immediate-exception description
and removal of the stale decision-pending marker.

## Design-authority finding

The approved `design/final-cut/saqeel-revamp.html` Planning screen was inspected
in a browser. Its Create Visit menu exposes a Single Visit preview card, but
the `Start Single visit` control does not navigate to or render an interactive
`/planning/single` workflow. Consequently there is no authoritative element
order, nesting or existing-class contract for a pre-publication attachment
control. Under the non-negotiable design rules, no attachment UI was invented.
REQ-018 remains backend-partial until that screen contract is supplied.
