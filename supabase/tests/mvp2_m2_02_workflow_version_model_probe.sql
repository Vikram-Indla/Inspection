-- Contract/negative probe for 20260717010000_mvp2_m2_02_workflow_version_model.sql
-- TASK-MVP2-M2-02-WORKFLOW-STUDIO-001. Read-only assertions (no data mutation).
-- Run against a database where the migration has been applied. Any failed
-- assertion raises an exception and fails the probe.

do $$
begin
  -- GAP-06: lifecycle enum values present.
  if not exists (select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid
                 where t.typname='config_status' and e.enumlabel='review') then
    raise exception 'FAIL: config_status missing value review'; end if;
  if not exists (select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid
                 where t.typname='config_status' and e.enumlabel='retired') then
    raise exception 'FAIL: config_status missing value retired'; end if;
  if not exists (select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid
                 where t.typname='config_status' and e.enumlabel='rolled_back') then
    raise exception 'FAIL: config_status missing value rolled_back'; end if;

  -- GAP-08 CAS columns.
  if not exists (select 1 from information_schema.columns
                 where table_name='config_versions' and column_name='row_version') then
    raise exception 'FAIL: config_versions.row_version missing'; end if;
  if not exists (select 1 from information_schema.columns
                 where table_name='config_versions' and column_name='updated_at') then
    raise exception 'FAIL: config_versions.updated_at missing'; end if;

  -- GAP-07 scheduled activation + rollback lineage + retire reason.
  if not exists (select 1 from information_schema.columns
                 where table_name='config_versions' and column_name='scheduled_from') then
    raise exception 'FAIL: config_versions.scheduled_from missing'; end if;
  if not exists (select 1 from information_schema.columns
                 where table_name='config_versions' and column_name='rollback_of') then
    raise exception 'FAIL: config_versions.rollback_of missing'; end if;
  if not exists (select 1 from information_schema.columns
                 where table_name='config_versions' and column_name='retire_reason') then
    raise exception 'FAIL: config_versions.retire_reason missing'; end if;

  -- CAS trigger present.
  if not exists (select 1 from pg_trigger where tgname='trg_config_versions_bump') then
    raise exception 'FAIL: trg_config_versions_bump trigger missing'; end if;

  -- Active-published uniqueness index present.
  if not exists (select 1 from pg_indexes
                 where indexname='uq_config_versions_active_published') then
    raise exception 'FAIL: uq_config_versions_active_published index missing'; end if;

  -- Published-row immutability guard preserved: no delete policy on config_versions.
  if exists (select 1 from pg_policies
             where tablename='config_versions' and cmd='DELETE') then
    raise exception 'FAIL: config_versions gained a DELETE policy (history must be retained)'; end if;

  raise notice 'PASS: mvp2_m2_02_workflow_version_model probe';
end $$;
