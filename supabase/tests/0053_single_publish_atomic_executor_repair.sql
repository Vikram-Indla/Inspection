\set ON_ERROR_STOP on
begin;

\ir ../migrations/20260729100000_single_publish_atomic_executor_repair.sql

do $$
declare
  v_security_definer boolean;
begin
  select p.prosecdef into v_security_definer
  from pg_proc p
  where p.pronamespace='public'::regnamespace
    and p.proname='publish_single_visit_atomic'
    and pg_get_function_identity_arguments(p.oid)=
      'p_factory_id uuid, p_package_version_ids uuid[], p_inspector_id uuid, p_visit_type text, p_execution_mode execution_mode, p_window_start timestamp with time zone, p_window_end timestamp with time zone, p_license_number text, p_location_confirmed boolean, p_planner_lat numeric, p_planner_lng numeric, p_notes text, p_target jsonb, p_source_channel text, p_resume_plan_id uuid';

  if v_security_definer is distinct from true then
    raise exception 'RAL-P28: atomic publisher must own its protected writes';
  end if;
  if not has_function_privilege(
    'authenticated',
    'public.publish_single_visit_atomic(uuid,uuid[],uuid,text,public.execution_mode,timestamptz,timestamptz,text,boolean,numeric,numeric,text,jsonb,text,uuid)',
    'execute'
  ) then
    raise exception 'RAL-P28: authenticated planner cannot execute atomic publisher';
  end if;
  if has_function_privilege(
    'anon',
    'public.publish_single_visit_atomic(uuid,uuid[],uuid,text,public.execution_mode,timestamptz,timestamptz,text,boolean,numeric,numeric,text,jsonb,text,uuid)',
    'execute'
  ) then
    raise exception 'RAL-P28: anonymous caller can execute atomic publisher';
  end if;
  if has_table_privilege('authenticated','public.visit_plans','update')
     or has_table_privilege('authenticated','public.audit_events','insert') then
    raise exception 'RAL-P28: protected table writes leaked to authenticated';
  end if;
end
$$;

rollback;
