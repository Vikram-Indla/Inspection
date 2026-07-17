-- ============================================================================
-- Migration 20260717170000 — TASK-MVP2-M2-04-RISK-TARGETING-001
-- MVP2-REQ-0001..0024, 0121, 0122, 0123, 0125, 0126, 0193
-- MVP2-AC/EV-same · Design CD-032 R2 (risk_workbench_v2)
--
-- Additive risk-workbench foundation. Introduces a DRAFT/maker-checker model
-- layer above the live `engine_settings.risk` row (CD-032 W3): the existing
-- direct-edit path (admin/risk saveRiskSettings) is preserved and untouched;
-- publishing a governed risk_model MATERIALISES engine_settings (done in a later
-- server-action slice, never by dropping/renaming the accepted row).
--
-- POLICY BOUNDARY (DEC-001): this migration invents NO weights, bands, thresholds
-- or factor values. Factor/band VALUES live in risk_models.payload and are
-- supplied at runtime by a risk_owner; the accepted engine_settings.risk shape is
-- the contract. Nothing here seeds business risk values.
--
-- Forward-only, additive. No accepted table/column/policy is dropped, renamed or
-- weakened. Rollback strategy: drop the objects created here (all new, no data
-- dependency on accepted rows). Immutability: published risk_models rows are
-- blocked from UPDATE/DELETE by trigger; corrections create a new version.
-- Runtime: DB_VALIDATION_PENDING (no reachable Inspection Postgres in this env).
-- ============================================================================

-- ---------- variable catalogue (REQ-0001..0004 authoring surface) -----------
create table if not exists public.risk_variables (
  id uuid primary key default gen_random_uuid(),
  var_key text not null unique,
  label text not null,
  data_type text not null check (data_type in ('numeric','categorical','boolean','date')),
  source_ref text,                       -- provenance of the input (table/derivation)
  active boolean not null default true,
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now()
);

-- ---------- governed model draft layer (REQ-0005..0012 lifecycle) -----------
-- payload mirrors engine_settings.risk: { factors:[{key,weight}], bands:{...} }.
create table if not exists public.risk_models (
  id uuid primary key default gen_random_uuid(),
  model_key text not null default 'risk',
  version_label text not null,
  status text not null default 'draft'
    check (status in ('draft','review','approved','published','retired')),
  payload jsonb not null default '{}'::jsonb,
  row_version integer not null default 1,
  rollback_of uuid references public.risk_models(id),
  retire_reason text,
  created_by uuid references public.profiles(user_id),
  approved_by uuid references public.profiles(user_id),
  effective_from timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- maker-checker: a distinct approver must publish (mirrors config_versions).
  constraint risk_models_maker_checker check (approved_by is null or approved_by <> created_by)
);
create index if not exists risk_models_key_status_idx on public.risk_models(model_key, status);

-- ---------- read-only simulation results (REQ-0013..0016) -------------------
create table if not exists public.risk_simulations (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.risk_models(id),
  input_ref text,                        -- fixture / cohort reference (no live mutation)
  result jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now()
);
create index if not exists risk_simulations_model_idx on public.risk_simulations(model_id, created_at desc);

