-- ============================================================================
-- DEC-L — Bulk violation issuance, option 1 (reframed as bulk administrative
-- inspection creation; see 20260719020000 for why). Sponsor authorization:
-- SPONSOR_DECISIONS_AND_IMPLEMENTATION_AUTHORIZATION.md DEC-L — "role guard;
-- establishment selection; violation selection; preview; explicit
-- acknowledgement; deterministic impact summary; confirmation; idempotent
-- server transaction; per-target success/failure result; immutable audit
-- event; no silent partial success; retry/recovery."
--
-- Every issued violation is a REAL row in the REAL `violations` table,
-- attached to a REAL `inspections` row, exactly like every other violation in
-- the system — never a parallel/shadow record. The only new thing is that the
-- triggering "inspection" is an administrative desk record (execution_mode =
-- 'administrative', visit_type = 'administrative_enforcement') instead of a
-- field/virtual encounter, so it is honestly distinguishable from real visits
-- everywhere downstream (dashboards, KPIs, Factory 360) without those places
-- needing to change: they already treat unrecognized enum/type values as data,
-- not as a code path to special-case.
--
-- Modeled on create_immediate_visit's proven idempotency shape (request_id
-- unique + pg_advisory_xact_lock) — no new concurrency primitive invented.
-- audit_row_change is already attached to visits/inspections/violations
-- (0002_rbac_audit.sql) — those three tables are audited automatically by
-- writing through them; only the two new tables below need their own trigger.
-- ============================================================================

create table bulk_violation_batches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,                          -- client idempotency key, same role as creation_request_id
  violation_code_id uuid not null references violation_codes(id),
  notes text check (length(notes) <= 2000),
  issued_by uuid not null references profiles(user_id),
  issued_at timestamptz not null default now(),
  target_count int not null
);
comment on table bulk_violation_batches is
  'DEC-L: one row per bulk-issuance request. issue_bulk_violation() is the only
   writer; replaying the same request_id returns the original result instead of
   re-issuing (mirrors create_immediate_visit, 0027).';

create table bulk_violation_batch_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references bulk_violation_batches(id),
  factory_id uuid not null references factories(id),
  status text not null check (status in ('success','failed')),
  violation_id uuid references violations(id),              -- set on success
  inspection_id uuid references inspections(id),             -- the administrative inspection created
  error_code text,                                           -- sqlstate on failure — no silent partial success
  unique (batch_id, factory_id)
);
comment on table bulk_violation_batch_items is
  'Per-target outcome — required so a batch can never present as all-succeeded
   when some targets failed (DEC-L: "no silent partial success").';

alter table bulk_violation_batches enable row level security;
alter table bulk_violation_batch_items enable row level security;

