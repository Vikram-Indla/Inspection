-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- SAQEEL Planning Module — supplementary: capability-based UPDATE policy on visits.
-- Additive only: one new permissive policy; nothing dropped or altered.
create policy visits_update_capability on visits for update
  using (
    has_planning_capability('planning.manage')
    or has_planning_capability('planning.publish')
    or has_planning_capability('planning.cancel')
    or has_planning_capability('planning.reassign')
    or has_planning_capability('planning.reschedule')
    or has_planning_capability('planning.edit_draft')
  );
