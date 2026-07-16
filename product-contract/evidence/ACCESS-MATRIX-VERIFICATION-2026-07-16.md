# Access Matrix Verification — MVP1 Web/Admin

- **Task:** TASK-G11-G12-RELEASE-001 (G11 hardening)
- **Date:** 2026-07-16
- **Scope:** Web + Admin channels. iPad/virtual noted, not re-verified here.
- **Requirements:** RBAC-001..014, MVP1-SEC-001..006, MVP1-FND-001..013
- **Screens:** AUTH-01..03, SCR-WEB-100..500, SCR-ADM-001..090
- **Method:** Static read of `apps/web/src` (nav, middleware, page guards, server
  actions) and `supabase/migrations` (RLS). No live DB query (Supabase MCP
  unauthenticated this session). Live GRANT confirmation is an open item.

## Identity & role model (verified in code)

- One named account → many `user_roles.role_key` rows (`Shell.tsx:20`). Native
  multi-role per human. Separate logins per responsibility are **not** required;
  the five UAT accounts are test personas, not a production identity model.
- Identity = verified JWT claim, `lib/verified-user.ts` (`getClaims`, no per-request Auth/user call).
- 11 role keys: business `planner, inspector, reviewer, ops, leadership`;
  admin `compliance_admin, form_admin, workflow_admin, security_admin, gis_admin, risk_owner`.

## Three enforcement layers (they diverge by design)

1. **Middleware** (`apps/web/middleware.ts`) — authentication only. No role check.
2. **Nav filter** (`lib/shell-navigation.ts` → `buildShellNavigation`) — cosmetic; hides menu items by role.
3. **Page guard** — inconsistent per route (table below): HARD redirect / SOFT in-shell block / none.
4. **RLS** — the real authorization boundary; verified per table below.

## Route × guard × RLS matrix

| Route | Nav visible to | Direct-URL page guard | Data exposure to a non-nav authenticated role |
|---|---|---|---|
| `/dashboard` | ops, leadership | HARD `redirect(/launch)` | none |
| `/planning` | planner | SOFT block | none |
| `/reviews` | reviewer | SOFT block (`reviewer`/`ops`) | none (RLS-scoped) |
| `/field` | inspector | auth-only redirect | own rows only (RLS) |
| `/visits` | planner, ops | none | RLS-scoped |
| `/operations` | ops, leadership | none | visits/geo scoped; factories + engine_settings authenticated-broad |
| `/factories` (F360) | planner,inspector,reviewer,ops,leadership | none | all factory master data (broad read — **by design**, business asked F360 for all non-admin) |
| `/admin/*` | specific admin role | none / role-scoped reads | config library RLS-scoped (authenticated read, admin write) |

## RLS verdict per table (from migrations)

**Correctly scoped:** `visits, geo_events, journey_sessions, virtual_sessions,
virtual_participants, reviews, inspections, checklist_responses, evidence,
findings, violations, submission_versions, audit_events, notifications,
assignments, visit_plans`.

**Authenticated-broad read (intended posture, blocks anon):** `factories` +
`factory_documents/representatives/products/materials`, `engine_settings`,
and the compliance library `regulations, regulation_clauses, inspection_items,
packages, package_versions, violation_codes, penalty_mappings` (enabled via the
`DO` loop at `0002_rbac_audit.sql:89-96`; authenticated read, `compliance_admin`/`form_admin` write).

## Gaps found and remediated

| # | Table | Gap | Severity | Fix |
|---|---|---|---|---|
| 1 | `config_versions` | `config_read/write/update` policies authored in `0002_rbac_audit.sql:84-88` but `enable row level security` was never called → policies **inert** → any authenticated (potentially anon) caller could read/insert/update workflow & engine config versions via PostgREST, bypassing the admin-only maker/checker path. | **P1 (integrity)** | `20260716120000_seco_config_versions_roles_rls.sql` enables RLS, activating existing policies. |
| 2 | `roles` (catalogue) | No RLS, no policies → role catalogue readable/tamperable via PostgREST. App only reads it; seed-managed. | **P3** | Same migration: enable RLS, authenticated read, no write policy (REST writes denied by default). |

- **Migration:** `supabase/migrations/20260716120000_seco_config_versions_roles_rls.sql` (forward-only, idempotent, no data mutation).
- **Contract/negative test:** `supabase/tests/0029_config_versions_roles_rls_probe.sql`.
- **Status:** ✅ **APPLIED + VERIFIED LIVE 2026-07-16** on project `iiozvqntawxfwbgffzqu` via Management API (`SUPABASE_ACCESS_TOKEN`, CLI-linked project).

### Apply + verify evidence (live)

| Check | config_versions | roles |
|---|---|---|
| Pre-state `relrowsecurity` | `false` (3 inert policies) | `false` (0 policies) |
| Post-state `relrowsecurity` | `true` | `true` |
| Post SELECT policies | 1 (`config_read`, authenticated) | 1 (`roles_read`, authenticated) |
| Post write policies | 2 (`config_write` INSERT + `config_update` UPDATE, admin-scoped) | 0 (REST writes denied) |

- Apply: Management API `POST /database/query` → **HTTP 201**.
- Contract probe `0029_...` executed live → **HTTP 201, no exception → PASS**.
- Security advisor `rls_disabled_in_public` → **CLEARED**, neither table flagged.

## Business-direction alignment (Dashboard / Ops / Factory 360 to all non-admin)

Resolved 2026-07-16 per business direction. Command destinations now share one
`BUSINESS_ROLE_KEYS` set (`planner, inspector, reviewer, ops, leadership`);
admin-only personas remain excluded.

- **Factory 360** — ✅ all 5 non-admin roles (already the case).
- **Dashboard** — ✅ widened: nav + hard route guard now admit all 5 non-admin roles (`shell-navigation.ts`, `dashboard/page.tsx`). Data stays RLS-scoped per persona.
- **Operations Center** — ✅ widened: nav admits all 5 non-admin roles. Page has no role guard; data RLS-scoped.
- Admin-no-leak verified: admin-family nav yields no `/dashboard` or `/operations`.
- Menu visibility ≠ authorization: each destination keeps its guard + RLS.

## Open items (not closable from static analysis)

1. Live-DB GRANT confirmation on the now-RLS'd tables (need authenticated Supabase session).
2. Guard-style inconsistency (redirect vs soft-block vs none) — cosmetic risk, auditor-facing.
3. iPad (SCR-IPAD-600..650) and virtual (SCR-VIR-700..720) channels not re-verified in this pass.
4. Pre-existing: `shell-navigation.spec.ts:18` admin-family href assertion is stale (expects 6, nav yields 9) — independent of this change.
