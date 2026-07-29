-- Read-only function-presence evidence. This file does not change database state.
select
  to_regprocedure('public.submit_single_visit_for_supervision(uuid,uuid[],uuid,text,public.execution_mode,timestamp with time zone,timestamp with time zone,text,boolean,numeric,numeric,text,jsonb,text,uuid)') is not null as single_submit,
  to_regprocedure('public.decide_single_visit_supervision(uuid,text,uuid,text)') is not null as single_decide,
  to_regprocedure('public.submit_immediate_visit_for_supervision(uuid,uuid,uuid,uuid,text,timestamp with time zone,timestamp with time zone,text,text,text,numeric,numeric,text)') is not null as immediate_submit,
  to_regprocedure('public.submit_bulk_plan_for_supervision(uuid[],uuid[],timestamp with time zone,timestamp with time zone,text,text,text,jsonb)') is not null as bulk_submit;
