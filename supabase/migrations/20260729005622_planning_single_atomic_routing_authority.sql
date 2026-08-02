-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- The atomic wrapper must read and enrich the visit it has just created.
-- It retains the underlying Planner capability checks and exposes no direct
-- table access to callers.
alter function public.publish_single_visit_atomic(
  uuid, uuid[], uuid, text, public.execution_mode, timestamptz, timestamptz,
  text, boolean, numeric, numeric, text, jsonb, text, uuid
) security definer;

alter function public.publish_single_visit_atomic(
  uuid, uuid[], uuid, text, public.execution_mode, timestamptz, timestamptz,
  text, boolean, numeric, numeric, text, jsonb, text, uuid
) set search_path = public, pg_temp;

revoke all on function public.publish_single_visit_atomic(
  uuid, uuid[], uuid, text, public.execution_mode, timestamptz, timestamptz,
  text, boolean, numeric, numeric, text, jsonb, text, uuid
) from public, anon;

grant execute on function public.publish_single_visit_atomic(
  uuid, uuid[], uuid, text, public.execution_mode, timestamptz, timestamptz,
  text, boolean, numeric, numeric, text, jsonb, text, uuid
) to authenticated;
