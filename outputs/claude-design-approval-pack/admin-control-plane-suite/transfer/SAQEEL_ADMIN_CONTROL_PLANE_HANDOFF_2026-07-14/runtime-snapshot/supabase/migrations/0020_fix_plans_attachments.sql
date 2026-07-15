-- ============================================================================
-- Migration 0020 — FIX WAVE F4: visit attachments (M02-042) + storage bucket.
-- visit_attachments: planner/ops write, authenticated read, soft delete via
-- removed_at (files never destroyed — audit-safe). Bucket 'attachments' is
-- private; downloads go through signed URLs minted under the caller's session.
-- RLS everywhere; audit trigger reused from 0002 (ENG-12).
-- ============================================================================

create table visit_attachments (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references visits(id),
  name text not null,
  mime text not null,
  storage_path text unique not null,
  uploaded_by uuid references profiles(user_id),
  uploaded_at timestamptz not null default now(),
  removed_at timestamptz,                          -- soft delete (M02-042) — row + file retained
  removed_by uuid references profiles(user_id)
);
create index visit_attachments_visit on visit_attachments(visit_id);

alter table visit_attachments enable row level security;

-- Read: any authenticated user whose RLS lets them see the visit can list its
-- attachments (visit visibility itself is governed by inspector_own_visits).
create policy va_read on visit_attachments for select
  using (auth.uid() is not null);
-- Write: planner/ops only (M02-042 — visit management is a planner/ops surface).
create policy va_insert on visit_attachments for insert
  with check (has_any_role(array['planner','ops']) and uploaded_by = auth.uid());
-- Soft delete = UPDATE setting removed_at; same planner/ops scope. No DELETE policy: rows are never hard-deleted.
create policy va_update on visit_attachments for update
  using (has_any_role(array['planner','ops']));

-- ENG-12 — append-only audit on attachment lifecycle
create trigger trg_audit_visit_attachments
  after insert or update or delete on visit_attachments
  for each row execute function audit_row_change();

-- ---------- storage bucket 'attachments' (private) ----------
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Object policies mirror the table: planner/ops upload, authenticated read
-- (downloads are signed-URL based, still gated by this SELECT policy).
create policy attachments_objects_read on storage.objects for select
  using (bucket_id = 'attachments' and auth.uid() is not null);
create policy attachments_objects_insert on storage.objects for insert
  with check (bucket_id = 'attachments' and has_any_role(array['planner','ops']));
