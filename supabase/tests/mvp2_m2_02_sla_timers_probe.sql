-- Contract probe for 20260717040000_mvp2_m2_02_sla_timers.sql
-- TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0033 · DEC-003-honest.

do $$
begin
  if not exists (select 1 from information_schema.tables where table_name='sla_calendars') then
    raise exception 'FAIL: sla_calendars missing'; end if;
  if not exists (select 1 from information_schema.tables where table_name='sla_timers') then
    raise exception 'FAIL: sla_timers missing'; end if;

  -- DEC-003 defaults: activation NOT authorized by default; governed inputs NULLable.
  if (select column_default from information_schema.columns
      where table_name='sla_calendars' and column_name='activation_authorized') not ilike '%false%' then
    raise exception 'FAIL: sla_calendars.activation_authorized must default false (DEC-003)'; end if;

  -- Timers default to pending_activation.
  if (select column_default from information_schema.columns
      where table_name='sla_timers' and column_name='status') not ilike '%pending_activation%' then
    raise exception 'FAIL: sla_timers.status must default pending_activation'; end if;

  -- Activation guard trigger present (blocks running without authorized calendar).
  if not exists (select 1 from pg_trigger where tgname='trg_sla_timer_activation') then
    raise exception 'FAIL: trg_sla_timer_activation activation guard missing'; end if;

  -- RLS on + no delete policy on either table.
  if not exists (select 1 from pg_tables where tablename='sla_timers' and rowsecurity) then
    raise exception 'FAIL: sla_timers RLS not enabled'; end if;
  if exists (select 1 from pg_policies where tablename in ('sla_timers','sla_calendars') and cmd='DELETE') then
    raise exception 'FAIL: SLA tables gained a DELETE policy (history must be retained)'; end if;

  raise notice 'PASS: mvp2_m2_02_sla_timers probe';
end $$;
