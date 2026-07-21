-- TASK-EXECUTION-MODULE-001 · Phase 4A — Physical Journey, Cancellation & Location backend
-- SAQEEL-EXE-CANONICAL-PLAN v1.0 §11/§12/§13
--
-- Atomic journey start, the active-session cancellation request/decide
-- workflow, and the governed visit-location model. This migration is strictly
-- additive:
--   * journey_sessions / geo_events / visits / inspections / assignments keep
--     their columns and semantics; the only schema change is ONE nullable
--     provenance column (geo_events.source) and two NEW tables.
--   * Captured data is NEVER deleted anywhere in this migration: an approved
--     cancellation preserves responses/evidence/geo_events exactly as captured
--     (plan §12) — only lifecycle/status columns move.
--   * Location corrections are append-only and NEVER overwrite the Factory
--     360/Senaei master (factories.official_*) or the Planning visit location
--     (visits.planner_*); original and corrected stay visible side by side
--     (plan §13, D-014).
--   * The on_the_way / arrived legs still go through set_operational_state
--     (20260721130000) so the D-010 readiness guard and the STM-OPS legal-leg
--     semantics remain the single authority.
--
-- Stable error tokens (mapped to neutral codes in
-- apps/web/src/lib/execution/journey.ts):
--   EXE-JOURNEY-DENIED            insufficient_privilege — not the assigned
--                                 inspector or missing execution.start_journey
--   EXE-JOURNEY-VISIT-STATE       check_violation — visit missing / not
--                                 published / past the startable states
--   EXE-READY-REQUIRED            raise_exception — no confirmed Ready
--                                 preparation (token shared with Phase 3B)
--   EXE-JOURNEY-OUTSIDE-WINDOW    check_violation — now() outside
--                                 [window_start, window_end]
--   EXE-JOURNEY-PACKAGE-MISSING   check_violation — no frozen visit package
--                                 snapshot
--   EXE-JOURNEY-PACKAGE-INTEGRITY check_violation — snapshot checksum mismatch
--   EXE-JOURNEY-LOCATION-MISSING  check_violation — no dispatch coordinates
--                                 (planner pin or factory official)
--   EXE-JOURNEY-DEVICE-MISSING    check_violation — device_id /
--                                 application_version absent from p_device
--   EXE-CANCEL-DENIED             insufficient_privilege — caller lacks the
--                                 required capability for the endpoint
--   EXE-CANCEL-USE-PRESTART       check_violation — visit still pre-journey;
--                                 use the existing request_visit_cancellation
--                                 flag flow instead
--   EXE-CANCEL-VISIT-STATE        check_violation — visit missing / not
--                                 published / not in an active phase
--   EXE-CANCEL-REASON             check_violation — reason key not in the
--                                 governed engine_settings.field list
--   EXE-CANCEL-COMMENT            check_violation — comment mandatory for
--                                 reason 'other'
--   EXE-CANCEL-EVIDENCE           check_violation — evidence id not linked to
--                                 this visit
--   EXE-CANCEL-IDEMPOTENCY        check_violation — idempotency key missing
--   EXE-CANCEL-NOT-FOUND          check_violation — request id unknown
--   EXE-CANCEL-SELF-DECIDE        check_violation — requester may never decide
--                                 their own request
--   EXE-CANCEL-DECIDED            check_violation — request already decided
--                                 with a DIFFERENT outcome
--   EXE-CANCEL-DECISION-INVALID   check_violation — decision not
--                                 approve/reject
--   EXE-CANCEL-DECISION-REASON    check_violation — rejection reason mandatory
--   EXE-LOCATION-DENIED           insufficient_privilege — not the assigned
--                                 inspector or missing execution.arrive
--   EXE-LOCATION-VISIT-STATE      check_violation — visit missing / not
--                                 published / already submitted-or-later
--   EXE-LOCATION-REASON           check_violation — correction reason mandatory
--   EXE-LOCATION-RANGE            check_violation — lat/lng out of range
--   EXE-LOCATION-CONTEXT          check_violation — capture_context not
--                                 online/offline
--   EXE-LOCATION-EVIDENCE         check_violation — evidence id not linked to
--                                 this visit
--   EXE-ARRIVAL-DENIED            insufficient_privilege — not the assigned
--                                 inspector or missing execution.arrive
--   EXE-ARRIVAL-VISIT-STATE       check_violation — visit missing / not
--                                 published / not on_the_way / no active
--                                 journey
--   EXE-ARRIVAL-ACCURACY          check_violation — GPS accuracy worse than
--                                 gis.gps_accuracy_checkin_max_m
--   EXE-ARRIVAL-LOCATION-MISSING  check_violation — no effective target
--                                 coordinates (correction, planner or official)
--   EXE-ARRIVAL-OUTSIDE           NOT an exception — returned as a notice in
--                                 the result payload when the observed point
--                                 is outside the geofence; no state mutates

-- ---------- 1 · geo_events.source: nullable provenance (additive) -----------
-- The plan requires every location fact to carry its source (§13). geo_events
-- had no source column; this nullable addition records it on NEW rows only.
alter table public.geo_events add column if not exists source text;
comment on column public.geo_events.source is
  'Capture provenance (e.g. journey_start, confirm_arrival). Null on historical rows.';

