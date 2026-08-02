-- REQ-ALIGNMENT-CLOSURE-IMPLEMENTATION-001
-- Forward-only backend contracts for REQ-008, REQ-011/016, REQ-013 and REQ-018.
-- No source/master row is deleted or overwritten.

create table if not exists public.planning_lifecycle_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  version integer not null check (version > 0),
  cutoff_seconds integer not null check (cutoff_seconds > 0),
  boundary text not null check (boundary in ('inclusive', 'exclusive')),
  enabled boolean not null default false,
  effective_from timestamptz not null,
  effective_to timestamptz,
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  unique (rule_key, version),
  check (effective_to is null or effective_to > effective_from)
);

insert into public.planning_lifecycle_rules (
  rule_key, version, cutoff_seconds, boundary, enabled, effective_from
) values (
  'planner_cancel_reschedule_window', 1, 2592000, 'inclusive', true,
  timestamptz '2026-07-29 00:00:00+03'
) on conflict (rule_key, version) do nothing;

create unique index if not exists planning_lifecycle_rules_one_effective_uq
  on public.planning_lifecycle_rules (rule_key)
  where enabled and effective_to is null;

alter table public.planning_lifecycle_rules enable row level security;
revoke all on table public.planning_lifecycle_rules from anon, authenticated;
grant select on table public.planning_lifecycle_rules to authenticated;

drop policy if exists planning_lifecycle_rules_read
  on public.planning_lifecycle_rules;
create policy planning_lifecycle_rules_read
  on public.planning_lifecycle_rules for select to authenticated
  using (public.has_capability('planning.view'));

alter table public.planning_process_row_receipts
  add column if not exists cutoff_rule_id uuid
    references public.planning_lifecycle_rules(id),
  add column if not exists cutoff_rule_version integer,
  add column if not exists cutoff_boundary text
    check (cutoff_boundary is null or cutoff_boundary in ('inclusive', 'exclusive'));

