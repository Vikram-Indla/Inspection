-- TASK-EXECUTION-MODULE-001 · Phase 5 — Execution workspace item lifecycle,
-- violation-candidate invalidation (SAQEEL-EXE-CANONICAL-PLAN v1.0 §15/§18/§20)
--
-- Strictly additive:
--   * NEW table inspection_item_states records per-visit item ADD/DESELECT
--     lifecycle (with mandatory deselect reason and pre-submit restore via
--     reverted_at). Deselected items are NEVER deleted: they stay in the audit
--     trail, require no response/evidence, create no violation, and are
--     excluded from the compliance denominator (plan §15, D-017).
--   * violations gains THREE nullable invalidation columns. Violations stay
--     insert-only: a narrow guard trigger permits UPDATE exclusively to stamp
--     invalidated_at / invalidated_by / invalidate_reason, and only while the
--     parent inspection is not submitted-locked (plan §18 — a response flipped
--     back to Compliant INVALIDATES the active candidate, never deletes it;
--     D-018). Every other UPDATE remains rejected by RLS (no general update
--     policy) and the guard.
--   * No backfills, nothing destructive, no existing row changes meaning.
--
-- audit_row_change (0002) is NOT reusable for inspection_item_states: it
-- dereferences new.id/old.id, and this table's primary key is the composite
-- (inspection_id, item_id) with no id column. A small equivalent trigger
-- (audit_item_state_change) writes the same audit_events shape keyed by
-- inspection_id with the full row in before/after state (D-017).
-- All objects are schema-qualified; function bodies pin search_path like
-- 20260721140000.

-- ---------- 1 · inspection_item_states ---------------------------------------
create table if not exists public.inspection_item_states (
  inspection_id uuid not null references public.inspections(id) on delete restrict,
  item_id uuid not null references public.inspection_items(id) on delete restrict,
  state text not null check (state in ('added', 'deselected')),
  reason text,
  actor uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  reverted_at timestamptz,
  primary key (inspection_id, item_id),
  constraint inspection_item_states_reason_shape check (
    (state = 'deselected' and reason is not null and length(trim(reason)) > 0)
    or (state = 'added')
  )
);
comment on table public.inspection_item_states is
  'Per-visit item lifecycle (plan §15): inspector-added items and optional-item deselections (reason mandatory). reverted_at set = restored before submit; the row is kept for audit either way.';

alter table public.inspection_item_states enable row level security;
revoke all on table public.inspection_item_states from anon, authenticated;
grant select, insert, update on table public.inspection_item_states to authenticated;

-- Read: assigned inspector of the parent visit + oversight roles (same
-- approach as responses_rw in 0002, extended to planner/ops/leadership).
drop policy if exists inspection_item_states_read on public.inspection_item_states;
create policy inspection_item_states_read on public.inspection_item_states
  for select to authenticated
  using (
    exists (
      select 1 from public.inspections i
       where i.id = inspection_id
         and (public.is_assigned_inspector(i.visit_id)
              or public.has_any_role(array['reviewer', 'auditor', 'ops', 'planner', 'leadership']))
    )
  );

-- Write: the assigned inspector of the parent visit ONLY. The submitted lock
-- is enforced by the reused guard_submitted_inspection trigger below (the
-- function keys off new/old.inspection_id, so it attaches unchanged).
drop policy if exists inspection_item_states_inspector_insert on public.inspection_item_states;
create policy inspection_item_states_inspector_insert on public.inspection_item_states
  for insert to authenticated
  with check (
    exists (
      select 1 from public.inspections i
       where i.id = inspection_id and public.is_assigned_inspector(i.visit_id)
    )
  );
drop policy if exists inspection_item_states_inspector_update on public.inspection_item_states;
create policy inspection_item_states_inspector_update on public.inspection_item_states
  for update to authenticated
  using (
    exists (
      select 1 from public.inspections i
       where i.id = inspection_id and public.is_assigned_inspector(i.visit_id)
    )
  )
  with check (
    exists (
      select 1 from public.inspections i
       where i.id = inspection_id and public.is_assigned_inspector(i.visit_id)
    )
  );
-- No delete policy: lifecycle rows are never deleted (audit preserved).

