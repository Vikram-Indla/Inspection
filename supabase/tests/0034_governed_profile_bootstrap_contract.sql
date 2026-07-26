-- TASK-PROFILE-BOOTSTRAP-20260726-001
-- pgTAP contract: governed Auth-to-profile bootstrap. Transaction-wrapped.
begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(18);

select has_function(
  'public',
  'admin_bootstrap_profile',
  array['uuid', 'text', 'text', 'text'],
  'governed profile-bootstrap function exists'
);
select function_returns(
  'public',
  'admin_bootstrap_profile',
  array['uuid', 'text', 'text', 'text'],
  'uuid',
  'profile bootstrap returns the target UUID'
);
select function_privs_are(
  'public',
  'admin_bootstrap_profile',
  array['uuid', 'text', 'text', 'text'],
  'anon',
  array[]::text[],
  'anonymous callers have no function privilege'
);
select function_privs_are(
  'public',
  'admin_bootstrap_profile',
  array['uuid', 'text', 'text', 'text'],
  'authenticated',
  array['EXECUTE'],
  'authenticated callers have execute only'
);

insert into auth.users (id, email) values
  ('34111111-1111-1111-1111-111111111111', 'bootstrap-admin@example.test'),
  ('34222222-2222-2222-2222-222222222222', 'bootstrap-target@example.test'),
  ('34333333-3333-3333-3333-333333333333', 'bootstrap-other@example.test'),
  ('34444444-4444-4444-4444-444444444444', 'bootstrap-outsider@example.test');

insert into public.profiles (user_id, full_name, email) values
  ('34111111-1111-1111-1111-111111111111', 'Bootstrap Security Admin', 'bootstrap-admin@example.test'),
  ('34333333-3333-3333-3333-333333333333', 'Existing Different Profile', 'bootstrap-other@example.test'),
  ('34444444-4444-4444-4444-444444444444', 'Bootstrap Outsider', 'bootstrap-outsider@example.test');
insert into public.user_roles (user_id, role_key) values
  ('34111111-1111-1111-1111-111111111111', 'security_admin'),
  ('34444444-4444-4444-4444-444444444444', 'inspector');

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '34111111-1111-1111-1111-111111111111',
  true
);

select lives_ok(
  $$select public.admin_bootstrap_profile(
      '34222222-2222-2222-2222-222222222222',
      '  Fictional Demo Inspector  ',
      'Riyadh',
      'demo-inspection'
    )$$,
  'security_admin can bootstrap a different existing Auth identity'
);
select is(
  (select full_name from public.profiles where user_id = '34222222-2222-2222-2222-222222222222'),
  'Fictional Demo Inspector',
  'full name is normalized and stored'
);
select is(
  (select email from public.profiles where user_id = '34222222-2222-2222-2222-222222222222'),
  'bootstrap-target@example.test',
  'email is derived from auth.users'
);
select is(
  (select count(*)::integer from public.audit_events
    where object_type = 'profiles'
      and object_id = '34222222-2222-2222-2222-222222222222'
      and action = 'profile_bootstrap'),
  1,
  'actual creation emits one governed audit event'
);

select lives_ok(
  $$select public.admin_bootstrap_profile(
      '34222222-2222-2222-2222-222222222222',
      'Fictional Demo Inspector',
      'Riyadh',
      'demo-inspection'
    )$$,
  'exact replay is idempotent'
);
select is(
  (select count(*)::integer from public.audit_events
    where object_type = 'profiles'
      and object_id = '34222222-2222-2222-2222-222222222222'
      and action = 'profile_bootstrap'),
  1,
  'exact replay emits no duplicate audit event'
);

select throws_ok(
  $$select public.admin_bootstrap_profile(
      '34333333-3333-3333-3333-333333333333',
      'Changed Existing Profile',
      null,
      null
    )$$,
  '23514',
  'PROFILE-BOOTSTRAP-MISMATCH: existing profile does not exactly match the requested bootstrap',
  'mismatched existing profile is rejected'
);
select throws_ok(
  $$select public.admin_bootstrap_profile(
      '34111111-1111-1111-1111-111111111111',
      'Bootstrap Security Admin',
      null,
      null
    )$$,
  '23514',
  'PROFILE-BOOTSTRAP-SELF: profile bootstrap cannot target the caller',
  'self-targeting is rejected'
);
select throws_ok(
  $$select public.admin_bootstrap_profile(
      '34999999-9999-9999-9999-999999999999',
      'Missing Auth User',
      null,
      null
    )$$,
  '23514',
  'PROFILE-BOOTSTRAP-UNKNOWN-AUTH-USER: target Auth identity does not exist',
  'unknown Auth identity is rejected'
);
select throws_ok(
  $$select public.admin_bootstrap_profile(
      '34222222-2222-2222-2222-222222222222',
      '   ',
      'Riyadh',
      'demo-inspection'
    )$$,
  '23514',
  'PROFILE-BOOTSTRAP-NAME: a non-blank full name is required',
  'blank full name is rejected'
);

select set_config(
  'request.jwt.claim.sub',
  '34444444-4444-4444-4444-444444444444',
  true
);
select throws_ok(
  $$select public.admin_bootstrap_profile(
      '34222222-2222-2222-2222-222222222222',
      'Fictional Demo Inspector',
      'Riyadh',
      'demo-inspection'
    )$$,
  '42501',
  'PROFILE-BOOTSTRAP-DENIED: only security_admin may bootstrap profiles',
  'non-security-admin caller is rejected'
);

reset role;
select is(
  (select count(*)::integer from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')),
  0,
  'migration adds no direct profile write policy'
);
select is(
  (select count(*)::integer from public.profiles
    where user_id = '34222222-2222-2222-2222-222222222222'),
  1,
  'bootstrap creates exactly one profile row'
);
select is(
  (select full_name from public.profiles
    where user_id = '34333333-3333-3333-3333-333333333333'),
  'Existing Different Profile',
  'mismatch path does not update existing profile'
);

select * from finish();
rollback;