-- ---------- 2 · cancellation_requests: the durable approval object ----------
-- One row per cancellation request against an ACTIVE visit (on_the_way /
-- arrived / executing). Pre-journey cancellation deliberately keeps using the
-- existing request_visit_cancellation flag flow (0020_fix_field_journey,
-- preserved per plan §12 and D-013). Writes are RPC-only: no insert/update/
-- delete policies.
create table if not exists public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete restrict,
  inspection_id uuid references public.inspections(id) on delete restrict,
  requested_by uuid not null references auth.users(id),
  requested_at timestamptz not null default now(),
  phase text not null check (phase in ('pre_execution', 'on_the_way', 'arrived', 'executing')),
  reason_key text not null,
  comment text,
  evidence_id uuid references public.evidence(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  decision_reason text,
  idempotency_key text unique not null,
  constraint cancellation_requests_decision_shape check (
    (status = 'pending' and decided_by is null and decided_at is null)
    or (status <> 'pending' and decided_at is not null)
  )
);

create index if not exists cancellation_requests_visit_idx
  on public.cancellation_requests (visit_id, requested_at desc);
create index if not exists cancellation_requests_pending_idx
  on public.cancellation_requests (status, requested_at) where status = 'pending';

alter table public.cancellation_requests enable row level security;
revoke all on table public.cancellation_requests from anon, authenticated;
grant select on table public.cancellation_requests to authenticated;
-- SELECT-only: every write goes through the definer RPCs below.

drop policy if exists cancellation_requests_read on public.cancellation_requests;
create policy cancellation_requests_read on public.cancellation_requests
  for select to authenticated
  using (
    requested_by = (select auth.uid())
    or public.has_any_role(array['ops', 'planner', 'leadership'])
  );

-- ---------- 3 · visit_location_corrections: append-only corrected location --
-- The inspector's corrected visit location (plan §13): applies to the CURRENT
-- visit only, never overwrites the Factory 360/Senaei master or the Planning
-- pin. Append-only — original and corrected remain visible and auditable.
create table if not exists public.visit_location_corrections (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete restrict,
  corrected_lat numeric(10,7) not null,
  corrected_lng numeric(10,7) not null,
  accuracy_m numeric,
  reason text not null,
  evidence_id uuid references public.evidence(id) on delete restrict,
  source text not null default 'inspector_field'
    check (source in ('inspector_field', 'operations')),
  corrected_by uuid not null references auth.users(id),
  corrected_at timestamptz not null default now(),
  capture_context text not null default 'online'
    check (capture_context in ('online', 'offline'))
);

create index if not exists visit_location_corrections_visit_idx
  on public.visit_location_corrections (visit_id, corrected_at desc);

alter table public.visit_location_corrections enable row level security;
revoke all on table public.visit_location_corrections from anon, authenticated;
grant select on table public.visit_location_corrections to authenticated;
-- SELECT-only: inserts happen exclusively inside correct_visit_location; the
-- guard trigger below blocks update/delete outright (append-only, §13).

drop policy if exists visit_location_corrections_read on public.visit_location_corrections;
create policy visit_location_corrections_read on public.visit_location_corrections
  for select to authenticated
  using (
    public.is_assigned_inspector(visit_id)
    or public.has_any_role(array['planner', 'ops', 'reviewer', 'leadership'])
  );

-- Same guard pattern as visit_package_snapshots (20260721120000).
create or replace function public.guard_visit_location_correction()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'IMMUTABLE: visit location corrections cannot be changed';
end $$;
revoke all on function public.guard_visit_location_correction() from public, anon;
drop trigger if exists trg_guard_visit_location_correction on public.visit_location_corrections;
create trigger trg_guard_visit_location_correction
  before update or delete on public.visit_location_corrections
  for each row execute function public.guard_visit_location_correction();

