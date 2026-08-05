-- CC-VISIT-CLOSED-STATE-20260805 (part 2 — trigger)
--
-- Moves a visit's operational_state to the new 'closed' terminal value the
-- moment its inspection's status transitions into 'approved'. Fires only on
-- that transition (guarded by OLD.status is distinct from 'approved'), so a
-- no-op update to an already-approved inspection does not re-fire it.
--
-- Deliberately a trigger on public.inspections, not an edit inside
-- public.decide_review() — that function is the verified atomic decision
-- commit (reviews.status, inspections.status, notification, audit_event)
-- and stays byte-identical. Any future path that sets inspections.status =
-- 'approved' closes the visit the same way, without needing to know about
-- this rule.
--
-- Scope is approval only, exactly as ruled. A returned or rejected
-- inspection does not move the visit anywhere here — that is explicitly
-- open and not covered by this ruling.

create or replace function private.close_visit_on_inspection_approved()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update public.visits
       set operational_state = 'closed'
     where id = new.visit_id
       and operational_state is distinct from 'closed';
  end if;
  return new;
end $$;

drop trigger if exists trg_close_visit_on_inspection_approved on public.inspections;
create trigger trg_close_visit_on_inspection_approved
  after update on public.inspections
  for each row
  execute function private.close_visit_on_inspection_approved();
