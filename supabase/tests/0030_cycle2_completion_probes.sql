\set ON_ERROR_STOP on

-- Cycle 2 completion pass — dedicated tests for DEF-WF-006, DEF-DATA-005,
-- SCR-ADM-080 (notification_rules) RLS and DEF-PRF-003 (notification_preferences)
-- own-row RLS.
--
-- ⚠ LOCAL TEST DATABASE ONLY. This file follows the same pattern as
-- 0027_cd023_immediate_visit_atomic.sql: it temporarily replaces
-- auth.uid() for the duration of one rolled-back transaction so RLS/trigger
-- behavior can be exercised under a synthetic identity. That is safe against
-- an ephemeral local Postgres started by `supabase start`, but it is NEVER
-- safe to run against the shared hosted project — replacing the real
-- auth.uid() there, even transiently, would break authentication/RLS for
-- every real concurrent session on that database. Run with:
--   supabase start && supabase test db
-- This file was authored and syntax-reviewed in this task but was NOT
-- executed here — no local Supabase/Docker stack was available in this
-- environment (see FULL_REGRESSION_RESULTS.md). Live, read-only evidence
-- for DEF-WF-006/DEF-DATA-005 against the actual shared project is recorded
-- separately (trigger/constraint existence probe + the 503-row live
-- violation count that proves the DEF-DATA-005 constraint is real).

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
  ('c2c00001-0001-0001-0001-000000000001', 'cycle2-planner@example.test'),
  ('c2c00001-0001-0001-0001-000000000002', 'cycle2-inspector@example.test'),
  ('c2c00001-0001-0001-0001-000000000003', 'cycle2-admin-a@example.test'),
  ('c2c00001-0001-0001-0001-000000000004', 'cycle2-admin-b@example.test'),
  ('c2c00001-0001-0001-0001-000000000005', 'cycle2-other-user@example.test');
insert into profiles (user_id, full_name, email) values
  ('c2c00001-0001-0001-0001-000000000001', 'Cycle2 Planner', 'cycle2-planner@example.test'),
  ('c2c00001-0001-0001-0001-000000000002', 'Cycle2 Inspector', 'cycle2-inspector@example.test'),
  ('c2c00001-0001-0001-0001-000000000003', 'Cycle2 Admin A', 'cycle2-admin-a@example.test'),
  ('c2c00001-0001-0001-0001-000000000004', 'Cycle2 Admin B', 'cycle2-admin-b@example.test'),
  ('c2c00001-0001-0001-0001-000000000005', 'Cycle2 Other User', 'cycle2-other-user@example.test');
insert into user_roles (user_id, role_key) values
  ('c2c00001-0001-0001-0001-000000000001', 'planner'),
  ('c2c00001-0001-0001-0001-000000000002', 'inspector'),
  ('c2c00001-0001-0001-0001-000000000003', 'compliance_admin'),
  ('c2c00001-0001-0001-0001-000000000004', 'compliance_admin');

insert into packages (id, code, title) values
  ('c2c00002-0002-0002-0002-000000000001', 'C2-PKG', 'Cycle2 package');
insert into package_versions (id, package_id, version_label, status, definition, published_at) values
  ('c2c00002-0002-0002-0002-000000000002', 'c2c00002-0002-0002-0002-000000000001', '1', 'published', '{}', now());
insert into factories (
  id, factory_code, name, cr_number, license_number, region, city,
  official_lat, official_lng, source, is_temporary
) values
  ('c2c00003-0003-0003-0003-000000000001', 'C2-F1', 'Cycle2 factory', 'CR-C2', 'LIC-C2', 'Riyadh', 'Riyadh', 24.7136, 46.6753, 'senaei', false);
insert into visits (id, factory_id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, package_version_id) values
  ('c2c00004-0004-0004-0004-000000000001', 'c2c00003-0003-0003-0003-000000000001', 'periodic', 'physical', 'published', 'new', now(), now() + interval '1 hour', 'c2c00002-0002-0002-0002-000000000002');

do $def_wf_006$
declare v_ins uuid;
begin
  -- DEF-WF-006, leg 1: approving an inspection with NO submission_versions row
  -- must be rejected by the deferred constraint trigger. SET CONSTRAINTS
  -- ... IMMEDIATE forces the deferred check to run now instead of at commit
  -- (which this transaction never reaches — it always rolls back).
  insert into inspections (visit_id, package_version_id, status, started_at)
  values ('c2c00004-0004-0004-0004-000000000001', 'c2c00002-0002-0002-0002-000000000002', 'in_progress', now())
  returning id into v_ins;

  begin
    update inspections set status = 'approved' where id = v_ins;
    set constraints trg_guard_approved_requires_submission immediate;
    raise exception 'DEF-WF-006 probe FAIL: approval with zero submission_versions rows was NOT rejected';
  exception
    when others then
      if sqlerrm like 'DEF-WF-006 probe FAIL%' then raise; end if;
      if sqlerrm not like '%DEF-WF-006%' then
        raise exception 'DEF-WF-006 probe FAIL: unexpected error instead of the guard: %', sqlerrm;
      end if;
      raise notice 'DEF-WF-006 probe PASS (leg 1): approval without a submission version correctly rejected — %', sqlerrm;
  end;

  -- reset for leg 2 (the prior update was rolled back to its savepoint by the exception block)
  update inspections set status = 'in_progress' where id = v_ins;

  -- DEF-WF-006, leg 2: approving WITH a submission_versions row must succeed
  -- (the trigger must not be a blanket ban on approval).
  insert into submission_versions (inspection_id, version_number, snapshot, idempotency_key, acknowledgement, submitted_by, submitted_at)
  values (v_ins, 1, '{}'::jsonb, gen_random_uuid()::text, '{"name":"rep","signed":true}', 'c2c00001-0001-0001-0001-000000000002', now());
  update inspections set status = 'approved' where id = v_ins;
  set constraints trg_guard_approved_requires_submission immediate;
  raise notice 'DEF-WF-006 probe PASS (leg 2): approval WITH a submission version succeeds normally';
