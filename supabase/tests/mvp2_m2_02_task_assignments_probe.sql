-- Contract probe for 20260717030000_mvp2_m2_02_task_assignments.sql
-- TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0032. Read-only assertions.

do $$
begin
  if not exists (select 1 from information_schema.tables where table_name='workflow_task_assignments') then
    raise exception 'FAIL: workflow_task_assignments table missing'; end if;

  -- One active assignment per task.
  if not exists (select 1 from pg_indexes where indexname='uq_workflow_task_active') then
    raise exception 'FAIL: uq_workflow_task_active unique index missing'; end if;

  -- Status + task_type domain guards.
  if not exists (select 1 from information_schema.constraint_column_usage
                 where table_name='workflow_task_assignments' and column_name='status') then
    raise exception 'FAIL: status check constraint missing'; end if;

  -- MVP1 assignments table is untouched (still visit-specific).
  if not exists (select 1 from information_schema.columns
                 where table_name='assignments' and column_name='visit_id') then
    raise exception 'FAIL: MVP1 assignments.visit_id missing (must not be altered)'; end if;

  -- RLS enabled; read + write policies present; no delete policy.
  if not exists (select 1 from pg_tables where tablename='workflow_task_assignments' and rowsecurity) then
    raise exception 'FAIL: RLS not enabled on workflow_task_assignments'; end if;
  if not exists (select 1 from pg_policies where tablename='workflow_task_assignments' and policyname='workflow_task_read') then
    raise exception 'FAIL: workflow_task_read policy missing'; end if;
  if not exists (select 1 from pg_policies where tablename='workflow_task_assignments' and policyname='workflow_task_write') then
    raise exception 'FAIL: workflow_task_write policy missing'; end if;
  if exists (select 1 from pg_policies where tablename='workflow_task_assignments' and cmd='DELETE') then
    raise exception 'FAIL: workflow_task_assignments gained a DELETE policy (history must be retained)'; end if;

  raise notice 'PASS: mvp2_m2_02_task_assignments probe';
end $$;
