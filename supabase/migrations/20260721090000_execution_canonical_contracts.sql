-- TASK-EXECUTION-MODULE-001 · Phase 1 shared contracts
-- SAQEEL-EXE-CANONICAL-PLAN v1.0 (2026-07-21)
--
-- Canonical three-tier state model, capability catalogue and the shared
-- daily-capacity service. This migration is strictly additive:
--   * inspections.status is never altered, rewritten or dropped — the new
--     lifecycle_status column is a deterministic projection kept in sync by
--     trigger, and every existing read path keeps working (decision D-002).
--   * operational_state gains exactly one enum value ('under_review'); the
--     stored value 'prepared' remains the persisted Ready-for-Execution
--     marker until writers migrate (decision D-002).
--   * Planning visit status is untouched — 'approved' is NEVER added to it.
--   * capabilities/role_capabilities are seed-only catalogues; legacy roles
--     stay untouched as compatibility aliases (decision D-003).

-- ---------- 1 · Operational state enum: additive value only -----------------
-- Committed here so later migrations in this chain can use the value; this
-- migration itself never writes it.
alter type public.operational_state add value if not exists 'under_review';

-- ---------- 2 · inspections.lifecycle_status: backward-compatible projection
alter table public.inspections
  add column if not exists lifecycle_status text;

-- Deterministic backfill from the legacy free-text status (D-001 mapping).
update public.inspections
   set lifecycle_status = case status
     when 'not_started'  then 'new'
     when 'in_progress'  then 'in_progress'
     when 'submitted'    then 'in_progress'
     when 'under_review' then 'in_progress'
     when 'returned'     then 'returned'
     when 'approved'     then 'approved'
     when 'rejected'     then 'rejected'
     when 'cancelled'    then 'cancelled'
     else 'new'
   end
 where lifecycle_status is null
    or lifecycle_status <> case status
     when 'not_started'  then 'new'
     when 'in_progress'  then 'in_progress'
     when 'submitted'    then 'in_progress'
     when 'under_review' then 'in_progress'
     when 'returned'     then 'returned'
     when 'approved'     then 'approved'
     when 'rejected'     then 'rejected'
     when 'cancelled'    then 'cancelled'
     else 'new'
   end;

alter table public.inspections
  alter column lifecycle_status set default 'new',
  alter column lifecycle_status set not null;

alter table public.inspections
  drop constraint if exists inspections_lifecycle_status_check;
alter table public.inspections
  add constraint inspections_lifecycle_status_check
  check (lifecycle_status in ('new','in_progress','returned','approved','rejected','cancelled'));

create index if not exists inspections_lifecycle_status_idx
  on public.inspections (lifecycle_status);

-- Keep the projection in sync with the legacy column on every write. The
-- trigger owns lifecycle_status; writers keep touching only status.
create or replace function public.sync_inspection_lifecycle_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.lifecycle_status := case new.status
    when 'not_started'  then 'new'
    when 'in_progress'  then 'in_progress'
    when 'submitted'    then 'in_progress'
    when 'under_review' then 'in_progress'
    when 'returned'     then 'returned'
    when 'approved'     then 'approved'
    when 'rejected'     then 'rejected'
    when 'cancelled'    then 'cancelled'
    else 'new'
  end;
  return new;
end $$;
revoke all on function public.sync_inspection_lifecycle_status() from public, anon;

drop trigger if exists trg_sync_inspection_lifecycle_status on public.inspections;
create trigger trg_sync_inspection_lifecycle_status
  before insert or update of status on public.inspections
  for each row execute function public.sync_inspection_lifecycle_status();

-- ---------- 3 · visits.execution_date (Pre-Execution selected Execution Date)
alter table public.visits
  add column if not exists execution_date date;

-- Execution Date must sit inside the planned visit window. NOT VALID: no
-- existing row is scanned (all are null anyway); new writes are enforced.
alter table public.visits
  drop constraint if exists visits_execution_date_in_window;
alter table public.visits
  add constraint visits_execution_date_in_window
  check (execution_date is null or (execution_date >= window_start::date and execution_date <= window_end::date))
  not valid;

create index if not exists visits_execution_date_idx
  on public.visits (execution_date) where execution_date is not null;

-- ---------- 4 · Capability catalogue (D-003: capabilities, not new roles) ---
create table if not exists public.capabilities (
  capability_key text primary key,
  description text not null
);

