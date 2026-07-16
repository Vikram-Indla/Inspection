-- ============================================================================
-- MIM Inspection Platform MVP1 — Migration 0001: Foundation
-- Realizes: BRD §11 business objects · field_dictionary.csv (60 fields) ·
-- state model BRD §9 (5 separate state domains) · ENG-12 audit · RLS skeleton.
-- Decisions applied: DECISIONS_ACCEPTED_2026-07-11.yaml (bands, thresholds
-- stored as CONFIG, not hardcoded — engine rule ENG-04/06 "configuration, not code").
-- ============================================================================

-- ---------- 1 · Enums: five state domains, never conflated (MVP1-FND-002) ----
create type planning_status   as enum ('draft','published','returned','cancelled','expired');
create type operational_state as enum ('new','prepared','on_the_way','arrived','executing','submitted');
create type review_status     as enum ('pending_review','under_review','approved','returned','rejected');
create type virtual_state     as enum ('scheduled','waiting','joined','verified','in_progress','closed');
create type sync_state        as enum ('not_downloaded','verified_locked','synchronized','conflict');

create type planning_method   as enum ('bulk','single','immediate');          -- REF-001 fixed
create type execution_mode    as enum ('physical','virtual');                 -- REF-002
create type assignment_method as enum ('automatic','manual');
create type evidence_link     as enum ('item','finding','action','inspection');-- FLD-EVD-003
create type geofence_result   as enum ('inside','outside','uncertain','override'); -- FLD-GEO-004
create type config_status     as enum ('draft','validated','approved','published','locked','deactivated');

-- ---------- 2 · Identity & RBAC (MVP1-FND-001; RBAC-001..014) ---------------
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  region text,                                   -- data-scope: region/branch (RBAC-008)
  org_scope text,                                -- assigned organizational scope (RBAC-007)
  created_at timestamptz not null default now()
);
create table roles (                             -- REF-015, admin-governed
  role_key text primary key,                     -- planner, inspector, reviewer, ops, auditor, leadership, compliance_admin, form_admin, workflow_admin, risk_owner, gis_admin, security_admin, factory_rep
  title text not null,
  is_admin boolean not null default false
);
create table user_roles (
  user_id uuid references profiles(user_id) on delete cascade,
  role_key text references roles(role_key),
  granted_by uuid references profiles(user_id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role_key)
);

-- ---------- 3 · Configuration engines (versioned, immutable when published) --
create table config_versions (                   -- shared version registry (ENG-01/02/03/04/06/08/11)
  id uuid primary key default gen_random_uuid(),
  engine text not null,                          -- regulatory|package|workflow|risk|gis|penalty|notification
  object_id uuid not null,
  version_label text not null,
  status config_status not null default 'draft',
  payload jsonb not null,                        -- full config snapshot at this version
  effective_from timestamptz,
  created_by uuid references profiles(user_id),
  approved_by uuid references profiles(user_id), -- maker-checker: must differ from created_by
  created_at timestamptz not null default now(),
  constraint maker_checker check (approved_by is null or approved_by <> created_by)
);
create unique index config_versions_active on config_versions(engine, object_id, version_label);

create table regulations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, title text not null, issuing_authority text,
  status config_status not null default 'draft',
  created_at timestamptz not null default now()
);
create table regulation_clauses (
  id uuid primary key default gen_random_uuid(),
  regulation_id uuid not null references regulations(id),
  clause_ref text not null, title text, applicability text, legal_source text,
  unique (regulation_id, clause_ref)
);
create table inspection_items (                  -- M09-002: item belongs to regulation, reused across packages
  id uuid primary key default gen_random_uuid(),
  code text unique not null, title text not null,
  clause_id uuid references regulation_clauses(id),
  response_model jsonb not null,                 -- responses + compliance mapping (M09-019/020)
  evidence_rule jsonb,                           -- base evidence rule (M09-005), overridable per package (M09-025)
  score_weight numeric, score_excluded_on text[],
  guidance_en text, guidance_ar text,
  active boolean not null default true
);
create table packages (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, title text not null, scope text,
  created_at timestamptz not null default now()
);
create table package_versions (                  -- immutable once published (M09-030)
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references packages(id),
  version_label text not null,
  status config_status not null default 'draft',
  definition jsonb not null,                     -- sections, ordered items, conditions, triggers, action forms
  published_at timestamptz,
  unique (package_id, version_label)
);
create table violation_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, title text not null, level text not null,
  clause_id uuid references regulation_clauses(id),
  active_from date, active_to date
);
create table penalty_mappings (                  -- one violation = one penalty (M09-004)
  id uuid primary key default gen_random_uuid(),
  violation_code_id uuid unique not null references violation_codes(id),
  penalty_ref text not null, penalty_range jsonb, repeat_rule jsonb, legal_basis text,
  mapping_version text not null
);

