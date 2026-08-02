-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- ============================================================================
-- SAQEEL Planning Module — Migration 2 of 2: Canonical planning data
-- structures (PLANNING_STATE_AND_WORKFLOW_CONTRACT, 2026-07-20 pack).
-- ============================================================================

-- ---------- 1 · Stable business reference sequences -------------------------
create sequence if not exists public.plan_reference_seq;
create sequence if not exists public.visit_reference_seq;

-- ---------- 2 · Governed planning lookups -----------------------------------
create table if not exists public.planning_lookups (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  key text not null,
  label_en text not null,
  label_ar text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, key)
);

comment on table public.planning_lookups is
  'SAQEEL governed planning reference data. kinds: visit_type, visit_mode, priority, return_reason, cancellation_reason, manual_entry_reason, assignment_override_reason.';

insert into public.planning_lookups (kind, key, label_en, label_ar, sort_order, metadata) values
  ('visit_type', 'periodic',   'Periodic',   null, 10, '{"manual_entry_allowed":false,"location_required":true}'),
  ('visit_type', 'follow_up',  'Follow-up',  null, 20, '{"manual_entry_allowed":false,"location_required":true}'),
  ('visit_type', 'complaint',  'Complaint',  null, 30, '{"manual_entry_allowed":false,"location_required":true}'),
  ('visit_mode', 'physical',       'Physical',       null, 10, '{"location_required":true}'),
  ('visit_mode', 'virtual',        'Virtual',        null, 20, '{"location_required":false}'),
  ('visit_mode', 'administrative', 'Administrative', null, 30, '{"location_required":false}'),
  ('priority', 'low',    'Low',    null, 10, '{}'),
  ('priority', 'medium', 'Medium', null, 20, '{}'),
  ('priority', 'high',   'High',   null, 30, '{}'),
  ('priority', 'urgent', 'Urgent', null, 40, '{}'),
  ('return_reason', 'inspector_unavailable', 'Inspector unavailable', null, 10, '{}'),
  ('return_reason', 'factory_not_ready',     'Factory not ready',     null, 20, '{}'),
  ('return_reason', 'wrong_scope',           'Wrong scope',           null, 30, '{}'),
  ('return_reason', 'duplicate',             'Duplicate visit',       null, 40, '{}'),
  ('return_reason', 'other',                 'Other (comment mandatory)', null, 90, '{"attachment_required":false}'),
  ('manual_entry_reason', 'not_found_in_registry', 'Not found in registry', null, 10, '{"manual_entry_allowed":true}'),
  ('manual_entry_reason', 'unlicensed_activity',   'Unlicensed activity',   null, 20, '{"manual_entry_allowed":true}'),
  ('manual_entry_reason', 'new_establishment',     'New establishment',     null, 30, '{"manual_entry_allowed":true}'),
  ('manual_entry_reason', 'other',                 'Other (comment mandatory)', null, 90, '{"manual_entry_allowed":true}'),
  ('assignment_override_reason', 'workload_balance',    'Workload balance',    null, 10, '{}'),
  ('assignment_override_reason', 'regional_expertise',  'Regional expertise',  null, 20, '{}'),
  ('assignment_override_reason', 'inspector_request',   'Inspector request',   null, 30, '{}'),
  ('assignment_override_reason', 'other',               'Other (comment mandatory)', null, 90, '{}')
on conflict (kind, key) do nothing;

insert into public.planning_lookups (kind, key, label_en, label_ar, sort_order, metadata)
select 'cancellation_reason',
       r->>'key',
       r->>'en',
       r->>'ar',
       (row_number() over (order by r->>'key')) * 10,
       '{}'::jsonb
  from engine_settings es
  cross join lateral jsonb_array_elements(es.settings->'cancellation_reasons') r
 where es.engine = 'field'
on conflict (kind, key) do nothing;

-- ---------- 3 · Configurable expiry rules ------------------------------------
create table if not exists public.planning_expiry_rules (
  id uuid primary key default gen_random_uuid(),
  rule_type text not null check (rule_type in (
    'no_acknowledgement',
    'no_execution_date',
    'no_execution_start',
    'not_completed_at_window_end'
  )),
  enabled boolean not null default true,
  scope jsonb not null default '{}',
  offset_minutes int not null default 0,
  reason text,
  notify_plan_creator boolean not null default true,
  notify_inspector boolean not null default true,
  version int not null default 1,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  unique (rule_type, version)
);

