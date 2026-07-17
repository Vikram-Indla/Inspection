-- TASK-IPAD-M04-OVERRIDE-APPROVAL-WORKFLOW-003
-- Governed outside-geofence check-in: an assigned inspector may request an
-- override from an immutable outside check-in event; only Operations may
-- decide. This is intentionally additive and fail-closed.

-- Pre-inspection evidence is visit-linked. The enum value was committed in
-- the preceding migration so it is safe to use in the guarded functions below.

-- The request is the durable approval object. It copies location/time from its
-- immutable check-in event rather than trusting browser-provided coordinates.
create table if not exists geo_override_requests (
  id uuid primary key,
  visit_id uuid not null references visits(id),
  journey_id uuid not null references journey_sessions(id),
  checkin_event_id uuid not null unique references geo_events(id),
  requested_by uuid not null references profiles(user_id),
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','expired')),
  reason_key text not null,
  reason_label text not null,
  explanation text not null check (length(trim(explanation)) > 0 and length(explanation) <= 2000),
  safety_security_exception boolean not null default false,
  observed_lat numeric(10,7) not null,
  observed_lng numeric(10,7) not null,
  accuracy_m numeric not null check (accuracy_m >= 0),
  distance_m numeric not null check (distance_m >= 0),
  device_occurred_at timestamptz not null,
  decision_by uuid references profiles(user_id),
  decided_at timestamptz,
  decision_reason text,
  decision_event_id uuid references geo_events(id),
  constraint geo_override_expiry_order check (expires_at > requested_at),
  constraint geo_override_decision_shape check (
    (status = 'pending' and decision_by is null and decided_at is null and decision_event_id is null)
    or (status = 'approved' and decision_by is not null and decided_at is not null and decision_event_id is not null)
    or (status = 'rejected' and decision_by is not null and decided_at is not null and length(trim(coalesce(decision_reason, ''))) > 0)
    or (status = 'expired' and decision_by is null and decided_at is not null)
  )
);

-- One journey has one arrival attempt. A rejected or expired request cannot be
-- replaced by a fresh browser submission to evade Operations' decision.
create unique index if not exists geo_override_requests_one_attempt
  on geo_override_requests (journey_id);
create index if not exists geo_override_requests_ops_queue
  on geo_override_requests (status, expires_at, requested_at)
  where status = 'pending';
create index if not exists geo_override_requests_requester
  on geo_override_requests (requested_by, requested_at desc);

alter table geo_override_requests enable row level security;
revoke all on table geo_override_requests from anon, authenticated;
grant select on table geo_override_requests to authenticated;

-- Inspectors see only their own request; Operations sees its queue. Direct
-- INSERT/UPDATE is denied: both writes use the guarded RPCs below.
drop policy if exists geo_override_requests_read on geo_override_requests;
create policy geo_override_requests_read on geo_override_requests
  for select to authenticated using (
    requested_by = (select auth.uid()) or has_role('ops')
  );

drop trigger if exists trg_audit_geo_override_requests on geo_override_requests;
create trigger trg_audit_geo_override_requests
  after insert or update or delete on geo_override_requests
  for each row execute function audit_row_change();

-- A request stops being actionable the moment the visit closes, even if no
-- Operations user happens to open the queue. This never changes an approved or
-- rejected historical decision.
create or replace function expire_pending_geo_overrides_on_visit_close()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.planning_status in ('cancelled', 'expired')
     or new.operational_state in ('arrived', 'executing', 'submitted') then
    update geo_override_requests
       set status = 'expired', decided_at = now()
     where visit_id = new.id and status = 'pending';
  end if;
  return new;
end $$;
drop trigger if exists trg_expire_pending_geo_overrides_on_visit_close on visits;
create trigger trg_expire_pending_geo_overrides_on_visit_close
  after update of planning_status, operational_state on visits
  for each row execute function expire_pending_geo_overrides_on_visit_close();

