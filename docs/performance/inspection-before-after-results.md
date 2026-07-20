# Inspection before/after performance results

Production build, Chromium, authenticated ops persona, localhost application server with the configured remote Supabase project. Five cold contexts and ten warm in-app transitions per route; nearest-rank percentiles.

| Route | Cold p75 before | Cold p75 after | Cold improvement | Warm p75 before | Warm p75 after | Warm improvement | Final visual ack p75 |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/dashboard` | 7703 | 3480 | 54.8% | 7918 | 3844 | 51.5% | 68.3 |
| `/operations` | 5727 | 3279 | 42.7% | 842 | 809 | 3.9% | 63.4 |
| `/factories` | 2419 | 1457 | 39.8% | 2387 | 1832 | 23.3% | 68.6 |
| `/planning` | 932 | 533 | 42.8% | 1352 | 822 | 39.2% | 70.9 |
| `/reviews` | 11391 | 6551 | 42.5% | 11911 | 4864 | 59.2% | 61.1 |
| `/ai/suggestions` | 1083 | 499 | 53.9% | 1356 | 847 | 37.5% | 69.1 |

Aggregate warm p75: 7912 ms before, 3838 ms after the reviewed live indexes. Improvement = (7912 - 3838) / 7912 × 100 = 51.5%. Aggregate warm p95 improved from 11901 ms to 4349 ms (63.5%).

Largest warm-p75 improvement: `/reviews`, (11911 - 4864) / 11911 × 100 = 59.2%. Dashboard improved 51.5%; Operations remains the lowest absolute warm p75 at 809 ms.

Request and transfer metrics are preserved per route in `results/route-results.csv`. Resource Timing reports many cached RSC transfers as zero-byte, so aggregate payload reduction is not claimed. Shared First Load JS remained 103 kB before and after (0 kB, 0%).

Acceptance: visual acknowledgement PASS (all warm p75 61–71 ms, target ≤100 ms). Useful-content p75 remains FAIL (all warm routes exceed 500 ms; Dashboard and Reviews remain severe). Cold p75 passes Planning and AI Suggestions against the ≤900 ms target. The live Operations statement-timeout errors observed before indexing did not recur in the indexed run.
