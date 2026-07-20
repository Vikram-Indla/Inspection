-- TASK-WEB-COMPLIANCE-REQUEST-ENGINE-002
-- CMP-REQ-CCR-001..010 · CMP-ACC-CCR-001..030
-- Additive, forward-only governed request engine. Existing regulation, item,
-- violation and penalty rows are preserved and remain readable throughout the
-- controlled cutover. No Inspector/runtime table is modified.

create sequence if not exists public.compliance_request_number_seq start 1;

create table if not exists public.compliance_configuration_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  title text not null check (btrim(title) <> ''),
  description text,
  request_type text not null check (request_type in ('create','modify')),
  owner_id uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  current_revision integer not null default 1 check (current_revision > 0),
  status text not null default 'draft' check (status in (
    'draft','pending_review','returned','partially_approved','approved','rejected','cancelled'
  )),
  comments text,
  return_reason text,
  correlation_id uuid not null default gen_random_uuid(),
  audit_references jsonb not null default '[]'::jsonb,
  publication_audit_reference bigint references public.audit_events(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.compliance_request_revisions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.compliance_configuration_requests(id),
  revision_number integer not null check (revision_number > 0),
  created_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  comments text,
  return_reason text,
  unique (request_id, revision_number)
);

create table if not exists public.compliance_request_components (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  revision_number integer not null,
  entity_kind text not null check (entity_kind in ('regulation','inspection_item','violation','penalty')),
  target_entity_id uuid,
  component_status text not null default 'draft' check (component_status in (
    'draft','pending_review','approved','returned','rejected','auto_rejected','published'
  )),
  current_value_snapshot jsonb,
  proposed_value_snapshot jsonb not null check (jsonb_typeof(proposed_value_snapshot) = 'object'),
  component_comments text,
  decision_comments text,
  decided_by uuid references public.profiles(user_id),
  decided_at timestamptz,
  created_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now(),
  unique (id, request_id, revision_number),
  foreign key (request_id, revision_number)
    references public.compliance_request_revisions(request_id, revision_number)
);

create table if not exists public.compliance_request_component_dependencies (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  revision_number integer not null,
  parent_component_id uuid not null,
  child_component_id uuid not null,
  created_at timestamptz not null default now(),
  check (parent_component_id <> child_component_id),
  unique (request_id, revision_number, parent_component_id, child_component_id),
  foreign key (parent_component_id, request_id, revision_number)
    references public.compliance_request_components(id, request_id, revision_number),
  foreign key (child_component_id, request_id, revision_number)
    references public.compliance_request_components(id, request_id, revision_number)
);

create table if not exists public.compliance_request_decisions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.compliance_configuration_requests(id),
  revision_number integer not null,
  component_id uuid references public.compliance_request_components(id),
  decision text not null check (decision in ('approve','return','reject','auto_reject','cancel')),
  comments text,
  decided_by uuid not null references public.profiles(user_id),
  decided_at timestamptz not null default now(),
  correlation_id uuid not null,
  foreign key (request_id, revision_number)
    references public.compliance_request_revisions(request_id, revision_number),
  check (decision not in ('return','reject') or nullif(btrim(comments), '') is not null)
);

-- Canonical append-only versions produced by CCR publication. entity_id is the
-- stable identity; target_legacy_id preserves compatibility without rewriting
-- any legacy table or pretending the old row was created by CCR.
create table if not exists public.compliance_entity_versions (
  id uuid primary key default gen_random_uuid(),
  entity_kind text not null check (entity_kind in ('regulation','inspection_item','violation','penalty')),
  entity_id uuid not null,
  target_legacy_id uuid,
  version_number integer not null check (version_number > 0),
  value_snapshot jsonb not null check (jsonb_typeof(value_snapshot) = 'object'),
  dependency_versions jsonb not null default '[]'::jsonb,
  request_id uuid not null references public.compliance_configuration_requests(id),
  request_revision integer not null,
  request_component_id uuid not null unique references public.compliance_request_components(id),
  published_by uuid not null references public.profiles(user_id),
  published_at timestamptz not null default now(),
  correlation_id uuid not null,
  unique (entity_kind, entity_id, version_number),
  foreign key (request_id, request_revision)
    references public.compliance_request_revisions(request_id, revision_number)
);

create table if not exists public.compliance_entity_heads (
  entity_kind text not null check (entity_kind in ('regulation','inspection_item','violation','penalty')),
  entity_id uuid not null,
  current_version_id uuid not null unique references public.compliance_entity_versions(id),
  target_legacy_id uuid,
  activated_at timestamptz not null default now(),
  primary key (entity_kind, entity_id)
);

create table if not exists public.compliance_request_publications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.compliance_configuration_requests(id),
  revision_number integer not null,
  component_id uuid not null unique references public.compliance_request_components(id),
  version_id uuid not null unique references public.compliance_entity_versions(id),
  published_by uuid not null references public.profiles(user_id),
  published_at timestamptz not null default now(),
  correlation_id uuid not null,
  foreign key (request_id, revision_number)
    references public.compliance_request_revisions(request_id, revision_number)
);

