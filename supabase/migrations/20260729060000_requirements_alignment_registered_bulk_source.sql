-- REQ-006 / RB-SI-001 / RB-SI-002 / RB-BP-001 / RB-BP-002
-- Bulk Planning may target registered factories only. The application filters
-- its catalog through industrial_licenses; this trigger is the authoritative
-- transaction-bound guard against forged or stale factory ids.

create or replace function public.guard_bulk_visit_registered_source()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
set row_security = off
as $$
begin
  if exists (
    select 1
    from public.visit_plans vp
    where vp.id = new.visit_plan_id
      and vp.method = 'bulk'
  ) and not exists (
    select 1
    from public.factories f
    join public.industrial_licenses il on il.factory_id = f.id
    join public.commercial_registrations cr on cr.id = il.commercial_registration_id
    where f.id = new.factory_id
      and not f.is_temporary
      and nullif(btrim(il.license_number), '') is not null
      and nullif(btrim(cr.cr_number), '') is not null
  ) then
    raise exception 'PLANNING-BULK-REGISTERED-SOURCE-REQUIRED'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_bulk_visit_registered_source() from public, anon, authenticated;

drop trigger if exists trg_guard_bulk_visit_registered_source on public.visits;
create trigger trg_guard_bulk_visit_registered_source
before insert on public.visits
for each row execute function public.guard_bulk_visit_registered_source();

drop policy if exists requirements_alignment_bulk_registered_source_read
  on public.industrial_licenses;
create policy requirements_alignment_bulk_registered_source_read
on public.industrial_licenses
for select
to authenticated
using (
  auth.uid() is not null
  and public.has_planning_capability('planning.create.bulk')
);
