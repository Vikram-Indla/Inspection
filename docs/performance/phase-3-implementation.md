# Phase-3 Implementation Status (Kimi, branch `improved`)

> Pass-4 supersession: the integration branch completed the items this Line-A record marked deferred. K-001 now uses the authenticated `(app)` route-group layout; K-002 explicit route flags were removed while auth/cookies continue to infer dynamic rendering; K-003 has view-specific bounded reads, streaming and a source-only grouped RPC; K-015/K-016 are scoped and signed in one batch; K-011 has a source-only RLS-invoker union RPC/trigram migration. Definitive status and evidence are in `inspection-p0-register.md` and `inspection-before-after-results.md`. The historical Line-A rationale below is retained as provenance, not current status.

Date: 2026-07-21. Validation: `npm run typecheck` ✅, `npm run build` ✅ (production, Next 15.5.20).

## Implemented (priority order from the programme brief)

| Item | Commit(s) | What changed |
|---|---|---|
| K-022 RSC prefetch storm | `a22d3cf` | `prefetch={false}` on all shell nav/search/AI links (`ShellClient.tsx`). Phase-2 evidence: every shell render fired full server renders of every nav destination (up to ~920 ms each). |
| K-006/K-007 raw-anchor & `window.location` nav | `fb5fc0f` | `next/link` (prefetch off) in FieldTabs (iPad tab bar), DashboardView tab bar + dimension switcher + result links, visits view switcher, VisitsBoard rows; `router.replace(scroll:false)` for ShellClient date/region scope; `router.push` for FieldHome map markers. `/locale` + `/signout` intentionally stay plain anchors (route handlers mutating cookies/session). |
| K-004 persona fetch dedup | `1726010` | New `src/lib/persona.ts`: React `cache()`-deduped `getUserRoles()` / `getShellRegions()`; 25 call sites converted (Shell, AdminRouteBoundary, all page guards, admin-configuration). 2–3 `user_roles` round trips per navigation → 1 per render. Not cached across requests — role changes apply next navigation; RLS untouched. |
| K-009 read-path write RPC | `d60b448` | Removed `expire_lapsed_visits` RPC from 5 pages. Verified first: `0025_scheduled_visit_expiry.sql` registers pg_cron `expire-lapsed-visits` every 15 min (unscoped sweep); boards render display-level 'expired' between ticks (M02-016/M03-015). |
| K-003 dashboard bounds | `82f92a6` | All 6 dashboard table loads now push a date bound to PostgREST (strict superset of every `isInScope()` check in `metrics.ts`, incl. previous-period window + today). `!inner` embeds on reviews/responses/violations. Factories (reference data) deliberately unbounded; `collect()` pagination kept as safety net. |
| K-005 login chain | `dba791d` | `ROLE_HOME` extracted to `src/lib/role-home.ts`. LoginClient resolves role home via the authenticated browser client and hard-navigates there directly (2 hops instead of 3). Hard nav kept deliberately (cookie-write race documented in code). `/launch` intact as fallback/deep-link/no-workspace path. |
| K-008 notification bell | `a43d246` + `23d4625` | `supabaseBrowser()` singleton (one JWKS fetch per browser session instead of per mount); 30 s session snapshot in NotificationBell — remounts (K-001) no longer refire list+exact-count per navigation; exact count kept for badge accuracy, refreshes on poll/TTL/dropdown-open; markRead updates snapshot in place. |
| K-013/K-014 DB migration | `57f7b1e` | `supabase/migrations/20260721090000_perf_indexes_rls_initplan.sql` — 6 additional indexes on hot columns + `(select auth.uid())` initplan wrap in `has_role`/`has_any_role`/`is_assigned_inspector`; the shared `violations(inspection_id)` index is owned by `20260720154210_g11_navigation_performance_indexes.sql`. **NOT applied to any live DB — needs review/apply.** |
| K-017 loading states | `26e7497` | Shared `RouteLoading` + 37 segment `loading.tsx` (all of /planning/*, /visits/calendar|map|workload, /reviews, /virtual, /field/*, 13 /admin/*, etc.). Instant visual acknowledgement on every transition. |

## K-001 (persistent shell) — partially mitigated, full restructure deferred

**Mitigations shipped** (they remove most of the *measured* per-navigation shell cost):
- K-004: shell data queries deduped to 1 per render.
- K-008: bell no longer refetches on remount.
- K-022 + K-006: shell renders no longer trigger the prefetch storm; transitions are client-side.
- K-017: transitions now paint an immediate loading state.

**Why the full layout restructure is deferred:** making the chrome persistent requires hosting it in a layout above all 63 Shell-wrapped pages (root-layout gate or `(app)` route group). The per-page `title`/`context`/`topbar` props (server-rendered, translated, present in SSR HTML) cannot be supplied to a layout without editing every one of those 63 heterogeneous pages (1–4 Shell call sites each, incl. error early-returns). A regex codemod over multi-line JSX props is high-risk against 60+ e2e specs and cannot be safely completed + verified inside this phase's budget. Phase-2 data also shows the client-remount cost itself is small (long tasks ≈ 0, heap 1.6–12.6 MB); the expensive part was shell *data re-fetching*, which the mitigations above eliminate.

**Concrete plan when scheduled:** (1) client `ShellGate` in root layout keyed off `usePathname()` with a public-route exclusion list (/login, /reset, /launch, /signout, /reports/print); (2) persistent chrome = sidebar + topbar only; (3) new tiny server component `PageHeader` renders the title/context row inside each page (keeps SSR HTML + translations, no hydration flash); (4) scripted migration of Shell call sites with per-file typecheck gates; (5) run the full e2e suite before merge.

## K-002 (blanket `force-dynamic`) — analysis: leave in place, by design

Every authenticated page reads cookies (`useT()` → `cookies()`, `supabaseServer()` → `cookies()`), so Next renders them all dynamically regardless of the `force-dynamic` export — the build shows ƒ for every route either way. Removing the export is a no-op; making any of these routes cached would require per-user cache keys and is explicitly out of bounds ("do NOT cache user-specific data across users"). Public routes (/login, /reset) also read cookies for locale. **No route can safely use the Full Route Cache today; nothing removed.** The realized caching wins in this phase instead came from K-004 (per-render dedup), K-008 (session snapshot) and K-022 (prefetch elimination). If Partial Prerendering is adopted later, the new `loading.tsx` shells (K-017) are the prerequisite and are now in place.

## Not in scope / leftovers for Phase 4+

- Apply + review the DB migration (`57f7b1e`) on staging, then production.
- Full K-001 chrome persistence (plan above).
- K-015/K-016 (unbounded catalogue selects, signed-URL caching) — not in the brief's prioritized list; documented in the Phase-1 register.
- Re-benchmark with the Phase-2 harness (Phase 4) to produce before/after evidence.
