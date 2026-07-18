-- ============================================================================
-- Migration 20260717190000 — TASK-MVP2-M2-10-CASE-SPINE-001
-- MVP2-REQ-0114..0119, 0123, 0193 · Design CD-046 R2 (case_spine_v1)
--
-- Additive correction/reinspection/appeal case spine. `case_links` is a
-- PROJECTION over the append-only audit stream (no second log, no table).
-- `objections` is OWNED by the M2-08 migration (20260717180000) and REUSED here —
-- reconciliation R-002; not recreated. Only `cases` is new.
--
-- Non-regression (CD-046): submitted-version immutability, one-open-review index,
-- scoped return, golden journey B10 and audit append-only are all preserved and
-- untouched. Forward-only, additive. Runtime DB_VALIDATION_PENDING.
-- ============================================================================

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.factories(id),
  case_type text not null check (case_type in ('correction','reinspection','appeal')),
  status text not null default 'open'
    check (status in ('open','in_progress','resolved','closed','withdrawn')),
  origin_type text,                       -- review | violation | inspection (owning object)
  origin_ref uuid,
  opened_by uuid references public.profiles(user_id),
  closed_by uuid references public.profiles(user_id),
  closed_reason text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists cases_factory_status_idx on public.cases(factory_id, status);
-- one open case per origin object (mirrors the accepted one-open-review discipline)
create unique index if not exists cases_one_open_per_origin
  on public.cases(origin_type, origin_ref)
  where status in ('open','in_progress');

alter table public.cases enable row level security;
revoke all on public.cases from anon;
drop policy if exists cases_read on public.cases;
create policy cases_read on public.cases for select using (auth.uid() is not null);
drop policy if exists cases_write on public.cases;
create policy cases_write on public.cases for insert
  with check (has_any_role(array['compliance_admin','reviewer','security_admin','leadership']));
drop policy if exists cases_update on public.cases;
create policy cases_update on public.cases for update
  using (has_any_role(array['compliance_admin','reviewer','security_admin','leadership']))
  with check (has_any_role(array['compliance_admin','reviewer','security_admin','leadership']));
-- no delete policy: case history is retained.
