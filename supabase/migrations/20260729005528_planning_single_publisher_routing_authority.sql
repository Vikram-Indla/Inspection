-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- The atomic Planner publisher must inspect eligible Inspector availability
-- across users. Keep its explicit Planner authorization checks, while letting
-- the function evaluate that routing query independently of caller RLS.
alter function public.publish_single_visit(
  uuid,
  uuid,
  uuid,
  text,
  public.execution_mode,
  timestamptz,
  timestamptz,
  text,
  boolean,
  numeric,
  numeric,
  text,
  uuid
) security definer;

alter function public.publish_single_visit(
  uuid,
  uuid,
  uuid,
  text,
  public.execution_mode,
  timestamptz,
  timestamptz,
  text,
  boolean,
  numeric,
  numeric,
  text,
  uuid
) set search_path = public, pg_temp;

revoke all on function public.publish_single_visit(
  uuid,
  uuid,
  uuid,
  text,
  public.execution_mode,
  timestamptz,
  timestamptz,
  text,
  boolean,
  numeric,
  numeric,
  text,
  uuid
) from public, anon;

grant execute on function public.publish_single_visit(
  uuid,
  uuid,
  uuid,
  text,
  public.execution_mode,
  timestamptz,
  timestamptz,
  text,
  boolean,
  numeric,
  numeric,
  text,
  uuid
) to authenticated;
