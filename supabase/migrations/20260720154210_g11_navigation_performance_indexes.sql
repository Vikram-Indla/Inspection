-- TASK-G11-REMEDIATION-PERFORMANCE-001
-- Forward-only indexes for the measured Dashboard, Operations and Reviews read paths.
-- This migration does not change RLS, workflow transitions, records, or accepted behavior.

create index if not exists reviews_inspection_decided_idx
  on public.reviews (inspection_id, decided_at desc nulls first);

create index if not exists inspections_status_submitted_idx
  on public.inspections (status, submitted_at desc);

create index if not exists evidence_inspection_idx
  on public.evidence (inspection_id);

create index if not exists evidence_override_lookup_idx
  on public.evidence (linked_id)
  where linked_type = 'geo_override' and evidence_type = 'photo';

create index if not exists violations_inspection_idx
  on public.violations (inspection_id);

create index if not exists action_forms_open_due_idx
  on public.action_forms (due_at, id)
  where status <> 'closed';

create index if not exists assignments_visit_idx
  on public.assignments (visit_id);
