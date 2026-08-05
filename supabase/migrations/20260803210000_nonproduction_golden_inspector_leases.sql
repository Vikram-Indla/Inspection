-- Controlled non-production golden-journey Inspector leases.
-- This is an additive test-data coordination boundary. It does not participate
-- in, replace, or weaken ordinary assignment overlap enforcement.

create table public.nonproduction_golden_inspector_leases (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique check (run_key ~ '^golden-[a-z0-9][a-z0-9._-]{0,119}$'),
  inspector_id uuid not null references public.nonproduction_inspector_roster(user_id) on delete restrict,
  window_start timestamptz not null,
  window_end timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  check (window_end > window_start),
  check (expires_at > created_at)
);

create table public.nonproduction_golden_inspector_lease_events (
  id bigint generated always as identity primary key,
  lease_id uuid not null references public.nonproduction_golden_inspector_leases(id) on delete restrict,
  event_type text not null check (event_type in ('released','terminal')),
  visit_id uuid references public.visits(id) on delete restrict,
  occurred_at timestamptz not null default clock_timestamp(),
  unique (lease_id, event_type)
);

alter table public.nonproduction_golden_inspector_leases enable row level security;
alter table public.nonproduction_golden_inspector_lease_events enable row level security;
revoke all on public.nonproduction_golden_inspector_leases from public, anon, authenticated;
revoke all on public.nonproduction_golden_inspector_lease_events from public, anon, authenticated;
revoke update, delete, truncate on public.nonproduction_golden_inspector_leases from service_role;
revoke update, delete, truncate on public.nonproduction_golden_inspector_lease_events from service_role;

create or replace function public.acquire_nonproduction_golden_inspector_lease(
  p_run_key text,
  p_candidate_ids uuid[],
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_expires_at timestamptz
) returns table(lease_id uuid, inspector_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  v_candidate uuid;
  v_lease uuid;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception using errcode='42501', message='GOLDEN-LEASE-SERVICE-ROLE-REQUIRED';
  end if;
  if p_run_key is null or p_run_key !~ '^golden-[a-z0-9][a-z0-9._-]{0,119}$'
     or p_candidate_ids is null or cardinality(p_candidate_ids) not between 1 and 30
     or cardinality(p_candidate_ids) <> (select count(distinct id) from unnest(p_candidate_ids) id)
     or p_window_start is null or p_window_end <= p_window_start
     or p_expires_at <= clock_timestamp() then
    raise exception using errcode='22023', message='GOLDEN-LEASE-INVALID';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('nonproduction-golden-inspector-pool', 0));
  select l.id, l.inspector_id into v_lease, v_candidate
    from public.nonproduction_golden_inspector_leases l
   where l.run_key=p_run_key;
  if found then return query select v_lease, v_candidate; return; end if;

  select candidate into v_candidate
    from unnest(p_candidate_ids) with ordinality requested(candidate, position)
   where exists (
     select 1 from public.nonproduction_inspector_roster roster
     join public.profiles profile on profile.user_id=roster.user_id
     where roster.user_id=candidate and roster.account_status='active'
       and roster.provenance='NONPRODUCTION_SYNTHETIC'
       and roster.persona_key like 'golden_inspector_%'
       and profile.account_status='active' and profile.region='Riyadh'
       and exists (select 1 from public.user_roles role where role.user_id=candidate and role.role_key='inspector')
   )
   and not exists (
     select 1 from public.nonproduction_golden_inspector_leases lease
     where lease.inspector_id=candidate and lease.expires_at>clock_timestamp()
       and not exists (select 1 from public.nonproduction_golden_inspector_lease_events event where event.lease_id=lease.id)
   )
   and not exists (
     select 1 from public.assignments assignment join public.visits visit on visit.id=assignment.visit_id
     where assignment.inspector_id=candidate
       and visit.planning_status in ('draft','validated','pending_supervision','published','returned')
       and visit.window_start<p_window_end and visit.window_end>p_window_start
   )
   order by position limit 1;
  if v_candidate is null then
    raise exception using errcode='P0001', message='GOLDEN-LEASE-NO-AVAILABLE-INSPECTOR';
  end if;

  insert into public.nonproduction_golden_inspector_leases(run_key,inspector_id,window_start,window_end,expires_at)
  values(p_run_key,v_candidate,p_window_start,p_window_end,p_expires_at) returning id into v_lease;
  insert into public.audit_events(actor,object_type,object_id,action,after_state,requirement_refs)
  values(v_candidate,'nonproduction_golden_inspector_leases',v_lease,'NONPRODUCTION_GOLDEN_INSPECTOR_LEASE_ACQUIRED',
    jsonb_build_object('run_key',p_run_key,'inspector_id',v_candidate,'expires_at',p_expires_at),array['B10-EV-001']);
  return query select v_lease,v_candidate;
