\set ON_ERROR_STOP on
begin;

\ir ../migrations/20260729061000_planning_draft_method_type_repair.sql

do $$
declare
  v_definition text:=pg_get_functiondef(
    'public.save_planning_draft_atomic(uuid,text,jsonb,jsonb,integer,text,uuid)'
    ::regprocedure
  );
begin
  if position('p_method::public.planning_method' in v_definition)=0 then
    raise exception 'RAL-P24: draft saves must cast the method API value';
  end if;
  if position('PLANNING-DRAFT-DENIED' in v_definition)=0
     or position('PLANNING-CLOSURE-IDEMPOTENCY-CONFLICT' in v_definition)=0
     or position('PLANNING-DRAFT-STALE' in v_definition)=0
     or position('PLANNING_DRAFT_SAVE' in v_definition)=0
     or position('planning:draft-save:' in v_definition)=0
     or position('''running''' in v_definition)=0
     or position('''completed''' in v_definition)=0
     or position('applied_count=1' in v_definition)=0 then
    raise exception 'RAL-P24: draft repair must preserve governed guards and receipts';
  end if;
  if not has_function_privilege(
    'authenticated',
    'public.save_planning_draft_atomic(uuid,text,jsonb,jsonb,integer,text,uuid)',
    'execute'
  ) then
    raise exception 'RAL-P24: authenticated draft execution must remain available';
  end if;
end
$$;

-- Replay must be harmless.
\ir ../migrations/20260729061000_planning_draft_method_type_repair.sql

rollback;
