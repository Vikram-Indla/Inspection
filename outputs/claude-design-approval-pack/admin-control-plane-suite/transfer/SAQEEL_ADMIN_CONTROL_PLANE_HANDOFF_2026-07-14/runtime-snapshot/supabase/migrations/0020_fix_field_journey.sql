-- ============================================================================
-- Migration 0020 — FIX WAVE / slice F3: field journey extras, field
-- cancellation request flow, inspector return, drag-reschedule requests.
--
-- Rows closed (with app code in the same slice):
--   MVP1-M04-056/057/058 — field cancel-visit at arrival: configurable reasons
--                          (governed engine row 'field'), mandatory reason +
--                          comments, evidence linked to the cancellation.
--   MVP1-M03-006         — inspector return: assignment -> returned, visit
--                          flagged return_requested, planner notified.
--   MVP1-M03-005         — inspector drag-reschedule REQUEST (proposed window)
--                          with planner notification; visits stay planner/ops-
--                          owned (visits_update RLS, 0002) — honest request flow.
--
-- RLS: deny-by-default preserved. Inspectors never gain visits UPDATE; every
-- write below goes through SECURITY DEFINER guards that enforce RBAC-009
-- (is_assigned_inspector) exactly like set_operational_state (0015).
-- NOT applied here — orchestrator applies.
-- ============================================================================

-- ---------- 1 · evidence may link to a cancellation (M04-058) ----------------
-- New enum value is not consumed inside this migration (PG12+ txn rule).
alter type evidence_link add value if not exists 'cancellation';

-- Cancellation happens at arrival — before any inspections row exists — so
-- evidence gains a visit-level anchor. Existing inspection-linked semantics
-- are untouched (additive only).
alter table evidence add column if not exists visit_id uuid references visits(id);
alter table evidence alter column inspection_id drop not null;
alter table evidence drop constraint if exists evidence_link_target;
alter table evidence add constraint evidence_link_target
  check (inspection_id is not null or visit_id is not null);

create index if not exists idx_evidence_visit on evidence (visit_id) where visit_id is not null;

-- RLS: visit-linked evidence readable/writable by the assigned inspector;
-- planner/ops/reviewer/auditor read it when triaging the cancellation request.
drop policy if exists evidence_visit_rw on evidence;
create policy evidence_visit_rw on evidence for all using (
  visit_id is not null and (is_assigned_inspector(visit_id) or has_any_role(array['planner','ops','reviewer','auditor']))
) with check (
  visit_id is not null and is_assigned_inspector(visit_id));

-- ---------- 2 · request flags on visits (inspector-originated, guarded) ------
alter table visits
  add column if not exists cancellation_requested jsonb,  -- {reason_key, reason, comment, requested_by, requested_at} (M04-056)
  add column if not exists return_requested jsonb,        -- {reason, requested_by, requested_at} (M03-006)
  add column if not exists reschedule_requested jsonb;    -- {proposed_start, proposed_end, reason, requested_by, requested_at} (M03-005)

-- ---------- 3 · governed field configuration (M04-057) -----------------------
-- Cancellation reasons are configuration, not code. Seed is the v1 governed
-- list; admins amend it through engine_settings (engine_write RLS, 0002).
insert into engine_settings (engine, settings, version_label) values
 ('field', '{"cancellation_reasons":[
    {"key":"factory_closed","en":"Factory closed at arrival","ar":"المصنع مغلق عند الوصول"},
    {"key":"access_denied","en":"Access denied by factory","ar":"رفض المصنع السماح بالدخول"},
    {"key":"rep_unavailable","en":"Factory representative unavailable","ar":"ممثل المصنع غير متوفر"},
    {"key":"safety_risk","en":"Safety risk on site","ar":"خطر على السلامة في الموقع"},
    {"key":"wrong_location","en":"Wrong or unreachable location","ar":"موقع خاطئ أو يتعذر الوصول إليه"},
    {"key":"other","en":"Other (comment mandatory)","ar":"أخرى (التعليق إلزامي)"}
  ]}', 'v1-accepted-2026-07-12')
on conflict (engine) do nothing;

-- ---------- 4 · fan-out helper (planner/ops notification rows) ---------------
create or replace function notify_roles(p_roles text[], p_event text, p_payload jsonb)
returns void language sql security definer set search_path = public as $$
  insert into notifications (event_key, recipient, payload, channel, delivery_state, delivered_at)
  select p_event, ur.user_id, p_payload, 'inapp', 'delivered', now()
    from user_roles ur where ur.role_key = any(p_roles);
$$;
revoke all on function notify_roles(text[], text, jsonb) from public;
-- internal helper: callable only from the definer functions below (no grant).

