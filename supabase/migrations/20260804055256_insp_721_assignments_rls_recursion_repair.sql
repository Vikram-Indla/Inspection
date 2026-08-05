-- INSP-721 forward repair: 20260804030000 exposed an assignments <-> visits
-- policy cycle. Resolve the visit/factory lookup behind a private, revoked
-- security-definer boundary while retaining the exact governed access model.

create or replace function private.assignment_read_in_governed_scope(
  p_visit_id uuid
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      public.has_internal_role('admin')
      or public.has_any_role(array['ops','reviewer','auditor'])
      or (
        public.planning_closure_has_explicit_capability('planning.view')
        and exists (
          select 1
          from public.visits v
          where v.id = p_visit_id
            and public.planning_closure_factory_in_scope(v.factory_id)
        )
      )
    );
$$;

revoke all on function private.assignment_read_in_governed_scope(uuid)
  from public, anon, authenticated, service_role;

drop policy if exists assignments_read on public.assignments;
create policy assignments_read on public.assignments
  for select to authenticated
  using (
    inspector_id = (select auth.uid())
    or private.assignment_read_in_governed_scope(visit_id)
  );
