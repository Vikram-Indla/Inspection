-- M7 / PLN-CON-003 · capability reconciliation (SAQEEL Planning convergence)
-- CREATE OR REPLACE of the two guarded atomic publishers from
-- 20260714091727_planning_publish_guards.sql with EXACTLY TWO deliberate
-- behavioral changes; every other guard, advisory lock, transition,
-- notification and errcode is preserved byte-for-byte:
--
--   1. ROLE GATE WIDENED — has_role('planner') becomes
--      has_role('planner') OR has_planning_capability('planning.publish').
--      The planning pages/actions have been capability-gated since M4/M6 while
--      the RPCs still enforced the legacy Planner role (the documented
--      asymmetry: a Reviewer persona could stage, validate and save drafts but
--      publish failed inside the transaction). The RPC now agrees with the
--      page. planner keeps working unchanged (planner holds the seeded
--      planning.publish grant, so both sides of the OR are true for it).
--
--   2. PACKAGE GUARD ACCEPTS NULL — Report Package is OPTIONAL during
--      planning (canonical plan §10/§14: "package selection is not one of the
--      mandatory preconditions"; when none is selected publish remains
--      allowed and the inspector chooses eligible package(s) during
--      preparation). A NULL p_package_version_id therefore skips the
--      availability check and lands NULL on the visit row. A NON-NULL id is
--      validated exactly as before (same errcode 22023, same message).
--      visits.package_version_id stays the first/primary package; every
--      selected package is additionally linked with an immutable snapshot in
--      visit_packages by the action layer (outside this transaction —
--      documented gap, best-effort + logged).
--
-- NOT applied by the authoring session — reviewed and applied by the repo
-- owner. Until applied, staging still enforces has_role('planner') AND a
-- non-null package: zero-package publish and reviewer publish are marked
-- pending-migration in the e2e specs.
--
-- Everything below is verbatim from 20260714091727 except the two gates.