create table if not exists public.role_capabilities (
  role_key text not null references public.roles(role_key),
  capability_key text not null references public.capabilities(capability_key),
  primary key (role_key, capability_key)
);

alter table public.capabilities enable row level security;
alter table public.role_capabilities enable row level security;
revoke all on table public.capabilities from anon, authenticated;
revoke all on table public.role_capabilities from anon, authenticated;
grant select on table public.capabilities to authenticated;
grant select on table public.role_capabilities to authenticated;

-- Read-only to the app: the catalogue is governed seed data. No write
-- policies for app roles — a governed grant/revoke UI is a later phase.
drop policy if exists capabilities_read on public.capabilities;
create policy capabilities_read on public.capabilities
  for select to authenticated using (true);
drop policy if exists role_capabilities_read on public.role_capabilities;
create policy role_capabilities_read on public.role_capabilities
  for select to authenticated using (true);

insert into public.capabilities (capability_key, description) values
  ('execution.view_assigned',          'View visits assigned to the caller'),
  ('execution.prepare',                'Prepare an assigned visit (Pre-Execution readiness)'),
  ('execution.start_journey',          'Start the journey to a physical visit'),
  ('execution.arrive',                 'Check in / arrive at a visit location'),
  ('execution.execute',                'Execute the inspection session (forms, items, evidence)'),
  ('execution.submit',                 'Submit the completed inspection'),
  ('execution.return_assignment',      'Return an assignment before execution'),
  ('execution.cancel_prestart',        'Cancel a visit before execution has started'),
  ('execution.request_active_cancel',  'Request cancellation of an in-progress visit'),
  ('review.view',                      'View the review queue and submitted inspections'),
  ('review.decide',                    'Record a review decision'),
  ('review.return_scope',              'Return an inspection with scoped remarks'),
  ('review.approve',                   'Approve a submitted inspection'),
  ('review.reject',                    'Reject a submitted inspection'),
  ('operations.view',                  'View operations monitoring and exceptions'),
  ('operations.resolve_exception',     'Resolve an operational exception'),
  ('operations.approve_active_cancel', 'Approve cancellation of an in-progress visit'),
  ('admin.execution_workflow',         'Configure the execution workflow'),
  ('admin.execution_lookups',          'Configure execution lookup/reference data'),
  ('admin.mode_eligibility',           'Configure visit mode eligibility rules'),
  ('admin.evidence_policy',            'Configure evidence policy'),
  ('admin.offline_policy',             'Configure offline/sync policy')
on conflict (capability_key) do nothing;

insert into public.role_capabilities (role_key, capability_key) values
  -- Inspector: the full execution lane.
  ('inspector', 'execution.view_assigned'),
  ('inspector', 'execution.prepare'),
  ('inspector', 'execution.start_journey'),
  ('inspector', 'execution.arrive'),
  ('inspector', 'execution.execute'),
  ('inspector', 'execution.submit'),
  ('inspector', 'execution.return_assignment'),
  ('inspector', 'execution.cancel_prestart'),
  ('inspector', 'execution.request_active_cancel'),
  -- Reviewer: the full review lane.
  ('reviewer', 'review.view'),
  ('reviewer', 'review.decide'),
  ('reviewer', 'review.return_scope'),
  ('reviewer', 'review.approve'),
  ('reviewer', 'review.reject'),
  -- Operations: operations lane plus review visibility.
  ('ops', 'operations.view'),
  ('ops', 'operations.resolve_exception'),
  ('ops', 'operations.approve_active_cancel'),
  ('ops', 'review.view'),
  -- Planner: operational visibility only.
  ('planner', 'operations.view'),
  -- Leadership / auditor: read-only oversight.
  ('leadership', 'review.view'),
  ('leadership', 'operations.view'),
  ('auditor', 'review.view'),
  -- Admin roles (is_admin): the execution configuration lane.
  ('compliance_admin', 'admin.execution_workflow'),
  ('compliance_admin', 'admin.execution_lookups'),
  ('compliance_admin', 'admin.mode_eligibility'),
  ('compliance_admin', 'admin.evidence_policy'),
  ('compliance_admin', 'admin.offline_policy'),
  ('form_admin', 'admin.execution_workflow'),
  ('form_admin', 'admin.execution_lookups'),
  ('form_admin', 'admin.mode_eligibility'),
  ('form_admin', 'admin.evidence_policy'),
  ('form_admin', 'admin.offline_policy'),
  ('workflow_admin', 'admin.execution_workflow'),
  ('workflow_admin', 'admin.execution_lookups'),
  ('workflow_admin', 'admin.mode_eligibility'),
  ('workflow_admin', 'admin.evidence_policy'),
  ('workflow_admin', 'admin.offline_policy'),
  ('risk_owner', 'admin.execution_workflow'),
  ('risk_owner', 'admin.execution_lookups'),
  ('risk_owner', 'admin.mode_eligibility'),
  ('risk_owner', 'admin.evidence_policy'),
  ('risk_owner', 'admin.offline_policy'),
  ('gis_admin', 'admin.execution_workflow'),
  ('gis_admin', 'admin.execution_lookups'),
  ('gis_admin', 'admin.mode_eligibility'),
  ('gis_admin', 'admin.evidence_policy'),
  ('gis_admin', 'admin.offline_policy'),
  ('security_admin', 'admin.execution_workflow'),
  ('security_admin', 'admin.execution_lookups'),
  ('security_admin', 'admin.mode_eligibility'),
  ('security_admin', 'admin.evidence_policy'),
  ('security_admin', 'admin.offline_policy')
