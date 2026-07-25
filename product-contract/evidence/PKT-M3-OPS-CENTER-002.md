# Evidence — PKT-M3-OPS-CENTER-002 / LEASE-M3-OPS-CENTER-002

task_id: PKT-M3-OPS-CENTER-002
requirement_ids: CR-430, CR-432, CR-437, CR-438, CR-447, CR-448
acceptance_ids: WA-AC-0430, WA-AC-0432, WA-AC-0437, WA-AC-0438, WA-AC-0447, WA-AC-0448, WA-M3-AC-001..006, WA-SHELL-AC-008/009/017
route: /operations
branch: codex/m3-operations-reconciliation
allowed_paths touched: apps/web/src/app/(app)/operations/page.tsx, apps/web/e2e/web-admin-m3-operations.spec.ts, product-contract/evidence/PKT-M3-OPS-CENTER-002.md
allowed_paths not touched: apps/web/src/app/(app)/operations/loading.tsx (no change needed), apps/web/src/lib/operations/center.ts (not created — no extraction was required to close the gaps below; adding an unused helper module would be an unrequired abstraction)

## Starting state

`/operations/page.tsx` (1158 lines) was already a mature implementation: KPI
cards, dual map/performance views, override/cancellation queues, export,
monitoring table, Visit Detail and Factory 360 handoffs, SLA math from real
visit windows, and an explicit `operational_state` vs `planning_status`
separation (FND-002, already commented and tested at
`e2e/web-admin-m3-operations.spec.ts:79`). No dirty/preserved slice existed
for this route (unlike `/operations/live`).

## Gaps closed this session

1. **Governed geography filtering was display-only, not authorization
   (CR-439/CR-447).** The existing `?region=`/`?city=` query params
   (`OperationsScopeFilter.tsx`) are an operator-selectable UI narrowing —
   omitting them showed every region nationally regardless of the caller's
   assignment. Applied the same fix as `PKT-M3-OPS-LIVE-001`: read the
   caller's `profiles.region` (RBAC-008) after the `mayViewOperations` gate,
   resolve it through the existing `lib/ksa-regions.ts` canonical resolver,
   and hard-filter `visits`, `factories` and the `highRisk` board to that
   region before the operator-selectable filter is applied. A user with no
   assigned region keeps the existing national RLS visibility (this narrows,
   never widens, existing grants). Visits whose factory carries no region are
   excluded (fail-closed). Out-of-scope exclusions are disclosed via a
   `sq-banner--warning` status region, separate from the existing
   `loadErrors` partial-source banner.
   - **Not scoped this session**: `overrideQueueRows` and
     `cancellationQueueRows` also render factory/inspector identity but their
     Supabase selects do not currently fetch `region`; adding that is a small
     follow-up left for the next M3 session rather than expanding this
     lease's touched surface further.
2. **The partial-source error banner said "retry" as inert text, not an
   affordance (CR-448 / "expose retry/error truth").** Replaced the trailing
   text with a real `<a href="/operations">` link that re-issues the page
   GET. `page.tsx` is a server component, so a client `onClick` reload
   (as used in `/operations/live`) is not available without a new client
   component file, which is outside `allowed_paths`; a same-route navigation
   link is the equivalent real affordance without adding a file.

## Verification run this session

- `npx tsc --noEmit -p .` — **PASS**, no errors.
- `npm run build` (production Next.js build) — **PASS**.
- Composition assertions (new test added to
  `web-admin-m3-operations.spec.ts`, "composition contract" describe block)
  verified directly against committed source (see the known Playwright
  `auth.setup` project-dependency gap already recorded in
  `PKT-M3-OPS-LIVE-001.md`, unchanged this session) — **all 10 checks PASS**:
  profiles/region read exists and executes after the `mayViewOperations`
  gate, `resolveRegionId` is used, `visits`/`factories` are filtered through
  `inAuthorizedGeography`, `outOfScopeVisitCount` exists, the retry link is
  real, the stale inert-text retry copy is gone, and no mutating Supabase
  call was introduced in `page.tsx`.

## Known gap — not evidenced this session

- **Live Chrome/Playwright runtime evidence** (EN/AR, RTL, light/dark, the
  five named viewports, keyboard/focus, positive/negative RLS/geography
  runs) was **not captured** — same environment constraint as
  `PKT-M3-OPS-LIVE-001.md` (no reachable dev server / authenticated Supabase
  session, `auth.setup` project dependency blocks isolating composition-only
  tests headlessly).
- No persona with a known non-null `profiles.region` was confirmed in this
  session (no live DB read performed), so a true positive/negative
  in-region-vs-out-of-region runtime assertion could not be authored with
  confidence.
- `overrideQueueRows`/`cancellationQueueRows` geography scoping (see above)
  remains open.

## Verdict

P1 geography-authorization and retry-affordance gaps closed within the
granted lease scope. Full acceptance (WA-M3-AC-001..006 P0/P1) remains
blocked on live-browser evidence capture and the override/cancellation
queue geography follow-up. Not claiming completion of the full acceptance
matrix.
