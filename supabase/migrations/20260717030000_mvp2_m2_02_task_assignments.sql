-- ============================================================================
-- Migration 20260717030000 — TASK-MVP2-M2-02-WORKFLOW-STUDIO-001
-- M2-02 Workflow, SLA & Notification Studio — governed task workspace (GAP-05)
-- Requirement: MVP2-REQ-0032 — My Tasks and All Authorized Tasks; reassignment,
--   activation/deactivation, case detail; manager scope enforced by branch/sector;
--   task statuses New/Assigned/In Progress/Suspended/Completed/Cancelled; no
--   existence disclosure outside scope.
--
-- RECONCILIATION: the MVP1 `assignments` table is VISIT-SPECIFIC (visit_id,
-- inspector_id, method, one-per-visit) and is NOT modified or duplicated here.
-- This adds a distinct governed layer for the cross-object task workspace
-- (visit/review/correction/committee/…) with reassignment + activation + scope.
-- The unified My/All-Authorized read remains a caller query over this table
-- joined to the object sources (case detail links to the object's own route).
--
-- FORWARD-ONLY. ADDITIVE. IDEMPOTENT. No remote apply during parallel dev.
-- Contract/negative test: supabase/tests/mvp2_m2_02_task_assignments_probe.sql
-- ============================================================================

create table if not exists public.workflow_task_assignments (
  id            uuid primary key default gen_random_uuid(),
  task_type     text not null
                check (task_type in ('visit','review','correction','committee','self_assessment','objection')),
  task_ref      uuid not null,                          -- id of the underlying object (case detail target)
  assignee      uuid references public.profiles(user_id),
  status        text not null default 'new'
                check (status in ('new','assigned','in_progress','suspended','completed','cancelled')),
  branch        text,                                   -- scope: matches profiles.region
  sector        text,                                   -- scope: matches profiles.org_scope
  jurisdiction  text,
  active        boolean not null default true,          -- activation/deactivation semantics
  reason        text,                                   -- mandatory reassignment / status-change reason
  created_by    uuid references public.profiles(user_id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- One active assignment per task (open statuses only); history retained.
create unique index if not exists uq_workflow_task_active
  on public.workflow_task_assignments (task_type, task_ref)
  where active and status not in ('completed','cancelled');

create index if not exists ix_workflow_task_assignee on public.workflow_task_assignments (assignee);
create index if not exists ix_workflow_task_scope    on public.workflow_task_assignments (branch, sector);

-- updated_at bump.
create or replace function public.workflow_task_assignments_touch()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists trg_workflow_task_touch on public.workflow_task_assignments;
create trigger trg_workflow_task_touch before update on public.workflow_task_assignments
  for each row execute function public.workflow_task_assignments_touch();

-- ---------- RLS: assignee OR scoped manager; no existence disclosure ---------
alter table public.workflow_task_assignments enable row level security;

-- My Tasks: the assignee always sees their own tasks.
-- All Authorized: a manager (ops/planner/leadership) sees tasks whose branch OR
-- sector matches their own profile scope — and ONLY those. Rows outside scope
-- are not returned at all, so existence is never disclosed.
drop policy if exists workflow_task_read on public.workflow_task_assignments;
create policy workflow_task_read on public.workflow_task_assignments
  for select using (
    assignee = auth.uid()
    or (
      has_any_role(array['ops','planner','leadership'])
      and (
        branch = (select region    from public.profiles where user_id = auth.uid())
        or sector = (select org_scope from public.profiles where user_id = auth.uid())
      )
    )
  );

drop policy if exists workflow_task_write on public.workflow_task_assignments;
create policy workflow_task_write on public.workflow_task_assignments
  for insert with check (has_any_role(array['ops','planner','leadership','workflow_admin']));

drop policy if exists workflow_task_update on public.workflow_task_assignments;
create policy workflow_task_update on public.workflow_task_assignments
  for update using (has_any_role(array['ops','planner','leadership','workflow_admin']));
-- No delete policy: reassignment/deactivation is status/active change; history retained.

comment on table public.workflow_task_assignments is
  'MVP2-REQ-0032 governed task workspace layer. Distinct from MVP1 assignments (visit-specific). One active assignment per task (uq_workflow_task_active). RLS: assignee OR scoped manager (branch/sector) — no existence disclosure outside scope.';
