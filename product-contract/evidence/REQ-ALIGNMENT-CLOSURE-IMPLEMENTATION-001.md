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
| REQ-018 | versioned attachment-policy resolver validates count, MIME and a present non-negative integer size without invented defaults | source + transactional SQL probe PASS | upload/publish integration proof required | implemented, not live-closed |

No requirement is closed by this local packet. Authenticated non-production
runtime evidence remains mandatory.

## Local verification

- `git diff --check`: PASS.
- Focused Playwright source contract:
  `requirements-alignment-closure.spec.ts --project=e2e --no-deps`:
  **6 passed / 0 failed**.
- Transactional SQL acceptance probe:
  `supabase/tests/0043_requirements_alignment_closure.sql`:
  **22 assertions passed / 0 failed**, followed by `ROLLBACK`.
  It covered migration replay, RLS/grants, exact 720h/±1ms, no-policy
  fail-closed, missing/negative/nonnumeric/zero/exact-max/max+1 attachment
  sizes, recommendation ordering/ties/unavailable facts, inactive-account
  exclusion, and actual Single/Bulk/Immediate automatic-assignment inserts.
- The SQL probe ran in an isolated temporary database on the existing local
  Supabase PostgreSQL stack. The target migration first applied cleanly to the
  probe schema, replayed inside the probe transaction, and all fixtures/DDL
  replay rolled back. The temporary database was then removed. No existing
  local, production, or account data was changed.
- Full repository clean reset: **BLOCKED before this packet**. The migration
  runner rejects duplicate versions (`0015`, `0020`, `0024`, plus timestamp
  duplicates); after test-only normalized ordering, an older package migration
  is rejected by its maker-checker guard. These baseline defects were not
  modified under this bounded packet.
- Full TypeScript check: environment-blocked. This worktree has no dependency
  installation; invoking the canonical clone's compiler cannot resolve modules
  from this worktree. No dependency installation or layout mutation was made.
- Full Playwright setup: environment-blocked by absent persona credentials.
  The focused source-only project was rerun without setup dependencies.

## Acceptance-return repairs

The Action Register owner returned three defects and they were repaired
forward-only in this packet:

1. Automatic recommendation now fires for Single, Bulk and Immediate automatic
   assignment inserts. The shared recommendation RPC accepts the corresponding
   per-method creation capability, and the trigger stamps its resolved method.
2. Inspector recommendations require both the inspector role and
   `profiles.account_status='active'`. Repository/live schema provenance is
   reconciled forward-only; existing profiles and statuses are preserved.
3. Attachment validation fails closed for missing, negative, nonnumeric and
   out-of-range `size_bytes`; the configured maximum is evaluated only after a
   valid non-negative integer is established.
4. The migration is replay-safe for its policies, triggers, seeds, columns and
   relations, and the executable probe covers RLS/grants, rollback, exact
   boundaries, ranking, unavailable factors, all three publish modes, and
   override audit/idempotency wiring.

Focused source verification was rerun after these repairs: **6 passed / 0
failed**. The transactional SQL probe passed **22 / 22** and `git diff --check`
passed. Authenticated non-production live proofs remain required before any
requirement is closed.

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
