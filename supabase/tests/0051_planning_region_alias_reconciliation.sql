begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(8);

select has_function(
  'public',
  'planning_closure_factory_in_scope',
  array['uuid'],
  'BAU-6267 scope function exists after forward reconciliation'
);

select is(provolatile, 's', 'BAU-6267 scope function remains stable')
from pg_proc
where oid = 'public.planning_closure_factory_in_scope(uuid)'::regprocedure;

select is(prosecdef, true, 'BAU-6267 scope function preserves its security-definer contract')
from pg_proc
where oid = 'public.planning_closure_factory_in_scope(uuid)'::regprocedure;

select function_privs_are(
  'public',
  'planning_closure_factory_in_scope',
  array['uuid'],
  'authenticated',
  array['EXECUTE'],
  'BAU-6267 authenticated callers retain execute only'
);

select function_privs_are(
  'public',
  'planning_closure_factory_in_scope',
  array['uuid'],
  'anon',
  array[]::text[],
  'BAU-6267 anonymous callers retain no privilege'
);

select like(
  pg_get_functiondef('public.planning_closure_factory_in_scope(uuid)'::regprocedure),
  '%p.region = ''Eastern Province''%f.region = ''Eastern''%',
  'BAU-6267 Eastern Province identity matches Eastern factory'
);

select like(
  pg_get_functiondef('public.planning_closure_factory_in_scope(uuid)'::regprocedure),
  '%p.region = ''Eastern''%f.region = ''Eastern Province''%',
  'BAU-6267 Eastern identity matches Eastern Province factory'
);

select unlike(
  pg_get_functiondef('public.planning_closure_factory_in_scope(uuid)'::regprocedure),
  '%lower(%',
  'BAU-6267 does not broaden scope through case-folding or fuzzy matching'
);

select * from finish();
rollback;
