-- ============================================================================
-- Migration 20260717020000 — TASK-MVP2-M2-02-WORKFLOW-STUDIO-001
-- M2-02 Workflow, SLA & Notification Studio — side-effect outbox (GAP-09)
-- Requirement: MVP2-REQ-0031 — assign task, send notification, generate report,
--   lock package, call EBDA, create violation, start/pause/resume SLA, enqueue
--   risk update run **once or safely retry** (exactly-once / idempotent).
--
-- The outbox is the single idempotent command boundary. Every side effect a
-- transition declares is enqueued with a deterministic idempotency_key derived
-- from (aggregate, version, transition, fx). A retry of the same transition
-- produces the same key; the UNIQUE constraint makes the re-enqueue a no-op, so
-- no side effect fires twice. Dispatch to the actual provider (notify/EBDA/SMS/
-- email/push) is provider-dependent and remains honestly pending until adapters
-- exist (GAP-10) — a row here is an enqueued command, never proof of delivery.
--
-- FORWARD-ONLY. ADDITIVE. IDEMPOTENT. No remote apply during parallel dev.
-- Contract/negative test: supabase/tests/mvp2_m2_02_workflow_outbox_probe.sql
-- ============================================================================

create table if not exists public.workflow_outbox (
  id              uuid primary key default gen_random_uuid(),
  idempotency_key text        not null,                 -- deterministic per (aggregate,version,transition,fx)
  aggregate_type  text        not null,                 -- visit|report|finding|violation|correction|committee|plan|risk|sla
  aggregate_id    uuid        not null,
  aggregate_version integer   not null default 1,
  side_effect_kind text       not null,                 -- assign|notify|report|package_lock|ebda|violation|sla|risk
  payload         jsonb       not null default '{}'::jsonb,
  status          text        not null default 'pending'
                  check (status in ('pending','dispatched','failed','superseded')),
  attempts        integer     not null default 0,
  last_error      text,
  created_by      uuid references public.profiles(user_id),
  created_at      timestamptz not null default now(),
  dispatched_at   timestamptz
);

-- Exactly-once enqueue: a duplicate command (same idempotency_key) is rejected /
-- ignored, so a transition retry never enqueues the same side effect twice.
create unique index if not exists uq_workflow_outbox_idempotency
  on public.workflow_outbox (idempotency_key);

create index if not exists ix_workflow_outbox_pending
  on public.workflow_outbox (status, created_at) where status = 'pending';
create index if not exists ix_workflow_outbox_aggregate
  on public.workflow_outbox (aggregate_type, aggregate_id);

-- ---------- RLS: admin/service write; authenticated read; no delete ----------
alter table public.workflow_outbox enable row level security;

drop policy if exists workflow_outbox_read on public.workflow_outbox;
create policy workflow_outbox_read on public.workflow_outbox
  for select using (auth.uid() is not null);

drop policy if exists workflow_outbox_write on public.workflow_outbox;
create policy workflow_outbox_write on public.workflow_outbox
  for insert with check (
    has_any_role(array['compliance_admin','form_admin','workflow_admin','risk_owner','gis_admin','security_admin']));

drop policy if exists workflow_outbox_update on public.workflow_outbox;
create policy workflow_outbox_update on public.workflow_outbox
  for update using (
    has_any_role(array['compliance_admin','form_admin','workflow_admin','risk_owner','gis_admin','security_admin']));
-- No delete policy: the command ledger is retained (retry/audit evidence).

comment on table public.workflow_outbox is
  'MVP2-REQ-0031 idempotent side-effect boundary. Enqueue is exactly-once via uq_workflow_outbox_idempotency; a row is an enqueued command, not proof of delivery (provider dispatch is GAP-10, honestly pending).';
