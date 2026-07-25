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
   - **Round 2 (this update)**: closed the follow-up flagged in round 1 —
     `geo_override_requests` and `cancellation_requests` selects now fetch
     `visits.factories.region`, and `overrideQueueRows`/
     `cancellationQueueRows` are filtered through the same
     `inAuthorizedGeography` predicate before mapping. All four
     geography-bearing widgets (visits, factories, high-risk board, override
     queue, cancellation queue) are now scoped. Their individual exclusion
     counts (`outOfScopeVisitCount`, `outOfScopeOverrideCount`,
     `outOfScopeCancellationCount`) sum into one `outOfScopeRecordCount`
     disclosure so nothing is silently dropped.
2. **The partial-source error banner said "retry" as inert text, not an
   affordance (CR-448 / "expose retry/error truth").** Replaced the trailing
   text with a real `<a href="/operations">` link that re-issues the page
   GET. `page.tsx` is a server component, so a client `onClick` reload
   (as used in `/operations/live`) is not available without a new client
   component file, which is outside `allowed_paths`; a same-route navigation
   link is the equivalent real affordance without adding a file.

## Verification run this session (both rounds)

- `npx tsc --noEmit -p .` — **PASS**, no errors, after both rounds.
- `npm run build` (production Next.js build) — **PASS**, after both rounds
  (one transient `PageNotFoundError` on an unrelated `/admin/**` route
  during page-data collection cleared on immediate re-run with no source
  change — a stale `.next` artifact, not a regression from this diff).
- Composition assertions in `web-admin-m3-operations.spec.ts` ("composition
  contract" describe block) verified directly against committed source with
  a standalone Node script (see the known Playwright `auth.setup`
  project-dependency gap already recorded in `PKT-M3-OPS-LIVE-001.md`,
  unchanged this session) — **all 23 checks PASS** across four tests:
  - *Positive — authorized geography*: `profiles.region` read exists after
    the `mayViewOperations` gate, `resolveRegionId` normalizes it, the
    null-region case explicitly preserves existing RLS visibility, and
    `visits`/`factories` are filtered through `inAuthorizedGeography`.
  - *Negative — out-of-region*: override/cancellation selects carry
    `region`, all three per-widget exclusion counts exist and sum into
    `outOfScopeRecordCount`, and the disclosure banner condition is present
    — excluded rows are counted and shown, never silently dropped.
  - *Positive — partial-source retry*: the retry link is a real
    `href="/operations"` anchor, the old inert-text copy is gone, and each
    source read is independently tolerant (labelled `loadErrors` entries;
    the cancellation-queue pre-migration probe degrades to empty without a
    banner).
  - *FND-002 positive/negative*: the operational-state KPI board counts by
    `operational_state` alone (not gated by `planning_status` — a proven
    prior regression), and the `monitored` list keeps an active
    on_the_way/arrived/executing journey visible even past its planning
    window, per the existing in-code FND-002 comment.
  - Negative role denial (unauthorized persona blocked before any KPI/data
    content) was already covered by the pre-existing runtime test
    `"an authenticated admin-only persona is denied both Operations
    routes before data content"` — not duplicated.

## Known gap — not evidenced this session

- **Live Chrome/Playwright runtime evidence** (EN/AR, RTL, light/dark, the
  five named viewports, keyboard/focus, positive/negative RLS/geography
  runs) was **not captured** — same environment constraint as
  `PKT-M3-OPS-LIVE-001.md` (no reachable dev server / authenticated Supabase
  session, `auth.setup` project dependency blocks isolating composition-only
  tests headlessly). The new tests above are composition-level (they assert
  the real code path and query shape exist and are wired correctly); they
  are not a substitute for a live-browser run against two personas with
  different `profiles.region` values, which this session could not obtain.
- No persona with a known non-null `profiles.region` was confirmed in this
  session (no live DB read performed), so a true positive/negative
  in-region-vs-out-of-region *runtime* assertion (two personas, two
  different visible-record sets) could not be authored — only the
  code-path-level checks above were possible.

## Verdict

All identified P1 geography-authorization gaps (visits, factories, high-risk
board, override queue, cancellation queue) and the retry-affordance gap are
closed within the granted lease scope, with non-vacuous composition-level
positive/negative tests added. Full acceptance (WA-M3-AC-001..006 P0/P1)
remains blocked solely on live-browser evidence capture (locale/theme/
viewport/accessibility/two-persona-geography runs), which requires a
reachable dev server and authenticated Supabase session neither available in
this session. Not claiming completion of the full acceptance matrix or
self-certifying browser acceptance.
