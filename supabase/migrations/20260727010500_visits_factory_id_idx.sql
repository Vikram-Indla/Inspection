-- TASK-RLS-INITPLAN-WRAP-20260727 (part 2)
-- Two targeted fixes behind the same field-dashboard timeout.
--
-- 1. inspects_same_factory() self-joins visits on factory_id, and no index on
--    visits.factory_id existed -- the join fell back to a scan of all 1491
--    visits on every call. The function is called per row by the
--    inspections_read_prior_approved policy.
--
-- 2. The same function calls auth.uid() bare, while its two siblings
--    (has_any_role, is_assigned_inspector) already use the (select auth.uid())
--    form that makes it an InitPlan. Same value, evaluated once instead of
--    once per row. Behaviour is unchanged: auth.uid() is STABLE.

begin;

create index if not exists visits_factory_id_idx
  on public.visits using btree (factory_id);

create or replace function public.inspects_same_factory(v uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from visits target
    join visits mine on mine.factory_id = target.factory_id
    join assignments a on a.visit_id = mine.id
    where target.id = v
      and a.inspector_id = (select auth.uid()))
$function$;

commit;
