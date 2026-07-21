-- TASK-EXECUTION-MODULE-001 · Phase 3A — Pre-Execution readiness backend
-- SAQEEL-EXE-CANONICAL-PLAN v1.0 §7/§8/§10
--
-- Preparation data model, readiness RPCs and the Planning daily-cap hook.
-- This migration is strictly additive:
--   * visits/inspections/assignments keep their columns and semantics; the
--     only writes are the plan-mandated Ready transitions (operational_state
--     new → 'prepared' ≡ "Ready for Execution", decision D-002) through
--     security-definer RPCs that enforce RBAC-009 + execution.prepare.
--   * The daily-cap counting rule is factored into ONE private SQL helper;
--     inspector_daily_capacity keeps its exact signature/contract and is
--     re-expressed over the helper, and the new inspector_window_capacity
--     uses the same helper (D-001/D-009).
--   * publish_single_visit / publish_bulk_plan are copied from
--     20260714091727_planning_publish_guards.sql with every guard,
--     notification and idempotency behavior preserved byte-for-byte; the ONLY
--     change is the EXE-CAPACITY-WINDOW-FULL evaluation after assignment
--     creation (D-009). create_immediate_visit is deliberately untouched.
--
-- Stable error tokens (mapped to neutral codes in
-- apps/web/src/lib/execution/readiness.ts):
--   EXE-PREP-DENIED              insufficient_privilege — not the assigned
--                                inspector or missing execution.prepare
--   EXE-PREP-VISIT-STATE         check_violation — visit missing / not
--                                published / not in a readiness state
--   EXE-PREP-DATE-WINDOW         check_violation — Execution Date outside the
--                                visit window
--   EXE-PREP-DATE-PAST           check_violation — Execution Date in the past
--   EXE-PREP-CAPACITY            check_violation — inspector daily cap reached
--   EXE-PREP-MODE-INELIGIBLE     check_violation — mode unknown, disabled,
--                                self_assessment (release_2), or missing its
--                                inputs (coordinates / OTP engine)
--   EXE-PREP-PACKAGE-REQUIRED    check_violation — no package resolved
--   EXE-PREP-PACKAGE-INACTIVE    check_violation — version not published or
--                                without inspection sections
--   EXE-PREP-MANDATORY-REMOVAL   check_violation — removal of a section the
--                                definition does not explicitly mark optional
--   EXE-PREP-DUPLICATE           check_violation — repeated keys/templates or
--                                action form already in the definition
--   EXE-PREP-CONFIG-INVALID      check_violation — malformed form_config
--   EXE-PREP-FORM-INELIGIBLE     check_violation — added action form is not a
--                                published action_form configuration template
--   EXE-PREP-REOPEN-REQUIRED     check_violation — save attempted after Ready
--   EXE-PREP-JOURNEY-STARTED     check_violation — preparation locked after
--                                journey start / inspection start
--   EXE-PREP-WORK-CAPTURED       check_violation — reopen refused once work
--                                (responses/evidence/started_at) exists
--   EXE-PREP-INCOMPLETE          check_violation — Ready without a complete
--                                saved preparation
--   EXE-CAPACITY-WINDOW-FULL     raise_exception — Planning publish: no day in
--                                the window has daily-cap availability

-- ---------- 1 · visit_preparations: the inspector's saved draft -------------
-- One row per visit. Saving NEVER changes visit/inspection state; only
-- confirm_visit_ready performs the Ready transition. form_config shape
-- (visit-specific composition, enforced by
-- private.execution_validate_form_config):
--   {
--     "removed_optional_section_keys":  text[],  -- D-007 fail closed: only
--                                                -- sections the definition
--                                                -- explicitly marks optional
--                                                -- (optional/removable = true,
--                                                -- mandatory absent or false)
--     "added_action_form_template_ids": uuid[],  -- published
--                                                -- configuration_templates of
--                                                -- template_type 'action_form'
--     "notify_factory": boolean                  -- factory notification opt-in
--   }
create table if not exists public.visit_preparations (
  visit_id uuid primary key references public.visits(id) on delete restrict,
  preparation_version integer not null default 1, -- bumped to the snapshot
                                                  -- version on every Ready
  execution_date date,
  confirmed_mode public.execution_mode,           -- null until confirmed
  package_version_id uuid references public.package_versions(id) on delete restrict,
  form_config jsonb not null default '{}'::jsonb,
  saved_by uuid references auth.users(id),
  saved_at timestamptz,
  confirmed_ready_at timestamptz,
  reopened_at timestamptz
);

comment on column public.visit_preparations.form_config is
  'Visit-specific composition: removed_optional_section_keys text[] (D-007 fail closed — only definition-explicit optional sections), added_action_form_template_ids uuid[] (published action_form configuration_templates), notify_factory boolean. Mandatory forms/sections are unremovable; changes affect only this visit.';

alter table public.visit_preparations enable row level security;
revoke all on table public.visit_preparations from anon, authenticated;
grant select, insert, update on table public.visit_preparations to authenticated;
-- No delete grant and no delete policy: preparations are never deleted.