comment on table public.planning_expiry_rules is
  'SAQEEL scheduled visit-expiry rule families (enabled/versioned by planning.configure_expiry admins). The scheduler evaluates enabled rules idempotently and stamps visits.expired_by_rule_id.';

insert into public.planning_expiry_rules (rule_type, enabled, offset_minutes, reason)
values ('not_completed_at_window_end', true, 0, 'Window elapsed before inspection started')
on conflict (rule_type, version) do nothing;

-- ---------- 4 · visit_plans additions ---------------------------------------
alter table public.visit_plans
  add column if not exists draft_payload jsonb not null default '{}',
  add column if not exists draft_version int not null default 0,
  add column if not exists source_channel text,
  add column if not exists archived_at timestamptz,
  add column if not exists plan_reference text;

update public.visit_plans
   set plan_reference = 'BP-' || nextval('public.plan_reference_seq')
 where plan_reference is null;

alter table public.visit_plans
  alter column plan_reference set default ('BP-' || nextval('public.plan_reference_seq'::regclass)),
  alter column plan_reference set not null;

create unique index if not exists visit_plans_plan_reference_uq
  on public.visit_plans (plan_reference);

-- ---------- 5 · visits additions --------------------------------------------
alter table public.visits
  add column if not exists visit_reference text,
  add column if not exists source_channel text,
  add column if not exists internal_reference text,
  add column if not exists original_lat numeric(10,7),
  add column if not exists original_lng numeric(10,7),
  add column if not exists expired_by_rule_id uuid references public.planning_expiry_rules(id);

-- Exception-safe per-row backfill: legacy fixture rows violating NOT VALID
-- check constraints (window_plausible_years, visits_immediate_reason_contract)
-- cannot be updated at all; they keep a NULL reference. Default covers new rows.
do $$
declare r record;
begin
  for r in select id from public.visits where visit_reference is null loop
    begin
      update public.visits
         set visit_reference = 'V-' || nextval('public.visit_reference_seq')
       where id = r.id;
    exception when check_violation then
      null;
    end;
  end loop;
end $$;

alter table public.visits
  alter column visit_reference set default ('V-' || nextval('public.visit_reference_seq'::regclass));

create unique index if not exists visits_visit_reference_uq
  on public.visits (visit_reference);

do $$
declare r record;
begin
  for r in
    select v.id, f.official_lat, f.official_lng
      from public.visits v
      join public.factories f on f.id = v.factory_id
     where v.original_lat is null
       and v.original_lng is null
  loop
    begin
      update public.visits
         set original_lat = r.official_lat,
             original_lng = r.official_lng
       where id = r.id;
    exception when check_violation then
      null;
    end;
  end loop;
end $$;

-- ---------- 6 · visit_packages ----------------------------------------------
create table if not exists public.visit_packages (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id),
  package_version_id uuid not null references public.package_versions(id),
  snapshot jsonb,
  added_by uuid references public.profiles(user_id),
  added_at timestamptz not null default now(),
  unique (visit_id, package_version_id)
);

comment on table public.visit_packages is
  'SAQEEL: packages attached to a visit. visits.package_version_id remains the first/primary package link and is never deprecated by this table.';

insert into public.visit_packages (visit_id, package_version_id, added_by)
select v.id, v.package_version_id, v.created_by
  from public.visits v
 where v.package_version_id is not null
on conflict (visit_id, package_version_id) do nothing;

-- ---------- 7 · visit_lifecycle_events --------------------------------------
create table if not exists public.visit_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id),
  event_type text not null check (event_type in (
    'return', 'cancel', 'republish', 'expire',
    'duplicate', 'reschedule', 'reassign', 'discard_draft'
  )),
  reason_key text,
  comments text,
  actor uuid,
  previous jsonb not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.visit_lifecycle_events is
  'SAQEEL append-only planning lifecycle stream (return/cancel/republish/expire/duplicate/reschedule/reassign/discard_draft). Append-only: no update/delete policies.';

