-- Contract probe for 20260717050000_mvp2_m2_02_notification_bilingual_delivery.sql
-- TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0034. Read-only assertions.

do $$
begin
  -- Bilingual pair: template (EN) preserved + template_ar added.
  if not exists (select 1 from information_schema.columns
                 where table_name='notification_rules' and column_name='template') then
    raise exception 'FAIL: notification_rules.template (EN) missing'; end if;
  if not exists (select 1 from information_schema.columns
                 where table_name='notification_rules' and column_name='template_ar') then
    raise exception 'FAIL: notification_rules.template_ar missing'; end if;

  -- Maker-checker preserved (not altered by this migration).
  if not exists (select 1 from information_schema.table_constraints
                 where table_name='notification_rules' and constraint_name='notification_rules_maker_checker') then
    raise exception 'FAIL: notification_rules maker-checker constraint lost'; end if;

  -- Delivery-log columns present.
  perform 1;
  if not exists (select 1 from information_schema.columns where table_name='notifications' and column_name='language') then
    raise exception 'FAIL: notifications.language missing'; end if;
  if not exists (select 1 from information_schema.columns where table_name='notifications' and column_name='attempts') then
    raise exception 'FAIL: notifications.attempts missing'; end if;
  if not exists (select 1 from information_schema.columns where table_name='notifications' and column_name='failure_class') then
    raise exception 'FAIL: notifications.failure_class missing'; end if;
  if not exists (select 1 from information_schema.columns where table_name='notifications' and column_name='provider') then
    raise exception 'FAIL: notifications.provider missing'; end if;

  raise notice 'PASS: mvp2_m2_02_notification_bilingual probe';
end $$;
