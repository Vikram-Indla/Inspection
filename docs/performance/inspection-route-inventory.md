# Inspection Platform — Independent Route Inventory (Kimi Phase 1)

Built from the filesystem (`apps/web/src/app`) on branch `improved` @ dd0f3e8. Not copied from any prior doc.

## Architecture summary

- **Next.js 15.5.20 App Router** (`apps/web`, `src/app`). No Pages Router. React 19, `reactStrictMode: true`, `output: "standalone"` (`next.config.mjs:5-18`).
- **71 `page.tsx` routes + 5 `route.ts` handlers = 76 endpoints.**
- **Server-first**: nearly every page is an async Server Component doing direct Supabase PostgREST queries at render time. No react-query/SWR/Zustand/Redux anywhere (verified by grep for `createContext|zustand|redux|useSyncExternalStore` — zero app-level matches). Client components are leaf boards/panels fed by server-fetched props.
- **No shared app-shell layout.** The root layout (`src/app/layout.tsx:73-80`) renders only fonts/theme/PWA + `{children}`. The application chrome (`Shell`/`ShellClient`) is rendered **inside each page** (`src/components/Shell.tsx`), so the whole shell re-executes server-side and remounts client-side on **every** navigation.
- **Every page is `export const dynamic = "force-dynamic"`** (68 of 71 pages + login/reset; the rest redirect). Full Route Cache is never used.
- **Auth**: middleware (`apps/web/middleware.ts:35`) runs `supabase.auth.getClaims()` (local JWKS verify) on every request matching `/((?!_next/static|_next/image|favicon.ico).*)` — including `/api/*` and RSC navigation fetches — and redirects unauthenticated users to `/login`. Pages re-verify via `getVerifiedUser`/`getServerUser` (React `cache()` per request, `src/lib/supabase-server.ts:27-39`).
- **No tenant concept.** The platform is single-tenant; the "tenant/RBAC lifecycle" equivalent is **persona loading**: `user_roles` is queried per navigation **2–3×** (page-level guard + `Shell` + for admin routes also `AdminRouteBoundary` in a segment layout).
- **i18n**: Arabic dictionary is the DEFAULT locale; entire `ui_strings` table is fetched paginated (1000 rows/page) with a 30 s module-level TTL cache per server process (`src/lib/i18n.ts:100-126`).
- **Data layer**: `@supabase/ssr` server client per request (`supabase-server.ts`), browser client per component mount (`supabase.ts:3-8` — `createBrowserClient` called in `useRef` initializer, so per-mount not global singleton).

## Layout chain

```
src/app/layout.tsx            — root: fonts (3 local families, 15 woff2), ThemeScript, PwaRegister. NO shell, NO providers.
src/app/admin/items/layout.tsx            — AdminRouteBoundary (user_roles query)
src/app/admin/packages/layout.tsx         — AdminRouteBoundary
src/app/admin/regulations/layout.tsx      — AdminRouteBoundary
src/app/admin/violations/layout.tsx       — AdminRouteBoundary
src/app/admin/compliance-approvals/layout.tsx — AdminRouteBoundary
src/app/admin/compliance-requests/layout.tsx  — AdminRouteBoundary
src/app/admin/compliance-requests/new/layout.tsx — AdminRouteBoundary
src/app/admin/integrations/factory-data/layout.tsx — AdminRouteBoundary
(no template.tsx anywhere; no layout for /dashboard /visits /field /planning /reviews etc.)
```

Every other route renders `<Shell>` from its own `page.tsx`.

## Legend

- **Data pattern**: `server-RSC` = async page querying Supabase at render; `client-poll` = setInterval-driven refetch; `SPA-mutate` = server actions.
- **Auth touches**: MW = middleware getClaims; PV = page getVerifiedUser/getServerUser; UR = `user_roles` query; SH = Shell (adds PV + UR + factories region scan, limit 1000).
- All pages are `force-dynamic` unless noted.

## Public / auth routes