insert into public.visit_lifecycle_events (visit_id, event_type, reason_key, actor, previous)
select v.id,
       'return',
       nullif(btrim(substring(v.notes from 11)), ''),
       null,
       jsonb_build_object('planning_status', 'published', 'backfill', 'notes_prefix')
  from public.visits v
 where v.planning_status = 'returned'
   and v.notes like 'RETURNED: %'
   and not exists (
     select 1 from public.visit_lifecycle_events e
      where e.visit_id = v.id and e.event_type = 'return'
   );

insert into public.visit_lifecycle_events (visit_id, event_type, reason_key, actor, previous)
select v.id,
       'cancel',
       v.cancellation_reason,
       null,
       jsonb_build_object('planning_status', 'published', 'backfill', 'cancellation_reason')
  from public.visits v
 where v.planning_status = 'cancelled'
   and v.cancellation_reason is not null
   and not exists (
     select 1 from public.visit_lifecycle_events e
      where e.visit_id = v.id and e.event_type = 'cancel'
   );

-- ---------- 8 · visit_location_events ---------------------------------------
create table if not exists public.visit_location_events (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id),
  lat numeric(10,7) not null,
  lng numeric(10,7) not null,
  source text not null check (source in (
    'License', 'Planner', 'Inspector', 'Integration', 'Historical Inspection'
  )),
  actor uuid,
  note text,
  created_at timestamptz not null default now()
);

comment on table public.visit_location_events is
  'SAQEEL per-visit location provenance stream. visits.planner_lat/lng remains the current planned pin; visits.original_lat/lng preserves the first pin.';

insert into public.visit_location_events (visit_id, lat, lng, source, actor, note)
select v.id,
       v.planner_lat,
       v.planner_lng,
       case when v.visit_location_source = 'manual' then 'Planner' else 'License' end,
       v.created_by,
       'Backfilled from visits.planner_lat/lng'
  from public.visits v
 where v.planner_lat is not null
   and v.planner_lng is not null
   and not exists (
     select 1 from public.visit_location_events e
      where e.visit_id = v.id
   );

-- ---------- 9 · RLS ---------------------------------------------------------
alter table public.planning_lookups enable row level security;
create policy planning_lookups_read on public.planning_lookups for select
  using (auth.uid() is not null);
create policy planning_lookups_write on public.planning_lookups for insert
  with check (has_planning_capability('planning.configure_lookups'));
create policy planning_lookups_update on public.planning_lookups for update
  using (has_planning_capability('planning.configure_lookups'));

alter table public.planning_expiry_rules enable row level security;
create policy planning_expiry_rules_read on public.planning_expiry_rules for select
  using (auth.uid() is not null);
create policy planning_expiry_rules_write on public.planning_expiry_rules for insert
  with check (has_planning_capability('planning.configure_expiry'));
create policy planning_expiry_rules_update on public.planning_expiry_rules for update
  using (has_planning_capability('planning.configure_expiry'));

alter table public.visit_packages enable row level security;
create policy visit_packages_read on public.visit_packages for select
  using (
    has_planning_capability('planning.view')
    or has_any_role(array['planner','ops','reviewer','auditor','leadership','compliance_admin'])
    or exists (
      select 1 from public.assignments a
       where a.visit_id = visit_packages.visit_id
         and a.inspector_id = auth.uid()
    )
  );
create policy visit_packages_write on public.visit_packages for insert
  with check (
    has_planning_capability('planning.create')
    or has_planning_capability('planning.edit_draft')
  );
create policy visit_packages_update on public.visit_packages for update
  using (
    has_planning_capability('planning.create')
    or has_planning_capability('planning.edit_draft')
  );

alter table public.visit_lifecycle_events enable row level security;
create policy visit_lifecycle_events_read on public.visit_lifecycle_events for select
  using (
    has_planning_capability('planning.view')
    or has_any_role(array['planner','ops','reviewer','auditor','leadership','compliance_admin'])
    or exists (
      select 1 from public.assignments a
       where a.visit_id = visit_lifecycle_events.visit_id
         and a.inspector_id = auth.uid()
    )
  );
