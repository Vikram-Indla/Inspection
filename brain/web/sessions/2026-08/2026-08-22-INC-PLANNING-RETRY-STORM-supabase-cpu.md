# 2026-08-22 · INC-PLANNING-RETRY-STORM — Planning publish retry storm on `iiozvqntawxfwbgffzqu`

`task: incident` · `status: contained, fix pending review` · `duration: ~1h`
`rules applied: WEB-000, WEB-004, WEB-006, WEB-013, WEB-016`

---

## Goal

Stop a runaway retry loop that held the production Supabase database at 94–100%
CPU, and remove the cause without weakening the stale-draft validation.

## Root cause

`public.assert_resumed_planning_target_current` raised both of its business
rejections with `errcode='40001'`. SQLSTATE 40001 is `serialization_failure` —
the standard "transient, safe to retry" signal. PostgREST retries a transaction
that ends in 40001. The rejection is permanent by construction, so every retry
reproduced it and one in-flight HTTP request became an unbounded loop pinned to
one PostgREST connection.

Six requests entered the loop at 19:21 UTC. No further HTTP request was needed:
`edge_logs` recorded **zero** `/rest/v1/rpc` calls for the whole burst, while
`pg_stat_activity` showed the statement re-executing continuously. A control
`curl` sent during the incident did appear in `edge_logs`, so the absence is
real, not a logging gap.

The loop is below the application. The dev server that started it had long
since given up: idle, 0.01 s CPU over 6 s, no socket to Supabase.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `supabase/migrations/20260822200851_planning_draft_stale_non_retryable.sql` | created (applied to live) | 0 → 54 |
| `apps/web/src/features/planning-single/submission-guard.ts` | created | 0 → 49 |
| `apps/web/src/app/(app)/planning/single/actions.ts` | edited | 357 → 375 |
| `apps/web/src/components/sections/planning-single/single-visit-screen/single-visit-screen.tsx` | edited | 272 → 274 |
| `apps/web/src/components/sections/planning-single/single-visit-screen/target-fields.tsx` | edited | 32 → 35 |
| `apps/web/e2e/planning-single-submission-guard.spec.ts` | created | 0 → 138 |
| `apps/web/playwright.static.config.ts` | edited | 15 → 15 |

## Decisions

- The SQLSTATE is the defect, not the validation. The migration changes
  `40001` to `P0001` and nothing else — the predicate, the `for update` lock,
  the ownership check and both messages are byte-for-byte identical. PostgREST
  reports `P0001` once as HTTP 400 and never retries it.
- Applying the migration was itself the containment. The loop re-invokes the
  function on every retry, so the first retry after `create or replace` got a
  non-retryable code and stopped.
- A submission is identified by a token the client advances only when an
  attempt has produced a result. Duplicates of one attempt therefore share a
  token and are answered from a single in-flight run; a deliberate retry
  carries a new token and runs for real. Manual retry is preserved.
- `assert_resumed_planning_target_current` is still called on every resumed
  publish. Nothing bypasses it.
- The publish action reads the rejection from the message marker as well as the
  code, so it behaves correctly against a database that has and has not taken
  the migration.
- The `useActionState` attempt counter travels through `PublishResult`, so the
  token needs no effect and no ref. The state ladder is unchanged.

## Inventory taken before writing code

- state and effects: no new state beyond the server-echoed `attempt`; no new
  effect. The two existing effects (error focus, search debounce) are untouched.
- literals: no user-visible string added. `submission_token` is a machine field.
- `<svg>`: none touched.
- accessibility: no markup change beyond one hidden input.

## Numbers

```
aborted transactions/s   1,773  →  0        (pg_stat_database.xact_rollback)
PostgREST backends busy      2  →  0
PLANNING-DRAFT-STALE/min  ~110,000 → 0
peak concurrent loops        6  (19:21 UTC) → 0 (20:08:51 UTC)
```

Route budgets unchanged — no route JS added beyond one hidden input.

## Accessibility

- No new interactive element, no new copy, no visual change. The added field is
  `type="hidden"`.
- axe: not re-run; the rendered accessibility tree is unchanged.

## Verification

- [x] `npm run typecheck` — no errors
- [x] `npm run lint` — 6 pre-existing violations, identical on `main`; zero in
      the changed files
- [x] `npm run gates:typography` · `gates:content` · `gates:date-inputs` — PASS
- [ ] `npm run check:design-system-v5` — fails on `src/lib/analytics/query-state.ts`,
      pre-existing and identical on `main`
- [x] `npm run test:unit` — 13 passed
- [x] `npm run test:static` — 410 passed, 41 failed; `main` baseline is 400 / 41
      (same failures, all missing `playwright/.auth` fixtures)
- [x] new suite `INC-STALE-01..10` — 10 passed
- [x] production build — succeeded

## Retirement

None.

## Open

- The application change is uncommitted on `fix/planning-stale-retry-storm` in
  `~/Developer/Inspection-worktrees/planning-stale-retry-storm` and needs review.
- Cumulative `xact_rollback` on this project stands at 2.33 billion against 3.17
  million commits. Worth checking whether earlier storms went unnoticed.
- `T-190` (raised by a peer session): the field login collapses every non-network
  Supabase error into "invalid credentials", so a saturated database tells users
  their password is wrong. Separate concern, deliberately out of this fix.
