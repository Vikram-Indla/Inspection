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

## Round 3 — live-browser attempt, genuine environment stop condition found

The orchestrator reported a restored dev server at `127.0.0.1:3000`; it was
not reachable from this session (`curl`: connection refused; browser:
`ERR_CONNECTION_REFUSED` page). Rather than accept or dismiss the claim,
started a dev server directly in this worktree
(`apps/web`, `npm run dev`, `.env.local` present with real Supabase/Mapbox
values) and drove it with the connected local Chrome browser.

**Finding**: every route — `/login`, `/launch`, `/reference/web-admin/f0`,
and by extension `/operations` and `/operations/live` — crashes on first
client paint in **dev mode only** with a Next.js dev-overlay error:
`Runtime TypeError: Cannot read properties of undefined (reading 'call')`,
originating in `webpack.js` `options.factory` / `__webpack_require__`
inside `react-server-dom-webpack-client.browser.development.js` (10-11
instances of the identical error queued in the overlay). Diagnostic steps
taken, in order, each verified not to be the cause:
- Confirmed only one process bound to port 3000 (no port collision from a
  second dev server).
- Cleared and rebuilt `.next` from scratch (`find .next -delete` — `rm -rf`
  is blocked by this sandbox — then restarted `next dev`); identical crash
  on a byte-fresh cache.
- Confirmed all requested JS chunks (`webpack.js`, `main-app.js`,
  `app-pages-internals.js`, `app/layout.js`, `app/login/page.js`) return
  `200`, so this is not a missing/404 chunk.
- Confirmed exactly one `react` (19.2.7), one `react-dom` (19.2.7), and one
  `next` (15.5.20) in the dependency tree (`npm ls react react-dom next`) —
  not a duplicate-React-instance bug.
- Confirmed `npm run build` (production) with the identical `node_modules`
  compiles and serves `/operations` and `/operations/live` cleanly (see
  Round 1/2 verification above) — the application source is not the fault;
  this is specific to `next dev`'s RSC/webpack runtime.
- Node is `v24.14.1` (no `.nvmrc`/`engines` pin in the repo). Next 15.5.20's
  dev-mode RSC/webpack bundler is a plausible-but-unconfirmed mismatch with
  a Node major version this new; this was not changed or further
  investigated — swapping the active Node runtime is outside this lease's
  `allowed_paths` and is a systemic environment change, not a page.tsx fix.

This reproduces identically on a route this lease never touched
(`/reference/web-admin/f0`), so it is not a regression introduced by this
session's `/operations`/`/operations/live` diffs. Stopped pursuing further
dev-server repair per the standing rule against changing systemic tooling
(Node version, package manager) without it being the explicit, scoped ask;
returning this as the exact blocker rather than self-certifying a browser
pass that did not happen. Dev server stopped (`pkill next dev`) to leave no
dangling process.

## Round 4 — Node runtime fixed, real live-browser evidence captured

The user pointed out the Round 3 blocker was fixable: this machine has
`nvm` with Node `v20.20.2` and `v22.22.2` already installed alongside the
active `v24.14.1`. Switched to `v22.22.2` (`nvm use 22.22.2`), reinstalled
`node_modules` under that version (`npm ci`), cleared `.next`, and restarted
`next dev`. **The dev-mode RSC crash from Round 3 is gone** — `/login`
renders correctly. This confirms Node 24.14.1 was the actual root cause;
recorded here rather than guessed. (A durable fix — pinning `.nvmrc` — is
outside this lease's `allowed_paths`; this fix was applied to the running
shell/session only, not committed to the repo.)

With a working dev server, signed in as the seeded `ops` persona
(`ops@mim.gov.sa`, roles `leadership · ops`) and drove real browser
sessions against `/operations` and `/operations/live`:

- **Geography scope, live and positive**: `/operations` rendered
  `Records outside your authorized region are excluded from this view.
  Excluded records: 14` immediately on load — the Round 1/2 code path is
  real, not just composition-verified. Monitoring table and map rows were
  consistently Riyadh-region factories (Al Watania Plastics, Riyadh
  Advanced Petrochem, Najd Steel Fabrication, Al Amal Plastics, Sudair
  Polymer, Najd Food Industries) — no other-region factory leaked through.
- **`/operations/live` geography + integrity disclosures, live**: rendered
  both `Verification fixtures and future-dated visit windows are excluded
  from this live view. Excluded records: 172` and `Records outside your
  authorized region are excluded from this live view. Excluded records: 4`
  as two distinct lines, confirming the split-disclosure design decision
  from Round 2 works as intended (not conflated into one number).
