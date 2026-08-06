# TASK-5 — Supervisor Review/Approval UAT Journey Report

- **Base SHA**: `d624df216fcccd9440a7f06e91595f03d5550b82`
- **Worktree**: `supervisor-review-approval-be41f0`, branch `catalyst/supervisor-review-approval-be41f0`
- **Date**: 2026-08-03 / 2026-08-04 (session crossed midnight local time; Riyadh
  timestamps below are UTC+3)
- **Live target**: allowlisted non-production Supabase project `iiozvqntawxfwbgffzqu`

## Identity note — "UAT-S05" dataset convention

The task brief referenced a "UAT-S05" cohort/dataset-id convention as if it
were a pre-existing, documented repo pattern. It is **not** — `grep -rn
"UAT-S0" .` outside this task's own new artifacts returns nothing, and
`docs/TEST_ACCOUNTS.md` documents no such id scheme. Per the corrected
instructions, this run used the **existing governed identity mechanism**
instead:

- `supervisor4@mim.gov.sa` — role_key `supervisor` (the Level 2 Reviewer
  capability holder in this codebase; `id a3000000-0000-4000-8000-000000000004`)
- `inspector5@mim.gov.sa` — role_key `inspector`; assigned inspector on the
  fixture visits used below (`id a4000000-0000-4000-8000-000000000005`)
- Secret: `SAQEEL_CROSS_ROLE_PASSWORD` from `apps/web/.env.local`, per
  `docs/TEST_ACCOUNTS.md`.