| Route | File | Data pattern | Auth/RBAC touches | Notes |
|---|---|---|---|---|
| `/` | `app/page.tsx` | redirect only | MW | `redirect("/login")` |
| `/login` | `app/login/page.tsx` + LoginClient, StoryPanel (leaflet atlas, `next/dynamic ssr:false`) | server-RSC (locale cookie) + client sign-in | MW | Post-login `window.location.assign("/launch")` (LoginClient.tsx:107) — full document load |
| `/reset` | `app/reset/page.tsx` | client form | MW | password reset |
| `/launch` | `app/launch/page.tsx` | redirect hub | MW, PV, UR | auth + roles → `redirect(roleHome)` — 2nd hop of login chain |
| `/launch/no-workspace` | `app/launch/no-workspace/page.tsx` | static-ish | MW | no Shell |
| `/signout` | `app/signout/route.ts` | handler | MW | GET handler |
| `/locale` | `app/locale/route.ts` | handler | MW | sets locale cookie |

## App routes (all wrap themselves in `<Shell>` unless noted)

| Route | File | Data pattern | Auth/RBAC touches | Notes |
|---|---|---|---|---|
| `/dashboard` | `dashboard/page.tsx` | server-RSC: **full-table loads** — visits, inspections, reviews, checklist_responses, violations, geo_events, factories (all rows, 1000-row pages) + audit_events follow-up + engine_settings | MW, PV, UR (page) + SH | `collect()` loops lines 34-44; audit chunking 50-66; DashboardTabs raw `<a>` (DashboardView.tsx:41-47) |
| `/field` | `field/page.tsx` | server-RSC: **rpc write** `expire_lapsed_visits` (line 57) + assignments + notifications | MW, PV + SH | client-side KPI aggregation (lines 89-106); charts custom SVG |
| `/field/[visitId]` | `field/[visitId]/page.tsx` + Startup.tsx | server-RSC + client poll | MW, PV + SH | Startup.tsx:180 `router.refresh()` every 15 s while override pending |
| `/field/inspection/[id]` | `field/inspection/[id]/page.tsx` | server-RSC: 23 queries; **unbounded** `inspection_items` (line 34) and `violation_codes`+penalty_mappings (line 38); per-photo signed URLs (lines 74-75) | MW, PV + SH | Workspace.tsx:165 8 s tick; FactoryVerification.tsx:163 8 s poll |
| `/field/factory-360` `[id]` | `field/factory-360/page.tsx`, `[id]/page.tsx` | server-RSC (dossier lib) | MW, PV + SH | dossier signs URLs per load (`lib/factory360/dossier.ts:230-234`) |
| `/visits` | `visits/page.tsx` | server-RSC: **rpc write** `expire_lapsed_visits` (line 30) + visits w/ 4 embeds, `count:"exact"` + inspector pool | MW + SH | raw `<a>` view switcher (lines 209-212); up to 1000 rows → VisitsBoard client comp (620 lines, non-virtualized) |
| `/visits/[id]` | `visits/[id]/page.tsx` | server-RSC: 4 queries + per-attachment signed URL (line 73) | MW, PV + SH | |
| `/visits/calendar` | `visits/calendar/page.tsx` | server-RSC | MW + SH | no loading.tsx |
| `/visits/map` | `visits/map/page.tsx` + VisitMap | server-RSC + dynamic GeoMap | MW + SH | no loading.tsx |
| `/visits/workload` | `visits/workload/page.tsx` | server-RSC | MW + SH | no loading.tsx |
| `/planning` | `planning/page.tsx` | server-RSC: roles + package gate + drafts exact count | MW, PV, UR + SH | no loading.tsx |
| `/planning/bulk` `/bulk/review` | `planning/bulk/page.tsx`, `bulk/review/page.tsx` | server-RSC + SPA-mutate | MW, PV, UR + SH | actions.ts has 4 user_roles touches |
| `/planning/single` | `planning/single/page.tsx` | server-RSC (UR ×2) | MW, PV, UR×2 + SH | GeoMap dynamic |
| `/planning/immediate` | `planning/immediate/page.tsx` | server-RSC (UR ×2) | MW, PV, UR×2 + SH | GeoMap dynamic |
| `/planning/plans` `[id]` | `planning/plans/page.tsx`, `plans/[id]/page.tsx` | server-RSC | MW, PV, UR + SH | |
| `/reviews` | `reviews/page.tsx` | server-RSC (UR) | MW, PV, UR + SH | |
| `/reviews/[id]` | `reviews/[id]/page.tsx` | server-RSC: 4 queries | MW, PV, UR + SH | VersionCompare polls 45 s (VersionCompare.tsx:6,88) |
| `/reviews/[id]/started` | `reviews/[id]/started/page.tsx` | server-RSC | MW, PV | no Shell |
| `/factories` | `factories/page.tsx` | server-RSC | MW + SH | |
| `/factories/[id]` | `factories/[id]/page.tsx` (625 lines) | server-RSC: 11 queries | MW, PV, UR + SH | FactorySpatialMap dynamic |
| `/factories/cr/[id]` | `factories/cr/[id]/page.tsx` | server-RSC | MW, PV + SH | |
| `/virtual` `[id]` | `virtual/page.tsx`, `virtual/[id]/page.tsx` | server-RSC + Room client | MW, PV + SH | Room.tsx router.refresh on actions |
| `/tasks` | `tasks/page.tsx` | server-RSC (UR) | MW, PV, UR + SH | |
| `/cases` `/committee` `/portal` | respective page.tsx | server-RSC, thin | MW + SH | no loading.tsx |
| `/enforcement` `/incident-reports` `/evidence-ocr` | respective page.tsx | server-RSC | MW, PV + SH | no loading.tsx |
| `/operations` | `operations/page.tsx` | server-RSC + Monitoring client poll 30 s (Monitoring.tsx:30,85) + signed URLs (line 261) | MW, PV + SH | OverrideQueue router.refresh after 1.2 s |
| `/operations/exceptions` | `operations/exceptions/page.tsx` | server-RSC | MW, PV + SH | no loading.tsx |
| `/operations/live` | `operations/live/page.tsx` + LiveMapInner | server-RSC + client map | MW, PV + SH | LiveMapInner.tsx:98 — 100 ms setTick (10 renders/s, cleaned up, reduced-motion gated) |
| `/ai/suggestions` | `ai/suggestions/page.tsx` | server-RSC | MW, PV + SH | no loading.tsx |
| `/profile` | `profile/page.tsx` | server-RSC (UR) | MW, PV, UR + SH | no loading.tsx |
| `/reports/inspection/[id]` | `reports/inspection/[id]/page.tsx` | server-RSC (print) | MW, PV | no Shell (print surface) |

