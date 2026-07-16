-- Cycle 2 Wave 1 · DEF-PRF-003 — Profile Settings did not exist at all ("Build
-- manifest contains no profile/settings route"). This migration adds only the
-- new state Profile Settings needs beyond what already exists (language cookie
-- via /locale, theme via localStorage ThemeToggle): per-user notification
-- channel opt-out. Forward-only, additive.
--
-- inapp is never opt-outable — it IS the in-app bell/inbox, disabling it would
-- silently hide governed events with no other surface. push/sms/email can be
-- turned off; notify.ts checks this before attempting delivery.

create table notification_preferences (
  user_id uuid primary key references profiles(user_id) on delete cascade,
  push_enabled boolean not null default true,
  sms_enabled boolean not null default true,
  email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table notification_preferences enable row level security;
create policy notification_preferences_own on notification_preferences for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
