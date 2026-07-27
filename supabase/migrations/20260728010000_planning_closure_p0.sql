-- CORR-PLANNING-MIGRATION-FENCE-001
-- CORR-PLANNING-R01-R03-002 · ADD-R07-001
-- Planning closure P0: one additive, transactional migration.
--
-- R05 (unregistered-factory activation), R06 (Supervisor capability) and
-- legacy-RPC retirement are deliberately absent.  A workflow_outbox row is a
-- durable notification intent; it is not proof that a provider delivered it.

-- ---------------------------------------------------------------------------
-- S0. Fail-fast prerequisites.
-- ---------------------------------------------------------------------------
do $$
begin
  if current_setting('server_version_num')::integer < 170000 then
    raise exception using errcode = '55000',
      message = 'PLANNING-CLOSURE-POSTGRES-17-REQUIRED';
  end if;
  if to_regclass('public.visits') is null
     or to_regclass('public.visit_plans') is null
     or to_regclass('public.assignments') is null
     or to_regclass('public.inspections') is null
     or to_regclass('public.visit_lifecycle_events') is null
     or to_regclass('public.audit_events') is null
     or to_regclass('public.workflow_outbox') is null then
    raise exception using errcode = '55000',
      message = 'PLANNING-CLOSURE-PREREQUISITE-MISSING';
  end if;
  if not exists (
    select 1 from pg_catalog.pg_extension where extname = 'pg_cron'
  ) then
    raise exception using errcode = '55000',
      message = 'PLANNING-CLOSURE-PG-CRON-REQUIRED';
  end if;
end
$$;

do $$
begin
  if not exists(select 1 from pg_catalog.pg_roles where rolname='planning_expiry_owner') then
    create role planning_expiry_owner nologin noinherit;
  end if;
  if not exists(select 1 from pg_catalog.pg_roles where rolname='planning_expiry_scheduler') then
    create role planning_expiry_scheduler nologin noinherit;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- S1. Additive receipt, frozen-target and archival-provenance schema.
-- ---------------------------------------------------------------------------
alter table public.visits
  add column if not exists planning_version bigint not null default 1;

alter table public.visit_plans
  add column if not exists archive_actor uuid references public.profiles(user_id),
  add column if not exists archive_correlation_id uuid,
  add column if not exists archive_prior_status public.planning_status,
  add column if not exists archive_prior_version integer,
  add column if not exists archive_note text;

create table public.planning_process_commands (
  id uuid primary key default gen_random_uuid(),
  actor uuid references public.profiles(user_id),
  scheduler_principal text,
  operation text not null check (
    operation in (
      'cancel','reschedule','archive_draft','expire','bulk',
      'return','republish','repackage','metadata',
      'duplicate_draft','draft_save'
    )
  ),
  idempotency_key text not null,
  correlation_id uuid not null,
  request jsonb not null,
  request_hash text not null,
  status text not null default 'pending'
    check (status in ('pending','running','completed','partial_failed','failed')),
  target_count integer not null check (target_count >= 0),
  applied_count integer not null default 0 check (applied_count >= 0),
  blocked_count integer not null default 0 check (blocked_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  result jsonb,
  server_transaction_time timestamptz not null default transaction_timestamp(),
  completed_at timestamptz,
  check ((actor is null) <> (scheduler_principal is null))
);

create unique index planning_process_commands_actor_idempotency_uq
  on public.planning_process_commands (
    coalesce(actor::text, 'system:' || scheduler_principal),
    operation,
    idempotency_key
  );

create table public.planning_process_targets (
  command_id uuid not null references public.planning_process_commands(id),
  ordinal integer not null check (ordinal > 0),
  visit_id uuid references public.visits(id),
  plan_id uuid references public.visit_plans(id),
  expected_version bigint,
  expected_fingerprint text not null,
  request_fragment jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending','running','applied','blocked','failed')),
  primary key (command_id, ordinal),
  unique (command_id, visit_id),
  check ((visit_id is null) <> (plan_id is null))
);

create table public.planning_process_row_receipts (
  id uuid primary key default gen_random_uuid(),
  command_id uuid not null references public.planning_process_commands(id),
  target_ordinal integer not null,
  visit_id uuid references public.visits(id),
  plan_id uuid references public.visit_plans(id),
  outcome text not null check (outcome in ('applied','blocked','failed')),
  pre_state jsonb not null,
  post_state jsonb not null,
  pre_version bigint,
  post_version bigint,
  prior_window_start timestamptz,
  prior_window_end timestamptz,
  requested_window_start timestamptz,
  requested_window_end timestamptz,
  server_transaction_time timestamptz not null,
  cutoff_seconds integer,
  cutoff_at timestamptz,
  cutoff_allowed boolean,
  audit_event_id bigint references public.audit_events(id),
  outbox_intent_ids uuid[] not null default '{}'::uuid[],
  error_code text,
  receipt_hash text not null,
  created_at timestamptz not null default transaction_timestamp(),
  unique (command_id, target_ordinal),
  foreign key (command_id, target_ordinal)
    references public.planning_process_targets(command_id, ordinal)
);

create table public.planning_visit_archives (
  visit_id uuid primary key references public.visits(id),
  parent_plan_id uuid not null references public.visit_plans(id),
  archived_at timestamptz not null,
  archived_by uuid not null references public.profiles(user_id),
  archive_command_id uuid not null references public.planning_process_commands(id),
  archive_correlation_id uuid not null,
  prior_planning_status public.planning_status not null,
  prior_operational_state public.operational_state not null,
  prior_version bigint not null,
  audit_event_id bigint not null references public.audit_events(id),
  outbox_intent_ids uuid[] not null,
  provenance_hash text not null
);

create index planning_process_targets_pending_idx
  on public.planning_process_targets(command_id, ordinal)
  where status = 'pending';
create index planning_process_row_receipts_visit_idx
  on public.planning_process_row_receipts(visit_id, created_at desc);
create index planning_visit_archives_plan_idx
  on public.planning_visit_archives(parent_plan_id, archived_at desc);

create function public.planning_closure_has_explicit_capability(
  p_capability text
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1 from public.profiles p
      where p.user_id=auth.uid()
        and nullif(btrim(p.region),'') is not null
    )
    and exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp on rp.role_key=ur.role_key
      where ur.user_id=auth.uid()
        and rp.permission_key=p_capability
    )
$$;

create function public.planning_closure_factory_in_scope(p_factory_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.factories f on f.id=p_factory_id
    where p.user_id=auth.uid()
      and nullif(btrim(p.region),'') is not null
      and (p.region='National' or f.region=p.region)
  )
$$;

revoke all on function public.planning_closure_has_explicit_capability(text)
  from public,anon,authenticated,service_role;
