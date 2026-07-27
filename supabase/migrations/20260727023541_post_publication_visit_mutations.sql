-- ---------------------------------------------------------------------------
-- 6. Post-publication Planning mutations.
-- CR-032/033/059/063/083..086 · WA-AC-0032/0033/0059/0063/0083..0086
-- ---------------------------------------------------------------------------
create table if not exists public.planning_visit_mutation_receipts (
  id uuid primary key default gen_random_uuid(),
  actor uuid not null references public.profiles(user_id),
  idempotency_key text not null,
  correlation_id uuid not null,
  operation text not null check (
    operation in ('reschedule','reassign','cancel','edit')
  ),
  request jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  unique(actor, idempotency_key)
);
alter table public.planning_visit_mutation_receipts enable row level security;
revoke all on public.planning_visit_mutation_receipts
  from public, anon, authenticated;

create or replace function public.mutate_published_visits_atomic(
  p_visit_ids uuid[],
  p_operation text,
  p_changes jsonb,
  p_reason text,
  p_idempotency_key text,
  p_correlation_id uuid default gen_random_uuid()
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_ids uuid[];
  v_count integer;
  v_plan uuid;
  v_request jsonb;
  v_existing public.planning_visit_mutation_receipts%rowtype;
  v_result jsonb;
  v_new_inspector uuid;
  v_start timestamptz;
  v_end timestamptz;
  v_visit_type text;
  v_notes text;
  v_visit record;
  v_old_assignments jsonb;
begin
  if v_actor is null then
    raise insufficient_privilege using message = 'PLANNING-MUTATION-DENIED';
  end if;
  if p_operation not in ('reschedule','reassign','cancel','edit') then
    raise invalid_parameter_value using message = 'PLANNING-MUTATION-OPERATION';
  end if;
  if (p_operation = 'reschedule'
      and not public.has_planning_capability('planning.reschedule'))
     or (p_operation = 'reassign'
      and not public.has_planning_capability('planning.reassign'))
     or (p_operation = 'cancel'
      and not public.has_planning_capability('planning.cancel'))
     or (p_operation = 'edit'
      and not public.has_planning_capability('planning.manage')) then
    raise insufficient_privilege using message = 'PLANNING-MUTATION-DENIED';
  end if;
  if p_changes is null or jsonb_typeof(p_changes) <> 'object'
     or nullif(btrim(p_reason), '') is null
     or nullif(btrim(p_idempotency_key), '') is null
     or p_correlation_id is null then
    raise invalid_parameter_value using message = 'PLANNING-MUTATION-REQUEST';
  end if;

  select array_agg(distinct id order by id)
    into v_ids
  from unnest(coalesce(p_visit_ids, '{}'::uuid[])) id;
  if coalesce(cardinality(v_ids), 0) = 0 then
    raise invalid_parameter_value using message = 'PLANNING-MUTATION-TARGETS';
  end if;
  v_request := jsonb_build_object(
    'visit_ids', to_jsonb(v_ids),
    'operation', p_operation,
    'changes', p_changes,
    'reason', btrim(p_reason)
  );

  -- Serialize retries for the same actor/key before inspecting the receipt.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'planning-mutation:' || v_actor::text || ':' || btrim(p_idempotency_key),
      0
    )
  );
  select * into v_existing
  from public.planning_visit_mutation_receipts
  where actor = v_actor and idempotency_key = btrim(p_idempotency_key);
  if found then
    if v_existing.request is distinct from v_request then
      raise unique_violation using message = 'PLANNING-MUTATION-IDEMPOTENCY-REUSE';
    end if;
    return v_existing.result || jsonb_build_object('idempotent', true);
  end if;

  -- UUID ordering gives every concurrent bulk command the same lock order.
  perform 1 from public.visits v
  where v.id = any(v_ids)
  order by v.id
  for update;
  get diagnostics v_count = row_count;
  if v_count <> cardinality(v_ids) then
    raise no_data_found using message = 'PLANNING-MUTATION-TARGET-NOT-FOUND';
  end if;

  select
    (array_agg(distinct v.visit_plan_id))[1],
    count(distinct v.visit_plan_id)
    into v_plan, v_count
  from public.visits v where v.id = any(v_ids);
  if v_plan is null or v_count <> 1 or exists (
    select 1 from public.visits v
    where v.id = any(v_ids) and v.visit_plan_id is null
  ) then
    raise check_violation using message = 'PLANNING-MUTATION-SAME-PLAN';
  end if;
  if exists (
    select 1 from public.visits v
    left join public.inspections i on i.visit_id = v.id
    where v.id = any(v_ids)
      and (
        v.planning_status not in ('published','returned')
        or v.operational_state <> 'new'
        or i.started_at is not null
      )
  ) then
    raise check_violation using message = 'PLANNING-MUTATION-STATE';
  end if;

  if p_operation = 'reschedule' then
    if p_changes - array['window_start','window_end'] <> '{}'::jsonb
       or not (p_changes ?& array['window_start','window_end']) then
      raise invalid_parameter_value using message = 'PLANNING-RESCHEDULE-FIELDS';
    end if;
    begin
      v_start := (p_changes->>'window_start')::timestamptz;
      v_end := (p_changes->>'window_end')::timestamptz;
    exception when others then
      raise invalid_parameter_value using message = 'PLANNING-RESCHEDULE-WINDOW';
    end;
    if v_start is null or v_end is null or v_start >= v_end then
      raise invalid_parameter_value using message = 'PLANNING-RESCHEDULE-WINDOW';
    end if;

    -- Serialize every affected Inspector before checking the new window.
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        'assignment-inspector:' || a.inspector_id::text, 0
      )
    )
    from (
      select distinct inspector_id from public.assignments
      where visit_id = any(v_ids) order by inspector_id
    ) a;
    if exists (
      select 1
      from public.assignments selected_assignment
      join public.assignments other_assignment
        on other_assignment.inspector_id = selected_assignment.inspector_id
       and other_assignment.visit_id <> selected_assignment.visit_id
      join public.visits other_visit on other_visit.id = other_assignment.visit_id
      where selected_assignment.visit_id = any(v_ids)
        and other_visit.planning_status in ('draft','published','returned')
        and other_visit.window_start < v_end
        and other_visit.window_end > v_start
    ) then
      raise unique_violation using message = 'PLANNING-RESCHEDULE-CONFLICT';
    end if;
  elsif p_operation = 'reassign' then
    if p_changes - 'inspector_id' <> '{}'::jsonb
       or nullif(p_changes->>'inspector_id', '') is null then
      raise invalid_parameter_value using message = 'PLANNING-REASSIGN-FIELDS';
    end if;
    begin
      v_new_inspector := (p_changes->>'inspector_id')::uuid;
    exception when others then
      raise invalid_parameter_value using message = 'PLANNING-REASSIGN-INSPECTOR';
    end;
    if not exists (
      select 1 from public.user_roles ur
      where ur.user_id = v_new_inspector and ur.role_key = 'inspector'
    ) then
      raise check_violation using message = 'PLANNING-REASSIGN-INSPECTOR';
    end if;
    if exists (
      select 1 from public.assignments a
      where a.visit_id = any(v_ids)
      group by a.visit_id
      having count(*) > 1
    ) then
      raise check_violation using message = 'PLANNING-REASSIGN-AMBIGUOUS';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        'assignment-inspector:' || v_new_inspector::text, 0
      )
    );
    if exists (
      select 1
      from public.visits selected_visit
      join public.assignments other_assignment
        on other_assignment.inspector_id = v_new_inspector
      join public.visits other_visit
        on other_visit.id = other_assignment.visit_id
      where selected_visit.id = any(v_ids)
        and other_visit.id <> selected_visit.id
        and other_visit.planning_status in ('draft','published','returned')
        and other_visit.window_start < selected_visit.window_end
        and other_visit.window_end > selected_visit.window_start
    ) or exists (
      select 1
      from public.visits left_target
      join public.visits right_target
        on right_target.id = any(v_ids)
       and right_target.id > left_target.id
      where left_target.id = any(v_ids)
        and left_target.window_start < right_target.window_end
        and left_target.window_end > right_target.window_start
    ) then
      raise unique_violation using message = 'PLANNING-REASSIGN-CONFLICT';
    end if;
  elsif p_operation = 'cancel' then
    if p_changes <> '{}'::jsonb then
      raise invalid_parameter_value using message = 'PLANNING-CANCEL-FIELDS';
    end if;
    if not exists (
      select 1 from public.planning_lookups l
      where l.kind = 'cancellation_reason'
        and l.key = btrim(p_reason)
        and l.is_active
    ) then
      raise check_violation using message = 'PLANNING-CANCEL-REASON';
    end if;
  else
    if p_changes = '{}'::jsonb
       or p_changes - array['visit_type','notes'] <> '{}'::jsonb then
      raise invalid_parameter_value using message = 'PLANNING-EDIT-FIELDS';
    end if;
    v_visit_type := nullif(btrim(p_changes->>'visit_type'), '');
    v_notes := case when p_changes ? 'notes'
      then nullif(btrim(p_changes->>'notes'), '') else null end;
    if p_changes ? 'visit_type' and (
      v_visit_type is null or not exists (
        select 1 from public.planning_lookups l
        where l.kind = 'visit_type'
          and l.key = v_visit_type
          and l.is_active
      )
    ) then
      raise check_violation using message = 'PLANNING-EDIT-VISIT-TYPE';
    end if;
  end if;

  for v_visit in
    select v.* from public.visits v
    where v.id = any(v_ids) order by v.id
  loop
    select coalesce(jsonb_agg(to_jsonb(a) order by a.id), '[]'::jsonb)
      into v_old_assignments
    from public.assignments a where a.visit_id = v_visit.id;

    if p_operation = 'reschedule' then
      update public.visits set window_start = v_start, window_end = v_end
      where id = v_visit.id;
      insert into public.visit_lifecycle_events(
        visit_id,event_type,comments,actor,previous
      ) values (
        v_visit.id,'reschedule',btrim(p_reason),v_actor,
        jsonb_build_object(
          'window_start',v_visit.window_start,'window_end',v_visit.window_end
        )
      );
    elsif p_operation = 'reassign' then
      update public.assignments
      set inspector_id = v_new_inspector, method = 'manual'
      where visit_id = v_visit.id;
      if not found then
        insert into public.assignments(visit_id,inspector_id,method)
        values (v_visit.id,v_new_inspector,'manual');
      end if;
      insert into public.visit_lifecycle_events(
        visit_id,event_type,comments,actor,previous
      ) values (
        v_visit.id,'reassign',btrim(p_reason),v_actor,
        jsonb_build_object('assignments',v_old_assignments)
      );
    elsif p_operation = 'cancel' then
      update public.visits
      set planning_status = 'cancelled',
          cancellation_reason = btrim(p_reason)
      where id = v_visit.id;
      insert into public.visit_lifecycle_events(
        visit_id,event_type,comments,actor,previous
      ) values (
        v_visit.id,'cancel',btrim(p_reason),v_actor,
        jsonb_build_object('planning_status',v_visit.planning_status)
      );
    else
      update public.visits
      set visit_type = case when p_changes ? 'visit_type'
            then v_visit_type else visit_type end,
          notes = case when p_changes ? 'notes' then v_notes else notes end
      where id = v_visit.id;
    end if;

    insert into public.notifications(
      event_key,recipient,payload,channel,delivery_state,delivered_at
    )
    select
      'planning_visit_' || p_operation,
      recipients.inspector_id,
      jsonb_build_object(
        'visit_id',v_visit.id,'visit_plan_id',v_plan,
        'operation',p_operation,'reason',btrim(p_reason),
        'correlation_id',p_correlation_id
      ),
      'inapp','delivered',now()
    from (
      select distinct inspector_id from public.assignments
      where visit_id = v_visit.id
      union
      select distinct (entry->>'inspector_id')::uuid
      from jsonb_array_elements(v_old_assignments) entry
      where entry ? 'inspector_id'
    ) recipients;

    insert into public.audit_events(
      actor,object_type,object_id,action,before_state,after_state,
      requirement_refs
    ) values (
      v_actor,'visits',v_visit.id,
      'PLANNING_VISIT_' || upper(p_operation),
      to_jsonb(v_visit) || jsonb_build_object('assignments',v_old_assignments),
      (select to_jsonb(current_visit) from public.visits current_visit
       where current_visit.id = v_visit.id)
        || jsonb_build_object(
          'reason',btrim(p_reason),
          'correlation_id',p_correlation_id,
          'idempotency_key',btrim(p_idempotency_key)
        ),
      array[
        'CR-032','CR-033','CR-059','CR-063',
        'CR-083','CR-084','CR-085','CR-086'
      ]
    );
  end loop;

  v_result := jsonb_build_object(
    'visit_plan_id',v_plan,'visit_ids',to_jsonb(v_ids),
    'operation',p_operation,'updated_count',cardinality(v_ids),
    'correlation_id',p_correlation_id,'idempotent',false
  );
  insert into public.planning_visit_mutation_receipts(
    actor,idempotency_key,correlation_id,operation,request,result
  ) values (
    v_actor,btrim(p_idempotency_key),p_correlation_id,
    p_operation,v_request,v_result
  );
  return v_result;
