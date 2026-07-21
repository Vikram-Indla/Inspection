-- TASK-WEB-DASHBOARD-KPI-ADMIN-FOUNDATION-001 (CODEX 01)
-- ADM-DASH-001..018 · STR-KPI-001..012 · OPS-KPI-001..009 · IPAD-KPI-001..007
--
-- Shared KPI catalogue seed + versioned Dashboard Configuration control plane.
--
-- REVIEW BEFORE APPLY. This migration is written to the repo convention but is
-- NOT applied by the authoring task. The main agent/human reviews and applies.
--
-- Properties (per CODEX 01 data & migration rules):
--   * Additive and forward-only. No existing table is modified or dropped.
--   * Tenant-aware via the platform's role+region model (there is no tenant_id
--     column in this schema; scoping is role/region-based).
--   * RLS-protected. Admin configuration can NARROW visibility but the guarded
--     write RPCs never widen RLS: direct table writes are revoked and every
--     mutation flows through a security-definer RPC with an explicit role gate,
--     so hiding a control in the UI can never become authorization.
--   * Effective-dated + append-only published versions; published rows are
--     immutable (a head pointer switches the active version). Existing
--     executions keep whatever version they resolved at calculation time
--     because historical outputs reference dashboard_config_versions.id.
--   * Seeds only deterministic system metric DEFINITIONS (formula text, owner,
--     lineage) as governed drafts awaiting maker-checker publish. It seeds NO
--     production metric VALUES.

-- =====================================================================
-- 1. Governed KPI catalogue seed (definitions only) -> mvp3_kpi_definitions
--    The formula text mirrors apps/web/src/lib/dashboard-kpi/registry.ts and is
--    immutable to ordinary admins (only tested code releases change it).
--    Seeded as 'draft'; a governed maker-checker publish activates each row.
-- =====================================================================

with seed_actor as (
  select user_id from public.profiles order by created_at nulls last, user_id limit 1
)
insert into public.mvp3_kpi_definitions
  (metric_key, version, title_en, title_ar, owner_role, formula, source_lineage, refresh_cadence, retention_status, status, created_by)
select v.metric_key, 1, v.title_en, v.title_ar, v.owner_role, v.formula,
       v.source_lineage::jsonb, v.refresh_cadence, v.retention_status, 'draft', a.user_id
