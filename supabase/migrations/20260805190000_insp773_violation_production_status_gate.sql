-- INSP-773 — violations recordable against a facility not in production.
--
-- Confirmed governed rule, INS-BR-045 (BC021) in the re-extracted Inspection
-- Service requirement index (product-contract/requirements-control/
-- brd-notion-index/INS.md): for facility status in Creation, Establishment,
-- Transfer, Repair, Closed or Suspended, data-mismatch violations (from
-- Labor/Raw Materials/Products/Machines/Spare Parts section discrepancies)
-- must NOT be recorded. Only when facility status = Production are such
-- mismatches real, recordable violations. The rule exists on paper and was
-- not in the product (DEFECT-REGISTER-20260805.md, OPEN — BEING WORKED).
--
-- The facility status this rule keys on is the inspector's own on-site
-- answer ("Factory Status According to On-Site Visit"), not a static
-- establishment-record field — the BRD scopes it explicitly per visit.
-- Rather than a new schema column, this reuses the existing generic
-- inspections.context jsonb bag (already read/write plumbed client-side via
-- pushCtx/saveCtx, offline-durable) with key "factory_status" — no
-- migration to the inspections table itself is needed.
--
-- Scope note, stated plainly: a facility status with no answer yet
-- (context->>'factory_status' is null) is ALLOWED through — this gate does
-- not retroactively block every existing inspection that predates this
-- migration and has never captured the field. Enforcement strengthens as
-- the field gets answered going forward, per the client-side change in the
-- same commit that makes it a real, presented question. Making the field
-- itself submission-mandatory is a separate, larger change not attempted
-- here (out of INSP-773's scope: recordability of violations, not
-- submission completeness).
--
-- INS-BR-047 (BC023, the two system-auto-generated violation types —
-- expired license; status/license-phase mismatch) is a distinct rule NOT
-- subject to this gate and is unaffected — it has no implementation in this
-- codebase yet (confirmed: no violation_codes seed rows, no trigger, no RPC
-- for it), so there is nothing here that could accidentally catch it.

create or replace function public.guard_violation_production_status_gate()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_factory_status text;
begin
  select i.context ->> 'factory_status' into v_factory_status
  from public.inspections i
  where i.id = new.inspection_id;

  if v_factory_status is not null and lower(v_factory_status) <> 'production' then
    raise exception 'EXE-VIOLATION-NOT-PRODUCTION: violations may not be recorded while the facility status is % (inspection %) — a violation is only recordable when the on-site facility status is Production (INS-BR-045)',
      v_factory_status, new.inspection_id
      using errcode = 'P0001';
  end if;

  return new;
end $$;

revoke all on function public.guard_violation_production_status_gate() from public, anon;

drop trigger if exists trg_guard_violation_production_status on public.violations;
create trigger trg_guard_violation_production_status
  before insert on public.violations
  for each row execute function public.guard_violation_production_status_gate();
