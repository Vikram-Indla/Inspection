-- TASK-IPAD-M04-OVERRIDE-APPROVAL-WORKFLOW-003 / retrofit regression P0.
-- The accepted visit model stores an Immediate Visit dispatch point in
-- visits.planner_lat/planner_lng and otherwise inherits the factory's official
-- coordinates. The original RPC incorrectly referenced nonexistent
-- visits.dispatch_lat/dispatch_lng, so every otherwise-valid request failed
-- with PostgreSQL 42703. Keep the approval transaction and all guards intact;
-- repair only canonical coordinate resolution.

create or replace function public.request_geo_override(
  p_request uuid,
  p_visit uuid,
  p_journey uuid,
  p_checkin_event uuid,
  p_reason_key text,
  p_explanation text,
  p_safety_security_exception boolean default false
) returns public.geo_override_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cfg jsonb;
  v_reason jsonb;
  v_event public.geo_events;
  v_journey public.journey_sessions;
  v_existing public.geo_override_requests;
  v_request public.geo_override_requests;
  v_factory text;
  v_dispatch_lat double precision;
  v_dispatch_lng double precision;
begin
  if auth.uid() is null or not public.is_assigned_inspector(p_visit) then
    raise exception 'Not the assigned inspector for this visit (RBAC-009)';
  end if;
  if p_request is null or p_checkin_event is null or coalesce(trim(p_explanation), '') = '' then
    raise exception 'Request, outside check-in and explanation are mandatory (M04-043)';
  end if;

  select * into v_existing from public.geo_override_requests where id = p_request;
  if found then
    if v_existing.requested_by <> auth.uid() then
      raise exception 'Override request belongs to another inspector';
    end if;
    return v_existing;
  end if;

  select * into v_journey from public.journey_sessions
    where id = p_journey and visit_id = p_visit and inspector_id = auth.uid()
    for update;
  if not found or v_journey.status <> 'on_journey' then
    raise exception 'Active assigned journey is required for an override request (STM-JRN-003)';
  end if;

  select * into v_event from public.geo_events
    where id = p_checkin_event
      and visit_id = p_visit
      and journey_id = p_journey
      and kind = 'checkin'
      and geofence_result = 'outside';
  if not found then
    raise exception 'Override request must use its immutable outside-fence check-in event (ERR-GEO-002)';
  end if;

  select f.name,
         coalesce(v.planner_lat, f.official_lat),
         coalesce(v.planner_lng, f.official_lng)
    into v_factory, v_dispatch_lat, v_dispatch_lng
  from public.visits v
  join public.factories f on f.id = v.factory_id
  where v.id = p_visit;
  if v_factory is null then
    raise exception 'Visit not found';
  end if;
  if v_dispatch_lat is null or v_dispatch_lng is null then
    raise exception 'A governed visit location is required for a geo-override request';
  end if;

  select settings into v_cfg from public.engine_settings where engine = 'field';
  if v_cfg is null or jsonb_typeof(v_cfg->'geo_override_reasons') <> 'array' then
    raise exception 'Governed geo-override reason configuration is unavailable';
  end if;
  select value into v_reason from jsonb_array_elements(v_cfg->'geo_override_reasons')
    where value->>'key' = p_reason_key;
  if v_reason is null then
    raise exception 'Unknown geo-override reason — use the governed configuration';
  end if;
  if p_safety_security_exception and p_reason_key <> 'safety_security' then
    raise exception 'Photo-evidence exception is limited to the safety/security reason';
  end if;
  if not p_safety_security_exception and not exists (
    select 1 from public.evidence
     where visit_id = p_visit
       and linked_type = 'geo_override'
       and linked_id = p_request
       and evidence_type = 'photo'
  ) then
    raise exception 'Photo evidence must sync before an override request can be created';
  end if;

  insert into public.geo_override_requests (
    id, visit_id, journey_id, checkin_event_id, requested_by, expires_at,
    reason_key, reason_label, explanation, safety_security_exception,
    observed_lat, observed_lng, accuracy_m, distance_m, device_occurred_at
  ) values (
    p_request, p_visit, p_journey, p_checkin_event, auth.uid(), now() + interval '30 minutes',
    p_reason_key, coalesce(v_reason->>'en', p_reason_key), trim(p_explanation), p_safety_security_exception,
    v_event.observed_lat, v_event.observed_lng, v_event.accuracy_m,
    6371000 * 2 * asin(sqrt(
      power(sin(radians((v_event.observed_lat - v_dispatch_lat) / 2)), 2)
      + cos(radians(v_dispatch_lat)) * cos(radians(v_event.observed_lat))
      * power(sin(radians((v_event.observed_lng - v_dispatch_lng) / 2)), 2)
    )),
    coalesce(v_event.device_occurred_at, v_event.occurred_at)
  ) returning * into v_request;

  perform public.notify_roles(array['ops'], 'geo_override_requested', jsonb_build_object(
    'request_id', p_request, 'visit_id', p_visit, 'journey_id', p_journey,
    'factory', v_factory, 'reason_key', p_reason_key,
    'requested_by', auth.uid(), 'expires_at', v_request.expires_at
  ));
  return v_request;
end $$;

revoke all on function public.request_geo_override(uuid, uuid, uuid, uuid, text, text, boolean) from public, anon;
grant execute on function public.request_geo_override(uuid, uuid, uuid, uuid, text, text, boolean) to authenticated;