- **Per-position source/time fields, live**: opened an inspector's detail
  drawer — rendered `Position source: No recorded position for this visit`
  and `Position observed: No recorded position for this visit` (this
  particular visit has no `geo_events` row, which is itself correct
  truthful behavior — no marker is invented).
  - **Provider-unavailable fail-closed state, live**: the map panel showed
    `Live map unavailable — basemap provider failed.` while every other
    widget (counters, disclosures, inspector list, drawer) remained fully
    usable — confirms the bounded-widget-failure contract holds for the
    real Mapbox boundary, not just in composition tests.
- **Read-only visit handoff, live**: clicked `Open visit record` in the
  drawer — navigated to `/visits/10d8a983-e078-48c5-b5a4-70948c038a8d`,
  which loaded the real Visit Detail screen showing `Visit status: arrived`
  (operational state) and `Planning: published` (workflow/planning status)
  as two visibly distinct fields — direct browser confirmation of the
  FND-002 separation this session's composition tests only asserted at the
  code level.
- **AR/RTL, live, both routes**: switched locale (`/locale?set=ar`),
  re-authenticated, and confirmed `/operations/live` renders fully in
  Arabic with `dir="rtl"`: title "العمليات المباشرة — المملكة العربية
  السعودية", both disclosure lines translated including the new geography
  one ("تُستبعد السجلات خارج نطاقك الجغرافي المخوَّل... السجلات المستبعدة:
  4"), and the inspector drawer's new fields translated ("مصدر الموقع",
  "وقت رصد الموقع", "فتح سجل الزيارة"). No untranslated route copy observed.
- **Responsive, live**: resized the Arabic session to 390×844 (mobile) —
  layout stacked cleanly, both disclosure banners fully readable, no
  horizontal overflow or clipped text.