-- Read/insert restricted to the same role pair as the enforcement-recommendation
-- decider (compliance_admin/ops) — the RPC below re-checks this internally too
-- (defense in depth, same pattern as create_immediate_visit's has_role check).
create policy bulk_violation_batches_rw on bulk_violation_batches for all
  using (has_any_role(array['ops','compliance_admin']))
  with check (has_any_role(array['ops','compliance_admin']));
create policy bulk_violation_batch_items_rw on bulk_violation_batch_items for all
  using (has_any_role(array['ops','compliance_admin']))
  with check (has_any_role(array['ops','compliance_admin']));

create trigger trg_audit_bulk_violation_batches
  after insert or update or delete on bulk_violation_batches
  for each row execute function audit_row_change();
create trigger trg_audit_bulk_violation_batch_items
  after insert or update or delete on bulk_violation_batch_items
  for each row execute function audit_row_change();

create index idx_bulk_violation_batch_items_batch on bulk_violation_batch_items(batch_id);

-- ----------------------------------------------------------------------------
create or replace function issue_bulk_violation(
  p_request_id uuid,
  p_factory_ids uuid[],
  p_violation_code text,
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_vio_code_id uuid;
  v_mapping_version text;
  v_batch_id uuid;
  v_factory_id uuid;
  v_visit_id uuid;
  v_inspection_id uuid;
  v_violation_id uuid;
  v_results jsonb;
  v_success_count int := 0;
  v_default_package uuid;
begin
  if v_actor is null or not has_any_role(array['ops','compliance_admin']) then
    raise exception 'Not authorized for bulk violation issuance (DEC-L)';
  end if;
  if p_factory_ids is null or array_length(p_factory_ids, 1) is null or array_length(p_factory_ids, 1) = 0 then
    raise exception 'At least one establishment is required';
  end if;

  -- Idempotent replay (mirrors create_immediate_visit, 0027): return the
  -- original per-target results instead of re-issuing.
  select id into v_batch_id from bulk_violation_batches where request_id = p_request_id;
  if v_batch_id is not null then
    select jsonb_agg(jsonb_build_object('factory_id', factory_id, 'status', status, 'violation_id', violation_id, 'inspection_id', inspection_id, 'error_code', error_code))
      into v_results from bulk_violation_batch_items where batch_id = v_batch_id;
    return jsonb_build_object('status', 'ok', 'batch_id', v_batch_id, 'replayed', true, 'results', coalesce(v_results, '[]'::jsonb));
  end if;

  perform pg_advisory_xact_lock(hashtext(p_request_id::text));

  -- Re-check after acquiring the lock (a concurrent request may have just committed).
  select id into v_batch_id from bulk_violation_batches where request_id = p_request_id;
  if v_batch_id is not null then
    select jsonb_agg(jsonb_build_object('factory_id', factory_id, 'status', status, 'violation_id', violation_id, 'inspection_id', inspection_id, 'error_code', error_code))
      into v_results from bulk_violation_batch_items where batch_id = v_batch_id;
    return jsonb_build_object('status', 'ok', 'batch_id', v_batch_id, 'replayed', true, 'results', coalesce(v_results, '[]'::jsonb));
  end if;

  select id into v_vio_code_id from violation_codes where code = p_violation_code;
  if v_vio_code_id is null then
    raise exception 'Unknown violation code % — must exist in the governed catalogue (never invented)', p_violation_code;
  end if;

  -- penalty_mapping_one_active (20260715200000) guarantees at most one
  -- published/locked row per violation_code_id, so this is never ambiguous.
  select mapping_version into v_mapping_version from penalty_mappings
    where violation_code_id = v_vio_code_id and status in ('published', 'locked');
  if v_mapping_version is null then
    raise exception 'Violation % has no accepted (published/locked) penalty mapping (M09-004) — cannot issue without one', p_violation_code;
  end if;

  select id into v_default_package from package_versions
    where status in ('published', 'locked')
    order by published_at desc nulls last limit 1;
  if v_default_package is null then
    raise exception 'No published package available to attach the administrative record to';
  end if;

  insert into bulk_violation_batches (request_id, violation_code_id, notes, issued_by, target_count)
  values (p_request_id, v_vio_code_id, nullif(trim(coalesce(p_notes, '')), ''), v_actor, array_length(p_factory_ids, 1))
  returning id into v_batch_id;

  foreach v_factory_id in array p_factory_ids loop
    begin
      insert into visits (factory_id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, package_version_id, notes)
      values (v_factory_id, 'administrative_enforcement', 'administrative', 'published', 'submitted', now(), now() + interval '1 minute', v_default_package,
              'DEC-L bulk violation issuance — batch ' || v_batch_id)
      returning id into v_visit_id;

      insert into inspections (visit_id, status, package_version_id, started_at, submitted_at)
      values (v_visit_id, 'submitted', v_default_package, now(), now())
      returning id into v_inspection_id;

      insert into violations (inspection_id, violation_code_id, mapping_version)
      values (v_inspection_id, v_vio_code_id, v_mapping_version)
      returning id into v_violation_id;

      insert into bulk_violation_batch_items (batch_id, factory_id, status, violation_id, inspection_id)
      values (v_batch_id, v_factory_id, 'success', v_violation_id, v_inspection_id);
      v_success_count := v_success_count + 1;
    exception when others then
      insert into bulk_violation_batch_items (batch_id, factory_id, status, error_code)
      values (v_batch_id, v_factory_id, 'failed', sqlstate);
    end;
  end loop;

  select jsonb_agg(jsonb_build_object('factory_id', factory_id, 'status', status, 'violation_id', violation_id, 'inspection_id', inspection_id, 'error_code', error_code))
    into v_results from bulk_violation_batch_items where batch_id = v_batch_id;

  return jsonb_build_object(
    'status', 'ok', 'batch_id', v_batch_id, 'replayed', false,
    'success_count', v_success_count, 'total', array_length(p_factory_ids, 1),
    'results', coalesce(v_results, '[]'::jsonb)
  );
end $$;
revoke all on function issue_bulk_violation(uuid, uuid[], text, text) from public;
grant execute on function issue_bulk_violation(uuid, uuid[], text, text) to authenticated;

-- Cosmetic only: visits/page.tsx and similar already fall back to the raw
-- enum value if this key is absent (t(`enum.${mode}`, mode)) — this just
-- makes that fallback read as a real label instead of the raw string.
insert into ui_strings (key, en, ar, status, context) values
  ('enum.administrative', 'Administrative', 'إداري', 'draft', 'DEC-L bulk violation issuance — execution_mode label'),
  ('enum.administrative_enforcement', 'Administrative enforcement action', 'إجراء إنفاذ إداري', 'draft', 'DEC-L bulk violation issuance — visit_type label')
on conflict (key) do update
  set ar = excluded.ar, en = excluded.en, context = excluded.context
  where ui_strings.status = 'draft';

