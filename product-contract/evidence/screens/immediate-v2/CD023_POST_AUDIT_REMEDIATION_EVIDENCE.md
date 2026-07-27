# CD-023 post-audit remediation evidence

- date: 2026-07-14
- trigger: strict verdict in CODEX_AUDIT_CD-023_POST_LIVE.md
- implementation status: corrected
- DEC-012 status: open; fresh independent reviewer required

## Corrected

- Rebuilt WIRING_MAP_CD-023.csv as 12 rows × 13 columns against current code and
  exact test names; no automated_test cell remains proposed.
- Reconciled the implementation manifest and acceptance checklist to the
  source-authoritative atomic Planner/Inspector behavior.
- Replaced the obsolete three-value urgency claim with the accepted retired predecessor D3
  values: Complaint received, Incident / accident report, Referral from
  authority, and Other.
- Added localized server-action blockers for unsupported reasons and for Other
  without Notes.
- Added migration 20260714060935_cd023_urgency_contract.sql so crafted direct RPC
  calls cannot persist an unsupported reason or an unjustified Other.
- Replaced visible Startup.tsx database error detail with stable localized
  recovery copy; diagnostic detail remains console-only.
- Added exact tests for registered identity search, urgency/Other behavior,
  Planner review/window guards, non-authorized route access, database reason
  enforcement, and the raw-error display sink.

## Verification

- npm run typecheck: PASS
- npm run build: PASS
- focused suite excluding the unapplied-migration test and screenshot writer:
  16/16 PASS (3 persona setup + 13 product checks)
- broader suite excluding only the unapplied-migration crafted-RPC test:
  90/90 PASS in 6.7 minutes
- final tightened Other-reason UI check: 4/4 PASS including persona setup
- eight EN/AR × dark/light × desktop/narrow frames: recaptured
- wiring CSV: matches the artifact-tool QA candidate; 13 columns and 12 data rows

## Live migration blocker

The linked Supabase CLI stalled at Initialising login role for both migration
list and db push dry-run. SUPABASE_DB_PASSWORD and SUPABASE_ACCESS_TOKEN are not
available. The migration was not run through Dashboard SQL because that would
bypass migration history.

The only excluded test is:

crafted urgency values and unjustified Other are rejected by the database contract

## Required next proof

1. Apply migration 20260714060935 through linked migration history.
2. Run the focused suite including the crafted-RPC test.
3. Run the full 91-test suite with no exclusion.
4. Assign a separate OpenAI Codex session to re-audit all 12 wiring rows and
   issue the DEC-012 verdict.
5. Obtain sponsor runtime acceptance.

This record is implementation evidence and does not self-issue PASS.

## QA certification result

NOT CERTIFIED FOR CLOSURE. Runtime, audit, visual, authorization, atomicity and
protected-regression evidence is green for every runnable path, and no mock was
introduced. Mandatory evidence is still incomplete because the database CHECK
is not live, its crafted-RPC negative has not run against the linked project,
and DEC-012 requires a separate reviewer.
