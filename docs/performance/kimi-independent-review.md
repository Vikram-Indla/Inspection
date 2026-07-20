# Kimi Independent Performance Review — Phase 1 (code-level root-cause analysis)

Branch `improved` @ dd0f3e8. All findings verified against source; `file:line` cited per finding.
Severity: **P0** = plausibly contributes to the reported 1–2 s navigation delay; **P1** = real cost, secondary or scale-dependent; **P2** = minor/scoped. Items needing runtime proof are marked **needs measurement**.

## Architecture summary

Next.js 15 App Router, server-first: 71 async Server Component pages + 5 route handlers, all `force-dynamic`, querying Supabase (PostgREST + storage) directly at render time. No client data layer (no react-query/SWR), no client state library, no React contexts. The application shell is **not** a shared layout — each page renders `<Shell>` itself, so every navigation re-executes the entire chrome server-side (auth verify, `user_roles`, factories region scan, full i18n string build) and remounts it client-side (NotificationBell re-polls, shell UI state resets). There is no tenant concept; persona (`user_roles`) is the RBAC unit and is re-queried 2–3× per navigation. See `inspection-route-inventory.md` for the full route table.

## Findings register

### Shell / navigation structure

**K-001 — P0 — No persistent app shell: whole chrome re-renders and remounts per navigation**
- Area: shell remount / provider remount. Routes: all 63 Shell-wrapped pages.
- `src/components/Shell.tsx:9-28` (async server Shell: `useT()`, `getServerUser()`, `user_roles` query, `factories` region scan `limit(1000)`); rendered per-page, e.g. `src/app/dashboard/page.tsx:189`, `src/app/visits/page.tsx:201`. Root layout `src/app/layout.tsx:73-80` contains no shell.
- Every client navigation pays: full server render of the chrome (2 DB queries + dictionary + ~100 translated strings + nav tree), full RSC payload for the chrome, and client remount of `ShellClient` (drawer/search/collapse state reset) and `NotificationBell` (immediate 2 queries — see K-008). There is no layout caching the shell between routes because there is no layout hosting it.
- Fix: move Shell into a shared route-group layout (e.g. `app/(app)/layout.tsx`) with the nav/role/region data fetched once and cached (`unstable_cache` or React cache across navigations via layout persistence); keep per-page titles via a thin client slot. Risk: medium — Shell props (current route, title, topbar) are per-page; needs a client `usePathname` shell + page-provided header slot. The role-scoped nav query becomes cacheable per user.

**K-002 — P0 — `force-dynamic` on every page kills all route caching**
- Area: disabled caching. Routes: all. 68 `page.tsx` files export `dynamic = "force-dynamic"` (verified by grep; includes `/login`).
- Combined with K-001, every navigation is a guaranteed full server round trip; Next.js Full Route Cache and any static prerender never apply, even to content that is per-user-stable for seconds at a time (nav, dictionaries, role sets).
- Fix: remove `force-dynamic` where not strictly required and revalidate via tags after mutations, or keep dynamic rendering but cache the *shared* fragments (K-001). Risk: low-medium — must audit mutation→revalidation paths (server actions already call `router.refresh()` in places, which refetches everything anyway).

**K-005 — P0 — Login is a 3-hop full-document redirect chain**
- Area: redirect chain / raw navigation. Routes: `/login` → `/launch` → role home.
- `src/app/login/LoginClient.tsx:107` `window.location.assign("/launch")` (deliberate: cookie-write race, comment lines 104-106) → `src/app/launch/page.tsx:28-48` (force-dynamic; auth + `user_roles` + `redirect`) → role home (force-dynamic, full data + full shell).
- Two full document loads (JS re-download is cached but re-parsed/re-executed; all React state cold) plus three sequential server round trips before first content. This directly produces the "1–2 s after login" report.
- Fix: keep the hard nav if the cookie race is real, but collapse hop 2: have `/launch` logic run in middleware or as part of the login response (`router.push` after `signInWithPassword` + `router.refresh()`), so login → role-home is one document load + one RSC fetch. Risk: medium — the cookie-race comment indicates a past failure; needs e2e proof.

