-- INCIDENT-PLANNING-RETRY-STORM-20260822
-- assert_resumed_planning_target_current raised its two business rejections
-- with SQLSTATE 40001 (serialization_failure). 40001 is the standard
-- "transient, safe to retry" signal, so PostgREST retried the transaction on
-- every rejection. A rejection that is permanent by definition therefore
-- became an unbounded retry loop: one in-flight request pinned one PostgREST
-- connection and re-executed the function thousands of times per second.
--
-- The validation is unchanged, byte for byte. Only the SQLSTATE changes, from
-- the retryable 40001 to P0001 (raise_exception), which PostgREST reports once
-- as HTTP 400 and never retries.

create or replace function public.assert_resumed_planning_target_current(
  p_plan_id uuid,
  p_factory_id uuid,
  p_cr_number text,
  p_license_number text,
  p_plant_number text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.visit_plans%rowtype;
  v_target jsonb;
begin
  if p_plan_id is null then return; end if;
  select * into v_plan from public.visit_plans where id=p_plan_id for update;
  if not found or v_plan.created_by<>auth.uid() or v_plan.method<>'single'
     or v_plan.status<>'draft' or v_plan.archived_at is not null then
    raise exception using errcode='P0001',message='PLANNING-DRAFT-STALE';
  end if;
  v_target:=coalesce(v_plan.draft_payload->'target','{}'::jsonb);
  if nullif(v_target->>'factory_id','') is distinct from p_factory_id::text
     or nullif(v_target->>'cr_number','') is distinct from nullif(btrim(p_cr_number),'')
     or coalesce(nullif(v_target->>'canonical_license_number',''),
                 nullif(v_target->>'license_number',''))
          is distinct from nullif(btrim(p_license_number),'')
     or nullif(v_target->>'plant_number','')
          is distinct from nullif(btrim(p_plant_number),'') then
    raise exception using errcode='P0001',
      message='PLANNING-DRAFT-TARGET-RESELECT-REQUIRED';
  end if;
end
$$;

revoke all on function public.assert_resumed_planning_target_current(uuid,uuid,text,text,text)
  from public,anon,service_role;
grant execute on function public.assert_resumed_planning_target_current(uuid,uuid,text,text,text)
  to authenticated;
