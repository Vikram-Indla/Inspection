-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- Normal planned visits inherit their coordinates from the external factory
-- master.  Planner-provided coordinates are rejected at the database boundary
-- as well as omitted by the UI/server action.  Immediate/manual workflows
-- (which have no visit_plan_id) retain their separately-governed path.

create or replace function public.guard_planned_visit_external_location()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.visit_plan_id is not null
     and (new.planner_lat is not null or new.planner_lng is not null) then
    raise exception using
      errcode = '42501',
      message = 'PLANNER_COORDINATE_OVERRIDE_FORBIDDEN';
  end if;
  return new;
end;
$$

drop trigger if exists planned_visit_external_location_guard on public.visits

create trigger planned_visit_external_location_guard
  before insert or update of visit_plan_id, planner_lat, planner_lng
  on public.visits
  for each row execute function public.guard_planned_visit_external_location()