-- ---------- 4 · start_journey: the single atomic journey-start path ---------
-- Plan §11: validates assignment + capability, Published visit, confirmed
-- Ready preparation, window timing, package availability/integrity, dispatch
-- location and device provenance — then in ONE transaction creates the
-- journey (or returns the existing active one), records server/device
-- timestamps + GPS + device facts, flips the visit On the Way through the
-- governed leg, writes the first telemetry point and audits. Multiple
-- clicks/retries return the existing Journey; no partial journey survives a
-- failed start (single function = single transaction).
create or replace function public.start_journey(p_visit uuid, p_device jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions  -- pgcrypto (digest/encode), 20260718150000 precedent
as $$
declare
  v_actor uuid := auth.uid();
  v_visit public.visits%rowtype;
  v_prep public.visit_preparations%rowtype;
  v_snapshot public.visit_package_snapshots%rowtype;
  v_journey_id uuid;
  v_reused_overdue boolean;
  v_timing text;
  v_overdue boolean := false;
  v_checksum text;
  v_dispatch_lat numeric;
  v_dispatch_lng numeric;
  v_device_occurred_at timestamptz;
  v_gps jsonb;
  v_gps_lat numeric;
  v_gps_lng numeric;
  v_gps_accuracy numeric;
  v_prestart jsonb;
begin
  if v_actor is null
     or not public.is_assigned_inspector(p_visit)
     or not public.has_capability('execution.start_journey') then
    raise insufficient_privilege
      using message = 'EXE-JOURNEY-DENIED: only the assigned inspector with execution.start_journey may start this journey';
  end if;

  select * into v_visit from public.visits v where v.id = p_visit for update;
  if not found or v_visit.planning_status <> 'published' then
    raise check_violation
      using message = 'EXE-JOURNEY-VISIT-STATE: journey start requires a published visit';
  end if;
  if v_visit.operational_state not in ('new', 'prepared', 'on_the_way') then
    raise check_violation
      using message = 'EXE-JOURNEY-VISIT-STATE: the visit is past the startable states';
  end if;

  -- D-010 readiness (same predicate set_operational_state enforces; checked
  -- here first so the failure carries the stable token before any other work).
  select * into v_prep from public.visit_preparations vp where vp.visit_id = p_visit;
  if not found or v_prep.confirmed_ready_at is null then
    raise exception 'EXE-READY-REQUIRED: confirm the visit ready for execution before starting the journey';
  end if;

  -- Idempotency FIRST among the mutating semantics: multiple clicks/retries
  -- return the one active Journey (plan §11), regardless of how time moved
  -- since the original start.
  select js.id, coalesce((js.prestart ->> 'overdue')::boolean, false)
    into v_journey_id, v_reused_overdue
    from public.journey_sessions js
   where js.visit_id = p_visit and js.status = 'on_journey';
  if found then
    return jsonb_build_object(
      'journey_id', v_journey_id, 'status', 'on_journey',
      'reused', true, 'overdue', v_reused_overdue
    );
  end if;

  -- ---------- Timing (engine_settings.execution.journey_start_timing) -------
  -- 'inside_visit_window': now() must sit inside [window_start, window_end];
  -- after the Execution Date but inside the window is allowed with an overdue
  -- warning recorded in prestart + audit (plan §8).
  select coalesce(es.settings ->> 'journey_start_timing', 'inside_visit_window')
    into v_timing
    from public.engine_settings es
   where es.engine = 'execution';
  v_timing := coalesce(v_timing, 'inside_visit_window');
  if v_timing = 'inside_visit_window'
     and (now() < v_visit.window_start or now() > v_visit.window_end) then
    raise check_violation
      using message = 'EXE-JOURNEY-OUTSIDE-WINDOW: the journey may only start inside the visit window';
  end if;
  if v_visit.execution_date is not null and current_date > v_visit.execution_date then
    v_overdue := true;
  end if;

  -- ---------- Package availability + storage integrity ----------------------
  select * into v_snapshot
    from public.visit_package_snapshots s
   where s.visit_id = p_visit
   order by s.preparation_version desc
   limit 1;
  if not found then
    raise check_violation
      using message = 'EXE-JOURNEY-PACKAGE-MISSING: no frozen visit package snapshot exists';
  end if;
  v_checksum := encode(digest(v_snapshot.definition::text, 'sha256'), 'hex');
  if v_checksum <> v_snapshot.checksum then
    raise check_violation
      using message = 'EXE-JOURNEY-PACKAGE-INTEGRITY: the visit package snapshot fails its checksum';
  end if;

  -- ---------- Resolved dispatch coordinates ---------------------------------
  select coalesce(v.planner_lat, f.official_lat),
         coalesce(v.planner_lng, f.official_lng)
    into v_dispatch_lat, v_dispatch_lng
    from public.visits v
    join public.factories f on f.id = v.factory_id
   where v.id = p_visit;
  if v_dispatch_lat is null or v_dispatch_lng is null then
    raise check_violation
      using message = 'EXE-JOURNEY-LOCATION-MISSING: the visit has no planner or official factory coordinates';
  end if;

  -- ---------- Device provenance (plan §11: ID + app version mandatory; OS /
  -- network tolerated absent and recorded honestly as null) ------------------
  if p_device is null or jsonb_typeof(p_device) <> 'object'
     or nullif(trim(p_device ->> 'device_id'), '') is null
     or nullif(trim(p_device ->> 'application_version'), '') is null then
    raise check_violation
      using message = 'EXE-JOURNEY-DEVICE-MISSING: device_id and application_version are required';
  end if;
  v_device_occurred_at := null;
  if nullif(p_device ->> 'device_occurred_at', '') is not null then
    begin
      v_device_occurred_at := (p_device ->> 'device_occurred_at')::timestamptz;
    exception
      when invalid_datetime_format or datetime_field_overflow then
        v_device_occurred_at := null; -- dishonest device clocks drop, never fatal
    end;
  end if;
  v_gps := p_device -> 'gps';
  if v_gps is not null and jsonb_typeof(v_gps) = 'object' then
    begin
      v_gps_lat := (v_gps ->> 'lat')::numeric;
      v_gps_lng := (v_gps ->> 'lng')::numeric;
      v_gps_accuracy := (v_gps ->> 'accuracy_m')::numeric;
    exception
      when invalid_text_representation then
        v_gps_lat := null; v_gps_lng := null; v_gps_accuracy := null;
    end;
  end if;

  v_prestart := jsonb_build_object(
    'preparation_version', v_prep.preparation_version,
    'package_snapshot_id', v_snapshot.id,
    'package_checksum', v_snapshot.checksum,
    'overdue', v_overdue,
    'network', p_device ->> 'network',
    'device_payload', p_device,  -- raw capture, kept verbatim for audit
    'start_gps', case
      when v_gps_lat is not null and v_gps_lng is not null
      then jsonb_build_object('lat', v_gps_lat, 'lng', v_gps_lng, 'accuracy_m', v_gps_accuracy)
      else null
    end
  );

  -- ---------- Atomic transition + journey ------------------------------------
  -- The governed leg owns the operational-state write (RBAC-009 + legal legs +
  -- D-010 readiness, all satisfied above); trg_audit on visits records it.
  perform public.set_operational_state(p_visit, 'on_the_way');

  begin
    insert into public.journey_sessions (
      visit_id, inspector_id, started_at, device_started_at,
      device_id, device_os_version, application_version, device_info, prestart
    ) values (
      p_visit, v_actor, now(), v_device_occurred_at,
      trim(p_device ->> 'device_id'), nullif(trim(coalesce(p_device ->> 'device_os_version', '')), ''),
      trim(p_device ->> 'application_version'),
      -- journey_device_info_shape (20260716210000) requires string
      -- device_id/os_version/app_version keys; a missing OS version is
      -- recorded as the explicit 'unknown' placeholder, never fabricated.
      jsonb_build_object(
        'device_id', trim(p_device ->> 'device_id'),
        'os_version', coalesce(nullif(trim(coalesce(p_device ->> 'device_os_version', '')), ''), 'unknown'),
        'app_version', trim(p_device ->> 'application_version')
      ),
      v_prestart
    ) returning id into v_journey_id;
  exception
    when unique_violation then
      -- Concurrent starter won the partial unique index race: return the one
      -- active Journey exactly like a replay (plan §11).
      select js.id, coalesce((js.prestart ->> 'overdue')::boolean, false)
        into v_journey_id, v_reused_overdue
        from public.journey_sessions js
       where js.visit_id = p_visit and js.status = 'on_journey';
      return jsonb_build_object(
        'journey_id', v_journey_id, 'status', 'on_journey',
        'reused', true, 'overdue', v_reused_overdue
      );
  end;

  -- First tracking point (plan §11 "starts tracking"): only when a full fix
  -- (lat/lng/accuracy) was supplied — accuracy is NOT NULL on geo_events and
  -- an invented value would be dishonest.
  if v_gps_lat is not null and v_gps_lng is not null and v_gps_accuracy is not null then
    insert into public.geo_events (
      journey_id, visit_id, kind, observed_lat, observed_lng, accuracy_m,
      device_id, device_occurred_at, device_os_version, application_version, source
    ) values (
      v_journey_id, p_visit, 'telemetry', v_gps_lat, v_gps_lng, v_gps_accuracy,
      trim(p_device ->> 'device_id'), coalesce(v_device_occurred_at, now()),
      nullif(trim(coalesce(p_device ->> 'device_os_version', '')), ''),
      trim(p_device ->> 'application_version'), 'journey_start'
    );
  end if;

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state, requirement_refs
  ) values (
    v_actor, 'journey_sessions', v_journey_id, 'journey_start', null,
    jsonb_build_object(
      'visit_id', p_visit,
      'started_at', now(),
      'device_started_at', v_device_occurred_at,
      'preparation_version', v_prep.preparation_version,
      'package_checksum', v_snapshot.checksum,
      'overdue', v_overdue,
      'execution_date', v_visit.execution_date,
      'dispatch', jsonb_build_object('lat', v_dispatch_lat, 'lng', v_dispatch_lng)
    ),
    array['EXE-JOURNEY']
  );
  if v_overdue then
    insert into public.audit_events (
      actor, object_type, object_id, action, before_state, after_state, requirement_refs
    ) values (
      v_actor, 'journey_sessions', v_journey_id, 'journey_start_overdue', null,
      jsonb_build_object(
        'visit_id', p_visit,
        'execution_date', v_visit.execution_date,
        'warning', 'journey started after the Execution Date, inside the visit window'
      ),
      array['EXE-JOURNEY']
    );
  end if;

  return jsonb_build_object(
    'journey_id', v_journey_id, 'status', 'on_journey',
    'reused', false, 'overdue', v_overdue
  );
