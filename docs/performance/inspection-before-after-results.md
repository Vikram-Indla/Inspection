# Inspection before/after performance results

Production build, Chromium, authenticated ops persona, localhost application server with the configured remote Supabase project. Five cold contexts and ten warm in-app transitions per route; nearest-rank percentiles.

| Route | Cold p75 before | Cold p75 after | Cold improvement | Warm p75 before | Warm p75 after | Warm improvement | Final visual ack p75 |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/dashboard` | 7703 | 6420 | 16.7% | 7918 | 6921 | 12.6% | 68.3 |
| `/operations` | 5727 | 5631 | 1.7% | 842 | 859 | -2.0% | 63.4 |
| `/factories` | 2419 | 1809 | 25.2% | 2387 | 1885 | 21.0% | 68.6 |
| `/planning` | 932 | 494 | 47.0% | 1352 | 860 | 36.4% | 70.9 |
| `/reviews` | 11391 | 8364 | 26.6% | 11911 | 8897 | 25.3% | 61.1 |
| `/ai/suggestions` | 1083 | 547 | 49.5% | 1356 | 860 | 36.6% | 69.1 |

Aggregate warm p75: 7912 ms before, 6910 ms after. Improvement = (7912 - 6910) / 7912 × 100 = 12.7%.

Largest warm-p75 improvement: `/ai/suggestions`, (1356 - 860) / 1356 × 100 = 36.6% (Planning is 36.4%). Reviews improved (11911 - 8897) / 11911 × 100 = 25.3%.

Request and transfer metrics are preserved per route in `results/route-results.csv`. Resource Timing reports many cached RSC transfers as zero-byte, so aggregate payload reduction is not claimed. Shared First Load JS remained 103 kB before and after (0 kB, 0%).

Acceptance: visual acknowledgement PASS (all warm p75 61–71 ms, target ≤100 ms). Useful-content p75 FAIL (all warm routes exceed 500 ms; Dashboard and Reviews remain severe). Cold p75 passes only Planning and AI Suggestions against the ≤900 ms target.