end $$;
revoke all on function public.mutate_published_visits_atomic(
  uuid[],text,jsonb,text,text,uuid
) from public, anon;
grant execute on function public.mutate_published_visits_atomic(
  uuid[],text,jsonb,text,text,uuid
) to authenticated;

create or replace function public.reschedule_published_visits_atomic(
  p_visit_ids uuid[], p_window_start timestamptz, p_window_end timestamptz,
  p_reason text, p_idempotency_key text,
  p_correlation_id uuid default gen_random_uuid()
) returns jsonb language sql security definer set search_path = ''
as $$
  select public.mutate_published_visits_atomic(
    p_visit_ids,'reschedule',
    jsonb_build_object('window_start',p_window_start,'window_end',p_window_end),
    p_reason,p_idempotency_key,p_correlation_id
  )
$$;

create or replace function public.reassign_published_visits_atomic(
  p_visit_ids uuid[], p_inspector_id uuid, p_reason text,
  p_idempotency_key text, p_correlation_id uuid default gen_random_uuid()
) returns jsonb language sql security definer set search_path = ''
as $$
  select public.mutate_published_visits_atomic(
    p_visit_ids,'reassign',jsonb_build_object('inspector_id',p_inspector_id),
    p_reason,p_idempotency_key,p_correlation_id
  )
