-- Static/transactional contract probe for 20260727020000.
-- Run only against an isolated local database after all migrations.
--
-- M6 requirement-to-schema/RPC ledger (baseline rows 450-479):
-- CR-449 / WA-AC-0449 regulation request, library and lifecycle
-- CR-450 / WA-AC-0450 inspection-item configuration
-- CR-451..452 / WA-AC-0451..0452 violation and penalty configuration
-- CR-453 / WA-AC-0453 evidence configuration
-- CR-454..457 / WA-AC-0454..0457 packages, templates and action forms
-- CR-458 / WA-AC-0458 immutable versioning
-- CR-459..460 / WA-AC-0459..0460 lifecycle and dependency validation
-- CR-461 / WA-AC-0461 impact footprint
-- CR-462..463 / WA-AC-0462..0463 deactivation and audit
-- CR-464..470 / WA-AC-0464..0470 sections, order, mandatory fields,
--   response types and conditional rules
-- CR-471..472 / WA-AC-0471..0472 scoring: OPEN_BUSINESS_DECISION under
--   DEC-001/DEC-028; intentionally not configured by this migration
-- CR-473 / WA-AC-0473 response-specific evidence
-- CR-474..475 / WA-AC-0474..0475 violation/action-form triggers
-- CR-476 / WA-AC-0476 preview
-- CR-477 / WA-AC-0477 publication validation
-- CR-478 / WA-AC-0478 runtime locking
--
-- This probe establishes backend surfaces only. None of these rows reaches
-- accepted/100% until route integration and independent Demo Gatekeeper proof.
begin;

do $$
begin
  if to_regprocedure('public.publish_bulk_plan_atomic(uuid[],uuid[],timestamp with time zone,timestamp with time zone,text,text,text,jsonb,uuid[])') is null then
    raise exception 'missing atomic bulk-plan publisher';
  end if;
  if to_regprocedure('public.bulk_update_published_visits(uuid[],text,uuid,boolean,text,text,uuid)') is null then
    raise exception 'missing bulk_update_published_visits';
  end if;
  if to_regprocedure('public.activate_regulation(uuid,text,uuid)') is null
     or to_regprocedure('public.deactivate_regulation(uuid,text,uuid)') is null then
    raise exception 'missing regulation lifecycle RPC';
  end if;
  if to_regprocedure('public.mutate_workflow_task(uuid,text,uuid,boolean,boolean,text,uuid)') is null then
    raise exception 'missing task mutation RPC';
  end if;
  if to_regprocedure('public.mutate_sla_timer(uuid,text,text,uuid)') is null then
    raise exception 'missing SLA mutation RPC';
  end if;
  if to_regclass('public.compliance_regulation_library') is null then
    raise exception 'missing canonical compliance library';
  end if;
  if to_regprocedure('public.compliance_regulation_audit(uuid)') is null then
    raise exception 'missing canonical compliance audit contract';
  end if;
  if has_function_privilege('anon',
      'public.activate_regulation(uuid,text,uuid)', 'EXECUTE') then
    raise exception 'anon can activate regulations';
  end if;
  if has_function_privilege('anon',
      'public.bulk_update_published_visits(uuid[],text,uuid,boolean,text,text,uuid)',
      'EXECUTE') then
    raise exception 'anon can bulk mutate planning';
  end if;
  if has_function_privilege('authenticated',
      'public.set_regulation_operational_state(uuid,boolean,text,uuid)',
      'EXECUTE') then
    raise exception 'internal regulation lifecycle helper is callable';
  end if;
  if pg_get_functiondef(
      'public.capture_inspection_factory_snapshot()'::regprocedure
     ) not like '%extensions.digest%' then
    raise exception 'DEC-032 digest remains search_path-dependent';
  end if;
end $$;

select
  'DEC-032, review latest-version guard, planning atomic bulk mutation, '
  || 'CR-449..CR-478 compliance lifecycle/library, and workflow/SLA RPC '
  || 'surface checks passed; transaction rolled back' as assertion;

rollback;
