-- REQ-010 · Optional zero-many packages with atomic immutable snapshots
-- Publishing inserts every selected package link and snapshot inside
-- publish_single_visit_atomic. Once captured, neither the link nor its
-- snapshot may be updated or deleted.

create or replace function public.guard_visit_package_snapshot_immutable()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'IMMUTABLE: visit package snapshots cannot be changed'
    using errcode = '55000';
end;
$$;

revoke all on function public.guard_visit_package_snapshot_immutable()
  from public,anon,authenticated,service_role;

drop trigger if exists trg_guard_visit_package_snapshot_immutable
  on public.visit_packages;
create trigger trg_guard_visit_package_snapshot_immutable
before update or delete on public.visit_packages
for each row execute function public.guard_visit_package_snapshot_immutable();

revoke update,delete,truncate on public.visit_packages
  from public,anon,authenticated,service_role;