-- ---------- 5 · M04-056/057 — cancellation REQUEST at arrival ----------------
-- Inspector requests; the actual cancel (planning_status transition) remains a
-- planner/ops action per visits_update RLS. planning_status is NOT touched.
create or replace function request_visit_cancellation(p_visit uuid, p_reason_key text, p_comment text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare cfg jsonb; reason jsonb; v_factory text; req jsonb;
begin
  if auth.uid() is null or not is_assigned_inspector(p_visit) then
    raise exception 'Not the assigned inspector for this visit (RBAC-009)';
  end if;
  select settings into cfg from engine_settings where engine = 'field';
  if cfg is null then
    raise exception 'Field engine configuration missing (engine_settings.field)';
  end if;
  select r into reason from jsonb_array_elements(cfg->'cancellation_reasons') r
   where r->>'key' = p_reason_key;
  if reason is null then
    raise exception 'Unknown cancellation reason "%" — governed list lives in engine_settings.field (M04-057)', p_reason_key;
  end if;
  if p_reason_key = 'other' and coalesce(trim(p_comment), '') = '' then
    raise exception 'Comment is mandatory for reason "other" (M04-057)';
  end if;
  select f.name into v_factory from visits v join factories f on f.id = v.factory_id where v.id = p_visit;
  if v_factory is null then
    raise exception 'Visit not found';
  end if;
  req := jsonb_build_object(
    'reason_key', p_reason_key, 'reason', reason->>'en', 'comment', nullif(trim(coalesce(p_comment, '')), ''),
    'requested_by', auth.uid(), 'requested_at', now());
  update visits set
    cancellation_requested = req,
    -- operational note on the visit record (M04-056) — planning_status untouched
    notes = coalesce(notes, '')
          || case when coalesce(notes, '') = '' then '' else e'\n' end
          || '[' || to_char(now() at time zone 'utc', 'YYYY-MM-DD HH24:MI') || 'Z] cancellation requested by inspector — '
          || (reason->>'en') || coalesce(': ' || nullif(trim(p_comment), ''), '')
  where id = p_visit;                                       -- trg_audit on visits records the change
  perform notify_roles(array['planner','ops'], 'cancellation_requested',
    jsonb_build_object('visit_id', p_visit, 'factory', v_factory, 'reason', reason->>'en',
                       'reason_key', p_reason_key, 'comment', p_comment, 'requested_by', auth.uid()));
  return req;
end $$;
revoke all on function request_visit_cancellation(uuid, text, text) from public;
grant execute on function request_visit_cancellation(uuid, text, text) to authenticated;

-- ---------- 6 · M03-006 — inspector return (assignment + planner ping) -------
create or replace function request_visit_return(p_visit uuid, p_reason text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_factory text; req jsonb;
begin
  if auth.uid() is null or not is_assigned_inspector(p_visit) then
    raise exception 'Not the assigned inspector for this visit (RBAC-009)';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'Return reason is mandatory (M03-006)';
  end if;
  select f.name into v_factory from visits v join factories f on f.id = v.factory_id where v.id = p_visit;
  if v_factory is null then
    raise exception 'Visit not found';
  end if;
  -- STM-ASG: assignment moves to returned with the reason (existing columns, 0001)
  update assignments set status = 'returned', return_reason = trim(p_reason)
   where visit_id = p_visit and inspector_id = auth.uid();
  req := jsonb_build_object('reason', trim(p_reason), 'requested_by', auth.uid(), 'requested_at', now());
  update visits set return_requested = req where id = p_visit;
  perform notify_roles(array['planner'], 'return_requested',
    jsonb_build_object('visit_id', p_visit, 'factory', v_factory, 'reason', trim(p_reason), 'requested_by', auth.uid()));
  return req;
end $$;
revoke all on function request_visit_return(uuid, text) from public;
grant execute on function request_visit_return(uuid, text) to authenticated;

-- ---------- 7 · M03-005 — reschedule REQUEST (proposed window) ----------------
create or replace function request_visit_reschedule(p_visit uuid, p_start timestamptz, p_end timestamptz, p_reason text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_factory text; req jsonb;
begin
  if auth.uid() is null or not is_assigned_inspector(p_visit) then
    raise exception 'Not the assigned inspector for this visit (RBAC-009)';
  end if;
  if p_start is null or p_end is null or p_end <= p_start then
    raise exception 'Proposed window must have end after start (FLD-PLAN-004/005)';
  end if;
  select f.name into v_factory from visits v join factories f on f.id = v.factory_id where v.id = p_visit;
  if v_factory is null then
    raise exception 'Visit not found';
  end if;
  req := jsonb_build_object('proposed_start', p_start, 'proposed_end', p_end,
    'reason', nullif(trim(coalesce(p_reason, '')), ''), 'requested_by', auth.uid(), 'requested_at', now());
  update visits set reschedule_requested = req where id = p_visit;   -- window itself stays planner-owned
  perform notify_roles(array['planner'], 'reschedule_requested',
    jsonb_build_object('visit_id', p_visit, 'factory', v_factory,
                       'proposed_start', p_start, 'proposed_end', p_end,
                       'reason', p_reason, 'requested_by', auth.uid()));
  return req;
end $$;
revoke all on function request_visit_reschedule(uuid, timestamptz, timestamptz, text) from public;
grant execute on function request_visit_reschedule(uuid, timestamptz, timestamptz, text) to authenticated;
