-- TASK-MVP3-RETROFIT-REGRESSION-001
-- Live-safe coexistence probe for the additive MVP3 control plane over the
-- existing MVP1/MVP2 database. Every write is synthetic and rolled back.
begin;

-- Capture an inherited MVP1 inspection before applying persona RLS. The
-- package compiler itself remains the authorization boundary under test.
select set_config(
  'retrofit.inspection_id',
  (select id::text from public.inspections order by id limit 1),
  true
);

-- A second security administrator is required to prove maker/checker. The
-- temporary grant is part of this transaction and is never persisted.
insert into public.user_roles(user_id, role_key)
select user_id, 'security_admin'
from public.profiles
where email = 'planner@mim.gov.sa'
on conflict do nothing;

-- Admin: create governed drafts and a device, then exercise the device RPC.
select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from public.profiles where email = 'admin@mim.gov.sa'),
  true
);
set local role authenticated;

insert into public.mvp3_feature_flags(
  id, flag_key, description, created_by
) values (
  '33111111-1111-1111-1111-111111111111',
  'retrofit.rollback.flag',
  'Rollback-only maker checker proof',
  auth.uid()
);

insert into public.mvp3_access_reviews(
  id, subject_user_id, scope, purpose, opened_by, due_at
) values (
  '33222222-2222-2222-2222-222222222222',
  (select user_id from public.profiles where email = 'inspector@mim.gov.sa'),
  'field-inspection',
  'Retrofit authorization review',
  auth.uid(),
  now() + interval '7 days'
);

insert into public.mvp3_devices(
  id, device_identifier, platform, assigned_user_id, trust_status,
  mdm_reference, app_version, app_version_compliant, enrolled_by
) values (
  '33333333-3333-3333-3333-333333333333',
  'RETROFIT-ROLLBACK-IPAD',
  'ipad_os',
  (select user_id from public.profiles where email = 'inspector@mim.gov.sa'),
  'pending',
  'MDM-ROLLBACK-ONLY',
  '3.0.0-test',
  true,
  auth.uid()
);

select public.mvp3_issue_device_command(
  '33333333-3333-3333-3333-333333333333',
  'suspend',
  'Retrofit rollback suspension'
);

do $$
begin
  begin
    perform public.mvp3_issue_device_command(
      '33999999-9999-9999-9999-999999999999',
      'suspend',
      'Missing device must be rejected'
    );
    raise exception 'MVP3_ASSERT: missing device command was accepted';
  exception when sqlstate '22023' then null;
  end;
end
$$;

select public.mvp3_decide_access_review(
  '33222222-2222-2222-2222-222222222222',
  'retain',
  'Validated role remains necessary'
);

select public.mvp3_compile_inspection_package(
  current_setting('retrofit.inspection_id')::uuid,
  (select id from public.package_versions order by id limit 1),
  null,
  jsonb_build_object(
    'forms', jsonb_build_array('retrofit-form'),
    'clauses', jsonb_build_array('retrofit-clause'),
    'evidence_rules', jsonb_build_object('mode', 'governed'),
    'report_template', 'retrofit-template',
    'locales', jsonb_build_array('en', 'ar')
  ),
  now() + interval '1 day'
);

select set_config(
  'retrofit.manifest_id',
  (select id::text
     from public.mvp3_inspection_package_manifests
    where inspection_id=current_setting('retrofit.inspection_id')::uuid),
  true
);

reset role;

-- Planner as an independent temporary security checker publishes the flag.
select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from public.profiles where email = 'planner@mim.gov.sa'),
  true
);
set local role authenticated;
select public.mvp3_publish_feature_flag(
  '33111111-1111-1111-1111-111111111111'
);
reset role;

-- Operations: append a semantic integration event and prove retry behavior.
select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from public.profiles where email = 'ops@mim.gov.sa'),
  true
);
set local role authenticated;
insert into public.mvp3_api_events(
  id, endpoint_id, event_kind, direction, outcome, actor_id, object_type,
  object_id, payload_digest, detail
) values (
  '33444444-4444-4444-4444-444444444444',
  (select id from public.mvp3_integration_endpoints where endpoint_key = 'ebda'),
  'retrofit_probe', 'internal', 'blocked', auth.uid(), 'inspection_platform',
  'MVP1-MVP2-MVP3', repeat('a', 64), '{"provider_enabled":false}'::jsonb
);

insert into public.mvp3_error_queue(
  id, source, operation, idempotency_key, status, last_error_code
) values (
  '33555555-5555-5555-5555-555555555555',
  'retrofit_probe', 'external_delivery', 'retrofit-rollback-error',
  'dependency_blocked', 'PROVIDER_NOT_CONFIGURED'
);
select public.mvp3_request_error_retry(
  '33555555-5555-5555-5555-555555555555'
);
reset role;

-- Inspector: the inherited field identity can record a refusal, while an
-- unknown device is denied and still produces an immutable audit record.
select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from public.profiles where email = 'inspector@mim.gov.sa'),
  true
);
set local role authenticated;

select public.mvp3_open_inspection_package(
  current_setting('retrofit.manifest_id')::uuid,
  'UNKNOWN-RETROFIT-DEVICE'
);

