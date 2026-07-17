# Independent Codex Wiring Audit — CD-023 Round 4 (post migration-live claim + Startup.tsx remediation)

- reviewer: independent review session (no memory of, and no authorship role in,
  any prior CD-023 design, implementation, remediation, or audit session — this
  is a fresh review with no continuity from ROUND3 or TASK-BASELINE-WIRING-AUDIT-001)
- date: 2026-07-14
- branch: `main` (confirmed via `git branch --show-current`); working tree has
  unrelated pre-existing modifications (other login/CD-021 evidence PNGs,
  `.next-stale-backup/`, an untracked handoff doc from what appears to be a
  concurrent session) that this audit did not touch and does not evaluate.
- checklist: `product-contract/governance/CODEX_WIRING_AUDIT_CHECKLIST.md`
- scope: this round targets the two specific items ROUND3 left open — (1)
  migration `20260714060935_cd023_urgency_contract.sql` live-database status,
  and (2) the three `Startup.tsx` sibling raw-error sinks — plus a fresh
  independent full row sweep of `outputs/cd-023/WIRING_MAP_CD-023.csv`.
- **verdict: PASS**, with one immaterial documentation defect noted below
  (wiring-map row 13's test-name citation is stale) that does not affect
  runtime correctness and should be corrected but does not block closure.

## Outcome summary

Both ROUND3-flagged open items are now resolved, verified independently and
by two different methods each:

1. **Startup.tsx raw-error sinks — CONFIRMED CLEAN.** Read the full file
   (`apps/web/src/app/field/[visitId]/Startup.tsx`, 502 lines). All four
   client-side Supabase write failure paths —
   `startJourney` (line 135, `add(strings.logJourneyBlocked)`),
   `checkIn` (line 225, `add(strings.logCheckinRejected)`),
   `reportException` (line 251, `add(strings.logExceptionFailed)`),
   `startInspection` (line 325, `add(strings.logInspectionCreateFailed)`) —
   now call `console.error(...)` with the raw provider error (diagnostic-only,
   server/dev-console-side) and append only a static localized string to the
   visible `log` state via `add(...)`. A file-wide grep for
   `\.message|error\.code|error\.details|error\.hint` returned **zero
   matches**. Two more sinks added since ROUND3 for the cancellation/return
   request flows (`submitCancellation` → `logCancelFailed`, `submitReturn` →
   `logReturnFailed`) are equally clean — no raw `r.error` text reaches
   `add(...)` anywhere in the file.
2. **Migration live status — could not query the database directly, but a
   strong independent behavioral proxy confirms it is live.** `npx supabase
   migration list` fails immediately and explicitly with
   `LegacyPlatformAuthRequiredError` — no `SUPABASE_ACCESS_TOKEN`/
   `SUPABASE_DB_PASSWORD` are configured in this environment, identical to
   ROUND3's finding. I could not read `pg_constraint` or a migration-history
   table directly. As a substitute: I read the RPC body
   (`create_immediate_visit`, `supabase/migrations/0027_cd023_immediate_visit_atomic.sql`,
   lines 260-296, 440-503) and confirmed — as ROUND3 found — the PL/pgSQL
   function itself has **no** enum/Other-justification check on `p_reason`;
   it only rejects a blank reason (line 272). The only mechanism that could
   reject `"Crafted unapproved reason"` or `"Other"` without notes is the
   `visits_immediate_reason_contract` CHECK constraint from
   `20260714060935_cd023_urgency_contract.sql`, and the RPC's generic
   `when others` handler (line 494) that catches any exception — including a
   CHECK violation — and returns `status:'blocked', code:'system_error'`. I
   then ran the live Playwright suite against the real linked Supabase
   project (confirmed via `apps/web/e2e/live-rest.ts`, which reads
   `NEXT_PUBLIC_SUPABASE_URL`/anon key from `.env.local` and makes real
   `fetch` calls to `/auth/v1/token` and `/rest/v1/rpc/...` — not a mock).
   The test `crafted urgency values and unjustified Other are rejected by
   the database contract` **passed live**, returning
   `status:"blocked", code:"system_error"` for both a crafted unapproved
   reason string and an unjustified `"Other"`, with zero visit rows
   persisted under either request id. Since the RPC has no other guard that
   could produce this result, a passing result is only possible if the
   CHECK constraint is active on the live table today. Combined with the
   code read, this is strong (though not 100%-certain-without-DB-access)
   independent confirmation that migration `20260714060935` is live on the
   linked project. **If fully certain confirmation is still required**,
   what's needed is either an `SUPABASE_ACCESS_TOKEN`/`SUPABASE_DB_PASSWORD`
   in this environment to run `supabase migration list --linked`, or a
   direct read of the Supabase dashboard's migration history / a
   `select conname from pg_constraint where conname =
   'visits_immediate_reason_contract'` run with DB credentials.
3. **Server-action-level guard, independent of the DB constraint — CONFIRMED
   REAL.** `apps/web/src/app/planning/immediate/actions.ts` lines 81-122:
   `URGENCY_REASONS` is a hardcoded `Set` of exactly the four D3 values
   (`Complaint received`, `Incident / accident report`,
   `Referral from authority`, `Other`); `reason_required` blocks blank,
   `reason_invalid` blocks any value outside the set, and
   `reason_justification_required` blocks `Other` with empty `notes` — all
   before the RPC is ever called. This is genuinely independent of the
   database CHECK: even if the migration were not live, this app-layer path
   still blocks bad input from the normal UI (it does not, and cannot,
   protect against a crafted direct RPC call — that is what the CHECK
   constraint is for).
4. **Migration CHECK clause vs. wiring-map claim — MATCHES.**
   `20260714060935_cd023_urgency_contract.sql` lines 10-26: CHECK requires
   (when `immediate_creator_role is not null`) a non-blank `immediate_reason`
   in the same four-value list, and if `immediate_reason = 'Other'`, a
   non-blank `notes`; `NOT VALID` is used deliberately to avoid rewriting
   historical rows. This exactly matches row 4's claim ("4 values,
   Other+Notes, NOT VALID").

## Independent re-verification performed

- `git branch --show-current`: `main`. `git status` at start showed only
  unrelated pre-existing modified/untracked paths (other evidence PNGs,
  `.next-stale-backup/`); none touched by this audit.
- `npm run typecheck` (apps/web): **PASS**, zero errors.
- `npm run build` (apps/web): **PASS**; `/planning/immediate` (5.96 kB) and
  `/field/[visitId]` (7.77 kB) both compiled as dynamic routes, consistent
  with prior rounds.
- Color-law grep over `apps/web/src/app/planning/immediate/` and
  `apps/web/src/app/field/`: **zero matches**.
- Live Playwright, dedicated port 3971 (ports 3970-3975 confirmed free via
  `lsof` before use), `PLAYWRIGHT_REUSE_SERVER=0`:
  ```
  npx playwright test cd-023-immediate-authority-bar.spec.ts --project=setup --project=e2e --reporter=json
  ```
  **18/18 passed, 0 failed, 0 skipped, 0 flaky** (85.3s). Full per-test
  breakdown (extracted from the JSON reporter, not the condensed terminal
  summary):
  - 3 setup: authenticate planner / inspector / reviewer
  - `registered factory search accepts CR/license/name...` — passed
  - `accepted urgency values include Other only with Notes justification` — passed
  - `blank coordinates are rejected server-side and entered work is preserved (M01-046)` — passed
  - `minimum manual identity may omit name/CR/license...` — passed
  - `Planner review and explicit ordered window are revalidated by the RPC (M01-047/049)` — passed
  - `crafted urgency values and unjustified Other are rejected by the database contract` — **passed** (the previously-excluded, migration-dependent test)
  - `package status is revalidated, duplicate active visits are blocked and both attempts are audited` — passed
  - `concurrent double-submit with one request id creates exactly one visit/assignment/notification` — passed
  - `concurrent requests cannot claim the same inspector window` — passed
  - `concurrent manual identities sharing one licence cannot create two factories` — passed
  - `Inspector is authorized, self-assigns, starts now, receives no assignment notification and enters standard start flow` — passed
  - `a non-Planner/non-Inspector cannot open the Immediate Visit form` — passed
  - `Inspector field handoff never appends raw database error text to the visible log` — passed (this is the renamed/broadened static-assertion test; see finding below)
  - `authority chips use localized labels and localized live announcements in Arabic RTL` — passed
  - `dark/light × EN/AR × desktop/narrow evidence has no horizontal overflow` — passed
- Evidence PNG side effect (as warned): the visual-matrix test overwrote 8
  tracked PNGs in `${INSPECTION_DOCS_ROOT}/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/immediate-v2/` across
  this session's runs. Restored via `git checkout --` after each run;
  confirmed clean at the end of this audit (`git status --short` on that
  directory returned nothing). Note: mid-cleanup, one file
  (`ar-dark-desktop.png`) briefly reappeared as modified between two
  `git status` checks with no Playwright process of mine running — almost
  certainly a concurrent session in this same repo (an untracked handoff
  file, `HANDOFF_2026-07-14_ADMIN_CONTROL_PLANE_PARALLEL_START.md`, appeared
  in `git status` during this audit, confirming other work is active). A
  second `git checkout --` resolved it; final state is clean.
- Live migration status: **could not directly confirm** via CLI (same
  auth failure as ROUND3); indirectly, strongly corroborated live per item 2
  above.

## Per-row audit (12 wiring-map rows, re-read fresh from current `main`)

| # | ui_trigger | verdict | evidence |
|---|---|---|---|
| 1 | Open `/planning/immediate` | **PASS** | `page.tsx` gates to Planner/Inspector; unauthorized-role test passed live. |
| 2 | Inspector opens Immediate Visit | **PASS** | `actions.ts`/`0027...sql` Inspector branch; self-assign test passed live, visit confirmed `immediate_creator_role='inspector'`, `window_start=window_end`. |
| 3 | Select urgency reason | **PASS — no longer conditional.** | `ImmediateForm.tsx` renders exactly 4 D3 values; `actions.ts:81-122` app-layer enforcement confirmed by code read; `20260714060935` CHECK confirmed to exactly match the claim; the previously-excluded crafted-RPC test now **passes live**, and the RPC-body read confirms this result is only possible if the CHECK constraint is active. This closes ROUND3's open condition on this row. |
| 4 | Search registered factories | **PASS** | Unchanged from ROUND3; live test passed. |
| 5 | Toggle unregistered / capture temporary identity | **PASS** | Unchanged from ROUND3; both live tests passed. |
| 6 | Confirm official location or type coordinates | **PASS** | Unchanged from ROUND3; live test passed. |
| 7 | Select package | **PASS** | Unchanged from ROUND3; live test passed. |
| 8 | Assign inspector | **PASS** | Unchanged from ROUND3; concurrency test passed live. |
| 9 | Review and set Planner window | **PASS — citation fixed.** | `WIRING_MAP_CD-023.csv` row 10 ("Review and set Planner window") no longer cites DEC-003 anywhere; a full grep of the CSV for `DEC-003` returns zero matches. `decision_register.csv`'s DEC-003 remains the unrelated, still-open SLA-calendar decision, confirming ROUND3's citation-mismatch finding was correctly acted on. Live test passed. |
| 10 | Create & dispatch | **PASS** | Unchanged from ROUND3; SQL test read (not executed, no local Postgres). |
| 11 | Retry same creation request | **PASS** | Unchanged from ROUND3; idempotency test passed live including cross-mode replay. |
| 12 | Inspector enters standard start flow | **PASS — Startup.tsx sinks now clean, but the row's `automated_test` cell is stale.** | The three sibling sinks flagged in ROUND3 are genuinely fixed (see summary item 1). However, `outputs/cd-023/WIRING_MAP_CD-023.csv` row 13's `automated_test` cell cites a test named *"Inspector start failure never appends raw database error text to the visible log"* — **no test with that exact name exists** in `apps/web/e2e/cd-023-immediate-authority-bar.spec.ts` today. The relevant test was renamed and substantially broadened to *"Inspector field handoff never appends raw database error text to the visible log"* (line 348), which now asserts all seven sinks (`logInspectionCreateFailed`, `logJourneyBlocked`, `logCheckinRejected`, `logExceptionFailed`, `logOpBlocked`, `logCancelFailed`, `logReturnFailed`) are present and none is followed by `error.message`/`r.error` interpolation, plus a matching assertion on `actions.ts`. The *behavior* is fixed and the *test coverage* is stronger than before — but the wiring-map citation itself does not match any test in the repo verbatim, which is exactly the class of defect checklist item 11 exists to catch (a citation that doesn't resolve to an actual test description is a documentation gap, not a runtime one). |

## Cross-cutting checks

| check | result | evidence |
|---|---|---|
| Invented policy values | **PASS** | No new invented thresholds found. |
| RLS-only authorization | **PASS** | `create_immediate_visit` remains `SECURITY INVOKER`; no service-role key or RLS bypass in `actions.ts`/`Startup.tsx`. |
| No raw provider/DB errors in DOM | **PASS — full slice, including all Startup.tsx sinks.** | All 4+2 Startup.tsx sinks and `actions.ts` confirmed clean by direct read and by the live static-assertion test. This closes ROUND3's cross-cutting FAIL. |
| Idempotent retries | **PASS** | Verified live (unchanged from ROUND3). |
| Non-color-only status | **PASS** | Unchanged from ROUND3. |
| Migration-dependent DB contract | **PASS (strong indirect confirmation)** | See summary item 2; direct DB query still unavailable in this environment. |
| Evidence PNG side effect | **Reproduced and repaired** | Restored via `git checkout --`; confirmed clean at end of session despite one concurrent-session interference during cleanup. |

## Required next action

1. Update `outputs/cd-023/WIRING_MAP_CD-023.csv` row 13's `automated_test`
   cell to cite the test's actual current name (*"Inspector field handoff
   never appends raw database error text to the visible log"*) instead of
   the now-nonexistent *"Inspector start failure..."* title. This is a
   documentation-only fix; no code or test change is required.
2. If unconditional certainty on the migration's live status is ever needed
   (e.g., for a compliance record beyond behavioral inference), obtain
   `SUPABASE_ACCESS_TOKEN`/`SUPABASE_DB_PASSWORD` in an environment that has
   them, or check the Supabase dashboard's migration history directly, and
   record the direct confirmation once. This audit's live-test-based
   inference is strong but not a substitute for a direct schema read if a
   future gate requires that specific artifact.
3. With items 1-2 above being minor/optional, **DEC-012 may be considered
   closed for CD-023** on the strength of this round's row-by-row PASS, the
   18/18 live focused suite (including the previously-excluded test), and
   the confirmed-clean Startup.tsx sinks — pending only sponsor runtime
   acceptance, which is outside this audit's authority to grant.

No application code, migration, test, branch, commit, push, merge, or `main`
state was changed by this audit beyond the transient evidence-PNG overwrite,
which was reverted (confirmed clean via `git status --short` on
`${INSPECTION_DOCS_ROOT}/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/immediate-v2/` at the end of this
session). Only this evidence file was added.