end $$;
revoke all on function public.start_journey(uuid, jsonb) from public, anon;
grant execute on function public.start_journey(uuid, jsonb) to authenticated;

-- ---------- 5 · request_active_cancellation ----------------------------------
-- Plan §12: once the visit is On the Way / Arrived / executing, the inspector
-- files a cancellation REQUEST; the terminal transition belongs to the decide
-- RPC. Pre-journey visits keep the existing request_visit_cancellation flag
-- flow (preserved; refused here with EXE-CANCEL-USE-PRESTART).
create or replace function public.request_active_cancellation(
  p_visit uuid,
  p_reason_key text,
  p_comment text,
  p_evidence_id uuid,
  p_idempotency_key text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_visit public.visits%rowtype;
  v_existing public.cancellation_requests%rowtype;
  v_request public.cancellation_requests%rowtype;
  v_cfg jsonb;
  v_reason jsonb;
  v_phase text;
  v_inspection_id uuid;
  v_factory text;
begin
  if v_actor is null
     or not public.is_assigned_inspector(p_visit)
     or not public.has_capability('execution.request_active_cancel') then
    raise insufficient_privilege
      using message = 'EXE-CANCEL-DENIED: only the assigned inspector with execution.request_active_cancel may request cancellation';
  end if;

  if nullif(trim(coalesce(p_idempotency_key, '')), '') is null then
    raise check_violation
      using message = 'EXE-CANCEL-IDEMPOTENCY: an idempotency key is required';
  end if;

  -- Idempotent replay of the same outbox operation.
  select * into v_existing
    from public.cancellation_requests cr
   where cr.idempotency_key = trim(p_idempotency_key);
  if found then
    if v_existing.requested_by <> v_actor then
      raise insufficient_privilege
        using message = 'EXE-CANCEL-DENIED: this cancellation request belongs to another user';
    end if;
    return to_jsonb(v_existing);
  end if;

  select * into v_visit from public.visits v where v.id = p_visit for update;
  if not found or v_visit.planning_status <> 'published' then
    raise check_violation
      using message = 'EXE-CANCEL-VISIT-STATE: cancellation requires a published visit';
  end if;
  if v_visit.operational_state in ('new', 'prepared') then
    raise check_violation
      using message = 'EXE-CANCEL-USE-PRESTART: pre-journey cancellation uses the existing visit cancellation flag flow';
  end if;
  if v_visit.operational_state not in ('on_the_way', 'arrived', 'executing') then
    raise check_violation
      using message = 'EXE-CANCEL-VISIT-STATE: the visit is not in an active phase';
  end if;
  v_phase := v_visit.operational_state::text;

  -- Governed reason list (engine_settings.field.cancellation_reasons, 0020).
  select es.settings into v_cfg from public.engine_settings es where es.engine = 'field';
  if v_cfg is null or jsonb_typeof(v_cfg -> 'cancellation_reasons') <> 'array' then
    raise check_violation
      using message = 'EXE-CANCEL-REASON: governed cancellation reason configuration is unavailable';
  end if;
  select r.value into v_reason
    from jsonb_array_elements(v_cfg -> 'cancellation_reasons') as r(value)
   where r.value ->> 'key' = p_reason_key;
  if v_reason is null then
    raise check_violation
      using message = 'EXE-CANCEL-REASON: unknown cancellation reason — use the governed configuration';
  end if;
  if p_reason_key = 'other' and coalesce(trim(p_comment), '') = '' then
    raise check_violation
      using message = 'EXE-CANCEL-COMMENT: a comment is mandatory for reason "other"';
  end if;

  if p_evidence_id is not null and not exists (
    select 1 from public.evidence e
     where e.id = p_evidence_id and e.visit_id = p_visit
  ) then
    raise check_violation
      using message = 'EXE-CANCEL-EVIDENCE: the evidence is not linked to this visit';
  end if;

  select i.id into v_inspection_id from public.inspections i where i.visit_id = p_visit;
  select f.name into v_factory
    from public.factories f where f.id = v_visit.factory_id;

  insert into public.cancellation_requests (
    visit_id, inspection_id, requested_by, phase, reason_key, comment,
    evidence_id, idempotency_key
  ) values (
    p_visit, v_inspection_id, v_actor, v_phase, p_reason_key,
    nullif(trim(coalesce(p_comment, '')), ''), p_evidence_id, trim(p_idempotency_key)
  ) returning * into v_request;

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state, requirement_refs
  ) values (
    v_actor, 'cancellation_requests', v_request.id, 'cancellation_requested', null,
    jsonb_build_object(
      'visit_id', p_visit, 'phase', v_phase, 'reason_key', p_reason_key,
      'comment', v_request.comment, 'evidence_id', p_evidence_id
    ),
    array['EXE-CANCEL']
  );

  perform public.notify_roles(array['ops', 'planner'], 'cancellation_requested',
    jsonb_build_object(
      'request_id', v_request.id, 'visit_id', p_visit, 'factory', v_factory,
      'phase', v_phase, 'reason_key', p_reason_key,
      'reason', v_reason ->> 'en', 'comment', v_request.comment,
      'requested_by', v_actor
    ));

  return to_jsonb(v_request);