drop policy if exists visit_preparations_read on public.visit_preparations;
create policy visit_preparations_read on public.visit_preparations
  for select to authenticated
  using (
    public.is_assigned_inspector(visit_id)
    or public.has_any_role(array['planner', 'ops', 'reviewer'])
  );
-- Assigned inspector writes their own draft PRE-READY only; the Ready
-- transition itself goes through the definer RPCs (which bypass RLS as the
-- function owner) so confirmed rows stay inspector-immutable at the table.
drop policy if exists visit_preparations_inspector_insert on public.visit_preparations;
create policy visit_preparations_inspector_insert on public.visit_preparations
  for insert to authenticated
  with check (public.is_assigned_inspector(visit_id));
drop policy if exists visit_preparations_inspector_update on public.visit_preparations;
create policy visit_preparations_inspector_update on public.visit_preparations
  for update to authenticated
  using (public.is_assigned_inspector(visit_id))
  with check (public.is_assigned_inspector(visit_id) and confirmed_ready_at is null);

-- ---------- 2 · visit_package_snapshots: immutable per-Ready package --------
-- The visit-specific immutable package version: the published definition with
-- the visit form_config applied, plus a sha256 checksum over the canonical
-- jsonb rendering. Every Ready confirmation appends a new row; reopening
-- never touches history.
create table if not exists public.visit_package_snapshots (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete restrict,
  preparation_version integer not null,
  package_version_id uuid not null references public.package_versions(id) on delete restrict,
  definition jsonb not null,             -- resolved: definition + form_config
  checksum text not null,                -- sha256 hex of definition::text
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (visit_id, preparation_version)
);

alter table public.visit_package_snapshots enable row level security;
revoke all on table public.visit_package_snapshots from anon, authenticated;
grant select on table public.visit_package_snapshots to authenticated;
-- SELECT-only: inserts happen exclusively inside confirm_visit_ready
-- (security definer); updates/deletes are blocked by the guard trigger below.

drop policy if exists visit_package_snapshots_read on public.visit_package_snapshots;
create policy visit_package_snapshots_read on public.visit_package_snapshots
  for select to authenticated
  using (
    public.is_assigned_inspector(visit_id)
    or public.has_any_role(array['planner', 'ops', 'reviewer', 'leadership'])
  );

-- Same guard pattern as package_version_item_snapshots (20260715200000).
create or replace function public.guard_visit_package_snapshot()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'IMMUTABLE: visit package snapshots cannot be changed';
end $$;
revoke all on function public.guard_visit_package_snapshot() from public, anon;
drop trigger if exists trg_guard_visit_package_snapshot on public.visit_package_snapshots;
create trigger trg_guard_visit_package_snapshot
  before update or delete on public.visit_package_snapshots
  for each row execute function public.guard_visit_package_snapshot();

-- ---------- 3 · private.execution_daily_used: the single counting rule ------
-- D-001/D-009: ONE shared server-side calculation. Both public capacity RPCs
-- and the readiness RPCs evaluate this helper; Planning publish evaluates the
-- window RPC built on it. Counting semantics are identical to the Phase 1
-- service: published visits assigned to the inspector whose effective
-- Execution Date (coalesce(execution_date, window_start::date)) is p_date and
-- whose inspection has NOT reached submitted-or-later.
create or replace function private.execution_daily_used(p_inspector uuid, p_date date)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct v.id)::integer
    from public.assignments a
    join public.visits v
      on v.id = a.visit_id
    left join public.inspections i
      on i.visit_id = v.id
   where a.inspector_id = p_inspector
     and v.planning_status = 'published'
     and coalesce(v.execution_date, v.window_start::date) = p_date
     and coalesce(i.lifecycle_status, 'new') not in
           ('submitted', 'under_review', 'approved', 'rejected', 'cancelled')
$$;
revoke all on function private.execution_daily_used(uuid, date) from public, anon, authenticated;

-- The governed cap (engine_settings.execution.daily_visit_cap, default 10 —
-- business-supplied, Phase 1). Read in exactly one place.
create or replace function private.execution_daily_cap()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select coalesce((es.settings ->> 'daily_visit_cap')::integer, 10)
       from public.engine_settings es
      where es.engine = 'execution'),
    10
  )
$$;
revoke all on function private.execution_daily_cap() from public, anon, authenticated;

-- ---------- 4 · form_config validator + resolver (shared by save/confirm) ---
create or replace function private.execution_validate_form_config(p_definition jsonb, p_form_config jsonb)
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  v_removed text[];
  v_added text[];
  v_key text;