select public.mvp3_record_signature_refusal(
  'Factory representative declined to sign',
  'Retrofit Witness',
  'Inspector recorded refusal in the governed workflow',
  '{"device":"RETROFIT-ROLLBACK-IPAD","offline":false}'::jsonb,
  '{"source":"captured","accuracy_m":12}'::jsonb,
  'continue_to_review'
);

do $$
begin
  if (select count(*) from public.mvp3_integration_endpoints) <> 0 then
    raise exception 'MVP3_ASSERT: inspector escaped integration endpoint RLS';
  end if;
end
$$;
reset role;

-- System-side command acknowledgement must be possible; audit/manifests and
-- package-access evidence must remain append-only.
update public.mvp3_device_commands
   set status = 'acknowledged'
 where id = (
   select id from public.mvp3_device_commands
    where device_id = '33333333-3333-3333-3333-333333333333'
    order by requested_at desc limit 1
 );

do $$
declare
  v_admin uuid := (select user_id from public.profiles where email='admin@mim.gov.sa');
  v_planner uuid := (select user_id from public.profiles where email='planner@mim.gov.sa');
  v_inspector uuid := (select user_id from public.profiles where email='inspector@mim.gov.sa');
  v_rejected boolean;
begin
  if not exists (
    select 1 from public.mvp3_feature_flags
     where id='33111111-1111-1111-1111-111111111111'
       and status='published' and created_by=v_admin and approved_by=v_planner
       and created_by <> approved_by and published_at is not null
  ) then raise exception 'MVP3_ASSERT: feature flag maker/checker failed'; end if;

  if not exists (
    select 1 from public.mvp3_access_reviews
     where id='33222222-2222-2222-2222-222222222222'
       and status='retain' and reviewed_by=v_admin and subject_user_id=v_inspector
       and length(btrim(review_reason)) >= 8
  ) then raise exception 'MVP3_ASSERT: access review decision failed'; end if;

  if not exists (
    select 1 from public.mvp3_device_commands
     where device_id='33333333-3333-3333-3333-333333333333'
       and requested_device_identifier='RETROFIT-ROLLBACK-IPAD'
       and command='suspend' and status='acknowledged'
  ) then raise exception 'MVP3_ASSERT: canonical device command/lifecycle failed'; end if;

  if not exists (
    select 1 from public.mvp3_devices
     where id='33333333-3333-3333-3333-333333333333'
       and trust_status='suspended'
  ) then raise exception 'MVP3_ASSERT: device state transition failed'; end if;

  if not exists (
    select 1 from public.mvp3_error_queue
     where id='33555555-5555-5555-5555-555555555555'
       and status='retry_requested' and attempt_count=2
       and next_attempt_at is not null
  ) then raise exception 'MVP3_ASSERT: governed retry transition failed'; end if;

  if not exists (
    select 1 from public.mvp3_package_access_events
     where requested_device_identifier='UNKNOWN-RETROFIT-DEVICE'
       and device_id is null and actor_id=v_inspector
       and outcome='denied_unassigned'
  ) then raise exception 'MVP3_ASSERT: unknown-device denial audit failed'; end if;

  if not exists (
    select 1 from public.mvp3_signature_refusals
     where recorded_by=v_inspector
       and refusal_reason='Factory representative declined to sign'
       and workflow_continuation='continue_to_review'
  ) then raise exception 'MVP3_ASSERT: signature refusal evidence failed'; end if;

  v_rejected := false;
  begin
    update public.mvp3_api_events set detail='{}'::jsonb
     where id='33444444-4444-4444-4444-444444444444';
  exception when sqlstate '42501' then v_rejected := true; end;
  if not v_rejected then raise exception 'MVP3_ASSERT: API event was mutable'; end if;

  v_rejected := false;
  begin
    delete from public.mvp3_package_access_events
     where requested_device_identifier='UNKNOWN-RETROFIT-DEVICE';
  exception when sqlstate '42501' then v_rejected := true; end;
  if not v_rejected then raise exception 'MVP3_ASSERT: package access evidence was mutable'; end if;

  v_rejected := false;
  begin
    update public.mvp3_inspection_package_manifests
       set expires_at=expires_at + interval '1 day'
     where compiled_by=v_admin;
  exception when sqlstate '42501' then v_rejected := true; end;
  if not v_rejected then raise exception 'MVP3_ASSERT: compiled manifest was mutable'; end if;
end
$$;

select
  'PASS'::text as result,
  'MVP1/MVP2 identities and objects coexist with all 7 MVP3 RPCs, RLS, maker-checker, fail-closed dependencies, lifecycle and append-only evidence; transaction rolled back'::text as assertion;

rollback;

select
  'PASS'::text as rollback_result,
  (select count(*) from public.mvp3_feature_flags where id='33111111-1111-1111-1111-111111111111') as residual_flags,
  (select count(*) from public.mvp3_devices where id='33333333-3333-3333-3333-333333333333') as residual_devices,
  (select count(*) from public.mvp3_api_events where id='33444444-4444-4444-4444-444444444444') as residual_events;
