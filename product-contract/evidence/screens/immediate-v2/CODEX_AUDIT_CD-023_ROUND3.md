# Independent Codex Wiring Audit — CD-023 Round 3 (post second remediation)

- reviewer: independent review session (no memory of, and no authorship role in,
  any prior CD-023 design, implementation, or remediation session)
- date: 2026-07-14
- checklist: `product-contract/governance/CODEX_WIRING_AUDIT_CHECKLIST.md`
- repo state: `feat/cd-022-single-identity-lens`, working tree dirty. The CD-023
  remediation under audit is **uncommitted** on this branch (per
  `outputs/cd-023/IMPLEMENTATION_MANIFEST_CD-023.yaml: working_tree_note`).
  There is no commit hash to cite for the reviewed state; this audit reviewed
  the literal current file contents on disk at the time stated above.
- verdict: **PARTIAL** (not a clean PASS; not a FAIL — the prior FAIL's findings
  are resolved, but one row has an unresolved live-database dependency and one
  cross-cutting check has a residual, narrowly-scoped gap)
- gate effect: DEC-012 remains open for CD-023 pending the two items in
  "Required next action" below. CD-024+ implementation should not start until
  those are closed and a final confirming pass is recorded.

## Outcome

This is a materially different result from the prior `CODEX_AUDIT_CD-023_POST_LIVE.md`
(FAIL, 12/12 rows failing because the map was stale). The current
`outputs/cd-023/WIRING_MAP_CD-023.csv` (12 rows, re-read fresh for this audit)
now accurately describes the runtime for 11 of 12 rows on independent
verification: real dual Planner/Inspector authorization, one atomic
SECURITY INVOKER RPC, real request-id idempotency, real per-inspector
write-time overlap serialization, truthful notification-not-delivered
language, non-color chip status, and named tests that actually exist with the
claimed descriptions and actually pass live.

Two things keep this from being an unconditional PASS:

1. **Row 4 (urgency reason)** — the server-action-level enforcement is real
   and verified, but the database-level enforcement it also claims
   (`visits_immediate_reason_contract`) is **not confirmed applied** to the
   live linked Supabase project, and by direct reading of the RPC body, the
   PL/pgSQL function itself has no enum/Other-justification check — only the
   `CHECK` constraint would catch a crafted direct RPC call. The wiring row's
   `automated_test` cell lists "crafted urgency values ... rejected by the
   database contract" without flagging that this specific assertion is
   contingent on a migration nobody has confirmed is live. This is disclosed
   correctly one level up, in the manifest's
   `database_contract.urgency_constraint_live_state: PREPARED_NOT_APPLIED`,
   but the wiring-map row itself reads as settled.
2. **Cross-cutting raw-error check** — the one specific defect the prior audit
   found (`Startup.tsx` inspection-insert failure appending `error.message` to
   the visible log) is genuinely and non-superficially fixed. But the same
   file has three sibling paths — journey start, geofence check-in, and
   exception reporting — that still interpolate raw Supabase `error.message`
   directly into the visible field log. These are not new to CD-023 and are
   outside what row 13 specifically claims, but they are real, currently
   present, and within the same Inspector handoff flow the row describes.

## Independent verification performed

- `npm run typecheck` (apps/web): **PASS**, zero errors.
- `npm run build` (apps/web): **PASS**; `/planning/immediate` (5.96 kB) and
  `/field/[visitId]` (7.76 kB) both compiled as dynamic routes.
- Color-law grep over `apps/web/src/app/planning/immediate/` and
  `apps/web/src/app/field/`: **zero matches** (no hex/rgb/hsl/Tailwind bare
  color utilities).
- Live migration status: **could not determine**. `supabase migration list --linked`
  fails immediately with `Access token not provided. Supply an access token by
  running supabase login or setting the SUPABASE_ACCESS_TOKEN environment
  variable.` No `SUPABASE_ACCESS_TOKEN`/`SUPABASE_DB_PASSWORD` is set in this
  environment. (Note: this contradicts the remediation evidence's description
  of the CLI "stalling" — in this session it fails fast and explicitly. Either
  way, the migration's live state is **not independently confirmed** in either
  direction.)