begin
  -- Removed sections — D-007 fail closed: only sections the definition
  -- EXPLICITLY marks optional (optional/removable = true, mandatory absent or
  -- false) may be removed. When the definition carries no optionality
  -- metadata, NO removals are allowed.
  if p_form_config ? 'removed_optional_section_keys' then
    if jsonb_typeof(p_form_config -> 'removed_optional_section_keys') <> 'array' then
      raise check_violation
        using message = 'EXE-PREP-CONFIG-INVALID: removed_optional_section_keys must be an array of section keys';
    end if;
    select coalesce(array_agg(r.value), '{}'::text[]) into v_removed
      from jsonb_array_elements_text(p_form_config -> 'removed_optional_section_keys') as r(value);
    if (select count(*) from unnest(v_removed))
       <> (select count(distinct u.k) from unnest(v_removed) as u(k)) then
      raise check_violation
        using message = 'EXE-PREP-DUPLICATE: removed section keys must not repeat';
    end if;
    if coalesce(array_length(v_removed, 1), 0) > 0 then
      if p_definition is null then
        raise check_violation
          using message = 'EXE-PREP-PACKAGE-REQUIRED: a package must be resolved before sections can be removed';
      end if;
      foreach v_key in array v_removed loop
        if not exists (
          select 1
            from jsonb_array_elements(coalesce(p_definition -> 'sections', '[]'::jsonb)) as s(elem)
           where s.elem ->> 'key' = v_key
             and not coalesce((s.elem ->> 'mandatory')::boolean, false)
             and (coalesce((s.elem ->> 'optional')::boolean, false)
                  or coalesce((s.elem ->> 'removable')::boolean, false))
        ) then
          raise check_violation
            using message = 'EXE-PREP-MANDATORY-REMOVAL: only sections explicitly marked optional in the definition may be removed';
        end if;
      end loop;
    end if;
  end if;

  -- Added action forms — published configuration_templates of template_type
  -- 'action_form' only; no duplicates within the list nor against the
  -- definition's own action forms.
  if p_form_config ? 'added_action_form_template_ids' then
    if jsonb_typeof(p_form_config -> 'added_action_form_template_ids') <> 'array' then
      raise check_violation
        using message = 'EXE-PREP-CONFIG-INVALID: added_action_form_template_ids must be an array of template ids';
    end if;
    select coalesce(array_agg(t.value), '{}'::text[]) into v_added
      from jsonb_array_elements_text(p_form_config -> 'added_action_form_template_ids') as t(value);
    if (select count(*) from unnest(v_added))
       <> (select count(distinct u.k) from unnest(v_added) as u(k)) then
      raise check_violation
        using message = 'EXE-PREP-DUPLICATE: added action form templates must not repeat';
    end if;
    foreach v_key in array v_added loop
      if v_key !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
        raise check_violation
          using message = 'EXE-PREP-CONFIG-INVALID: action form template ids must be uuids';
      end if;
      if not exists (
        select 1
          from public.configuration_templates ct
         where ct.id = v_key::uuid
           and ct.template_type = 'action_form'
           and ct.status = 'published'
      ) then
        raise check_violation
          using message = 'EXE-PREP-FORM-INELIGIBLE: added action forms must be published action_form configuration templates';
      end if;
      if p_definition is not null and exists (
        select 1
          from jsonb_array_elements(coalesce(p_definition -> 'action_forms', '[]'::jsonb)) as af(elem)
         where coalesce(af.elem ->> 'template_id', af.elem ->> 'id') = v_key
      ) then
        raise check_violation
          using message = 'EXE-PREP-DUPLICATE: the action form is already part of the package definition';
      end if;
    end loop;
  end if;
end $$;
revoke all on function private.execution_validate_form_config(jsonb, jsonb) from public, anon, authenticated;

