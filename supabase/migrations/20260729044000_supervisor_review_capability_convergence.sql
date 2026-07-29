-- PLN-012 / REQ-002 / ACT-004
--
-- Converge the Level 2 review surface on canonical capabilities while
-- retaining legacy reviewer/ops compatibility. No review, inspection,
-- submission, account, role assignment, or audit row is changed.

drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select using (
  reviewer_id = (select auth.uid())
  or (select public.has_any_role(array['reviewer','auditor','ops','leadership']))
  or (select public.has_capability('review.view'))
  or exists (
    select 1
    from public.inspections i
    where i.id = reviews.inspection_id
      and public.is_assigned_inspector(i.visit_id)
  )
);

drop policy if exists inspections_read on public.inspections;
create policy inspections_read on public.inspections for select using (
  public.is_assigned_inspector(visit_id)
  or (select public.has_any_role(array['reviewer','auditor','ops','planner','leadership']))
  or (select public.has_capability('review.view'))
  or (status = 'approved' and public.inspects_same_factory(visit_id))
);

do $$
declare
  v_signature regprocedure;
  v_definition text;
  v_prior text :=
    'if v_actor is null or not public.has_any_role(array[''reviewer'',''ops'']) then';
  v_canonical text :=
    'if v_actor is null or not (public.has_any_role(array[''reviewer'',''ops'']) or public.has_capability(''review.decide'')) then';
begin
  foreach v_signature in array array[
    'public.start_review(uuid,uuid)'::regprocedure,
    'public.decide_review(uuid,text,text,jsonb)'::regprocedure
  ] loop
    select pg_get_functiondef(v_signature) into v_definition;
    if strpos(v_definition, v_prior) > 0 then
      v_definition := replace(v_definition, v_prior, v_canonical);
      execute v_definition;
    elsif strpos(v_definition, v_canonical) = 0 then
      raise exception 'PLN-012: expected legacy review guard missing from %',
        v_signature;
    end if;
  end loop;
end
$$;
