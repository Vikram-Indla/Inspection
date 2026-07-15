# CD-023 continuation — post-audit remediation

## Outcome

The strict post-live audit findings are fixed in code and in the implementation
package. The wiring map now describes the atomic Planner/Inspector runtime in all
13 columns and cites exact tests. The accepted D3 urgency set is implemented as
four values, with Notes required for Other. Raw inspection-insert detail is no
longer shown in the field UI.

This is an implementation handoff, not a DEC-012 PASS. The implementation agent
cannot independently audit its own remediation.

## Verification

- typecheck: PASS
- production build: PASS
- focused runnable suite: 16/16 PASS
- broader regression: 90/90 PASS
- visual matrix: 8/8 recaptured by the broader suite
- excluded from both live runs: one crafted-RPC urgency test that requires the
  new database CHECK

The broader result is intentionally not called a complete regression because one
migration-dependent test was excluded.

## Prepared migration

supabase/migrations/20260714060935_cd023_urgency_contract.sql adds a NOT VALID
CHECK that:

- allows Complaint received;
- allows Incident / accident report;
- allows Referral from authority;
- allows Other only when Notes is non-empty;
- preserves historical rows without silently rewriting them;
- enforces the rule on every new or changed row.

The linked Supabase CLI could not complete migration list or db push dry-run; it
stalled at login-role initialization. SUPABASE_DB_PASSWORD and
SUPABASE_ACCESS_TOKEN are absent. Dashboard SQL was not used because that would
bypass linked migration history.

## Exact next sequence

1. From a Supabase-authenticated environment, inspect linked migration history
   and apply only 20260714060935_cd023_urgency_contract.sql through db push.
2. Run the focused CD-023 suite including the crafted urgency test.
3. Run the full suite with no grep exclusion; expected count is 91.
4. Open a separate OpenAI Codex session with no implementation authorship and
   re-audit all 12 rows × 13 columns using CODEX_WIRING_AUDIT_CHECKLIST.md.
5. If that reviewer records PASS, obtain sponsor runtime acceptance.

CD-023 closure and CD-024+ implementation remain blocked through step 5. No
commit, push, merge, deployment, main change, branch switch, reset, or cleanup
was performed.
