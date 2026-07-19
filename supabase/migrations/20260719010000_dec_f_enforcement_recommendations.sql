-- ============================================================================
-- DEC-F — Unlicensed-establishment enforcement recommendation (Figma J-20
-- "قرار الإجراء": غرامة مالية / تحويل للجنة / إنذار نهائي / إغلاق فوري).
--
-- Sponsor authorization: SPONSOR_DECISIONS_AND_IMPLEMENTATION_AUTHORIZATION.md,
-- DEC-F — "Inspector may record evidence and submit an enforcement
-- recommendation/request. Inspector must not execute immediate closure or
-- another final enforcement decision. Authorized supervisor/operations role
-- owns the final decision."
--
-- Modeled on two existing, already-governed patterns (no new invariant
-- invented):
--   - action_forms (0001_foundation.sql) for the "record a recommendation
--     with owner/role/status" shape;
--   - reviews + guard_decided_review (0001/0002_rbac_audit.sql) for the
--     "decide once, then immutable" shape and its compare-and-set update
--     pattern (see apps/web/src/app/reviews/[id]/actions.ts).
-- ============================================================================

create table enforcement_recommendations (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references factories(id),
  visit_id uuid references visits(id),                     -- the immediate-visit context, if any
  recommended_action text not null
    check (recommended_action in ('fine','committee','warning','closure')),
  recommendation_notes text check (length(recommendation_notes) <= 2000),
  recommended_by uuid not null references profiles(user_id),
  recommended_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_by uuid references profiles(user_id),
  decided_at timestamptz,
  decision_reason text check (length(decision_reason) <= 2000)
);
comment on table enforcement_recommendations is
  'DEC-F: inspector-submitted recommendation only. recommended_by never
   executes the decision — status transitions pending->approved|rejected are
   restricted to ops/compliance_admin by RLS below, and immutable once decided
   (trg_guard_enforcement_recommendation), same shape as reviews/M06-009.';

alter table enforcement_recommendations enable row level security;

-- Read: broad, matching the existing inspections_read-style convention —
-- the recommendation itself isn't secret, only the decide action is gated.
create policy enforcement_recommendations_read on enforcement_recommendations for select
  using (has_any_role(array['inspector','planner','ops','compliance_admin','auditor','reviewer','leadership']));

-- Recommend: inspector only, must be their own row, and if a visit context is
-- given they must be the assigned inspector on it (reuses is_assigned_inspector,
-- 0002_rbac_audit.sql — no new authorization primitive invented).
create policy enforcement_recommendations_insert on enforcement_recommendations for insert
  with check (
    has_any_role(array['inspector'])
    and recommended_by = auth.uid()
    and (visit_id is null or is_assigned_inspector(visit_id))
  );

-- Decide: ops/compliance_admin only — same role pair already used for
-- comparable compliance-authority decisions elsewhere (e.g. admin/regulations,
-- admin/violations). Inspector has no update policy at all, so cannot self-decide.
create policy enforcement_recommendations_decide on enforcement_recommendations for update
  using (has_any_role(array['ops','compliance_admin']))
  with check (has_any_role(array['ops','compliance_admin']));

-- Immutable once decided (mirrors guard_decided_review exactly).
create or replace function guard_decided_enforcement_recommendation() returns trigger language plpgsql as $$
begin
  if old.decided_at is not null then
    raise exception 'IMMUTABLE: enforcement recommendation % already decided (%) — decisions cannot be edited (DEC-F)', old.id, old.status;
  end if;
  return new;
end $$;
create trigger trg_guard_enforcement_recommendation before update on enforcement_recommendations
  for each row execute function guard_decided_enforcement_recommendation();

-- Append-only audit (reuses the existing audit_row_change trigger function,
-- 0002_rbac_audit.sql — no new audit mechanism invented).
create trigger trg_audit_enforcement_recommendations
  after insert or update or delete on enforcement_recommendations
  for each row execute function audit_row_change();

create index idx_enforcement_recommendations_factory on enforcement_recommendations(factory_id);
create index idx_enforcement_recommendations_status on enforcement_recommendations(status) where status = 'pending';