-- Engine settings with accepted defaults (DEC-001/002/003/006/007 — configuration, not code)
create table engine_settings (
  engine text primary key,
  settings jsonb not null,
  version_label text not null,
  updated_by uuid references profiles(user_id),
  updated_at timestamptz not null default now()
);
insert into engine_settings(engine, settings, version_label) values
 ('risk',  '{"factors":[{"key":"violation_history_24mo","weight":0.30},{"key":"outcome_recency_severity","weight":0.20},{"key":"activity_hazard_class","weight":0.20},{"key":"license_status","weight":0.15},{"key":"open_corrective_actions","weight":0.15}],"bands":{"low":[0,39],"medium":[40,69],"high":[70,100]}}','v1-accepted-2026-07-11'),
 ('gis',   '{"gps_accuracy_checkin_max_m":25,"arrival_detection_radius_m":200,"geofence_default_radius_m":150,"telemetry_interval_s":30,"route_deviation":{"off_route_m":500,"sustain_s":120},"retention":{"telemetry_days":90,"checkin":"permanent"}}','v1-accepted-2026-07-11'),
 ('sla',   '{"calendar":{"days":"Sun-Thu","hours":"08:00-17:00","tz":"Asia/Riyadh"},"review_business_days":3,"resubmission_business_days":5,"action_due_calendar_days":14,"reminders":[0.5,0.8],"escalation":{"L1":"breach","L2":"breach+1bd"},"pause_on_return":true}','v1-accepted-2026-07-11'),
 ('evidence','{"photo":{"formats":["jpeg","png","heic"],"max_mb":15},"video":{"formats":["mp4","mov"],"max_minutes":3,"max_mb":250},"document":{"formats":["pdf"],"max_mb":25},"voice":{"formats":["m4a"],"max_minutes":5},"hash":"sha256_at_sync","retention_years":10}','v1-accepted-2026-07-11'),
 ('otp',   '{"channel":"sms","digits":6,"expiry_min":5,"attempts_per_code":3,"resend_max":3,"resend_cooldown_s":60,"provider_primary":"unifonic","provider_fallback":"twilio"}','v1-accepted-2026-07-11');

-- ---------- 4 · Factory master (FND-007: provenance separated) ---------------
create table factories (
  id uuid primary key default gen_random_uuid(),          -- FLD-FACT-001
  factory_code text unique,
  name text not null,                                     -- FLD-FACT-002 (source-owned)
  cr_number text, license_number text,                    -- FLD-FACT-003/004
  region text, city text, activity_class text,
  official_lat numeric(10,7), official_lng numeric(10,7), -- FLD-FACT-005/006 · GIS Admin only
  source text not null default 'senaei',
  source_synced_at timestamptz,                           -- FND-013 freshness
  is_temporary boolean not null default false,            -- immediate-visit unregistered entity (M01-045)
  risk_score numeric(5,2), risk_band text, risk_version text,  -- FLD-FACT-007/008 (ENG-04 output)
  created_at timestamptz not null default now()
);

