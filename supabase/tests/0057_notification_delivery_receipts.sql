\set ON_ERROR_STOP on
-- REQ-017 rollback-only provider receipt probe.
begin;

do $$
begin
  if to_regclass('public.notification_delivery_attempts') is null then
    raise exception 'REQ017-RECEIPT-TABLE-MISSING';
  end if;
  if not exists(select 1 from pg_class
    where oid='public.notification_delivery_attempts'::regclass
      and relrowsecurity and relforcerowsecurity) then
    raise exception 'REQ017-RECEIPT-RLS-MISSING';
  end if;
  if has_table_privilege('service_role',
      'public.notification_delivery_attempts','insert')
     or has_function_privilege('authenticated',
      'public.record_notification_delivery_attempt(uuid,uuid,text,text,text,text,text,text)',
      'execute')
     or not has_function_privilege('service_role',
      'public.record_notification_delivery_attempt(uuid,uuid,text,text,text,text,text,text)',
      'execute') then
    raise exception 'REQ017-RECEIPT-ACL';
  end if;
end
$$;

insert into public.workflow_outbox(
  id,idempotency_key,aggregate_type,aggregate_id,aggregate_version,
  side_effect_kind,payload,status
) values (
  '00000000-0000-4000-8000-000000000171',
  'req017-probe','visit','00000000-0000-4000-8000-000000000172',
  1,'notify','{}','pending'
);

set local role service_role;
do $$
declare
  v_first jsonb;
  v_replay jsonb;
  v_transient jsonb;
begin
  v_transient:=public.record_notification_delivery_attempt(
    '00000000-0000-4000-8000-000000000171',null,'attempt-1',
    'configured-adapter','inapp','transient_failure',null,'PROVIDER-TIMEOUT');
  if (v_transient->>'outcome')<>'transient_failure'
     or (v_transient->>'delivery_proven')::boolean then
    raise exception 'REQ017-TRANSIENT-TRUTH';
  end if;
  v_first:=public.record_notification_delivery_attempt(
    '00000000-0000-4000-8000-000000000171',null,'attempt-2',
    'configured-adapter','inapp','delivered','provider-receipt-1',null);
  if not (v_first->>'delivery_proven')::boolean
     or (v_first->>'idempotent')::boolean then
    raise exception 'REQ017-DELIVERY-TRUTH';
  end if;
  v_replay:=public.record_notification_delivery_attempt(
    '00000000-0000-4000-8000-000000000171',null,'attempt-2',
    'configured-adapter','inapp','delivered','provider-receipt-1',null);
  if not (v_replay->>'idempotent')::boolean
     or v_replay->>'attempt_id'<>v_first->>'attempt_id' then
    raise exception 'REQ017-IDEMPOTENT-REPLAY';
  end if;
  begin
    perform public.record_notification_delivery_attempt(
      '00000000-0000-4000-8000-000000000171',null,'attempt-2',
      'configured-adapter','inapp','delivered','different-receipt',null);
    raise exception 'REQ017-CONFLICT-WAS-ALLOWED';
  exception when unique_violation then
    if sqlerrm<>'NOTIFICATION-DELIVERY-IDEMPOTENCY-CONFLICT' then raise; end if;
  end;
  begin
    perform public.record_notification_delivery_attempt(
      '00000000-0000-4000-8000-000000000171',null,'attempt-3',
      'configured-adapter','inapp','transient_failure',null,'LATE-FAILURE');
    raise exception 'REQ017-DELIVERED-DOWNGRADE-WAS-ALLOWED';
  exception when check_violation then
    if sqlerrm<>'NOTIFICATION-DELIVERY-OUTBOX-STATE' then raise; end if;
  end;
end
$$;
reset role;

do $$
begin
  if (select count(*) from public.notification_delivery_attempts
      where outbox_id='00000000-0000-4000-8000-000000000171')<>2 then
    raise exception 'REQ017-ATTEMPT-COUNT';
  end if;
  if (select status<>'dispatched' or attempts<>2 or dispatched_at is null
      from public.workflow_outbox
      where id='00000000-0000-4000-8000-000000000171') then
    raise exception 'REQ017-OUTBOX-DELIVERY-STATE';
  end if;
  begin
    update public.notification_delivery_attempts set outcome='failed'
    where outbox_id='00000000-0000-4000-8000-000000000171';
    raise exception 'REQ017-IMMUTABILITY-WAS-ALLOWED';
  exception when object_not_in_prerequisite_state then
    if sqlerrm<>'NOTIFICATION-DELIVERY-ATTEMPT-IMMUTABLE' then raise; end if;
  end;
end
$$;

rollback;
