# TASK-WEB-ADMIN-PHASE1-M3-OPERATIONS-001 Evidence

Date: 2026-07-24  
Status: `OPERATIONS_CENTER_TECHNICAL_PASS_BROWSER_EVIDENCE_PENDING`
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

## Operations Center C3 implementation

`WA-DES-033-C3` is implemented within the M3-local lease:

- exactly five KPI cards; Active Visits, On the Way and Executing are
  source-backed, while Submitted Today and Active Alerts remain exact
  `Unavailable — decision required` states;
- Operations Map and National Performance are fixed primary views that
  preserve the region/city scope;
- the shared Mapbox boundary is used through M3-local composition with neutral
  markers, a synchronized accessible list and no invented risk color policy;
- Inspector and Factory previews are real dismissible dialogs with keyboard
  focus containment, focus restoration and full-route drill links;
- the National Performance view preserves monitoring, SLA, corrective-action,
  risk, immutable-location, notification, export and decision queues;
- direct-route access is derived from the same canonical navigation builder,
  preserving planner/reviewer access and the existing Field-only channel gate;
- 1024 keeps five KPIs in one row, 412/390 uses a 3+2 wrap and 320 uses one
  column.

Independent review returned two implementation passes for correction before
acceptance: the first omitted the preview overlays and violated the responsive
KPI contract; the second briefly narrowed direct-route access to Operations
and Leadership. Both defects were corrected before this evidence was recorded.

Additional verification:

- M3 composition, runtime and route-safety suite: **PASS, 11/11**.
- Planner direct-route parity with shared navigation: **PASS**.
- Inspector/Factory preview interaction and dismissal: **PASS**.
- Typecheck: **PASS**.
- Production build: **PASS**, 53/53 static pages; `/operations` compiled.
- `git diff --check`: **PASS**.
- No M3 GET introduced a write, risk threshold, refresh cadence, role,
  provider route or backend contract.

## Remaining M3 evidence

The route-safety prerequisite and Operations Center source/runtime contract are
closed. A real Chrome capture of the final integrated Operations Center remains
pending because the independently corrected shared shell is still on a
separate draft branch. Operations Live has not yet been reconciled to
`WA-DES-034-C3`. Full RTL/theme/viewport, provider-failure, automated
accessibility, protected-regression and sponsor visual evidence named by
`WA-M3-AC-001..006` remain open. No module-complete or release claim is made.