-- ---------- 5 · Planning & visits (M01/M02) ----------------------------------
create table visit_plans (
  id uuid primary key default gen_random_uuid(),          -- FLD-PLAN-001
  method planning_method not null,                        -- FLD-PLAN-002
  criteria jsonb,                                         -- FLD-PLAN-003 (bulk)
  status planning_status not null default 'draft',
  created_by uuid references profiles(user_id),
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create table visits (
  id uuid primary key default gen_random_uuid(),          -- FLD-VIS-001
  visit_plan_id uuid references visit_plans(id),          -- null for immediate (M01-050)
  factory_id uuid not null references factories(id),      -- FLD-VIS-002
  visit_type text not null,                               -- FLD-VIS-003 (reference data)
  execution_mode execution_mode not null,                 -- FLD-VIS-004
  planning_status planning_status not null default 'draft',  -- FLD-VIS-005 (canonical transitions only)
  operational_state operational_state not null default 'new',-- separate domain (FND-002)
  window_start timestamptz not null, window_end timestamptz not null,  -- FLD-PLAN-004/005
  priority text, notes text,
  planner_lat numeric(10,7), planner_lng numeric(10,7),   -- planner pin ≠ official (M01-038)
  cancellation_reason text,                               -- FLD-VIS-006 (mandatory on cancel)
  package_version_id uuid references package_versions(id),
  created_at timestamptz not null default now(),
  constraint window_order check (window_end > window_start)
);
create table assignments (
  id uuid primary key default gen_random_uuid(),          -- FLD-ASG-001
  visit_id uuid not null references visits(id),
  inspector_id uuid not null references profiles(user_id),-- FLD-ASG-002
  method assignment_method not null,                      -- FLD-ASG-003
  status text not null default 'assigned',                -- assigned|preparing|ready|returned (STM-ASG)
  return_reason text,
  candidates jsonb,                                       -- auto-assignment audit (ENG-05)
  created_at timestamptz not null default now()
);

-- ---------- 6 · Journey & geo (M04 · ENG-06) ---------------------------------
create table journey_sessions (
  id uuid primary key default gen_random_uuid(),          -- FLD-JRN-001
  visit_id uuid not null references visits(id),
  inspector_id uuid not null references profiles(user_id),
  started_at timestamptz not null default now(),          -- FLD-JRN-002
  eta_minutes int, remaining_distance_m int,               -- FLD-JRN-003/004
  status text not null default 'on_journey'
);
create table geo_events (                                  -- immutable (FLD-GEO-*)
  id uuid primary key default gen_random_uuid(),
  journey_id uuid references journey_sessions(id),
  visit_id uuid not null references visits(id),
  kind text not null,                                      -- telemetry|arrival|checkin|override|deviation
  observed_lat numeric(10,7) not null, observed_lng numeric(10,7) not null,
  accuracy_m numeric not null,
  geofence_result geofence_result,
  override_reason text,                                    -- FLD-GEO-005 (REF-011)
  gis_version text,                                        -- config version stamped (ENG-06)
  device_id text, occurred_at timestamptz not null default now()
);

-- ---------- 7 · Inspection runtime (M04/M05) ---------------------------------
create table inspections (
  id uuid primary key default gen_random_uuid(),           -- FLD-INS-001
  visit_id uuid unique not null references visits(id),
  status text not null default 'not_started',              -- FLD-INS-002 canonical
  package_version_id uuid not null references package_versions(id), -- FLD-INS-003 frozen at download
  started_at timestamptz, submitted_at timestamptz
);
create table checklist_responses (
  id uuid primary key default gen_random_uuid(),           -- FLD-RSP-001
  inspection_id uuid not null references inspections(id),
  item_id uuid not null references inspection_items(id),   -- FLD-RSP-002
  response jsonb,                                          -- FLD-RSP-003
  is_complete boolean not null default false,              -- FLD-RSP-004 derived
  updated_at timestamptz not null default now(),
  unique (inspection_id, item_id)
);
create table evidence (
  id uuid primary key default gen_random_uuid(),           -- FLD-EVD-001
  inspection_id uuid not null references inspections(id),
  evidence_type text not null,                             -- FLD-EVD-002 (REF-007)
  linked_type evidence_link not null,                      -- FLD-EVD-003 — linkage mandatory
  linked_id uuid not null,                                 -- FLD-EVD-004 (same-inspection enforced in API layer)
  storage_path text not null,
  captured_at timestamptz not null,                        -- FLD-EVD-005 trusted
  captured_lat numeric(10,7), captured_lng numeric(10,7),
  content_sha256 text,                                     -- FLD-EVD-006 (DEC-006: enabled, at sync)
  captured_by uuid references profiles(user_id),
  synced_at timestamptz
);
create table findings (
  id uuid primary key default gen_random_uuid(),           -- FLD-FND-001
  inspection_id uuid not null references inspections(id),
  item_id uuid references inspection_items(id),
  severity text not null,                                  -- FLD-FND-002
  description text not null check (length(description) <= 2000)  -- FLD-FND-003
);
create table violations (
  id uuid primary key default gen_random_uuid(),           -- FLD-VIO-001
  inspection_id uuid not null references inspections(id),
  violation_code_id uuid not null references violation_codes(id), -- FLD-VIO-002 — auto only (M09-026)
  finding_id uuid references findings(id),
  mapping_version text not null,                           -- FLD-PEN-001 immutable reference
  triggered_by_response uuid references checklist_responses(id)
);
create table action_forms (
  id uuid primary key default gen_random_uuid(),           -- FLD-ACT-001
  inspection_id uuid not null references inspections(id),
  violation_id uuid references violations(id),
  form_type text not null default 'corrective',
  owner_name text, owner_role text,
  due_at timestamptz,                                      -- FLD-ACT-002 (DEC-003 default 14d)
  required_correction text,
  status text not null default 'open',
  is_blocking boolean not null default true                -- M09-027
);

-- ---------- 8 · Submission, versions, review (M06 · ENG-09) ------------------
create table submission_versions (                          -- immutable snapshots
  id uuid primary key default gen_random_uuid(),            -- FLD-SUB-001
  inspection_id uuid not null references inspections(id),
  version_number int not null check (version_number >= 1),  -- FLD-SUB-002
  snapshot jsonb not null,                                  -- full report/checklist/evidence manifest
  acknowledgement jsonb,                                     -- DEC-009: signature image ref/name/ts/geotag or refusal
  idempotency_key text unique,                               -- ERR-SUB-002
  submitted_by uuid references profiles(user_id),
  submitted_at timestamptz not null default now(),
  unique (inspection_id, version_number)
);
create table reviews (
  id uuid primary key default gen_random_uuid(),            -- FLD-REV-001
  inspection_id uuid not null references inspections(id),
  submission_version_id uuid not null references submission_versions(id),
  reviewer_id uuid references profiles(user_id),
  status review_status not null default 'pending_review',
  decision text,                                            -- FLD-REV-002 approve|return|reject
  decision_reason text check (length(decision_reason) <= 2000), -- FLD-REV-003
  returned_sections jsonb,                                  -- FLD-REV-004 exact scope
  decided_at timestamptz
);

-- ---------- 9 · Virtual sessions (M05) ---------------------------------------
create table virtual_sessions (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid unique not null references visits(id),
  state virtual_state not null default 'scheduled',
  appointment_at timestamptz not null,
  timeline jsonb not null default '[]'
);
create table virtual_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references virtual_sessions(id),
  display_name text not null, role text not null,
  joined_at timestamptz, verified_at timestamptz,
  otp_attempts int not null default 0,
  verification_record jsonb                                 -- attempts trail (STM-VIR-002)
);

