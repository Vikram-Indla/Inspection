-- CD-023 (SCR-WEB-130) — source-faithful Immediate Visit creation.
--
-- Realizes MVP1-M01-043..052 and MVP1-M02-012 as one RLS-enforced,
-- idempotent transaction. Planner-created Immediate Visits require a review,
-- an explicit window and an eligible inspector. Inspector-created Immediate
-- Visits self-assign and use a zero-duration "start now" window because the
-- source expressly makes Visit Window planner-only (M01-047/-051).
--
-- The RPC is SECURITY INVOKER: existing and narrow CD-023 policies remain the
-- authorization boundary. Business blockers are returned (not raised), so the
-- attempted planning action can be retained in the immutable audit trail.

-- M01-045 permits an unregistered factory with any available business
-- identity; factory name, CR and licence are each optional. Keep the platform's
-- non-null display-name invariant by marking a clearly technical label when no
-- name was reported. The label is never represented as source-owned master data.
alter table factories add column if not exists name_is_system_generated boolean not null default false;
update factories
   set name = 'Unregistered factory ' || left(id::text, 8),
       name_is_system_generated = true
 where is_temporary and name is null;
alter table factories drop constraint if exists factories_registered_name_required;
alter table factories alter column name set not null;

-- Immediate provenance and request id are explicit instead of being embedded
-- in notes. The request id is the idempotency key for double-submit/retry.
alter table visits add column if not exists created_by uuid references profiles(user_id);
alter table visits add column if not exists immediate_creator_role text;
alter table visits add column if not exists immediate_reason text;
alter table visits add column if not exists creation_request_id uuid;
alter table visits add column if not exists visit_location_source text;

alter table visits drop constraint if exists visits_immediate_creator_role_check;
alter table visits add constraint visits_immediate_creator_role_check
  check (immediate_creator_role is null or immediate_creator_role in ('planner','inspector'));
alter table visits drop constraint if exists visits_location_source_check;
alter table visits add constraint visits_location_source_check
  check (visit_location_source is null or visit_location_source in ('official','manual'));

create unique index if not exists visits_creation_request_unique
  on visits (creation_request_id) where creation_request_id is not null;

-- One Visit has one current assignment. The live preflight for this migration
-- found 101 assignment rows and zero duplicate visit_ids (2026-07-13).
create unique index if not exists assignments_one_per_visit on assignments (visit_id);

-- Preserve the existing positive window rule, with one exact source exception:
-- an inspector-created Immediate Visit starts now and therefore has one instant
-- (window_start = window_end), not an invented duration.
alter table visits drop constraint if exists window_order;
alter table visits add constraint window_order check (
  window_end > window_start
  or (
    visit_plan_id is null
    and immediate_creator_role = 'inspector'
    and window_end = window_start
  )
);

-- Narrow Inspector write grants for the source-authorized immediate path.
drop policy if exists factories_insert_immediate_inspector on factories;
create policy factories_insert_immediate_inspector on factories
  for insert with check (
    has_role('inspector')
    and is_temporary
    and source = 'immediate_manual'
    and official_lat is null
    and official_lng is null
  );

drop policy if exists visits_insert_immediate_inspector on visits;
create policy visits_insert_immediate_inspector on visits
  for insert with check (
    has_role('inspector')
    and visit_plan_id is null
    and created_by = auth.uid()
    and immediate_creator_role = 'inspector'
    and creation_request_id is not null
    and planning_status = 'published'
    and operational_state = 'new'
    and execution_mode = 'physical'
    and window_start = window_end
    and planner_lat is not null and planner_lat between -90 and 90
    and planner_lng is not null and planner_lng between -180 and 180
    and visit_location_source in ('official','manual')
    and nullif(btrim(immediate_reason), '') is not null
    and exists (
      select 1 from package_versions pv
       where pv.id = package_version_id and pv.status in ('published','locked')
    )
  );

create or replace function is_owned_inspector_immediate(p_visit uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from visits v
     where v.id = p_visit
       and v.visit_plan_id is null
       and v.created_by = auth.uid()
       and v.immediate_creator_role = 'inspector'
  )
$$;

