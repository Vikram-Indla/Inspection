\set ON_ERROR_STOP on
begin;

\ir ../migrations/20260729080000_planning_recommendation_authority_repair.sql

do $$
declare
  v_definition text:=pg_get_functiondef(
    'public.recommend_planning_inspectors(uuid,timestamptz,timestamptz)'
    ::regprocedure
  );
  v_compact text;
begin
  v_compact:=regexp_replace(v_definition,'[[:space:]]','','g');
  if position('planning_closure_has_explicit_capability' in v_definition)=0
     or position('planning.create.single' in v_definition)=0
     or position('planning.create.bulk' in v_definition)=0
     or position('planning.create.immediate' in v_definition)=0
     or position('has_capability(' in v_definition)>0 then
    raise exception 'RAL-P26: recommendation authority must use Planning permissions';
  end if;
  if position('p.account_status=''active''' in v_compact)=0
     or position('planning_inspector_capacity_fact' in v_definition)=0
     or position('rank_planning_inspector_facts' in v_definition)=0 then
    raise exception 'RAL-P26: eligibility and ranking guards must remain installed';
  end if;
end
$$;

\ir ../migrations/20260729080000_planning_recommendation_authority_repair.sql

rollback;