from seed_actor a
cross join (values
  -- strategic
  ('compliance_rate_trend','Compliance rate trend','اتجاه معدل الامتثال','leadership',
   'compliant eligible answers / (compliant + non_compliant); exclude na, unknown, incomplete',
   '{"tables":["checklist_responses","inspection_items"],"decision":"DEC-DASH-001"}','on_demand','configured'),
  ('health_score_distribution','Health Score distribution',null,'leadership',
   'distinct eligible factories grouped by latest governed Health Score band',
   '{"tables":["<health_score_snapshot: ABSENT>"],"decision":"DEC-DASH-002"}','on_demand','policy_unresolved'),
  ('violation_trend_regulation_severity','Violation trend by regulation and severity',null,'compliance_admin',
   'count official violations by governed issue date, grouped by period, regulation and severity',
   '{"tables":["violations","violation_codes","regulations"],"gap":"no violation issue-time column","decision":"DEC-DASH-003"}','on_demand','policy_unresolved'),
  ('level2_decision_mix','Level-2 Approve / Return / Reject mix',null,'compliance_admin',
   'latest decided Level-2 outcome per submitted inspection, grouped Approve/Return/Reject',
   '{"tables":["reviews","inspections"]}','on_demand','configured'),
  ('licence_exposure','Licence exposure',null,'leadership',
   'distinct eligible factory licences by expiry state as of reporting date (Asia/Riyadh)',
   '{"tables":["<licence source: ABSENT>"],"decision":"DEC-DASH-005"}','on_demand','policy_unresolved'),
  ('cancellation_rate','Cancellation rate',null,'ops',
   'distinct cancelled planned visits / all denominator-eligible planned visits in scope',
   '{"tables":["visits"]}','on_demand','configured'),
  ('inspection_coverage','Inspection coverage',null,'leadership',
   'distinct due factories with a qualifying completion / distinct factories due under the published inspection-cycle policy',
   '{"tables":["factories","visits","inspections"],"requires_policy":"inspection_cycle_policy","decision":"DEC-DASH-007"}','on_demand','policy_unresolved'),
  ('uninspected_by_segment','Uninspected factories by stage, sector and region',null,'leadership',
   'classify each eligible factory Never inspected / Due / Overdue / Covered using the published cycle policy',
   '{"tables":["factories","visits"],"requires_policy":"inspection_cycle_policy","decision":"DEC-DASH-007"}','on_demand','policy_unresolved'),
  ('checklist_items_by_authority','Checklist items by issuing authority',null,'compliance_admin',
   'count distinct effective published inspection items grouped by the issuing authority of their linked regulation',
   '{"tables":["inspection_items","regulation_clauses","regulations"],"decision":"DEC-DASH-009"}','on_demand','policy_unresolved'),
  ('risk_to_attention_mismatch','Risk-to-attention mismatch',null,'leadership',
   'per governed risk band: qualifying visits in period / eligible factories whose band is effective at the comparison snapshot',
   '{"tables":["factory_risk_snapshots","visits"],"decision":"DEC-DASH-010"}','on_demand','policy_unresolved'),
  ('repeat_violation_rate','Repeat violation rate',null,'compliance_admin',
   'distinct factories with same stable item identity repeating >= threshold within lookback / distinct factories with >= 1 official violation',
   '{"tables":["violations","inspection_items"],"gap":"item version lineage + issue time","decision":"DEC-DASH-011"}','on_demand','policy_unresolved'),
  ('strategic_summary','Evidence-grounded Strategic Summary',null,'leadership',
   '3-5 ranked findings across strategic KPIs, one traceable sentence each citing underlying records; advisory only',
   '{"ai":true,"requires_policy":"strategic_summary_policy","decision":"DEC-DASH-012"}','on_demand','policy_unresolved'),
  -- operational
  ('visit_pipeline','Visit pipeline',null,'ops',
   'as-of count of distinct visits by the governed pipeline-state mapping',
   '{"tables":["visits"]}','realtime','configured'),
  ('expiring_soon','Expiring soon',null,'ops',
   'published, not-started visits with window_end within the configured lead time from now',
   '{"tables":["visits"],"requires_policy":"sla_urgency_policy","decision":"DEC-DASH-007b"}','realtime','policy_unresolved'),
  ('active_executions','Active executions',null,'ops',
   'distinct visits in operational_state on_the_way/arrived/executing with inspection not submitted',
   '{"tables":["visits","inspections"]}','realtime','configured'),
  ('pending_approvals','Pending approvals',null,'reviewer',
   'latest review state per submitted inspection is pending_review or under_review',
   '{"tables":["inspections","reviews"]}','realtime','configured'),
  ('pending_publish','Pending publish (admin only)',null,'compliance_admin',
   'count draft configuration objects by object type and owning admin role',
   '{"tables":["compliance_configuration_requests","package_versions","dashboard_config_parameters"]}','realtime','configured'),
  ('today_schedule_load','Today''s schedule load by inspector',null,'ops',
   'count eligible visits whose execution window starts today (Asia/Riyadh), grouped by assigned inspector',
   '{"tables":["visits","assignments"]}','realtime','configured'),
  ('gps_overrides_today','GPS overrides today',null,'ops',
   'count governed override events recorded today (Asia/Riyadh) for out-of-geofence arrival confirmation',
   '{"tables":["geo_events"]}','realtime','configured'),
  ('live_activity_feed','Live activity feed',null,'ops',
   'latest permission-visible immutable audit/timeline events ordered by occurred_at desc',
   '{"tables":["audit_events"]}','realtime','configured'),
  ('operational_nudges','Evidence-grounded operational nudges',null,'ops',
   '3-5 deterministic-trigger nudges ranked by deadline proximity; each opens a pre-filtered CTA and never executes',
   '{"requires_policy":"operational_nudge_policy","decision":"DEC-DASH-012b"}','realtime','policy_unresolved'),
  -- inspector
  ('today_visits','Today''s visits',null,'inspector',
   'count RLS-visible visits assigned to the inspector whose execution window starts today (Asia/Riyadh)',
   '{"tables":["assignments","visits"]}','realtime','configured'),
  ('remaining_visits','Remaining visits',null,'inspector',
   'today''s assigned visits minus visits whose inspector execution is complete (submitted)',
   '{"tables":["visits","inspections"],"decision":"DEC-DASH-013"}','realtime','configured'),
  ('pending_attention','Pending attention',null,'inspector',
   'own returned inspections + resumable drafts + unsent sync-queue items, without double counting',
   '{"tables":["reviews","inspections"],"device":"offline_queue"}','realtime','configured'),
  ('daily_progress','Daily progress',null,'inspector',
   'submitted own visits today / today''s assigned visits (x100); N/A when no visits',
   '{"tables":["assignments","visits","inspections"]}','realtime','configured'),
  ('approval_outcomes','Approval outcomes',null,'inspector',
   'latest Level-2 decision per own submitted inspection, grouped Approve/Return/Reject (not compliance)',
   '{"tables":["reviews","inspections"]}','realtime','configured'),
  ('checklist_compliance','Checklist compliance',null,'inspector',
   'compliant eligible answers / (compliant + non_compliant) over own inspections; exclude na, unknown, incomplete',
   '{"tables":["checklist_responses","inspection_items"]}','realtime','configured'),
  ('personal_trends','Personal trends',null,'inspector',
   'own submitted-visit and compliance series over trailing configured periods',
   '{"tables":["inspections","checklist_responses"],"requires_policy":"kpi_parameters"}','on_demand','policy_unresolved')
) as v(metric_key, title_en, title_ar, owner_role, formula, source_lineage, refresh_cadence, retention_status)
on conflict (metric_key, version) do nothing;