create policy visit_lifecycle_events_insert on public.visit_lifecycle_events for insert
  with check (
    has_planning_capability('planning.manage')
    or has_planning_capability('planning.cancel')
    or has_planning_capability('planning.reassign')
    or has_planning_capability('planning.reschedule')
    or has_planning_capability('planning.edit_draft')
  );

alter table public.visit_location_events enable row level security;
create policy visit_location_events_read on public.visit_location_events for select
  using (
    has_planning_capability('planning.view')
    or has_any_role(array['planner','ops','reviewer','auditor','leadership','compliance_admin'])
    or exists (
      select 1 from public.assignments a
       where a.visit_id = visit_location_events.visit_id
         and a.inspector_id = auth.uid()
    )
  );
create policy visit_location_events_insert on public.visit_location_events for insert
  with check (
    has_planning_capability('planning.correct_location')
    or has_planning_capability('planning.manage')
  );

-- ---------- 10 · Audit + updated_at wiring ----------------------------------
create or replace function public.planning_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_planning_lookups_touch on public.planning_lookups;
create trigger trg_planning_lookups_touch before update on public.planning_lookups
  for each row execute function public.planning_set_updated_at();

do $$ declare t text;
begin
  foreach t in array array[
    'planning_lookups',
    'planning_expiry_rules',
    'visit_packages',
    'visit_lifecycle_events',
    'visit_location_events'
  ] loop
    execute format(
      'drop trigger if exists trg_audit_%s on public.%I', t, t);
    execute format(
      'create trigger trg_audit_%s after insert or update or delete on public.%I for each row execute function audit_row_change()', t, t);
  end loop;
end $$;

-- ---------- 11 · Rule-driven lapse engine ------------------------------------
create or replace function public._expire_lapsed_visits_core(p_scope_sql text)
returns integer
language plpgsql volatile security definer set search_path = public as $$
declare
  r       record;
  v_ids   uuid[];
  v_total int := 0;
