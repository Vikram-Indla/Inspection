-- RECONSTRUCTION NOTICE — this file's core function body IS verbatim: it was
-- recovered via pg_get_functiondef() against the live function
-- public.add_compliance_enforcement_component on project iiozvqntawxfwbgffzqu
-- (2026-08-02). schema_migrations.statements for version 20260719224000 was
-- an empty array (no statement text captured — applied via the Supabase
-- Management API), so this file was rebuilt from schema introspection rather
-- than the original migration transcript. Surrounding GRANT/REVOKE statements
-- are reconstructed to match this repo's established convention (see e.g.
-- 20260726103328_reopening_notice_line_type_guard_revoke_execute.sql) and
-- reflect the grants actually observed live (authenticated, postgres,
-- service_role all hold EXECUTE). Added 2026-08-02 during migration
-- reconciliation.

-- ============================================================================
-- Compliance Enforcement Component — Atomic
-- Wraps add_compliance_request_component (and, for parent/child links,
-- add_compliance_request_dependency) in a single call so a caller adding a
-- violation or penalty component to a draft compliance configuration request
-- cannot leave the request in a state with a component but no assigned code
-- or a dangling dependency. Violation components get an auto-generated code
-- of the form V-<REQUEST_NUMBER>-<sequence>; penalty components pass through
-- unmodified.
-- ============================================================================

create or replace function public.add_compliance_enforcement_component(
  p_request uuid,
  p_entity_kind text,
  p_target_entity_id uuid,
  p_current_snapshot jsonb,
  p_proposed_snapshot jsonb,
  p_comments text default null,
  p_parent_component_id uuid default null
)
returns uuid
language plpgsql
set search_path to ''
as $function$
declare
  v_request public.compliance_configuration_requests%rowtype;
  v_component uuid;
  v_sequence integer;
  v_request_key text;
  v_snapshot jsonb := p_proposed_snapshot;
begin
  if p_entity_kind not in ('violation', 'penalty') then
    raise exception 'CCR_ENFORCEMENT_COMPONENT_KIND_INVALID';
  end if;

  select * into v_request
  from public.compliance_configuration_requests
  where id = p_request
  for update;

  if not found then raise exception 'CCR_NOT_FOUND'; end if;

  if p_entity_kind = 'violation' then
    select count(*) + 1 into v_sequence
    from public.compliance_request_components
    where request_id = p_request
      and revision_number = v_request.current_revision
      and entity_kind = 'violation';

    v_request_key := trim(both '-' from regexp_replace(upper(v_request.request_number), '[^A-Z0-9]+', '-', 'g'));
    v_snapshot := jsonb_set(
      v_snapshot,
      '{code}',
      to_jsonb('V-' || v_request_key || '-' || lpad(v_sequence::text, 2, '0')),
      true
    );
  end if;

  v_component := public.add_compliance_request_component(
    p_request,
    p_entity_kind,
    p_target_entity_id,
    p_current_snapshot,
    v_snapshot,
    p_comments
  );

  if p_parent_component_id is not null then
    perform public.add_compliance_request_dependency(
      p_request,
      p_parent_component_id,
      v_component
    );
  end if;

  return v_component;
end
$function$;

revoke all on function public.add_compliance_enforcement_component(uuid, text, uuid, jsonb, jsonb, text, uuid) from public;
grant execute on function public.add_compliance_enforcement_component(uuid, text, uuid, jsonb, jsonb, text, uuid) to authenticated;