end $$;
revoke all on function public.request_active_cancellation(uuid, text, text, uuid, text) from public, anon;
grant execute on function public.request_active_cancellation(uuid, text, text, uuid, text) to authenticated;

-- ---------- 6 · decide_active_cancellation -----------------------------------
-- Plan §12: an authorized user with operations.approve_active_cancel approves
-- or rejects. Approval is terminal and atomic: visit cancelled, tracking and
-- sessions stopped, captured data PRESERVED (nothing deleted), no compliance
-- fields touched, the assignment returned so the inspector's schedule frees,
-- and the inspector notified. The requester may never decide their own
-- request, even when they also hold the operations capability.
create or replace function public.decide_active_cancellation(
  p_request uuid,
  p_decision text,
  p_reason text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_req public.cancellation_requests%rowtype;
  v_visit public.visits%rowtype;
  v_cfg jsonb;
  v_reason_label text;
  v_cancellation_reason text;
  v_factory text;
begin
  if v_actor is null
     or not public.has_capability('operations.approve_active_cancel') then
    raise insufficient_privilege
      using message = 'EXE-CANCEL-DENIED: operations.approve_active_cancel is required to decide a cancellation';
  end if;
  if p_decision not in ('approve', 'reject') then
    raise check_violation
      using message = 'EXE-CANCEL-DECISION-INVALID: the decision must be approve or reject';
  end if;

  select * into v_req from public.cancellation_requests cr where cr.id = p_request for update;
  if not found then
    raise check_violation
      using message = 'EXE-CANCEL-NOT-FOUND: the cancellation request does not exist';
  end if;
  if v_req.requested_by = v_actor then
    raise check_violation
      using message = 'EXE-CANCEL-SELF-DECIDE: the requester may never decide their own cancellation request';
  end if;
  if v_req.status <> 'pending' then
    -- Idempotent-safe: replaying the SAME applied decision returns the current
    -- state; a conflicting decision on a closed request fails closed.
    if (v_req.status = 'approved' and p_decision = 'approve')
       or (v_req.status = 'rejected' and p_decision = 'reject') then
      return to_jsonb(v_req);
    end if;
    raise check_violation
      using message = 'EXE-CANCEL-DECIDED: the cancellation request is already decided';
  end if;

  select * into v_visit from public.visits v where v.id = v_req.visit_id for update;
  if not found then
    raise check_violation
      using message = 'EXE-CANCEL-VISIT-STATE: the visit does not exist';
  end if;
  select f.name into v_factory from public.factories f where f.id = v_visit.factory_id;

  if p_decision = 'reject' then
    if coalesce(trim(p_reason), '') = '' then
      raise check_violation
        using message = 'EXE-CANCEL-DECISION-REASON: a rejection reason is mandatory';
    end if;
    update public.cancellation_requests cr
       set status = 'rejected', decided_by = v_actor, decided_at = now(),
           decision_reason = trim(p_reason)
     where cr.id = p_request
     returning * into v_req;
    -- The visit continues UNCHANGED: no state, journey or inspection writes.
    insert into public.audit_events (
      actor, object_type, object_id, action, before_state, after_state, requirement_refs
    ) values (
      v_actor, 'cancellation_requests', v_req.id, 'cancellation_rejected', null,
      jsonb_build_object('visit_id', v_req.visit_id, 'decision_reason', trim(p_reason)),
      array['EXE-CANCEL']
    );
    insert into public.notifications (event_key, recipient, payload, channel, delivery_state, delivered_at)
      values ('cancellation_rejected', v_req.requested_by,
        jsonb_build_object('request_id', v_req.id, 'visit_id', v_req.visit_id,
          'factory', v_factory, 'reason', trim(p_reason)),
        'inapp', 'delivered', now());
    return to_jsonb(v_req);
  end if;

  -- ---------- Approve: terminal cancellation in ONE transaction -------------
  select r.value ->> 'en' into v_reason_label
    from public.engine_settings es,
         lateral jsonb_array_elements(es.settings -> 'cancellation_reasons') as r(value)
   where es.engine = 'field' and r.value ->> 'key' = v_req.reason_key;
  v_cancellation_reason := coalesce(v_reason_label, v_req.reason_key)
    || coalesce(': ' || v_req.comment, '');

  update public.cancellation_requests cr
     set status = 'approved', decided_by = v_actor, decided_at = now(),
         decision_reason = nullif(trim(coalesce(p_reason, '')), '')
   where cr.id = p_request
   returning * into v_req;

  -- Any other pending request for the visit is superseded by the terminal
  -- cancellation (kept for history, never actionable again).
  update public.cancellation_requests cr
     set status = 'cancelled', decided_at = now(),
         decision_reason = 'superseded: the visit was cancelled by another approved request'
   where cr.visit_id = v_req.visit_id and cr.status = 'pending' and cr.id <> p_request;

  -- planning_status 'cancelled' is terminal; visits.cancellation_reason is
  -- mandatory on cancel (FLD-VIS-006). trg_audit on visits records the write.
  update public.visits v
     set planning_status = 'cancelled',
         cancellation_reason = v_cancellation_reason
   where v.id = v_req.visit_id;

  -- Tracking/sessions stop (plan §12).
  update public.journey_sessions js
     set status = 'completed', ended_at = now()
   where js.visit_id = v_req.visit_id and js.status in ('on_journey', 'arrived');

  -- Lifecycle cancelled WITHOUT touching submitted-or-later work; the Phase 1
  -- sync trigger maps status 'cancelled' to lifecycle_status 'cancelled'.
  update public.inspections i
     set status = 'cancelled'
   where i.visit_id = v_req.visit_id
     and i.status not in ('submitted', 'under_review', 'approved', 'rejected', 'cancelled');

  -- The assignment returns so the inspector's schedule frees (STM-ASG).
  update public.assignments a
     set status = 'returned',
         return_reason = 'cancellation approved: ' || v_cancellation_reason
   where a.visit_id = v_req.visit_id and a.status <> 'returned';

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state, requirement_refs
  ) values (
    v_actor, 'cancellation_requests', v_req.id, 'cancellation_approved', null,
    jsonb_build_object(
      'visit_id', v_req.visit_id, 'phase', v_req.phase,
      'reason_key', v_req.reason_key, 'cancellation_reason', v_cancellation_reason,
      'data_preserved', true
    ),
    array['EXE-CANCEL']
  );

  insert into public.notifications (event_key, recipient, payload, channel, delivery_state, delivered_at)
    values ('cancellation_approved', v_req.requested_by,
      jsonb_build_object('request_id', v_req.id, 'visit_id', v_req.visit_id,
        'factory', v_factory, 'reason', v_cancellation_reason),
      'inapp', 'delivered', now());

  return to_jsonb(v_req);
