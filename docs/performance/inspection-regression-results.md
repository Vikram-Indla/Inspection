# Inspection Pass-4 regression results

## Passing gates

- Pinned union: `7994cc6` and `e8ffeaa` are both ancestors of integration merge `a4805cc`; common base `186c42e`.
- Typecheck: PASS, zero errors.
- Production build: PASS, Next.js 15.5.20; authenticated routes remain dynamic; shared client base 103 kB.
- Protected static suite: 155 passed, 4 intentional provider skips, 0 failed (159 discovered).
- Dedicated Pass-4 source contracts: 6/6 PASS for persistent shell, dynamic inference, role cache, streamed/bounded dashboard, scoped inspection workspace and RLS-invoker search.
- Production performance: desktop representative set 90/90 valid, zero failures; iPad portrait 10/10, landscape 10/10 and throttled portrait 10/10.
- Responsive: `/field` horizontal overflow p75 0 px in portrait, landscape and throttled portrait.
- Main-thread: no final route p95 long-task total above 157 ms; no repeated ordinary-navigation task above 200 ms measured.
- Authentication, RLS/RBAC, workflow transitions, immutable submissions and audit behavior were not weakened; the protected source suite passed.

## Failed acceptance or unavailable proof

- Useful-content §9 targets FAIL on every representative route: warm p75 1019–4175 ms (`<=500 ms` required), cold p75 1809–4501 ms (`<=900 ms` required).
- iPad `/field` warm p75 is 2071–2073 ms normal and 2356 ms slow-4G; responsive geometry passes but timing does not.
- React commit counts are unavailable in the optimized production build; no value is claimed.
- No authorized database session was available for `EXPLAIN (ANALYZE, BUFFERS)`. Previously applied Tier-A DDL therefore lacks Pass-4 plan evidence; Tier-C DDL is unapplied and its RPC fallback paths remain active.
- The full mutation-heavy live-data browser inventory was not run. Pass 4 used the protected non-mutating static inventory plus the mandated read-only performance routes.

## Harness correction

The original network-quiet loop counted persistent Mapbox worker blobs and telemetry as blocking, producing artificial 30-second waits. Pass 4 updated the harness to ignore only `blob:` workers, Mapbox telemetry/session beacons and realtime sockets, retained all ordinary application/API/resource requests, discarded the invalid partial run, and recaptured all final datasets from zero failed samples.
