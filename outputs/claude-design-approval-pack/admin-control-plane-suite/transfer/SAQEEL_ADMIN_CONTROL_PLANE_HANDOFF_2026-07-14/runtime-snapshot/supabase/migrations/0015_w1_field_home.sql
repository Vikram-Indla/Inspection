-- 0015_w1_field_home — Field home depth (SCR-IPAD-600)
-- MVP1-M03-001: inspector notification inbox needs mark-read → notifications UPDATE
--               policy scoped to the recipient (was select-only via notif_own).
-- MVP1-M03-015: persisted published → expired transition when window_end < now()
--               and the inspection never started. Inspectors cannot UPDATE visits
--               (visits_update is planner/ops), so the canonical transition runs
--               in a SECURITY DEFINER function guarded to the caller's own
--               assignments (or ops/planner). Audit trigger trg_audit_visits
--               (0002) records each transition row.

-- M03-001 — recipient (or ops) may update their own notification rows.
-- App code writes delivery_state only ('read' / 'handled'); RLS scopes the rows.
drop policy if exists notif_update_recipient on notifications;
create policy notif_update_recipient on notifications for update
  using (recipient = auth.uid() or has_role('ops'))
  with check (recipient = auth.uid() or has_role('ops'));

-- M03-015 — canonical expiry transition (New/Ready/Expired state management).
-- Guards: published only, window lapsed, inspection not started (no weakening of
-- started work), and caller must be an assigned inspector of the row or ops/planner.
create or replace function expire_lapsed_visits() returns integer
language sql volatile security definer set search_path = public as $$
  with lapsed as (
    update visits v
       set planning_status = 'expired'
     where v.planning_status = 'published'
       and v.window_end < now()
       and not exists (
         select 1 from inspections i
          where i.visit_id = v.id and i.status <> 'not_started')
       and (
         exists (select 1 from assignments a
                  where a.visit_id = v.id and a.inspector_id = auth.uid())
         or has_any_role(array['ops','planner']))
    returning v.id)
  select count(*)::integer from lapsed;
$$;
revoke all on function expire_lapsed_visits() from public;
grant execute on function expire_lapsed_visits() to authenticated;