end
$def_wf_006$;

do $def_data_005$
begin
  begin
    insert into visits (factory_id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, package_version_id)
    values ('c2c00003-0003-0003-0003-000000000001', 'periodic', 'physical', 'draft', 'new', '2193-01-01', '2193-01-02', 'c2c00002-0002-0002-0002-000000000002');
    raise exception 'DEF-DATA-005 probe FAIL: year 2193 was NOT rejected';
  exception
    when others then
      if sqlerrm like 'DEF-DATA-005 probe FAIL%' then raise; end if;
      raise notice 'DEF-DATA-005 probe PASS: implausible year 2193 correctly rejected — %', sqlerrm;
  end;

  -- a plausible year must still be accepted
  insert into visits (factory_id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, package_version_id)
  values ('c2c00003-0003-0003-0003-000000000001', 'periodic', 'physical', 'draft', 'new', now() + interval '1 day', now() + interval '1 day 1 hour', 'c2c00002-0002-0002-0002-000000000002');
  raise notice 'DEF-DATA-005 probe PASS: a plausible-year visit is still accepted normally';
end
$def_data_005$;

do $scr_adm_080_rls$
declare v_rule uuid;
begin
  -- non-admin (planner) cannot create a notification rule
  select set_config('request.jwt.claim.sub', 'c2c00001-0001-0001-0001-000000000001', true) into v_rule; -- reuse var, value discarded
  set local role authenticated;
  begin
    insert into notification_rules (event_key, channel, recipient_role, template, status, created_by)
    values ('review_decision', 'inapp', 'reviewer', 'test template', 'draft', 'c2c00001-0001-0001-0001-000000000001')
    returning id into v_rule;
    raise exception 'SCR-ADM-080 RLS probe FAIL: a planner (non-admin) inserted a notification rule';
  exception
    when others then
      if sqlerrm like 'SCR-ADM-080%' then raise; end if;
      raise notice 'SCR-ADM-080 RLS probe PASS: non-admin insert correctly denied — %', sqlerrm;
  end;

  -- admin A creates a draft; admin B (a distinct approver) publishes it; admin A cannot self-approve
  perform set_config('request.jwt.claim.sub', 'c2c00001-0001-0001-0001-000000000003', true);
  insert into notification_rules (event_key, channel, recipient_role, template, status, created_by)
  values ('review_decision', 'push', 'reviewer', 'test template', 'draft', 'c2c00001-0001-0001-0001-000000000003')
  returning id into v_rule;

  begin
    perform publish_notification_rule(v_rule);
    raise exception 'SCR-ADM-080 maker-checker probe FAIL: creator was able to self-approve their own draft';
  exception
    when others then
      if sqlerrm like 'SCR-ADM-080%' then raise; end if;
      raise notice 'SCR-ADM-080 maker-checker probe PASS: self-approval correctly rejected — %', sqlerrm;
  end;

  perform set_config('request.jwt.claim.sub', 'c2c00001-0001-0001-0001-000000000004', true);
  perform publish_notification_rule(v_rule);
  raise notice 'SCR-ADM-080 maker-checker probe PASS: a distinct admin approver publishes successfully';
end
$scr_adm_080_rls$;

do $def_prf_003_rls$
begin
  -- a user may write their own notification_preferences row
  perform set_config('request.jwt.claim.sub', 'c2c00001-0001-0001-0001-000000000005', true);
  insert into notification_preferences (user_id, push_enabled, sms_enabled, email_enabled)
  values ('c2c00001-0001-0001-0001-000000000005', false, true, true);
  raise notice 'DEF-PRF-003 RLS probe PASS: a user can write their own notification_preferences row';

  -- a different user may not overwrite someone else's row
  perform set_config('request.jwt.claim.sub', 'c2c00001-0001-0001-0001-000000000001', true);
  begin
    update notification_preferences set push_enabled = true where user_id = 'c2c00001-0001-0001-0001-000000000005';
    if found then
      raise exception 'DEF-PRF-003 RLS probe FAIL: a different authenticated user updated someone else''s notification_preferences row';
    end if;
    raise notice 'DEF-PRF-003 RLS probe PASS: cross-user update affected zero rows (RLS filtered silently, PostgREST-style)';
  end;
end
$def_prf_003_rls$;

rollback;