**K-006 — P0 — Raw `<a href>` / `window.location` navigation in high-frequency UI**
- Area: raw anchor navigation. What: full document reloads instead of client transitions.
  - `src/components/FieldTabs.tsx:38-44` — the iPad inspector **bottom tab bar** uses raw `<a href>` for its 3 highest-frequency destinations (field dashboard / visits / virtual). Every tab tap on iPad = full reload.
  - `src/app/visits/page.tsx:209-212` — List/Calendar/Workload/Map view switcher raw `<a>`.
  - `src/app/dashboard/DashboardView.tsx:41-47` — Strategic/Operational tab switch raw `<a href>`; each click re-runs the K-003 full-dataset load as a full document reload.
  - `src/components/ShellClient.tsx:390-392` — account menu (language/profile/signout) raw `<a>`.
  - `src/components/field/FieldHome.tsx:378` — map marker click `window.location.href = visitHref(...)`.
- Fix: switch to `next/link` / `router.push` (signout can stay a document nav). Risk: low.

**K-007 — P0 — Date/region scope changes trigger full document reloads**
- Area: raw navigation. `src/components/ShellClient.tsx:205-212` — `replaceScope()` builds a URL and calls `window.location.assign(...)`. Every date-scope apply or region change on any scoped page = full reload incl. K-001/K-003 costs.
- Fix: `router.replace()` with scroll:false. Risk: low (page reads `searchParams` server-side already).

### Server data-loading

**K-003 — P0 — Dashboard loads the entire operational dataset on every visit**
- Area: blocking loaders / client-side aggregation / missing pagination. Route: `/dashboard`.
- `src/app/dashboard/page.tsx:107-137` — `collect()` (lines 34-44) pages through **all rows** of 7 tables: `visits`, `inspections`, `reviews`, `checklist_responses`, `violations`, `geo_events`, `factories`, each with 2–3-level embeds, then an `audit_events` follow-up chunked 80 ids/query (lines 139-151) + `engine_settings`. Aggregation happens in memory (`buildDashboardMetrics`).
- `checklist_responses` is the highest-cardinality business table; this page's cost grows linearly with platform usage and blocks the whole navigation (no streaming; the page awaits everything before returning JSX). Tab switches (K-006) and scope changes (K-007) re-run it.
- Fix: push aggregation into SQL/RPC (grouped counts by region/city/sector), bound the window (`from`/`to` params already exist — apply them in the queries; currently **no date filter is pushed to the DB** — verified: the `collect` selects have no `.gte/.lte` on the scope), and stream sections with `<Suspense>`. Risk: medium-high (metrics correctness must be preserved; RLS parity in RPC). **Needs measurement** to size, but structurally this is the heaviest page in the app.

**K-004 — P0 — Duplicated auth + RBAC round trips on every navigation**
- Area: route-guard repeated API calls. Routes: all authenticated pages.
- Chain per navigation: middleware `getClaims()` (`apps/web/middleware.ts:35`) → page `getVerifiedUser` (`src/lib/verified-user.ts:7-41`, React-`cache()`d per request — good) → page-level `user_roles` query (35 occurrences across 29 files, e.g. `dashboard/page.tsx:99-102`, `planning/page.tsx:15`) → **Shell repeats the identical `user_roles` query** (`src/components/Shell.tsx:20`) → admin routes add a third via `AdminRouteBoundary` in a segment layout (`src/components/AdminRouteBoundary.tsx:15`, e.g. `src/app/admin/items/layout.tsx`). Additionally Shell scans `factories` for the region dropdown on every navigation (`Shell.tsx:23`, `limit(1000)`, no `region` index — K-013).
- `getClaims` verifies locally (JWKS), so auth itself is cheap; the DB round trips are the cost: minimum 2 (`user_roles` ×2) + 1 (`factories`) per navigation before any page data loads.
- Fix: fetch roles once (shared layout per K-001, or `unstable_cache` keyed on user id with tag invalidation on role change); compute region list from a small cached RPC or a `distinct` view. Risk: low-medium (staleness window for role revocation must be chosen deliberately).