create or replace function public.resolve_planning_lifecycle_cutoff(
  p_rule_key text,
  p_window_start timestamptz,
  p_evaluated_at timestamptz
) returns table (
  rule_id uuid,
  rule_version integer,
  cutoff_seconds integer,
  boundary text,
  cutoff_at timestamptz,
  allowed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rule public.planning_lifecycle_rules%rowtype;
begin
  if p_window_start is null or p_evaluated_at is null then
    raise exception using errcode='22023',
      message='PLANNING-CUTOFF-REQUEST';
  end if;
  select * into v_rule
    from public.planning_lifecycle_rules r
   where r.rule_key=p_rule_key and r.enabled
     and r.effective_from<=p_evaluated_at
     and (r.effective_to is null or r.effective_to>p_evaluated_at)
   order by r.version desc
   limit 1;
  if not found then
    raise exception using errcode='55000',
      message='PLANNING-CUTOFF-NOT-CONFIGURED';
  end if;
  rule_id:=v_rule.id;
  rule_version:=v_rule.version;
  cutoff_seconds:=v_rule.cutoff_seconds;
  boundary:=v_rule.boundary;
  cutoff_at:=p_window_start-pg_catalog.make_interval(secs=>v_rule.cutoff_seconds);
  allowed:=case v_rule.boundary
    when 'inclusive' then p_evaluated_at<=cutoff_at
    else p_evaluated_at<cutoff_at
  end;
  return next;
end
$$;
revoke all on function public.resolve_planning_lifecycle_cutoff(text,timestamptz,timestamptz)
  from public,anon,authenticated,service_role;

-- A saved target is historical evidence. This assertion never rewrites it.
-- Publication callers must supply the currently reselected canonical identity.
create or replace function public.assert_resumed_planning_target_current(
  p_plan_id uuid,
  p_factory_id uuid,
  p_cr_number text,
  p_license_number text,
  p_plant_number text
) returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_plan public.visit_plans%rowtype;
  v_target jsonb;
begin
  if p_plan_id is null then return; end if;
  select * into v_plan from public.visit_plans where id=p_plan_id for update;
  if not found or v_plan.created_by<>auth.uid() or v_plan.method<>'single'
     or v_plan.status<>'draft' or v_plan.archived_at is not null then
    raise exception using errcode='40001',message='PLANNING-DRAFT-STALE';
  end if;
  v_target:=coalesce(v_plan.draft_payload->'target','{}'::jsonb);
  if nullif(v_target->>'factory_id','') is distinct from p_factory_id::text
     or nullif(v_target->>'cr_number','') is distinct from nullif(btrim(p_cr_number),'')
     or coalesce(nullif(v_target->>'canonical_license_number',''),
                 nullif(v_target->>'license_number',''))
          is distinct from nullif(btrim(p_license_number),'')
     or nullif(v_target->>'plant_number','')
          is distinct from nullif(btrim(p_plant_number),'') then
    raise exception using errcode='40001',
      message='PLANNING-DRAFT-TARGET-RESELECT-REQUIRED';
  end if;
end
$$;
revoke all on function public.assert_resumed_planning_target_current(uuid,uuid,text,text,text)
  from public,anon,service_role;
grant execute on function public.assert_resumed_planning_target_current(uuid,uuid,text,text,text)
  to authenticated;

create table if not exists public.planning_attachment_policies (
  id uuid primary key default gen_random_uuid(),
  visit_type text not null,
  version integer not null check (version > 0),
  required boolean not null,
  min_count integer not null default 0 check (min_count >= 0),
  max_count integer check (max_count is null or max_count >= min_count),
  allowed_mime_types text[] not null default '{}'::text[],
  max_file_bytes bigint check (max_file_bytes is null or max_file_bytes > 0),
  enabled boolean not null default false,
  effective_from timestamptz not null,
  effective_to timestamptz,
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now(),
  unique (visit_type,version),
  check (effective_to is null or effective_to > effective_from)
);
alter table public.planning_attachment_policies enable row level security;
revoke all on table public.planning_attachment_policies from anon,authenticated;
grant select on table public.planning_attachment_policies to authenticated;
drop policy if exists planning_attachment_policies_read
  on public.planning_attachment_policies;
create policy planning_attachment_policies_read
  on public.planning_attachment_policies for select to authenticated
  using (public.has_capability('planning.view'));

create or replace function public.validate_planning_attachments(
  p_visit_type text,
  p_attachments jsonb,
  p_evaluated_at timestamptz default transaction_timestamp()
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_policy public.planning_attachment_policies%rowtype;
  v_count integer;
  v_item jsonb;
  v_size_text text;
  v_size_bytes bigint;
begin
  select * into v_policy from public.planning_attachment_policies p
   where p.visit_type=p_visit_type and p.enabled
     and p.effective_from<=p_evaluated_at
     and (p.effective_to is null or p.effective_to>p_evaluated_at)
   order by p.version desc limit 1;
  if not found then
    return jsonb_build_object('configured',false,'allowed',false,
      'reason','PLANNING-ATTACHMENT-POLICY-NOT-CONFIGURED');
  end if;
  if jsonb_typeof(coalesce(p_attachments,'[]'::jsonb))<>'array' then
    raise exception using errcode='22023',message='PLANNING-ATTACHMENTS-REQUEST';
  end if;
  v_count:=jsonb_array_length(coalesce(p_attachments,'[]'::jsonb));
  if v_count<v_policy.min_count
     or (v_policy.max_count is not null and v_count>v_policy.max_count) then
    return jsonb_build_object('configured',true,'allowed',false,
      'policy_id',v_policy.id,'version',v_policy.version,
      'reason','PLANNING-ATTACHMENT-COUNT');
  end if;
  for v_item in select value from jsonb_array_elements(coalesce(p_attachments,'[]'::jsonb))
  loop
    if jsonb_typeof(v_item)<>'object' then
      return jsonb_build_object('configured',true,'allowed',false,
        'policy_id',v_policy.id,'version',v_policy.version,
        'reason','PLANNING-ATTACHMENT-SIZE');
    end if;
    v_size_text:=nullif(v_item->>'size_bytes','');
    if v_size_text is null or v_size_text!~'^[0-9]+$' then
      return jsonb_build_object('configured',true,'allowed',false,
        'policy_id',v_policy.id,'version',v_policy.version,
        'reason','PLANNING-ATTACHMENT-SIZE');
    end if;
    begin
      v_size_bytes:=v_size_text::bigint;
    exception when numeric_value_out_of_range then
      return jsonb_build_object('configured',true,'allowed',false,
        'policy_id',v_policy.id,'version',v_policy.version,
        'reason','PLANNING-ATTACHMENT-SIZE');
    end;
    if nullif(v_item->>'mime','') is null or (v_policy.allowed_mime_types<>'{}'
       and not (v_item->>'mime'=any(v_policy.allowed_mime_types)))
       or (v_policy.max_file_bytes is not null
         and v_size_bytes>v_policy.max_file_bytes) then
      return jsonb_build_object('configured',true,'allowed',false,
        'policy_id',v_policy.id,'version',v_policy.version,
        'reason','PLANNING-ATTACHMENT-TYPE-OR-SIZE');
    end if;
  end loop;
  return jsonb_build_object('configured',true,'allowed',true,
    'policy_id',v_policy.id,'version',v_policy.version,'count',v_count);
end
$$;
revoke all on function public.validate_planning_attachments(text,jsonb,timestamptz)
  from public,anon,service_role;
grant execute on function public.validate_planning_attachments(text,jsonb,timestamptz)
  to authenticated;

-- Repository bootstrap logic and the canonical/live schema catalog both
-- require profiles.account_status, but the foundation SQL omitted its DDL.
-- Reconcile that provenance forward-only. On the live schema this is a no-op;
-- on a clean repository apply it creates the catalogued non-null default
-- without deleting, deactivating, or replacing any profile.
alter table public.profiles
  add column if not exists account_status text not null default 'active';

-- Refuse to install against any remaining drift: treating a missing/nullable
-- status as active would silently admit inactive accounts.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='profiles'
       and column_name='account_status' and is_nullable='NO'
  ) then
    raise exception using errcode='55000',
      message='PLANNING-RECOMMENDATION-ACCOUNT-STATUS-SCHEMA-DRIFT';
  end if;
end
$$;

create or replace function public.planning_inspector_capacity_fact(
  p_inspector uuid,
  p_window_start date,
  p_window_end date
) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  return jsonb_build_object(
    'available',true,
    'has_availability',coalesce((
      public.inspector_window_capacity(
        p_inspector,p_window_start,p_window_end
      )->>'has_availability'
    )::boolean,false)
  );
exception when others then
  return jsonb_build_object(
    'available',false,
    'has_availability',false,
    'reason','PLANNING-RECOMMENDATION-CAPACITY-UNAVAILABLE'
  );
end
$$;
revoke all on function public.planning_inspector_capacity_fact(uuid,date,date)
  from public,anon,authenticated,service_role;

create or replace function public.rank_planning_inspector_facts(
  p_facts jsonb
) returns jsonb
language sql immutable set search_path='' as $$
  select coalesce(jsonb_agg(fact order by
    coalesce((fact->>'has_availability')::boolean,false) desc,
    case when coalesce((fact->>'region_factor_available')::boolean,false)
      then coalesce((fact->>'same_region')::boolean,false)
      else false
    end desc,
    fact->>'inspector_id'
  ),'[]'::jsonb)
  from jsonb_array_elements(
    case when jsonb_typeof(p_facts)='array' then p_facts else '[]'::jsonb end
  ) as item(fact)
$$;
revoke all on function public.rank_planning_inspector_facts(jsonb)
  from public,anon,authenticated,service_role;

create or replace function public.recommend_planning_inspectors(
  p_factory_id uuid,
  p_window_start timestamptz,
  p_window_end timestamptz
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  v_region text;
  v_result jsonb;
begin
  if auth.uid() is null or not (
    public.has_capability('planning.create.single')
    or public.has_capability('planning.create.bulk')
    or public.has_capability('planning.create.immediate')
  ) then
    raise exception using errcode='42501',message='PLANNING-RECOMMENDATION-DENIED';
  end if;
  if p_window_start is null or p_window_end is null or p_window_end<=p_window_start then
    raise exception using errcode='22023',message='PLANNING-RECOMMENDATION-WINDOW';
  end if;
  select f.region into v_region from public.factories f where f.id=p_factory_id;
  if not found then
    raise exception using errcode='P0002',message='PLANNING-RECOMMENDATION-FACTORY';
  end if;
  select public.rank_planning_inspector_facts(
    coalesce(jsonb_agg(row_data),'[]'::jsonb)
  ) into v_result
  from (
    select jsonb_build_object(
      'inspector_id',p.user_id,
      'same_region',case when v_region is null or p.region is null then false
                         else p.region=v_region end,
      'region_factor_available',v_region is not null and p.region is not null,
      'has_availability',(capacity.fact->>'has_availability')::boolean,
      'capacity_factor_available',(capacity.fact->>'available')::boolean,
      'factors',jsonb_build_array(
        jsonb_build_object(
          'key','active_inspector_role',
          'role_result',true,
          'account_status_result',p.account_status='active',
          'result',true
        ),
        jsonb_build_object('key','same_region','available',
          v_region is not null and p.region is not null,
          'result',case when v_region is null or p.region is null
                        then null else p.region=v_region end),
        jsonb_build_object(
          'key','window_capacity',
          'available',(capacity.fact->>'available')::boolean,
          'result',(capacity.fact->>'has_availability')::boolean,
          'reason',capacity.fact->>'reason'
        )
      )
    ) row_data
    from public.profiles p
    cross join lateral (
      select public.planning_inspector_capacity_fact(
        p.user_id,p_window_start::date,p_window_end::date
      ) as fact
    ) capacity
    where exists (
      select 1 from public.user_roles ur
      where ur.user_id=p.user_id and ur.role_key='inspector'
    )
      and p.account_status='active'
  ) ranked;
  return v_result;
end
$$;
revoke all on function public.recommend_planning_inspectors(uuid,timestamptz,timestamptz)
  from public,anon,service_role;
grant execute on function public.recommend_planning_inspectors(uuid,timestamptz,timestamptz)
  to authenticated;

create or replace function public.apply_planning_assignment_recommendation()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  v_visit public.visits%rowtype;
  v_planning_method text;
  v_ranked jsonb;
  v_chosen jsonb;
begin
  if new.method<>'automatic' then return new; end if;
  select * into v_visit from public.visits where id=new.visit_id;
  if not found then
    raise exception using errcode='P0002',message='PLANNING-RECOMMENDATION-VISIT';
  end if;
  if v_visit.visit_plan_id is null then
    v_planning_method:='immediate';
  else
    select vp.method into v_planning_method
      from public.visit_plans vp
     where vp.id=v_visit.visit_plan_id;
  end if;
  if v_planning_method not in ('single','bulk','immediate') then
    raise exception using errcode='23514',
      message='PLANNING-RECOMMENDATION-METHOD';
  end if;
  v_ranked:=public.recommend_planning_inspectors(
    v_visit.factory_id,v_visit.window_start,v_visit.window_end
  );
  select value into v_chosen
    from jsonb_array_elements(v_ranked)
   where (value->>'has_availability')::boolean
   order by (value->>'same_region')::boolean desc,value->>'inspector_id'
   limit 1;
  if v_chosen is null then
    raise exception using errcode='23514',
      message='PLANNING-RECOMMENDATION-NO-AVAILABLE-INSPECTOR';
  end if;
  new.inspector_id:=(v_chosen->>'inspector_id')::uuid;
  new.candidates:=jsonb_build_object(
    'service','recommend_planning_inspectors',
    'chosen',new.inspector_id,
    'chosen_factors',v_chosen->'factors',
    'ranked_candidates',v_ranked,
    'planning_method',v_planning_method,
    'evaluated_at',transaction_timestamp()
  );
  return new;
end
$$;
revoke all on function public.apply_planning_assignment_recommendation()
  from public,anon,authenticated,service_role;
drop trigger if exists trg_apply_planning_assignment_recommendation
  on public.assignments;
create trigger trg_apply_planning_assignment_recommendation
  before insert on public.assignments
  for each row execute function public.apply_planning_assignment_recommendation();

create or replace function public.override_planning_assignment_atomic(
  p_visit_id uuid,
  p_inspector_id uuid,
  p_reason_key text,
  p_comment text,
  p_idempotency_key text,
  p_correlation_id uuid
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  v_result jsonb;
  v_assignment public.assignments%rowtype;
  v_reason text;
  v_audit bigint;
begin
  if auth.uid() is null
     or not public.has_capability('planning.override_assignment')
     or not public.has_capability('planning.reassign') then
    raise exception using errcode='42501',
      message='PLANNING-ASSIGNMENT-OVERRIDE-DENIED';
  end if;
  select l.key into v_reason
    from public.planning_lookups l
   where l.kind='assignment_override_reason' and l.key=p_reason_key
     and l.is_active;
  if not found or (p_reason_key='other' and nullif(btrim(p_comment),'') is null) then
    raise exception using errcode='22023',
      message='PLANNING-ASSIGNMENT-OVERRIDE-REASON';
  end if;
  v_result:=public.reassign_published_visits_atomic(
    array[p_visit_id],p_inspector_id,
    p_reason_key||coalesce(': '||nullif(btrim(p_comment),''),''),
    p_idempotency_key,p_correlation_id
  );
  select * into v_assignment
    from public.assignments a
   where a.visit_id=p_visit_id and a.inspector_id=p_inspector_id
   order by a.created_at desc limit 1 for update;
  if not found then
    raise exception using errcode='P0001',
      message='PLANNING-ASSIGNMENT-OVERRIDE-RECEIPT';
  end if;
  update public.assignments
     set candidates=coalesce(candidates,'{}'::jsonb)||jsonb_build_object(
       'override',jsonb_build_object(
         'reason_key',p_reason_key,
         'comment',nullif(btrim(p_comment),''),
         'actor',auth.uid(),
         'correlation_id',p_correlation_id,
         'recorded_at',transaction_timestamp()
       )
     )
   where id=v_assignment.id;
  insert into public.audit_events(
    actor,object_type,object_id,action,before_state,after_state,requirement_refs
  ) values (
    auth.uid(),'assignments',v_assignment.id,'PLANNING_ASSIGNMENT_OVERRIDE',
    to_jsonb(v_assignment),
    (select to_jsonb(a) from public.assignments a where a.id=v_assignment.id),
    array['REQ-008','PLN-REQ-ASSIGNMENT-OVERRIDE']
  ) returning id into v_audit;
  return v_result||jsonb_build_object(
    'override_audit_event_id',v_audit,
    'override_reason_key',p_reason_key
  );
end
$$;
revoke all on function public.override_planning_assignment_atomic(
  uuid,uuid,text,text,text,uuid
) from public,anon,service_role;
grant execute on function public.override_planning_assignment_atomic(
  uuid,uuid,text,text,text,uuid
) to authenticated;

create or replace function public.guard_planning_lifecycle_cutoff()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  v_rule record;
begin
  if old.planning_status in ('published','returned')
     and old.operational_state='new'
     and (
       (new.planning_status='cancelled' and old.planning_status<>new.planning_status)
       or new.window_start is distinct from old.window_start
       or new.window_end is distinct from old.window_end
     ) then
    select * into v_rule from public.resolve_planning_lifecycle_cutoff(
      'planner_cancel_reschedule_window',old.window_start,transaction_timestamp()
    );
    if not v_rule.allowed then
      raise exception using errcode='23514',
        message='PLANNING-CLOSURE-CONFIGURED-CUTOFF';
    end if;
  end if;
  return new;
end
$$;
revoke all on function public.guard_planning_lifecycle_cutoff()
  from public,anon,authenticated,service_role;
drop trigger if exists trg_guard_planning_lifecycle_cutoff on public.visits;
create trigger trg_guard_planning_lifecycle_cutoff
  before update on public.visits
  for each row execute function public.guard_planning_lifecycle_cutoff();

create or replace function public.stamp_planning_cutoff_receipt()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  v_rule record;
begin
  if new.cutoff_seconds is not null then
    select * into v_rule from public.resolve_planning_lifecycle_cutoff(
      'planner_cancel_reschedule_window',
      new.prior_window_start,new.server_transaction_time
    );
    new.cutoff_seconds:=v_rule.cutoff_seconds;
    new.cutoff_at:=v_rule.cutoff_at;
    new.cutoff_allowed:=v_rule.allowed;
    new.cutoff_rule_id:=v_rule.rule_id;
    new.cutoff_rule_version:=v_rule.rule_version;
    new.cutoff_boundary:=v_rule.boundary;
  end if;
  return new;
end
$$;
revoke all on function public.stamp_planning_cutoff_receipt()
  from public,anon,authenticated,service_role;
drop trigger if exists trg_stamp_planning_cutoff_receipt
  on public.planning_process_row_receipts;
create trigger trg_stamp_planning_cutoff_receipt
  before insert on public.planning_process_row_receipts
  for each row execute function public.stamp_planning_cutoff_receipt();
