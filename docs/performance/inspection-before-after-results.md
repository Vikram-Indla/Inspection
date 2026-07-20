# Inspection Pass-4 before/after performance results

Task: `TASK-G11-REMEDIATION-PERFORMANCE-001`

Run date: 2026-07-20

Runtime: production `next build` + `next start` at `127.0.0.1:3100`, authenticated live Supabase test personas, Chromium. Final evidence contains five cold and ten warm samples per representative route (90/90 valid, zero failed), using nearest-rank median/p75/p95.

## Programme baseline of record versus Pass-4 final

The mandated baseline is `results/baseline.json`. It was produced by the earlier Pass-1 Playwright collector; Pass 4 was required to run `e2e/perf/benchmark.mjs`, whose useful-content proxy waits for blocking network quiet. The table is therefore the required programme comparison, but the delta is not represented as a controlled single-harness causal estimate. Section 9 is evaluated directly against the final timings.

| Route | Cold p75 baseline | Cold p75 final | Change | Warm p75 baseline | Warm p75 final | Change | §9 warm/cold |
|---|---:|---:|---:|---:|---:|---:|---|
| `/dashboard` | 7703 | 2742 | 64.4% faster | 7918 | 2701 | 65.9% faster | FAIL / FAIL |
| `/operations` | 5727 | 4501 | 21.4% faster | 842 | 4160 | 394.1% slower | FAIL / FAIL |
| `/factories` | 2419 | 1930 | 20.2% faster | 2387 | 1921 | 19.5% faster | FAIL / FAIL |
| `/planning` | 932 | 1809 | 94.1% slower | 1352 | 1070 | 20.9% faster | FAIL / FAIL |
| `/reviews` | 11391 | 4263 | 62.6% faster | 11911 | 4175 | 64.9% faster | FAIL / FAIL |
| `/ai/suggestions` | 1083 | 1810 | 67.1% slower | 1356 | 1019 | 24.9% faster | FAIL / FAIL |

All six final warm p75 values exceed the §9 `<=500 ms` target; all six cold p75 values exceed `<=900 ms`. The Pass-2 visual acknowledgement evidence remains 61–71 ms p75 and passes the `<=100 ms` target. No route met useful-content acceptance.

## Same-harness corroboration

For the three overlapping routes in `results/baseline-kimi-pass.json`, both before and final were captured by `benchmark.mjs`: Dashboard warm p75 `10574 -> 2701 ms` (74.5% faster), Factories `2850 -> 1921 ms` (32.6% faster), Planning `2041 -> 1070 ms` (47.6% faster). These improvements demonstrate real movement while still missing §9.

## Interaction and responsive evidence

- Final ordinary-navigation p95 long-task time is 0–157 ms across the six routes; no repeated task above 200 ms was measured.
- Inspector `/field` iPad portrait warm p75: 2073 ms; landscape: 2071 ms; horizontal overflow p75: 0 px in both.
- Inspector `/field` iPad portrait under the explicit CDP slow-4G profile (150 ms latency, 1.6 Mbps down, 750 Kbps up): warm p75 2356 ms; horizontal overflow p75 0 px.
- React commit counts are unavailable in the optimized production React build and are not invented. Long-task, heap and request metrics are retained in the JSON/CSV evidence.

## Database evidence boundary

The two previously applied Tier-A migrations are recorded in prior evidence, but Pass 4 did not receive authorized database access and could not capture `EXPLAIN (ANALYZE, BUFFERS)`. The new Tier-C search/dashboard migration is source-only and unapplied. Consequently database runtime certification is BLOCKED and G11 performance acceptance remains FAIL.