-- Submitted/under_review/approved/rejected lock — the SAME guard function as
-- checklist_responses/evidence/findings (0002); reusable verbatim because it
-- reads coalesce(new.inspection_id, old.inspection_id).
drop trigger if exists trg_guard_item_state on public.inspection_item_states;
create trigger trg_guard_item_state
  before insert or update or delete on public.inspection_item_states
  for each row execute function public.guard_submitted_inspection();

-- Audit: audit_row_change needs new.id/old.id (absent on this composite-PK
-- table), so an equivalent composite-key trigger appends the same event shape.
create or replace function public.audit_item_state_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_events(actor, object_type, object_id, action, before_state, after_state)
  values (
    auth.uid(), 'inspection_item_states',
    coalesce((case when tg_op = 'DELETE' then null else new.inspection_id end), old.inspection_id),
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;
revoke all on function public.audit_item_state_change() from public, anon;
drop trigger if exists trg_audit_item_state on public.inspection_item_states;
create trigger trg_audit_item_state
  after insert or update or delete on public.inspection_item_states
  for each row execute function public.audit_item_state_change();

-- ---------- 2 · violations: invalidation columns (insert-only preserved) -----
alter table public.violations add column if not exists invalidated_at timestamptz;
alter table public.violations add column if not exists invalidated_by uuid;
alter table public.violations add column if not exists invalidate_reason text;
comment on column public.violations.invalidated_at is
  'Set when the triggering response flipped back to Compliant (plan §18): the candidate is INVALIDATED, never deleted, and stays visible for audit.';
comment on column public.violations.invalidated_by is
  'Actor who invalidated the candidate (the assigned inspector via the workspace).';
comment on column public.violations.invalidate_reason is
  'Why the candidate was invalidated (e.g. "Response changed to compliant").';

-- Active-candidate lookups (workspace + reviewers) mostly want live rows.
create index if not exists violations_active_inspection_idx
  on public.violations (inspection_id) where invalidated_at is null;

-- Narrow UPDATE path: ONLY the three invalidation columns may change, the row
-- must actually become invalidated (no un-invalidate — audit preserved), and
-- the parent inspection must not be submitted/under_review/approved/rejected
-- (same lock list as guard_submitted_inspection, 0002).
create or replace function public.guard_violation_invalidate()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_status text;
begin
  if new.inspection_id is distinct from old.inspection_id
     or new.violation_code_id is distinct from old.violation_code_id
     or new.finding_id is distinct from old.finding_id
     or new.mapping_version is distinct from old.mapping_version
     or new.triggered_by_response is distinct from old.triggered_by_response then
    raise exception 'IMMUTABLE: violation % accepts only invalidation columns (insert-only semantics preserved, FLD-VIO-001)',
      old.id;
  end if;
  if new.invalidated_at is null then
    raise exception 'IMMUTABLE: violation % invalidation cannot be cleared — candidates are invalidated, never deleted or restored',
      old.id;
  end if;
  select i.status into v_status from public.inspections i where i.id = old.inspection_id;
  if v_status in ('submitted', 'under_review', 'approved', 'rejected') then
    raise exception 'IMMUTABLE: inspection % content is locked (status %) — corrections only via review return (STM-REV-003)',
      old.inspection_id, v_status;
  end if;
  return new;
end $$;
revoke all on function public.guard_violation_invalidate() from public, anon;
drop trigger if exists trg_guard_violation_invalidate on public.violations;
create trigger trg_guard_violation_invalidate
  before update on public.violations
  for each row execute function public.guard_violation_invalidate();

-- UPDATE policy exists ONLY for the invalidation path (assigned inspector of
-- the parent visit); the guard trigger above narrows what the update may do.
-- Insert-only semantics are otherwise unchanged (violations_insert, 0002).
drop policy if exists violations_invalidate on public.violations;
create policy violations_invalidate on public.violations
  for update to authenticated
  using (
    exists (
      select 1 from public.inspections i
       where i.id = inspection_id and public.is_assigned_inspector(i.visit_id)
    )
  )
  with check (
    exists (
      select 1 from public.inspections i
       where i.id = inspection_id and public.is_assigned_inspector(i.visit_id)
    )
  );