-- A scheduled worker is not assumed. Any authenticated field or Operations
-- read materializes elapsed requests as expired, while the decision guard
-- independently enforces the same cutoff to remain race-safe.
create or replace function expire_stale_geo_override_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  update geo_override_requests
     set status = 'expired', decided_at = now()
   where status = 'pending' and expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function expire_stale_geo_override_requests() from public, anon;
grant execute on function expire_stale_geo_override_requests() to authenticated;

-- The sponsor-approved controlled reason list is configuration, not screen
-- code. It is intentionally narrow; unlisted conditions fail closed until a
-- GIS/configuration authority changes the governed engine setting.
update engine_settings
set settings = jsonb_set(
  settings,
  '{geo_override_reasons}',
  '[
    {"key":"access_point_discrepancy","en":"Verified access point differs from the governed location","ar":"نقطة الوصول المتحققة تختلف عن الموقع المعتمد"},
    {"key":"access_obstruction","en":"Official access point is physically obstructed","ar":"نقطة الوصول الرسمية محجوبة فعلياً"},
    {"key":"safety_security","en":"Safety or security conditions make photo capture unsafe","ar":"ظروف السلامة أو الأمن تجعل التقاط الصورة غير آمن"}
  ]'::jsonb,
  true
)
where engine = 'field'
  and not (settings ? 'geo_override_reasons');

-- Creates a request only from the exact immutable outside-fence check-in. The
-- evidence guard deliberately reads the already-synced photo record; an
-- offline request remains queued and cannot be approved until that happens.
create or replace function request_geo_override(
  p_request uuid,
  p_visit uuid,
  p_journey uuid,
  p_checkin_event uuid,
  p_reason_key text,
  p_explanation text,
  p_safety_security_exception boolean default false
) returns geo_override_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg jsonb;
  v_reason jsonb;
  v_event geo_events;
  v_journey journey_sessions;
  v_existing geo_override_requests;
  v_request geo_override_requests;
  v_factory text;
begin
  if auth.uid() is null or not is_assigned_inspector(p_visit) then
    raise exception 'Not the assigned inspector for this visit (RBAC-009)';
  end if;
  if p_request is null or p_checkin_event is null or coalesce(trim(p_explanation), '') = '' then
    raise exception 'Request, outside check-in and explanation are mandatory (M04-043)';
  end if;

  select * into v_existing from geo_override_requests where id = p_request;
  if found then
    if v_existing.requested_by <> auth.uid() then
      raise exception 'Override request belongs to another inspector';
    end if;
    return v_existing; -- idempotent replay of the same offline outbox operation
  end if;

  select * into v_journey from journey_sessions
    where id = p_journey and visit_id = p_visit and inspector_id = auth.uid()
    for update;
  if not found or v_journey.status <> 'on_journey' then
    raise exception 'Active assigned journey is required for an override request (STM-JRN-003)';
  end if;

  select * into v_event from geo_events
    where id = p_checkin_event
      and visit_id = p_visit
      and journey_id = p_journey
      and kind = 'checkin'
      and geofence_result = 'outside';
  if not found then
    raise exception 'Override request must use its immutable outside-fence check-in event (ERR-GEO-002)';
  end if;
  if not exists (
    select 1 from visits
     where id = p_visit and dispatch_lat is not null and dispatch_lng is not null
  ) then
    raise exception 'A governed visit location is required for a geo-override request';
  end if;

  select settings into v_cfg from engine_settings where engine = 'field';
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
    select 1 from evidence
     where visit_id = p_visit
       and linked_type = 'geo_override'
       and linked_id = p_request
       and evidence_type = 'photo'
  ) then
    raise exception 'Photo evidence must sync before an override request can be created';
  end if;

  select f.name into v_factory from visits v join factories f on f.id = v.factory_id where v.id = p_visit;
  if v_factory is null then
    raise exception 'Visit not found';
  end if;

  insert into geo_override_requests (
    id, visit_id, journey_id, checkin_event_id, requested_by, expires_at,
    reason_key, reason_label, explanation, safety_security_exception,
    observed_lat, observed_lng, accuracy_m, distance_m, device_occurred_at
  ) values (
    p_request, p_visit, p_journey, p_checkin_event, auth.uid(), now() + interval '30 minutes',
    p_reason_key, coalesce(v_reason->>'en', p_reason_key), trim(p_explanation), p_safety_security_exception,
    v_event.observed_lat, v_event.observed_lng, v_event.accuracy_m,
    (select 6371000 * 2 * asin(sqrt(
      power(sin(radians((v_event.observed_lat - v.dispatch_lat) / 2)), 2)
      + cos(radians(v.dispatch_lat)) * cos(radians(v_event.observed_lat))
      * power(sin(radians((v_event.observed_lng - v.dispatch_lng) / 2)), 2)
    )) from visits v where v.id = p_visit and v.dispatch_lat is not null and v.dispatch_lng is not null),
    coalesce(v_event.device_occurred_at, v_event.occurred_at)
  ) returning * into v_request;

  perform notify_roles(array['ops'], 'geo_override_requested', jsonb_build_object(
    'request_id', p_request, 'visit_id', p_visit, 'journey_id', p_journey,
    'factory', v_factory, 'reason_key', p_reason_key,
    'requested_by', auth.uid(), 'expires_at', v_request.expires_at
  ));
  return v_request;