create index if not exists ix_ccr_owner_status on public.compliance_configuration_requests(owner_id, status, created_at desc);
create index if not exists ix_ccr_review_status on public.compliance_configuration_requests(status, submitted_at);
create index if not exists ix_ccr_components_revision on public.compliance_request_components(request_id, revision_number, component_status);
create index if not exists ix_ccr_dependencies_child on public.compliance_request_component_dependencies(child_component_id);
create index if not exists ix_ccr_decisions_request on public.compliance_request_decisions(request_id, revision_number, decided_at);
create index if not exists ix_compliance_versions_entity on public.compliance_entity_versions(entity_kind, entity_id, version_number desc);

comment on table public.compliance_configuration_requests is
  'Governed maker-checker envelope for Regulation, Inspection Item, Violation and Penalty configuration.';
comment on table public.compliance_entity_versions is
  'Canonical append-only CCR publication versions. Legacy configuration tables remain compatibility inputs until controlled cutover.';
comment on table public.compliance_entity_heads is
  'Atomic active-version pointer. Existing active configuration is replaced only after the complete CCR publication transaction succeeds.';

create or replace function public.ccr_is_writer()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_any_role(array['compliance_admin','form_admin']);
$$;

create or replace function public.ccr_is_reviewer()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_any_role(array['compliance_admin','reviewer']);
$$;

create or replace function public.ccr_can_read(p_request uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.compliance_configuration_requests r
    where r.id = p_request
      and (r.owner_id = auth.uid() or public.ccr_is_reviewer())
  );
$$;

alter table public.compliance_configuration_requests enable row level security;
alter table public.compliance_request_revisions enable row level security;
alter table public.compliance_request_components enable row level security;
alter table public.compliance_request_component_dependencies enable row level security;
alter table public.compliance_request_decisions enable row level security;
alter table public.compliance_entity_versions enable row level security;
alter table public.compliance_entity_heads enable row level security;
alter table public.compliance_request_publications enable row level security;

drop policy if exists ccr_requests_read on public.compliance_configuration_requests;
create policy ccr_requests_read on public.compliance_configuration_requests for select
  using (owner_id = auth.uid() or public.ccr_is_reviewer());
drop policy if exists ccr_revisions_read on public.compliance_request_revisions;
create policy ccr_revisions_read on public.compliance_request_revisions for select
  using (public.ccr_can_read(request_id));
drop policy if exists ccr_components_read on public.compliance_request_components;
create policy ccr_components_read on public.compliance_request_components for select
  using (public.ccr_can_read(request_id));
drop policy if exists ccr_dependencies_read on public.compliance_request_component_dependencies;
create policy ccr_dependencies_read on public.compliance_request_component_dependencies for select
  using (public.ccr_can_read(request_id));
drop policy if exists ccr_decisions_read on public.compliance_request_decisions;
create policy ccr_decisions_read on public.compliance_request_decisions for select
  using (public.ccr_can_read(request_id));
drop policy if exists ccr_versions_read on public.compliance_entity_versions;
create policy ccr_versions_read on public.compliance_entity_versions for select using (auth.uid() is not null);
drop policy if exists ccr_heads_read on public.compliance_entity_heads;
create policy ccr_heads_read on public.compliance_entity_heads for select using (auth.uid() is not null);
drop policy if exists ccr_publications_read on public.compliance_request_publications;
create policy ccr_publications_read on public.compliance_request_publications for select
  using (public.ccr_can_read(request_id));

-- Direct writes are intentionally absent from RLS. Every mutation goes through
-- a guarded RPC so UI hiding can never become authorization.
revoke insert, update, delete on public.compliance_configuration_requests from authenticated;
revoke insert, update, delete on public.compliance_request_revisions from authenticated;
revoke insert, update, delete on public.compliance_request_components from authenticated;
revoke insert, update, delete on public.compliance_request_component_dependencies from authenticated;
revoke insert, update, delete on public.compliance_request_decisions from authenticated;
revoke insert, update, delete on public.compliance_entity_versions from authenticated;
revoke insert, update, delete on public.compliance_entity_heads from authenticated;
revoke insert, update, delete on public.compliance_request_publications from authenticated;
grant select on public.compliance_configuration_requests, public.compliance_request_revisions,
  public.compliance_request_components, public.compliance_request_component_dependencies,
  public.compliance_request_decisions, public.compliance_entity_versions,
  public.compliance_entity_heads, public.compliance_request_publications to authenticated;