create or replace function publish_bulk_plan(
  p_factory_ids        uuid[],
  p_package_version_id uuid,
  p_window_start       timestamptz,
  p_window_end         timestamptz,
  p_visit_type         text,
  p_notes              text,
  p_manual             jsonb,
  p_auto_pool          uuid[] -- retained for API compatibility; deliberately ignored
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor      uuid := auth.uid();
  v_plan_id    uuid;
  v_fid        uuid;
  v_visit_id   uuid;
  v_inspector  uuid;
  v_method     assignment_method;
  v_factory_ids uuid[];
begin
  -- M7 change 1/2 — capability OR legacy role (was: has_role('planner') only)
  if v_actor is null or not (has_role('planner') or has_planning_capability('planning.publish')) then
    raise exception 'bulk publish unauthorized' using errcode = '42501';
  end if;
  if p_factory_ids is null or coalesce(array_length(p_factory_ids, 1), 0) = 0
     or array_length(p_factory_ids, 1) > 500 then
    raise exception 'bulk publish target set invalid' using errcode = '22023';
  end if;
  select array_agg(distinct fid order by fid) into v_factory_ids from unnest(p_factory_ids) fid;
  if array_length(v_factory_ids, 1) <> array_length(p_factory_ids, 1) then
    raise exception 'bulk publish target set contains duplicates' using errcode = '22023';
  end if;
  if p_visit_type <> 'periodic' then
    raise exception 'bulk publish visit type invalid' using errcode = '22023';
  end if;
  if p_window_start is null or p_window_end is null or p_window_end <= p_window_start then
    raise exception 'bulk publish window invalid' using errcode = '22023';
  end if;
  -- M7 change 2/2 — NULL package is allowed (preparation-time choice);
  -- a non-null package is validated exactly as before.
  if p_package_version_id is not null and not exists (
    select 1 from package_versions pv
     where pv.id = p_package_version_id and pv.status in ('published', 'locked')
  ) then
    raise exception 'bulk publish package unavailable' using errcode = '22023';
  end if;
  if (select count(*) from factories f where f.id = any(v_factory_ids)) <> array_length(v_factory_ids, 1) then
    raise exception 'bulk publish target unavailable' using errcode = '22023';
  end if;
  if p_manual is null or jsonb_typeof(p_manual) <> 'object' then
    raise exception 'bulk publish assignment map invalid' using errcode = '22023';
  end if;

  -- Lock every target in stable order so two concurrent planners cannot both
  -- pass the active-visit check for the same factory/type.
  foreach v_fid in array v_factory_ids loop
    perform pg_advisory_xact_lock(hashtextextended('planning-factory:' || v_fid::text, 0));
  end loop;
  if exists (
    select 1 from visits v
     where v.factory_id = any(v_factory_ids)
       and v.visit_type = p_visit_type
       and v.planning_status in ('draft', 'validated', 'published', 'returned')
  ) then
    raise exception 'bulk publish duplicate active visit' using errcode = '23505';
  end if;

  insert into visit_plans (method, status, created_by, criteria)
  values ('bulk', 'draft', v_actor, jsonb_build_object('selected', array_length(v_factory_ids, 1)))
  returning id into v_plan_id;

  foreach v_fid in array v_factory_ids loop
    v_inspector := nullif(p_manual ->> v_fid::text, '')::uuid;
    if v_inspector is not null then
      if not exists (select 1 from user_roles ur where ur.user_id = v_inspector and ur.role_key = 'inspector') then
        raise exception 'bulk publish inspector ineligible' using errcode = '22023';
      end if;
      v_method := 'manual';
    else
      select ur.user_id into v_inspector
        from user_roles ur
       where ur.role_key = 'inspector'
         and not exists (
           select 1 from assignments a join visits v on v.id = a.visit_id
            where a.inspector_id = ur.user_id
              and v.planning_status in ('draft', 'validated', 'published', 'returned')
              and v.window_start < p_window_end and v.window_end > p_window_start
         )
       order by ur.user_id
       limit 1;
      v_method := 'automatic';
    end if;
    if v_inspector is null then
      raise exception 'bulk publish no inspector available' using errcode = 'P0001';
    end if;
    if exists (
      select 1 from assignments a join visits v on v.id = a.visit_id
       where a.inspector_id = v_inspector
         and v.planning_status in ('draft', 'validated', 'published', 'returned')
         and v.window_start < p_window_end and v.window_end > p_window_start
    ) then
      raise exception 'bulk publish inspector unavailable' using errcode = '23505';
    end if;

    insert into visits (
      visit_plan_id, factory_id, visit_type, execution_mode, planning_status,
      window_start, window_end, package_version_id, notes
    ) values (
      v_plan_id, v_fid, p_visit_type, 'physical', 'draft',
      p_window_start, p_window_end, p_package_version_id, nullif(btrim(p_notes), '')
    ) returning id into v_visit_id;

    insert into assignments (visit_id, inspector_id, method, candidates)
    values (
      v_visit_id, v_inspector, v_method,
      case when v_method = 'automatic'
        then jsonb_build_object('chosen', v_inspector, 'reason', 'first available in window')
        else null end
    );
  end loop;

  -- STM-PLAN-001 then STM-PLAN-002. Both transitions and every side effect
  -- are captured by the existing append-only audit triggers in this txn.
  update visit_plans set status = 'validated' where id = v_plan_id and status = 'draft';
  if not found then raise exception 'bulk plan validation transition failed' using errcode = 'P0001'; end if;
  update visits set planning_status = 'published' where visit_plan_id = v_plan_id and planning_status = 'draft';
  update visit_plans set status = 'published', published_at = now()
   where id = v_plan_id and status = 'validated';
  if not found then raise exception 'bulk plan publish transition failed' using errcode = 'P0001'; end if;

  insert into notifications (event_key, recipient, payload, channel)
  select 'assignment', a.inspector_id, jsonb_build_object('visit_id', a.visit_id), 'push'
    from assignments a join visits v on v.id = a.visit_id
   where v.visit_plan_id = v_plan_id;

  return v_plan_id;
end;
$$;

comment on function publish_bulk_plan is
  'CD-021 guarded atomic publisher: server-derived eligibility, concurrency guards, STM-PLAN-001/002, notification and audit in one transaction. M7: capability gate (planning.publish OR planner role); NULL package allowed (PLN-CON-003).';

create or replace function publish_single_visit(
  p_factory_id          uuid,
  p_package_version_id  uuid,
  p_inspector_id        uuid,
  p_visit_type          text,
  p_execution_mode      execution_mode,
  p_window_start        timestamptz,
  p_window_end          timestamptz,
  p_license_number      text,
  p_location_confirmed  boolean,
  p_planner_lat         numeric,
  p_planner_lng         numeric,
  p_notes               text,
  p_resume_plan_id      uuid default null
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor       uuid := auth.uid();
  v_factory     factories%rowtype;
  v_plan_id     uuid;
  v_visit_id    uuid;
  v_inspector   uuid;
  v_method      assignment_method;
  v_has_location boolean;
begin
  -- M7 change 1/2 — capability OR legacy role (was: has_role('planner') only)
  if v_actor is null or not (has_role('planner') or has_planning_capability('planning.publish')) then
    raise exception 'single publish unauthorized' using errcode = '42501';
  end if;
  if p_visit_type not in ('periodic', 'follow_up', 'complaint') then
    raise exception 'single publish visit type invalid' using errcode = '22023';
  end if;
  if p_window_start is null or p_window_end is null or p_window_end <= p_window_start then
    raise exception 'single publish window invalid' using errcode = '22023';
  end if;
  if not coalesce(p_location_confirmed, false) then
    raise exception 'single publish location unconfirmed' using errcode = '22023';
  end if;
  if (p_planner_lat is null) <> (p_planner_lng is null)
     or p_planner_lat not between -90 and 90
     or p_planner_lng not between -180 and 180 then
    raise exception 'single publish planner location invalid' using errcode = '22023';
  end if;
  -- M7 change 2/2 — NULL package is allowed (preparation-time choice);
  -- a non-null package is validated exactly as before.
  if p_package_version_id is not null and not exists (
    select 1 from package_versions pv
     where pv.id = p_package_version_id and pv.status in ('published', 'locked')
  ) then
    raise exception 'single publish package unavailable' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('planning-factory:' || p_factory_id::text, 0));
  select * into v_factory from factories where id = p_factory_id;
  if not found then raise exception 'single publish factory unavailable' using errcode = '22023'; end if;
  if v_factory.license_number is not null and p_license_number is distinct from v_factory.license_number then
    raise exception 'single publish license mismatch' using errcode = '22023';
  end if;
  v_has_location := (v_factory.official_lat is not null and v_factory.official_lng is not null)
                    or (p_planner_lat is not null and p_planner_lng is not null);
  if not v_has_location then raise exception 'single publish location unavailable' using errcode = '22023'; end if;
  if p_execution_mode = 'virtual' and not exists (select 1 from engine_settings where engine = 'otp') then
    raise exception 'single publish virtual mode unavailable' using errcode = '22023';
  end if;
  if exists (
    select 1 from visits v where v.factory_id = p_factory_id and v.visit_type = p_visit_type
      and v.planning_status in ('draft', 'validated', 'published', 'returned')
  ) then
    raise exception 'single publish duplicate active visit' using errcode = '23505';
  end if;

  if p_inspector_id is null then
    select ur.user_id into v_inspector
      from user_roles ur
     where ur.role_key = 'inspector'
       and not exists (
         select 1 from assignments a join visits v on v.id = a.visit_id
          where a.inspector_id = ur.user_id
            and v.planning_status in ('draft', 'validated', 'published', 'returned')
            and v.window_start < p_window_end and v.window_end > p_window_start
       )
     order by ur.user_id limit 1;
    v_method := 'automatic';
  else
    if not exists (select 1 from user_roles ur where ur.user_id = p_inspector_id and ur.role_key = 'inspector') then
      raise exception 'single publish inspector ineligible' using errcode = '22023';
    end if;
    if exists (
      select 1 from assignments a join visits v on v.id = a.visit_id
       where a.inspector_id = p_inspector_id
         and v.planning_status in ('draft', 'validated', 'published', 'returned')
         and v.window_start < p_window_end and v.window_end > p_window_start
    ) then
      raise exception 'single publish inspector unavailable' using errcode = '23505';
    end if;
    v_inspector := p_inspector_id;
    v_method := 'manual';
  end if;
  if v_inspector is null then raise exception 'single publish no inspector available' using errcode = 'P0001'; end if;

  if p_resume_plan_id is not null then
    select vp.id into v_plan_id from visit_plans vp
     where vp.id = p_resume_plan_id and vp.created_by = v_actor
       and vp.method = 'single' and vp.status = 'draft'
       and not exists (select 1 from visits v where v.visit_plan_id = vp.id)
     for update;
    if v_plan_id is null then raise exception 'single publish resume unavailable' using errcode = '22023'; end if;
  else
    insert into visit_plans (method, status, created_by)
    values ('single', 'draft', v_actor) returning id into v_plan_id;
  end if;

  insert into visits (
    visit_plan_id, factory_id, visit_type, execution_mode, planning_status,
    window_start, window_end, package_version_id, planner_lat, planner_lng, notes
  ) values (
    v_plan_id, p_factory_id, p_visit_type, p_execution_mode, 'draft',
    p_window_start, p_window_end, p_package_version_id, p_planner_lat, p_planner_lng,
    nullif(btrim(p_notes), '')
  ) returning id into v_visit_id;

  insert into assignments (visit_id, inspector_id, method, candidates)
  values (
    v_visit_id, v_inspector, v_method,
    case when v_method = 'automatic'
      then jsonb_build_object('chosen', v_inspector, 'reason', 'first available in window')
      else null end
  );

  update visit_plans set status = 'validated' where id = v_plan_id and status = 'draft';
  if not found then raise exception 'single plan validation transition failed' using errcode = 'P0001'; end if;
  update visits set planning_status = 'published' where id = v_visit_id and planning_status = 'draft';
  update visit_plans set status = 'published', published_at = now()
   where id = v_plan_id and status = 'validated';
  if not found then raise exception 'single plan publish transition failed' using errcode = 'P0001'; end if;

  insert into notifications (event_key, recipient, payload, channel)
  values ('assignment', v_inspector, jsonb_build_object('visit_id', v_visit_id), 'push');
  return v_visit_id;
end;
$$;

comment on function publish_single_visit is
  'CD-022 guarded atomic publisher: identity/package/location/assignment revalidation, STM-PLAN-001/002, notification and audit in one transaction. M7: capability gate (planning.publish OR planner role); NULL package allowed (PLN-CON-003).';

grant execute on function publish_bulk_plan to authenticated;
grant execute on function publish_single_visit to authenticated;