end $$;
revoke all on function request_geo_override(uuid, uuid, uuid, uuid, text, text, boolean) from public, anon;
grant execute on function request_geo_override(uuid, uuid, uuid, uuid, text, text, boolean) to authenticated;

-- Operations decision and the arrival state change occur atomically. This is
-- the canonical approved-override guard for STM-JRN-003, not a browser-side
-- state update. The requester is explicitly barred even if they hold ops too.
create or replace function decide_geo_override(
  p_request uuid,
  p_decision text,
  p_decision_reason text default null
) returns geo_override_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request geo_override_requests;
  v_visit visits;
  v_event geo_events;
  v_factory text;
begin
  if auth.uid() is null or not has_role('ops') then
    raise exception 'Only Operations Supervisor or Operations Manager may decide an override (RBAC-008)';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;
  if p_decision = 'rejected' and coalesce(trim(p_decision_reason), '') = '' then
    raise exception 'A rejection reason is mandatory';
  end if;

  select * into v_request from geo_override_requests where id = p_request for update;
  if not found then
    raise exception 'Override request not found';
  end if;
  if v_request.requested_by = auth.uid() then
    raise exception 'An inspector may never approve or reject their own override request';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'Override request is already %', v_request.status;
  end if;

  select * into v_visit from visits where id = v_request.visit_id for update;
  if not found then
    raise exception 'Visit not found';
  end if;
  if now() >= v_request.expires_at
     or v_visit.planning_status in ('cancelled','expired')
     or v_visit.operational_state in ('arrived','executing','submitted') then
    update geo_override_requests
       set status = 'expired', decided_at = now()
     where id = p_request
     returning * into v_request;
    return v_request;
  end if;
  if v_visit.operational_state <> 'on_the_way' then
    raise exception 'Visit is not eligible for the approved-override transition';
  end if;
  if not v_request.safety_security_exception and not exists (
    select 1 from evidence
     where visit_id = v_request.visit_id
       and linked_type = 'geo_override'
       and linked_id = v_request.id
       and evidence_type = 'photo'
  ) then
    raise exception 'Required override photo evidence is unavailable';
  end if;

  if p_decision = 'rejected' then
    update geo_override_requests
       set status = 'rejected', decision_by = auth.uid(), decided_at = now(), decision_reason = trim(p_decision_reason)
     where id = p_request
     returning * into v_request;
    insert into notifications(event_key, recipient, payload, channel, delivery_state, delivered_at)
      values ('geo_override_rejected', v_request.requested_by,
        jsonb_build_object('request_id', v_request.id, 'visit_id', v_request.visit_id, 'reason', trim(p_decision_reason)),
        'inapp', 'delivered', now());
    return v_request;
  end if;

  -- Use the request's immutable captured facts. No official coordinate is ever changed.
  insert into geo_events (
    journey_id, visit_id, kind, observed_lat, observed_lng, accuracy_m,
    geofence_result, override_reason, gis_version, device_occurred_at
  ) values (
    v_request.journey_id, v_request.visit_id, 'override',
    v_request.observed_lat, v_request.observed_lng, v_request.accuracy_m,
    'override', v_request.reason_label || ': ' || v_request.explanation,
    'v1-accepted-2026-07-11', v_request.device_occurred_at
  ) returning * into v_event;

  update geo_override_requests
     set status = 'approved', decision_by = auth.uid(), decided_at = now(),
         decision_reason = nullif(trim(coalesce(p_decision_reason, '')), ''), decision_event_id = v_event.id
   where id = p_request
   returning * into v_request;

  update journey_sessions set status = 'arrived'
    where id = v_request.journey_id and status = 'on_journey';
  update visits set operational_state = 'arrived'
    where id = v_request.visit_id and operational_state = 'on_the_way';

  select f.name into v_factory from visits v join factories f on f.id = v.factory_id where v.id = v_request.visit_id;
  insert into notifications(event_key, recipient, payload, channel, delivery_state, delivered_at)
    values ('geo_override_approved', v_request.requested_by,
      jsonb_build_object('request_id', v_request.id, 'visit_id', v_request.visit_id,
        'factory', v_factory, 'arrival_event_id', v_event.id),
      'inapp', 'delivered', now());
  return v_request;
