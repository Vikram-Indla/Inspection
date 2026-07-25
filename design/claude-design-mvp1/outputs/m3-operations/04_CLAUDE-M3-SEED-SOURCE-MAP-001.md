# CLAUDE-M3-SEED-SOURCE-MAP-001

Direction: M3-SPONSOR-DIRECTION-20260725, item (1) DATA.
Scope: every KPI displayed on `/operations` (WA-DES-033-C3 corrected design, package Revision 3). Traces each to its existing governed query/source in `apps/web/src/app/(app)/operations/page.tsx` — no formula invented, no schema/policy/provider change proposed.

## KPI → source trace (real code, this session's read)

| KPI (WA-SP-031) | Existing governed source | Seed requirement |
|---|---|---|
| Active Visits | `monitored.length` — visits where `planning_status = 'published'` OR `operational_state in (on_the_way, arrived, executing)`, region/city-scoped (`page.tsx` lines 383-386) | Seed real `visits` rows spanning published + each active operational_state, via real `assignments`/`profiles` personas, through canonical planning→publish transitions (no direct status write) |
| On the Way | `counts.on_the_way` — `visits.operational_state = 'on_the_way'` (line 376) | At least one visit driven to `on_the_way` via the real journey-start transition (not a raw UPDATE) |
| Executing | `counts.executing` — `visits.operational_state = 'executing'` (line 376) | At least one visit driven to `executing` via the real arrival→execution transition |
| Submitted Today | **NOT SEEDABLE YET** — package Revision 3 §3 established this KPI has no governed metric-grain contract (visits vs. inspections vs. submission_versions; first-submission vs. latest-resubmission; Riyadh day boundary). Seeding a number here would fabricate what the design correctly refuses to show. Do not seed a "Submitted Today" total until that contract is sponsor-approved (open decision, unchanged by this data-seeding direction). | **Blocked pending metric-grain decision** — seed only after that decision lands, then trace to whichever real column (`inspections.submitted_at` or `submission_versions.submitted_at`) the approved contract names |
| Active Alerts | **NOT A SINGLE SEEDABLE NUMBER** — package Revision 3 §3 established no taxonomy/dedup rule exists. The four supporting-context counts underneath the card ARE real and traceable: SLA breaches → `computeSlaFlags()` over `visits.window_start/window_end` vs `engine_settings.sla` (lines 128-161, 400); Corrective actions overdue → `action_forms` where `due_at < now()` and `status != 'closed'` (lines 191-196, 714-715); Notifications failed → `notifications.delivery_state = 'failed'` (lines 197-201); Overrides pending → `geo_override_requests.status = 'pending'` (lines 218-221) | Seed each of the four source tables independently with real, governed-transition data (do not seed a combined "alerts" total anywhere — none exists in code) |

## Seeder approach

Extend `apps/web/scripts/seed-dashboard-kpis.mjs`'s existing pattern (already used for `/dashboard`'s SCR-WEB-500 fixtures): persona-authenticated PostgREST calls only (`planner@mim.gov.sa`, `inspector@mim.gov.sa`, `ops@mim.gov.sa` — same accounts, no service key, no client-embedded privileged credential), deterministic UUIDs in the same `f7000000.../a7000000.../b7000000...` id-block style already in the script, idempotent (safe to re-run), and every insert goes through the real API path so RLS, foreign keys, and audit triggers fire exactly as in production use — never a direct `UPDATE ... SET operational_state` bypassing the journey/execution transition functions.

Explicit non-goals per sponsor direction: no schema change, no policy change, no provider enablement, no invented formula for the two blocked KPIs, no privileged key in client code (the script already reads only `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`, confirmed this session).

## Disposition

Ready as the seed-source trace. Data write lease itself is a separate, Codex-issued authorization — this document is the prerequisite trace, not the write.
