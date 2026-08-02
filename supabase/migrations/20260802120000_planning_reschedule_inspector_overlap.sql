-- TASK-PLANNING-RESCHEDULE-INTEGRITY-001
-- Preserve the closure RPC as the single atomic mutation boundary while making
-- its reschedule path honor the canonical Inspector-window invariant.
do $migration$
declare
  v_signature regprocedure :=
    'public.mutate_planning_window_atomic(uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid)'::regprocedure;
  v_definition text := pg_get_functiondef(v_signature);
  v_anchor text := $anchor$    if p_operation='reschedule'
       and p_window_start=v_visit.window_start and p_window_end=v_visit.window_end then
      raise exception using errcode = '22023', message = 'PLANNING-RESCHEDULE-NO-WINDOW-CHANGE';
    end if;
$anchor$;
  v_guard text := $guard$
    if p_operation='reschedule' then
      -- The assignment trigger and post-publication mutation RPC use this
      -- exact lock namespace. Ordered acquisition avoids a bulk deadlock.
      perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
          'assignment-inspector:' || a.inspector_id::text, 0
        )
      )
      from (
        select distinct assignment.inspector_id
        from public.assignments assignment
        where assignment.visit_id=any(v_ids)
          and assignment.status in ('assigned','preparing','ready')
        order by assignment.inspector_id
      ) a;

      if exists (
        select 1
        from public.assignments selected_assignment
        join public.assignments other_assignment
          on other_assignment.inspector_id=selected_assignment.inspector_id
         and other_assignment.visit_id<>v_visit.id
         and other_assignment.status in ('assigned','preparing','ready')
        join public.visits other_visit
          on other_visit.id=other_assignment.visit_id
        where selected_assignment.visit_id=v_visit.id
          and selected_assignment.status in ('assigned','preparing','ready')
          and other_visit.planning_status in ('draft','published','returned')
          and other_visit.window_start<p_window_end
          and other_visit.window_end>p_window_start
      ) then
        raise exception using errcode = '23505',
          message = 'PLANNING-RESCHEDULE-CONFLICT';
      end if;
    end if;
$guard$;
begin
  if position('PLANNING-RESCHEDULE-CONFLICT' in v_definition)>0 then
    return;
  end if;
  if position(v_anchor in v_definition)=0 then
    raise exception using errcode='55000',
      message='PLANNING-RESCHEDULE-GUARD-PREDECESSOR-MISMATCH';
  end if;
  v_definition:=replace(v_definition,v_anchor,v_anchor||v_guard);
  execute v_definition;
end
$migration$;

comment on function public.mutate_planning_window_atomic(
  uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid
) is 'Atomic Planning cancel/reschedule boundary; reschedules serialize per assigned Inspector and reject active Visit-window overlap (TASK-PLANNING-RESCHEDULE-INTEGRITY-001).';