$$;

create or replace function public.cancel_published_visits_atomic(
  p_visit_ids uuid[], p_reason text, p_idempotency_key text,
  p_correlation_id uuid default gen_random_uuid()
) returns jsonb language sql security definer set search_path = ''
as $$
  select public.mutate_published_visits_atomic(
    p_visit_ids,'cancel','{}'::jsonb,p_reason,p_idempotency_key,p_correlation_id
  )
$$;

create or replace function public.edit_published_visits_atomic(
  p_visit_ids uuid[], p_visit_type text, p_notes text, p_reason text,
  p_idempotency_key text, p_correlation_id uuid default gen_random_uuid()
) returns jsonb language sql security definer set search_path = ''
as $$
  select public.mutate_published_visits_atomic(
    p_visit_ids,'edit',
    jsonb_strip_nulls(jsonb_build_object(
      'visit_type',p_visit_type,'notes',p_notes
    )),
    p_reason,p_idempotency_key,p_correlation_id
  )
$$;

create or replace function public.edit_published_visits_atomic(
  p_visit_ids uuid[], p_visit_type text, p_notes text, p_change_notes boolean,
  p_reason text, p_idempotency_key text,
  p_correlation_id uuid default gen_random_uuid()
) returns jsonb language sql security definer set search_path = ''
as $$
  select public.mutate_published_visits_atomic(
    p_visit_ids,'edit',
    jsonb_strip_nulls(jsonb_build_object('visit_type',p_visit_type))
      || case when p_change_notes
        then jsonb_build_object('notes',to_jsonb(p_notes))
        else '{}'::jsonb
      end,
    p_reason,p_idempotency_key,p_correlation_id
  )
$$;

revoke all on function public.reschedule_published_visits_atomic(
  uuid[],timestamptz,timestamptz,text,text,uuid
) from public, anon;
revoke all on function public.reassign_published_visits_atomic(
  uuid[],uuid,text,text,uuid
) from public, anon;
revoke all on function public.cancel_published_visits_atomic(
  uuid[],text,text,uuid
) from public, anon;
revoke all on function public.edit_published_visits_atomic(
  uuid[],text,text,text,text,uuid
) from public, anon;
revoke all on function public.edit_published_visits_atomic(
  uuid[],text,text,boolean,text,text,uuid
) from public, anon;
grant execute on function public.reschedule_published_visits_atomic(
  uuid[],timestamptz,timestamptz,text,text,uuid
) to authenticated;
grant execute on function public.reassign_published_visits_atomic(
  uuid[],uuid,text,text,uuid
) to authenticated;
grant execute on function public.cancel_published_visits_atomic(
  uuid[],text,text,uuid
) to authenticated;
grant execute on function public.edit_published_visits_atomic(
  uuid[],text,text,text,text,uuid
) to authenticated;
grant execute on function public.edit_published_visits_atomic(
  uuid[],text,text,boolean,text,text,uuid
) to authenticated;
