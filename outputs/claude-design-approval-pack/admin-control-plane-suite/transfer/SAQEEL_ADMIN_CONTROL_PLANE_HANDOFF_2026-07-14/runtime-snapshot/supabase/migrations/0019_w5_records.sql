-- ============================================================================
-- Migration 0019 — W5 Records: audit trail browser access + read performance.
-- audit_events read policy (0002 audit_read) already covers auditor, ops,
-- security_admin, leadership, reviewer, planner. compliance_admin owns the
-- compliance record chain and must be able to browse the trail too (ENG-12).
-- audit_events stay absolutely append-only (0005 trigger + revokes untouched).
-- ============================================================================

create policy audit_read_compliance on audit_events
  for select using (has_role('compliance_admin'));

-- /admin/audit paginates 50/page ordered by occurred_at desc, filterable by
-- object_type, action, actor and date range — cover those access paths.
create index if not exists idx_audit_occurred      on audit_events (occurred_at desc);
create index if not exists idx_audit_object_type   on audit_events (object_type, occurred_at desc);
create index if not exists idx_audit_actor         on audit_events (actor, occurred_at desc);
create index if not exists idx_audit_action        on audit_events (action, occurred_at desc);