-- Resolve the visit-specific definition: published definition with the
-- validated form_config applied (optional sections removed, visit-added
-- action form references appended). Changes affect only the visit — the
-- source package version is never touched.
create or replace function private.execution_apply_form_config(p_definition jsonb, p_form_config jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_resolved jsonb := p_definition;
  v_sections jsonb;
  v_added jsonb;
begin
  if p_form_config ? 'removed_optional_section_keys'
     and jsonb_typeof(p_form_config -> 'removed_optional_section_keys') = 'array' then
    select coalesce(jsonb_agg(s.elem), '[]'::jsonb) into v_sections
      from jsonb_array_elements(coalesce(p_definition -> 'sections', '[]'::jsonb)) as s(elem)
     where not exists (
       select 1
         from jsonb_array_elements_text(p_form_config -> 'removed_optional_section_keys') as r(key)
        where r.key = s.elem ->> 'key'
     );
    v_resolved := jsonb_set(v_resolved, '{sections}', v_sections);
  end if;
  if p_form_config ? 'added_action_form_template_ids'
     and jsonb_typeof(p_form_config -> 'added_action_form_template_ids') = 'array' then
    select coalesce(
             jsonb_agg(jsonb_build_object('template_id', t.value::uuid, 'origin', 'visit_preparation')),
             '[]'::jsonb
           ) into v_added
      from jsonb_array_elements_text(p_form_config -> 'added_action_form_template_ids') as t(value);
    v_resolved := jsonb_set(
      v_resolved, '{action_forms}',
      coalesce(v_resolved -> 'action_forms', '[]'::jsonb) || v_added
    );
  end if;
  return v_resolved;
end $$;
revoke all on function private.execution_apply_form_config(jsonb, jsonb) from public, anon, authenticated;

-- ---------- 5 · inspector_daily_capacity: same contract over the helper -----
-- Signature, caller guard, grants and return shape are byte-identical to the
-- Phase 1 contract; only the counting internals now call the shared helper.
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

  v_cap := private.execution_daily_cap();
  v_used := private.execution_daily_used(p_inspector, p_date);

  return jsonb_build_object(
    'cap', v_cap,
    'used', v_used,
    'remaining', greatest(v_cap - v_used, 0),
    'allowed', v_used < v_cap
  );
end $$;
revoke all on function public.inspector_daily_capacity(uuid, date) from public, anon;
grant execute on function public.inspector_daily_capacity(uuid, date) to authenticated;

-- ---------- 6 · inspector_window_capacity: per-day availability over a range
-- Same caller guard and counting rule as inspector_daily_capacity. Windows
-- longer than 62 days are evaluated over the first 62 (truncated: true).
create or replace function public.inspector_window_capacity(p_inspector uuid, p_window_start date, p_window_end date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_cap integer;
  v_end date;
  v_truncated boolean := false;
  v_days jsonb;
  v_has boolean;
begin
  -- Caller must be Planning, Operations, or the inspector themself.
  if auth.uid() is null
     or (auth.uid() <> p_inspector
         and not public.has_any_role(array['planner', 'ops'])) then
    raise insufficient_privilege
      using message = 'Window capacity is visible to Planning, Operations, or the inspector themself';
  end if;
  if p_window_start is null or p_window_end is null or p_window_end < p_window_start then
    raise check_violation
      using message = 'EXE-CAPACITY-WINDOW-INVALID: the capacity window is invalid';
  end if;

  v_cap := private.execution_daily_cap();
  v_end := p_window_end;
  if p_window_end > p_window_start + 61 then
    v_end := p_window_start + 61;   -- 62-day scan cap (D-009)
    v_truncated := true;
  end if;

  select coalesce(jsonb_agg(day_row order by day_row ->> 'date'), '[]'::jsonb)
    into v_days
    from (
      select jsonb_build_object(
               'date', d,
               'used', u,
               'remaining', greatest(v_cap - u, 0)
             ) as day_row
        from (
          select g.d::date as d,
                 private.execution_daily_used(p_inspector, g.d::date) as u
            from generate_series(p_window_start::timestamptz, v_end::timestamptz, interval '1 day') as g(d)
        ) counted
    ) days;

  v_has := exists (
    select 1 from jsonb_array_elements(v_days) as e(day)
    where (e.day ->> 'remaining')::integer > 0
  );

  return jsonb_build_object(
    'cap', v_cap,
    'days', v_days,
    'has_availability', v_has,
    'truncated', v_truncated
  );
end $$;
revoke all on function public.inspector_window_capacity(uuid, date, date) from public, anon;
grant execute on function public.inspector_window_capacity(uuid, date, date) to authenticated;

-- ---------- 7 · save_visit_preparation --------------------------------------
-- Saves the draft WITHOUT changing visit/inspection state. A save after Ready
-- is refused (reopen first); any successful save keeps confirmed_ready_at
-- null, so readiness always requires a fresh confirm.
create or replace function public.save_visit_preparation(
  p_visit uuid,
  p_execution_date date,
  p_confirmed_mode text,
  p_package_version_id uuid,
  p_form_config jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_visit public.visits%rowtype;
  v_prep public.visit_preparations%rowtype;
  v_inspection public.inspections%rowtype;
  v_config jsonb := coalesce(p_form_config, '{}'::jsonb);
  v_effective_pv uuid;
  v_definition jsonb;
  v_pv_status public.config_status;
  v_inspector uuid;
  v_cap integer;
  v_used integer;
  v_mode public.execution_mode;
  v_modes jsonb;
  v_mode_changed boolean := false;
begin
  if v_actor is null
     or not public.is_assigned_inspector(p_visit)
     or not public.has_capability('execution.prepare') then
    raise insufficient_privilege
      using message = 'EXE-PREP-DENIED: only the assigned inspector with execution.prepare may prepare this visit';
  end if;

  select * into v_visit from public.visits v where v.id = p_visit for update;
  if not found then
    raise check_violation
      using message = 'EXE-PREP-VISIT-STATE: the visit does not exist';
  end if;
  if v_visit.planning_status <> 'published' then
    raise check_violation
      using message = 'EXE-PREP-VISIT-STATE: preparation requires a published visit';
  end if;
  if v_visit.operational_state not in ('new', 'prepared') then
    raise check_violation
      using message = 'EXE-PREP-JOURNEY-STARTED: preparation is locked once the journey has started';
  end if;

  select * into v_inspection from public.inspections i where i.visit_id = p_visit;
  if found and v_inspection.started_at is not null then
    raise check_violation
      using message = 'EXE-PREP-JOURNEY-STARTED: preparation is locked once inspection work has started';
  end if;

  select * into v_prep from public.visit_preparations p where p.visit_id = p_visit;
  if found and v_prep.confirmed_ready_at is not null then
    raise check_violation
      using message = 'EXE-PREP-REOPEN-REQUIRED: reopen the preparation before changing a ready visit';
  end if;

  if jsonb_typeof(v_config) <> 'object' then
    raise check_violation
      using message = 'EXE-PREP-CONFIG-INVALID: form_config must be an object';
  end if;

  -- ---------- Execution Date: inside window, not past, within daily cap ----
  if p_execution_date is not null then
    if p_execution_date < v_visit.window_start::date
       or p_execution_date > v_visit.window_end::date then
      raise check_violation
        using message = 'EXE-PREP-DATE-WINDOW: the Execution Date must sit inside the visit window';
    end if;
    if p_execution_date < current_date then
      raise check_violation
        using message = 'EXE-PREP-DATE-PAST: the Execution Date cannot be in the past';
    end if;
    select a.inspector_id into v_inspector
      from public.assignments a
     where a.visit_id = p_visit
     limit 1;
    v_cap := private.execution_daily_cap();
    v_used := private.execution_daily_used(v_inspector, p_execution_date);
    -- capacity exclusion of self: the shared counter includes THIS visit when
    -- its current effective Execution Date (selected date, else window start)
    -- equals the requested date; subtract that single contribution so
    -- re-selecting the same date never fails against the visit's own slot.
    if coalesce(v_visit.execution_date, v_visit.window_start::date) = p_execution_date
       and coalesce(v_inspection.lifecycle_status, 'new') not in
             ('submitted', 'under_review', 'approved', 'rejected', 'cancelled') then
      v_used := v_used - 1;
    end if;
    if v_used >= v_cap then
      raise check_violation
        using message = 'EXE-PREP-CAPACITY: the inspector daily visit cap is reached for that date';
    end if;
  end if;

  -- ---------- Confirmed mode: governed eligibility + mode inputs -----------
  if p_confirmed_mode is not null then
    -- self_assessment is ALWAYS refused in Release 1 (release_2 gate); the
    -- execution_mode enum carries physical/virtual only, so anything else is
    -- ineligible here.
    if p_confirmed_mode not in ('physical', 'virtual') then
      raise check_violation
        using message = 'EXE-PREP-MODE-INELIGIBLE: the confirmed mode is not an eligible visit mode';
    end if;
    select es.settings -> 'visit_modes' into v_modes
      from public.engine_settings es
     where es.engine = 'execution';
    if not coalesce((v_modes -> p_confirmed_mode ->> 'enabled')::boolean, false) then
      raise check_violation
        using message = 'EXE-PREP-MODE-INELIGIBLE: the confirmed mode is disabled by governed configuration';
    end if;
    -- Coordinates remain the Physical input; the OTP engine remains the
    -- Virtual input (same predicates Planning publish enforces).
    if p_confirmed_mode = 'physical'
       and not (
         (v_visit.planner_lat is not null and v_visit.planner_lng is not null)
         or exists (
           select 1 from public.factories f
            where f.id = v_visit.factory_id
              and f.official_lat is not null
              and f.official_lng is not null
         )
       ) then
      raise check_violation
        using message = 'EXE-PREP-MODE-INELIGIBLE: physical mode requires planner or official factory coordinates';
    end if;
    if p_confirmed_mode = 'virtual'
       and not exists (select 1 from public.engine_settings es where es.engine = 'otp') then
      raise check_violation
        using message = 'EXE-PREP-MODE-INELIGIBLE: virtual mode requires the OTP engine configuration';
    end if;
    v_mode := p_confirmed_mode::public.execution_mode;
  end if;

  -- ---------- Package: published, content-bearing version ------------------
  if p_package_version_id is not null then
    select pv.status, pv.definition into v_pv_status, v_definition
      from public.package_versions pv
     where pv.id = p_package_version_id;
    -- packages carries no active flag of its own; "active package" is
    -- enforced as the selected version being published (not draft / locked /
    -- deactivated).
    if not found or v_pv_status <> 'published' then
      raise check_violation
        using message = 'EXE-PREP-PACKAGE-INACTIVE: only published package versions are eligible';
    end if;
    if coalesce(jsonb_array_length(coalesce(v_definition -> 'sections', '[]'::jsonb)), 0) = 0 then
      raise check_violation
        using message = 'EXE-PREP-PACKAGE-INACTIVE: the package version contains no inspection sections';
    end if;
  end if;

  -- ---------- form_config composition (single shared validator, D-007) -----
  v_effective_pv := coalesce(p_package_version_id, v_visit.package_version_id);
  if v_definition is null and v_effective_pv is not null then
    select pv.definition into v_definition
      from public.package_versions pv
     where pv.id = v_effective_pv;
  end if;
  perform private.execution_validate_form_config(v_definition, v_config);

  -- ---------- Persist (replaces the draft; readiness requires re-confirm) --
  -- Mode confirmation is visit-scoped: when the confirmed mode differs from
  -- the planning-set mode, the eligibility config above has already approved
  -- it and the visit is still pre-journey, so the visit record follows the
  -- confirmation (recorded in the audit row below).
  if v_mode is not null and v_mode <> v_visit.execution_mode then
    update public.visits v set execution_mode = v_mode where v.id = p_visit;
    v_mode_changed := true;
  end if;

  insert into public.visit_preparations (
    visit_id, execution_date, confirmed_mode, package_version_id, form_config,
    saved_by, saved_at
  ) values (
    p_visit, p_execution_date, v_mode, p_package_version_id, v_config,
    v_actor, now()
  )
  on conflict (visit_id) do update set
    execution_date = excluded.execution_date,
    confirmed_mode = excluded.confirmed_mode,
    package_version_id = excluded.package_version_id,
    form_config = excluded.form_config,
    saved_by = excluded.saved_by,
    saved_at = excluded.saved_at,
    confirmed_ready_at = null;   -- any save wipes readiness; re-confirm required

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state, requirement_refs
  ) values (
    v_actor, 'visit_preparations', p_visit, 'save',
    case when v_prep.visit_id is null then null else to_jsonb(v_prep) end,
    jsonb_build_object(
      'execution_date', p_execution_date,
      'confirmed_mode', v_mode,
      'previous_mode', v_visit.execution_mode,
      'mode_changed', v_mode_changed,
      'package_version_id', p_package_version_id,
      'form_config', v_config
    ),
    array['EXE-PREP']
  );
end $$;
revoke all on function public.save_visit_preparation(uuid, date, text, uuid, jsonb) from public, anon;
grant execute on function public.save_visit_preparation(uuid, date, text, uuid, jsonb) to authenticated;

-- ---------- 8 · confirm_visit_ready -----------------------------------------
-- The Ready transition: re-validates everything NOW, freezes the immutable
-- visit package snapshot, flips the visit to Ready for Execution (stored
-- 'prepared', D-002), creates the inspections row pre-journey (D-008), marks
-- the assignment ready, and audits. search_path follows the pgcrypto
-- precedent of 20260718150000 (public + extensions) so encode/digest resolve
-- wherever the extension lives; every table reference stays fully qualified.
create or replace function public.confirm_visit_ready(p_visit uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_visit public.visits%rowtype;
  v_prep public.visit_preparations%rowtype;
  v_inspection public.inspections%rowtype;
  v_snapshot public.visit_package_snapshots%rowtype;
  v_effective_pv uuid;
  v_definition jsonb;
  v_resolved jsonb;
  v_checksum text;
  v_version integer;
  v_pv_status public.config_status;
  v_inspector uuid;
  v_cap integer;
  v_used integer;
  v_modes jsonb;
begin
  if v_actor is null
     or not public.is_assigned_inspector(p_visit)
     or not public.has_capability('execution.prepare') then
    raise insufficient_privilege
      using message = 'EXE-PREP-DENIED: only the assigned inspector with execution.prepare may confirm readiness';
  end if;

  select * into v_visit from public.visits v where v.id = p_visit for update;
  if not found or v_visit.planning_status <> 'published' then
    raise check_violation
      using message = 'EXE-PREP-VISIT-STATE: readiness requires a published visit';
  end if;
  if v_visit.operational_state not in ('new', 'prepared') then
    raise check_violation
      using message = 'EXE-PREP-JOURNEY-STARTED: readiness is locked once the journey has started';
  end if;

  select * into v_prep from public.visit_preparations p where p.visit_id = p_visit;
  if not found then
    raise check_violation
      using message = 'EXE-PREP-INCOMPLETE: save a preparation before confirming readiness';
  end if;

  -- Idempotent replay: already ready and nothing changed (a post-Ready save
  -- would have been refused by EXE-PREP-REOPEN-REQUIRED) — return the latest
  -- snapshot without appending a duplicate.
  if v_prep.confirmed_ready_at is not null then
    select * into v_snapshot
      from public.visit_package_snapshots s
     where s.visit_id = p_visit
     order by s.preparation_version desc
     limit 1;
    return to_jsonb(v_snapshot);
  end if;

  -- ---------- Re-validate the saved preparation NOW -------------------------
  if v_prep.execution_date is null then
    raise check_violation
      using message = 'EXE-PREP-INCOMPLETE: an Execution Date is required for readiness';
  end if;
  if v_prep.execution_date < v_visit.window_start::date
     or v_prep.execution_date > v_visit.window_end::date then
    raise check_violation
      using message = 'EXE-PREP-DATE-WINDOW: the Execution Date must sit inside the visit window';
  end if;
  if v_prep.execution_date < current_date then
    raise check_violation
      using message = 'EXE-PREP-DATE-PAST: the Execution Date cannot be in the past';
  end if;
  select a.inspector_id into v_inspector
    from public.assignments a
   where a.visit_id = p_visit
   limit 1;
  v_cap := private.execution_daily_cap();
  v_used := private.execution_daily_used(v_inspector, v_prep.execution_date);
  select * into v_inspection from public.inspections i where i.visit_id = p_visit;
  -- capacity exclusion of self (identical rule as save_visit_preparation).
  if coalesce(v_visit.execution_date, v_visit.window_start::date) = v_prep.execution_date
     and coalesce(v_inspection.lifecycle_status, 'new') not in
           ('submitted', 'under_review', 'approved', 'rejected', 'cancelled') then
    v_used := v_used - 1;
  end if;
  if v_used >= v_cap then
    raise check_violation
      using message = 'EXE-PREP-CAPACITY: the inspector daily visit cap is reached for that date';
  end if;

  if v_prep.confirmed_mode is null then
    raise check_violation
      using message = 'EXE-PREP-INCOMPLETE: a confirmed visit mode is required for readiness';
  end if;
  select es.settings -> 'visit_modes' into v_modes
    from public.engine_settings es
   where es.engine = 'execution';
  if not coalesce((v_modes -> (v_prep.confirmed_mode::text) ->> 'enabled')::boolean, false) then
    raise check_violation
      using message = 'EXE-PREP-MODE-INELIGIBLE: the confirmed mode is disabled by governed configuration';
  end if;
  if v_prep.confirmed_mode = 'physical'
     and not (
       (v_visit.planner_lat is not null and v_visit.planner_lng is not null)
       or exists (
         select 1 from public.factories f
          where f.id = v_visit.factory_id
            and f.official_lat is not null
            and f.official_lng is not null
       )
     ) then
    raise check_violation
      using message = 'EXE-PREP-MODE-INELIGIBLE: physical mode requires planner or official factory coordinates';
  end if;
  if v_prep.confirmed_mode = 'virtual'
     and not exists (select 1 from public.engine_settings es where es.engine = 'otp') then
    raise check_violation
      using message = 'EXE-PREP-MODE-INELIGIBLE: virtual mode requires the OTP engine configuration';
  end if;

  -- ---------- Package resolution --------------------------------------------
  v_effective_pv := coalesce(v_prep.package_version_id, v_visit.package_version_id);
  if v_effective_pv is null then
    raise check_violation
      using message = 'EXE-PREP-PACKAGE-REQUIRED: select an eligible package before confirming readiness';
  end if;
  select pv.status, pv.definition into v_pv_status, v_definition
    from public.package_versions pv
   where pv.id = v_effective_pv;
  if not found or v_pv_status <> 'published' then
    raise check_violation
      using message = 'EXE-PREP-PACKAGE-INACTIVE: only published package versions are eligible';
  end if;
  if coalesce(jsonb_array_length(coalesce(v_definition -> 'sections', '[]'::jsonb)), 0) = 0 then
    raise check_violation
      using message = 'EXE-PREP-PACKAGE-INACTIVE: the package version contains no inspection sections';
  end if;
  perform private.execution_validate_form_config(v_definition, v_prep.form_config);

  -- ---------- Freeze the visit-specific immutable snapshot ------------------
  v_resolved := private.execution_apply_form_config(v_definition, v_prep.form_config);
  -- sha256 over the canonical jsonb rendering (pgcrypto, created by 0009).
  v_checksum := encode(digest(v_resolved::text, 'sha256'), 'hex');
  select coalesce(max(s.preparation_version), 0) + 1 into v_version
    from public.visit_package_snapshots s
   where s.visit_id = p_visit;

  insert into public.visit_package_snapshots (
    visit_id, preparation_version, package_version_id, definition, checksum, created_by
  ) values (
    p_visit, v_version, v_effective_pv, v_resolved, v_checksum, v_actor
  ) returning * into v_snapshot;

  update public.visit_preparations p
     set confirmed_ready_at = now(),
         preparation_version = v_version
   where p.visit_id = p_visit;

  update public.visits v
     set execution_date = v_prep.execution_date,
         operational_state = 'prepared',   -- stored Ready for Execution (D-002)
         execution_mode = v_prep.confirmed_mode
   where v.id = p_visit;

  -- D-008: the inspections row exists from Ready onward with started_at NULL
  -- — the journey/session start owns started_at. The Phase 1 sync trigger
  -- maps status 'in_progress' to lifecycle_status 'in_progress'.
  if not exists (select 1 from public.inspections i where i.visit_id = p_visit) then
    insert into public.inspections (visit_id, status, package_version_id)
    values (p_visit, 'in_progress', v_effective_pv);
  end if;

  update public.assignments a set status = 'ready' where a.visit_id = p_visit;

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state, requirement_refs
  ) values (
    v_actor, 'visit_preparations', p_visit, 'confirm_ready', null,
    jsonb_build_object(
      'snapshot_id', v_snapshot.id,
      'preparation_version', v_version,
      'checksum', v_checksum,
      'package_version_id', v_effective_pv,
      'execution_date', v_prep.execution_date,
      'confirmed_mode', v_prep.confirmed_mode
    ),
    array['EXE-PREP']
  );

  return to_jsonb(v_snapshot);
end $$;
revoke all on function public.confirm_visit_ready(uuid) from public, anon;
grant execute on function public.confirm_visit_ready(uuid) to authenticated;

-- ---------- 9 · reopen_visit_preparation ------------------------------------
-- Ready → New: allowed only pre-journey (operational_state 'prepared') and
-- only while no inspection work exists (D-008). Snapshot rows stay immutable
-- — they are the readiness history; the next Ready appends a new version.
create or replace function public.reopen_visit_preparation(p_visit uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_visit public.visits%rowtype;
  v_prep public.visit_preparations%rowtype;
  v_inspection public.inspections%rowtype;
begin
  if v_actor is null
     or not public.is_assigned_inspector(p_visit)
     or not public.has_capability('execution.prepare') then
    raise insufficient_privilege
      using message = 'EXE-PREP-DENIED: only the assigned inspector with execution.prepare may reopen the preparation';
  end if;

  select * into v_visit from public.visits v where v.id = p_visit for update;
  if not found or v_visit.planning_status <> 'published' then
    raise check_violation
      using message = 'EXE-PREP-VISIT-STATE: reopen requires a published visit';
  end if;
  -- Date, mode and preparation are locked after journey start (plan §7/§10).
  if v_visit.operational_state not in ('new', 'prepared') then
    raise check_violation
      using message = 'EXE-PREP-JOURNEY-STARTED: preparation is locked once the journey has started';
  end if;
  if v_visit.operational_state <> 'prepared' then
    raise check_violation
      using message = 'EXE-PREP-VISIT-STATE: only a ready visit can be reopened';
  end if;

  select * into v_prep from public.visit_preparations p where p.visit_id = p_visit;
  if not found or v_prep.confirmed_ready_at is null then
    raise check_violation
      using message = 'EXE-PREP-VISIT-STATE: only a confirmed-ready preparation can be reopened';
  end if;

  -- D-008: reopen is possible only while no work has been captured.
  select * into v_inspection from public.inspections i where i.visit_id = p_visit;
  if found then
    if v_inspection.started_at is not null
       or exists (select 1 from public.checklist_responses cr where cr.inspection_id = v_inspection.id)
       or exists (select 1 from public.evidence e where e.inspection_id = v_inspection.id) then
      raise check_violation
        using message = 'EXE-PREP-WORK-CAPTURED: reopen is refused once inspection work exists';
    end if;
    -- Lifecycle returns to New via the Phase 1 sync trigger.
    update public.inspections i set status = 'not_started' where i.id = v_inspection.id;
  end if;

  update public.visits v set operational_state = 'new' where v.id = p_visit;
  -- execution_date stays on the visit and on the draft: the next Ready
  -- re-validates window/past/capacity at that moment anyway.
  update public.visit_preparations p
     set confirmed_ready_at = null,
         reopened_at = now()
   where p.visit_id = p_visit;
  update public.assignments a set status = 'assigned' where a.visit_id = p_visit;

  insert into public.audit_events (
    actor, object_type, object_id, action, before_state, after_state, requirement_refs
  ) values (
    v_actor, 'visit_preparations', p_visit, 'reopen',
    jsonb_build_object(
      'preparation_version', v_prep.preparation_version,
      'confirmed_ready_at', v_prep.confirmed_ready_at
    ),
    jsonb_build_object('operational_state', 'new', 'reopened_at', now()),
    array['EXE-PREP']
  );
end $$;
revoke all on function public.reopen_visit_preparation(uuid) from public, anon;
grant execute on function public.reopen_visit_preparation(uuid) to authenticated;

-- ---------- 10 · Planning daily-cap hook (D-009) -----------------------------
-- Both publish RPCs below are copied from
-- 20260714091727_planning_publish_guards.sql with every guard, lock,
-- transition, notification and idempotency behavior preserved; the ONLY
-- addition is the EXE-CAPACITY-WINDOW-FULL evaluation after assignment
-- creation. The check evaluates inspector_window_capacity — the SAME shared
-- service the inspector's Pre-Execution date selection uses — over the whole
-- visit window for the assigned inspector; when no day has availability the
-- exception rolls the entire publish back atomically. create_immediate_visit
-- is deliberately untouched in this phase.

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
  if v_actor is null or not has_role('planner') then
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
  if not exists (
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

    -- Phase 3A daily-cap hook (D-009): the SAME shared service the inspector's
    -- Pre-Execution date selection uses. If no day in the visit window has
    -- remaining daily capacity for the assigned inspector, the whole publish
    -- fails atomically.
    if not coalesce((public.inspector_window_capacity(v_inspector, p_window_start::date, p_window_end::date) ->> 'has_availability')::boolean, false) then
      raise exception 'EXE-CAPACITY-WINDOW-FULL: the assigned inspector has no daily-capacity availability anywhere in the visit window' using errcode = 'P0001';
    end if;
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
  'CD-021 guarded atomic publisher: server-derived eligibility, concurrency guards, STM-PLAN-001/002, notification and audit in one transaction. Phase 3A adds the EXE-CAPACITY-WINDOW-FULL daily-cap evaluation per assignment (D-009).';

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
  if v_actor is null or not has_role('planner') then
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
  if not exists (
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

  -- Phase 3A daily-cap hook (D-009): the SAME shared service the inspector's
  -- Pre-Execution date selection uses. If no day in the visit window has
  -- remaining daily capacity for the assigned inspector, the whole publish
  -- fails atomically.
  if not coalesce((public.inspector_window_capacity(v_inspector, p_window_start::date, p_window_end::date) ->> 'has_availability')::boolean, false) then
    raise exception 'EXE-CAPACITY-WINDOW-FULL: the assigned inspector has no daily-capacity availability anywhere in the visit window' using errcode = 'P0001';
  end if;

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
  'CD-022 guarded atomic publisher: identity/package/location/assignment revalidation, STM-PLAN-001/002, notification and audit in one transaction. Phase 3A adds the EXE-CAPACITY-WINDOW-FULL daily-cap evaluation after assignment (D-009).';

grant execute on function publish_bulk_plan to authenticated;
grant execute on function publish_single_visit to authenticated;
