# Execution Module — Decision Log

- Task: TASK-EXECUTION-MODULE-001 (G11 Execution module canonical reconciliation)
- Authority: SAQEEL-EXE-CANONICAL-PLAN v1.0 (2026-07-21)
- Phase: 1 — shared contracts (migration `supabase/migrations/20260721090000_execution_canonical_contracts.sql`, `apps/web/src/lib/execution/*`)

## D-001 — Daily-cap counting semantics

- A visit counts against an inspector's daily cap when ALL of the following hold:
  - the visit is assigned to that inspector (`assignments.inspector_id`);
  - `visits.planning_status = 'published'`;
  - the Execution Date matches: `coalesce(visits.execution_date, visits.window_start::date) = p_date` (Pre-Execution-selected Execution Date wins; the window start is the fallback until one is selected);
  - the linked inspection has NOT reached submitted-or-later: `coalesce(inspections.lifecycle_status, 'new') NOT IN ('submitted','under_review','approved','rejected','cancelled')` — submitted-or-later counts as completed and frees capacity.
- Cancelled visits never count: cancellation sets `planning_status = 'cancelled'`, excluding the row by the first predicate.
- Cap default is 10 (business-supplied), Admin-configurable via `engine_settings.execution.settings.daily_visit_cap`; the RPC falls back to 10 when the setting is absent.
- One shared server-side calculation (`public.inspector_daily_capacity` RPC); Planning publish and Pre-Execution wire to the same service in later phases. Callers must be planner, ops, or the inspector themself; anything else raises `insufficient_privilege`.

## D-002 — Stored 'prepared' ≡ canonical 'Ready for Execution'

- The canonical Operational State vocabulary is `new → ready_for_execution → on_the_way → arrived → executing → submitted → under_review`; virtual visits skip `on_the_way`/`arrived`.
- The persisted enum keeps its existing values; the stored value `'prepared'` remains the persisted Ready-for-Execution marker until writers migrate. Projection happens read-side via `projectOperationalState` (`apps/web/src/lib/execution/state-machine.ts`).
- No destructive rewrite of stored values. The enum was extended additively with `'under_review'` only.
- Inspection lifecycle is likewise a backward-compatible projection: new `inspections.lifecycle_status` column (backfilled and trigger-synced from the legacy free-text `status`); the legacy column and all existing read paths are untouched. Planning visit status NEVER gains `approved`.

## D-003 — Capability model (capabilities, not new roles)

- Implemented as `capabilities` + `role_capabilities` seed tables (22 capability keys; default role mapping) plus the `public.has_capability` RPC (security definer, `set search_path = ''`).
- Legacy roles are untouched and act as compatibility aliases: guards evaluate capabilities; role→capability resolution goes through `role_capabilities`.
- Catalogue tables are RLS-enabled, SELECT-only for authenticated; no write policies for app roles in Phase 1 — the governed grant/revoke UI is a later phase.
- `apps/web/src/lib/execution/capabilities.ts` mirrors the seed mapping for UI affordance only; the server RPC + RLS remain authoritative, and menu visibility is never authorization.
