# TASK-G11-REMEDIATION-PERFORMANCE-001 evidence — Pass 4

- Gate verdict: **FAIL_AWAITING_SPONSOR_ACCEPTANCE**.
- Integration branch: `perf/p0-navigation-remediation`.
- Union: Line A `7994cc6` + Line B `e8ffeaa`, common base `186c42e`, audited merge `a4805cc`.
- Contract: `docs/performance/MASTER_PROMPT_P0_PERFORMANCE.md` §6/§9, P0-01..60 and mandatory investigation 1..140.

## Verified

- Both pinned source commits are ancestors of the integration branch; neither remediation line was replaced.
- Tier A remains present: client navigation, read-path expiry removal, route feedback, hot-index and RLS-initplan migrations.
- Tier B implemented: persistent authenticated route-group shell; explicit dynamic flags removed; user-keyed 30-second role cache with tag invalidator; RLS remains the authority.
- Tier C implemented in application/source: bounded/streamed Dashboard, scoped inspection catalogue and batched signed URLs, source-only RLS-invoker grouped/search RPC migration with application fallbacks.
- Typecheck PASS; production build PASS; protected static suite 155 passed / 4 intentional provider skips / 0 failed.
- Production performance: desktop 90/90; iPad portrait 10/10; iPad landscape 10/10; slow-4G portrait 10/10; zero failed samples.
- Responsive `/field`: 0 px horizontal overflow p75 in all three responsive profiles. Ordinary-navigation long-task p95 is at most 157 ms.
- No merge to `setup/Inspection` or `main`, no deployment and no Pass-4 remote DDL.

## Acceptance failures / blocked evidence

- Final desktop warm p75: Dashboard 2701, Operations 4160, Factories 1921, Planning 1070, Reviews 4175, AI Suggestions 1019 ms; all fail §9 `<=500 ms`.
- Final desktop cold p75: 1809–4501 ms; all fail §9 `<=900 ms`.
- iPad field warm p75: portrait 2073, landscape 2071, slow-4G portrait 2356 ms; timing fails even though geometry passes.
- React commit counts are unavailable in the optimized production build and are not claimed.
- Pass 4 lacked an authorized database session. No `EXPLAIN (ANALYZE, BUFFERS)` could be captured for prior applied Tier-A DDL. The Tier-C migration is unapplied/source-only; its fallbacks are active. Database runtime certification is therefore BLOCKED.

## Evidence pointers

- `docs/performance/results/baseline.json` (unchanged baseline of record).
- `docs/performance/results/final.json`, responsive JSONs, CSVs and JSONL raw runs.
- `docs/performance/inspection-before-after-results.md`.
- `docs/performance/inspection-regression-results.md`.
- `docs/performance/inspection-p0-register.md`.
- `docs/performance/inspection-agent-handover.md`.

Next allowed action: sponsor reviews the PR without merging; a governed database operator captures/appraises plans and applies the Tier-C migration only in separately approved staging, then QA repeats the identical production benchmark. No G11 PASS may be claimed from this evidence.