- **Negative role check — root cause found, confirmed real, not fixed
  (outside lease)**: signed in as `admin@mim.gov.sa` (roles
  `compliance_admin · form_admin`) and it was **not** denied `/operations`
  — contradicts this suite's existing runtime test expectation
  (`"an authenticated admin-only persona is denied both Operations
  routes"`). Traced to `apps/web/src/lib/shell-navigation.ts:235`:
  ```ts
  enabled: item.visibility === "business" || allowed,
  ```
  Every nav item with `visibility: "business"` (Dashboard, Operations
  Center, Factory 360, Planning, Execution, Review & Approval, Compliance
  Library, Awaiting Approval, Violations & Penalties) is enabled for **any
  authenticated user** — the `allowed` role check (from each item's
  `roles: businessRoles` list, built at `shell-navigation.ts:131-134`)
  never runs for these items because `item.visibility === "business"`
  short-circuits the `||` unconditionally. This is not a stale test or a
  seed-data quirk — it is a real access-control gap on the shared
  nav-enablement gate used by every business-tier route app-wide, not
  scoped to Operations. Exact fix: `enabled: allowed` (drop the
  `item.visibility === "business" ||` clause) — `visibility` should govern
  display placement (business tab vs admin sidebar), not bypass the role
  check. Not fixed here: `shell-navigation.ts` is explicit prohibited
  territory in both M3 packets ("Do not modify the shared shell, shared
  navigation, global tokens, global CSS or shared GeoMap") and outside
  `LEASE-M3-OPS-CENTER-002`'s `allowed_paths`; the blast radius is
  app-wide auth/nav-gating, not Operations-scoped, and needs its own
  review and lease rather than a drive-by fix inside this packet.
- **Instability observed while driving the browser**: the dev server died
  unprompted once mid-session (process exited with no fatal error logged,
  possibly resource pressure from concurrent tabs + HMR); restarted cleanly
  on retry with no further recurrence. Not investigated further — treated
  as dev-tooling noise, not an application defect, since it self-resolved
  and no equivalent failure occurred in the `next build` production path.

All dev servers stopped at the end of this round (`pkill`/`kill`) — no
dangling process left running.

## Known gap — still not evidenced this session

- Full delivery-matrix coverage (light/dark theme, the remaining named
  viewports 1440×900/1024×768/412×915/320×800, full keyboard/focus-visible
  sweep, automated accessibility checks) was not exhaustively driven —
  Round 4 covered EN+AR, one mobile viewport, and the specific interactions
  above, not the complete matrix from `evidence_required`.
- The `ops` persona's non-null `profiles.region` is now confirmed
  indirectly (14/4 exclusion counts prove a real region filter is active),
  but the exact region value was not read from the database, and only one
  in-region persona was driven — a true two-persona, two-different-region
  comparison (e.g. a second persona confirmed assigned to a different
  region, both seeing disjoint record sets) was not captured this session.

## Verdict

All identified P1 geography-authorization gaps (visits, factories, high-risk
board, override queue, cancellation queue) and the retry-affordance gap are
closed within the granted lease scope, with non-vacuous composition-level
positive/negative tests added and now real-browser confirmed in Round 4
(EN, AR/RTL, one mobile viewport, ops-persona geography scope, provider
fail-closed state, FND-002 separation, visit handoff). Full acceptance
(WA-M3-AC-001..006 P0/P1) remains open pending: the complete delivery matrix
(remaining viewports, light/dark theme, full accessibility sweep), a true
two-persona/two-region comparison, and resolution of the
admin-persona-not-denied observation (flagged above, not this lease's file).
Not claiming completion of the full acceptance matrix or self-certifying
full browser acceptance — Round 4 substantially narrows, but does not close,
that gap.

## Round 5 (module recovery pass, lease renewed 17:35:28+03:00)

Lease was found expired-in-progress at hand-off (renewal_count 0→1, new
expiry 19:05:28+03:00). Before any file work, discovered a second agent
("Codex", this lease's own `breaker`) actively running `next dev` and a
Playwright run inside this exact worktree concurrently — a live instance of
the lease's own "overlapping owner" stop condition. Stopped, reported it,
waited for confirmation the overlap cleared, independently re-verified (no
listeners on 3001/3002, no matching PIDs, clean `git status`) before
resuming. No file in this worktree was written to during the overlap.

Also discovered the runtime this round's task pointed at
(`127.0.0.1:3001`/`3000`) was serving the **main repository's** checked-out
branch (`codex/saqeel-v3-contract-reset`), not this leased worktree — a
~1700-line divergence in `operations/page.tsx` alone. Built and served this
worktree's own production/standalone bundle on `127.0.0.1:3001` instead
(`next build` + manually staged `.next/standalone` static/public assets,
since `next start` is incompatible with this repo's `output: standalone`
config) so every finding below is against the leased branch's actual code.

- **Live browser pass (own build)**: logged in as `ops` (`leadership · ops`)
  in both AR/RTL (default fresh-session locale, confirmed mirrored layout,
  focus ring visible on keyboard `Tab`) and EN/LTR (`/locale` toggle,
  `Operations Map`/`National Performance` tabs correctly re-labelled, no
  layout regression). Scrolled the full page in both locales: KPI grid,
  geographic scope filter, override queue, cancellation queue, CSV export,
  live map list. No console errors (only unrelated Chrome-extension
  warnings). Region filter (`?region=Riyadh`) round-trips correctly
  (chip updates, no error); all currently visible data is already
  Riyadh-scoped, so — consistent with the Round 4 note above — this does
  not exercise a true cross-region negative case.
- **New observation, not a code defect**: on the AR/RTL render, several
  strings fall back to English inside an otherwise fully Arabic page —
  `ops.kpi.submittedContext`, `ops.kpi.alertContext`,
  `ops.kpi.slaBreaches`/`actionsOverdue`/`notificationsFailed`/
  `overridesPending`, and the entire `ops.cancellation.*` group (heading,
  caption, empty state) plus `enum.on_the_way` and other enum labels in the
  live map list. Verified in source: these use the exact same `t()`/
  `local()`/`enumLabel()` mechanism as the correctly-Arabic strings right
  next to them (e.g. `ops.override.*`, which **is** translated) — this is
  the SB19-documented `ui_strings` DB catalogue missing rows for this
  screen's keys, with the intended graceful English fallback firing exactly
  as designed (`src/lib/i18n.ts`: "Missing Arabic falls back to English so
  the app never breaks"). Populating those Arabic strings is a governed
  `/admin/localization` content action, not a code change, and is outside
  every allowed_path in this lease — flagging as a content-catalogue gap
  for the ui_strings owner, not fixing it here.
- **Resize tool did not affect the tab's rendered viewport** in this
  session (`resize_window` to 820×1024 and 390×844 both reported success
  but the screenshot stayed full-width) — a tooling limitation this round,
  not re-tested against the Round 4 finding that mobile 390×844 rendered
  cleanly.
- **Typecheck**: `tsc --noEmit` — clean, no errors.
- **e2e**: `playwright test e2e/web-admin-m3-operations.spec.ts --project=e2e`
  — the shared `auth.setup` project times out (`page.waitForURL` after
  login, 40s) before any of this spec's 26 tests run; all 26 report
  skipped. Same systemic constraint already documented for
  `PKT-M3-OPS-LIVE-001.md` and earlier rounds of this file (headless
  Playwright auth against the live Supabase project does not complete in
  this environment) — not re-diagnosed further this round.

No in-scope code defect was reproduced this round that this lease's files
(`page.tsx`, `loading.tsx`) could fix. No source changes made. This is an
honest verification-only round, not a certification of the open items
listed in Round 4's Verdict above, which still stand.
