-- A bulk plan has one supervision request per visit. Its aggregate status must
-- never jump to published because only the first row was approved, and a
-- return/rejection on one row must not erase a different released visit.

create or replace function public.sync_supervision_plan_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.planning_status;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select case
    when exists(
      select 1 from public.planning_supervision_requests r
      where r.visit_plan_id = new.visit_plan_id and r.status = 'pending'
    ) then 'pending_supervision'::public.planning_status
    when exists(
      select 1 from public.planning_supervision_requests r
      where r.visit_plan_id = new.visit_plan_id and r.status = 'approved'
    ) then 'published'::public.planning_status
    when exists(
      select 1 from public.planning_supervision_requests r
      where r.visit_plan_id = new.visit_plan_id and r.status = 'returned'
    ) then 'returned'::public.planning_status
    else 'cancelled'::public.planning_status
  end into v_status;

  update public.visit_plans
  set status = v_status,
      published_at = case
        when v_status = 'published'::public.planning_status then coalesce(published_at, now())
        else published_at
      end
  where id = new.visit_plan_id;
  return new;
end $$;

drop trigger if exists planning_supervision_plan_status_sync on public.planning_supervision_requests;
create trigger planning_supervision_plan_status_sync
after update of status on public.planning_supervision_requests
for each row execute function public.sync_supervision_plan_status();
