# Phase-2 Baseline Methodology & Evidence Notes

Date: 2026-07-21. Branch `improved`. Harness: `apps/web/e2e/perf/benchmark.mjs`.
Server: **production build** (`npm run build` succeeded, Next 15.5.20; `next start -H 127.0.0.1 -p 3100`) against the live hosted Supabase project (`.env.local`). Browser: Playwright `channel: "chromium"`, headless, 1366×900. Auth: 5 seeded personas from `e2e/personas.ts`, storage states cached at `apps/web/e2e/perf/.auth/` (gitignored-see-commit-note).

## Definitions

- **cold** — fresh browser context (empty cache) with saved auth storage state; `page.goto(route, waitUntil:"load")` then network-settle.
- **warm** — one authenticated context; measured transition between two different routes via shell nav `Link` click (`link-click`), or `page.goto` inside the same context when the persona's role-scoped nav has no link to the target (`in-context-goto` — recorded per run in the CSV `method` column).
- **login-chain** — cold context: `/login` form submit → `window.location.assign("/launch")` → role redirect → settled at role home (ops → `/dashboard`). This is the exact post-login journey from the K-005 finding.
- **nav_ms** — wall clock from click/goto until network quiet (500 ms, 30 s cap). Captures full document loads AND client-side transitions uniformly.
- **ttfb/dcl/load/fcp/lcp** — Navigation Timing + Paint/LCP PerformanceObserver entries of the host document (meaningful for cold; warm values reflect the already-loaded host page and are kept only in the CSV).
- **requests/bytes** — CDP Network domain (`encodedDataLength`). **supabase_*** — only browser-side `supabase.co` calls; server-side PostgREST inside RSC render is invisible to the browser (evidence logs show the document request duration instead).
- Aggregation: median / p75 / p95 across all runs of a route×mode (never best-of). 145 runs, 0 failed.

## Results files

- `results/baseline.json` — grouped stats + failure list + notes.
- `results/route-results-baseline.csv` — one row per individual run (145 rows).
- `results/runs-baseline.jsonl` — raw append-only run log (source of truth).
- `evidence/_dashboard-requests.json`, `evidence/_visits-requests.json` — pruned per-request logs (url path, ms, bytes) for one cold load each. No HAR/trace zips were kept: full Playwright traces were not recorded (would include auth cookies; sizes > 5 MB). The pruned JSON request logs are the HAR substitute.

## Key observations from the evidence (feed Phase 3)

1. **`/dashboard` document request: 10 595 ms server-side for 18 KB** (`evidence/_dashboard-requests.json`). The server streams headers immediately (TTFB ~4 ms) but the streamed RSC payload stays open ~10.6 s while the page executes its full-dataset queries — direct confirmation of **K-003**.
2. **RSC prefetch storm (NEW, not in the Phase-1 register)**: after the dashboard shell rendered, the browser fired `?_rsc=` prefetch requests for every visible nav destination — `/admin/regulations` (921 ms), `/admin/compliance-approvals` (920 ms), `/operations` (493 ms), `/field` (493 ms), `/admin/violations` (477 ms), plus `/factories`, `/reviews`, `/planning`. With `force-dynamic` everywhere (K-002) **each prefetch is a full server render with its complete DB workload**, so every page load multiplies server load by the number of nav links. Candidate finding **K-022 (P0-adjacent)**: set `prefetch={false}` on shell nav links or make targeted routes statically prefetchable.
3. **NotificationBell** fires 2 REST calls (~465 ms each, list + exact count) plus 2 JWKS fetches on cold mount — confirms **K-008**.
4. `/visits` document: 2 381 ms server-side (38 KB) — list render incl. `expire_lapsed_visits` RPC (**K-009**) + exact count.
5. Ops persona shell nav has **no `/visits` link** (warm /visits fell back to `in-context-goto`) — role-scoped nav gap worth a product note.
6. `/visits/[id]` row links are raw `<a href>` (VisitsBoard.tsx:588) — warm detail transitions are full document loads (**K-006 confirmed in production behavior**).
7. Long tasks were essentially absent (0–1 per navigation, ≤ 54 ms) and JS heaps small (1.6–12.6 MB) — **the delay is server-render time and request waterfall, not client JS execution**. Bundle/asset weight (~600 KB cold) is not the bottleneck.

## Baseline table (nav_ms median / p75 / p95)

| Route | Mode | n | median | p75 | p95 |
|---|---|---|---|---|---|
| /login→/dashboard (chain) | login-chain | 5 | 10 433 | 12 437 | 12 789 |
| /dashboard | cold | 10 | 8 997 | 11 293 | 13 277 |
| /dashboard | warm (link-click) | 10 | 8 260 | 10 574 | 13 914 |
| /visits | cold | 10 | 2 989 | 5 172 | 5 386 |
| /visits | warm (goto fallback) | 10 | 2 873 | 2 937 | 3 041 |
| /factories | cold | 10 | 2 742 | 3 100 | 6 178 |
| /factories | warm (link-click) | 10 | 2 751 | 2 850 | 2 981 |
| /planning | cold | 10 | 1 952 | 2 039 | 4 473 |
| /planning | warm (link-click) | 10 | 1 995 | 2 041 | 4 783 |
| /field | cold | 10 | 2 458 | 2 480 | 5 155 |
| /field | warm (link-click) | 10 | 2 511 | 2 589 | 2 622 |
| /visits/calendar | cold | 10 | 2 230 | 2 306 | 2 582 |
| /visits/calendar | warm | 10 | 2 332 | 2 373 | 4 721 |
| /visits/[id] | cold | 10 | 2 408 | 2 449 | 4 942 |
| /visits/[id] | warm (raw-`<a>` click) | 10 | 2 382 | 2 472 | 5 029 |

Notable: warm ≈ cold for every route — client-side navigation provides **no** measurable advantage, consistent with K-001/K-002 (no persistent shell, no caching). The user's "1–2 s" report maps to the lighter routes; the dashboard is an order of magnitude worse.

## Excluded from git

- Full Playwright traces/HARs — not recorded (auth-cookie content + size).
- `apps/web/e2e/perf/.auth/*.json` storage states — contain session cookies; excluded via `.gitignore` entry in the same commit.
- Server log (`/tmp/inspect-perf-server.log`) — ephemeral.

## Reproduce

```bash
cd apps/web && npm run build && npm run start -- -H 127.0.0.1 -p 3100 &
node e2e/perf/benchmark.mjs setup
node e2e/perf/benchmark.mjs login --cycles 5
for r in /dashboard /visits /factories /planning /field __VISIT_DETAIL__; do node e2e/perf/benchmark.mjs cold --route $r --cycles 10; done
for r in /dashboard /visits /factories /planning /field; do node e2e/perf/benchmark.mjs warm --route $r --cycles 10; done
node e2e/perf/benchmark.mjs warm-detail --cycles 10
node e2e/perf/benchmark.mjs aggregate
```
