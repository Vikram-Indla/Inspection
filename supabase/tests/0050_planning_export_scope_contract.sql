\set ON_ERROR_STOP on
-- PLN-002 / PLN-REQ-017
-- Transactional proof that Planning export's canonical visit query can only
-- reach visits inside the authenticated Planner's region.

begin;

insert into auth.users(id,email) values
  ('00000000-0000-4000-8000-000000002001','pln002-probe-planner@example.invalid');

insert into public.profiles(user_id,full_name,email,region,org_scope) values
  (
    '00000000-0000-4000-8000-000000002001',
    'PLN-002 Probe Planner',
    'pln002-probe-planner@example.invalid',
    'Riyadh',
    'regional'
  );

insert into public.user_roles(user_id,role_key) values
  ('00000000-0000-4000-8000-000000002001','planner');

insert into public.factories(id,factory_code,name,region,city,source) values
  (
    '00000000-0000-4000-8000-000000002011',
    'PLN002-RUH',
    'PLN-002 Riyadh Scope Probe',
    'Riyadh',
    'Riyadh',
    'manual'
  ),
  (
    '00000000-0000-4000-8000-000000002012',
    'PLN002-EAST',
    'PLN-002 Eastern Scope Probe',
    'Eastern',
    'Dammam',
    'manual'
  );

insert into public.visit_plans(id,method,status,created_by,plan_reference) values
  (
    '00000000-0000-4000-8000-000000002021',
    'single',
    'published',
    '00000000-0000-4000-8000-000000002001',
    'PLN002-PROBE-RUH-PUB'
  ),
  (
    '00000000-0000-4000-8000-000000002022',
    'single',
    'draft',
    '00000000-0000-4000-8000-000000002001',
    'PLN002-PROBE-RUH-DRF'
  ),
  (
    '00000000-0000-4000-8000-000000002023',
    'single',
    'published',
    '00000000-0000-4000-8000-000000002001',
    'PLN002-PROBE-EAST-OOS'
  );

insert into public.visits(
  id,visit_plan_id,factory_id,visit_type,execution_mode,planning_status,
  operational_state,window_start,window_end,created_by,visit_reference,
  source_channel
) values
  (
    '00000000-0000-4000-8000-000000002031',
    '00000000-0000-4000-8000-000000002021',
    '00000000-0000-4000-8000-000000002011',
    'periodic','physical','published','prepared',
    '2026-08-10T06:00:00Z','2026-08-10T12:00:00Z',
    '00000000-0000-4000-8000-000000002001',
    'PLN002-PROBE-RUH-PUBLISHED','pln002_probe'
  ),
  (
    '00000000-0000-4000-8000-000000002032',
    '00000000-0000-4000-8000-000000002022',
    '00000000-0000-4000-8000-000000002011',
    'follow_up','virtual','draft','new',
    '2026-08-12T06:00:00Z','2026-08-12T12:00:00Z',
    '00000000-0000-4000-8000-000000002001',
    'PLN002-PROBE-RUH-DRAFT','pln002_probe'
  ),
  (
    '00000000-0000-4000-8000-000000002033',
    '00000000-0000-4000-8000-000000002023',
    '00000000-0000-4000-8000-000000002012',
    'periodic','physical','published','prepared',
    '2026-08-14T06:00:00Z','2026-08-14T12:00:00Z',
    '00000000-0000-4000-8000-000000002001',
    'PLN002-PROBE-EAST-OUT-OF-SCOPE','pln002_probe'
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000002001',
  true
);

do $$
begin
  if (
    select count(*) from public.visits
    where source_channel='pln002_probe'
  ) <> 2 then
    raise exception 'PLN-002: Planner must see exactly two in-scope visits';
  end if;

  if (
    select count(*) from public.visits
    where source_channel='pln002_probe'
      and planning_status='published'
  ) <> 1 then
    raise exception 'PLN-002: published filter must produce one in-scope visit';
  end if;

  if exists (
    select 1 from public.visits
    where visit_reference='PLN002-PROBE-EAST-OUT-OF-SCOPE'
  ) then
    raise exception 'PLN-002: out-of-region visit crossed Planning RLS';
  end if;

  if not exists (
    select 1 from public.visits
    where visit_reference='PLN002-PROBE-RUH-PUBLISHED'
  ) or not exists (
    select 1 from public.visits
    where visit_reference='PLN002-PROBE-RUH-DRAFT'
  ) then
    raise exception 'PLN-002: an in-scope control visit is missing';
  end if;
end
$$;

reset role;
rollback;

do $$
begin
  if exists (
    select 1 from auth.users
    where id='00000000-0000-4000-8000-000000002001'
  ) or exists (
    select 1 from public.visits
    where source_channel='pln002_probe'
  ) then
    raise exception 'PLN-002: transactional probe residue remains';
  end if;
end
$$;
