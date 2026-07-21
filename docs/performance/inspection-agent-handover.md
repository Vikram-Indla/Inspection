# Inspection Pass-4 integration handover

- Task: `TASK-G11-REMEDIATION-PERFORMANCE-001`
- Gate: G11 hardening
- Branch: `perf/p0-navigation-remediation`
- Integration merge: `a4805cc`
- Sources: Line A `7994cc6`; Line B `e8ffeaa`; common base `186c42e`
- PR base: `setup/Inspection`; never merge or deploy without sponsor acceptance
- Final state: `AWAITING_SPONSOR_G11_PERFORMANCE_ACCEPTANCE` with technical verdict FAIL

## Delivered

The branch preserves both prior remediation lines and adds the Pass-3 Tier B/C application work: persistent authenticated route-group shell; user-keyed 30-second role cache with tag invalidation API; inferred dynamic rendering; view-specific, date-bounded and streamed Dashboard work; package/referenced-code-scoped inspection workspace with batched signed URLs; and RLS-invoker grouped-dashboard/global-search RPC source with trigram indexes and safe application fallbacks.

Tier-A navigation, read-path RPC removal, loading states, RLS initplan and hot indexes from the prior line remain present. Signed URLs are batched but deliberately not persisted across users: a cross-request bearer-URL cache without a governed revocation contract would weaken access boundaries.

## Acceptance truth

Typecheck/build/static gates pass. The final desktop run is 90/90 with zero failed samples. Useful-content acceptance does not pass: warm p75 ranges 1019–4175 ms and cold p75 1809–4501 ms. Responsive overflow passes at 0 px, but iPad field timing remains over target. Database `EXPLAIN` evidence and React commit counts remain unavailable and are not claimed.

## Required sponsor/operator follow-up

1. Review the PR without merging.
2. In an approved staging database, review/apply the source-only Tier-C migration and capture before/after `EXPLAIN (ANALYZE, BUFFERS)` for every Tier-A/Tier-C index and both RLS-invoker RPCs.
3. Rerun the identical production harness. Do not overwrite `results/baseline.json`.
4. If §9 still fails, profile the remaining Reviews/Operations/Dashboard server work and authorize any data-contract change separately.
5. Do not claim G11 PASS until every P0/P1 criterion is evidenced and the sponsor accepts the measured residuals.