end $$;
revoke all on function decide_geo_override(uuid, text, text) from public, anon;
grant execute on function decide_geo_override(uuid, text, text) to authenticated;

-- Arabic strings remain governed content. These draft rows exactly mirror the
-- in-code fallbacks and will never overwrite a reviewed localization.
insert into ui_strings (key, en, ar, status, context) values
  ('field.start.overrideHeading', 'Outside the planned location', 'خارج الموقع المخطط', 'draft', 'M04-043 governed override'),
  ('field.start.overrideBody', 'You are {d} m from the planned point (fence {fence} m). Request Operations approval using the captured actual coordinates {lat}, {lng}. Check-in remains blocked until approval.', 'أنت على بُعد {d} م من النقطة المخططة (النطاق {fence} م). اطلب موافقة العمليات باستخدام الإحداثيات الفعلية الملتقطة {lat}، {lng}. يظل تسجيل الوصول محظورًا حتى الموافقة.', 'draft', 'M04-043 governed override'),
  ('field.start.overrideReason', 'Explanation — mandatory', 'الشرح — إلزامي', 'draft', 'M04-043 governed override'),
  ('field.start.overrideReasonCode', 'Governed reason code — mandatory', 'رمز سبب معتمد — إلزامي', 'draft', 'M04-043 governed override'),
  ('field.start.overrideEvidence', 'Photo evidence — mandatory unless safety/security makes capture unsafe', 'دليل صورة — إلزامي ما لم تجعل السلامة أو الأمن الالتقاط غير آمن', 'draft', 'M04-043 evidence'),
  ('field.start.overrideSafetyException', 'Photo cannot be captured safely because of the selected safety/security condition', 'لا يمكن التقاط الصورة بأمان بسبب حالة السلامة أو الأمن المحددة', 'draft', 'M04-043 evidence exception'),
  ('field.start.overrideConfirm', 'Request Operations override', 'طلب تجاوز من العمليات', 'draft', 'M04-043 governed override'),
  ('field.start.overridePending', 'Operations override pending — check-in remains blocked until an Operations Supervisor or Manager approves online.', 'طلب تجاوز العمليات قيد الانتظار — يظل تسجيل الوصول محظورًا حتى يوافق مشرف أو مدير العمليات عبر الإنترنت.', 'draft', 'M04-043 pending'),
  ('field.start.overrideQueued', 'Override request safely queued — it will be sent with its captured GPS/evidence when online. Check-in remains blocked.', 'تمت جدولة طلب التجاوز بأمان — سيُرسل مع نظام تحديد الموقع والدليل الملتقطين عند الاتصال. يظل تسجيل الوصول محظورًا.', 'draft', 'M04-043 offline'),
  ('field.start.overrideApproved', 'Operations override approved — actual coordinates and decision are immutably recorded.', 'تمت الموافقة على تجاوز العمليات — تُسجَّل الإحداثيات الفعلية والقرار بصورة غير قابلة للتعديل.', 'draft', 'M04-043 approved'),
  ('field.start.overrideClosed', 'This arrival attempt has already been rejected or expired. Check-in remains blocked; return the visit or contact Operations.', 'تم رفض محاولة الوصول هذه أو انتهت صلاحيتها. يظل تسجيل الوصول محظورًا؛ أعد الزيارة أو تواصل مع العمليات.', 'draft', 'M04-043 closed'),
  ('field.start.logOverrideQueued', 'Operations override requested with captured GPS/time and evidence — check-in remains blocked pending approval.', 'تم طلب تجاوز العمليات مع نظام تحديد الموقع والوقت والدليل الملتقطين — يظل تسجيل الوصول محظورًا بانتظار الموافقة.', 'draft', 'M04-043 request'),
  ('field.start.logOverrideOfflineQueued', 'Override request queued offline with captured GPS/evidence — it cannot self-approve or unlock check-in.', 'تمت جدولة طلب التجاوز دون اتصال مع نظام تحديد الموقع والدليل الملتقطين — لا يمكنه الموافقة الذاتية أو فتح تسجيل الوصول.', 'draft', 'M04-043 offline'),
  ('field.start.logOverrideEvidenceRequired', 'A photo is mandatory unless the selected safety/security condition makes capture unsafe.', 'الصورة إلزامية ما لم تجعل حالة السلامة أو الأمن المحددة الالتقاط غير آمن.', 'draft', 'M04-043 evidence'),
  ('ops.override.heading', 'Geofence override approvals (M04-043)', 'موافقات تجاوز النطاق الجغرافي (M04-043)', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.caption', 'Approve only the exact captured arrival attempt. The requester cannot decide; a pending request expires after 30 minutes or when the visit closes.', 'اعتمد محاولة الوصول الملتقطة نفسها فقط. لا يستطيع مقدم الطلب اتخاذ القرار؛ ينتهي الطلب المعلّق بعد 30 دقيقة أو عند إغلاق الزيارة.', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.empty.title', 'No override approvals pending', 'لا توجد موافقات تجاوز معلّقة', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.empty.desc', 'Outside-fence requests with their evidence appear here for Operations review.', 'تظهر هنا طلبات خارج النطاق مع أدلتها لمراجعة العمليات.', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.inspector', 'Inspector', 'المفتش', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.captured', 'Captured', 'وقت الالتقاط', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.accuracy', 'Accuracy', 'الدقة', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.distance', 'Distance', 'المسافة', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.evidence', 'Photo evidence', 'دليل الصورة', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.viewEvidence', 'View photo', 'عرض الصورة', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.evidenceUnavailable', 'photo link unavailable', 'رابط الصورة غير متاح', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.safetyException', 'Safety/security photo exception declared', 'تم الإقرار باستثناء صورة للسلامة أو الأمن', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.expires', 'Expires', 'تنتهي الصلاحية', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.approve', 'Approve override', 'اعتماد التجاوز', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.reject', 'Reject', 'رفض', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.rejectReason', 'Rejection reason (mandatory to reject)', 'سبب الرفض (إلزامي للرفض)', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.deciding', 'Saving decision…', 'جارٍ حفظ القرار…', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.decided', 'Decision saved and the queue will refresh.', 'تم حفظ القرار وستُحدَّث قائمة الانتظار.', 'draft', 'SCR-WEB-500 override queue'),
  ('ops.override.failure', 'The decision could not be saved. Nothing changed.', 'تعذر حفظ القرار. لم يتغير شيء.', 'draft', 'SCR-WEB-500 override queue')
on conflict (key) do update set
  en = excluded.en, ar = excluded.ar, context = excluded.context
  where ui_strings.status = 'draft';
