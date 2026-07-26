-- SAQEEL-BOARD-DELIVERY-001 · audit-backbone · LEASE-DC3-AUDIT-001
-- D1: make the existing SyncConflictResolved catalogue event recordable for
--     the keep-server path, which intentionally performs no domain-row write.
-- D2: extend the bounded auth-event vocabulary for WebAuthn lifecycle events
--     and attach the canonical row-change audit function to MVP3 tables.
-- C7: add the nullable, non-fabricated device display name required by design.

-- C7 -------------------------------------------------------------------------
-- Column privileges remain those of public.mvp3_devices. Existing SELECT and
-- INSERT policies continue to scope the row; no UPDATE policy or wider grant
-- is introduced.
alter table public.mvp3_devices
  add column if not exists display_name text;

comment on column public.mvp3_devices.display_name is
  'Optional human-readable device name. Null means no name is known.';

-- D1 -------------------------------------------------------------------------
insert into public.audit_event_source_contracts (
  event_type,
  schema_version,
  source_object_type,
  source_action
) values (
  'SyncConflictResolved',
  1,
  'checklist_responses',
  'SyncConflictResolved'
)
on conflict (event_type, schema_version, source_object_type, source_action) do nothing;

-- The caller supplies the two values that were displayed in the conflict UI.
-- The server value is checked against the current canonical response before
-- the append, so the RPC cannot certify a stale/fabricated keep-server choice.
-- The conflict is scoped to the authenticated assigned inspector.
create or replace function public.record_sync_conflict_resolution(
  p_inspection_id uuid,
  p_item_id uuid,
  p_local_value jsonb,
  p_server_value jsonb,
  p_detected_at timestamptz
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_response public.checklist_responses%rowtype;
  v_visit_id uuid;
  v_source_audit_id bigint;
  v_semantic_id uuid;
  v_roles text[];
  v_region text;
  v_org_scope text;
  v_occurred_at timestamptz := now();
  v_payload jsonb;
  v_idempotency_key text;
begin
  if auth.uid() is null or not has_role('inspector') then
    raise exception 'inspector authentication required' using errcode = '42501';
  end if;
  if p_detected_at is null then
    raise exception 'conflict detection time is required' using errcode = '22023';
  end if;

  select cr, i.visit_id
    into v_response, v_visit_id
    from public.checklist_responses cr
    join public.inspections i on i.id = cr.inspection_id
   where cr.inspection_id = p_inspection_id
     and cr.item_id = p_item_id;

  if not found then
    raise exception 'canonical server response not found' using errcode = '22023';
  end if;
  if not is_assigned_inspector(v_visit_id) then
    raise exception 'not assigned to inspection visit' using errcode = '42501';
  end if;
  if v_response.response is distinct from p_server_value then
    raise exception 'server response changed; refresh conflict before resolving'
      using errcode = '40001';
  end if;

  v_payload := jsonb_build_object(
    'local_value', p_local_value,
    'server_value', p_server_value,
    'resolution_rule', 'keep_server_value'
  );
  v_idempotency_key := format(
    'sync-conflict:%s:%s:%s',
    p_inspection_id,
    p_item_id,
    p_detected_at
  );

  insert into public.audit_events (
    actor,
    object_type,
    object_id,
    action,
    after_state,
    requirement_refs
  ) values (
    auth.uid(),
    'checklist_responses',
    v_response.id,
    'SyncConflictResolved',
    v_payload || jsonb_build_object(
      'inspection_id', p_inspection_id,
      'item_id', p_item_id,
      'detected_at', p_detected_at
    ),
    array['MVP2-REQ-0166']
  )
  returning id into v_source_audit_id;

  select coalesce(array_agg(role_key order by role_key), '{}')
    into v_roles
    from public.user_roles
   where user_id = auth.uid();
  select region, org_scope
    into v_region, v_org_scope
    from public.profiles
   where user_id = auth.uid();

  insert into public.audit_semantic_events (
    event_type,
    schema_version,
    occurred_at,
    actor_id,
    actor_roles,
    actor_scope,
    aggregate_type,
    aggregate_id,
    aggregate_ref,
    case_type,
    case_ref,
    correlation_id,
    source_system,
    source_action,
    idempotency_key,
    after_state,
    semantic_payload,
    field_provenance,
    source_audit_event_id,
    integrity_status,
    chain_status
  ) values (
    'SyncConflictResolved',
    1,
    v_occurred_at,
    auth.uid(),
    v_roles,
    jsonb_build_object('roles', v_roles, 'region', v_region, 'org_scope', v_org_scope),
    'checklist_responses',
    v_response.id,
    v_response.id::text,
    'inspection.standard',
    v_visit_id::text,
    v_visit_id,
    'audit_events',
    'SyncConflictResolved',
    v_idempotency_key,
    v_payload,
    v_payload,
    jsonb_build_object('source', 'audit_events', 'audit_event_id', v_source_audit_id),
    v_source_audit_id,
    'not_assessed',
    'incomplete'
  )
  on conflict (source_system, idempotency_key) do nothing
  returning id into v_semantic_id;

  if v_semantic_id is null then
    select id
      into v_semantic_id
      from public.audit_semantic_events
     where source_system = 'audit_events'
       and idempotency_key = v_idempotency_key
       and event_type = 'SyncConflictResolved'
       and actor_id = auth.uid()
       and aggregate_id = v_response.id
       and semantic_payload = v_payload;
    if v_semantic_id is null then
      raise exception 'conflict resolution idempotency key reused with different facts'
        using errcode = '23505';
    end if;
  end if;

  insert into public.audit_event_semantic_mappings (
    audit_event_id,
    semantic_event_id,
    mapping_status,
    mapping_reason
  ) values (
    v_source_audit_id,
    v_semantic_id,
    'mapped',
    'Validated keep-server conflict resolution'
  )
  on conflict (audit_event_id, semantic_event_id, mapping_status) do nothing;

  return v_semantic_id;
end
$$;

revoke all on function public.record_sync_conflict_resolution(uuid,uuid,jsonb,jsonb,timestamptz)
  from public, anon;
grant execute on function public.record_sync_conflict_resolution(uuid,uuid,jsonb,jsonb,timestamptz)
  to authenticated;

comment on function public.record_sync_conflict_resolution(uuid,uuid,jsonb,jsonb,timestamptz) is
  'MVP2-REQ/AC-0166: records the canonical SyncConflictResolved event for an assigned inspector choosing keep_server_value.';

-- D2 -------------------------------------------------------------------------
-- Preserve the original password-reset contract while adding only the two
-- Product-Owner-approved WebAuthn lifecycle values. All WebAuthn events require
-- an authenticated actor; the credential subject remains a one-way SHA-256
-- digest and raw credential/email identifiers are rejected.
create or replace function public.log_auth_event(p_email_hash text, p_action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_action not in (
    'password_reset_requested',
    'password_reset_completed',
    'webauthn.enrolled',
    'webauthn.revoked'
  ) then
    raise exception 'unsupported auth audit action: %', p_action using errcode = '22023';
  end if;

  if p_email_hash is null or p_email_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'email_hash must be a 64-char sha256 hex digest' using errcode = '22023';
  end if;

  if p_action in (
    'password_reset_completed',
    'webauthn.enrolled',
    'webauthn.revoked'
  ) and auth.uid() is null then
    raise exception '% requires an authenticated session', p_action using errcode = '42501';
  end if;

  insert into public.audit_events (
    actor,
    object_type,
    object_id,
    action,
    after_state,
    requirement_refs
  ) values (
    auth.uid(),
    'auth_credential',
    null,
    p_action,
    jsonb_build_object('email_hash', p_email_hash),
    case
      when p_action like 'webauthn.%' then array['MVP2-REQ-0256']
      else array['SCR-PUB-010']
    end
  );
end
$$;

revoke all on function public.log_auth_event(text,text) from public;
grant execute on function public.log_auth_event(text,text) to anon, authenticated;

comment on function public.log_auth_event(text,text) is
  'Appends bounded password-reset or WebAuthn lifecycle audit events. WebAuthn and reset completion require authentication; subject identifiers are SHA-256 hashed.';

-- Every MVP3 table has a UUID `id` and is therefore compatible with the
-- canonical public.audit_row_change() trigger. The catalogue-compatible
-- conflict check makes a repeated migration safe while refusing to replace a
-- noncanonical trigger silently.
do $$
declare
  t text;
  trigger_name text;
begin
  foreach t in array array[
    'mvp3_integration_endpoints',
    'mvp3_api_events',
    'mvp3_export_jobs',
    'mvp3_error_queue',
    'mvp3_feature_flags',
    'mvp3_access_reviews',
    'mvp3_evidence_access_grants',
    'mvp3_devices',
    'mvp3_device_commands',
    'mvp3_inspection_package_manifests',
    'mvp3_package_access_events',
    'mvp3_signature_refusals',
    'mvp3_kpi_definitions'
  ] loop
    trigger_name := 'trg_audit_' || t;
    if exists (
      select 1
        from pg_trigger
       where tgrelid = format('public.%I', t)::regclass
         and tgname = trigger_name
         and not tgisinternal
    ) then
      if not exists (
        select 1
          from pg_trigger
         where tgrelid = format('public.%I', t)::regclass
           and tgname = trigger_name
           and not tgisinternal
           and tgfoid = 'public.audit_row_change()'::regprocedure
           and tgtype = 29
      ) then
        raise exception 'MVP3_AUDIT_TRIGGER_CONFLICT: %.% is not canonical',
          t,
          trigger_name;
      end if;
    else
      execute format(
        'create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_row_change()',
        trigger_name,
        t
      );
    end if;
  end loop;
end
$$;
