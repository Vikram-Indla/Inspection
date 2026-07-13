# Claude Code Continuation — CD-023 Remediation

## Outcome first

The nine original wiring-audit findings are remediated in code and verified in an
isolated PostgreSQL environment. CD-023 is **not yet unblocked for closure**:
migration 0027 is not live, the migration-dependent Playwright suites have not
run, the design export/wiring map is missing, and DEC-012 requires a fresh
independent reviewer after runtime evidence exists.

## Resume authority

Read in order:

1. `AGENTS.md`
2. `product-contract/00_START_HERE.md`
3. `product-contract/CURRENT_STATE.md` UPDATE 19
4. `product-contract/GATE_STATUS.md`
5. `product-contract/execution/CURRENT_SLICE.yaml`
6. `product-contract/governance/OPEN_DECISIONS.yaml` / DEC-012
7. `product-contract/evidence/screens/immediate-v2/CODEX_AUDIT_CD-023.md`
8. `product-contract/evidence/screens/immediate-v2/CD023_LOCAL_REMEDIATION_EVIDENCE.md`
9. `product-contract/evidence/screens/immediate-v2/CD023_PACK_PROVENANCE_AUDIT.md`

Exact requirements were reconciled from the historical baseline rows
M01-043..052 and M02-012. The programme pack at
`/Users/vikramindla/Desktop/Inspection Documentation/claude-design-approval-pack`
contains SOP/matrix material but not the `outputs/cd-023/*` implementation
package. The workbook/CSV contains the CD-023 **input prompt**, which itself
requires those files to be returned by the design run; it is not the returned
package. The recursive filename, archive and embedded workbook-content check is
recorded in `evidence/screens/immediate-v2/CD023_PACK_PROVENANCE_AUDIT.md`. Do not
fabricate it.

## Implemented files

- `supabase/migrations/0027_cd023_immediate_visit_atomic.sql`
- `apps/web/src/app/planning/immediate/actions.ts`
- `apps/web/src/app/planning/immediate/ImmediateForm.tsx`
- `apps/web/src/app/planning/immediate/AuthorityBar.tsx`
- `apps/web/src/app/planning/immediate/page.tsx`
- `apps/web/src/app/field/[visitId]/page.tsx`
- `apps/web/src/app/field/[visitId]/Startup.tsx`
- `apps/web/e2e/cd-023-immediate-authority-bar.spec.ts`
- `supabase/tests/0027_cd023_immediate_visit_atomic.sql`

## Protected behavior now present

- Planner and Inspector paths are source-authorized and distinct.
- Planner must enter an explicit window and confirm M01-049 review.
- Inspector self-assigns, receives no assignment notification, and is routed to
  the standard field start flow.
- No `+8h` or other unresolved duration is invented.
- Any manual name/CR/license/activity identity is accepted; a missing reported
  name receives an explicitly marked technical label, not fabricated master data.
- Confirmed coordinates and their `official`/`manual` provenance persist on the
  Visit; official factory coordinates are never overwritten. An `official`
  claim must exactly match registered master data.
- Published-package, duplicate-active-Visit and Inspector eligibility checks run
  inside one transaction.
- UUID request lock + unique indexes enforce retry/double-submit idempotency;
  replay returns the stored creator role. CR/licence locks serialize every
  supplied identity key in stable order.
- Factory, Visit, assignment, notification, blocked attempt and successful
  request actions are append-only audited.
- Provider delivery remains truthful (`not_configured` for push here).
- Arabic chip labels and live announcements are localized.

## Exact next execution sequence

1. Obtain explicit human approval to apply repository migration SQL to the linked
   Supabase development project. Do not treat this handoff as that approval.
2. Apply only pending migration 0027; capture migration output and verify its
   function/index/policy/trigger inventory.
3. Run `npm run build`, then `npm run typecheck` sequentially.
4. Run the focused CD-023 Playwright spec. It must produce 8/8 product PASS plus
   shared setup PASS and the eight EN/AR × dark/light × desktop/narrow frames.
5. Run the complete Playwright regression. Fix only demonstrated regressions in
   the authorized slice; preserve unrelated dirty work.
6. Update AC-0043..0052 and AC-0064 evidence only after live assertions pass.
7. Import the actual `outputs/cd-023/*` export if supplied; populate every wiring
   row with reviewer/date/verdict/evidence.
8. Request a fresh independent Codex audit in a different reviewer session. The
   implementation author must not self-issue DEC-012 PASS.
9. Only after that PASS and sponsor runtime acceptance may CD-023 close or CD-024+
   implementation proceed.

## Completion audit

| Original finding | Code correction | Local proof | Live/independent proof |
|---|---|---|---|
| FAIL-01 blank coordinates | Raw presence before numeric conversion plus RPC range guard | SQL/typecheck and focused negative test present | Pending live focused test |
| FAIL-02 lost location | Visit coordinates plus explicit official/manual provenance | Fresh SQL contract proves modified pin and unchanged master coordinates | Pending live focused test |
| FAIL-03 stale package | Published/locked revalidation inside atomic RPC | Forced package-read denial and unavailable-package path covered | Pending live focused test |
| FAIL-04 incomplete audit | Factory/notification triggers plus constrained request audit | Exact SQL audit assertions PASS | Pending live exact-row assertions |
| FAIL-05 unsafe retry | Request lock, unique guards, stored-role replay and ordered identity locks | Replay and identity contract PASS; concurrent tests discovered | Pending live concurrency tests |
| FAIL-06 ignored read errors | One fail-closed RPC with neutral errors | Forced read and write denial PASS | Pending live suite |
| FAIL-07 false partial ledger | Sequential/ledger path removed; transaction rolls back | Forced downstream failure leaves no Visit | Pending live suite |
| FAIL-08 partial Arabic | All chips and live announcements localized | Typecheck plus Arabic assertions discovered | Pending live AR/RTL run |
| FAIL-09 evidence gaps | Eight focused product tests plus repeatable SQL contract | Build/typecheck/discovery/SQL contract PASS | Focused/full runtime and eight frames pending |

The implementation-remediation column is complete. The final column is a gate,
not optional cleanup: Claude Code must not convert local evidence into live or
independent PASS.

## Current checks

- Production build: PASS.
- Typecheck: PASS (sequential after build).
- Diff whitespace: PASS.
- Auth personas: PASS 3/3.
- Fresh isolated migration plus repeatable RLS/atomicity/idempotency/location/
  audit SQL contract: PASS (`CD023_DATABASE_CONTRACT_PASS`).
- Focused live CD-023: NOT RUN — migration absent live.
- Full live regression: NOT RUN.
- Independent re-audit: NOT RUN.

The CD-023 remediation is committed on the working branch. No push, merge,
deployment or `main` modification was performed.