-- ---------- 10 · Audit (ENG-12 · FND-003: immutable, append-only) ------------
create table audit_events (
  id bigint generated always as identity primary key,
  actor uuid,                                               -- null = system
  object_type text not null, object_id uuid,
  action text not null,
  before_state jsonb, after_state jsonb,
  requirement_refs text[],                                  -- MVP1-Mxx-nnn traceability (FND-015)
  config_versions jsonb,
  occurred_at timestamptz not null default now()
);
revoke update, delete on audit_events from public;          -- append-only

create table notifications (                                 -- ENG-11
  id uuid primary key default gen_random_uuid(),
  event_key text not null,                                   -- REF-014
  recipient uuid references profiles(user_id),
  payload jsonb not null,
  channel text not null default 'push',
  delivery_state text not null default 'queued',
  created_at timestamptz not null default now()
);

-- ---------- 11 · RLS skeleton (deny-by-default; policies grow per slice) -----
alter table profiles          enable row level security;
alter table user_roles        enable row level security;
alter table factories         enable row level security;
alter table visit_plans       enable row level security;
alter table visits            enable row level security;
alter table assignments       enable row level security;
alter table journey_sessions  enable row level security;
alter table geo_events        enable row level security;
alter table inspections       enable row level security;
alter table checklist_responses enable row level security;
alter table evidence          enable row level security;
alter table findings          enable row level security;
alter table violations        enable row level security;
alter table action_forms      enable row level security;
alter table submission_versions enable row level security;
alter table reviews           enable row level security;
alter table virtual_sessions  enable row level security;
alter table virtual_participants enable row level security;
alter table audit_events      enable row level security;
alter table notifications     enable row level security;

create or replace function has_role(r text) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from user_roles where user_id = auth.uid() and role_key = r) $$;

-- Own-assignments-only for inspectors (RBAC-009)
create policy inspector_own_visits on visits for select using (
  has_role('planner') or has_role('ops') or has_role('reviewer') or has_role('auditor') or has_role('leadership')
  or exists (select 1 from assignments a where a.visit_id = visits.id and a.inspector_id = auth.uid())
);
create policy profiles_self on profiles for select using (auth.uid() = user_id or has_role('security_admin') or has_role('ops') or has_role('planner'));
-- (Full RBAC-001..014 policy set lands in migration 0002 per build slice B1.)

insert into roles(role_key, title, is_admin) values
 ('compliance_admin','Compliance Admin',true),('form_admin','Form Admin',true),
 ('workflow_admin','Workflow Admin',true),('risk_owner','Risk Owner',true),
 ('gis_admin','GIS Admin',true),('security_admin','Security Admin',true),
 ('planner','Planner',false),('inspector','Inspector',false),
 ('reviewer','Level 2 Reviewer',false),('ops','Operations',false),
 ('auditor','Auditor',false),('leadership','Leadership',false),
 ('factory_rep','Factory Representative',false);