begin
  for r in
    select er.id, er.rule_type, er.offset_minutes, er.reason,
           er.notify_plan_creator, er.notify_inspector, er.scope
      from public.planning_expiry_rules er
     where er.enabled
       and (er.effective_from is null or er.effective_from <= now())
       and (er.effective_to is null or er.effective_to > now())
     order by er.rule_type, er.version
  loop
    v_ids := '{}'::uuid[];

    if r.rule_type = 'not_completed_at_window_end' then
      execute format($f$
        with lapsed as (
          update public.visits v
             set planning_status = 'expired',
                 expired_by_rule_id = $1
           where v.planning_status = 'published'
             and v.window_end + make_interval(mins => $2) < now()
             and not (
               v.visit_plan_id is null
               and v.immediate_creator_role = 'inspector'
             )
             and not exists (
               select 1 from public.inspections i
                where i.visit_id = v.id and i.status <> 'not_started')
             and (not ($3 ? 'visit_type')     or v.visit_type = $3->>'visit_type')
             and (not ($3 ? 'execution_mode') or v.execution_mode::text = $3->>'execution_mode')
             and (not ($3 ? 'priority')       or v.priority = $3->>'priority')
             and (%s)
          returning v.id)
        select coalesce(array_agg(id), '{}'::uuid[]) from lapsed
      $f$, p_scope_sql) into v_ids using r.id, r.offset_minutes, r.scope;

    elsif r.rule_type = 'no_execution_start' then
      execute format($f$
        with lapsed as (
          update public.visits v
             set planning_status = 'expired',
                 expired_by_rule_id = $1
           where v.planning_status = 'published'
             and v.operational_state = 'new'
             and v.window_start + make_interval(mins => $2) < now()
             and not (
               v.visit_plan_id is null
               and v.immediate_creator_role = 'inspector'
             )
             and not exists (
               select 1 from public.inspections i
                where i.visit_id = v.id and i.status <> 'not_started')
             and (not ($3 ? 'visit_type')     or v.visit_type = $3->>'visit_type')
             and (not ($3 ? 'execution_mode') or v.execution_mode::text = $3->>'execution_mode')
             and (not ($3 ? 'priority')       or v.priority = $3->>'priority')
             and (%s)
          returning v.id)
        select coalesce(array_agg(id), '{}'::uuid[]) from lapsed
      $f$, p_scope_sql) into v_ids using r.id, r.offset_minutes, r.scope;

    elsif r.rule_type = 'no_acknowledgement' then
      execute format($f$
        with lapsed as (
          update public.visits v
             set planning_status = 'expired',
                 expired_by_rule_id = $1
           where v.planning_status = 'published'
             and v.window_start + make_interval(mins => $2) < now()
             and exists (
               select 1 from public.assignments a
                where a.visit_id = v.id and a.status = 'assigned')
             and not (
               v.visit_plan_id is null
               and v.immediate_creator_role = 'inspector'
             )
             and not exists (
               select 1 from public.inspections i
                where i.visit_id = v.id and i.status <> 'not_started')
             and (not ($3 ? 'visit_type')     or v.visit_type = $3->>'visit_type')
             and (not ($3 ? 'execution_mode') or v.execution_mode::text = $3->>'execution_mode')
             and (not ($3 ? 'priority')       or v.priority = $3->>'priority')
             and (%s)
          returning v.id)
        select coalesce(array_agg(id), '{}'::uuid[]) from lapsed
      $f$, p_scope_sql) into v_ids using r.id, r.offset_minutes, r.scope;

    elsif r.rule_type = 'no_execution_date' then
      execute format($f$
        with lapsed as (
          update public.visits v
             set planning_status = 'expired',
                 expired_by_rule_id = $1
           where v.planning_status = 'published'
             and v.window_start is null
             and not (
               v.visit_plan_id is null
               and v.immediate_creator_role = 'inspector'
             )
             and (not ($3 ? 'visit_type')     or v.visit_type = $3->>'visit_type')
             and (not ($3 ? 'execution_mode') or v.execution_mode::text = $3->>'execution_mode')
             and (not ($3 ? 'priority')       or v.priority = $3->>'priority')
             and (%s)
          returning v.id)
        select coalesce(array_agg(id), '{}'::uuid[]) from lapsed
      $f$, p_scope_sql) into v_ids using r.id, r.offset_minutes, r.scope;
    end if;

    if array_length(v_ids, 1) is not null then
      insert into public.visit_lifecycle_events (visit_id, event_type, reason_key, comments, actor, previous)
      select v.id,
             'expire',
             r.rule_type,
             r.reason,
             null,
             jsonb_build_object(
               'planning_status', 'published',
               'window_end', v.window_end,
               'rule_id', r.id
             )
        from public.visits v
       where v.id = any(v_ids);

      if r.notify_inspector then
        insert into public.notifications (event_key, recipient, payload, channel, delivery_state, delivered_at)
        select 'visit_expired', a.inspector_id,
               jsonb_build_object('visit_id', v.id, 'window_end', v.window_end),
               'inapp', 'delivered', now()
          from public.visits v
          join public.assignments a on a.visit_id = v.id
         where v.id = any(v_ids)
           and a.inspector_id is not null;
      end if;

      if r.notify_plan_creator then
        insert into public.notifications (event_key, recipient, payload, channel, delivery_state, delivered_at)
        select 'visit_expired', p.created_by,
               jsonb_build_object('visit_id', v.id, 'window_end', v.window_end, 'planner', true),
               'inapp', 'delivered', now()
          from public.visits v
          join public.visit_plans p on p.id = v.visit_plan_id
         where v.id = any(v_ids)
           and p.created_by is not null;
      end if;

      v_total := v_total + array_length(v_ids, 1);
    end if;
  end loop;

  return v_total;
end;
$$;
revoke all on function public._expire_lapsed_visits_core(text) from public;

-- ---------- 12 · Indexes ------------------------------------------------------
create index if not exists visits_planning_status_idx
  on public.visits (planning_status);
create index if not exists visits_published_window_end_idx
  on public.visits (window_end) where planning_status = 'published';
create index if not exists visit_plans_active_status_idx
  on public.visit_plans (status) where archived_at is null;
create index if not exists visit_packages_visit_idx
  on public.visit_packages (visit_id);
create index if not exists visit_lifecycle_events_visit_idx
  on public.visit_lifecycle_events (visit_id);
create index if not exists visit_location_events_visit_idx
  on public.visit_location_events (visit_id);
create index if not exists planning_lookups_active_kind_idx
  on public.planning_lookups (kind) where is_active;
