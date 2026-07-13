-- CD-023 / M01-048 / M01-050
-- Serialize assignment writes per Inspector and reject overlapping active
-- Visit windows. The create_immediate_visit RPC already checks availability,
-- but a check without a lock permits two different concurrent requests to
-- observe the same Inspector as free. This trigger is the write-time guard.

create or replace function private.guard_assignment_window_overlap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_visit public.visits%rowtype;
begin
  select * into v_visit
    from public.visits
   where id = new.visit_id;

  if not found then
    raise foreign_key_violation using message = 'assignment visit is unavailable';
  end if;

  -- A transaction-scoped, Inspector-specific lock closes the gap between an
  -- availability read and the assignment write. All callers use the same
  -- guard because it is attached to the canonical assignments table.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('assignment-inspector:' || new.inspector_id::text, 0)
  );

  if v_visit.planning_status in ('draft', 'published', 'returned')
     and v_visit.window_start < v_visit.window_end
     and exists (
       select 1
         from public.assignments a
         join public.visits existing_visit on existing_visit.id = a.visit_id
        where a.inspector_id = new.inspector_id
          and a.visit_id <> new.visit_id
          and existing_visit.planning_status in ('draft', 'published', 'returned')
          and existing_visit.window_start < v_visit.window_end
          and existing_visit.window_end > v_visit.window_start
     ) then
    -- create_immediate_visit handles unique_violation as the governed,
    -- audited concurrent_conflict result; no provider/schema detail escapes.
    -- SQLSTATE 23505 is used here as the RPC's existing concurrency signal.
    raise unique_violation using message = 'inspector window is no longer available';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_assignment_window_overlap() from public;

drop trigger if exists trg_guard_assignment_window_overlap on public.assignments;
create trigger trg_guard_assignment_window_overlap
before insert or update of inspector_id, visit_id on public.assignments
for each row execute function private.guard_assignment_window_overlap();

comment on function private.guard_assignment_window_overlap() is
  'CD-023 canonical write-time guard: serialize per Inspector and reject overlapping active Visit assignments.';
