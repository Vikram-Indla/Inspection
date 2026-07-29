-- REQ-017 — durable provider-attempt evidence for notification outbox intents.
-- Provider selection and retry SLAs remain configuration concerns. This ledger
-- records observed outcomes only; an outbox row remains intent, not delivery.

create table public.notification_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid not null references public.workflow_outbox(id),
  notification_id uuid references public.notifications(id),
  attempt_key text not null,
  attempt_no integer not null check (attempt_no > 0),
  provider text,
  channel text not null,
  outcome text not null check (outcome in (
    'delivered','transient_failure','permanent_failure',
    'not_configured','suppressed'
  )),
  provider_receipt_ref text,
  neutral_error_code text,
  request_hash text not null,
  attempted_at timestamptz not null default transaction_timestamp(),
  recorded_by uuid,
  unique (outbox_id, attempt_key),
  unique (outbox_id, attempt_no),
  check (
    (outcome='delivered'
      and nullif(btrim(provider),'') is not null
      and nullif(btrim(provider_receipt_ref),'') is not null
      and neutral_error_code is null)
    or
    (outcome<>'delivered'
      and provider_receipt_ref is null
      and nullif(btrim(neutral_error_code),'') is not null)
  )
);

create index notification_delivery_attempts_outbox_idx
  on public.notification_delivery_attempts(outbox_id,attempt_no);

alter table public.notification_delivery_attempts enable row level security;
alter table public.notification_delivery_attempts force row level security;
revoke all on public.notification_delivery_attempts from public,anon,authenticated,service_role;

create function public.guard_notification_delivery_attempt_immutable()
returns trigger language plpgsql set search_path=''
as $$
begin
  raise exception using errcode='55000',
    message='NOTIFICATION-DELIVERY-ATTEMPT-IMMUTABLE';
end
$$;

create trigger notification_delivery_attempts_immutable
before update or delete on public.notification_delivery_attempts
for each row execute function public.guard_notification_delivery_attempt_immutable();