end $$;
revoke all on function public.decide_active_cancellation(uuid, text, text) from public, anon;
grant execute on function public.decide_active_cancellation(uuid, text, text) to authenticated;

-- ---------- 7 · correct_visit_location ---------------------------------------
-- Plan §13: the inspector's corrected visit location, current visit ONLY.
-- The Factory 360/Senaei master (factories.official_*) and the Planning pin
-- (visits.planner_*) are NEVER updated here — the correction is an appended
-- fact and the original stays visible and auditable.
create or replace function public.correct_visit_location(
  p_visit uuid,
  p_lat numeric,
  p_lng numeric,
  p_accuracy numeric,
  p_reason text,
  p_evidence_id uuid,
  p_capture_context text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_visit public.visits%rowtype;
  v_correction public.visit_location_corrections%rowtype;
  v_context text := coalesce(nullif(trim(p_capture_context), ''), 'online');
  v_before_lat numeric;
  v_before_lng numeric;
  v_before_source text;
begin
  if v_actor is null
     or not public.is_assigned_inspector(p_visit)
     or not public.has_capability('execution.arrive') then
    raise insufficient_privilege
      using message = 'EXE-LOCATION-DENIED: only the assigned inspector with execution.arrive may correct the visit location';
  end if;

  select * into v_visit from public.visits v where v.id = p_visit for update;
  if not found or v_visit.planning_status <> 'published' then
    raise check_violation
      using message = 'EXE-LOCATION-VISIT-STATE: a correction requires a published visit';
  end if;
  -- Corrections are recorded up to and including the executing phase (for the
  -- record); submitted-or-later visits are closed facts.
  if v_visit.operational_state not in ('prepared', 'on_the_way', 'arrived', 'executing') then
    raise check_violation
      using message = 'EXE-LOCATION-VISIT-STATE: the visit is not in a correctable state';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise check_violation
      using message = 'EXE-LOCATION-REASON: a correction reason is mandatory';
  end if;
  if p_lat is null or p_lng is null
     or p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then
    raise check_violation
      using message = 'EXE-LOCATION-RANGE: the corrected coordinates are out of range';
  end if;
  if v_context not in ('online', 'offline') then
    raise check_violation
      using message = 'EXE-LOCATION-CONTEXT: capture_context must be online or offline';
  end if;
  if p_evidence_id is not null and not exists (
    select 1 from public.evidence e
     where e.id = p_evidence_id and e.visit_id = p_visit
  ) then
    raise check_violation
      using message = 'EXE-LOCATION-EVIDENCE: the evidence is not linked to this visit';
  end if;

  -- Effective location BEFORE this correction (for the audit before_state).
  select c.corrected_lat, c.corrected_lng, 'visit_location_corrections'
    into v_before_lat, v_before_lng, v_before_source
    from public.visit_location_corrections c
   where c.visit_id = p_visit
   order by c.corrected_at desc
   limit 1;
  if not found then
    select coalesce(v.planner_lat, f.official_lat),
           coalesce(v.planner_lng, f.official_lng),
           case when v.planner_lat is not null and v.planner_lng is not null
                then 'visits.planner' else 'factories.official' end
      into v_before_lat, v_before_lng, v_before_source
      from public.visits v
      join public.factories f on f.id = v.factory_id
     where v.id = p_visit;
  end if;

  insert into public.visit_location_corrections (
    visit_id, corrected_lat, corrected_lng, accuracy_m, reason,
    evidence_id, source, corrected_by, capture_context
  ) values (
    p_visit, p_lat, p_lng, p_accuracy, trim(p_reason),
    p_evidence_id, 'inspector_field', v_actor, v_context
  ) returning * into v_correction;

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state, requirement_refs
  ) values (
    v_actor, 'visit_location_corrections', v_correction.id, 'location_corrected',
    jsonb_build_object('lat', v_before_lat, 'lng', v_before_lng, 'source', v_before_source),
    jsonb_build_object(
      'visit_id', p_visit, 'lat', p_lat, 'lng', p_lng, 'accuracy_m', p_accuracy,
      'reason', trim(p_reason), 'capture_context', v_context
    ),
    array['EXE-LOCATION']
  );

  return to_jsonb(v_correction);