**K-009 — P1 — Mutating RPC on read paths of the two hottest lists**
- Area: blocking loaders. `src/app/visits/page.tsx:30` and `src/app/field/page.tsx:57` call `sb.rpc("expire_lapsed_visits")` (security-definer **write**) before reads, on every page load. Adds a write txn (row locks on `visits`) to every navigation to `/visits` and `/field`; under concurrency this serializes.
- Fix: move expiry to the existing pg_cron job (`supabase/migrations/0025_scheduled_visit_expiry.sql` already schedules it — the read-path call is redundant) or make it a no-op-fast guarded function. Risk: low-medium (display staleness between cron ticks; already accepted elsewhere).

**K-010 — P1 — Arabic dictionary: whole-table fetch, 30 s TTL, default locale**
- Area: disabled/short caching. `src/lib/i18n.ts:100-126` — `getDict("ar")` paginates the **entire** `ui_strings` table (1000 rows/page) when the 30 s module cache is cold; Arabic is the default (`getLocale`, lines 93-96). Cold server / dev / every TTL expiry lands this on some user's navigation. Both the page and Shell call `useT()` per render (e.g. `Shell.tsx:12` + `dashboard/page.tsx:79`).
- Fix: raise TTL + `revalidateTag` busting from `/admin/localization` saves (already partially done per comment line 99), or ship the dictionary as a build-time/versioned artifact. Risk: low. **Needs measurement** (row count of `ui_strings`).

**K-015 — P1 — Inspection workspace loads entire catalogue tables unfiltered**
- Area: select-all / overfetching. `src/app/field/inspection/[id]/page.tsx:34` selects **all** `inspection_items` (no `where` — full catalogue incl. regulation embeds) and line 38 **all** `violation_codes` + `penalty_mappings`, on every inspection open; plus per-photo `createSignedUrl` calls (lines 74-75) regenerated each load.
- Fix: scope items to the visit's `package_version_id` (available from the line-33 query) and codes to referenced violations; cache signed URLs. Risk: medium (must match current render logic).

**K-016 — P1 — Signed URLs regenerated per page view**
- Area: signed-URL regeneration. `src/app/visits/[id]/page.tsx:73` (per attachment), `src/app/operations/page.tsx:261`, `src/lib/factory360/dossier.ts:230-234`, `src/app/field/inspection/[id]/page.tsx:74-75`. TTLs 600–3600 s but never cached — every navigation re-pays N storage API calls.
- Fix: cache signed URL per storage_path until TTL minus skew (React `cache` per request is insufficient; needs `unstable_cache`). Risk: low.

**K-008 — P1 — NotificationBell: 2 queries on every navigation + 30 s poll with exact count**
- Area: polling / duplicate requests / exact counts. `src/components/NotificationBell.tsx:50-77` — because the shell remounts per navigation (K-001), `load()` (list + `count:"exact"` head query, line 62) fires on **every** navigation; then polls every 30 s (`POLL_MS`, line 28) per mounted page; `markAllRead` loops per-row updates (line 102).
- Fix: persistent shell (K-001) removes the per-navigation refetch; replace exact count with the fetched rows' length or an indexed `unread` flag count; batch mark-all in one `update`. Risk: low.

**K-011 — P1 — Global search: 12 parallel `ilike '%…%'` queries per invocation**
- Area: duplicate/expensive queries. `src/app/api/shell/search/route.ts:20-33` — 12 leading-wildcard `ilike` queries across 5 tables per search call; client debounce 250 ms + abort exists (`ShellClient.tsx:134-160`). No `pg_trgm` extension in any migration (verified) → sequential scans on growing tables.
- Fix: consolidate to one RPC/union or a tsvector/trgm index per searched column; consider one round trip returning grouped results. Risk: medium. **Needs measurement** at production row counts.

