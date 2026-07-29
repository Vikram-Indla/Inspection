-- A single visit plan has one request in the single/immediate flows, but a
-- bulk plan owns one request per visit. The original table-level UNIQUE on
-- visit_plan_id therefore made every batch with more than one target fail.
-- Keep the actual invariant: a visit can have at most one active supervision
-- request, while many visits in the same plan are valid.

alter table public.planning_supervision_requests
  drop constraint if exists planning_supervision_requests_visit_plan_id_key;

create unique index if not exists planning_supervision_requests_visit_id_uq
  on public.planning_supervision_requests (visit_id);
