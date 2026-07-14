# CD-023 Local Remediation Evidence

- date: 2026-07-13
- branch: `feat/cd-023-immediate-authority-bar`
- scope: MVP1-M01-043..052, MVP1-M02-012, FND-001/003/007/011
- environment: isolated PostgreSQL 16 cluster under `/tmp`, not the linked Supabase project
- runtime verdict: **LOCAL PASS / LIVE NOT RUN**

## Static verification

- `npm run build` — PASS; `/planning/immediate` and `/field/[visitId]` compiled.
- `npm run typecheck` — PASS after the build completed.
- `git diff --check` — PASS.
- Playwright discovery — PASS: 8 CD-023 product tests plus 3 shared auth setup tests.
- Shared authenticated fixture — PASS 3/3 (Planner, Inspector, Reviewer).

## PostgreSQL verification

Migration 0027 applied cleanly from the relevant foundation/RLS/audit
prerequisites in a fresh PostgreSQL 16 cluster. The repeatable transaction-wrapped
contract is `supabase/tests/0027_cd023_immediate_visit_atomic.sql`; synthetic role
claims exercised the real SECURITY INVOKER function with RLS enabled and the
test ended with `CD023_DATABASE_CONTRACT_PASS` before rolling back its fixtures.

- Planner create: returned `status=ok`; direct Visit, one assignment and one
  truthful `not_configured` push notification.
- Same request replay with a conflicting submitted actor mode: returned the same
  Visit ID with `replayed=true` and the stored `actor_mode=planner`; counts
  remained Visits=1, assignments=1, notifications=1.
- Registered-factory manual pin: persisted `visit_location_source=manual` and
  the Visit coordinates while the official factory coordinates remained intact.
  A mismatched pin labelled `official` was blocked and audited.
- Inspector create with only business activity: returned `status=ok`; generated
  technical temporary label marked `name_is_system_generated=true`; official
  coordinates remained null; Visit planner coordinates persisted; window start
  equalled window end; self-assignment created; notifications=0.
- Generic audit: factory, Visit, assignment and notification triggers compiled;
  source-path rows were observed for factory and assignment, with exact full-set
  assertions now present in Playwright.
- Forced notification write denial: function returned `{status:"blocked",
  code:"system_error"}`; Visits=0, assignments=0; blocked-attempt audits=1.
- Forced authoritative package read denial: returned the same neutral
  `system_error`, retained no Visit, and wrote one governed blocked-attempt audit.
- Identity collision: a second manual factory with a different CR but the same
  licence was blocked as `factory_identity_match`; the RPC acquires all supplied
  identity locks in stable lexical order, and the live Playwright suite contains
  the concurrent version of this proof.
- Narrow Inspector RLS: a direct temporary-factory insert carrying official
  master coordinates was rejected.
- Audit forgery negative: direct authenticated `CREATED` attempt without an owned
  Visit/request row was rejected.

## Evidence not yet available

- No live migration application.
- No focused CD-023 runtime PASS.
- No full regression PASS.
- No eight live screenshots.
- No imported `outputs/cd-023/WIRING_MAP_CD-023.csv`.
- No fresh independent DEC-012 PASS verdict.

The absence of the design-run package was reconfirmed across both user-supplied
locations, current repository output, archived workbook versions and embedded
spreadsheet content. See `CD023_PACK_PROVENANCE_AUDIT.md`.
