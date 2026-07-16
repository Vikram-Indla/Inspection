# Codex audit reconciliation — full regression and final runtime hardening — 2026-07-15

## Findings closed in this continuation

- CD-031 identity fields are nullable in the canonical schema. Factory 360 now
  renders an explicit `—` inside direction-isolated identity nodes rather than
  empty `<bdi>` elements.
- The live KPI verification family had aged into expired planning windows. The
  canonical idempotent `seed:kpi` path was rerun and refreshed all six windows,
  keeping the independent operational-state domain unchanged.
- A concurrent virtual-room contract expansion left the server page's `RoomStrings`
  object incomplete. All readiness/fallback strings are now supplied through the
  existing `useT()` contract; no state-machine or provider behavior was invented.

## Verification

- `npm run seed:kpi` — PASS; six distinct states, zero duplicate factory/plan
  inserts, six visit upserts, two notification upserts.
- `npm run typecheck` — PASS.
- `npm run build` — PASS.
- Golden journey isolated: **9/9 PASS**.
- CD-027 + CD-030 affected code/live slice: **26/26 PASS**; one data-dependent
  Arabic test skipped.
- Final CD-031 + KPI focused slice: **18/18 PASS**.

## Complete-run reconciliation

The second complete no-exclusion run reached **180 passed / 6 failed / 3 skipped**.
Its six failures were not product-wiring failures: Supabase DNS/connectivity dropped
mid-run (causing CD-030/CD-031 navigation failures), Chromium crashed during the
static CD-027 proof, and the KPI rows had expired before the seed refresh. The
affected cases passed in the isolated reruns above after network recovery, identity
placeholder hardening, and canonical fixture refresh.

Remaining release blockers are upstream policy/provider/design boundaries: live
CD-030 migration verification (Management API 403/no PAT), the absent authoritative
CD-031 wiring map, leadership contact-privacy policy, and CD-031 design preflight.

## Visit republish notification closure

The historical M02-009/M02-030 partial findings are now closed in the current
working tree. `republishVisit` uses the shared `notifyAssignedInspector` path,
retains the Visit ID, and reports a neutral queue-failure result instead of
claiming success when the notification row cannot be written. `cd-027-visit-detail`
source-layer checks pass for both the success and failure paths; AC_LEDGER rows
AC-0061 and AC-0082 are updated to `implemented`.

Verification: `npm run typecheck` PASS; `npm run build` PASS; focused CD-027
notification checks **5/5 PASS** (including auth setup).

## Continuation: active monitoring refresh and CD-041 live gate — 2026-07-15

The operations page and its interval refresh now use the same monitoring rule:
published visits remain visible, and visits already `on_the_way`, `arrived`, or
`executing` remain monitorable after planning expiry. This closes the initial
render/refresh wiring split; source checks cover both files.

The complete no-exclusion run on this checkout reached **197 passed / 3 failed /
1 skipped / 2 not run**. The three failures were isolated: the CD-004 browser
crash passed on rerun, the KPI monitoring assertion passed after the active-state
refresh and fixture refresh, and CD-041 no longer collides with an existing
assignment window but is blocked at the live verified-transition call.

CD-041's focused live run returns `PGRST202` because the shared project is
missing `public.vs_mark_session_verified`, despite the versioned migration being
present in this repository. The app remains fail-closed and does not mark the
session verified locally. Evidence is recorded in
`CODEX_AUDIT_CD041_LIVE_GATE_2026-07-15.md`; live migration and rerun remain
required.

## Final rerun and live-state update — 2026-07-15

With a fresh production server and no test exclusions, the suite reached
**203 passed / 1 skipped / 1 environmental failure**. The failure occurred in
the CD-028 source-only test after Chromium reported repeated static-chunk fetch
failures and crashed with `SIGSEGV`; the same test passed in isolation (**4/4**
including auth setup). This is retained as an environmental flake, not a code
failure.

The CD-041 driven verification, RBAC-negative and closed-session paths passed in
that run. A read-only schema probe confirms the verified-transition RPC is now
present. The probe also confirms the arrival enum is present but
`evidence.evidence_note` is still absent; the idempotent forward repair migration
`20260715193000_field_arrival_evidence_column_repair.sql` is therefore required
before M04-045 can be live/replay verified.

## Final no-exclusion regression after scope-loss guard — 2026-07-15

After the staged bulk-review scope-loss guard and a fresh production build, the
complete no-exclusion Playwright run finished at **207 passed / 1 skipped / 0
failed** across 208 discovered tests. The one skipped case is the expected
data-dependent Arabic/RTL comparison path. The focused CD-021 subset remained
**5/5 PASS**, and the complete CD-021 suite remained **24/24 PASS**. This is a
clean regression result, but it does not certify the remaining live migrations,
upstream partial rows, CD-031 authority artifacts, sponsor runtime acceptance,
or baseline branch consolidation.