drop policy if exists assignments_insert_immediate_inspector on assignments;
create policy assignments_insert_immediate_inspector on assignments
  for insert with check (
    has_role('inspector')
    and inspector_id = auth.uid()
    and is_owned_inspector_immediate(visit_id)
  );

-- Close the generic audit gap identified by the independent wiring audit.
drop trigger if exists trg_audit_factories on factories;
create trigger trg_audit_factories
  after insert or update or delete on factories
  for each row execute function audit_row_change();

drop trigger if exists trg_audit_notifications on notifications;
create trigger trg_audit_notifications
  after insert or update or delete on notifications
  for each row execute function audit_row_change();

-- Trusted append helper: it can only attribute the event to the authenticated
-- caller and only to this fixed CD-023 object type. Audit rows remain immutable.
create or replace function audit_immediate_attempt(
  p_request uuid,
  p_action text,
  p_state jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_visit uuid;
  v_state jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if p_action not in ('BLOCKED','CREATED','IDEMPOTENT_REPLAY') then
    raise exception 'invalid immediate audit action';
  end if;
  if p_action = 'BLOCKED' and coalesce(p_state->>'code', '') not in (
    'unauthorized','invalid_actor_mode','location_required','location_source_invalid',
    'reason_required','visit_type_invalid','package_unavailable','review_required',
    'window_invalid','factory_unavailable','identity_required','factory_identity_match',
    'duplicate_active_visit','inspector_ineligible','inspector_unavailable',
    'no_inspector_available','concurrent_conflict','system_error'
  ) then
    raise exception 'invalid immediate blocker code';
  end if;
  if p_action in ('CREATED','IDEMPOTENT_REPLAY') then
    begin v_visit := nullif(p_state->>'visit_id', '')::uuid;
    exception when invalid_text_representation then
      raise exception 'invalid immediate audit visit';
    end;
    if not exists (
      select 1 from visits v
       where v.id = v_visit
         and v.creation_request_id = p_request
         and v.created_by = v_actor
    ) then
      raise exception 'immediate audit visit does not belong to request actor';
    end if;
  end if;
  -- Store only governed fields; callers cannot smuggle arbitrary state into
  -- the immutable audit trail through this narrowly executable helper.
  v_state := jsonb_strip_nulls(jsonb_build_object(
    'code', p_state->>'code',
    'actor_mode', p_state->>'actor_mode',
    'visit_id', case when v_visit is not null then v_visit end,
    'factory_id', p_state->>'factory_id',
    'assigned_inspector', p_state->>'assigned_inspector',
    'notification_queued', p_state->'notification_queued'
  ));
  insert into audit_events (
    actor, object_type, object_id, action, after_state, requirement_refs
  ) values (
    v_actor, 'immediate_visit_request', p_request, p_action, v_state,
    array[
      'MVP1-M01-043','MVP1-M01-044','MVP1-M01-045','MVP1-M01-046',
      'MVP1-M01-047','MVP1-M01-048','MVP1-M01-049','MVP1-M01-050',
      'MVP1-M01-051','MVP1-M01-052','MVP1-M02-012'
    ]
  );
end;
$$;
revoke all on function audit_immediate_attempt(uuid, text, jsonb) from public;
grant execute on function audit_immediate_attempt(uuid, text, jsonb) to authenticated;

create or replace function create_immediate_visit(
  p_request_id uuid,
  p_actor_mode text,
  p_existing_factory_id uuid,
  p_manual_name text,
  p_manual_cr text,
  p_manual_license text,
  p_manual_activity text,
  p_manual_region text,
  p_manual_city text,
  p_lat numeric,
  p_lng numeric,
  p_location_source text,
  p_reason text,
  p_package_version_id uuid,
  p_visit_type text,
  p_priority text,
  p_notes text,
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_inspector_id uuid,
  p_review_confirmed boolean
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_factory uuid;
  v_visit uuid;
  v_assigned uuid;
  v_now timestamptz;
  v_pool uuid[] := '{}'::uuid[];
  v_available uuid[] := '{}'::uuid[];
  v_method assignment_method;
  v_creator_role text;
  v_identity_locks text[] := '{}'::text[];
  v_lock_key text;
  v_match record;
begin
  if v_actor is null then
    return jsonb_build_object('status','blocked','code','auth_required');
  end if;

  -- Serialize equal request IDs so concurrent double-submit replays the row
  -- created by the first transaction instead of racing the unique index.
  perform pg_advisory_xact_lock(hashtextextended('cd023-request:' || p_request_id::text, 0));
  select id, immediate_creator_role into v_visit, v_creator_role from visits
   where creation_request_id = p_request_id and created_by = v_actor;
  if v_visit is not null then
    perform audit_immediate_attempt(
      p_request_id, 'IDEMPOTENT_REPLAY',
      jsonb_build_object('visit_id', v_visit, 'actor_mode', v_creator_role)
    );
    return jsonb_build_object('status','ok','visit_id',v_visit,'replayed',true,'actor_mode',v_creator_role);
  end if;

  if p_actor_mode = 'planner' then
    if not has_role('planner') then
      perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','unauthorized','actor_mode',p_actor_mode));
      return jsonb_build_object('status','blocked','code','unauthorized');
    end if;
  elsif p_actor_mode = 'inspector' then
    if not has_role('inspector') then
      perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','unauthorized','actor_mode',p_actor_mode));
      return jsonb_build_object('status','blocked','code','unauthorized');
    end if;
  else
    perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','invalid_actor_mode'));
    return jsonb_build_object('status','blocked','code','invalid_actor_mode');
  end if;

  if p_lat is null or p_lng is null
     or p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then
    perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','location_required','actor_mode',p_actor_mode));
    return jsonb_build_object('status','blocked','code','location_required','field','location');
  end if;
  if p_location_source not in ('official','manual') then
    perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','location_source_invalid','actor_mode',p_actor_mode));
    return jsonb_build_object('status','blocked','code','location_source_invalid','field','location');
  end if;
  if nullif(btrim(p_reason), '') is null then
    perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','reason_required','actor_mode',p_actor_mode));
    return jsonb_build_object('status','blocked','code','reason_required','field','reason');
  end if;
  if p_visit_type not in ('complaint','follow_up','periodic') then
    perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','visit_type_invalid','actor_mode',p_actor_mode));
    return jsonb_build_object('status','blocked','code','visit_type_invalid','field','visit_type');
  end if;
  if not exists (
    select 1 from package_versions pv
     where pv.id = p_package_version_id and pv.status in ('published','locked')
  ) then
    perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','package_unavailable','actor_mode',p_actor_mode));
    return jsonb_build_object('status','blocked','code','package_unavailable','field','package');
  end if;

  if p_actor_mode = 'planner' then
    if not coalesce(p_review_confirmed, false) then
      perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','review_required','actor_mode',p_actor_mode));
      return jsonb_build_object('status','blocked','code','review_required','field','review');
    end if;
    if p_window_start is null or p_window_end is null or p_window_end <= p_window_start then
      perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','window_invalid','actor_mode',p_actor_mode));
      return jsonb_build_object('status','blocked','code','window_invalid','field','window');
    end if;
  else
    v_now := clock_timestamp();
    p_window_start := v_now;
    p_window_end := v_now;
  end if;

  if p_existing_factory_id is not null then
    select id into v_factory from factories where id = p_existing_factory_id;
    if v_factory is null then
      perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','factory_unavailable','actor_mode',p_actor_mode));
      return jsonb_build_object('status','blocked','code','factory_unavailable','field','identity');
    end if;
    v_identity_locks := array['factory:' || v_factory::text];
  else
    if nullif(btrim(p_manual_name), '') is null
       and nullif(btrim(p_manual_cr), '') is null
       and nullif(btrim(p_manual_license), '') is null
       and nullif(btrim(p_manual_activity), '') is null then
      perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','identity_required','actor_mode',p_actor_mode));
      return jsonb_build_object('status','blocked','code','identity_required','field','identity');
    end if;
    select coalesce(array_agg(k order by k), '{}'::text[])
      into v_identity_locks
      from unnest(array[
        case when nullif(btrim(p_manual_cr), '') is not null
          then 'manual-cr:' || lower(btrim(p_manual_cr)) end,
        case when nullif(btrim(p_manual_license), '') is not null
          then 'manual-license:' || lower(btrim(p_manual_license)) end,
        case when nullif(btrim(p_manual_cr), '') is null
               and nullif(btrim(p_manual_license), '') is null
          then 'manual-fallback:' || lower(coalesce(
            nullif(btrim(p_manual_name), ''), nullif(btrim(p_manual_activity), '')
          )) end
      ]) k
     where k is not null;
  end if;

  -- Acquire every available identity key in stable lexical order. This prevents
  -- same-CR/same-license races without deadlocking cross-key submissions.
  foreach v_lock_key in array v_identity_locks loop
    perform pg_advisory_xact_lock(hashtextextended('cd023-identity:' || v_lock_key, 0));
  end loop;

  if p_location_source = 'official' then
    if v_factory is null or not exists (
      select 1 from factories f
       where f.id = v_factory
         and f.official_lat is not null and f.official_lng is not null
         and f.official_lat = p_lat and f.official_lng = p_lng
    ) then
      perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','location_source_invalid','actor_mode',p_actor_mode));
      return jsonb_build_object('status','blocked','code','location_source_invalid','field','location');
    end if;
  elsif p_existing_factory_id is null and p_location_source <> 'manual' then
    perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','location_source_invalid','actor_mode',p_actor_mode));
    return jsonb_build_object('status','blocked','code','location_source_invalid','field','location');
  end if;

  if v_factory is null then
    select f.id, f.name, f.is_temporary into v_match
      from factories f
     where (nullif(btrim(p_manual_cr), '') is not null and f.cr_number = btrim(p_manual_cr))
        or (nullif(btrim(p_manual_license), '') is not null and f.license_number = btrim(p_manual_license))
     order by f.is_temporary, f.created_at
     limit 1;
    if v_match.id is not null then
      perform audit_immediate_attempt(
        p_request_id,'BLOCKED',
        jsonb_build_object('code','factory_identity_match','factory_id',v_match.id,'actor_mode',p_actor_mode)
      );
      return jsonb_build_object('status','blocked','code','factory_identity_match','field','identity','factory_id',v_match.id);
    end if;

    insert into factories (
      name, name_is_system_generated, cr_number, license_number, region, city, activity_class,
      source, is_temporary
    ) values (
      coalesce(nullif(btrim(p_manual_name), ''), 'Unregistered factory ' || left(p_request_id::text, 8)),
      nullif(btrim(p_manual_name), '') is null, nullif(btrim(p_manual_cr), ''),
      nullif(btrim(p_manual_license), ''), nullif(btrim(p_manual_region), ''),
      nullif(btrim(p_manual_city), ''), nullif(btrim(p_manual_activity), ''),
      'immediate_manual', true
    ) returning id into v_factory;
  end if;

  if exists (
    select 1 from visits v
     where v.factory_id = v_factory
       and v.planning_status in ('draft','published','returned')
  ) then
    perform audit_immediate_attempt(
      p_request_id,'BLOCKED',
      jsonb_build_object('code','duplicate_active_visit','factory_id',v_factory,'actor_mode',p_actor_mode)
    );
    -- If this transaction just created a temporary factory, returning would
    -- retain it. Delete it before the blocker result; its insert+delete remain
    -- visible in immutable audit, while no orphan entity remains.
    if p_existing_factory_id is null then delete from factories where id = v_factory; end if;
    return jsonb_build_object('status','blocked','code','duplicate_active_visit','field','identity','factory_id',v_factory);
  end if;

  if p_actor_mode = 'inspector' then
    v_assigned := v_actor;
    v_method := 'manual';
  else
    select coalesce(array_agg(ur.user_id order by ur.user_id), '{}'::uuid[])
      into v_pool
      from user_roles ur where ur.role_key = 'inspector';
    select coalesce(array_agg(candidate order by candidate), '{}'::uuid[])
      into v_available
      from unnest(v_pool) candidate
     where not exists (
       select 1
         from assignments a join visits v on v.id = a.visit_id
        where a.inspector_id = candidate
          and v.planning_status in ('draft','published','returned')
          and v.window_start < p_window_end
          and v.window_end > p_window_start
     );

    if p_inspector_id is null then
      v_assigned := v_available[1];
      v_method := 'automatic';
    else
      if not (p_inspector_id = any(v_pool)) then
        if p_existing_factory_id is null then delete from factories where id = v_factory; end if;
        perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','inspector_ineligible','actor_mode',p_actor_mode));
        return jsonb_build_object('status','blocked','code','inspector_ineligible','field','inspector');
      end if;
      if not (p_inspector_id = any(v_available)) then
        if p_existing_factory_id is null then delete from factories where id = v_factory; end if;
        perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','inspector_unavailable','actor_mode',p_actor_mode));
        return jsonb_build_object('status','blocked','code','inspector_unavailable','field','inspector');
      end if;
      v_assigned := p_inspector_id;
      v_method := 'manual';
    end if;
    if v_assigned is null then
      if p_existing_factory_id is null then delete from factories where id = v_factory; end if;
      perform audit_immediate_attempt(p_request_id,'BLOCKED',jsonb_build_object('code','no_inspector_available','actor_mode',p_actor_mode));
      return jsonb_build_object('status','blocked','code','no_inspector_available','field','inspector');
    end if;
  end if;

  -- Generate the id before INSERT. An Inspector cannot SELECT the new Visit
  -- until its self-assignment exists (inspector_own_visits); INSERT RETURNING
  -- would therefore correctly fail the SELECT policy between those two writes.
  v_visit := gen_random_uuid();
  insert into visits (
    id, visit_plan_id, factory_id, visit_type, execution_mode, planning_status,
    operational_state, window_start, window_end, priority, notes,
    planner_lat, planner_lng, package_version_id, created_by,
    immediate_creator_role, immediate_reason, creation_request_id, visit_location_source
  ) values (
    v_visit, null, v_factory, p_visit_type, 'physical', 'published',
    'new', p_window_start, p_window_end, nullif(btrim(p_priority), ''),
    nullif(btrim(p_notes), ''), p_lat, p_lng, p_package_version_id, v_actor,
    p_actor_mode, btrim(p_reason), p_request_id, p_location_source
  );

  insert into assignments (visit_id, inspector_id, method, candidates)
  values (
    v_visit, v_assigned, v_method,
    case when v_method = 'automatic'
      then jsonb_build_object('pool',v_pool,'available',v_available,'chosen',v_assigned)
      else null end
  );

  -- M01-052: notification only when the Planner assigns another Inspector.
  if p_actor_mode = 'planner' then
    insert into notifications (
      event_key, recipient, payload, channel, delivery_state
    ) values (
      'assignment', v_assigned,
      jsonb_build_object('visit_id',v_visit,'immediate',true),
      'push', 'not_configured'
    );
  end if;

  perform audit_immediate_attempt(
    p_request_id,'CREATED',
    jsonb_build_object(
      'visit_id',v_visit,'factory_id',v_factory,'assigned_inspector',v_assigned,
      'actor_mode',p_actor_mode,'notification_queued',p_actor_mode = 'planner'
    )
  );
  return jsonb_build_object(
    'status','ok','visit_id',v_visit,'factory_id',v_factory,
    'assigned_inspector',v_assigned,'actor_mode',p_actor_mode,'replayed',false
  );
exception when unique_violation then
  -- The advisory request lock makes this path defensive only. If a historical
  -- or external direct write races a uniqueness guard, return a neutral code.
  perform audit_immediate_attempt(
    p_request_id,'BLOCKED',jsonb_build_object('code','concurrent_conflict','actor_mode',p_actor_mode)
  );
  return jsonb_build_object('status','blocked','code','concurrent_conflict');
when others then
  -- PL/pgSQL rolls every write made inside the failed block back before this
  -- handler runs. Record the failed planning attempt in a fresh statement and
  -- expose only a stable neutral code — never SQLERRM or provider detail.
  perform audit_immediate_attempt(
    p_request_id,'BLOCKED',jsonb_build_object('code','system_error','actor_mode',p_actor_mode)
  );
  return jsonb_build_object('status','blocked','code','system_error');
end;
$$;

comment on function create_immediate_visit is
  'CD-023: atomic/idempotent Immediate Visit creation for Planner or Inspector; SECURITY INVOKER and RLS enforced; MVP1-M01-043..052/M02-012.';

grant execute on function create_immediate_visit(
  uuid,text,uuid,text,text,text,text,text,text,numeric,numeric,text,text,uuid,text,
  text,text,timestamptz,timestamptz,uuid,boolean
) to authenticated;
