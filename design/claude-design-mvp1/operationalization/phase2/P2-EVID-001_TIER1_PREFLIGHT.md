# P2-EVID-001.B — Tier-1 Runtime Persona and Data-Safety Preflight

## Environment

- Connected backend: `https://iiozvqntawxfwbgffzqu.supabase.co` — a real, shared
  remote Supabase project (the same one already certified for MVP1/MVP2/MVP3
  and used by the existing live Playwright e2e suite), **not a disposable
  local instance**. Treated with the same care as production per CLAUDE.md's
  do-not-mutate-production-data rule, even though its formal status is
  "preproduction certified."
- Dev server: a `next dev` process is already running locally (`apps/web`,
  Next.js 15) against the above backend.
- Personas: seeded test accounts exist in `apps/web/e2e/personas.ts`, sourced
  from `supabase/migrations/0011_factory360_gis_ksa_seed.sql` (e.g.
  `admin@mim.gov.sa`). These are the same accounts the existing live e2e
  suite already authenticates as against this same project.
- Tested commit: same working tree as the rest of this session
  (`setup/Inspection`, commit `1422127c2e113105b67a297f95398e3e91674e38`,
  worktree dirty — see DESIGN-OPS-001 for the exact dirty-file list; none of
  those changes touch the 5 Tier-1 routes below).

## Method

For each Tier-1 screen: read its `page.tsx` server component in full, trace
every data call it makes before any user interaction, and check whether any
of those calls is a write (`INSERT`/`UPDATE`/a mutating RPC) rather than a
`.select()` read. Cross-checked against the corresponding Supabase migration
that defines any RPC found, and against existing Playwright e2e specs that
already exercise the same route live, as precedent for what this project
already treats as an accepted read-only visit.

## Per-screen verdict

| Screen | Route | File | Auth requirement | On-load calls | Verdict |
|---|---|---|---|---|---|
| SCR-ADM-001 | `/admin` | `apps/web/src/app/admin/page.tsx` | Authenticated (any role; role affects display only) | 6 independent `.select()` reads (engine_settings, regulations, inspection_items, package_versions, violation_codes, audit_events, user_roles) — no RPC, no write | **SAFE_TO_VISIT_READ_ONLY** |
| SCR-WEB-130 | `/planning/immediate` | `apps/web/src/app/planning/immediate/page.tsx` | `isPlanner \|\| isInspector` (`role_key === "planner"/"inspector"`) | Reads only (factories, package_versions, user_roles, profiles) | **SAFE_TO_VISIT_READ_ONLY** (provided the Create/Dispatch button is never clicked) |
| SCR-WEB-200 | `/visits` | `apps/web/src/app/visits/page.tsx` (line 28) | Authenticated, RLS-scoped | `await sb.rpc("expire_lapsed_visits")` runs **unconditionally before rendering** — a real `UPDATE visits SET planning_status='expired'` plus `INSERT INTO notifications` for any published visit past its window with no inspection started (`supabase/migrations/0024_fix2_ops_planning_visits.sql`, `0025_scheduled_visit_expiry.sql`) | **BLOCKED — real workflow-status + notification mutation on GET** |
| SCR-WEB-210 | `/visits/:id` | `apps/web/src/app/visits/[id]/page.tsx` | Authenticated, RLS-scoped | Pure reads (visit detail, audit_events, visit_attachments + `createSignedUrl` storage read) — no RPC at all | **SAFE_TO_VISIT_READ_ONLY** |
| SCR-WEB-500 | `/operations` | `apps/web/src/app/operations/page.tsx` (line ~167) | Authenticated | `await sb.rpc("expire_stale_geo_override_requests")` runs **unconditionally before rendering** — a real `UPDATE geo_override_requests SET status='expired', decided_at=now()` for any pending row past `expires_at` (`supabase/migrations/20260716161605_ipad_geo_override_approval_workflow.sql`) | **BLOCKED — real workflow-status mutation on GET** |

## Precedent considered but not treated as sufficient authorization on its own

Existing Playwright specs (`cd-004-admin-control-plane-home.spec.ts`,
`persona-tours.spec.ts`, `cd-023-immediate-authority-bar.spec.ts`,
`cd-027-visit-detail.spec.ts`, `cd-026-visit-management.spec.ts`,
`dashboard-kpi-seed.spec.ts`) already navigate every one of these 5 routes
live against this same project, including the two BLOCKED ones — and the
`cd-026` suite explicitly disables parallelism "because journey specs
mutate shared live data," i.e. the project already accepts this exact
mutation as a known, bounded, already-occurring side effect of testing
`/visits`. That precedent is real, but this batch's own
`prohibited_actions` explicitly forbids `mutate_product_data_or_workflow_status`
for *this* evidence-capture work, and `validation_rule` requires labelling
any unsafe combination BLOCKED rather than reasoning it away by precedent.
The two BLOCKED screens above are therefore held to the stricter,
batch-specific rule, not the e2e suite's already-accepted tolerance.

## Capture readiness (per the 8 named capture profiles A-H)

All 8 profiles (locale × theme × viewport combinations) are equally
readiness-blocked or -cleared per screen — the mutation risk found is at the
route level, not per-profile, so:

- **SCR-ADM-001, SCR-WEB-130, SCR-WEB-210**: all 8 profiles A-H are capture-ready.
- **SCR-WEB-200, SCR-WEB-500**: all 8 profiles A-H are BLOCKED for every
  state until a change-control decision authorizes either (a) a capture
  method that bypasses the mutating RPC (e.g. a query-string/feature flag
  that skips it, if one exists — none found in this pass), or (b) accepting
  the mutation as in-tolerance for this shared project, matching the
  existing e2e suite's own accepted practice, with sponsor sign-off.

## What this preflight did NOT do

- Did not open a browser, log in, or navigate any route.
- Did not mutate any product data or workflow status.
- Did not capture any screenshot.
- Did not resolve the two BLOCKED screens' underlying tension between
  established e2e precedent and this batch's stricter no-mutation rule —
  that is a decision for Codex/sponsor, not this preflight.

## Recommendation

Proceed to P2-EVID-001.C (safe capture) for SCR-ADM-001, SCR-WEB-130 and
SCR-WEB-210 only. Do not attempt capture for SCR-WEB-200 or SCR-WEB-500
until the tension above is explicitly resolved by change control.
