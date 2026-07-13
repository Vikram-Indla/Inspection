# Claude Code Continuation — CD-023 Live Remediation

## Outcome first

CD-023 remediation is implemented and verified against the linked Supabase
development project. All nine original audit findings and both residual items
from the independent static re-audit are corrected. The focused live suite is
**12/12 PASS** and generated all eight required visual frames.

This is an execution handoff, not a self-issued DEC-012 verdict. CD-023 closure
still requires a fresh independent reviewer to audit the live evidence and the
real `outputs/cd-023/WIRING_MAP_CD-023.csv`, followed by sponsor runtime
acceptance. CD-024+ implementation remains blocked until that gate is recorded.

## Resume authority

Read in order:

1. `AGENTS.md`
2. `product-contract/00_START_HERE.md`
3. `product-contract/CURRENT_STATE.md`
4. `product-contract/governance/OPEN_DECISIONS.yaml` / DEC-012
5. `outputs/cd-023/WIRING_MAP_CD-023.csv`
6. `product-contract/evidence/screens/immediate-v2/CODEX_AUDIT_CD-023.md`
7. `product-contract/evidence/screens/immediate-v2/CODEX_AUDIT_CD-023_REMEDIATION_REVIEW.md`
8. `product-contract/evidence/screens/immediate-v2/CD023_LIVE_REMEDIATION_EVIDENCE.md`

The CD-023 design package exists under `outputs/cd-023/`; the earlier local-only
provenance report was superseded after the package was retrieved from Claude
Design project `90d4620c`. Do not repeat the obsolete “package missing” claim.

## Live database state

Project: `iiozvqntawxfwbgffzqu`.

Applied transactionally through the authenticated Supabase SQL editor:

- `0027_cd023_immediate_visit_atomic.sql`
- `0028_cd023_private_helpers.sql`
- `0029_cd023_rls_initplan.sql`
- `0030_cd023_inspector_immediate_expiry.sql`
- `0031_cd023_assignment_overlap_guard.sql`

The project has no `supabase_migrations.schema_migrations` table, and the CLI
could not authenticate database commands despite a successful device login.
Therefore there is no CLI migration-ledger entry for these dashboard-applied
transactions. Do not fabricate or backfill migration history without a separate
operations/governance decision.

Database hardening outcomes:

- helper functions moved to the private schema with exact grants;
- the three CD-023 RLS policies use initplan-safe auth predicates;
- Inspector self-created start-now Visits are not immediately expired;
- assignment writes serialize per Inspector and reject overlapping active
  windows, closing the availability race found by the static reviewer;
- Security Advisor warnings reduced from 60 to 56; Performance Advisor reports
  0 errors and warnings reduced from 139 to 137;
- remaining advisor findings predate CD-023 and are outside this slice.

## Verification record

- production build: PASS
- sequential typecheck: PASS
- isolated PostgreSQL contract: `CD023_DATABASE_CONTRACT_PASS`
- focused live CD-023: **12/12 PASS** (3 persona setup + 9 product tests)
- inspector-window concurrency proof: PASS; two requests, one Visit retained
- persona regression: **9/9 PASS**
- visual matrix: 8/8 captured, EN/AR × dark/light × desktop/narrow
- Arabic: labels, live announcement, and blocking detail text verified; no
  English fallback in the asserted Arabic authority state
- full-suite attempt before the final narrow fixes: 56 passed, 9 failed, 5 did
  not run. CD-023 tests passed; failures originated in concurrent uncommitted
  CD-022 work, and missing auth-state cascades were repaired by moving reusable
  state outside Playwright's disposable `test-results` directory. Do not report
  the complete regression as PASS until rerun from a coherent slice worktree.

## Original findings and final state

| Finding | Final remediation | Live proof |
|---|---|---|
| FAIL-01 blank coordinates | raw-presence and RPC range guards | focused negative PASS |
| FAIL-02 discarded location | Visit coordinates + explicit provenance; master coordinates immutable | live row assertions PASS |
| FAIL-03 stale package | package re-read inside atomic RPC | unavailable-package blocker PASS |
| FAIL-04 audit gaps | row triggers + governed attempt audit | exact five-leg audit assertion PASS |
| FAIL-05 retry/idempotency | request lock, unique guards, stored-role replay, identity locks | concurrent replay and identity races PASS |
| FAIL-06 swallowed read failures | fail-closed transaction with neutral result | isolated forced-failure contract PASS |
| FAIL-07 false partial ledger | one atomic RPC; client ledger removed | structural + runtime PASS |
| FAIL-08 partial Arabic | all authority labels/details explicitly bilingual | live Arabic assertions PASS |
| FAIL-09 evidence gaps | expanded focused suite and eight frames | 12/12 + 8/8 PASS |
| residual: inspector race | canonical assignment advisory lock + overlap guard | live concurrent contention PASS |
| residual: DB translation uncertainty | critical authority details use explicit `tr()` Arabic | live no-fallback assertion PASS |

## Exact next execution sequence

1. Run the complete Playwright regression from a coherent worktree after the
   concurrent CD-022 changes are either committed or isolated.
2. Assign a distinct Codex reviewer to perform the row-by-row wiring audit using
   the checklist and the live evidence above. This implementation session must
   not author the final DEC-012 PASS.
3. Record reviewer/date/verdict/evidence in the wiring-map/evidence trace.
4. Obtain sponsor runtime acceptance.
5. Only after steps 1-4 pass may CD-023 be closed and CD-024+ implementation be
   considered under its own design/start gates.

No push, merge, release deployment, or `main` modification was performed.
