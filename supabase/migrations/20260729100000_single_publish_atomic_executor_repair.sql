-- ACT-004 / REQ-005 / REQ-008
-- The atomic wrapper performs the provenance, visit-plan and audit writes that
-- deliberately are not granted directly to authenticated users. Run that
-- wrapper with its owner privileges while preserving the caller identity in
-- auth.uid(); the guarded legacy publisher remains responsible for planner
-- authorization and all canonical transition checks.
alter function public.publish_single_visit_atomic(
  uuid,uuid[],uuid,text,public.execution_mode,timestamptz,timestamptz,
  text,boolean,numeric,numeric,text,jsonb,text,uuid
) security definer;

revoke all on function public.publish_single_visit_atomic(
  uuid,uuid[],uuid,text,public.execution_mode,timestamptz,timestamptz,
  text,boolean,numeric,numeric,text,jsonb,text,uuid
) from public,anon,service_role;
grant execute on function public.publish_single_visit_atomic(
  uuid,uuid[],uuid,text,public.execution_mode,timestamptz,timestamptz,
  text,boolean,numeric,numeric,text,jsonb,text,uuid
) to authenticated;
