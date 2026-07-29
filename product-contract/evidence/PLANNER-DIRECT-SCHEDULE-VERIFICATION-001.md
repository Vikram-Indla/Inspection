# Planner direct scheduling verification

Status: `LOCAL_CONTRACT_VERIFIED_NOT_APPLIED`

The Planner direct-scheduling implementation is aligned across:

- the “Schedule visit” command;
- the page transition gate;
- the server action gate;
- canonical Planner-role fallback;
- the guarded publisher; and
- the forward-only `planning.publish` role grant.

## Evidence

- Source contract: `planner-direct-schedule.spec.ts` — **1 / 1 PASS**.
- Transactional SQL probe: `0045_planner_direct_schedule.sql` — PASS.
- First migration execution installed one Planner `planning.publish` grant.
- Replay inserted zero and retained exactly one grant.
- Account, profile, user-role, role and permission-catalogue counts were
  unchanged.
- The database transaction rolled back; no state persisted.
- `git diff --check`: PASS.

## Next proof

Run exact-build authenticated Planner save/reload/schedule against an authorized
disposable database, then prove the Inspector receives the assignment and the
audit/notification receipts are complete. Prove a non-Planner without
`planning.publish` is denied.
