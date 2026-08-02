-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- Reopening notices — SAQEEL PWA-Field Reopening Notices.dc.html
-- REQUIREMENT_BASELINE.csv contains NO "reopening notice" row; the governing
-- row is CR-286 "Assign Action Form Type" (form type is configuration-driven),
-- under which Shutdown — the closure half this design pairs with — is governed.
-- Applied at the Product Owner's direction, 2026-07-26.
-- Every column is derived from a control that exists in the design. No due
-- date, SLA, priority, retention rule or closure FK is invented (this schema
-- has no closure record table). Additive only; reuses has_any_role /
-- is_assigned_inspector / audit_row_change.

create table public.reopening_notices (
  id uuid primary key default gen_random_uuid(),
  visit_id   uuid not null references public.visits(id),
  factory_id uuid references public.factories(id),
  notice_type text not null check (notice_type in ('production_line', 'factory')),
  report_number text,
  report_date   date,
  representative_absent boolean not null default false,
  absence_reason        text,
  signature             jsonb,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  created_by   uuid not null references public.profiles(user_id) default auth.uid(),
  created_at   timestamptz not null default now(),
  submitted_at timestamptz,
  unique (visit_id, notice_type),
  constraint reopening_notice_attendance_ck check (
    case when representative_absent then signature is null
         else absence_reason is null end
  ),
  constraint reopening_notice_submitted_ck check (
    status <> 'submitted'
    or (report_number is not null and report_date is not null and submitted_at is not null)
  )
);

comment on table public.reopening_notices is
  'Field-captured reopening notice (SAQEEL PWA-Field Reopening Notices.dc.html). Persisted under CR-286 "Assign Action Form Type" (form type is configuration-driven); no dedicated reopening requirement exists in REQUIREMENT_BASELINE.csv. No closure FK: this schema has no closure record table.';

create table public.reopening_notice_lines (
  notice_id               uuid not null references public.reopening_notices(id) on delete cascade,
  production_line_item_id uuid not null references public.plant_production_line_items(id),
  primary key (notice_id, production_line_item_id)
);

create or replace function public.reopening_notice_line_type_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select notice_type from public.reopening_notices where id = new.notice_id)
     is distinct from 'production_line' then
    raise exception 'Production lines may only be attached to a production_line reopening notice';
  end if;
  return new;
end;
$$;

create trigger trg_reopening_notice_line_type
  before insert or update on public.reopening_notice_lines
  for each row execute function public.reopening_notice_line_type_guard();

alter table public.reopening_notices      enable row level security;
alter table public.reopening_notice_lines enable row level security;

create policy reopening_notices_read on public.reopening_notices for select
  using (has_any_role(array['inspector','planner','ops','compliance_admin','auditor','reviewer','leadership']));

create policy reopening_notices_insert on public.reopening_notices for insert
  with check (
    has_any_role(array['inspector'])
    and created_by = auth.uid()
    and is_assigned_inspector(visit_id)
  );

create policy reopening_notices_update on public.reopening_notices for update
  using (
    has_any_role(array['inspector'])
    and created_by = auth.uid()
    and is_assigned_inspector(visit_id)
    and status = 'draft'
  )
  with check (
    created_by = auth.uid()
    and is_assigned_inspector(visit_id)
  );

create policy reopening_notice_lines_read on public.reopening_notice_lines for select
  using (exists (select 1 from public.reopening_notices n where n.id = notice_id));

create policy reopening_notice_lines_write on public.reopening_notice_lines for all
  using (
    exists (
      select 1 from public.reopening_notices n
      where n.id = notice_id
        and n.created_by = auth.uid()
        and n.status = 'draft'
        and is_assigned_inspector(n.visit_id)
    )
  )
  with check (
    exists (
      select 1 from public.reopening_notices n
      where n.id = notice_id
        and n.created_by = auth.uid()
        and n.status = 'draft'
        and is_assigned_inspector(n.visit_id)
    )
  );

create trigger trg_audit_reopening_notices
  after insert or update or delete on public.reopening_notices
  for each row execute function audit_row_change();

create trigger trg_audit_reopening_notice_lines
  after insert or update or delete on public.reopening_notice_lines
  for each row execute function audit_row_change();

create index idx_reopening_notices_visit      on public.reopening_notices(visit_id);
create index idx_reopening_notices_factory    on public.reopening_notices(factory_id);
create index idx_reopening_notices_created_by on public.reopening_notices(created_by);
create index idx_reopening_notice_lines_line  on public.reopening_notice_lines(production_line_item_id);
