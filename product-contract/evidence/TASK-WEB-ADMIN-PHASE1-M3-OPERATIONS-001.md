# TASK-WEB-ADMIN-PHASE1-M3-OPERATIONS-001 Evidence

Date: 2026-07-24  
Status: `IN_PROGRESS`  
Requirements: `CR-430..CR-448`  
Acceptance: `WA-M3-AC-001..006`  
Screens: `WA-DES-033-C3`, `WA-DES-034-C3`

## Route-safety sublease

The existing `/operations` server render called
`expire_stale_geo_override_requests`, which updates workflow rows during a GET.
That call has been removed. The page now captures one request-start timestamp
and filters the actionable pending queue with `expires_at > nowIso`. The
existing atomic `decide_geo_override` database guard remains unchanged and is
still authoritative when a request crosses its expiry boundary during a
decision.

Owned files:

- `apps/web/src/app/(app)/operations/page.tsx`
- `apps/web/e2e/web-admin-m3-route-safety.spec.ts`

Excluded and unchanged:

- `/operations/exceptions`
- `/field/**`
- shared shell and shared `GeoMap`
- APIs, RPC implementations, migrations and remote Supabase

## Verification

- Focused source route-safety checks: PASS, 2/2.
- Focused source plus repeated-GET browser checks: PASS, 3/3.
- Repeated `/operations` renders: HTTP 200 twice; no non-GET/HEAD application request observed.
- Typecheck: PASS.
- Production build: PASS.
- `git diff --check`: PASS.
- Real Chrome load on `http://127.0.0.1:3013/operations`: PASS after the route-safety correction.

The real-browser review also exposed a pre-existing shared-shell bilingual-brand
regression. It is not absorbed into the M3 lease; it is tracked under the
separate proposed task `TASK-WEB-ADMIN-SHARED-BRAND-REGRESSION-001`.

## Remaining M3 evidence

The route-safety prerequisite is closed. Operations Center and Operations Live
still require the full visual, functional, negative, RLS/RBAC, RTL/responsive,
accessibility, provider-failure and protected-regression evidence named by
`WA-M3-AC-001..006`. No module-complete or release claim is made here.
