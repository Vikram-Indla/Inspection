-- CD-023 cross-slice remediation — Inspector-created Immediate Visits have no
-- planner window (M01-047/051), so their start-now timestamp is not an expiry
-- deadline. Keep them out of the scheduled/page-load lapse engine.

create or replace function public._expire_lapsed_visits_core(p_scope_sql text) returns integer
language plpgsql volatile security definer set search_path = public as $$
declare
  expired_ids uuid[];
begin
  execute format($f$
    with lapsed as (
      update visits v
         set planning_status = 'expired'
       where v.planning_status = 'published'
         and v.window_end < now()
         and not (
           v.visit_plan_id is null
           and v.immediate_creator_role = 'inspector'
         )
         and not exists (
           select 1 from inspections i
            where i.visit_id = v.id and i.status <> 'not_started')
         and (%s)
      returning v.id)
    select coalesce(array_agg(id), '{}'::uuid[]) from lapsed
  $f$, p_scope_sql) into expired_ids;

  if array_length(expired_ids, 1) is null then
    return 0;
  end if;

  insert into notifications (event_key, recipient, payload, channel, delivery_state, delivered_at)
  select 'visit_expired', a.inspector_id,
         jsonb_build_object('visit_id', v.id, 'window_end', v.window_end),
         'inapp', 'delivered', now()
    from visits v
    join assignments a on a.visit_id = v.id
   where v.id = any(expired_ids)
     and a.inspector_id is not null;

  insert into notifications (event_key, recipient, payload, channel, delivery_state, delivered_at)
  select 'visit_expired', p.created_by,
         jsonb_build_object('visit_id', v.id, 'window_end', v.window_end, 'planner', true),
         'inapp', 'delivered', now()
    from visits v
    join visit_plans p on p.id = v.visit_plan_id
   where v.id = any(expired_ids)
     and p.created_by is not null;

  return array_length(expired_ids, 1);
end;
$$;

revoke all on function public._expire_lapsed_visits_core(text) from public;

-- Repair rows already misclassified by the old predicate. The normal Visit
-- audit trigger records every reversal; historical notifications are retained
-- rather than rewritten or deleted.
update public.visits v
   set planning_status = 'published'
 where v.planning_status = 'expired'
   and v.visit_plan_id is null
   and v.immediate_creator_role = 'inspector'
   and not exists (
     select 1 from public.inspections i
      where i.visit_id = v.id and i.status <> 'not_started'
   );