-- =====================================================================
-- 2. Dashboard Configuration control plane (versioned, maker-checker)
-- =====================================================================

-- 2a. Draft workspace (maker edits here).
create table if not exists public.dashboard_config_parameters (
  id uuid primary key default gen_random_uuid(),
  config_key text not null check (config_key in (
    'kpi_parameters','factory_eligibility','inspection_cycle_policy','sla_urgency_policy',
    'health_risk_presentation','health_risk_engine_refs','layout_visibility','map_profile',
    'strategic_summary_policy','operational_nudge_policy','freshness_offline_policy',
    'localization','masking_export','pre_inspection_pack'
  )),
  title text not null check (btrim(title) <> ''),
  status text not null default 'draft' check (status in (
    'draft','pending_review','returned','approved','cancelled'
  )),
  revision integer not null default 1 check (revision > 0),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  requested_effective_from timestamptz,
  owner_id uuid not null references public.profiles(user_id),
  return_reason text,
  submitted_at timestamptz,
  decided_by uuid references public.profiles(user_id),
  decided_at timestamptz,
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2b. Immutable published versions (append-only; effective-dated).
create table if not exists public.dashboard_config_versions (
  id uuid primary key default gen_random_uuid(),
  config_key text not null,
  version_number integer not null check (version_number > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  effective_from timestamptz not null default now(),
  source_parameter_id uuid references public.dashboard_config_parameters(id),
  published_by uuid not null references public.profiles(user_id),
  published_at timestamptz not null default now(),
  correlation_id uuid not null,
  publication_audit_reference bigint references public.audit_events(id),
  unique (config_key, version_number)
);

-- 2c. Current active version pointer (one head per config_key).
create table if not exists public.dashboard_config_heads (
  config_key text primary key,
  current_version_id uuid not null references public.dashboard_config_versions(id),
  activated_at timestamptz not null default now()
);

-- ---- Role predicate helpers (security definer, empty search_path) ----
-- Writer/maker: admins who may draft dashboard policy.
create or replace function public.dash_is_config_writer()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_any_role(array['compliance_admin','ops','security_admin']);
$$;

-- Reviewer/publisher (must differ from the maker at publish time).
create or replace function public.dash_is_config_reviewer()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_any_role(array['compliance_admin','leadership','security_admin']);
$$;

-- ---- RLS: read-only for authenticated; all writes via guarded RPCs ----
alter table public.dashboard_config_parameters enable row level security;
alter table public.dashboard_config_versions enable row level security;
alter table public.dashboard_config_heads enable row level security;

-- Published versions + head are readable by any authenticated principal (they
-- carry no sensitive data beyond governed policy). RLS on underlying business
-- tables remains the authority for the values these policies later filter.
drop policy if exists dash_config_versions_read on public.dashboard_config_versions;
create policy dash_config_versions_read on public.dashboard_config_versions
  for select to authenticated using (auth.uid() is not null);

drop policy if exists dash_config_heads_read on public.dashboard_config_heads;
create policy dash_config_heads_read on public.dashboard_config_heads
  for select to authenticated using (auth.uid() is not null);

-- Draft parameters are visible to the owner or to any config reviewer/writer.
drop policy if exists dash_config_parameters_read on public.dashboard_config_parameters;
create policy dash_config_parameters_read on public.dashboard_config_parameters
  for select to authenticated
  using (owner_id = auth.uid() or public.dash_is_config_writer() or public.dash_is_config_reviewer());

-- No INSERT/UPDATE/DELETE policies exist by design. Direct writes are revoked so
-- that UI hiding can never become authorization; every mutation goes through a
-- guarded RPC below.
revoke insert, update, delete on public.dashboard_config_parameters from authenticated;
revoke insert, update, delete on public.dashboard_config_versions from authenticated;
revoke insert, update, delete on public.dashboard_config_heads from authenticated;

-- Append-only guard: published versions and heads may not be updated/deleted.
create or replace function public.dash_block_version_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'DASH_CONFIG_APPEND_ONLY' using errcode = '42501';
end $$;

drop trigger if exists trg_dash_config_versions_append_only on public.dashboard_config_versions;
create trigger trg_dash_config_versions_append_only before update or delete
  on public.dashboard_config_versions for each row execute function public.dash_block_version_mutation();

-- ---- Audit helper ----
create or replace function public.dash_append_audit(
  p_action text, p_object uuid, p_before jsonb, p_after jsonb, p_correlation uuid
) returns bigint language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
begin
  insert into public.audit_events(actor, object_type, object_id, action, before_state, after_state, requirement_refs, config_versions)
  values (auth.uid(), 'dashboard_configuration', p_object, p_action, p_before, p_after,
          array['ADM-DASH-016','ADM-DASH-017','ADM-DASH-018'], jsonb_build_object('correlation_id', p_correlation))
  returning id into v_id;
  return v_id;
end $$;

-- ---- Guarded RPCs ----

-- Create a new draft parameter set (maker).
create or replace function public.dash_create_config_draft(
  p_config_key text, p_title text, p_payload jsonb, p_effective_from timestamptz default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.dash_is_config_writer() then raise exception 'DASH_NOT_AUTHORIZED'; end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'DASH_PAYLOAD_REQUIRED'; end if;
  insert into public.dashboard_config_parameters(config_key, title, payload, requested_effective_from, owner_id, status)
  values (p_config_key, p_title, p_payload, p_effective_from, auth.uid(), 'draft')
  returning id into v_id;
  perform public.dash_append_audit('draft_created', v_id, null, p_payload,
    (select correlation_id from public.dashboard_config_parameters where id = v_id));
  return v_id;
end $$;

-- Update an owned draft/returned parameter set (maker).
create or replace function public.dash_update_config_draft(
  p_id uuid, p_payload jsonb, p_title text default null, p_effective_from timestamptz default null
) returns void language plpgsql security definer set search_path = '' as $$
declare v public.dashboard_config_parameters;
begin
  select * into v from public.dashboard_config_parameters where id = p_id for update;
  if not found then raise exception 'DASH_NOT_FOUND'; end if;
  if v.owner_id <> auth.uid() or not public.dash_is_config_writer() then raise exception 'DASH_NOT_AUTHORIZED'; end if;
  if v.status not in ('draft','returned') then raise exception 'DASH_NOT_EDITABLE'; end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'DASH_PAYLOAD_REQUIRED'; end if;
  update public.dashboard_config_parameters
     set payload = p_payload,
         title = coalesce(p_title, title),
         requested_effective_from = coalesce(p_effective_from, requested_effective_from),
         status = 'draft',
         updated_at = now()
   where id = p_id;
  perform public.dash_append_audit('draft_updated', p_id, v.payload, p_payload, v.correlation_id);
end $$;

-- Submit a draft for review (maker).
create or replace function public.dash_submit_config(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v public.dashboard_config_parameters;
begin
  select * into v from public.dashboard_config_parameters where id = p_id for update;
  if not found then raise exception 'DASH_NOT_FOUND'; end if;
  if v.owner_id <> auth.uid() or not public.dash_is_config_writer() then raise exception 'DASH_NOT_AUTHORIZED'; end if;
  if v.status not in ('draft','returned') then raise exception 'DASH_NOT_SUBMITTABLE'; end if;
  update public.dashboard_config_parameters
     set status = 'pending_review', submitted_at = now(), updated_at = now()
   where id = p_id;
  perform public.dash_append_audit('submitted', p_id, v.payload, v.payload, v.correlation_id);
end $$;

-- Return a submitted draft to the maker (reviewer, must not be the maker).
create or replace function public.dash_return_config(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v public.dashboard_config_parameters;
begin
  select * into v from public.dashboard_config_parameters where id = p_id for update;
  if not found then raise exception 'DASH_NOT_FOUND'; end if;
  if not public.dash_is_config_reviewer() then raise exception 'DASH_REVIEW_NOT_AUTHORIZED'; end if;
  if v.owner_id = auth.uid() then raise exception 'DASH_MAKER_CHECKER'; end if;
  if v.status <> 'pending_review' then raise exception 'DASH_NOT_RETURNABLE'; end if;
  if p_reason is null or btrim(p_reason) = '' then raise exception 'DASH_COMMENT_REQUIRED'; end if;
  update public.dashboard_config_parameters
     set status = 'returned', return_reason = p_reason, decided_by = auth.uid(), decided_at = now(), revision = revision + 1, updated_at = now()
   where id = p_id;
  perform public.dash_append_audit('returned', p_id, v.payload, jsonb_build_object('return_reason', p_reason), v.correlation_id);
end $$;

-- Publish an approved-for-publish draft into an immutable, effective-dated
-- version and switch the head pointer (reviewer, must not be the maker).
create or replace function public.dash_publish_config(p_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v public.dashboard_config_parameters;
  v_next integer;
  v_version_id uuid;
  v_audit bigint;
begin
  select * into v from public.dashboard_config_parameters where id = p_id for update;
  if not found then raise exception 'DASH_NOT_FOUND'; end if;
  if not public.dash_is_config_reviewer() then raise exception 'DASH_PUBLISH_NOT_AUTHORIZED'; end if;
  if v.owner_id = auth.uid() then raise exception 'DASH_MAKER_CHECKER'; end if;
  if v.status <> 'pending_review' then raise exception 'DASH_NOT_PUBLISHABLE'; end if;

  select coalesce(max(version_number), 0) + 1 into v_next
    from public.dashboard_config_versions where config_key = v.config_key;

  -- Pre-generate the version id so the immutable publication audit can be
  -- written first and referenced at INSERT time (the versions table is
  -- append-only, so a post-insert UPDATE is intentionally impossible).
  v_version_id := gen_random_uuid();
  v_audit := public.dash_append_audit('published', p_id, v.payload,
    jsonb_build_object('config_key', v.config_key, 'version_id', v_version_id, 'version_number', v_next), v.correlation_id);

  insert into public.dashboard_config_versions
    (id, config_key, version_number, payload, effective_from, source_parameter_id, published_by, correlation_id, publication_audit_reference)
  values
    (v_version_id, v.config_key, v_next, v.payload, coalesce(v.requested_effective_from, now()), v.id, auth.uid(), v.correlation_id, v_audit);

  insert into public.dashboard_config_heads(config_key, current_version_id, activated_at)
  values (v.config_key, v_version_id, now())
  on conflict (config_key) do update set current_version_id = excluded.current_version_id, activated_at = now();

  update public.dashboard_config_parameters
     set status = 'approved', decided_by = auth.uid(), decided_at = now(), updated_at = now()
   where id = p_id;

  return v_version_id;
end $$;

-- Lock down RPC execution to authenticated principals (role gate is inside).
revoke all on function public.dash_create_config_draft(text, text, jsonb, timestamptz) from public;
revoke all on function public.dash_update_config_draft(uuid, jsonb, text, timestamptz) from public;
revoke all on function public.dash_submit_config(uuid) from public;
revoke all on function public.dash_return_config(uuid, text) from public;
revoke all on function public.dash_publish_config(uuid) from public;
grant execute on function public.dash_create_config_draft(text, text, jsonb, timestamptz) to authenticated;
grant execute on function public.dash_update_config_draft(uuid, jsonb, text, timestamptz) to authenticated;
grant execute on function public.dash_submit_config(uuid) to authenticated;
grant execute on function public.dash_return_config(uuid, text) to authenticated;
grant execute on function public.dash_publish_config(uuid) to authenticated;

-- Internal helpers are not directly callable by clients.
revoke all on function public.dash_append_audit(text, uuid, jsonb, jsonb, uuid) from public;
revoke all on function public.dash_is_config_writer() from public;
revoke all on function public.dash_is_config_reviewer() from public;
