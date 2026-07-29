-- ACT-010 / ACT-004 / REQ-002
-- Canonical Supervisor is routed to Dashboard and holds Planning view, but the
-- remaining table grants and the inspections read policy still recognize only
-- legacy compatibility roles. Supply the missing read seam without widening
-- write authority or removing any existing RLS predicate.
grant select on public.visit_packages, public.inspections to authenticated;

alter policy inspections_read on public.inspections
using (
  public.is_assigned_inspector(visit_id)
  or (
    select public.has_any_role(
      array['reviewer','auditor','ops','planner','leadership']
    )
  )
  or (select public.has_internal_role('supervisor'))
  or (
    status = 'approved'
    and public.inspects_same_factory(visit_id)
  )
);