revoke all on function public.planning_closure_factory_in_scope(uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.planning_closure_has_explicit_capability(text)
  to authenticated;
grant execute on function public.planning_closure_factory_in_scope(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- S2. RLS and direct-access closure. Mutations are RPC-only.
-- ---------------------------------------------------------------------------
alter table public.planning_process_commands enable row level security;
alter table public.planning_process_commands force row level security;
alter table public.planning_process_targets enable row level security;
alter table public.planning_process_targets force row level security;
alter table public.planning_process_row_receipts enable row level security;
alter table public.planning_process_row_receipts force row level security;
alter table public.planning_visit_archives enable row level security;
alter table public.planning_visit_archives force row level security;

revoke all on public.planning_process_commands from public, anon, authenticated, service_role;
revoke all on public.planning_process_targets from public, anon, authenticated, service_role;
revoke all on public.planning_process_row_receipts from public, anon, authenticated, service_role;
revoke all on public.planning_visit_archives from public, anon, authenticated, service_role;
-- P1-002/P1-004: the inherited capability policies treated every otherwise
-- unassigned authenticated identity as business_staff. Remove those permissive
-- legs and make the two base relations RPC-only for mutation. The canonical
-- publish/immediate entry points below retain their existing guards while
-- executing with their owner privileges; all direct client DML is denied.
drop policy if exists plans_read_capability on public.visit_plans;
drop policy if exists plans_write_capability on public.visit_plans;
drop policy if exists plans_update_capability on public.visit_plans;
drop policy if exists visits_read_capability on public.visits;
drop policy if exists visits_write_capability on public.visits;
drop policy if exists visits_update_capability on public.visits;
drop policy if exists plans_read on public.visit_plans;
drop policy if exists plans_write on public.visit_plans;
drop policy if exists plans_update on public.visit_plans;
drop policy if exists visits_write on public.visits;
drop policy if exists visits_update on public.visits;
drop policy if exists inspector_own_visits on public.visits;

create policy plans_read_explicit_scope
  on public.visit_plans for select to authenticated
  using (
    public.planning_closure_has_explicit_capability('planning.view')
    and (
      (
        created_by=(select auth.uid())
        and not exists (
          select 1 from public.visits v where v.visit_plan_id=visit_plans.id
        )
      )
      or (
        exists (
          select 1 from public.visits v where v.visit_plan_id=visit_plans.id
        )
        and not exists (
          select 1
          from public.visits v
          where v.visit_plan_id=visit_plans.id
            and not public.planning_closure_factory_in_scope(v.factory_id)
        )
      )
    )
  );
create policy visits_read_explicit_scope
  on public.visits for select to authenticated
  using (
    (
      public.planning_closure_has_explicit_capability('planning.view')
      and public.planning_closure_factory_in_scope(factory_id)
    )
    or (
      public.has_role('inspector')
      and public.planning_closure_factory_in_scope(factory_id)
      and exists (
        select 1 from public.assignments a
        where a.visit_id=visits.id
          and a.inspector_id=(select auth.uid())
      )
    )
  );

create policy plans_insert_explicit
  on public.visit_plans for insert to authenticated
  with check (
    created_by=(select auth.uid())
    and public.planning_closure_has_explicit_capability('planning.create')
  );
create policy plans_update_explicit
  on public.visit_plans for update to authenticated
  using (
    public.planning_closure_has_explicit_capability('planning.manage')
    and (
      created_by=(select auth.uid())
      or not exists (
        select 1 from public.visits v
        where v.visit_plan_id=visit_plans.id
          and not public.planning_closure_factory_in_scope(v.factory_id)
      )
    )
  )
  with check (
    public.planning_closure_has_explicit_capability('planning.manage')
  );
create policy visits_insert_explicit
  on public.visits for insert to authenticated
  with check (
    public.planning_closure_has_explicit_capability('planning.create')
    and public.planning_closure_factory_in_scope(factory_id)
  );
create policy visits_update_explicit
  on public.visits for update to authenticated
  using (
    public.planning_closure_has_explicit_capability('planning.manage')
    and public.planning_closure_factory_in_scope(factory_id)
  )
  with check (
    public.planning_closure_has_explicit_capability('planning.manage')
    and public.planning_closure_factory_in_scope(factory_id)
  );

revoke delete,truncate on public.visits,public.visit_plans
  from public,anon,authenticated,service_role;

-- Compatibility ledger (latest canonical callers at the migration base):
-- Planning bulk route -> publish_bulk_plan_atomic -> publish_bulk_plan;
-- single publisher -> publish_single_visit; Field Immediate ->
-- create_immediate_visit. These remain SECURITY INVOKER and therefore still
-- require authenticated INSERT/UPDATE table privileges. Direct no-role DML is
-- nevertheless denied by the explicit policies above. Final privilege
-- revocation is deliberately blocked until governed RPCs and callers exist for
-- return, republish, duplicate-to-draft aggregate, repackage and publish-
-- metadata convergence; notes/type changes may cut over to
-- edit_published_visits_atomic. No fail-open business_staff policy is retained.

create policy planning_process_commands_actor_read
  on public.planning_process_commands for select to authenticated
  using (actor = (select auth.uid()));
create policy planning_process_targets_actor_read
  on public.planning_process_targets for select to authenticated
  using (exists (
    select 1 from public.planning_process_commands c
    where c.id = command_id and c.actor = (select auth.uid())
  ));
create policy planning_process_row_receipts_actor_read
  on public.planning_process_row_receipts for select to authenticated
  using (exists (
    select 1 from public.planning_process_commands c
    where c.id = command_id and c.actor = (select auth.uid())
  ));
create policy planning_visit_archives_authorized_read
  on public.planning_visit_archives for select to authenticated
  using (
    public.planning_closure_has_explicit_capability('planning.manage')
    and public.planning_closure_factory_in_scope(
      (select v.factory_id from public.visits v where v.id=visit_id)
    )
  );

create policy planning_process_commands_expiry_owner
  on public.planning_process_commands for all to planning_expiry_owner
  using (scheduler_principal = 'planning_expiry_scheduler')
  with check (scheduler_principal = 'planning_expiry_scheduler');
create policy planning_visit_archives_expiry_owner_read
  on public.planning_visit_archives for select to planning_expiry_owner
  using (true);
create policy visits_expiry_owner_select
  on public.visits for select to planning_expiry_owner using (true);
create policy visits_expiry_owner_update
  on public.visits for update to planning_expiry_owner
  using (true) with check (true);
create policy assignments_expiry_owner_select
  on public.assignments for select to planning_expiry_owner using (true);
create policy inspections_expiry_owner_select
  on public.inspections for select to planning_expiry_owner using (true);
create policy factories_expiry_owner_select
  on public.factories for select to planning_expiry_owner using (true);
create policy visit_lifecycle_events_expiry_owner_insert
  on public.visit_lifecycle_events for insert to planning_expiry_owner
  with check (actor is null);
create policy audit_events_expiry_owner_insert
  on public.audit_events for insert to planning_expiry_owner
  with check (actor is null and action = 'PLANNING_VISIT_EXPIRE');
create policy workflow_outbox_expiry_owner_insert
  on public.workflow_outbox for insert to planning_expiry_owner
  with check (
    created_by is null
    and side_effect_kind = 'notify'
    and aggregate_type = 'visit'
  );

grant select on public.planning_process_commands to authenticated;
grant select on public.planning_process_targets to authenticated;
grant select on public.planning_process_row_receipts to authenticated;
grant select on public.planning_visit_archives to authenticated;

-- ---------------------------------------------------------------------------
-- S3. Completed evidence and archive provenance are immutable.
-- ---------------------------------------------------------------------------
create function public.guard_planning_closure_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '55000',
      message = 'PLANNING-CLOSURE-IMMUTABLE';
  end if;
  if tg_table_name in ('planning_process_row_receipts','planning_visit_archives') then
    raise exception using errcode = '55000',
      message = 'PLANNING-CLOSURE-IMMUTABLE';
  end if;
  if tg_table_name = 'planning_process_commands'
     and old.status in ('completed','partial_failed','failed') then
    raise exception using errcode = '55000',
      message = 'PLANNING-CLOSURE-COMMAND-IMMUTABLE';
  end if;
  if tg_table_name = 'planning_process_targets' then
    if (
       new.command_id <> old.command_id
       or new.ordinal <> old.ordinal
       or new.visit_id is distinct from old.visit_id
       or new.plan_id is distinct from old.plan_id
       or new.expected_version is distinct from old.expected_version
       or new.expected_fingerprint <> old.expected_fingerprint
       or new.request_fragment <> old.request_fragment
    ) then
      raise exception using errcode = '55000',
        message = 'PLANNING-CLOSURE-TARGET-IMMUTABLE';
    end if;
  end if;
  return new;
end
$$;

create trigger planning_process_commands_immutable
  before update or delete on public.planning_process_commands
  for each row execute function public.guard_planning_closure_immutable();
create trigger planning_process_targets_immutable
  before update or delete on public.planning_process_targets
  for each row execute function public.guard_planning_closure_immutable();
create trigger planning_process_row_receipts_immutable
  before update or delete on public.planning_process_row_receipts
  for each row execute function public.guard_planning_closure_immutable();
create trigger planning_visit_archives_immutable
  before update or delete on public.planning_visit_archives
  for each row execute function public.guard_planning_closure_immutable();

revoke all on function public.guard_planning_closure_immutable()
  from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- S4. Safe helpers.
-- ---------------------------------------------------------------------------
create function public.planning_closure_request_hash(p_request jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(convert_to(p_request::text, 'UTF8'), 'sha256'), 'hex')
$$;

create function public.planning_closure_visit_fingerprint(p_visit public.visits)
returns text
language sql
immutable
set search_path = ''
as $$
  select public.planning_closure_request_hash(jsonb_build_object(
    'id',p_visit.id,'factory_id',p_visit.factory_id,
    'version',p_visit.planning_version,
    'planning_status',p_visit.planning_status,
    'operational_state',p_visit.operational_state,
    'window_start',p_visit.window_start,'window_end',p_visit.window_end,
    'plan_id',p_visit.visit_plan_id
  ))
$$;

revoke all on function public.planning_closure_request_hash(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.planning_closure_visit_fingerprint(public.visits)
  from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- S5a. Planner cancellation and true window-changing reschedule.
-- CORR-PLANNING-R01-R03-002: p_note is optional Planning-only free text.
-- It does not require a lookup key and never rewrites cancellation_reason.
-- ---------------------------------------------------------------------------
create function public.mutate_planning_window_atomic(
  p_visit_ids uuid[],
  p_operation text,
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_expected_versions jsonb,
  p_note text,
  p_idempotency_key text,
  p_correlation_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_ids uuid[];
  v_request jsonb;
  v_hash text;
  v_existing public.planning_process_commands%rowtype;
  v_command uuid;
  v_now timestamptz := transaction_timestamp();
  v_visit public.visits%rowtype;
  v_audit bigint;
  v_outbox uuid;
  v_ordinal integer := 0;
  v_cutoff timestamptz;
  v_results jsonb := '[]'::jsonb;
begin
  if v_actor is null or p_operation not in ('cancel','reschedule')
     or nullif(btrim(p_idempotency_key),'') is null
     or p_correlation_id is null
     or jsonb_typeof(coalesce(p_expected_versions,'{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023',
      message = 'PLANNING-CLOSURE-REQUEST';
  end if;
  if (p_operation='cancel'
      and not public.planning_closure_has_explicit_capability('planning.cancel'))
     or (p_operation='reschedule'
      and not public.planning_closure_has_explicit_capability('planning.reschedule')) then
    raise exception using errcode = '42501',
      message = 'PLANNING-CLOSURE-DENIED';
  end if;
  if p_operation='reschedule'
     and (p_window_start is null or p_window_end is null or p_window_end <= p_window_start) then
    raise exception using errcode = '22023',
      message = 'PLANNING-RESCHEDULE-WINDOW';
  end if;

  select array_agg(distinct x order by x) into v_ids
  from unnest(coalesce(p_visit_ids,'{}'::uuid[])) x;
  if coalesce(cardinality(v_ids),0)=0 then
    raise exception using errcode = '22023',
      message = 'PLANNING-CLOSURE-TARGETS';
  end if;
  v_request := jsonb_build_object(
    'visit_ids',v_ids,'operation',p_operation,
    'window_start',p_window_start,'window_end',p_window_end,
    'expected_versions',p_expected_versions,
    'note',nullif(btrim(p_note),'')
  );
  v_hash := public.planning_closure_request_hash(v_request);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'planning-closure:'||v_actor::text||':'||p_operation||':'||p_idempotency_key,0
  ));
  select * into v_existing from public.planning_process_commands
  where actor=v_actor and operation=p_operation and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash <> v_hash then
      raise exception using errcode = '23505',
        message = 'PLANNING-CLOSURE-IDEMPOTENCY-CONFLICT';
    end if;
    return v_existing.result || jsonb_build_object('idempotent',true);
  end if;

  perform 1 from public.visits where id=any(v_ids) order by id for update;
  if not found or (select count(*) from public.visits where id=any(v_ids)) <> cardinality(v_ids) then
    raise exception using errcode = 'P0002',
      message = 'PLANNING-CLOSURE-TARGET-NOT-FOUND';
  end if;

  insert into public.planning_process_commands(
    actor,operation,idempotency_key,correlation_id,request,request_hash,
    status,target_count,server_transaction_time
  ) values (
    v_actor,p_operation,p_idempotency_key,p_correlation_id,v_request,v_hash,
    'running',cardinality(v_ids),v_now
  ) returning id into v_command;

  for v_visit in select * from public.visits where id=any(v_ids) order by id
  loop
    v_ordinal := v_ordinal+1;
    if not public.planning_closure_factory_in_scope(v_visit.factory_id) then
      raise exception using errcode = '42501',
        message = 'PLANNING-CLOSURE-SCOPE-DENIED';
    end if;
    if v_visit.planning_status not in ('published','returned')
       or v_visit.operational_state <> 'new'
       or exists (select 1 from public.planning_visit_archives a where a.visit_id=v_visit.id)
       or exists (select 1 from public.inspections i where i.visit_id=v_visit.id and (i.status <> 'not_started' or i.started_at is not null)) then
      raise exception using errcode = '23514', message = 'PLANNING-CLOSURE-STATE';
    end if;
    if (p_expected_versions->>v_visit.id::text)::bigint is distinct from v_visit.planning_version then
      raise exception using errcode = '40001', message = 'PLANNING-CLOSURE-STALE';
    end if;
    v_cutoff := v_visit.window_start - interval '720 hours';
    if v_now > v_cutoff then
      raise exception using errcode = '23514', message = 'PLANNING-CLOSURE-720H';
    end if;
    if p_operation='reschedule'
       and p_window_start=v_visit.window_start and p_window_end=v_visit.window_end then
      raise exception using errcode = '22023', message = 'PLANNING-RESCHEDULE-NO-WINDOW-CHANGE';
    end if;

    insert into public.planning_process_targets(
      command_id,ordinal,visit_id,expected_version,expected_fingerprint,request_fragment,status
    ) values (
      v_command,v_ordinal,v_visit.id,v_visit.planning_version,
      public.planning_closure_visit_fingerprint(v_visit),
      jsonb_build_object('window_start',p_window_start,'window_end',p_window_end),
      'running'
    );

    if p_operation='cancel' then
      update public.visits set planning_status='cancelled',
        planning_version=planning_version+1 where id=v_visit.id;
    else
      update public.visits set window_start=p_window_start,window_end=p_window_end,
        planning_version=planning_version+1 where id=v_visit.id;
    end if;

    insert into public.visit_lifecycle_events(
      visit_id,event_type,comments,actor,previous
    ) values (
      v_visit.id,p_operation,nullif(btrim(p_note),''),v_actor,
      jsonb_build_object('planning_status',v_visit.planning_status,
        'operational_state',v_visit.operational_state,
        'planning_version',v_visit.planning_version,
        'window_start',v_visit.window_start,'window_end',v_visit.window_end)
    );
    insert into public.audit_events(
      actor,object_type,object_id,action,before_state,after_state,requirement_refs
    ) values (
      v_actor,'visits',v_visit.id,'PLANNING_VISIT_'||upper(p_operation),
      to_jsonb(v_visit),
      (select to_jsonb(v) from public.visits v where v.id=v_visit.id)
        || jsonb_build_object('correlation_id',p_correlation_id,
             'idempotency_key',p_idempotency_key,'note',nullif(btrim(p_note),'')),
      array['CORR-PLANNING-R01-R03-002']
    ) returning id into v_audit;
    insert into public.workflow_outbox(
      idempotency_key,aggregate_type,aggregate_id,aggregate_version,
      side_effect_kind,payload,status,created_by
    ) values (
      'planning:'||p_operation||':'||v_visit.id||':'||(v_visit.planning_version+1),
      'visit',v_visit.id,(v_visit.planning_version+1)::integer,'notify',
      jsonb_build_object('operation',p_operation,'visit_id',v_visit.id,
        'correlation_id',p_correlation_id),'pending',v_actor
    ) returning id into v_outbox;
    insert into public.planning_process_row_receipts(
      command_id,target_ordinal,visit_id,outcome,pre_state,post_state,
      pre_version,post_version,prior_window_start,prior_window_end,
      requested_window_start,requested_window_end,server_transaction_time,
      cutoff_seconds,cutoff_at,cutoff_allowed,audit_event_id,outbox_intent_ids,
      receipt_hash
    ) values (
      v_command,v_ordinal,v_visit.id,'applied',to_jsonb(v_visit),
      (select to_jsonb(v) from public.visits v where v.id=v_visit.id),
      v_visit.planning_version,v_visit.planning_version+1,
      v_visit.window_start,v_visit.window_end,p_window_start,p_window_end,v_now,
      2592000,v_cutoff,true,v_audit,array[v_outbox],
      public.planning_closure_request_hash(jsonb_build_object(
        'command',v_command,'ordinal',v_ordinal,'audit',v_audit,'outbox',v_outbox))
    );
    update public.planning_process_targets set status='applied'
    where command_id=v_command and ordinal=v_ordinal;
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'visit_id',v_visit.id,'pre_version',v_visit.planning_version,
      'post_version',v_visit.planning_version+1,'server_transaction_time',v_now,
      'prior_window_start',v_visit.window_start,'prior_window_end',v_visit.window_end,
      'requested_window_start',p_window_start,'requested_window_end',p_window_end,
      'cutoff_at',v_cutoff,'cutoff_allowed',true,
      'audit_event_id',v_audit,'outbox_intent_id',v_outbox));
  end loop;
  update public.planning_process_commands set status='completed',
    applied_count=cardinality(v_ids),completed_at=v_now,
    result=jsonb_build_object('command_id',v_command,'operation',p_operation,
      'correlation_id',p_correlation_id,'visit_ids',v_ids,
      'updated_count',cardinality(v_ids),'rows',v_results,'idempotent',false)
  where id=v_command;
  return (select result from public.planning_process_commands where id=v_command);
end
$$;

create function public.cancel_planning_visits_atomic(
  p_visit_ids uuid[], p_expected_versions jsonb, p_note text,
  p_idempotency_key text, p_correlation_id uuid
) returns jsonb language sql security definer set search_path=''
as $$
  select public.mutate_planning_window_atomic(
    p_visit_ids,'cancel',null,null,p_expected_versions,p_note,
    p_idempotency_key,p_correlation_id)
$$;

create function public.reschedule_planning_visits_atomic(
  p_visit_ids uuid[], p_window_start timestamptz, p_window_end timestamptz,
  p_expected_versions jsonb, p_note text,
  p_idempotency_key text, p_correlation_id uuid
) returns jsonb language sql security definer set search_path=''
as $$
  select public.mutate_planning_window_atomic(
    p_visit_ids,'reschedule',p_window_start,p_window_end,p_expected_versions,
    p_note,p_idempotency_key,p_correlation_id)
$$;

-- Harden the still-supported legacy reassignment signature without retiring
-- it or applying the R03 720-hour rule. Explicit governed capability is checked
-- before target lookup; target factory scope is checked before delegation.
create or replace function public.reassign_published_visits_atomic(
  p_visit_ids uuid[], p_inspector_id uuid, p_reason text,
  p_idempotency_key text, p_correlation_id uuid default gen_random_uuid()
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
begin
  if not public.planning_closure_has_explicit_capability('planning.reassign') then
    raise exception using errcode='42501',
      message='PLANNING-REASSIGN-DENIED';
  end if;
  if exists (
    select 1 from public.visits v
    where v.id=any(coalesce(p_visit_ids,'{}'::uuid[]))
      and not public.planning_closure_factory_in_scope(v.factory_id)
  ) then
    raise exception using errcode='42501',
      message='PLANNING-CLOSURE-SCOPE-DENIED';
  end if;
  return public.mutate_published_visits_atomic(
    p_visit_ids,'reassign',jsonb_build_object('inspector_id',p_inspector_id),
    p_reason,p_idempotency_key,p_correlation_id
  );
end
$$;
revoke all on function public.reassign_published_visits_atomic(
  uuid[],uuid,text,text,uuid) from public,anon,service_role;
grant execute on function public.reassign_published_visits_atomic(
  uuid[],uuid,text,text,uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- S5b. Atomic truthful archival of a never-published draft aggregate.
-- ---------------------------------------------------------------------------
create function public.archive_planning_draft_atomic(
  p_plan_id uuid, p_expected_plan_version integer, p_note text,
  p_idempotency_key text, p_correlation_id uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid := auth.uid();
  v_plan public.visit_plans%rowtype;
  v_command uuid;
  v_request jsonb;
  v_hash text;
  v_existing public.planning_process_commands%rowtype;
  v_now timestamptz := transaction_timestamp();
  v_visit public.visits%rowtype;
  v_audit bigint;
  v_outbox uuid;
  v_outboxes uuid[] := '{}'::uuid[];
  v_ordinal integer := 0;
begin
  if v_actor is null or p_plan_id is null or p_expected_plan_version is null
     or nullif(btrim(p_idempotency_key),'') is null or p_correlation_id is null then
    raise exception using errcode='22023',message='PLANNING-ARCHIVE-REQUEST';
  end if;
  if not public.planning_closure_has_explicit_capability('planning.manage') then
    raise exception using errcode='42501',message='PLANNING-ARCHIVE-DENIED';
  end if;
  v_request:=jsonb_build_object('plan_id',p_plan_id,'expected_plan_version',
    p_expected_plan_version,'note',nullif(btrim(p_note),''));
  v_hash:=public.planning_closure_request_hash(v_request);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'planning-archive:'||v_actor::text||':'||p_idempotency_key,0));
  select * into v_existing from public.planning_process_commands
  where actor=v_actor and operation='archive_draft'
    and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>v_hash then
      raise exception using errcode='23505',message='PLANNING-CLOSURE-IDEMPOTENCY-CONFLICT';
    end if;
    return v_existing.result||jsonb_build_object('idempotent',true);
  end if;
  select * into v_plan from public.visit_plans where id=p_plan_id for update;
  if not found or v_plan.created_by is distinct from v_actor
     or v_plan.status not in ('draft','validated') or v_plan.published_at is not null
     or v_plan.archived_at is not null or v_plan.draft_version<>p_expected_plan_version then
    raise exception using errcode='23514',message='PLANNING-ARCHIVE-STATE';
  end if;
  perform 1 from public.visits where visit_plan_id=p_plan_id order by id for update;
  if exists(
    select 1 from public.visits v where v.visit_plan_id=p_plan_id
      and not public.planning_closure_factory_in_scope(v.factory_id)
  ) then
    raise exception using errcode='42501',
      message='PLANNING-CLOSURE-SCOPE-DENIED';
  end if;
  if exists(select 1 from public.visits v where v.visit_plan_id=p_plan_id
    and (v.planning_status not in ('draft','validated')
      or exists(select 1 from public.planning_visit_archives a where a.visit_id=v.id))) then
    raise exception using errcode='23514',message='PLANNING-ARCHIVE-CHILD-STATE';
  end if;
  insert into public.planning_process_commands(
    actor,operation,idempotency_key,correlation_id,request,request_hash,status,target_count
  ) values(v_actor,'archive_draft',p_idempotency_key,p_correlation_id,
    v_request,v_hash,'running',(select count(*)+1 from public.visits where visit_plan_id=p_plan_id))
  returning id into v_command;

  update public.visit_plans set archived_at=v_now,archive_actor=v_actor,
    archive_correlation_id=p_correlation_id,archive_prior_status=v_plan.status,
    archive_prior_version=v_plan.draft_version,archive_note=nullif(btrim(p_note),'')
  where id=p_plan_id;
  insert into public.audit_events(actor,object_type,object_id,action,before_state,
    after_state,requirement_refs)
  values(v_actor,'visit_plans',p_plan_id,'PLANNING_DRAFT_ARCHIVE',
    to_jsonb(v_plan),(select to_jsonb(p) from public.visit_plans p where p.id=p_plan_id),
    array['CORR-PLANNING-R01-R03-002']) returning id into v_audit;
  insert into public.workflow_outbox(idempotency_key,aggregate_type,aggregate_id,
    aggregate_version,side_effect_kind,payload,status,created_by)
  values('planning:archive:'||p_plan_id||':'||p_expected_plan_version,
    'plan',p_plan_id,p_expected_plan_version,'notify',
    jsonb_build_object('operation','archive_draft','plan_id',p_plan_id,
      'correlation_id',p_correlation_id),'pending',v_actor)
  returning id into v_outbox;
  v_outboxes:=array_append(v_outboxes,v_outbox);

  for v_visit in select * from public.visits where visit_plan_id=p_plan_id order by id
  loop
    v_ordinal:=v_ordinal+1;
    insert into public.visit_lifecycle_events(visit_id,event_type,comments,actor,previous)
    values(v_visit.id,'discard_draft',nullif(btrim(p_note),''),v_actor,
      jsonb_build_object('planning_status',v_visit.planning_status,
        'operational_state',v_visit.operational_state,
        'planning_version',v_visit.planning_version,'plan_id',p_plan_id));
    insert into public.audit_events(actor,object_type,object_id,action,before_state,
      after_state,requirement_refs)
    values(v_actor,'visits',v_visit.id,'PLANNING_DRAFT_CHILD_ARCHIVE',
      to_jsonb(v_visit),to_jsonb(v_visit)||jsonb_build_object(
        'archived_at',v_now,'archive_correlation_id',p_correlation_id),
      array['CORR-PLANNING-R01-R03-002']) returning id into v_audit;
    insert into public.workflow_outbox(idempotency_key,aggregate_type,aggregate_id,
      aggregate_version,side_effect_kind,payload,status,created_by)
    values('planning:archive-child:'||v_visit.id||':'||v_visit.planning_version,
      'visit',v_visit.id,v_visit.planning_version::integer,'notify',
      jsonb_build_object('operation','archive_draft_child','visit_id',v_visit.id,
        'plan_id',p_plan_id,'correlation_id',p_correlation_id),'pending',v_actor)
    returning id into v_outbox;
    v_outboxes:=array_append(v_outboxes,v_outbox);
    insert into public.planning_visit_archives(
      visit_id,parent_plan_id,archived_at,archived_by,archive_command_id,
      archive_correlation_id,prior_planning_status,prior_operational_state,
      prior_version,audit_event_id,outbox_intent_ids,provenance_hash
    ) values(v_visit.id,p_plan_id,v_now,v_actor,v_command,p_correlation_id,
      v_visit.planning_status,v_visit.operational_state,v_visit.planning_version,
      v_audit,array[v_outbox],public.planning_closure_request_hash(
        jsonb_build_object('visit_id',v_visit.id,'plan_id',p_plan_id,
          'prior_status',v_visit.planning_status,'prior_version',v_visit.planning_version)));
  end loop;
  update public.planning_process_commands set status='completed',
    applied_count=target_count,completed_at=v_now,
    result=jsonb_build_object('command_id',v_command,'operation','archive_draft',
      'plan_id',p_plan_id,'child_count',v_ordinal,'planning_status_preserved',true,
      'outbox_intent_ids',v_outboxes,'correlation_id',p_correlation_id,
      'idempotent',false)
  where id=v_command;
  return (select result from public.planning_process_commands where id=v_command);
end
$$;

-- ---------------------------------------------------------------------------
-- S5c. Exact ADD-R07-001 expiry core; scheduler wrapper is granted in S6.
-- ---------------------------------------------------------------------------
create function public.expire_planning_visits_core(
  p_as_of timestamptz, p_batch_limit integer, p_idempotency_key text,
  p_correlation_id uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_now timestamptz := transaction_timestamp();
  v_command uuid;
  v_visit public.visits%rowtype;
  v_assignment public.assignments%rowtype;
  v_audit bigint;
  v_outbox_inspector uuid;
  v_outbox_planner uuid;
  v_count integer:=0;
  v_request jsonb;
  v_hash text;
  v_existing public.planning_process_commands%rowtype;
begin
  if p_as_of is distinct from v_now
     or p_batch_limit is null or p_batch_limit<1 or p_batch_limit>500
     or nullif(btrim(p_idempotency_key),'') is null or p_correlation_id is null then
    raise exception using errcode='42501',message='PLANNING-EXPIRY-SCHEDULER-ONLY';
  end if;
  v_request:=jsonb_build_object('as_of',p_as_of,'batch_limit',p_batch_limit);
  v_hash:=public.planning_closure_request_hash(v_request);
  select * into v_existing from public.planning_process_commands
  where scheduler_principal='planning_expiry_scheduler' and operation='expire'
    and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>v_hash then
      raise exception using errcode='23505',message='PLANNING-CLOSURE-IDEMPOTENCY-CONFLICT';
    end if;
    return v_existing.result||jsonb_build_object('idempotent',true);
  end if;
  insert into public.planning_process_commands(
    scheduler_principal,operation,idempotency_key,correlation_id,request,
    request_hash,status,target_count,server_transaction_time
  ) values('planning_expiry_scheduler','expire',p_idempotency_key,p_correlation_id,
    v_request,v_hash,'running',0,v_now) returning id into v_command;

  for v_visit in
    select v.* from public.visits v
    join public.factories f on f.id=v.factory_id
    where v.planning_status='published'
      and v.operational_state in ('new','prepared')
      and v.execution_mode='physical'
      and not f.is_temporary
      and v.window_end<=p_as_of
      and not exists(select 1 from public.planning_visit_archives a where a.visit_id=v.id)
      and (
        (v.visit_plan_id is not null and v.immediate_creator_role is null)
        or (v.visit_plan_id is null and v.immediate_creator_role in ('planner','inspector')
          and v.creation_request_id is not null)
      )
      and (not exists(select 1 from public.inspections i where i.visit_id=v.id)
        or exists(select 1 from public.inspections i where i.visit_id=v.id
          and i.status='not_started' and i.started_at is null and i.submitted_at is null))
      and (select count(*) from public.assignments a where a.visit_id=v.id
        and a.inspector_id is not null and a.status in ('assigned','preparing','ready'))=1
      and (select count(*) from public.assignments a where a.visit_id=v.id)=1
    order by v.window_end,v.id
    limit p_batch_limit
    for update of v skip locked
  loop
    select * into strict v_assignment from public.assignments
      where visit_id=v_visit.id for update;
    -- Recheck under the visit/assignment lock; start wins if it committed first.
    if exists(select 1 from public.inspections i where i.visit_id=v_visit.id
      and (i.status<>'not_started' or i.started_at is not null or i.submitted_at is not null)) then
      continue;
    end if;
    update public.visits set planning_status='expired',
      planning_version=planning_version+1 where id=v_visit.id;
    insert into public.visit_lifecycle_events(visit_id,event_type,actor,previous)
    values(v_visit.id,'expire',null,jsonb_build_object(
      'planning_status',v_visit.planning_status,'operational_state',v_visit.operational_state,
      'planning_version',v_visit.planning_version,'window_end',v_visit.window_end));
    insert into public.audit_events(actor,object_type,object_id,action,before_state,
      after_state,requirement_refs)
    values(null,'visits',v_visit.id,'PLANNING_VISIT_EXPIRE',to_jsonb(v_visit),
      (select to_jsonb(v) from public.visits v where v.id=v_visit.id)
        || jsonb_build_object('system_actor','planning_expiry_scheduler',
          'as_of',p_as_of,'correlation_id',p_correlation_id),
      array['ADD-R07-001']) returning id into v_audit;
    insert into public.workflow_outbox(idempotency_key,aggregate_type,aggregate_id,
      aggregate_version,side_effect_kind,payload,status,created_by)
    values('planning:expire:inspector:'||v_visit.id||':'||(v_visit.planning_version+1),
      'visit',v_visit.id,(v_visit.planning_version+1)::integer,'notify',
      jsonb_build_object('audience','inspector','recipient',v_assignment.inspector_id,
        'visit_id',v_visit.id,'correlation_id',p_correlation_id),'pending',null)
    returning id into v_outbox_inspector;
    insert into public.workflow_outbox(idempotency_key,aggregate_type,aggregate_id,
      aggregate_version,side_effect_kind,payload,status,created_by)
    values('planning:expire:planner:'||v_visit.id||':'||(v_visit.planning_version+1),
      'visit',v_visit.id,(v_visit.planning_version+1)::integer,'notify',
      jsonb_build_object('audience','planner','visit_id',v_visit.id,
        'correlation_id',p_correlation_id),'pending',null)
    returning id into v_outbox_planner;
    v_count:=v_count+1;
  end loop;
  update public.planning_process_commands set status='completed',target_count=v_count,
    applied_count=v_count,completed_at=v_now,
    result=jsonb_build_object('command_id',v_command,'operation','expire',
      'expired_count',v_count,'server_transaction_time',v_now,
      'correlation_id',p_correlation_id,'idempotent',false)
    where id=v_command;
  return (select result from public.planning_process_commands where id=v_command);
end
$$;

create function public.expire_planning_visits_scheduled(
  p_batch_limit integer default 100
) returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare
  v_now timestamptz:=transaction_timestamp();
  v_key text:='planning-expiry:'||to_char(v_now at time zone 'UTC','YYYYMMDDHH24MI');
begin
  if current_user <> 'planning_expiry_scheduler' then
    raise exception using errcode='42501',
      message='PLANNING-EXPIRY-SCHEDULER-ONLY';
  end if;
  return public.expire_planning_visits_core(
    v_now,p_batch_limit,v_key,gen_random_uuid());
end
$$;

-- ---------------------------------------------------------------------------
-- S5d. Frozen target bulk envelope. Each target is processed by a separate RPC
-- transaction; aggregate truth is derived, never a mixed green result.
-- ---------------------------------------------------------------------------
create function public.create_planning_bulk_command(
  p_operation text, p_visit_ids uuid[], p_expected_versions jsonb,
  p_payload jsonb, p_idempotency_key text, p_correlation_id uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_ids uuid[];
  v_request jsonb;
  v_hash text;
  v_command uuid;
  v_visit public.visits%rowtype;
  v_n integer:=0;
begin
  if v_actor is null
     or not public.planning_closure_has_explicit_capability('planning.manage')
     or p_operation not in ('cancel','reschedule')
     or jsonb_typeof(coalesce(p_payload,'{}'::jsonb))<>'object'
     or jsonb_typeof(coalesce(p_expected_versions,'{}'::jsonb))<>'object' then
    raise exception using errcode='42501',message='PLANNING-BULK-DENIED';
  end if;
  select array_agg(distinct x order by x) into v_ids
    from unnest(coalesce(p_visit_ids,'{}'::uuid[])) x;
  if coalesce(cardinality(v_ids),0)=0 then
    raise exception using errcode='22023',message='PLANNING-BULK-TARGETS';
  end if;
  v_request:=jsonb_build_object('operation',p_operation,'visit_ids',v_ids,
    'expected_versions',p_expected_versions,'payload',p_payload);
  v_hash:=public.planning_closure_request_hash(v_request);
  if exists(select 1 from public.planning_process_commands c where
    c.actor=v_actor and c.operation='bulk' and c.idempotency_key=p_idempotency_key
    and c.request_hash<>v_hash) then
    raise exception using errcode='23505',message='PLANNING-CLOSURE-IDEMPOTENCY-CONFLICT';
  end if;
  select id into v_command from public.planning_process_commands c where
    c.actor=v_actor and c.operation='bulk' and c.idempotency_key=p_idempotency_key;
  if found then return jsonb_build_object('command_id',v_command,'idempotent',true); end if;
  perform 1 from public.visits where id=any(v_ids) order by id for share;
  if (select count(*) from public.visits where id=any(v_ids))<>cardinality(v_ids) then
    raise exception using errcode='P0002',message='PLANNING-BULK-TARGET-NOT-FOUND';
  end if;
  insert into public.planning_process_commands(actor,operation,idempotency_key,
    correlation_id,request,request_hash,status,target_count)
  values(v_actor,'bulk',p_idempotency_key,p_correlation_id,v_request,v_hash,
    'pending',cardinality(v_ids)) returning id into v_command;
  for v_visit in select * from public.visits where id=any(v_ids) order by id loop
    v_n:=v_n+1;
    if not public.planning_closure_factory_in_scope(v_visit.factory_id) then
      raise exception using errcode='42501',
        message='PLANNING-CLOSURE-SCOPE-DENIED';
    end if;
    if (p_expected_versions->>v_visit.id::text)::bigint is distinct from v_visit.planning_version then
      raise exception using errcode='40001',message='PLANNING-CLOSURE-STALE';
    end if;
    insert into public.planning_process_targets(command_id,ordinal,visit_id,
      expected_version,expected_fingerprint,request_fragment)
    values(v_command,v_n,v_visit.id,v_visit.planning_version,
      public.planning_closure_visit_fingerprint(v_visit),p_payload);
  end loop;
  return jsonb_build_object('command_id',v_command,'target_count',v_n,
    'inventory_hash',public.planning_closure_request_hash(to_jsonb(v_ids)),
    'idempotent',false);
end
$$;

create function public.planning_bulk_command_receipt(p_command_id uuid)
returns jsonb language sql security definer set search_path=''
as $$
  select jsonb_build_object(
    'command_id',c.id,'status',
      case when count(*) filter(where t.status in ('pending','running'))>0 then 'running'
           when count(*) filter(where t.status='failed')>0 then 'partial_failed'
           else 'completed' end,
    'target_count',count(*),
    'pending_count',count(*) filter(where t.status in ('pending','running')),
    'applied_count',count(*) filter(where t.status='applied'),
    'blocked_count',count(*) filter(where t.status='blocked'),
    'failed_count',count(*) filter(where t.status='failed'),
    'inventory_hash',public.planning_closure_request_hash(
      coalesce(jsonb_agg(t.visit_id order by t.ordinal),'[]'::jsonb)))
  from public.planning_process_commands c
  join public.planning_process_targets t on t.command_id=c.id
  where public.planning_closure_has_explicit_capability('planning.view')
    and c.id=p_command_id and c.actor=auth.uid() and c.operation='bulk'
  group by c.id
$$;

create function public.process_planning_bulk_target(
  p_command_id uuid, p_target_ordinal integer
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_command public.planning_process_commands%rowtype;
  v_target public.planning_process_targets%rowtype;
  v_visit public.visits%rowtype;
  v_nested jsonb;
  v_nested_row public.planning_process_row_receipts%rowtype;
  v_payload jsonb;
  v_versions jsonb;
  v_status text;
begin
  if v_actor is null
     or not public.planning_closure_has_explicit_capability('planning.manage') then
    raise exception using errcode='42501',message='PLANNING-BULK-DENIED';
  end if;
  select * into v_command from public.planning_process_commands
    where id=p_command_id and actor=v_actor and operation='bulk' for update;
  if not found then
    raise exception using errcode='P0002',message='PLANNING-BULK-COMMAND-NOT-FOUND';
  end if;
  select * into v_target from public.planning_process_targets
    where command_id=p_command_id and ordinal=p_target_ordinal for update;
  if not found then
    raise exception using errcode='P0002',message='PLANNING-BULK-TARGET-NOT-FOUND';
  end if;
  if v_target.status in ('applied','blocked','failed') then
    return jsonb_build_object('command_id',p_command_id,
      'ordinal',p_target_ordinal,'status',v_target.status,'idempotent',true);
  end if;
  select * into v_visit from public.visits where id=v_target.visit_id for update;
  if not found or not public.planning_closure_factory_in_scope(v_visit.factory_id) then
    raise exception using errcode='42501',
      message='PLANNING-CLOSURE-SCOPE-DENIED';
  end if;
  if not found or public.planning_closure_visit_fingerprint(v_visit)
      <> v_target.expected_fingerprint then
    update public.planning_process_targets set status='blocked'
      where command_id=p_command_id and ordinal=p_target_ordinal;
    insert into public.planning_process_row_receipts(
      command_id,target_ordinal,visit_id,outcome,pre_state,post_state,
      pre_version,post_version,server_transaction_time,error_code,receipt_hash
    ) values(
      p_command_id,p_target_ordinal,v_target.visit_id,'blocked',
      coalesce(to_jsonb(v_visit),'{}'::jsonb),coalesce(to_jsonb(v_visit),'{}'::jsonb),
      v_target.expected_version,v_visit.planning_version,transaction_timestamp(),
      'PLANNING-CLOSURE-STALE',public.planning_closure_request_hash(
        jsonb_build_object('command',p_command_id,'ordinal',p_target_ordinal,
          'error','PLANNING-CLOSURE-STALE'))
    );
  else
    v_payload:=v_command.request->'payload';
    v_versions:=jsonb_build_object(v_visit.id::text,v_visit.planning_version);
    if v_command.request->>'operation'='cancel' then
      v_nested:=public.mutate_planning_window_atomic(
        array[v_visit.id],'cancel',null,null,v_versions,v_payload->>'note',
        'bulk:'||p_command_id||':'||p_target_ordinal,v_command.correlation_id);
    elsif v_command.request->>'operation'='reschedule' then
      v_nested:=public.mutate_planning_window_atomic(
        array[v_visit.id],'reschedule',
        (v_payload->>'window_start')::timestamptz,
        (v_payload->>'window_end')::timestamptz,
        v_versions,v_payload->>'note',
        'bulk:'||p_command_id||':'||p_target_ordinal,v_command.correlation_id);
    else
      raise exception using errcode='22023',message='PLANNING-BULK-OPERATION';
    end if;
    select * into strict v_nested_row
      from public.planning_process_row_receipts
      where command_id=(v_nested->>'command_id')::uuid and target_ordinal=1;
    insert into public.planning_process_row_receipts(
      command_id,target_ordinal,visit_id,outcome,pre_state,post_state,
      pre_version,post_version,prior_window_start,prior_window_end,
      requested_window_start,requested_window_end,server_transaction_time,
      cutoff_seconds,cutoff_at,cutoff_allowed,audit_event_id,
      outbox_intent_ids,receipt_hash
    ) values(
      p_command_id,p_target_ordinal,v_nested_row.visit_id,'applied',
      v_nested_row.pre_state,v_nested_row.post_state,v_nested_row.pre_version,
      v_nested_row.post_version,v_nested_row.prior_window_start,
      v_nested_row.prior_window_end,v_nested_row.requested_window_start,
      v_nested_row.requested_window_end,v_nested_row.server_transaction_time,
      v_nested_row.cutoff_seconds,v_nested_row.cutoff_at,
      v_nested_row.cutoff_allowed,v_nested_row.audit_event_id,
      v_nested_row.outbox_intent_ids,public.planning_closure_request_hash(
        jsonb_build_object('command',p_command_id,'ordinal',p_target_ordinal,
          'nested_command',v_nested->>'command_id'))
    );
    update public.planning_process_targets set status='applied'
      where command_id=p_command_id and ordinal=p_target_ordinal;
  end if;
  select case
    when exists(select 1 from public.planning_process_targets
      where command_id=p_command_id and status in ('pending','running')) then 'running'
    when exists(select 1 from public.planning_process_targets
      where command_id=p_command_id and status in ('blocked','failed')) then 'partial_failed'
    else 'completed' end into v_status;
  update public.planning_process_commands set
    status=v_status,
    applied_count=(select count(*) from public.planning_process_targets
      where command_id=p_command_id and status='applied'),
    blocked_count=(select count(*) from public.planning_process_targets
      where command_id=p_command_id and status='blocked'),
    failed_count=(select count(*) from public.planning_process_targets
      where command_id=p_command_id and status='failed'),
    completed_at=case when v_status in ('completed','partial_failed')
      then transaction_timestamp() else null end,
    result=public.planning_bulk_command_receipt(p_command_id)
  where id=p_command_id;
  return public.planning_bulk_command_receipt(p_command_id)
    || jsonb_build_object('processed_ordinal',p_target_ordinal,'idempotent',false);
end
$$;

-- ---------------------------------------------------------------------------
-- S5e. Governed compatibility surface for the remaining Planning web writers.
-- One target, one CAS, one immutable command receipt, audit and outbox intent.
-- Existing execution/Field transition engines are not reimplemented here.
-- ---------------------------------------------------------------------------
create function public.transition_planning_visit_atomic(
  p_visit_id uuid,
  p_operation text,
  p_payload jsonb,
  p_expected_version bigint,
  p_idempotency_key text,
  p_correlation_id uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_visit public.visits%rowtype;
  v_request jsonb;
  v_hash text;
  v_existing public.planning_process_commands%rowtype;
  v_command uuid;
  v_audit bigint;
  v_outbox uuid;
  v_now timestamptz:=transaction_timestamp();
  v_package public.package_versions%rowtype;
  v_result jsonb;
begin
  if v_actor is null or p_visit_id is null
     or p_operation not in (
       'return','republish','repackage','metadata'
     )
     or jsonb_typeof(coalesce(p_payload,'{}'::jsonb)) <> 'object'
     or p_expected_version is null
     or nullif(btrim(p_idempotency_key),'') is null
     or p_correlation_id is null then
    raise exception using errcode='22023',
      message='PLANNING-TRANSITION-REQUEST';
  end if;
  if not public.planning_closure_has_explicit_capability('planning.manage') then
    raise exception using errcode='42501',
      message='PLANNING-TRANSITION-DENIED';
  end if;

  v_request:=jsonb_build_object(
    'visit_id',p_visit_id,'operation',p_operation,'payload',coalesce(p_payload,'{}'),
    'expected_version',p_expected_version
  );
  v_hash:=public.planning_closure_request_hash(v_request);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'planning-transition:'||v_actor::text||':'||p_operation||':'||p_idempotency_key,0
  ));
  select * into v_existing from public.planning_process_commands
  where actor=v_actor and operation=p_operation and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>v_hash then
      raise exception using errcode='23505',
        message='PLANNING-CLOSURE-IDEMPOTENCY-CONFLICT';
    end if;
    return v_existing.result||jsonb_build_object('idempotent',true);
  end if;

  select * into v_visit from public.visits where id=p_visit_id for update;
  if not found then
    raise exception using errcode='P0002',
      message='PLANNING-TRANSITION-NOT-FOUND';
  end if;
  if not public.planning_closure_factory_in_scope(v_visit.factory_id) then
    raise exception using errcode='42501',
      message='PLANNING-CLOSURE-SCOPE-DENIED';
  end if;
  if v_visit.planning_version<>p_expected_version then
    raise exception using errcode='40001',
      message='PLANNING-CLOSURE-STALE';
  end if;
  if exists(select 1 from public.planning_visit_archives a where a.visit_id=p_visit_id)
     or exists(
       select 1 from public.inspections i
       where i.visit_id=p_visit_id
         and (i.status<>'not_started' or i.started_at is not null)
     ) then
    raise exception using errcode='23514',
      message='PLANNING-TRANSITION-LOCKED';
  end if;

  if p_operation='return' then
    if v_visit.planning_status<>'published'
       or v_visit.operational_state not in ('new','prepared')
       or nullif(btrim(p_payload->>'reason_key'),'') is null
       or not exists(
         select 1 from public.planning_lookups l
         where l.kind='return_reason'
           and l.key=p_payload->>'reason_key' and l.is_active
       ) then
      raise exception using errcode='23514',
        message='PLANNING-RETURN-STATE-OR-REASON';
    end if;
    update public.visits set planning_status='returned',
      planning_version=planning_version+1 where id=p_visit_id;
    insert into public.visit_lifecycle_events(
      visit_id,event_type,reason_key,comments,actor,previous
    ) values (
      p_visit_id,'return',p_payload->>'reason_key',
      nullif(btrim(p_payload->>'comments'),''),v_actor,
      jsonb_build_object('planning_status',v_visit.planning_status,
        'operational_state',v_visit.operational_state,
        'planning_version',v_visit.planning_version)
    );
  elsif p_operation='republish' then
    if v_visit.planning_status<>'returned'
       or v_visit.operational_state not in ('new','prepared') then
      raise exception using errcode='23514',
        message='PLANNING-REPUBLISH-STATE';
    end if;
    update public.visits set planning_status='published',
      planning_version=planning_version+1 where id=p_visit_id;
    insert into public.visit_lifecycle_events(
      visit_id,event_type,actor,previous
    ) values (
      p_visit_id,'republish',v_actor,
      jsonb_build_object('planning_status',v_visit.planning_status,
        'operational_state',v_visit.operational_state,
        'planning_version',v_visit.planning_version)
    );
  elsif p_operation='repackage' then
    if v_visit.planning_status<>'returned' or v_visit.operational_state<>'new'
       or nullif(p_payload->>'package_version_id','') is null then
      raise exception using errcode='23514',
        message='PLANNING-REPACKAGE-STATE';
    end if;
    select * into v_package from public.package_versions pv
    where pv.id=(p_payload->>'package_version_id')::uuid
      and pv.status in ('published','locked')
      and pv.effective_from<=v_now::date
      and (pv.effective_to is null or pv.effective_to>=v_now::date)
    for share;
    if not found then
      raise exception using errcode='23514',
        message='PLANNING-REPACKAGE-PACKAGE';
    end if;
    update public.visits set package_version_id=v_package.id,
      planning_version=planning_version+1 where id=p_visit_id;
    insert into public.visit_packages(
      visit_id,package_version_id,snapshot,added_by
    ) values (
      p_visit_id,v_package.id,
      jsonb_build_object('package_version_id',v_package.id,
        'version_label',v_package.version_label,'status',v_package.status,
        'captured_at',v_now),v_actor
    ) on conflict(visit_id,package_version_id) do nothing;
  elsif p_operation='metadata' then
    if v_visit.planning_status not in ('published','returned')
       or v_visit.operational_state<>'new' then
      raise exception using errcode='23514',
        message='PLANNING-METADATA-STATE';
    end if;
    update public.visits set
      notes=case when p_payload ? 'notes' then nullif(btrim(p_payload->>'notes'),'')
                 else notes end,
      visit_type=case when p_payload ? 'visit_type'
                      then p_payload->>'visit_type' else visit_type end,
      planning_version=planning_version+1
    where id=p_visit_id;
  end if;

  insert into public.planning_process_commands(
    actor,operation,idempotency_key,correlation_id,request,request_hash,
    status,target_count,applied_count,completed_at
  ) values (
    v_actor,p_operation,p_idempotency_key,p_correlation_id,v_request,v_hash,
    'completed',1,1,v_now
  ) returning id into v_command;
  insert into public.audit_events(
    actor,object_type,object_id,action,before_state,after_state,requirement_refs
  ) values (
    v_actor,'visits',p_visit_id,'PLANNING_VISIT_'||upper(p_operation),
    to_jsonb(v_visit),
    (select to_jsonb(v) from public.visits v where v.id=p_visit_id)
      || jsonb_build_object('correlation_id',p_correlation_id,
           'idempotency_key',p_idempotency_key),
    array['CORR-PLANNING-R01-R03-002']
  ) returning id into v_audit;
  insert into public.workflow_outbox(
    idempotency_key,aggregate_type,aggregate_id,aggregate_version,
    side_effect_kind,payload,status,created_by
  ) values (
    'planning:'||p_operation||':'||p_visit_id||':'||(v_visit.planning_version+1),
    'visit',p_visit_id,(v_visit.planning_version+1)::integer,'notify',
    jsonb_build_object('operation',p_operation,'visit_id',p_visit_id,
      'correlation_id',p_correlation_id),'pending',v_actor
  ) returning id into v_outbox;
  v_result:=jsonb_build_object(
    'command_id',v_command,'operation',p_operation,'visit_id',p_visit_id,
    'pre_version',v_visit.planning_version,
    'post_version',v_visit.planning_version+1,
    'server_transaction_time',v_now,'correlation_id',p_correlation_id,
    'audit_event_id',v_audit,'outbox_intent_id',v_outbox,'idempotent',false
  );
  update public.planning_process_commands set result=v_result where id=v_command;
  return v_result;
end
$$;

create function public.save_planning_draft_atomic(
  p_plan_id uuid,
  p_method text,
  p_draft_payload jsonb,
  p_criteria jsonb,
  p_expected_version integer,
  p_idempotency_key text,
  p_correlation_id uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_plan public.visit_plans%rowtype;
  v_request jsonb;
  v_hash text;
  v_existing public.planning_process_commands%rowtype;
  v_command uuid;
  v_audit bigint;
  v_outbox uuid;
  v_now timestamptz:=transaction_timestamp();
  v_result jsonb;
begin
  if v_actor is null or p_method not in ('single','bulk')
     or jsonb_typeof(coalesce(p_draft_payload,'{}'))<>'object'
     or jsonb_typeof(coalesce(p_criteria,'{}'))<>'object'
     or nullif(btrim(p_idempotency_key),'') is null
     or p_correlation_id is null
     or not public.planning_closure_has_explicit_capability(
       case p_method when 'single' then 'planning.create.single'
                     else 'planning.create.bulk' end
     ) then
    raise exception using errcode='42501',message='PLANNING-DRAFT-DENIED';
  end if;
  v_request:=jsonb_build_object('plan_id',p_plan_id,'method',p_method,
    'draft_payload',p_draft_payload,'criteria',p_criteria,
    'expected_version',p_expected_version);
  v_hash:=public.planning_closure_request_hash(v_request);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'planning-draft:'||v_actor::text||':'||p_idempotency_key,0));
  select * into v_existing from public.planning_process_commands
  where actor=v_actor and operation='draft_save'
    and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>v_hash then
      raise exception using errcode='23505',
        message='PLANNING-CLOSURE-IDEMPOTENCY-CONFLICT';
    end if;
    return v_existing.result||jsonb_build_object('idempotent',true);
  end if;

  if p_plan_id is null then
    if p_expected_version is not null then
      raise exception using errcode='22023',message='PLANNING-DRAFT-VERSION';
    end if;
    insert into public.visit_plans(
      method,status,created_by,draft_payload,draft_version,source_channel,criteria
    ) values (
      p_method,'draft',v_actor,p_draft_payload,1,
      'planning.'||p_method,p_criteria
    ) returning * into v_plan;
  else
    select * into v_plan from public.visit_plans where id=p_plan_id for update;
    if not found or v_plan.created_by<>v_actor or v_plan.method<>p_method
       or v_plan.status<>'draft' or v_plan.archived_at is not null
       or v_plan.draft_version is distinct from p_expected_version then
      raise exception using errcode='40001',message='PLANNING-DRAFT-STALE';
    end if;
    update public.visit_plans set draft_payload=p_draft_payload,
      criteria=p_criteria,draft_version=draft_version+1,
      source_channel='planning.'||p_method
    where id=p_plan_id returning * into v_plan;
  end if;

  insert into public.planning_process_commands(
    actor,operation,idempotency_key,correlation_id,request,request_hash,
    status,target_count,applied_count,completed_at
  ) values(v_actor,'draft_save',p_idempotency_key,p_correlation_id,v_request,
    v_hash,'completed',1,1,v_now) returning id into v_command;
  insert into public.audit_events(
    actor,object_type,object_id,action,before_state,after_state,requirement_refs
  ) values(v_actor,'visit_plans',v_plan.id,'PLANNING_DRAFT_SAVE',null,
    to_jsonb(v_plan)||jsonb_build_object('correlation_id',p_correlation_id),
    array['CORR-PLANNING-R01-R03-002']) returning id into v_audit;
  insert into public.workflow_outbox(
    idempotency_key,aggregate_type,aggregate_id,aggregate_version,
    side_effect_kind,payload,status,created_by
  ) values('planning:draft-save:'||v_plan.id||':'||v_plan.draft_version,
    'plan',v_plan.id,v_plan.draft_version,'notify',
    jsonb_build_object('operation','draft_save','plan_id',v_plan.id,
      'correlation_id',p_correlation_id),'pending',v_actor)
  returning id into v_outbox;
  v_result:=jsonb_build_object('command_id',v_command,'plan_id',v_plan.id,
    'plan_reference',v_plan.plan_reference,'method',v_plan.method,
    'draft_version',v_plan.draft_version,'server_transaction_time',v_now,
    'correlation_id',p_correlation_id,'audit_event_id',v_audit,
    'outbox_intent_id',v_outbox,'idempotent',false);
  update public.planning_process_commands set result=v_result where id=v_command;
  return v_result;
end
$$;

create function public.duplicate_terminal_visit_atomic(
  p_visit_id uuid,
  p_expected_version bigint,
  p_idempotency_key text,
  p_correlation_id uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_visit public.visits%rowtype;
  v_method text;
  v_packages jsonb;
  v_payload jsonb;
  v_request jsonb;
  v_hash text;
  v_existing public.planning_process_commands%rowtype;
  v_command uuid;
  v_plan public.visit_plans%rowtype;
  v_draft_visit public.visits%rowtype;
  v_audit bigint;
  v_outbox uuid;
  v_now timestamptz:=transaction_timestamp();
  v_result jsonb;
begin
  if v_actor is null or p_visit_id is null or p_expected_version is null
     or nullif(btrim(p_idempotency_key),'') is null or p_correlation_id is null then
    raise exception using errcode='22023',message='PLANNING-DUPLICATE-REQUEST';
  end if;
  select * into v_visit from public.visits where id=p_visit_id for update;
  if not found then
    raise exception using errcode='P0002',message='PLANNING-DUPLICATE-NOT-FOUND';
  end if;
  if not public.planning_closure_factory_in_scope(v_visit.factory_id)
     or v_visit.planning_status not in ('cancelled','expired')
     or v_visit.planning_version<>p_expected_version then
    raise exception using errcode='40001',message='PLANNING-DUPLICATE-STALE';
  end if;
  select coalesce(vp.method,'single') into v_method
  from (select v_visit.visit_plan_id as id) x
  left join public.visit_plans vp on vp.id=x.id;
  if not public.planning_closure_has_explicit_capability(
    case v_method when 'bulk' then 'planning.create.bulk'
                  else 'planning.create.single' end
  ) then
    raise exception using errcode='42501',message='PLANNING-DUPLICATE-DENIED';
  end if;
  select coalesce(jsonb_agg(distinct package_id),'[]'::jsonb) into v_packages
  from (
    select v_visit.package_version_id as package_id
    union
    select vp.package_version_id from public.visit_packages vp
    where vp.visit_id=p_visit_id
  ) p where package_id is not null;
  v_payload:=case when v_method='bulk' then jsonb_build_object(
    'selection',jsonb_build_array(v_visit.factory_id),
    'config',jsonb_build_object('picks','{}'::jsonb,
      'package_version_ids',v_packages,'window_start',v_visit.window_start,
      'window_end',v_visit.window_end,'notes',v_visit.notes,
      'priority',v_visit.priority),
    'acknowledged',false,'duplicated_from',p_visit_id
  ) else jsonb_build_object(
    'target',jsonb_build_object('factory_id',v_visit.factory_id),
    'config',jsonb_build_object('visit_type',v_visit.visit_type,
      'package_version_ids',v_packages,'execution_mode',v_visit.execution_mode,
      'window_start',v_visit.window_start,'window_end',v_visit.window_end,
      'notes',v_visit.notes,'priority',v_visit.priority),
    'duplicated_from',p_visit_id
  ) end;
  v_request:=jsonb_build_object('visit_id',p_visit_id,
    'expected_version',p_expected_version,'method',v_method,'payload',v_payload);
  v_hash:=public.planning_closure_request_hash(v_request);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'planning-duplicate:'||v_actor::text||':'||p_idempotency_key,0));
  select * into v_existing from public.planning_process_commands
  where actor=v_actor and operation='duplicate_draft'
    and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>v_hash then
      raise exception using errcode='23505',
        message='PLANNING-CLOSURE-IDEMPOTENCY-CONFLICT';
    end if;
    return v_existing.result||jsonb_build_object('idempotent',true);
  end if;

  insert into public.visit_plans(
    method,status,created_by,draft_payload,draft_version,source_channel
  ) values(v_method,'draft',v_actor,v_payload,1,'planning.duplicate')
  returning * into v_plan;
  insert into public.visits(
    visit_plan_id,factory_id,visit_type,execution_mode,planning_status,
    operational_state,window_start,window_end,package_version_id,priority,
    notes,source_channel
  ) values(
    v_plan.id,v_visit.factory_id,v_visit.visit_type,v_visit.execution_mode,
    'draft','new',v_visit.window_start,v_visit.window_end,
    v_visit.package_version_id,v_visit.priority,v_visit.notes,
    'planning.duplicate'
  ) returning * into v_draft_visit;
  insert into public.planning_process_commands(
    actor,operation,idempotency_key,correlation_id,request,request_hash,
    status,target_count,applied_count,completed_at
  ) values(v_actor,'duplicate_draft',p_idempotency_key,p_correlation_id,
    v_request,v_hash,'completed',1,1,v_now) returning id into v_command;
  insert into public.visit_lifecycle_events(
    visit_id,event_type,actor,previous
  ) values(p_visit_id,'duplicate',v_actor,jsonb_build_object(
    'planning_status',v_visit.planning_status,'planning_version',v_visit.planning_version,
    'duplicated_to_plan',v_plan.id,'duplicated_to_visit',v_draft_visit.id));
  insert into public.audit_events(
    actor,object_type,object_id,action,before_state,after_state,requirement_refs
  ) values(v_actor,'visits',p_visit_id,'PLANNING_VISIT_DUPLICATE',
    to_jsonb(v_visit),jsonb_build_object('source_visit_id',p_visit_id,
      'new_plan_id',v_plan.id,'new_visit_id',v_draft_visit.id,
      'correlation_id',p_correlation_id),
    array['PLN-REQ-011','CORR-PLANNING-R01-R03-002']) returning id into v_audit;
  insert into public.workflow_outbox(
    idempotency_key,aggregate_type,aggregate_id,aggregate_version,
    side_effect_kind,payload,status,created_by
  ) values('planning:duplicate:'||p_visit_id||':'||v_plan.id,
    'plan',v_plan.id,1,'notify',jsonb_build_object(
      'operation','duplicate_draft','source_visit_id',p_visit_id,
      'new_visit_id',v_draft_visit.id,'correlation_id',p_correlation_id),
    'pending',v_actor) returning id into v_outbox;
  v_result:=jsonb_build_object('command_id',v_command,'operation','duplicate_draft',
    'source_visit_id',p_visit_id,'plan_id',v_plan.id,'visit_id',v_draft_visit.id,
    'method',v_method,'draft_version',1,'correlation_id',p_correlation_id,
    'audit_event_id',v_audit,'outbox_intent_id',v_outbox,'idempotent',false);
  update public.planning_process_commands set result=v_result where id=v_command;
  return v_result;
end
$$;

-- ---------------------------------------------------------------------------
-- S6. Dedicated scheduler roles and least-privilege function grants.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists(select 1 from pg_catalog.pg_roles where rolname='planning_expiry_owner') then
    create role planning_expiry_owner nologin noinherit;
  end if;
  if not exists(select 1 from pg_catalog.pg_roles where rolname='planning_expiry_scheduler') then
    create role planning_expiry_scheduler nologin noinherit;
  end if;
end
$$;

grant usage on schema public to planning_expiry_owner,planning_expiry_scheduler;
grant usage on schema extensions to planning_expiry_owner;
grant select,update on public.visits to planning_expiry_owner;
grant select on public.assignments,public.inspections,public.planning_visit_archives
  to planning_expiry_owner;
grant select on public.factories to planning_expiry_owner;
grant insert,select,update on public.planning_process_commands to planning_expiry_owner;
grant insert,select on public.visit_lifecycle_events,public.audit_events,
  public.workflow_outbox to planning_expiry_owner;
grant usage,select on sequence public.audit_events_id_seq
  to planning_expiry_owner;
grant execute on function public.planning_closure_request_hash(jsonb)
  to planning_expiry_owner;
grant execute on function public.expire_planning_visits_core(
  timestamptz,integer,text,uuid) to planning_expiry_scheduler;
grant planning_expiry_scheduler to postgres;

grant planning_expiry_owner to postgres;
grant create on schema public to planning_expiry_owner;
alter function public.expire_planning_visits_core(timestamptz,integer,text,uuid)
  owner to planning_expiry_owner;
alter function public.expire_planning_visits_scheduled(integer)
  owner to planning_expiry_owner;
revoke create on schema public from planning_expiry_owner;

revoke all on function public.mutate_planning_window_atomic(
  uuid[],text,timestamptz,timestamptz,jsonb,text,text,uuid)
  from public,anon,authenticated,service_role;
revoke all on function public.cancel_planning_visits_atomic(
  uuid[],jsonb,text,text,uuid) from public,anon,authenticated,service_role;
revoke all on function public.reschedule_planning_visits_atomic(
  uuid[],timestamptz,timestamptz,jsonb,text,text,uuid)
  from public,anon,authenticated,service_role;
revoke all on function public.archive_planning_draft_atomic(
  uuid,integer,text,text,uuid) from public,anon,authenticated,service_role;
revoke all on function public.create_planning_bulk_command(
  text,uuid[],jsonb,jsonb,text,uuid) from public,anon,authenticated,service_role;
revoke all on function public.planning_bulk_command_receipt(uuid)
  from public,anon,authenticated,service_role;
revoke all on function public.process_planning_bulk_target(uuid,integer)
  from public,anon,authenticated,service_role;
revoke all on function public.transition_planning_visit_atomic(
  uuid,text,jsonb,bigint,text,uuid)
  from public,anon,authenticated,service_role;
revoke all on function public.save_planning_draft_atomic(
  uuid,text,jsonb,jsonb,integer,text,uuid)
  from public,anon,authenticated,service_role;
revoke all on function public.duplicate_terminal_visit_atomic(
  uuid,bigint,text,uuid) from public,anon,authenticated,service_role;
revoke all on function public.expire_planning_visits_core(
  timestamptz,integer,text,uuid) from public,anon,authenticated,service_role;
revoke all on function public.expire_planning_visits_scheduled(integer)
  from public,anon,authenticated,service_role;

grant execute on function public.cancel_planning_visits_atomic(
  uuid[],jsonb,text,text,uuid) to authenticated;
grant execute on function public.reschedule_planning_visits_atomic(
  uuid[],timestamptz,timestamptz,jsonb,text,text,uuid) to authenticated;
grant execute on function public.archive_planning_draft_atomic(
  uuid,integer,text,text,uuid) to authenticated;
grant execute on function public.create_planning_bulk_command(
  text,uuid[],jsonb,jsonb,text,uuid) to authenticated;
grant execute on function public.planning_bulk_command_receipt(uuid) to authenticated;
grant execute on function public.process_planning_bulk_target(uuid,integer)
  to authenticated;
grant execute on function public.transition_planning_visit_atomic(
  uuid,text,jsonb,bigint,text,uuid) to authenticated;
grant execute on function public.save_planning_draft_atomic(
  uuid,text,jsonb,jsonb,integer,text,uuid) to authenticated;
grant execute on function public.duplicate_terminal_visit_atomic(
  uuid,bigint,text,uuid) to authenticated;
set role planning_expiry_owner;
revoke all on function public.expire_planning_visits_core(
  timestamptz,integer,text,uuid) from public,anon,authenticated,service_role;
revoke all on function public.expire_planning_visits_scheduled(integer)
  from public,anon,authenticated,service_role;
grant execute on function public.expire_planning_visits_core(
  timestamptz,integer,text,uuid) to planning_expiry_scheduler;
grant execute on function public.expire_planning_visits_scheduled(integer)
  to planning_expiry_scheduler;
reset role;
revoke planning_expiry_owner from postgres;

-- The existing postgres-owned legacy cron job is not rewritten here. Remote
-- cutover must create/replace a job whose username is planning_expiry_scheduler
-- only after the target proves that pg_cron can SET ROLE to the NOLOGIN
-- execution principal. Generic service_role invocation remains denied.

-- ---------------------------------------------------------------------------
-- S7. Migration postconditions. Any mismatch aborts the whole transaction.
-- ---------------------------------------------------------------------------
do $$
declare
  v_sig regprocedure;
begin
  foreach v_sig in array array[
    'public.cancel_planning_visits_atomic(uuid[],jsonb,text,text,uuid)'::regprocedure,
    'public.reschedule_planning_visits_atomic(uuid[],timestamptz,timestamptz,jsonb,text,text,uuid)'::regprocedure,
    'public.reassign_published_visits_atomic(uuid[],uuid,text,text,uuid)'::regprocedure,
    'public.archive_planning_draft_atomic(uuid,integer,text,text,uuid)'::regprocedure,
    'public.expire_planning_visits_scheduled(integer)'::regprocedure,
    'public.process_planning_bulk_target(uuid,integer)'::regprocedure
    ,'public.transition_planning_visit_atomic(uuid,text,jsonb,bigint,text,uuid)'::regprocedure
    ,'public.save_planning_draft_atomic(uuid,text,jsonb,jsonb,integer,text,uuid)'::regprocedure
    ,'public.duplicate_terminal_visit_atomic(uuid,bigint,text,uuid)'::regprocedure
  ] loop
    if has_function_privilege('service_role',v_sig,'execute') then
      raise exception using errcode='42501',
        message='PLANNING-CLOSURE-SERVICE-ROLE-EXECUTE';
    end if;
  end loop;
  if not has_function_privilege(
    'planning_expiry_scheduler',
    'public.expire_planning_visits_scheduled(integer)',
    'execute'
  ) then
    raise exception using errcode='42501',
      message='PLANNING-CLOSURE-SCHEDULER-GRANT';
  end if;
  if has_sequence_privilege(
       'planning_expiry_owner','public.plan_reference_seq','usage')
     or not has_sequence_privilege(
       'planning_expiry_owner','public.audit_events_id_seq','usage') then
    raise exception using errcode='42501',
      message='PLANNING-CLOSURE-DIRECT-ACL';
  end if;
  if exists (
    select 1 from pg_catalog.pg_policies
    where schemaname='public'
      and tablename in ('visits','visit_plans')
      and policyname in (
        'plans_read_capability','plans_write_capability',
        'plans_update_capability','visits_read_capability',
        'visits_write_capability','visits_update_capability'
      )
  ) then
    raise exception using errcode='42501',
      message='PLANNING-CLOSURE-BUSINESS-STAFF-POLICY';
  end if;
  if exists (
    select 1 from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in (
        'mutate_planning_window_atomic','cancel_planning_visits_atomic',
        'reschedule_planning_visits_atomic','reassign_published_visits_atomic',
        'archive_planning_draft_atomic',
        'expire_planning_visits_core','expire_planning_visits_scheduled',
        'create_planning_bulk_command','planning_bulk_command_receipt',
        'process_planning_bulk_target',
        'transition_planning_visit_atomic','save_planning_draft_atomic',
        'duplicate_terminal_visit_atomic',
        'planning_closure_has_explicit_capability',
        'planning_closure_factory_in_scope'
      )
      and not ('search_path=""'=any(coalesce(p.proconfig,'{}'::text[])))
  ) then
    raise exception using errcode='42501',
      message='PLANNING-CLOSURE-UNSAFE-SEARCH-PATH';
  end if;
end
$$;

comment on table public.planning_process_commands is
  'CORR-PLANNING-R01-R03-002 / ADD-R07-001 immutable command envelope. Provider delivery is not implied.';
comment on table public.planning_visit_archives is
  'SCHEMA_GAP-R01-CHILD-ARCHIVE additive provenance. Child draft status is preserved; never represented as Cancelled.';