**K-012 — P1 — Admin home runs 5 exact-count queries incl. append-only `audit_events`**
- Area: exact counts. `src/app/admin/page.tsx:42-46`. `count:"exact"` on `audit_events` is O(table) and the table only grows. Also `admin/security-access/page.tsx:14`, `planning/page.tsx:31`, `visits/page.tsx:38` (count+data combined — acceptable).
- Fix: estimated counts (`reltuples`) or bounded counting for display KPIs. Risk: low.

### Database schema / RLS

**K-013 — P1 — Missing indexes on hot filter/sort/join columns**
- Area: missing indexes. Foundation migration `supabase/migrations/0001_foundation.sql:150-177` creates `visits`/`assignments` (and `checklist_responses`, `violations`, `factories`) with PKs only; no later migration adds:
  - `visits(window_start)` — visits list `order("window_start")` (`visits/page.tsx:39`) and dashboard sorts;
  - `visits(planning_status)` / `(operational_state)` — filters in field/visits pages;
  - `checklist_responses(inspection_id)` — `field/inspection/[id]/page.tsx:35`, dashboard full scan;
  - `violations(inspection_id)` — `field/inspection/[id]/page.tsx:37`;
  - `factories(region)` — Shell region scan (`Shell.tsx:23`);
  - `assignments(inspector_id)` — field home (`field/page.tsx:70`) (only `assignments(visit_id)` unique exists, 0027).
- Fix: add concurrent indexes in one migration. Risk: low. **Needs measurement** (EXPLAIN on staging data).

**K-014 — P1 — RLS role functions evaluated per row; `auth.uid()` unwrapped**
- Area: expensive RLS. `supabase/migrations/0001_foundation.sql:342-345` `has_role()` and `0002_rbac_audit.sql:6-8` `has_any_role()` are `security definer` SQL functions calling bare `auth.uid()`; the `visits` SELECT policy (`0012_admin_dossier_visibility.sql:6-9`) evaluates `has_any_role(...)` **plus** a correlated `EXISTS` on `assignments` for every candidate row. The team fixed this exact pattern (initplan, `(select auth.uid())`) for only two policies (`0029_cd023_rls_initplan.sql`, `20260719040000_dec_f_rls_initplan_fix.sql`) — the rest remain.
- Fix: wrap `auth.uid()` as `(select auth.uid())` in `has_role`/`has_any_role`/`is_assigned_inspector` (function-level fix covers all policies at once); consider marking functions `stable` + `least`-cost ordering already OK. Risk: low (pure plan-caching change, precedent exists).

### Client rendering / bundle / assets

**K-017 — P1 — Missing `loading.tsx` on ~30 routes → zero feedback during the 1–2 s**
- Area: blocking navigation UX. `loading.tsx` exists for 17 segments; absent for all of `/planning/*` (7 routes), `/visits/calendar|map|workload`, `/cases`, `/committee`, `/enforcement`, `/evidence-ocr`, `/incident-reports`, `/portal`, `/profile`, `/ai/suggestions`, `/admin/access|audit|bulk-violations|devices|enforcement-recommendations|notifications|operations|risk|risk/models|security-access|workflows|gis/spatial`, `/reviews`, `/field/factory-360*`, `/virtual`, `/operations/exceptions`. With no persistent shell and no suspense fallback, a click renders nothing until the server responds — the delay is *perceived* as a freeze.
- Fix: add `loading.tsx` (skeleton components already exist: `src/components/Skeleton.tsx`) to hot routes. Risk: trivial. (Does not reduce actual time; reduces perceived P0.)

