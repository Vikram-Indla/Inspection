-- Contract probe for 20260717020000_mvp2_m2_02_workflow_outbox.sql
-- TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0031. Read-only assertions.

do $$
begin
  if not exists (select 1 from information_schema.tables
                 where table_name='workflow_outbox') then
    raise exception 'FAIL: workflow_outbox table missing'; end if;

  -- Exactly-once enqueue: unique index on idempotency_key.
  if not exists (select 1 from pg_indexes
                 where indexname='uq_workflow_outbox_idempotency') then
    raise exception 'FAIL: uq_workflow_outbox_idempotency unique index missing'; end if;

  -- Status domain guard.
  if not exists (select 1 from information_schema.check_constraints cc
                 join information_schema.constraint_column_usage ccu
                   on cc.constraint_name = ccu.constraint_name
                 where ccu.table_name='workflow_outbox' and ccu.column_name='status') then
    raise exception 'FAIL: workflow_outbox.status check constraint missing'; end if;

  -- RLS enabled + write policy scoped to admin roles + no delete policy.
  if not exists (select 1 from pg_tables where tablename='workflow_outbox' and rowsecurity) then
    raise exception 'FAIL: workflow_outbox RLS not enabled'; end if;
  if not exists (select 1 from pg_policies where tablename='workflow_outbox' and policyname='workflow_outbox_write') then
    raise exception 'FAIL: workflow_outbox_write policy missing'; end if;
  if exists (select 1 from pg_policies where tablename='workflow_outbox' and cmd='DELETE') then
    raise exception 'FAIL: workflow_outbox gained a DELETE policy (command ledger must be retained)'; end if;

  raise notice 'PASS: mvp2_m2_02_workflow_outbox probe';
end $$;