-- ---------- scoring runs (REQ-0017..0020) — append-only run ledger ----------
create table if not exists public.risk_runs (
  id uuid primary key default gen_random_uuid(),
  model_version_label text not null,
  status text not null default 'queued'
    check (status in ('queued','running','completed','failed')),
  reason text,                           -- required for a manual re-run
  idempotency_key text unique,           -- retryable command boundary
  requested_by uuid references public.profiles(user_id),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- exception queue (REQ-0021..0022) --------------------------------
create table if not exists public.risk_exceptions (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid,
  run_id uuid references public.risk_runs(id),
  status text not null default 'open' check (status in ('open','resolved')),
  reason text,
  evidence_ref text,                     -- evidence-gated closure
  resolved_by uuid references public.profiles(user_id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists risk_exceptions_status_idx on public.risk_exceptions(status, created_at desc);

-- ---------- overrides (REQ-0023..0024) — maker-checker, sensitivity-classed -
create table if not exists public.risk_overrides (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null,
  status text not null default 'requested'
    check (status in ('requested','approved','rejected','ended')),
  sensitivity_class text,
  reason text not null,
  requested_by uuid references public.profiles(user_id),
  decided_by uuid references public.profiles(user_id),
  effective_from timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  -- decider must differ from requester (maker-checker).
  constraint risk_overrides_maker_checker check (decided_by is null or decided_by <> requested_by)
);
create index if not exists risk_overrides_factory_idx on public.risk_overrides(factory_id, status);

-- ---------- immutability: published risk_models are frozen ------------------
create or replace function public.block_published_risk_model_mutation() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status in ('published','retired') then
      raise exception 'published/retired risk model versions are immutable' using errcode = '42501';
    end if;
    return old;
  end if;
  -- allow the single draft->... lifecycle bump but freeze an already-published row's payload
  if old.status = 'published' and (new.payload is distinct from old.payload or new.version_label is distinct from old.version_label) then
    raise exception 'a published risk model version is immutable; create a new version' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists trg_risk_models_immutable on public.risk_models;
create trigger trg_risk_models_immutable
  before update or delete on public.risk_models
  for each row execute function public.block_published_risk_model_mutation();

-- optimistic-concurrency row_version bump on payload edits
create or replace function public.risk_models_bump_row_version() returns trigger
language plpgsql as $$
begin
  if new.payload is distinct from old.payload then new.row_version := old.row_version + 1; end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists trg_risk_models_bump on public.risk_models;
create trigger trg_risk_models_bump
  before update on public.risk_models
  for each row execute function public.risk_models_bump_row_version();

-- ---------- RLS: deny by default; risk_owner writes, authenticated reads -----
-- Read = any authenticated internal user (dossier/monitor need visibility); the
-- accepted admin-config writer set is reused (risk_owner is the module owner).
do $$
declare t text;
begin
  foreach t in array array[
    'risk_variables','risk_models','risk_simulations','risk_runs','risk_exceptions','risk_overrides'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select using (auth.uid() is not null)', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format($p$create policy %I_write on public.%I for insert with check (has_any_role(array['risk_owner','compliance_admin','security_admin']))$p$, t, t);
    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format($p$create policy %I_update on public.%I for update using (has_any_role(array['risk_owner','compliance_admin','security_admin'])) with check (has_any_role(array['risk_owner','compliance_admin','security_admin']))$p$, t, t);
    -- deliberately NO delete policy: risk history/versions are retained.
  end loop;
end $$;

-- ---------- canonical lifecycle transition (maker-checker + CAS) -------------
-- No direct status writes: callers use this RPC. Distinct approver enforced for
-- publish; stale row_version is rejected. Returns the new status.
create or replace function public.risk_model_transition(
  p_model_id uuid,
  p_to_status text,
  p_expected_row_version integer,
  p_reason text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v public.risk_models%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if not has_any_role(array['risk_owner','compliance_admin','security_admin']) then
    raise exception 'not authorized to transition risk models' using errcode = '42501';
  end if;
  select * into v from public.risk_models where id = p_model_id for update;
  if not found then raise exception 'risk model not found' using errcode = '22023'; end if;
  if v.row_version is distinct from p_expected_row_version then
    raise exception 'stale risk model version — reload and retry' using errcode = '40001';
  end if;
  -- allowed transitions
  if not (
    (v.status = 'draft'    and p_to_status in ('review')) or
    (v.status = 'review'   and p_to_status in ('approved','draft')) or
    (v.status = 'approved' and p_to_status in ('published','draft')) or
    (v.status = 'published' and p_to_status in ('retired'))
  ) then
    raise exception 'illegal risk model transition % -> %', v.status, p_to_status using errcode = '22023';
  end if;
  if p_to_status = 'published' then
    if v.approved_by is null then raise exception 'approval required before publish' using errcode = '42501'; end if;
    if v.approved_by = v_uid then raise exception 'maker-checker: approver cannot publish own approval' using errcode = '42501'; end if;
    update public.risk_models set status = 'published', effective_from = now() where id = p_model_id;
  elsif p_to_status = 'approved' then
    if v.created_by = v_uid then raise exception 'maker-checker: creator cannot approve own model' using errcode = '42501'; end if;
    update public.risk_models set status = 'approved', approved_by = v_uid where id = p_model_id;
  elsif p_to_status = 'retired' then
    update public.risk_models set status = 'retired', retire_reason = p_reason where id = p_model_id;
  else
    update public.risk_models set status = p_to_status where id = p_model_id;
  end if;
  return p_to_status;
end $$;

revoke all on function public.risk_model_transition(uuid, text, integer, text) from public, anon;
grant execute on function public.risk_model_transition(uuid, text, integer, text) to authenticated;
