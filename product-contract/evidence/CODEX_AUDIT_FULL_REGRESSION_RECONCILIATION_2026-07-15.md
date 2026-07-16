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
