\set ON_ERROR_STOP on

-- CD-023 · MVP1-M01-043..052 / M02-012
-- Run after migrations as a database owner. The test replaces auth.uid only
-- inside this transaction, executes the RPC as `authenticated`, and rolls back
-- every synthetic row and temporary grant at the end.
begin;

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema public, auth to authenticated;
grant execute on function auth.uid() to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'cd023-planner@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'cd023-inspector@example.test');
insert into profiles (user_id, full_name, email) values
  ('11111111-1111-1111-1111-111111111111', 'CD-023 Planner', 'cd023-planner@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'CD-023 Inspector', 'cd023-inspector@example.test');
insert into user_roles (user_id, role_key) values
  ('11111111-1111-1111-1111-111111111111', 'planner'),
  ('22222222-2222-2222-2222-222222222222', 'inspector');
insert into packages (id, code, title) values
  ('33333333-3333-3333-3333-333333333333', 'CD023-PKG', 'CD-023 package');
insert into package_versions (id, package_id, version_label, status, definition, published_at) values
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '1', 'published', '{}', now());
insert into factories (
  id, factory_code, name, cr_number, license_number, region, city,
  official_lat, official_lng, source, is_temporary
) values
  ('55555555-5555-5555-5555-555555555551', 'CD023-F1', 'Registered one', 'CR-F1', 'LIC-F1', 'Riyadh', 'Riyadh', 24.7136, 46.6753, 'senaei', false),
  ('55555555-5555-5555-5555-555555555552', 'CD023-F2', 'Registered two', 'CR-F2', 'LIC-F2', 'Riyadh', 'Riyadh', 24.7136, 46.6753, 'senaei', false),
  ('55555555-5555-5555-5555-555555555553', 'CD023-F3', 'Registered three', 'CR-F3', 'LIC-F3', 'Riyadh', 'Riyadh', 24.7136, 46.6753, 'senaei', false);

-- Planner: a deliberately modified registered pin must remain Visit-owned and
-- must not overwrite or masquerade as the official factory coordinates.
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select create_immediate_visit(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'planner',
  '55555555-5555-5555-5555-555555555551', null, null, null, null, null, null,
  24.8000, 46.8000, 'manual', 'Complaint received',
  '44444444-4444-4444-4444-444444444444', 'complaint', null, 'location provenance',
  '2030-01-01 08:00+03', '2030-01-01 09:00+03',
  '22222222-2222-2222-2222-222222222222', true
);

-- A retry may not rewrite the creator role from the caller's new payload.
select create_immediate_visit(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'inspector',
  '55555555-5555-5555-5555-555555555551', null, null, null, null, null, null,
  24.8000, 46.8000, 'manual', 'Complaint received',
  '44444444-4444-4444-4444-444444444444', 'complaint', null, 'ignored replay body',
  null, null, null, false
);

-- A location labelled official must exactly match registered master data.
select create_immediate_visit(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'planner',
  '55555555-5555-5555-5555-555555555552', null, null, null, null, null, null,
  24.9000, 46.9000, 'official', 'Complaint received',
  '44444444-4444-4444-4444-444444444444', 'complaint', null, null,
  '2030-02-01 08:00+03', '2030-02-01 09:00+03',
  '22222222-2222-2222-2222-222222222222', true
);

-- Reusing either supplied source identity blocks a second temporary factory.
select create_immediate_visit(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'planner',
  null, 'First temporary', 'CR-TEMP-A', 'LIC-SHARED', 'Manufacturing', 'Riyadh', 'Riyadh',
  24.7000, 46.7000, 'manual', 'Complaint received',
  '44444444-4444-4444-4444-444444444444', 'complaint', null, null,
  '2031-01-01 08:00+03', '2031-01-01 09:00+03',
  '22222222-2222-2222-2222-222222222222', true
);
select create_immediate_visit(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'planner',
  null, 'Second temporary', 'CR-TEMP-B', 'LIC-SHARED', 'Manufacturing', 'Riyadh', 'Riyadh',
  24.7100, 46.7100, 'manual', 'Complaint received',
  '44444444-4444-4444-4444-444444444444', 'complaint', null, null,
  '2032-01-01 08:00+03', '2032-01-01 09:00+03',
  '22222222-2222-2222-2222-222222222222', true
);
reset role;

-- A downstream notification permission failure must roll the complete create
-- back, expose no provider/database text, and retain one governed attempt audit.
revoke insert on notifications from authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select create_immediate_visit(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'planner',
  '55555555-5555-5555-5555-555555555552', null, null, null, null, null, null,
  24.7136, 46.6753, 'official', 'Complaint received',
  '44444444-4444-4444-4444-444444444444', 'complaint', null, null,
  '2033-01-01 08:00+03', '2033-01-01 09:00+03',
  '22222222-2222-2222-2222-222222222222', true
);
reset role;
grant insert on notifications to authenticated;

-- A read failure follows the same atomic, neutral, audited error contract.
revoke select on package_versions from authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select create_immediate_visit(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'planner',
  '55555555-5555-5555-5555-555555555553', null, null, null, null, null, null,
  24.7136, 46.6753, 'official', 'Complaint received',
  '44444444-4444-4444-4444-444444444444', 'complaint', null, null,
  '2034-01-01 08:00+03', '2034-01-01 09:00+03',
  '22222222-2222-2222-2222-222222222222', true
);
reset role;
grant select on package_versions to authenticated;

-- Inspector: activity alone satisfies “any available business information”,
-- the visit starts immediately, self-assigns, and creates no notification.
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select create_immediate_visit(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'inspector',
  null, null, null, null, 'Activity only', null, null,
  24.7200, 46.7200, 'manual', 'Follow-up trigger',
  '44444444-4444-4444-4444-444444444444', 'follow_up', null, null,
  null, null, null, false
);