end $$;

create or replace function public.release_nonproduction_golden_inspector_lease(
  p_lease_id uuid, p_event_type text, p_visit_id uuid default null
) returns void language plpgsql security definer set search_path='' as $$
declare v_inspector uuid;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception using errcode='42501', message='GOLDEN-LEASE-SERVICE-ROLE-REQUIRED';
  end if;
  if p_event_type not in ('released','terminal') then
    raise exception using errcode='22023', message='GOLDEN-LEASE-EVENT-INVALID';
  end if;
  select inspector_id into v_inspector from public.nonproduction_golden_inspector_leases where id=p_lease_id;
  if not found then raise exception using errcode='P0002',message='GOLDEN-LEASE-NOT-FOUND'; end if;
  if p_visit_id is not null and not exists (
    select 1 from public.assignments assignment
    where assignment.visit_id=p_visit_id and assignment.inspector_id=v_inspector
  ) then
    raise exception using errcode='42501',message='GOLDEN-LEASE-VISIT-MISMATCH';
  end if;
  insert into public.nonproduction_golden_inspector_lease_events(lease_id,event_type,visit_id)
  values(p_lease_id,p_event_type,p_visit_id) on conflict (lease_id,event_type) do nothing;
  insert into public.audit_events(actor,object_type,object_id,action,after_state,requirement_refs)
  select v_inspector,'nonproduction_golden_inspector_leases',p_lease_id,'NONPRODUCTION_GOLDEN_INSPECTOR_LEASE_'||upper(p_event_type),
    jsonb_build_object('visit_id',p_visit_id),array['B10-EV-001']
  where not exists (select 1 from public.audit_events where object_id=p_lease_id and action='NONPRODUCTION_GOLDEN_INSPECTOR_LEASE_'||upper(p_event_type));
end $$;

create or replace function public.verify_nonproduction_golden_inspector_lease(
  p_lease_id uuid,
  p_inspector_id uuid,
  p_window_start timestamptz,
  p_window_end timestamptz
) returns boolean language plpgsql security definer set search_path='' as $$
declare v_lease public.nonproduction_golden_inspector_leases%rowtype;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception using errcode='42501',message='GOLDEN-LEASE-SERVICE-ROLE-REQUIRED';
  end if;
  select * into v_lease from public.nonproduction_golden_inspector_leases where id=p_lease_id;
  if not found then raise exception using errcode='P0002',message='GOLDEN-LEASE-NOT-FOUND'; end if;
  if v_lease.inspector_id<>p_inspector_id then
    raise exception using errcode='42501',message='GOLDEN-LEASE-INSPECTOR-MISMATCH';
  end if;
  if v_lease.expires_at<=clock_timestamp() then
    raise exception using errcode='55000',message='GOLDEN-LEASE-EXPIRED';
  end if;
  if exists (select 1 from public.nonproduction_golden_inspector_lease_events event where event.lease_id=v_lease.id) then
    raise exception using errcode='55000',message='GOLDEN-LEASE-RELEASED';
  end if;
  if v_lease.window_start is distinct from p_window_start or v_lease.window_end is distinct from p_window_end then
    raise exception using errcode='22023',message='GOLDEN-LEASE-WINDOW-MISMATCH';
  end if;
  return true;
end $$;

revoke all on function public.acquire_nonproduction_golden_inspector_lease(text,uuid[],timestamptz,timestamptz,timestamptz) from public,anon,authenticated;
revoke all on function public.release_nonproduction_golden_inspector_lease(uuid,text,uuid) from public,anon,authenticated;
revoke all on function public.verify_nonproduction_golden_inspector_lease(uuid,uuid,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.acquire_nonproduction_golden_inspector_lease(text,uuid[],timestamptz,timestamptz,timestamptz) to service_role;
grant execute on function public.release_nonproduction_golden_inspector_lease(uuid,text,uuid) to service_role;
grant execute on function public.verify_nonproduction_golden_inspector_lease(uuid,uuid,timestamptz,timestamptz) to service_role;