**K-018 — P2 — Non-virtualized tables with large prop payloads**
- Area: non-virtualized tables / hydration weight. `src/app/visits/VisitsBoard.tsx` (620-line client component) receives up to 1000 fully-joined, pre-translated rows (`visits/page.tsx:223-225`) — RSC serialization + hydration of the whole set; renders all rows without virtualization. Dashboard `SearchResults` similarly receives full row sets server-side (server component — cheaper, but still full payload, `dashboard/page.tsx:194`).
- Fix: paginate server-side (URL-driven), virtualize if 1000-row rendering is a real requirement. Risk: medium. **Needs measurement.**

**K-019 — P2 — Scoped polling/animation loops (verified cleaned up, but worth noting)**
- `src/app/operations/live/LiveMapInner.tsx:98` — 100 ms `setTick` (10 renders/s of the map subtree; reduced-motion gated, cleanup present).
- `src/app/operations/Monitoring.tsx:30,85` — 30 s server-action refetch loop. `src/app/reviews/[id]/VersionCompare.tsx:6,88` — 45 s staleness poll. `src/app/field/inspection/[id]/Workspace.tsx:165`, `FactoryVerification.tsx:163` — 8 s ticks. `src/app/field/[visitId]/Startup.tsx:180` — `router.refresh()` every 15 s **while override pending** (full RSC refetch of the visit page). All have cleanup; none leak. `router.refresh()` polling re-runs the entire page's server data — prefer targeted refetch. Severity P2 except Startup (P1-adjacent while active).

**K-020 — P2 — Images: zero `next/image`, 11 raw `<img>`; fonts: 15 woff2 globally**
- `next.config.mjs` has no `images` config; grep shows 0 `next/image` imports, 11 `<img>` (mostly small SVG/PNG brand marks, e.g. `ShellClient.tsx:258`). Fonts: 3 families / 15 files self-hosted via `next/font/local` with `display:swap` (`layout.tsx:23-55`) — acceptable, but all load globally including `/login`. No breakpoint/`matchMedia`-driven remounts found (iPad): only an annotator resize listener with cleanup (`ImageAnnotator.tsx:125-126`) and reduced-motion gates.

**K-021 — P2 — Bundle: two map libraries, both code-split correctly**
- `package.json:16-20`: `mapbox-gl` **and** `leaflet`/`react-leaflet`. All map surfaces load via `next/dynamic { ssr:false }` (verified at 9 call sites) — good. Login story panel pulls the leaflet atlas chunk onto the public page (`login/StoryPanel.tsx:17`). Charts are hand-rolled SVG (`components/charts/*`) — no chart lib. No pdf lib. No wholesale icon imports. Main risk is duplicate map stack maintenance, not runtime. No bundle analyzer configured.

**Not found (verified absent):** React contexts / broad subscriptions / unstable context values (no contexts exist); zustand/redux; react-query/SWR (so no staleTime/refetchOnWindowFocus issues); `template.tsx` remounts; `key=`-prop remounts (only list keys); `select('*')` (zero matches — all selects are explicit column lists); duplicate realtime subscriptions (no `supabase.channel`/realtime usage in app code); service-worker push duplication (single `PwaRegister`); memory leaks from un-cleaned timers/listeners (all `setInterval`/listeners checked have cleanup).

## Prior-doc claims verification

Prior performance material = `docs/performance/MASTER_PROMPT_P0_PERFORMANCE.md` (a programme plan, not findings) + governance activation (186c42e). Claims in it, checked against code:

