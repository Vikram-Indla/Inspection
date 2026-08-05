-- INSP-773 — violations recordable against a facility not in production.
-- Rollback probe. Isolated database only.
begin;

-- Function/trigger shape contract: the stable token and the trigger wiring
-- must survive future edits without silently disappearing.
do $$
declare d text;
begin
  if to_regprocedure('public.guard_violation_production_status_gate()') is null then
    raise exception 'INSP-773 guard function missing';
  end if;
  d := pg_get_functiondef('public.guard_violation_production_status_gate()'::regprocedure);
  if d not like '%EXE-VIOLATION-NOT-PRODUCTION%'
    or d not like '%factory_status%'
    or d not like '%SET search_path TO ''''%' then
    raise exception 'INSP-773 guard function contract incomplete';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_guard_violation_production_status'
      and tgrelid = 'public.violations'::regclass
      and not tgisinternal
  ) then
    raise exception 'INSP-773 trigger not wired to violations';
  end if;
end $$;

-- Functional probe: a throwaway violation_code + a throwaway inspection row
-- that reuses an EXISTING visit_id/package_version_id purely as an FK
-- reference (neither existing row is modified) — everything created here is
-- rolled back at the end of this transaction, nothing touches real data.
do $$
declare
  v_visit uuid;
  v_pkgver uuid;
  v_inspection uuid := '60000000-0000-0000-0000-000000000002';
  v_code uuid := '60000000-0000-0000-0000-000000000003';
begin
  -- inspections.visit_id is unique — must pick a visit with no inspection yet.
  select v.id into v_visit from public.visits v
    left join public.inspections i on i.visit_id = v.id
    where i.id is null limit 1;
  select id into v_pkgver from public.package_versions limit 1;
  if v_visit is null or v_pkgver is null then
    raise exception 'no free visit / package_versions row available to reference — probe cannot run in this environment';
  end if;
  insert into public.inspections (id, visit_id, package_version_id, status, context)
    values (v_inspection, v_visit, v_pkgver, 'in_progress', '{"factory_status":"closed"}'::jsonb)
    on conflict (id) do update set context = excluded.context;
  insert into public.violation_codes (id, code, title, level, active_from, status, configuration_version, category, applicability)
    values (v_code, 'TEST-INSP773', 'test code', 'minor', now(), 'published', 1, 'test', 'test')
    on conflict (id) do nothing;

  -- Direction 1: facility status = closed → the insert must be refused, with
  -- the stable, explicit token (never a silent no-op).
  begin
    insert into public.violations (inspection_id, violation_code_id, mapping_version)
    values (v_inspection, v_code, 1);
    raise exception 'expected EXE-VIOLATION-NOT-PRODUCTION but the insert succeeded';
  exception when others then
    if sqlerrm not like 'EXE-VIOLATION-NOT-PRODUCTION%' then raise; end if;
  end;

  -- Direction 2: facility status = production → the gate itself must not
  -- block the insert (any later failure, e.g. no penalty mapping for a
  -- throwaway code, is a different, expected concern — not this gate's).
  update public.inspections set context = jsonb_set(context, '{factory_status}', '"production"') where id = v_inspection;
  begin
    insert into public.violations (inspection_id, violation_code_id, mapping_version)
    values (v_inspection, v_code, 1);
  exception when others then
    if sqlerrm like 'EXE-VIOLATION-NOT-PRODUCTION%' then
      raise exception 'INSP-773 gate wrongly blocked a Production-status facility';
    end if;
    -- any other error here is a pre-existing, unrelated contract (e.g. no
    -- governed penalty mapping for this throwaway code) — not this gate.
  end;

  -- Direction 3 (documented scope decision): no answer captured yet
  -- (factory_status absent) must NOT be blocked — this gate does not
  -- retroactively refuse every inspection that predates the field.
  update public.inspections set context = context - 'factory_status' where id = v_inspection;
  begin
    insert into public.violations (inspection_id, violation_code_id, mapping_version)
    values (v_inspection, v_code, 1);
  exception when others then
    if sqlerrm like 'EXE-VIOLATION-NOT-PRODUCTION%' then
      raise exception 'INSP-773 gate wrongly blocked a facility with no captured status yet';
    end if;
  end;
end $$;

select 'INSP-773 violation production-status gate: refuses non-Production, admits Production and not-yet-answered; rollback follows' assertion;
rollback;
