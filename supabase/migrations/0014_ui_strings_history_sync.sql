-- ============================================================================
-- Migration 0014 — Localization history + sync semantics (SB19)
-- 1. ui_string_revisions: trigger-written snapshot of every change (full
--    history kept; panel displays the recent few). Same append-only DNA as
--    the audit trail — revisions are never edited or deleted by the app.
-- 2. EN-drift rule: when the English source changes, a 'reviewed' Arabic is
--    no longer reviewed — status auto-downgrades to 'draft' in the trigger.
-- 3. Orphan flag: keys removed from code are flagged by sync, never deleted.
-- ============================================================================

alter table ui_strings add column if not exists orphaned boolean not null default false;

create table if not exists ui_string_revisions (
  id uuid primary key default gen_random_uuid(),
  key text not null references ui_strings(key),
  en text not null,
  ar text,
  status text not null,
  orphaned boolean not null default false,
  changed_by uuid references profiles(user_id),   -- null = sync/pipeline change
  change_source text not null default 'panel',    -- panel | sync | restore
  changed_at timestamptz not null default now()
);
create index if not exists idx_usr_key_time on ui_string_revisions (key, changed_at desc);

alter table ui_string_revisions enable row level security;
create policy usr_read on ui_string_revisions for select using (true);
-- no insert/update/delete policies: rows arrive ONLY via the trigger below

create or replace function ui_strings_versioning() returns trigger
language plpgsql security definer as $$
begin
  -- snapshot the OLD row into history
  insert into ui_string_revisions (key, en, ar, status, orphaned, changed_by, change_source)
  values (old.key, old.en, old.ar, old.status, old.orphaned,
          new.updated_by,
          coalesce(current_setting('app.l10n_source', true), 'panel'));
  -- EN drift invalidates review (translation was reviewed against old English)
  if new.en is distinct from old.en and old.status = 'reviewed' then
    new.status := 'draft';
  end if;
  return new;
end $$;

drop trigger if exists trg_ui_strings_versioning on ui_strings;
create trigger trg_ui_strings_versioning before update on ui_strings
  for each row
  when (old.en is distinct from new.en or old.ar is distinct from new.ar
        or old.status is distinct from new.status or old.orphaned is distinct from new.orphaned)
  execute function ui_strings_versioning();
