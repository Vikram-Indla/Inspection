# Evidence — PKT-M3-OPS-LIVE-001 / LEASE-M3-OPS-LIVE-001

task_id: PKT-M3-OPS-LIVE-001
requirement_ids: CR-431, CR-433, CR-439, CR-447, CR-448
acceptance_ids: WA-AC-0431, WA-AC-0433, WA-AC-0439, WA-AC-0447, WA-AC-0448, WA-M3-AC-001..006, WA-SHELL-AC-008/009/017
route: /operations/live
branch: codex/m3-operations-reconciliation
allowed_paths touched: apps/web/src/app/(app)/operations/live/page.tsx, apps/web/src/app/(app)/operations/live/LiveOps.tsx, apps/web/e2e/web-admin-m3-operations.spec.ts, product-contract/evidence/PKT-M3-OPS-LIVE-001.md

## Environment note

`apps/web/node_modules` at the canonical repo was a broken self-referential
symlink (`node_modules -> node_modules`) before this session, blocking
`tsc`/`next build` for every worktree. Repaired via `npm ci` in
`/Users/vikramindla/Developer/Inspection/apps/web` (local dependency
reinstall only — no source, lockfile, or product-contract file touched).

## Codex safety ruling — P1 items closed this session

1. **Per-marker source and observation time were absent/misleading.**
   `page.tsx` now selects `geo_events.kind` alongside `occurred_at` and
   `integration_mode`, and builds `positionObservedAt` / `positionObservedLabel`
   / `positionSourceLabel` per inspector from the actual position row (not the
   visit `window_start`, which was the only timestamp previously surfaced).
   `LiveOps.tsx` renders these as two new fields ("Position source",
   "Position observed") in the accessible inspector-detail drawer — the
   synchronized non-map equivalent, since the Mapbox popup renderer
   (`LiveMapInner.tsx`) is outside this lease's allowed paths.

2. **Governed geography filtering was absent.**
   Investigated the schema for an existing authorized-geography mechanism
   before writing any filter (no value was invented): `profiles.region`
   (RBAC-008, `supabase/migrations/0001_foundation.sql:28`) is the only
   existing user-region assignment field, already used for scope matching in
   `task_assignments` RLS (`20260717030000_mvp2_m2_02_task_assignments.sql:68`).
   `page.tsx` now reads the caller's `profiles.region` after the route-level
   `mayViewOperations` gate, resolves it through the existing
   `lib/ksa-regions.ts` canonical-ID resolver, and filters `activeVisitRows`
   to visits whose factory resolves to the same region. A user with no
   assigned region keeps the existing national visibility already granted by
   the `visits`/`factories` RLS policies (this filter only narrows, never
   widens, existing RLS grants). Visits whose factory carries no region are
   excluded (fail-closed — cannot be proven in-scope) and counted separately
   from the pre-existing fixture/future-date exclusion via a new
   `outOfScopeRecordCount` disclosure line, so the two exclusion reasons stay
   individually truthful rather than conflated.

3. **Permitted visit handoff was absent.**
   The inspector-detail drawer in `LiveOps.tsx` now includes a plain,
   unguarded `<a href="/visits/{visitId}">Open visit record</a>` link,
   matching the existing unguarded-href pattern already used elsewhere in
   this codebase (`OperationsPreview.tsx:139`) — access control is enforced
   by the existing `/visits/[id]` route's own RLS, not duplicated here. It is
   a navigation link only; it grants no action authority.

## Verification run this session

- `npx tsc --noEmit -p .` — **PASS**, no errors.
- `npm run build` (production Next.js build) — **PASS**; `/operations/live`
  compiled (3.53 kB route bundle).
- Composition assertions (source-content checks added to
  `web-admin-m3-operations.spec.ts`, describe block "Live composition
  contract") verified directly against the committed source (bypassing a
  Playwright project/setup-dependency issue unrelated to this change — see
  Known gap below) — **all 16 new/changed assertions PASS**:
  - profiles/region read exists, executes after the `mayViewOperations` gate,
    resolves through `resolveRegionId`, and filters `activeVisitRows`.
  - `outOfScopeRecordCount` is computed in `page.tsx` and rendered in
    `LiveOps.tsx` behind its own disclosure string.
  - `geo_events.kind` is selected; `positionSourceLabel` and
    `positionObservedAt` are derived per position, not per visit window.
  - The drawer renders both new fields and the `/visits/{id}` link; no
    `insert|update|upsert|delete` call was introduced.

## Known gap — not evidenced this session

- **Live Chrome/Playwright runtime evidence** (EN/AR, RTL, light/dark, the
  five named viewports, keyboard/focus/reduced-motion, and the positive/negative
  RLS runs called for in `evidence_required`) was **not captured**. This
  worktree has no reachable dev server or authenticated Supabase session in
  this session (Supabase MCP requires interactive OAuth, unavailable
  headless). `npx playwright test -g "composition contract"` could not
  isolate the composition-only tests from the shared `auth.setup` project
  dependency, which itself requires a live authenticated session and timed
  out after 40s per persona — this is a pre-existing suite/environment
  coupling, not something this lease's allowed paths can fix (fixing it
  would require editing `auth.setup.ts` / `playwright.config.ts`, both
  outside `allowed_paths`). The composition-level source assertions above are
  a substitute for, not a replacement of, real browser evidence.
- Region-scoping has **no persona with a known non-null `profiles.region`**
  identified in this session (no live DB read performed), so a true
  positive/negative in-region-vs-out-of-region runtime assertion could not be
  authored with confidence; only the composition-level code-path assertions
  above were added. A follow-up session with live Supabase access should add
  a runtime test once a region-scoped persona is confirmed.
- Per-marker source/time and the visit handoff are shown in the accessible
  list/drawer only. Surfacing them in the Mapbox popup itself would require
  editing `LiveMapInner.tsx`, which is outside this lease's `allowed_paths`.

## Verdict

P1 code-path gaps closed within the granted lease scope. Full acceptance
(WA-M3-AC-001..006 P0/P1) remains blocked on live-browser evidence capture,
which requires either an expanded lease (to touch `auth.setup.ts` /
`LiveMapInner.tsx`) or a session with a running dev server + authenticated
Supabase access. Not claiming completion of the full acceptance matrix.
