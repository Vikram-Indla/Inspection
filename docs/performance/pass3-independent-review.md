# Pass 3 — Independent Performance Review (Claude Code)

Task: `TASK-G11-REMEDIATION-PERFORMANCE-001` · Gate G11 Hardening.
Scope: independent verification of Pass 1 (Codex baseline) + Pass 2 (Kimi post-mortem), a Pass-3 ranked remediation plan, and the measurement method for before/after. No functional requirement, field, permission, state, audit event, or a11y behaviour is weakened. Production-build measurement only. No invented budgets/SLAs beyond §9.

## 1. Confirmed diagnosis (independently verified against code)

The measured lag is **server render time + request waterfalls**, not client bundle (P0-register row 1 already retired the bundle theory: prod First Load JS 103–197 KB). Baseline headline: **login→/dashboard chain median 10.4 s (p95 12.8 s); /dashboard cold 9.0 s**; every other route sits at a **2–3 s floor with warm ≈ cold** (no client-nav advantage).

Verified root causes (file:line checked this pass):

| ID | Confirmed | Evidence |
|---|---|---|
| K-001 no persistent app shell | ✓ | `app/layout.tsx:9` renders only `{children}`+PwaRegister; **75** files render `<Shell>` inside the page; `Shell.tsx:5-6` does `useT()`+`supabaseServer()`+`getServerUser()`+`user_roles`+`factories` region scan every nav, then client `ShellClient`/`NotificationBell` remount |
| K-002 `force-dynamic` everywhere | ✓ | **69** pages export it → full Route Cache never applies |
| K-003 dashboard loads entire dataset | ✓ | `dashboard/page.tsx` `collect()` pages ALL rows (pageSize 1000 loop) of 7 tables + audit chunks; no date filter pushed to DB; awaits everything before render → 10.6 s document request for 18 KB |
| K-004 duplicated auth+RBAC round trips | ✓ | middleware `getClaims()` → page `getVerifiedUser` (React-cached, good) → page `user_roles` → Shell repeats `user_roles` → admin adds 3rd via `AdminRouteBoundary`; ≥2× roles + region scan before page data |
| K-013 missing hot-column indexes | ✓ (static) | `0001_foundation.sql` PK-only; no index on `visits(window_start)`, `checklist_responses(inspection_id)`, `violations(inspection_id)`, `factories(region)`, `assignments(inspector_id)` — all on hot paths (EXPLAIN pending) |
| K-014 RLS initplan / per-row `auth.uid()` | ✓ (static) | `has_role`/`has_any_role` call bare `auth.uid()`; only 2 policies initplan-fixed; function-level wrap `(select auth.uid())` fixes all |

Not chased (Kimi verified absent, re-confirmed plausible): no React contexts/zustand/redux/react-query, no `select('*')`, no realtime dup, no timer leaks. Prior programme claims corrected: **no 3D hero / no dashboard hero exists** (P0-41/42 N/A).

## 2. Pass-3 remediation sequence (impact × risk, lowest-risk first)

Ordered so each step is independently shippable, measurable, and reversible. Auth/RLS/RBAC/a11y invariants preserved throughout.

**Tier A — low risk, mechanical, high aggregate value**
1. **K-013 indexes** — one additive migration, `CREATE INDEX CONCURRENTLY` on the hot filter/sort/join columns. Prove each with EXPLAIN before/after. (Backend; no behaviour change.)
2. **K-014 RLS initplan** — wrap `auth.uid()` as `(select auth.uid())` inside `has_role`/`has_any_role`/`is_assigned_inspector`. Precedent: `0029`, `20260719040000`. Identical result set, per-row → per-statement eval. (No isolation change.)
3. **K-006/K-007 raw `<a>`/`window.location` → `next/link`/`router`** — FieldTabs, VisitsBoard view switcher, DashboardView tab, ShellClient scope/account, FieldHome. Eliminates full-document reloads on hottest controls. (signout stays hard nav.)
4. **K-009 remove redundant `expire_lapsed_visits` RPC from `/visits` + `/field` read paths** — pg_cron `0025` already runs it; drop the write-on-read. (Verify cron cadence first.)
5. **K-017 `loading.tsx`** — add skeletons on the ~30 uncovered routes. **Perceived-only; §3.4 forbids using it to hide un-eliminated work** — applied only alongside the real fixes above.

**Tier B — medium risk, largest single wins**
6. **K-001 persistent app shell** — move `<Shell>` into a shared route-group layout `app/(app)/layout.tsx`; fetch nav/role/region once; page-provided header slot. Removes per-nav 2 DB queries + dict + client remount across all app routes. Guard: keep exact RBAC nav visibility; verify light/dark + iPad.
7. **K-004 role fetch once + cache** — `unstable_cache` keyed on user id, tag-invalidated on role change; documented staleness window (RBAC revocation is a deliberate decision, not an assumption).
8. **K-002 drop `force-dynamic`** where a page has no per-request-uncacheable dependency; tag-revalidate after mutations.

**Tier C — targeted heavy routes**
9. **K-003 dashboard** — push aggregation to SQL/RPC (grouped counts with RLS parity), bound by existing `from`/`to` window, stream sections via `<Suspense>`. Highest value, highest risk (metrics correctness + RLS parity in RPC) → dedicated measured slice, last.
10. **K-015 inspection workspace** — scope `inspection_items` to the visit's `package_version_id`; scope `violation_codes`/`penalty_mappings` to referenced violations; cache signed URLs (K-016).
11. **K-011 global search** — consolidate 12 leading-wildcard `ilike` into one RPC or add `pg_trgm`/tsvector indexes.

## 3. Measurement (before/after)

Reuse the Pass-1 harness `apps/web/e2e/perf/benchmark.mjs` (production `next start`, live Supabase, 5 personas, cold ≥5 / warm ≥10, median/p75/p95). Baseline of record: `docs/performance/results/baseline.json` + `route-results-baseline.csv` (145 runs). Each remediation records a delta run into `results/` and a before/after row; §9 targets are the pass/fail. EXPLAIN (analyze) captured for every DB/index change. iPad portrait/landscape + throttled network (baseline gaps) added for Tier B/C.

## 4. Open blocker before remediation commits
Pass-3 commit base is ambiguous: main checkout is on `improved` (`26e7497`, 12 ahead of `perf/p0-navigation-remediation` `dd0f3e8`); the Pass-2 review + p0-register are on `improved`/untracked, not on the perf branch. The correct base for Pass-3 remediation commits must be confirmed before any code lands.