-- The narrow Inspector factory policy must reject source-master coordinates.
do $$
begin
  begin
    insert into factories (
      id, name, source, is_temporary, official_lat, official_lng
    ) values (
      '77777777-7777-7777-7777-777777777777', 'Forbidden inspector factory',
      'immediate_manual', true, 24.7, 46.7
    );
    raise exception 'CD023_ASSERT: inspector factory policy accepted official coordinates';
  exception when insufficient_privilege then
    null;
  end;
end
$$;

-- Callers cannot forge a CREATED audit for a visit they do not own.
do $$
begin
  begin
    perform audit_immediate_attempt(
      'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'CREATED',
      jsonb_build_object('visit_id', '99999999-9999-9999-9999-999999999999')
    );
    raise exception 'CD023_ASSERT: forged CREATED audit was accepted';
  exception when raise_exception then
    if sqlerrm like 'CD023_ASSERT:%' then raise; end if;
  end;
end
$$;
reset role;

-- Owner-level assertions inspect the whole transaction, independent of RLS.
do $$
declare
  v_visit uuid;
  v_factory uuid;
  v_assignment uuid;
  v_notification uuid;
begin
  select id, factory_id into v_visit, v_factory
    from visits where creation_request_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
  if v_visit is null then raise exception 'CD023_ASSERT: planner visit missing'; end if;
  if not exists (
    select 1 from visits
     where id = v_visit and visit_plan_id is null
       and planner_lat = 24.8000 and planner_lng = 46.8000
       and visit_location_source = 'manual'
       and immediate_creator_role = 'planner'
       and created_by = '11111111-1111-1111-1111-111111111111'
  ) then raise exception 'CD023_ASSERT: planner visit provenance mismatch'; end if;
  if not exists (
    select 1 from factories
     where id = v_factory and official_lat = 24.7136 and official_lng = 46.6753
  ) then raise exception 'CD023_ASSERT: official factory coordinates changed'; end if;

  select id into v_assignment from assignments where visit_id = v_visit;
  select id into v_notification from notifications where payload->>'visit_id' = v_visit::text;
  if v_assignment is null or v_notification is null then
    raise exception 'CD023_ASSERT: planner assignment or notification missing';
  end if;
  if not exists (
    select 1 from audit_events
     where object_type = 'immediate_visit_request'
       and object_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
       and action = 'IDEMPOTENT_REPLAY'
       and after_state->>'actor_mode' = 'planner'
  ) then raise exception 'CD023_ASSERT: replay did not bind stored creator role'; end if;
  if (select count(*) from audit_events
       where (object_type, object_id) in (
         ('visits', v_visit), ('assignments', v_assignment), ('notifications', v_notification)
       ) and action = 'INSERT') <> 3 then
    raise exception 'CD023_ASSERT: planner write audit coverage incomplete';
  end if;

  if not exists (
    select 1 from audit_events
     where object_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'
       and action = 'BLOCKED' and after_state->>'code' = 'location_source_invalid'
  ) then raise exception 'CD023_ASSERT: invalid official location was not blocked/audited'; end if;
  if not exists (select 1 from visits where creation_request_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3')
     or exists (select 1 from visits where creation_request_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4')
     or not exists (
       select 1 from audit_events
        where object_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'
          and action = 'BLOCKED' and after_state->>'code' = 'factory_identity_match'
     ) then raise exception 'CD023_ASSERT: source identity reuse contract failed'; end if;

  if exists (select 1 from visits where creation_request_id in (
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'
     )) then raise exception 'CD023_ASSERT: failed RPC retained a visit'; end if;
  if (select count(*) from audit_events
       where object_id in (
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'
       ) and action = 'BLOCKED' and after_state->>'code' = 'system_error') <> 2 then
    raise exception 'CD023_ASSERT: neutral failure audits missing';
  end if;

  select id, factory_id into v_visit, v_factory
    from visits where creation_request_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1';
  if v_visit is null then raise exception 'CD023_ASSERT: inspector visit missing'; end if;
  if not exists (
    select 1 from visits
     where id = v_visit and window_start = window_end
       and visit_location_source = 'manual'
       and immediate_creator_role = 'inspector'
       and created_by = '22222222-2222-2222-2222-222222222222'
  ) then raise exception 'CD023_ASSERT: inspector immediate shape mismatch'; end if;
  if not exists (
    select 1 from factories
     where id = v_factory and is_temporary and name_is_system_generated
       and activity_class = 'Activity only'
       and official_lat is null and official_lng is null
  ) then raise exception 'CD023_ASSERT: inspector temporary factory shape mismatch'; end if;
  if not exists (
    select 1 from assignments
     where visit_id = v_visit and inspector_id = '22222222-2222-2222-2222-222222222222'
  ) then raise exception 'CD023_ASSERT: inspector self-assignment missing'; end if;
  if exists (select 1 from notifications where payload->>'visit_id' = v_visit::text) then
    raise exception 'CD023_ASSERT: inspector self-create incorrectly notified';
  end if;
  if exists (select 1 from factories where id = '77777777-7777-7777-7777-777777777777') then
    raise exception 'CD023_ASSERT: forbidden direct inspector factory persisted';
  end if;
  if exists (
    select 1 from audit_events
     where object_id = 'cccccccc-cccc-cccc-cccc-ccccccccccc1' and action = 'CREATED'
  ) then raise exception 'CD023_ASSERT: forged CREATED audit persisted'; end if;
end
$$;

select 'CD023_DATABASE_CONTRACT_PASS' as result;
rollback;
