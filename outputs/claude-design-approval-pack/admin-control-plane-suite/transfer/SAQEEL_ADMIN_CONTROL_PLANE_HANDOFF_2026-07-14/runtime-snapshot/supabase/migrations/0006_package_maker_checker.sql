-- Package versions get maker-checker identity (RBAC-002: cannot publish own draft)
alter table package_versions
  add column if not exists created_by uuid references profiles(user_id),
  add column if not exists approved_by uuid references profiles(user_id);
alter table package_versions
  add constraint pkg_maker_checker check (approved_by is null or approved_by <> created_by);
-- Publishing requires an approver: status may become published only with approved_by set
create or replace function guard_publish_requires_approver() returns trigger language plpgsql as $$
begin
  if new.status in ('published','locked') and new.approved_by is null then
    raise exception 'BLOCKED: publishing requires a distinct approver (RBAC-002 maker-checker)';
  end if;
  return new;
end $$;
create trigger trg_pkg_approver before insert or update on package_versions
  for each row execute function guard_publish_requires_approver();