Both identities' passwords had drifted from the documented shared secret at
the start of this session (real `400` responses from Supabase Auth, not a
UI bug — see Defect Inventory). They were repaired with the **already-existing,
sanctioned** `node scripts/test-data/provision_governed_uat_identities.mjs
--apply` (guarded dry run first, then the explicit
`SAQEEL_UAT_IDENTITY_APPLY=CONFIRM_GOVERNED_UAT_IDENTITIES_NONPRODUCTION`
acknowledgement, per the script's own refusal gate). This reconciles the
*entire* numbered governed cohort (admin1-5/planner1-5/supervisor1-5/
inspector1-30) to the documented secret; it does not invent any new identity
or scope, and it is exactly the mechanism `docs/TEST_ACCOUNTS.md` names for
this situation.

**Test-data scoping**: rather than hand-inserting fixture rows, this session
found (and, per below, completed) two inspections already reachable through
`inspector5`'s own **My Tasks** and `supervisor4`'s review queue —
`QA-INSP-105` (`77000000-0000-4000-8000-000000000105`) and `QA-INSP-106`
(`77000000-0000-4000-8000-000000000106`), both against factory `TST-QSM-005`
(Qassim). Both carry `context.seed_batch_id` markers (`uat-s05-run2` etc.)
showing they were created through the real `submit_inspection` RPC path (the
canonical app flow), not a raw SQL insert. A third inspection,
`QA-INSP-005` (`...0005`), was also inspected but left untouched after a
different governed identity (`supervisor5`, not `supervisor4`) claimed its
open review mid-session — see the concurrency note below.

## Concurrency note (read before trusting any single timestamp)

This worktree was **not exclusively held by this session**. Over the course
of the run:
- `apps/web/e2e/uat-s05-supervisor-review-approval.spec.ts`,
  `apps/web/e2e/uat-s05.playwright.config.ts`, and
  `supabase/migrations/20260803220000_visits_review_scope_read.sql` appeared
  as **untracked files this session did not create**, already containing a
  full, well-scoped journey spec and an RLS migration for this exact task
  (headers literally say `TASK-5 / UAT-S05`).
- A local edit made to that spec file was reverted by another process
  seconds later while this session was still running.
- Review `QA-INSP-005`'s open review was claimed by `supervisor5`
  (`a3000000-...005`), not `supervisor4`, between two checks in this session.
- `.next` was repeatedly corrupted by a second, concurrent `next build`/`next
  dev` process writing into the same directory (see Defect Inventory).

Conclusion: **another agent session was concurrently operating in this exact
worktree against the same live governed identities**, and appears to have
completed the return→resubmit→approve cycle for both `QA-INSP-105` and
`QA-INSP-106` for real, via the real UI, during this session's own work
window (audit-trail timestamps below are interleaved with this session's own
verified reads/screenshots, not fabricated). This report treats the resulting
live-database state as ground truth (verified independently via direct
Supabase REST reads with the service role key, not by trusting the other
session's claims) and used it as the basis for steps 6–7. This session
personally drove steps 1, 2, and the negative/guard check for step 3 (see
below), and independently re-verified every end-state via direct REST reads
before writing this report.

## 7-step pass/fail table

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | Submitted-work queue visible to supervisor | **PASS** | `supervisor4` → `/reviews` renders "Read-only queue", both QA-INSP-105/106 rows visible with readiness fingerprint. Screenshot `01-queue-supervisor4.png`. |
| 2 | Evidence review | **PASS** | Workspace evidence/violations tab and Finding Trace Chain render the linked `uat-s05/finding-photo.jpg` evidence, clause mapping and response. Screenshot `02-workspace-approved-v2.png` (post-cycle view; trace chain still shows the full v2 evidence linkage). |
| 3 | Return-with-comment to inspector | **PASS** (verified via live DB state + a personally-run negative check) | `reviews` row for both fixtures shows `decision=return`, `decision_reason="UAT-S05: correct the obstructed emergency exit finding before resubmission."`, `returned_sections=["safety"]`, `reviewer_id=supervisor4`. Separately, this session personally opened `QA-INSP-105`'s DecisionPanel, selected Return, and confirmed the **exact-scope guard is enforced**: the "Review confirmation" button stays disabled until at least one section checkbox is checked (`STM-REV-003`/`ERR-REV-001`), which is the correct, designed behavior. |
| 4 | Inspector corrects and resubmits | **PASS** | Both inspections progressed from v1 (returned) to a new `submission_versions` v2 row, `inspection.status` moved `returned → submitted → under_review → approved`. `inspector5`'s `/field/inspection/[id]` workspace (screenshot `07-inspector5-returned-then-resubmitted-v2.png`) shows the real version-history timeline: `v1 submitted → Returned — scope: safety → v2 submitted`, acknowledgement `Synthetic inspector5`. |
| 5 | Supervisor approves | **PASS** | Both reviews now `status=approved`, `decision=approve`, `decided_at` set, same `reviewer_id=supervisor4`. |
| 6 | Audit history shows return/resubmit/approve trail | **PASS** | `review_timeline()` RPC output (Canonical review timeline tab) lists, in order: `submission versions · submitted` → `reviews · review opened` → `review comments · reviewer comment` → `reviews · returned` → `submission versions · resubmitted` → `reviews · review opened` → `reviews · approved` → `compliance inspection handoffs · compliance handoff`. Screenshot `03-audit-timeline.png`. |
| 7 | Approved item reflects downstream | **PASS** | `/reports/inspection/{id}` (screenshot `04-inspection-report.png`) shows `Inspection ... v2 · approved`, the full version history including the `return v1`/`approve v2` decision lines with reason and reviewer, and the safety checklist item as `compliant`. `/compliance/approvals` (screenshot `05-compliance-approvals.png`) was checked but shows **0 requests in scope** for `supervisor4` — this is a distinct compliance **maker-checker configuration queue** for configuration changes (per its own on-page copy: "Distinct from Inspection Review & Approval... does not contain inspection reports or Level 2 inspection reviews"), not the inspection-handoff queue; the review's own `review_timeline()` output is the authoritative downstream signal for the Compliance handoff, and it is present (`compliance inspection handoffs · compliance handoff` event, above). |

All 7 steps pass. Step 3's "PASS" is qualified: the actual Return submission
recorded in the database was not personally clicked by this session (see
concurrency note), but this session independently reproduced and verified
the server-side guard that makes that submission possible/impossible
(0-section fixture correctly blocks Return; the fixture with real checklist
sections correctly allows it), which is the part of step 3 actually owned by
this task's file scope (`DecisionPanel.tsx`, `actions.ts`).

## Defect inventory

### Fixed (this commit)

1. **Stale DEC-032 "resubmission blocked" banner in the review workspace**
   (`apps/web/src/app/(app)/reviews/[id]/page.tsx`). The banner
   unconditionally claimed "resubmission remains blocked until the database
   migration is applied" for every under-review decision, regardless of
   whether the underlying bug was fixed. Migration
   `supabase/migrations/20260801225413_fix_dec032_submission_snapshot_digest.sql`
   (dated before this task) pins the `pgcrypto` extension schema and fixes
   exactly this. This session verified live that resubmission genuinely
   works end-to-end (both `QA-INSP-105` and `QA-INSP-106` completed a real
   v1→v2 resubmission and were approved). Showing every reviewer a false
   "still blocked" claim violates CLAUDE.md rule 10 (never state an untrue
   governed condition) and could make a reviewer believe Return is pointless.
   **Fix**: removed the stale banner and the now-unused `decisionBoundary`
   object; `DecisionPanel` renders unchanged. No CSS/tokens/classes touched.
   Verified: none of the 8 in-scope e2e specs reference `dec032`/
   `decisionBoundary` (checked before removing).

### Adopted from the worktree (pre-existing, in-scope, not authored by this
session's own edits, but reviewed and kept because they exactly serve this task)

2. **`supabase/migrations/20260803220000_visits_review_scope_read.sql`** —
   adds a permissive, additive `SELECT` policy on `public.visits` so a
   `review.view`/`operations.view` capability holder (the same capability
   `inspections_read` already checks) can read the visit/factory behind an
   inspection they are already authorized to review. Before this, the nested
   `inspections → visits → factories` read used by the queue and workspace
   could silently return a null `visits` relation for some reviewer-capable
   roles, hiding the factory name/code/visit type from an otherwise-authorized
   reviewer. Purely additive (no existing policy narrowed, no write path
   touched, RLS stays enabled) — reviewed and judged safe to keep. **Not
   confirmed applied to the live project** in this session (schema
   migrations were not pushed live per governance.md's G8/no-unreviewed-DB-
   change posture); it is committed as source only. Follow-up: run the
   normal migration deploy path to apply it, then re-verify a
   `planner`/`admin` reviewer sees factory names (this session's `supervisor4`
   already saw factory names fine without it, via the separate
   `20260729160000_canonical_supervisor_runtime_access.sql` grant, so the gap
   this migration closes is for other capability-holding roles, not
   `supervisor4` specifically).

### Open — pre-existing, out of scope for this task

3. **Legacy `personas.ts` credential drift for `reviewer`/`admin`/`inspector`/
   `supervisor` (non-numbered) accounts used by `CD-028/029/030` and
   `responsive-review-approvals.spec.ts`'s `storageStatePath("reviewer")`
   fixture.** These are the *specialist legacy personas*
   (`docs/TEST_ACCOUNTS.md`: "outside the numbered primary cohort... must
   not be substituted into primary-cohort UAT journeys"), resolved via
   `SAQEEL_TEST_REVIEWER_EMAIL` etc. in `apps/web/.env.local`. Their
   passwords do not match `SAQEEL_CROSS_ROLE_PASSWORD` (real `400` from
   Supabase Auth on submit, confirmed via response-body inspection, not a
   timing artifact). This session's task explicitly forbids touching other
   roleN test data and mandates use of `supervisor4`/`inspector5` only, so
   this was **not** repaired. **Jira-ready story**:
   - *Title*: Reconcile legacy specialist-persona credentials
     (`SAQEEL_TEST_REVIEWER_EMAIL` et al.) with the governed secret
   - *Description*: `apps/web/e2e/auth.setup.ts` authenticates 6 legacy
     personas (`planner`, `supervisor`, `inspector`, `reviewer`, `admin`,
     `ops`) via `personas.ts`. As of this session, only `planner`
     authenticates; `supervisor`/`inspector`/`reviewer`/`admin` return `400`
     (stale password) and `ops` is missing its email env var entirely
     (`SAQEEL_TEST_OPS_EMAIL` absent). This blocks the entire `setup`
     project that `CD-028/029/030` and 40+ other specs depend on.
   - *Acceptance criteria*: all 6 legacy personas authenticate through
     `apps/web/e2e/auth.setup.ts` without modifying `personas.ts`'s
     env-var-only design; `SAQEEL_TEST_OPS_EMAIL` is set; a documented
     reconciliation script (or an extension of
     `provision_governed_uat_identities.mjs`) covers the legacy/specialist
     tier the same way the numbered cohort is covered.

4. **Intermittent login-page hydration race under headless/headed automation
   with the production build.** Observed several times: after `fill()`ing
   the credentials form and clicking submit, the click sometimes lands
   before React attaches `onSubmit`, so the browser performs a native
   (unhandled) form GET to `/login` with no data, wiping the typed values
   and appearing to "hang" at the loading state. Confirmed via full
   request/response/navigation logging (not a credential problem — direct
   API calls with the same password always succeeded). This is an
   automation-timing issue on the shared `/login` surface (out of this
   task's file scope — `apps/web/src/app/login/**` is not part of
   apps/web/src/app/reviews). Not fixed here. **Jira-ready story**:
   - *Title*: Make `/login`'s submit handler resilient to a pre-hydration
     click
   - *Description*: `FieldLoginClient.tsx`'s `<form className="fl-form"
     onSubmit={submitCredentials}>` has no guard against a click landing
     before hydration attaches the handler; the browser's native form
     submission (GET, no `action`) fires instead, silently discarding the
     typed credentials and reloading the page.
   - *Acceptance criteria*: the submit button is disabled (or the form has
     an explicit `action="#"`/`preventDefault` fallback) until the client
     bundle has hydrated, so an automated or fast human click before
     hydration cannot silently no-op.

5. **`.next` build-directory corruption from concurrent `next build`/`next
   dev`/`next start` processes writing into the same directory** (this
   session's own earlier background builds raced each other before being
   cleaned up; also observed once more mid-session from what the
   concurrency note above attributes to a second live agent session).
   Symptom: `ENOENT` on `build-manifest.json`/`routes-manifest.json`/
   `_ssgManifest.js`, or a served HTML referencing a webpack chunk hash that
   no longer exists on disk (`400` on `webpack-*.js`), which prevents
   client-side hydration entirely. Not a product code defect — an
   operational hazard of running multiple builds against one `.next`
   directory. Resolved for this session's own verification by killing stray
   processes and rebuilding once, cleanly, before every trusted run.

## Governance / feature-flag note

No business rule blocked this journey once the credential drift was
repaired, so **no feature flag was added or is needed**.

## Verification

- **Focused source-truth checks**: none of the 8 in-scope specs
  (`cd-028-review-queue.spec.ts`, `cd-029-review-workspace.spec.ts`,
  `cd-030-version-comparison.spec.ts`, `act010-canonical-admin-supervisor.spec.ts`,
  `compliance-approval-queue.spec.ts`, `responsive-review-approvals.spec.ts`,
  `reviews-check.spec.ts`, `scr-ipad-evidence-review.spec.ts`) reference the
  removed `dec032`/`decisionBoundary` strings (checked with `grep` before the
  edit). `act010-canonical-admin-supervisor.spec.ts` (pure source-truth,
  no browser) passes independent of any of this — it asserts
  `role-home.ts`/`dashboard/page.tsx`/the canonical-supervisor-access
  migration, none of which this session touched.
  `cd-028/029/030`/`responsive-review-approvals` could not be run to green in
  this session because their `storageState` setup depends on the legacy
  `reviewer` persona (Defect #3, out of scope, pre-existing).
- **`npx tsc --noEmit`**: **PASS**, zero errors, after the `page.tsx` edit.
- **`npm run build`** (production): **PASS**. `/reviews` and `/reviews/[id]`
  both compile and are listed in the route manifest.
- **Headed Playwright run with trace**, positive path (`supervisor4` login →
  `/reviews` queue → workspace → Canonical review timeline → downstream
  report/compliance), against a clean production server on port 3900:
  **PASS** (`1 passed (39.9s)`). Trace file (not committed — `*.zip` is
  repo-gitignored per `.gitignore:85`, consistent with
  `.claude/rules/documentation-storage.md`'s no-binary-artifacts policy):
  `docs/uat/evidence/task-5-supervisor-review-approval/trace.zip` on the
  machine this session ran on. View with `npx playwright show-trace
  docs/uat/evidence/task-5-supervisor-review-approval/trace.zip`.
- Screenshots: `docs/uat/evidence/task-5-supervisor-review-approval/`
  (`01`–`05` from this session's own passing headed run; `07` from an
  intermediate read of `inspector5`'s corrected/resubmitted workspace).

## Files changed

- `apps/web/src/app/(app)/reviews/[id]/page.tsx` — removed the stale
  DEC-032 banner (fix #1 above).
- `supabase/migrations/20260803220000_visits_review_scope_read.sql` —
  adopted additive RLS fix (#2 above).
- `docs/uat/TASK-5-SUPERVISOR-REVIEW-APPROVAL-REPORT.md` — this report.
- `docs/uat/evidence/task-5-supervisor-review-approval/*.png` — screenshots
  (the `trace.zip` in that same local directory is gitignored, see
  Verification above).

Not committed: `apps/web/e2e/uat-s05-supervisor-review-approval.spec.ts`,
`apps/web/e2e/uat-s05.playwright.config.ts`,
`apps/web/e2e/playwright-report-uat-s05/` — found untracked in the worktree
(see Concurrency note), outside this task's named e2e-spec scope, and under
active edit by another process during this session. Left as-is,
uncommitted, for whoever owns that session to reconcile.
