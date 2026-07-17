-- ============================================================================
-- Migration 20260717040000 — TASK-MVP2-M2-02-WORKFLOW-STUDIO-001
-- M2-02 Workflow, SLA & Notification Studio — SLA calendars + timers (GAP-03/04)
-- Requirement: MVP2-REQ-0033 — configure SLA values, active/inactive status,
--   calendars, pause/resume, breach warning and escalation; breach visible and
--   auditable.
--
-- DEC-003 IS OPEN (P0): the working calendar / pause-resume / escalation policy
-- is NOT decided. This migration therefore stores only the SHAPE and BLOCKS
-- runtime activation until an authoritative calendar is recorded. It invents NO
-- durations, working days, holidays, warning thresholds or escalation timers —
-- every such value is a governed input supplied by the decision owner, never a
-- default here. A timer with no authoritative active calendar stays
-- 'pending_activation'; there is no scheduler and no automatic breach execution.
--
-- FORWARD-ONLY. ADDITIVE. IDEMPOTENT. No remote apply during parallel dev.
-- Contract/negative test: supabase/tests/mvp2_m2_02_sla_timers_probe.sql
-- ============================================================================

create table if not exists public.sla_calendars (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  version_label text not null,
  timezone      text,                       -- governed input (e.g. Asia/Riyadh) — not defaulted
  working_days  int[],                      -- governed input (0..6) — NULL until DEC-003 supplies it
  working_start time,                       -- governed input — NULL until supplied
  working_end   time,                       -- governed input — NULL until supplied
  holidays      date[],                     -- governed input — NULL until supplied
  activation_authorized boolean not null default false,  -- only a recorded DEC-003 decision may set true
  created_by    uuid references public.profiles(user_id),
  created_at    timestamptz not null default now()
);

create table if not exists public.sla_timers (
  id            uuid primary key default gen_random_uuid(),
  object_type   text not null,
  object_ref    uuid not null,
  sla_key       text not null,
  calendar_id   uuid references public.sla_calendars(id),
  duration_minutes integer,                 -- governed input — NULL until supplied
  started_at    timestamptz,
  paused_at     timestamptz,
  accumulated_pause_minutes integer not null default 0,
  due_at        timestamptz,                -- computable ONLY from an authorized calendar; else NULL
  warn_at       timestamptz,                -- governed threshold — NULL until supplied
  breach_at     timestamptz,
  escalation_role text,                     -- governed input — NULL until supplied
  status        text not null default 'pending_activation'
                check (status in ('pending_activation','running','paused','breached','met','cancelled')),
  created_by    uuid references public.profiles(user_id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists ix_sla_timers_object on public.sla_timers (object_type, object_ref);
create index if not exists ix_sla_timers_status on public.sla_timers (status);

-- updated_at bump.
create or replace function public.sla_timers_touch()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists trg_sla_timers_touch on public.sla_timers;
create trigger trg_sla_timers_touch before update on public.sla_timers
  for each row execute function public.sla_timers_touch();

-- DEC-003 activation guard: a timer may only enter 'running' when it references a
-- calendar whose activation is authorized AND that calendar's governed inputs are
-- present. Otherwise activation is blocked — no arbitrary timer is ever started.
create or replace function public.sla_timer_activation_guard()
returns trigger language plpgsql as $$
declare cal public.sla_calendars%rowtype;
begin
  if new.status = 'running' then
    if new.calendar_id is null then
      raise exception 'SLA activation blocked: no calendar (DEC-003 unresolved) — timer % stays pending_activation', new.id;
    end if;
    select * into cal from public.sla_calendars where id = new.calendar_id;
    if not found or not cal.activation_authorized
       or cal.working_days is null or cal.working_start is null or cal.working_end is null then
      raise exception 'SLA activation blocked: calendar % is not authorized / not fully specified (DEC-003)', new.calendar_id;
    end if;
    if new.duration_minutes is null or new.due_at is null then
      raise exception 'SLA activation blocked: duration/due not resolved from a governed calendar for timer %', new.id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_sla_timer_activation on public.sla_timers;
create trigger trg_sla_timer_activation before insert or update on public.sla_timers
  for each row execute function public.sla_timer_activation_guard();

-- ---------- RLS: admin config roles; no delete ------------------------------
alter table public.sla_calendars enable row level security;
alter table public.sla_timers    enable row level security;

drop policy if exists sla_calendars_read on public.sla_calendars;
create policy sla_calendars_read on public.sla_calendars for select using (auth.uid() is not null);
drop policy if exists sla_calendars_write on public.sla_calendars;
create policy sla_calendars_write on public.sla_calendars for insert with check (
  has_any_role(array['workflow_admin','compliance_admin','ops','leadership']));
drop policy if exists sla_calendars_update on public.sla_calendars;
create policy sla_calendars_update on public.sla_calendars for update using (
  has_any_role(array['workflow_admin','compliance_admin','ops','leadership']));

drop policy if exists sla_timers_read on public.sla_timers;
create policy sla_timers_read on public.sla_timers for select using (auth.uid() is not null);
drop policy if exists sla_timers_write on public.sla_timers;
create policy sla_timers_write on public.sla_timers for insert with check (
  has_any_role(array['workflow_admin','compliance_admin','ops','leadership']));
drop policy if exists sla_timers_update on public.sla_timers;
create policy sla_timers_update on public.sla_timers for update using (
  has_any_role(array['workflow_admin','compliance_admin','ops','leadership']));
-- No delete policy: SLA history retained.

comment on table public.sla_calendars is
  'MVP2-REQ-0033 / DEC-003. Stores the calendar SHAPE only. working_days/hours/holidays and activation_authorized are governed inputs set by the DEC-003 decision owner — never defaulted here. Activation is blocked until authorized.';
comment on table public.sla_timers is
  'MVP2-REQ-0033. A timer stays pending_activation with NULL due/warn/breach until an authorized, fully-specified calendar resolves them (sla_timer_activation_guard). No scheduler; no automatic breach execution — breach is a derived read + human-usable pause/resume.';