## Admin routes (`/admin/*`, 24 pages)

All server-RSC, all `force-dynamic`. 8 subsections additionally wrap `AdminRouteBoundary` (extra PV + UR in a segment layout). Pages also do their own UR query → **3 user_roles round trips per admin navigation** (layout boundary + page + Shell).

| Route | Notable data pattern |
|---|---|
| `/admin` | 5 `count:"exact"` head queries incl. **audit_events** (admin/page.tsx:42-46) + UR (line 57) |
| `/admin/access` | user_roles exact count (line 14) |
| `/admin/audit` | audit_events listing |
| `/admin/regulations` `[id]` | server-RSC; `[id]` page has no Shell |
| `/admin/items` `[id]/runtime-preview` | layout boundary + page |
| `/admin/packages` | layout boundary + page |
| `/admin/violations` `/bulk-violations` | |
| `/admin/workflows` | task/sla actions with `count:"exact"` mutations |
| `/admin/risk` `/risk/models` | |
| `/admin/gis` `/gis/spatial` | GisStudio: GeoMap dynamic |
| `/admin/security-access` | user_roles full read + exact count |
| `/admin/compliance-requests` `[id]` `/new` | layout boundary |
| `/admin/compliance-approvals` | layout boundary |
| `/admin/devices` `/notifications` `/localization` `/operations` `/integrations` `/integrations/factory-data` `/audit` `/enforcement-recommendations` | server-RSC |

## API route handlers

| Route | File | Notes |
|---|---|---|
| `/api/shell/search` | `api/shell/search/route.ts` | **12 parallel `ilike '%q%'` queries** across 5 tables per search (lines 20-33); debounced 250 ms + AbortController client-side (ShellClient.tsx:134-160); no pg_trgm → seq scans |
| `/api/routing/eta` | `api/routing/eta/route.ts` | ETA proxy |
| `/api/field/factory-360/snapshot` | `api/field/factory-360/snapshot/route.ts` | field snapshot (`force-dynamic`) |
| `/locale`, `/signout` | route handlers | cookie/session |

## Middleware coverage

`middleware.ts:47` matcher covers **everything** except `_next/static`, `_next/image`, `favicon.ico` — so every RSC navigation fetch and every `/api/*` call runs `getClaims()` (local JWKS verify; network only on token refresh) plus login-locale cookie logic.