create function public.record_notification_delivery_attempt(
  p_outbox_id uuid,
  p_notification_id uuid,
  p_attempt_key text,
  p_provider text,
  p_channel text,
  p_outcome text,
  p_provider_receipt_ref text,
  p_neutral_error_code text
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_outbox public.workflow_outbox%rowtype;
  v_existing public.notification_delivery_attempts%rowtype;
  v_attempt public.notification_delivery_attempts%rowtype;
  v_hash text;
  v_attempt_no integer;
begin
  if p_outbox_id is null
     or nullif(btrim(p_attempt_key),'') is null
     or nullif(btrim(p_channel),'') is null
     or p_outcome not in (
       'delivered','transient_failure','permanent_failure',
       'not_configured','suppressed'
     )
     or (p_outcome='delivered' and (
       nullif(btrim(p_provider),'') is null
       or nullif(btrim(p_provider_receipt_ref),'') is null
       or p_neutral_error_code is not null
     ))
     or (p_outcome<>'delivered' and (
       p_provider_receipt_ref is not null
       or nullif(btrim(p_neutral_error_code),'') is null
     )) then
    raise exception using errcode='22023',
      message='NOTIFICATION-DELIVERY-ATTEMPT-INVALID';
  end if;

  v_hash:=pg_catalog.md5(jsonb_build_object(
    'notification_id',p_notification_id,
    'provider',nullif(btrim(p_provider),''),
    'channel',btrim(p_channel),
    'outcome',p_outcome,
    'provider_receipt_ref',nullif(btrim(p_provider_receipt_ref),''),
    'neutral_error_code',nullif(btrim(p_neutral_error_code),'')
  )::text);

  select * into v_existing
  from public.notification_delivery_attempts
  where outbox_id=p_outbox_id and attempt_key=p_attempt_key;
  if found then
    if v_existing.request_hash<>v_hash then
      raise exception using errcode='23505',
        message='NOTIFICATION-DELIVERY-IDEMPOTENCY-CONFLICT';
    end if;
    return jsonb_build_object(
      'attempt_id',v_existing.id,'outbox_id',v_existing.outbox_id,
      'attempt_no',v_existing.attempt_no,'outcome',v_existing.outcome,
      'delivery_proven',v_existing.outcome='delivered','idempotent',true
    );
  end if;

  select * into v_outbox from public.workflow_outbox
  where id=p_outbox_id for update;
  if not found or v_outbox.side_effect_kind<>'notify'
     or v_outbox.status in ('dispatched','superseded') then
    raise exception using errcode='23514',
      message='NOTIFICATION-DELIVERY-OUTBOX-STATE';
  end if;
  if p_notification_id is not null
     and not exists(select 1 from public.notifications where id=p_notification_id) then
    raise exception using errcode='P0002',
      message='NOTIFICATION-DELIVERY-NOTIFICATION-NOT-FOUND';
  end if;

  select coalesce(max(attempt_no),0)+1 into v_attempt_no
  from public.notification_delivery_attempts where outbox_id=p_outbox_id;
  insert into public.notification_delivery_attempts(
    outbox_id,notification_id,attempt_key,attempt_no,provider,channel,outcome,
    provider_receipt_ref,neutral_error_code,request_hash,recorded_by
  ) values (
    p_outbox_id,p_notification_id,btrim(p_attempt_key),v_attempt_no,
    nullif(btrim(p_provider),''),btrim(p_channel),p_outcome,
    nullif(btrim(p_provider_receipt_ref),''),
    nullif(btrim(p_neutral_error_code),''),v_hash,auth.uid()
  ) returning * into v_attempt;

  update public.workflow_outbox
  set attempts=attempts+1,
      status=case
        when p_outcome='delivered' then 'dispatched'
        when p_outcome='transient_failure' then 'pending'
        else 'failed'
      end,
      last_error=case when p_outcome='delivered' then null
        else nullif(btrim(p_neutral_error_code),'') end,
      dispatched_at=case when p_outcome='delivered'
        then transaction_timestamp() else dispatched_at end
  where id=p_outbox_id;

  if p_notification_id is not null then
    update public.notifications
    set attempts=attempts+1,
        provider=nullif(btrim(p_provider),''),
        delivery_state=case p_outcome
          when 'delivered' then 'delivered'
          when 'transient_failure' then 'retrying'
          when 'permanent_failure' then 'failed'
          when 'not_configured' then 'not_configured'
          else 'suppressed_by_preference'
        end,
        failure_class=case p_outcome
          when 'transient_failure' then 'transient'
          when 'permanent_failure' then 'permanent'
          when 'not_configured' then 'not_configured'
          when 'suppressed' then 'suppressed'
          else null
        end,
        last_error=case when p_outcome='delivered' then null
          else nullif(btrim(p_neutral_error_code),'') end,
        delivered_at=case when p_outcome='delivered'
          then transaction_timestamp() else delivered_at end
    where id=p_notification_id;
  end if;

  return jsonb_build_object(
    'attempt_id',v_attempt.id,'outbox_id',v_attempt.outbox_id,
    'attempt_no',v_attempt.attempt_no,'outcome',v_attempt.outcome,
    'delivery_proven',v_attempt.outcome='delivered','idempotent',false
  );
end
$$;

revoke all on function public.guard_notification_delivery_attempt_immutable()
  from public,anon,authenticated,service_role;
revoke all on function public.record_notification_delivery_attempt(
  uuid,uuid,text,text,text,text,text,text
) from public,anon,authenticated;
grant execute on function public.record_notification_delivery_attempt(
  uuid,uuid,text,text,text,text,text,text
) to service_role;

comment on table public.notification_delivery_attempts is
  'REQ-017 append-only provider-attempt receipts. Outbox intent alone never proves delivery.';