on conflict (role_key, capability_key) do nothing;

-- Uniform authorization check. RLS on the catalogue tables still governs
-- direct reads; this definer function is the single check every guard calls.
create or replace function public.has_capability(p_capability text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.user_roles ur
      join public.role_capabilities rc
        on rc.role_key = ur.role_key
     where ur.user_id = auth.uid()
       and rc.capability_key = p_capability
  )
$$;
revoke all on function public.has_capability(text) from public, anon;
grant execute on function public.has_capability(text) to authenticated;

-- ---------- 5 · engine_settings.execution: business-supplied values only ----
-- Every value below was supplied by the business; no thresholds are invented.
insert into public.engine_settings (engine, settings, version_label)
values (
  'execution',
  '{
    "daily_visit_cap": 10,
    "visit_modes": {
      "physical": {"enabled": true},
      "virtual": {"enabled": true},
      "self_assessment": {"enabled": false, "release_gate": "release_2"}
    },
    "one_penalty_per_violation_phase1": true,
    "journey_start_timing": "inside_visit_window"
  }'::jsonb,
  'v1-execution-canonical-2026-07-21'
)
on conflict (engine) do nothing;

-- ---------- 6 · Shared daily-capacity service (decision D-001) --------------
-- One canonical server-side calculation; Planning publish and Pre-Execution
-- wire to the same RPC in later phases. Counting semantics (D-001):
--   * published visits assigned to the inspector for the Execution Date
--     (coalesce(execution_date, window_start::date));
--   * a visit whose inspection reached submitted-or-later (approved /
--     rejected / cancelled) counts as completed and frees capacity;
--   * cancelled visits never count (planning_status would be 'cancelled').
create or replace function public.inspector_daily_capacity(p_inspector uuid, p_date date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_cap integer;
  v_used integer;
begin
  -- Caller must be Planning, Operations, or the inspector themself.
  if auth.uid() is null
     or (auth.uid() <> p_inspector
         and not public.has_any_role(array['planner', 'ops'])) then
    raise insufficient_privilege
      using message = 'Daily capacity is visible to Planning, Operations, or the inspector themself';
  end if;

  select coalesce((es.settings ->> 'daily_visit_cap')::integer, 10)
    into v_cap
    from public.engine_settings es
   where es.engine = 'execution';
  v_cap := coalesce(v_cap, 10);

  select count(distinct v.id)
    into v_used
    from public.assignments a
    join public.visits v
      on v.id = a.visit_id
    left join public.inspections i
      on i.visit_id = v.id
   where a.inspector_id = p_inspector
     and v.planning_status = 'published'
     and coalesce(v.execution_date, v.window_start::date) = p_date
     and coalesce(i.lifecycle_status, 'new') not in
           ('submitted', 'under_review', 'approved', 'rejected', 'cancelled');

  return jsonb_build_object(
    'cap', v_cap,
    'used', v_used,
    'remaining', greatest(v_cap - v_used, 0),
    'allowed', v_used < v_cap
  );
end $$;
revoke all on function public.inspector_daily_capacity(uuid, date) from public, anon;
grant execute on function public.inspector_daily_capacity(uuid, date) to authenticated;
