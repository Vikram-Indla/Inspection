-- Allow a new golden lease to select capacity that is blocked only by an
-- unstarted, harness-owned predecessor. The golden harness must still retire
-- that predecessor through the existing audited Planning RPC before creating
-- its successor; ordinary assignment conflict enforcement is unchanged.

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
  if found then
    if exists (select 1 from public.nonproduction_golden_inspector_lease_events event where event.lease_id=v_lease)
       or exists (select 1 from public.nonproduction_golden_inspector_leases lease where lease.id=v_lease and lease.expires_at<=clock_timestamp()) then
      raise exception using errcode='55000',message='GOLDEN-LEASE-RUN-KEY-CLOSED';
    end if;
    return query select v_lease, v_candidate; return;
  end if;

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
     select 1
       from public.assignments assignment
       join public.visits visit on visit.id=assignment.visit_id
       join public.factories factory on factory.id=visit.factory_id
      where assignment.inspector_id=candidate
        and visit.planning_status in ('draft','validated','pending_supervision','published','returned')
        and visit.window_start<p_window_end and visit.window_end>p_window_start
        and not (
          visit.planning_status in ('published','returned')
          and visit.operational_state='new'
          and factory.factory_code like 'R3-QA-CERT-%'
        )
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

revoke all on function public.acquire_nonproduction_golden_inspector_lease(text,uuid[],timestamptz,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.acquire_nonproduction_golden_inspector_lease(text,uuid[],timestamptz,timestamptz,timestamptz) to service_role;