create or replace function public.ccr_append_audit(
  p_request uuid, p_action text, p_before jsonb, p_after jsonb, p_correlation uuid
) returns bigint language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
begin
  insert into public.audit_events(actor, object_type, object_id, action, before_state, after_state, requirement_refs, config_versions)
  values (auth.uid(), 'compliance_configuration_request', p_request, p_action, p_before, p_after,
          array['CMP-REQ-CCR-001','CMP-REQ-CCR-005','CMP-REQ-CCR-009'], jsonb_build_object('correlation_id', p_correlation))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.ccr_notify_reviewers(p_request uuid, p_event text, p_payload jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications(event_key, recipient, payload, channel, delivery_state, delivered_at)
  select p_event, ur.user_id, p_payload || jsonb_build_object('request_id', p_request), 'inapp', 'delivered', now()
  from public.user_roles ur
  join public.compliance_configuration_requests r on r.id=p_request
  where ur.role_key in ('reviewer','compliance_admin') and ur.user_id<>r.owner_id;
$$;

create or replace function public.ccr_notify_owner(p_request uuid, p_event text, p_payload jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications(event_key, recipient, payload, channel, delivery_state, delivered_at)
  select p_event, r.owner_id, p_payload || jsonb_build_object('request_id', p_request), 'inapp', 'delivered', now()
  from public.compliance_configuration_requests r where r.id = p_request;
$$;

create or replace function public.ccr_block_immutable_rows()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'CCR_IMMUTABLE: % rows are append-only', tg_table_name;
end $$;

drop trigger if exists trg_ccr_decisions_immutable on public.compliance_request_decisions;
create trigger trg_ccr_decisions_immutable before update or delete on public.compliance_request_decisions
for each row execute function public.ccr_block_immutable_rows();
drop trigger if exists trg_ccr_versions_immutable on public.compliance_entity_versions;
create trigger trg_ccr_versions_immutable before update or delete on public.compliance_entity_versions
for each row execute function public.ccr_block_immutable_rows();
drop trigger if exists trg_ccr_publications_immutable on public.compliance_request_publications;
create trigger trg_ccr_publications_immutable before update or delete on public.compliance_request_publications
for each row execute function public.ccr_block_immutable_rows();

create or replace function public.ccr_guard_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then raise exception 'CCR_IMMUTABLE: revisions cannot be deleted'; end if;
  if old.submitted_at is not null then raise exception 'CCR_IMMUTABLE: submitted revision % cannot be edited', old.revision_number; end if;
  return new;
end $$;
drop trigger if exists trg_ccr_revision_guard on public.compliance_request_revisions;
create trigger trg_ccr_revision_guard before update or delete on public.compliance_request_revisions
for each row execute function public.ccr_guard_revision();

create or replace function public.ccr_guard_component()
returns trigger language plpgsql set search_path = '' as $$
declare v_submitted timestamptz;
begin
  if tg_op = 'DELETE' then
    select submitted_at into v_submitted from public.compliance_request_revisions
      where request_id = old.request_id and revision_number = old.revision_number;
    if v_submitted is not null then raise exception 'CCR_IMMUTABLE: submitted components cannot be deleted'; end if;
    return old;
  end if;
  select submitted_at into v_submitted from public.compliance_request_revisions
    where request_id = old.request_id and revision_number = old.revision_number;
  if v_submitted is not null and (
    new.request_id is distinct from old.request_id or new.revision_number is distinct from old.revision_number
    or new.entity_kind is distinct from old.entity_kind or new.target_entity_id is distinct from old.target_entity_id
    or new.current_value_snapshot is distinct from old.current_value_snapshot
    or new.proposed_value_snapshot is distinct from old.proposed_value_snapshot
    or new.component_comments is distinct from old.component_comments
    or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at
  ) then raise exception 'CCR_IMMUTABLE: submitted component content cannot be edited'; end if;
  return new;
end $$;
drop trigger if exists trg_ccr_component_guard on public.compliance_request_components;
create trigger trg_ccr_component_guard before update or delete on public.compliance_request_components
for each row execute function public.ccr_guard_component();

create or replace function public.ccr_guard_dependency()
returns trigger language plpgsql set search_path = '' as $$
declare v_request uuid := coalesce(new.request_id, old.request_id); v_revision integer := coalesce(new.revision_number, old.revision_number); v_submitted timestamptz;
begin
  select submitted_at into v_submitted from public.compliance_request_revisions where request_id = v_request and revision_number = v_revision;
  if v_submitted is not null then raise exception 'CCR_IMMUTABLE: submitted dependency graphs cannot be edited'; end if;
  return coalesce(new, old);
end $$;
drop trigger if exists trg_ccr_dependency_guard on public.compliance_request_component_dependencies;
create trigger trg_ccr_dependency_guard before update or delete on public.compliance_request_component_dependencies
for each row execute function public.ccr_guard_dependency();

-- Existing generic audit table/trigger engine is reused; no second audit store.
do $$ declare t text;
begin
  foreach t in array array[
    'compliance_configuration_requests','compliance_request_revisions','compliance_request_components',
    'compliance_request_component_dependencies','compliance_request_decisions','compliance_entity_versions',
    'compliance_request_publications'
  ] loop
    execute format('drop trigger if exists trg_audit_%I on public.%I', t, t);
    execute format('create trigger trg_audit_%I after insert or update or delete on public.%I for each row execute function public.audit_row_change()', t, t);
  end loop;
end $$;

create or replace function public.create_compliance_request(
  p_title text, p_description text, p_request_type text, p_comments text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_number text; v_corr uuid := gen_random_uuid();
begin
  if not public.ccr_is_writer() then raise exception 'CCR_NOT_AUTHORIZED'; end if;
  if nullif(btrim(p_title), '') is null then raise exception 'CCR_TITLE_REQUIRED'; end if;
  if p_request_type not in ('create','modify') then raise exception 'CCR_REQUEST_TYPE_INVALID'; end if;
  v_number := 'CCR-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.compliance_request_number_seq')::text, 6, '0');
  insert into public.compliance_configuration_requests(request_number,title,description,request_type,owner_id,comments,correlation_id)
  values(v_number,btrim(p_title),nullif(btrim(p_description),''),p_request_type,auth.uid(),nullif(btrim(p_comments),''),v_corr)
  returning id into v_id;
  insert into public.compliance_request_revisions(request_id,revision_number,created_by,comments)
  values(v_id,1,auth.uid(),nullif(btrim(p_comments),''));
  perform public.ccr_append_audit(v_id,'CCR_CREATED',null,jsonb_build_object('request_number',v_number,'revision',1),v_corr);
  return v_id;
end $$;

create or replace function public.update_compliance_request_draft(
  p_request uuid, p_title text, p_description text, p_comments text
) returns void language plpgsql security definer set search_path = '' as $$
declare v public.compliance_configuration_requests%rowtype;
begin
  select * into v from public.compliance_configuration_requests where id=p_request for update;
  if v.owner_id <> auth.uid() or not public.ccr_is_writer() then raise exception 'CCR_NOT_AUTHORIZED'; end if;
  if v.status <> 'draft' then raise exception 'CCR_NOT_EDITABLE'; end if;
  if nullif(btrim(p_title),'') is null then raise exception 'CCR_TITLE_REQUIRED'; end if;
  update public.compliance_configuration_requests set title=btrim(p_title), description=nullif(btrim(p_description),''), comments=nullif(btrim(p_comments),''), updated_at=now() where id=p_request;
  update public.compliance_request_revisions set comments=nullif(btrim(p_comments),'') where request_id=p_request and revision_number=v.current_revision;
end $$;

create or replace function public.add_compliance_request_component(
  p_request uuid, p_entity_kind text, p_target_entity_id uuid,
  p_current_snapshot jsonb, p_proposed_snapshot jsonb, p_comments text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v public.compliance_configuration_requests%rowtype; v_id uuid;
begin
  select * into v from public.compliance_configuration_requests where id=p_request for update;
  if v.owner_id <> auth.uid() or not public.ccr_is_writer() then raise exception 'CCR_NOT_AUTHORIZED'; end if;
  if v.status <> 'draft' then raise exception 'CCR_NOT_EDITABLE'; end if;
  if p_entity_kind not in ('regulation','inspection_item','violation','penalty') then raise exception 'CCR_COMPONENT_KIND_INVALID'; end if;
  if jsonb_typeof(p_proposed_snapshot) is distinct from 'object' then raise exception 'CCR_PROPOSED_SNAPSHOT_REQUIRED'; end if;
  if v.request_type='modify' and p_target_entity_id is null then raise exception 'CCR_MODIFY_TARGET_REQUIRED'; end if;
  insert into public.compliance_request_components(request_id,revision_number,entity_kind,target_entity_id,current_value_snapshot,proposed_value_snapshot,component_comments,created_by)
  values(p_request,v.current_revision,p_entity_kind,p_target_entity_id,p_current_snapshot,p_proposed_snapshot,nullif(btrim(p_comments),''),auth.uid()) returning id into v_id;
  return v_id;
end $$;

create or replace function public.add_compliance_request_dependency(
  p_request uuid, p_parent uuid, p_child uuid
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v public.compliance_configuration_requests%rowtype; v_id uuid; v_cycle boolean;
begin
  select * into v from public.compliance_configuration_requests where id=p_request for update;
  if v.owner_id <> auth.uid() or not public.ccr_is_writer() then raise exception 'CCR_NOT_AUTHORIZED'; end if;
  if v.status <> 'draft' then raise exception 'CCR_NOT_EDITABLE'; end if;
  if p_parent=p_child then raise exception 'CCR_DEPENDENCY_SELF'; end if;
  if not exists(select 1 from public.compliance_request_components where id=p_parent and request_id=p_request and revision_number=v.current_revision)
     or not exists(select 1 from public.compliance_request_components where id=p_child and request_id=p_request and revision_number=v.current_revision)
  then raise exception 'CCR_DEPENDENCY_COMPONENT_MISMATCH'; end if;
  with recursive descendants(id) as (
    select child_component_id from public.compliance_request_component_dependencies where parent_component_id=p_child and request_id=p_request and revision_number=v.current_revision
    union
    select d.child_component_id from public.compliance_request_component_dependencies d join descendants x on d.parent_component_id=x.id
      where d.request_id=p_request and d.revision_number=v.current_revision
  ) select exists(select 1 from descendants where id=p_parent) into v_cycle;
  if v_cycle then raise exception 'CCR_DEPENDENCY_CYCLE'; end if;
  insert into public.compliance_request_component_dependencies(request_id,revision_number,parent_component_id,child_component_id)
  values(p_request,v.current_revision,p_parent,p_child) returning id into v_id;
  return v_id;
end $$;

create or replace function public.submit_compliance_request(p_request uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v public.compliance_configuration_requests%rowtype; v_count integer; v_audit bigint;
begin
  select * into v from public.compliance_configuration_requests where id=p_request for update;
  if v.owner_id <> auth.uid() or not public.ccr_is_writer() then raise exception 'CCR_NOT_AUTHORIZED'; end if;
  if v.status <> 'draft' then raise exception 'CCR_NOT_SUBMITTABLE'; end if;
  select count(*) into v_count from public.compliance_request_components where request_id=p_request and revision_number=v.current_revision;
  if v_count=0 then raise exception 'CCR_COMPONENT_REQUIRED'; end if;
  update public.compliance_request_revisions set submitted_at=now() where request_id=p_request and revision_number=v.current_revision;
  update public.compliance_request_components set component_status='pending_review' where request_id=p_request and revision_number=v.current_revision and component_status='draft';
  update public.compliance_configuration_requests set status='pending_review',submitted_at=now(),return_reason=null,updated_at=now() where id=p_request;
  v_audit := public.ccr_append_audit(p_request,'CCR_SUBMITTED',jsonb_build_object('status',v.status),jsonb_build_object('status','pending_review','revision',v.current_revision),v.correlation_id);
  update public.compliance_configuration_requests set audit_references=audit_references || to_jsonb(v_audit) where id=p_request;
  perform public.ccr_notify_reviewers(p_request,'compliance_request_submitted',jsonb_build_object('request_number',v.request_number,'revision',v.current_revision));
end $$;

create or replace function public.revise_compliance_request(p_request uuid, p_comments text default null)
returns integer language plpgsql security definer set search_path = '' as $$
declare v public.compliance_configuration_requests%rowtype; v_new integer; c record; v_new_id uuid; v_map jsonb := '{}'::jsonb;
begin
  select * into v from public.compliance_configuration_requests where id=p_request for update;
  if v.owner_id <> auth.uid() or not public.ccr_is_writer() then raise exception 'CCR_NOT_AUTHORIZED'; end if;
  if v.status <> 'returned' then raise exception 'CCR_REVISION_REQUIRES_RETURNED'; end if;
  v_new := v.current_revision + 1;
  insert into public.compliance_request_revisions(request_id,revision_number,created_by,comments)
  values(p_request,v_new,auth.uid(),nullif(btrim(p_comments),''));
  for c in select * from public.compliance_request_components where request_id=p_request and revision_number=v.current_revision order by created_at,id loop
    insert into public.compliance_request_components(request_id,revision_number,entity_kind,target_entity_id,component_status,current_value_snapshot,proposed_value_snapshot,component_comments,created_by)
    values(p_request,v_new,c.entity_kind,c.target_entity_id,'draft',c.current_value_snapshot,c.proposed_value_snapshot,c.component_comments,auth.uid()) returning id into v_new_id;
    v_map := v_map || jsonb_build_object(c.id::text,v_new_id::text);
  end loop;
  insert into public.compliance_request_component_dependencies(request_id,revision_number,parent_component_id,child_component_id)
  select p_request,v_new,(v_map->>d.parent_component_id::text)::uuid,(v_map->>d.child_component_id::text)::uuid
  from public.compliance_request_component_dependencies d where d.request_id=p_request and d.revision_number=v.current_revision;
  update public.compliance_configuration_requests set current_revision=v_new,status='draft',return_reason=null,submitted_at=null,comments=nullif(btrim(p_comments),''),updated_at=now() where id=p_request;
  perform public.ccr_append_audit(p_request,'CCR_REVISION_CREATED',jsonb_build_object('revision',v.current_revision),jsonb_build_object('revision',v_new),v.correlation_id);
  return v_new;
end $$;

create or replace function public.ccr_recalculate_status(p_request uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_revision integer; v_pending integer; v_approved integer; v_rejected integer; v_total integer; v_status text;
begin
  select current_revision into v_revision from public.compliance_configuration_requests where id=p_request;
  select count(*),count(*) filter(where component_status='pending_review'),count(*) filter(where component_status='approved'),
         count(*) filter(where component_status in ('rejected','auto_rejected'))
  into v_total,v_pending,v_approved,v_rejected from public.compliance_request_components where request_id=p_request and revision_number=v_revision;
  v_status := case when v_pending>0 then 'pending_review' when v_approved=v_total then 'approved'
                   when v_rejected=v_total then 'rejected' when v_approved>0 and v_rejected>0 then 'partially_approved'
                   else 'pending_review' end;
  update public.compliance_configuration_requests set status=v_status,updated_at=now() where id=p_request;
  return v_status;
end $$;

create or replace function public.decide_compliance_request_component(
  p_component uuid, p_decision text, p_comments text default null
) returns text language plpgsql security definer set search_path = '' as $$
declare c public.compliance_request_components%rowtype; r public.compliance_configuration_requests%rowtype; v_status text; d record;
begin
  if not public.ccr_is_reviewer() then raise exception 'CCR_REVIEW_NOT_AUTHORIZED'; end if;
  select * into c from public.compliance_request_components where id=p_component for update;
  select * into r from public.compliance_configuration_requests where id=c.request_id for update;
  if r.owner_id=auth.uid() then raise exception 'CCR_MAKER_CHECKER'; end if;
  if c.revision_number<>r.current_revision or c.component_status<>'pending_review' then raise exception 'CCR_COMPONENT_NOT_REVIEWABLE'; end if;
  if p_decision not in ('approve','reject') then raise exception 'CCR_DECISION_INVALID'; end if;
  if p_decision='reject' and nullif(btrim(p_comments),'') is null then raise exception 'CCR_COMMENT_REQUIRED'; end if;
  update public.compliance_request_components set component_status=case when p_decision='approve' then 'approved' else 'rejected' end,
    decision_comments=nullif(btrim(p_comments),''),decided_by=auth.uid(),decided_at=now() where id=p_component;
  insert into public.compliance_request_decisions(request_id,revision_number,component_id,decision,comments,decided_by,correlation_id)
  values(c.request_id,c.revision_number,c.id,p_decision,nullif(btrim(p_comments),''),auth.uid(),r.correlation_id);
  if p_decision='reject' then
    for d in with recursive descendants(id) as (
      select child_component_id from public.compliance_request_component_dependencies where parent_component_id=p_component and request_id=c.request_id and revision_number=c.revision_number
      union select x.child_component_id from public.compliance_request_component_dependencies x join descendants q on x.parent_component_id=q.id
        where x.request_id=c.request_id and x.revision_number=c.revision_number
    ) select id from descendants loop
      update public.compliance_request_components set component_status='auto_rejected',decision_comments='Parent component rejected',decided_by=auth.uid(),decided_at=now()
      where id=d.id and component_status='pending_review';
      if found then insert into public.compliance_request_decisions(request_id,revision_number,component_id,decision,comments,decided_by,correlation_id)
        values(c.request_id,c.revision_number,d.id,'auto_reject','Parent component rejected',auth.uid(),r.correlation_id); end if;
    end loop;
  end if;
  v_status := public.ccr_recalculate_status(c.request_id);
  perform public.ccr_append_audit(c.request_id,'CCR_COMPONENT_'||upper(p_decision),null,jsonb_build_object('component_id',c.id,'status',v_status),r.correlation_id);
  if v_status in ('approved','partially_approved','rejected') then
    perform public.ccr_notify_owner(c.request_id,'compliance_request_'||v_status,
      jsonb_build_object('request_number',r.request_number,'revision',r.current_revision,'status',v_status));
  end if;
  return v_status;
end $$;

create or replace function public.return_compliance_request(p_request uuid, p_comments text)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.compliance_configuration_requests%rowtype;
begin
  if not public.ccr_is_reviewer() then raise exception 'CCR_REVIEW_NOT_AUTHORIZED'; end if;
  if nullif(btrim(p_comments),'') is null then raise exception 'CCR_COMMENT_REQUIRED'; end if;
  select * into r from public.compliance_configuration_requests where id=p_request for update;
  if r.owner_id=auth.uid() then raise exception 'CCR_MAKER_CHECKER'; end if;
  if r.status not in ('pending_review','partially_approved') then raise exception 'CCR_NOT_RETURNABLE'; end if;
  update public.compliance_request_components set component_status='returned',decision_comments=btrim(p_comments),decided_by=auth.uid(),decided_at=now()
    where request_id=p_request and revision_number=r.current_revision and component_status in ('pending_review','approved');
  update public.compliance_configuration_requests set status='returned',return_reason=btrim(p_comments),updated_at=now() where id=p_request;
  insert into public.compliance_request_decisions(request_id,revision_number,decision,comments,decided_by,correlation_id)
  values(p_request,r.current_revision,'return',btrim(p_comments),auth.uid(),r.correlation_id);
  perform public.ccr_append_audit(p_request,'CCR_RETURNED',jsonb_build_object('status',r.status),jsonb_build_object('status','returned','reason',btrim(p_comments)),r.correlation_id);
  perform public.ccr_notify_owner(p_request,'compliance_request_returned',jsonb_build_object('request_number',r.request_number,'reason',btrim(p_comments)));
end $$;

create or replace function public.reject_compliance_request(p_request uuid, p_comments text)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.compliance_configuration_requests%rowtype;
begin
  if not public.ccr_is_reviewer() then raise exception 'CCR_REVIEW_NOT_AUTHORIZED'; end if;
  if nullif(btrim(p_comments),'') is null then raise exception 'CCR_COMMENT_REQUIRED'; end if;
  select * into r from public.compliance_configuration_requests where id=p_request for update;
  if r.owner_id=auth.uid() then raise exception 'CCR_MAKER_CHECKER'; end if;
  if r.status not in ('pending_review','partially_approved') then raise exception 'CCR_NOT_REJECTABLE'; end if;
  update public.compliance_request_components set component_status='rejected',decision_comments=btrim(p_comments),decided_by=auth.uid(),decided_at=now()
    where request_id=p_request and revision_number=r.current_revision and component_status in ('pending_review','approved');
  update public.compliance_configuration_requests set status='rejected',return_reason=btrim(p_comments),updated_at=now() where id=p_request;
  insert into public.compliance_request_decisions(request_id,revision_number,decision,comments,decided_by,correlation_id)
  values(p_request,r.current_revision,'reject',btrim(p_comments),auth.uid(),r.correlation_id);
  perform public.ccr_append_audit(p_request,'CCR_REJECTED',jsonb_build_object('status',r.status),jsonb_build_object('status','rejected','reason',btrim(p_comments)),r.correlation_id);
  perform public.ccr_notify_owner(p_request,'compliance_request_rejected',jsonb_build_object('request_number',r.request_number,'reason',btrim(p_comments)));
end $$;

create or replace function public.cancel_compliance_request(p_request uuid, p_comments text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.compliance_configuration_requests%rowtype;
begin
  select * into r from public.compliance_configuration_requests where id=p_request for update;
  if r.owner_id<>auth.uid() or not public.ccr_is_writer() then raise exception 'CCR_NOT_AUTHORIZED'; end if;
  if r.status not in ('draft','returned') then raise exception 'CCR_NOT_CANCELLABLE'; end if;
  update public.compliance_configuration_requests set status='cancelled',comments=coalesce(nullif(btrim(p_comments),''),comments),updated_at=now() where id=p_request;
  insert into public.compliance_request_decisions(request_id,revision_number,decision,comments,decided_by,correlation_id)
  values(p_request,r.current_revision,'cancel',nullif(btrim(p_comments),''),auth.uid(),r.correlation_id);
  perform public.ccr_append_audit(p_request,'CCR_CANCELLED',jsonb_build_object('status',r.status),jsonb_build_object('status','cancelled'),r.correlation_id);
end $$;

create or replace function public.publish_compliance_request(p_request uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.compliance_configuration_requests%rowtype; c record; v_entity uuid; v_next integer; v_version uuid; v_dependencies jsonb; v_count integer:=0; v_audit bigint; v_event text;
begin
  if not public.ccr_is_reviewer() then raise exception 'CCR_PUBLISH_NOT_AUTHORIZED'; end if;
  select * into r from public.compliance_configuration_requests where id=p_request for update;
  if r.owner_id=auth.uid() then raise exception 'CCR_MAKER_CHECKER'; end if;
  if r.status not in ('approved','partially_approved') then raise exception 'CCR_NOT_PUBLISHABLE'; end if;

  -- Dependency closure and orphan prevention are evaluated before any version
  -- insert. External existing-version references permit a child-only modify.
  if exists(
    select 1 from public.compliance_request_components child
    join public.compliance_request_component_dependencies d on d.child_component_id=child.id
    join public.compliance_request_components parent on parent.id=d.parent_component_id
    where child.request_id=p_request and child.revision_number=r.current_revision and child.component_status='approved'
      and parent.component_status not in ('approved','published')
  ) then raise exception 'CCR_DEPENDENCY_NOT_APPROVED'; end if;
  if exists(
    select 1 from public.compliance_request_components candidate
    where candidate.request_id=p_request and candidate.revision_number=r.current_revision and candidate.component_status='approved' and (
      (candidate.entity_kind='inspection_item' and not (candidate.proposed_value_snapshot ? 'regulation_version_id') and not exists(
        select 1 from public.compliance_request_component_dependencies d join public.compliance_request_components p on p.id=d.parent_component_id
        where d.child_component_id=candidate.id and p.entity_kind='regulation' and p.component_status in ('approved','published')))
      or (candidate.entity_kind='violation' and not (candidate.proposed_value_snapshot ? 'inspection_item_version_id') and not exists(
        select 1 from public.compliance_request_component_dependencies d join public.compliance_request_components p on p.id=d.parent_component_id
        where d.child_component_id=candidate.id and p.entity_kind='inspection_item' and p.component_status in ('approved','published')))
      or (candidate.entity_kind='penalty' and not (candidate.proposed_value_snapshot ? 'violation_version_id') and not exists(
        select 1 from public.compliance_request_component_dependencies d join public.compliance_request_components p on p.id=d.parent_component_id
        where d.child_component_id=candidate.id and p.entity_kind='violation' and p.component_status in ('approved','published')))
    )
  ) then raise exception 'CCR_ORPHAN_COMPONENT'; end if;

  -- Fixed kind order is the deterministic topological order for the canonical
  -- Regulation → Item → Violation → Penalty chain. The enclosing RPC call is a
  -- single PostgreSQL transaction: any error rolls back every inserted version
  -- and head switch, leaving existing active configuration unchanged.
  for c in
    select * from public.compliance_request_components
    where request_id=p_request and revision_number=r.current_revision and component_status='approved'
    order by case entity_kind when 'regulation' then 1 when 'inspection_item' then 2 when 'violation' then 3 else 4 end, created_at, id
    for update
  loop
    v_entity := coalesce(c.target_entity_id,c.id);
    select coalesce(max(version_number),0)+1 into v_next from public.compliance_entity_versions where entity_kind=c.entity_kind and entity_id=v_entity;
    select coalesce(jsonb_agg(jsonb_build_object('component_id',p.id,'entity_kind',p.entity_kind,'version_id',v.id) order by p.entity_kind,p.id),'[]'::jsonb)
      into v_dependencies
      from public.compliance_request_component_dependencies d
      join public.compliance_request_components p on p.id=d.parent_component_id
      join public.compliance_entity_versions v on v.request_component_id=p.id
      where d.child_component_id=c.id;
    insert into public.compliance_entity_versions(entity_kind,entity_id,target_legacy_id,version_number,value_snapshot,dependency_versions,request_id,request_revision,request_component_id,published_by,correlation_id)
    values(c.entity_kind,v_entity,c.target_entity_id,v_next,c.proposed_value_snapshot,v_dependencies,p_request,r.current_revision,c.id,auth.uid(),r.correlation_id)
    returning id into v_version;
    insert into public.compliance_entity_heads(entity_kind,entity_id,current_version_id,target_legacy_id,activated_at)
    values(c.entity_kind,v_entity,v_version,c.target_entity_id,now())
    on conflict(entity_kind,entity_id) do update set current_version_id=excluded.current_version_id,target_legacy_id=excluded.target_legacy_id,activated_at=excluded.activated_at;
    insert into public.compliance_request_publications(request_id,revision_number,component_id,version_id,published_by,correlation_id)
    values(p_request,r.current_revision,c.id,v_version,auth.uid(),r.correlation_id);
    update public.compliance_request_components set component_status='published' where id=c.id;
    v_count:=v_count+1;
  end loop;
  if v_count=0 then raise exception 'CCR_NO_APPROVED_COMPONENTS'; end if;
  v_audit:=public.ccr_append_audit(p_request,'CCR_PUBLISHED',null,jsonb_build_object('revision',r.current_revision,'component_count',v_count,'status',r.status),r.correlation_id);
  update public.compliance_configuration_requests set publication_audit_reference=v_audit,audit_references=audit_references||to_jsonb(v_audit),updated_at=now() where id=p_request;
  v_event:='compliance_request_published';
  perform public.ccr_notify_owner(p_request,v_event,jsonb_build_object('request_number',r.request_number,'revision',r.current_revision,'published_components',v_count));
  return jsonb_build_object('request_id',p_request,'revision',r.current_revision,'published_components',v_count,'status',r.status,'audit_reference',v_audit);
end $$;

revoke all on function public.create_compliance_request(text,text,text,text) from public;
revoke all on function public.update_compliance_request_draft(uuid,text,text,text) from public;
revoke all on function public.add_compliance_request_component(uuid,text,uuid,jsonb,jsonb,text) from public;
revoke all on function public.add_compliance_request_dependency(uuid,uuid,uuid) from public;
revoke all on function public.submit_compliance_request(uuid) from public;
revoke all on function public.revise_compliance_request(uuid,text) from public;
revoke all on function public.decide_compliance_request_component(uuid,text,text) from public;
revoke all on function public.return_compliance_request(uuid,text) from public;
revoke all on function public.reject_compliance_request(uuid,text) from public;
revoke all on function public.cancel_compliance_request(uuid,text) from public;
revoke all on function public.publish_compliance_request(uuid) from public;
grant execute on function public.create_compliance_request(text,text,text,text) to authenticated;
grant execute on function public.update_compliance_request_draft(uuid,text,text,text) to authenticated;
grant execute on function public.add_compliance_request_component(uuid,text,uuid,jsonb,jsonb,text) to authenticated;
grant execute on function public.add_compliance_request_dependency(uuid,uuid,uuid) to authenticated;
grant execute on function public.submit_compliance_request(uuid) to authenticated;
grant execute on function public.revise_compliance_request(uuid,text) to authenticated;
grant execute on function public.decide_compliance_request_component(uuid,text,text) to authenticated;
grant execute on function public.return_compliance_request(uuid,text) to authenticated;
grant execute on function public.reject_compliance_request(uuid,text) to authenticated;
grant execute on function public.cancel_compliance_request(uuid,text) to authenticated;
grant execute on function public.publish_compliance_request(uuid) to authenticated;

-- PostgreSQL grants function execution to PUBLIC by default. Internal helpers
-- remain callable only from the SECURITY DEFINER contracts above.
revoke all on function public.ccr_append_audit(uuid,text,jsonb,jsonb,uuid) from public, authenticated;
revoke all on function public.ccr_notify_owner(uuid,text,jsonb) from public, authenticated;
revoke all on function public.ccr_notify_reviewers(uuid,text,jsonb) from public, authenticated;
revoke all on function public.ccr_recalculate_status(uuid) from public, authenticated;
revoke all on function public.ccr_block_immutable_rows() from public, authenticated;
revoke all on function public.ccr_guard_revision() from public, authenticated;
revoke all on function public.ccr_guard_component() from public, authenticated;
revoke all on function public.ccr_guard_dependency() from public, authenticated;
revoke all on function public.ccr_is_writer() from public;
revoke all on function public.ccr_is_reviewer() from public;
revoke all on function public.ccr_can_read(uuid) from public;
grant execute on function public.ccr_is_writer() to authenticated;
grant execute on function public.ccr_is_reviewer() to authenticated;
grant execute on function public.ccr_can_read(uuid) to authenticated;

-- Compatibility surface: consumers can reconcile CCR-managed active heads with
-- legacy stable IDs without changing any existing table or historical snapshot.
create or replace view public.compliance_configuration_compatibility with (security_invoker = true) as
select h.entity_kind,h.entity_id,h.target_legacy_id,h.current_version_id,v.version_number,
       v.value_snapshot,v.dependency_versions,v.published_at,v.request_id,v.request_revision
from public.compliance_entity_heads h join public.compliance_entity_versions v on v.id=h.current_version_id;
grant select on public.compliance_configuration_compatibility to authenticated;