end $$;
revoke all on function public.correct_visit_location(uuid, numeric, numeric, numeric, text, uuid, text) from public, anon;
grant execute on function public.correct_visit_location(uuid, numeric, numeric, numeric, text, uuid, text) to authenticated;

-- ---------- 8 · confirm_arrival ----------------------------------------------
-- Plan §13: captures server/device time + GPS, validates accuracy and fence
-- against the effective target (latest approved correction, else the
-- registered/planning location), stops travel tracking, sets Arrived through
-- the governed leg, and audits. Outside the radius NOTHING mutates: the
-- caller gets an EXE-ARRIVAL-OUTSIDE notice and uses retry / governed
-- correction / the existing geo-override approval flow — no silent override.
create or replace function public.confirm_arrival(
  p_visit uuid,
  p_observed_lat numeric,
  p_observed_lng numeric,
  p_accuracy_m numeric,
  p_device jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_visit public.visits%rowtype;
  v_journey_id uuid;
  v_arrival_event uuid;
  v_max_accuracy numeric;
  v_radius numeric;
  v_gis_version text;
  v_target_lat numeric;
  v_target_lng numeric;
  v_target_source text;
  v_distance numeric;
  v_device_occurred_at timestamptz;
begin
  if v_actor is null
     or not public.is_assigned_inspector(p_visit)
     or not public.has_capability('execution.arrive') then
    raise insufficient_privilege
      using message = 'EXE-ARRIVAL-DENIED: only the assigned inspector with execution.arrive may confirm arrival';
  end if;

  select * into v_visit from public.visits v where v.id = p_visit for update;
  if not found or v_visit.planning_status <> 'published' then
    raise check_violation
      using message = 'EXE-ARRIVAL-VISIT-STATE: arrival requires a published visit';
  end if;

  -- Idempotent replay: already Arrived with an arrival/override event on the
  -- latest journey returns that fact without a duplicate.
  if v_visit.operational_state = 'arrived' then
    select js.id into v_journey_id
      from public.journey_sessions js
     where js.visit_id = p_visit
     order by js.started_at desc
     limit 1;
    select ge.id into v_arrival_event
      from public.geo_events ge
     where ge.visit_id = p_visit
       and ge.journey_id = v_journey_id
       and ge.kind in ('arrival', 'override')
     order by ge.occurred_at desc
     limit 1;
    return jsonb_build_object(
      'result', 'inside', 'reused', true,
      'journey_id', v_journey_id, 'arrival_event_id', v_arrival_event
    );
  end if;
  if v_visit.operational_state <> 'on_the_way' then
    raise check_violation
      using message = 'EXE-ARRIVAL-VISIT-STATE: arrival requires the visit to be on the way';
  end if;

  select js.id into v_journey_id
    from public.journey_sessions js
   where js.visit_id = p_visit and js.status = 'on_journey'
   for update;
  if not found then
    raise check_violation
      using message = 'EXE-ARRIVAL-VISIT-STATE: an active journey is required to confirm arrival';
  end if;

  -- ---------- Accuracy gate (governed gis.gps_accuracy_checkin_max_m) -------
  select coalesce((es.settings ->> 'gps_accuracy_checkin_max_m')::numeric, 25),
         es.version_label
    into v_max_accuracy, v_gis_version
    from public.engine_settings es
   where es.engine = 'gis';
  v_max_accuracy := coalesce(v_max_accuracy, 25);
  if p_accuracy_m is null or p_accuracy_m > v_max_accuracy then
    raise check_violation
      using message = 'EXE-ARRIVAL-ACCURACY: the GPS accuracy is worse than the governed check-in maximum';
  end if;

  -- ---------- Effective target: latest correction, else registered location -
  select c.corrected_lat, c.corrected_lng, 'visit_location_corrections'
    into v_target_lat, v_target_lng, v_target_source
    from public.visit_location_corrections c
   where c.visit_id = p_visit
   order by c.corrected_at desc
   limit 1;
  if not found then
    select coalesce(v.planner_lat, f.official_lat),
           coalesce(v.planner_lng, f.official_lng),
           case when v.planner_lat is not null and v.planner_lng is not null
                then 'visits.planner' else 'factories.official' end
      into v_target_lat, v_target_lng, v_target_source
      from public.visits v
      join public.factories f on f.id = v.factory_id
     where v.id = p_visit;
  end if;
  if v_target_lat is null or v_target_lng is null then
    raise check_violation
      using message = 'EXE-ARRIVAL-LOCATION-MISSING: the visit has no effective target coordinates';
  end if;

  select coalesce(f.geofence_radius_m::numeric,
                  (select coalesce((es.settings ->> 'arrival_detection_radius_m')::numeric, 200)
                     from public.engine_settings es where es.engine = 'gis'),
                  200)
    into v_radius
    from public.visits v
    join public.factories f on f.id = v.factory_id
   where v.id = p_visit;

  -- Haversine (same formula as request_geo_override, 20260718140105).
  v_distance := 6371000 * 2 * asin(sqrt(
    power(sin(radians((p_observed_lat - v_target_lat) / 2)), 2)
    + cos(radians(v_target_lat)) * cos(radians(p_observed_lat))
    * power(sin(radians((p_observed_lng - v_target_lng) / 2)), 2)
  ));

  -- ---------- Outside: NO mutation — notice only (plan §13, no silent -------
  -- override). Retry / governed correction / geo-override are the only paths.
  if v_distance > v_radius then
    return jsonb_build_object(
      'result', 'outside',
      'distance_m', round(v_distance),
      'radius_m', v_radius,
      'target_source', v_target_source,
      'notice', 'EXE-ARRIVAL-OUTSIDE'
    );
  end if;

  -- ---------- Inside: arrival fact, tracking stop, governed Arrived leg -----
  v_device_occurred_at := null;
  if p_device is not null and jsonb_typeof(p_device) = 'object'
     and nullif(p_device ->> 'device_occurred_at', '') is not null then
    begin
      v_device_occurred_at := (p_device ->> 'device_occurred_at')::timestamptz;
    exception
      when invalid_datetime_format or datetime_field_overflow then
        v_device_occurred_at := null;
    end;
  end if;

  insert into public.geo_events (
    journey_id, visit_id, kind, observed_lat, observed_lng, accuracy_m,
    geofence_result, gis_version, device_id, device_occurred_at,
    device_os_version, application_version, source
  ) values (
    v_journey_id, p_visit, 'arrival', p_observed_lat, p_observed_lng, p_accuracy_m,
    'inside', v_gis_version,
    nullif(trim(coalesce(p_device ->> 'device_id', '')), ''),
    coalesce(v_device_occurred_at, now()),
    nullif(trim(coalesce(p_device ->> 'device_os_version', '')), ''),
    nullif(trim(coalesce(p_device ->> 'application_version', '')), ''),
    'confirm_arrival'
  ) returning id into v_arrival_event;

  -- Travel tracking stops at confirmed arrival (plan §13 "stops travel
  -- tracking"; DEC-002: no location collection during the inspection itself).
  update public.journey_sessions js
     set status = 'arrived', ended_at = now()
   where js.id = v_journey_id;

  -- The governed leg owns the operational-state write; trg_audit records it.
  perform public.set_operational_state(p_visit, 'arrived');

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state, requirement_refs
  ) values (
    v_actor, 'journey_sessions', v_journey_id, 'arrival_confirmed', null,
    jsonb_build_object(
      'visit_id', p_visit,
      'arrival_event_id', v_arrival_event,
      'observed', jsonb_build_object('lat', p_observed_lat, 'lng', p_observed_lng, 'accuracy_m', p_accuracy_m),
      'target', jsonb_build_object('lat', v_target_lat, 'lng', v_target_lng, 'source', v_target_source),
      'distance_m', round(v_distance), 'radius_m', v_radius,
      'device_occurred_at', v_device_occurred_at
    ),
    array['EXE-JOURNEY']
  );

  return jsonb_build_object(
    'result', 'inside', 'reused', false,
    'journey_id', v_journey_id,
    'arrival_event_id', v_arrival_event,
    'distance_m', round(v_distance),
    'radius_m', v_radius,
    'target_source', v_target_source
  );
end $$;
revoke all on function public.confirm_arrival(uuid, numeric, numeric, numeric, jsonb) from public, anon;
grant execute on function public.confirm_arrival(uuid, numeric, numeric, numeric, jsonb) to authenticated;