| Claim | Verdict | Evidence |
|---|---|---|
| "Prevent application shell remounts" is a needed remediation area | **CORRECT** | K-001: no shared layout; Shell rendered per page (`Shell.tsx`, `layout.tsx:73-80`) |
| "Deduplicate inspection detail requests" is a needed area | **PARTIALLY CORRECT** | Inspection workspace fires 23 queries but batched in `Promise.all` groups (`field/inspection/[id]/page.tsx:32-48`); the real issue is unbounded catalogue selects (K-015), not classic duplicates |
| "Virtualize large inspection table" | **CORRECT (as risk)** | VisitsBoard non-virtualized up to 1000 rows (K-018); no virtualization anywhere |
| "Defer dashboard 3D hero loading" | **INCORRECT** | No 3D assets exist in the codebase. Dashboard has no hero; the only map on a public page is the login leaflet atlas, already `ssr:false` |
| "Calling getUser [in middleware] made every page request consume Auth API rate-limit budget" (comment in `middleware.ts:31-34`, already remediated to `getClaims`) | **CORRECT** | Middleware now uses `getClaims` (local JWKS verify) — prior fix is real and in place |
| Prior initplan RLS fixes (0029, 20260719040000) solved the expensive-RLS problem | **PARTIALLY INCORRECT** | Only 2 policies fixed; `has_role`/`has_any_role`/`is_assigned_inspector` still use bare `auth.uid()` and are used by dozens of policies (K-014) |
| "React's request cache keeps those checks fail-closed without tripling calls to Supabase Auth" (`supabase-server.ts:22-26`) | **CORRECT for Auth, MISLEADING overall** | `getClaims` is cached per request, but `user_roles` is still queried 2–3× per navigation outside that cache (K-004) |
| Role-based launch routing happens server-side at `/launch` | **CORRECT** | `launch/page.tsx:28-48` verified; it is also a full extra hop in the login chain (K-005) |

## Phase 2 measurement plan

**Tooling available in-repo (verified):**
- Playwright 1.61 at `apps/web/playwright.config.ts` — 60+ e2e specs in `apps/web/e2e/`, `auth.setup.ts` persona fixture storing `playwright/.auth/*.json`; baseURL `http://127.0.0.1:3000` against `npm run start` (production build); traces retained on failure.
- **Test credentials exist**: 5 seeded personas (planner/inspector/reviewer/admin/ops) hardcoded in `apps/web/e2e/personas.ts` against the live Supabase project (`NEXT_PUBLIC_SUPABASE_URL` present in `apps/web/.env.local`, which exists — 23 env keys incl. Supabase, Mapbox, Gemini, Twilio, DocuSign, Resend, VAPID; values not printed).
- Additional configs: `playwright.inspector-visual.config.ts`, `playwright.static.config.ts`, `playwright.ui-compliance.config.ts`; `@axe-core/playwright` available. No existing performance/timing harness, no bundle analyzer, no Web-Vitals instrumentation in app code.

**Recommended baseline harness:**
1. **Navigation timing spec** (new Playwright spec): login once per persona (reuse storage state), then measure click→`load`/`domContentLoaded`/first-paint/TTI-proxy for the top 12 transitions (login→role home, shell nav ×6, visits view switches, dashboard tab switch, field tab taps on an iPad viewport (`devices["iPad (gen 7)"]`)). Record `performance.getEntriesByType("navigation")` + PaintTiming + longtask via `PerformanceObserver`; 10 runs/route, median + p75.
2. **Server timing**: enable `Server-Timing` (or wrap `supabaseServer()` calls with a timing helper) for one instrumented run to split shell queries vs page queries vs Auth; alternatively log `duration` per PostgREST call in a dev-only fetch wrapper.
3. **DB layer**: `EXPLAIN (ANALYZE, BUFFERS)` on the K-003 dashboard selects, K-013 columns, and K-014 policies against staging data; check `pg_stat_statements` if available on the hosted project.
4. **Network capture**: HAR per navigation to count requests and RSC payload sizes (dashboard payload expected to be the outlier).
5. **Bundle**: `next build` output table + `@next/bundle-analyzer` one-off run (no app change needed, `ANALYZE=true`).
6. Baselines to record per route: server response ms (RSC), request count, payload KB, JS parse/eval ms, long tasks, DB query count per navigation (target: prove K-001/K-003/K-004 dominate; expect ≥3 DB round trips of shell overhead + page data per nav).

**Success criteria for Phase 3 remediation** (suggested): p75 click→interactive < 400 ms for shell-nav transitions on desktop, < 700 ms on iPad; login→role-home < 1.2 s; dashboard DB rows fetched bounded by date window; `user_roles` ≤ 1 query per navigation.