- Focused live Playwright run, port 3906, `PLAYWRIGHT_REUSE_SERVER=0`:
  ```
  npx playwright test cd-023-immediate-authority-bar.spec.ts persona-tours.spec.ts golden-journey.spec.ts \
    --project=setup --project=e2e \
    --grep-invert "crafted urgency values and unjustified Other are rejected by the database contract"
  ```
  **29 passed, 0 failed** (2.9 min). Breakdown: 3 setup (planner/inspector/reviewer
  auth), 14 of 15 CD-023 tests (all except the excluded crafted-RPC/database
  case, named explicitly above and excluded because it depends on the
  unconfirmed migration), 6 golden-journey tests (all passed, including the
  full planner→inspector→reviewer→correction→approve cycle), 6 persona-tours
  tests. Exact per-test list captured in this session's run output.
- The excluded test itself was read, not executed: by direct inspection of
  `create_immediate_visit` (migration 0027), the PL/pgSQL body only checks
  `nullif(btrim(p_reason),'') is not null` — it does not check that `p_reason`
  is one of the four accepted values, nor that `Other` requires `Notes`. Two
  of that test's three crafted-reason cases would currently return
  `status: "ok"` instead of the asserted `blocked`/`system_error` if run
  against the live database as it stands today (only the `null`-reason case
  would correctly block, via the RPC's own `reason_required` check). This is
  reasoned from the code, not executed, to avoid writing an invalid
  `immediate_reason` row into the live project.
- Evidence PNG side effect (as warned): the "dark/light × EN/AR × desktop/narrow
  evidence" test **does** overwrite the 8 tracked PNGs in
  `${INSPECTION_DOCS_ROOT}/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/immediate-v2/` (`ar/en-dark/light-desktop/narrow.png`).
  `git status` confirmed all 8 as modified after the run; `git checkout --` was
  used to restore them before finishing. Confirmed clean afterward.
- SQL contract test `supabase/tests/0027_cd023_immediate_visit_atomic.sql`:
  **not run**. No Makefile/npm script target exists in this repo for standing
  up a local Postgres/Supabase instance, and the local Docker daemon is not
  running. Standing one up was judged out of scope for a bounded, read-only
  audit; reviewed the file's contents instead (see row 11 evidence).
- Full/complete regression suite (the manifest's claimed "90/90" or "91-test"
  runs): **not independently reproduced**. Only the targeted subset above was
  run, per this audit's own instructions.

## Per-row audit (12 rows)

| # | ui_trigger | verdict | evidence |
|---|---|---|---|
| 1 | Open `/planning/immediate` | **PASS** | `page.tsx:14-46` gates to Planner/Inspector only, with a real localized unauthorized state for any other role; now discloses the `profiles` read that the prior audit flagged as hidden (`page.tsx:42-47`). Live test `a non-Planner/non-Inspector cannot open the Immediate Visit form` passed. |
| 2 | Inspector opens Immediate Visit | **PASS** | `page.tsx` `actorMode` branch, `0027...sql:71-110,248-257,398-401`, `0029...sql` narrow RLS. Live test `Inspector is authorized, self-assigns, starts now, receives no assignment notification and enters standard start flow` passed; visit row confirmed `immediate_creator_role='inspector'`, `window_start=window_end`, redirect to `/field/:id`. |
| 3 | Select urgency reason | **PASS with condition** | `ImmediateForm.tsx` renders exactly the 4 D3 values; `actions.ts:81-122` (`URGENCY_REASONS` set + Other/Notes check) is real server-side (Next.js server action) enforcement, verified by code read. `20260714060935_cd023_urgency_contract.sql` CHECK clause matches the row's claim exactly (4 values, Other+Notes, `NOT VALID`). **Condition**: live-DB application of that migration is unconfirmed, and the RPC body itself has no equivalent PL/pgSQL check, so the row's claimed "crafted RPC... rejected by the database contract" test is not currently provably true against the live project. |
| 4 | Search registered factories | **PASS** | `page.tsx:42-43` preload, `ImmediateForm.tsx` substring filter over CR/license/name. Live test `registered factory search accepts CR/license/name and returns the matching source record (M01-044)` passed. |
| 5 | Toggle unregistered / capture temporary identity | **PASS** | Any one of name/CR/license/activity sufficient (`0027...sql:311-317`), region/city optional (`page.tsx:69-77`), exact CR/license reuse blocked (`0027...sql:355-368`). Live tests `minimum manual identity may omit name/CR/license...` and `concurrent manual identities sharing one licence cannot create two factories` both passed. |
| 6 | Confirm official location or type coordinates | **PASS** | `actions.ts:105-111` blank/non-finite guard; `0027...sql:263-270,340-353` official-pin-must-match / manual-source guards; storage on `visits.planner_lat/planner_lng/visit_location_source`, factory official coordinates never overwritten (confirmed in `field/[visitId]/page.tsx:46-48` reading `v.planner_lat ?? factory.official_lat` and the SQL test's owner-level assertion that official factory coordinates are unchanged after a modified Visit pin). Live test `blank coordinates are rejected server-side and entered work is preserved (M01-046)` passed. |
| 7 | Select package | **PASS** | `0027...sql:280-286` re-reads `package_versions` at write time, accepts only `published`/`locked`. Live test `package status is revalidated, duplicate active visits are blocked and both attempts are audited` passed. |
| 8 | Assign inspector | **PASS** | Candidate pool + overlap read (`0027...sql:398-439`) plus the write-time serialization trigger (`0031...sql`). Live test `concurrent requests cannot claim the same inspector window` passed (one `ok`, one `blocked` with `concurrent_conflict`/`inspector_unavailable`, exactly one visit persisted). |
| 9 | Review and set Planner window | **PASS** | No invented duration: Planner requires explicit ordered window (`0027...sql:288-296`), Inspector is stamped a single start-now instant (`0027...sql:297-301`). Live test `Planner review and explicit ordered window are revalidated by the RPC (M01-047/049)` passed. Note: the row's `runtime_evidence` cites "DEC-003" for this behavior; `decision_register.csv` shows DEC-003 is actually the (unrelated, still-Open) "SLA calendar" decision, not a "no invented duration" ruling — likely a mislabeled citation. Doesn't change the code's correctness, but the citation itself is not accurate. |
| 10 | Create & dispatch | **PASS** | One atomic `SECURITY INVOKER` RPC (`0027...sql:190-503`) called from `actions.ts:131-153`; rollback-with-neutral-code on any exception (`0027...sql:494-501`); Planner redirects `/visits/:id`, Inspector redirects `/field/:id` (`actions.ts:167-168`). SQL contract test's owner-level assertions (read, not executed) confirm no partial rows survive a forced package-read or notification-write failure. |
| 11 | Retry same creation request | **PASS** | Advisory `pg_advisory_xact_lock` on the request id plus `visits_creation_request_unique` (`0027...sql:40-45,235-246`); stored actor role wins replay (verified both in the SQL test's assertion and live). Live test `concurrent double-submit with one request id creates exactly one visit/assignment/notification` passed, including the cross-mode replay case (`ra`/`rb` same visit id, `replayed:true`, one visit/assignment/notification, two `IDEMPOTENT_REPLAY` audit rows). |
| 12 | Inspector enters standard start flow | **PASS for the claimed scope; residual issue nearby** | `field/[visitId]/page.tsx` correctly threads `dispatch_lat/lng/source` from the Immediate Visit rather than factory master data. The specific claim — inspection-insert failure shows stable localized copy, not raw DB text — is genuinely fixed: `Startup.tsx:300-311` now calls `add(strings.logInspectionCreateFailed)` with no `error.message` interpolation, verified both by direct read and by the live static-assertion test `Inspector start failure never appends raw database error text to the visible log`. **However**, three sibling failure paths in the same `Startup.tsx` file still append raw `error.message` to the visible log: `logJourneyBlocked` (line 135, journey start failure), `logCheckinRejected` (line 215, check-in failure), `logExceptionFailed` (line 236, exception report failure). These predate CD-023 and are shared by all visit types, not just Immediate ones, and are not literally what row 12 claims — but they sit in the exact component the Inspector Immediate path hands off to, and they violate the checklist's whole-slice "raw provider/DB error text never reaches the DOM" rule. |

## Cross-cutting checks

| check | result | evidence |
|---|---|---|
| Invented policy values | **PASS** | No new invented thresholds/durations found; `priority_field` remains explicitly ungoverned free text, matching the manifest. |
| RLS-only authorization | **PASS** | `create_immediate_visit` is `SECURITY INVOKER`; the two helper functions moved to a non-exposed `private` schema (0028) still execute as the caller for policy purposes; no service-role key or RLS bypass found in `actions.ts`/`page.tsx`. |
| Truthful atomicity | **PASS** | Single transaction, advisory locks, unique indexes, exception handler returning neutral codes only. Independently confirmed by the idempotency and concurrency Playwright tests. |
| No raw provider/DB errors in DOM | **PASS for the CD-023 creation path; FAIL (pre-existing, same-file) elsewhere** | `actions.ts` never returns raw `error`/`SQLERRM` to the client. `Startup.tsx`'s CD-023-relevant inspection-start path is fixed. The three sibling paths listed under row 12 are a real, currently-present violation of this cross-cutting rule, in the same file the Inspector Immediate flow redirects into. |
| Idempotent retries | **PASS** | Verified live: replayed request returns the original visit id, no duplicate assignment/notification, replay audited. |
| Non-color-only status | **PASS** | `AuthorityBar.tsx` uses glyph (✓/✕/◌) + text + `aria-label` + assertive live region; Arabic localization test passed. |
| Undisclosed removals | **PASS** | `removals: []` in the manifest; no application behavior found removed without disclosure. The "cancel unassigned Immediate row" concept from the original design package is explicitly and correctly superseded by source authority (`design_claims_superseded_by_source_authority`), not silently dropped. |
| Evidence PNG side effect | **Reproduced and repaired** | The visual-matrix Playwright test overwrote all 8 tracked evidence PNGs during this audit's own run; restored via `git checkout --` before finishing (confirmed clean). |

## Required next action

1. Confirm (via `supabase login`/`SUPABASE_ACCESS_TOKEN` in an environment that
   has it, or via the Supabase dashboard's migration history view, not raw SQL)
   whether `20260714060935_cd023_urgency_contract.sql` is actually applied to
   `iiozvqntawxfwbgffzqu`. If not applied, apply it through linked migration
   history, then run the excluded crafted-RPC test and confirm it passes as
   written — do not mark row 4 unconditionally closed until then.
2. Fix (or formally scope out with a decision ID) the three raw-`error.message`
   paths in `Startup.tsx` (`logJourneyBlocked`, `logCheckinRejected`,
   `logExceptionFailed`) to match the pattern already used for
   `logInspectionCreateFailed`. If this is judged out of CD-023's scope because
   it's shared, pre-existing field-startup code, say so explicitly in the
   wiring map/manifest rather than leaving the cross-cutting check silently
   unaddressed.
3. Correct the DEC-003 citation in row 9's `runtime_evidence` — either cite
   the actual governing decision/behavior for "no invented duration," or drop
   the DEC-003 reference; DEC-003 as recorded is the unrelated, still-open
   SLA-calendar decision.
4. Once 1–3 are closed, run one more full regression pass with no exclusions
   and record it; only then should this slice be considered for an
   unconditional PASS.

No application code, migration, test, branch, commit, push, merge, or `main`
state was changed by this audit beyond the transient evidence-PNG overwrite,
which was reverted. Only this evidence file was added.
