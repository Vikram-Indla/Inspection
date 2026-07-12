-- ============================================================================
-- Migration 0013 — Localization registry (Lokalise-style, SB19 · Arabic scope)
-- Every UI string is a governed key: English source + Arabic value with a
-- review status. Admin module edits it; the app loads it per-locale.
-- ============================================================================

create table if not exists ui_strings (
  key text primary key,                       -- dot-slug, e.g. 'nav.planning'
  en text not null,                           -- English source of truth
  ar text,                                    -- Arabic value (null = falls back to en)
  status text not null default 'draft'        -- draft = machine/unreviewed · reviewed = human-approved
    check (status in ('draft','reviewed')),
  context text,                               -- where it appears, for translators
  updated_by uuid references profiles(user_id),
  updated_at timestamptz not null default now()
);

alter table ui_strings enable row level security;
-- every authenticated user reads the dictionary; anon too (login/landing render pre-auth)
create policy ui_strings_read on ui_strings for select using (true);
create policy ui_strings_write on ui_strings for insert
  with check (has_any_role(array['compliance_admin','security_admin','workflow_admin']));
create policy ui_strings_update on ui_strings for update
  using (has_any_role(array['compliance_admin','security_admin','workflow_admin']));

create or replace function touch_ui_string() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger trg_ui_strings_touch before update on ui_strings
  for each row execute function touch_ui_string();
